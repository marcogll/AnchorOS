#!/usr/bin/env bash

# ============================================
# Ralphy - Autonomous AI Coding Loop
# Supports Claude Code, OpenCode, Codex, Cursor, Qwen-Code and Factory Droid
# Runs until PRD is complete
# ============================================

set -euo pipefail

# ============================================
# CONFIGURATION & DEFAULTS
# ============================================

VERSION="4.0.0"

# Ralphy config directory
RALPHY_DIR=".ralphy"
PROGRESS_FILE="$RALPHY_DIR/progress.txt"
CONFIG_FILE="$RALPHY_DIR/config.yaml"
SINGLE_TASK=""
INIT_MODE=false
SHOW_CONFIG=false
ADD_RULE=""
AUTO_COMMIT=true

# Runtime options
SKIP_TESTS=false
SKIP_LINT=false
AI_ENGINE="claude"  # claude, opencode, cursor, codex, qwen, or droid
DRY_RUN=false
MAX_ITERATIONS=0  # 0 = unlimited
MAX_RETRIES=3
RETRY_DELAY=5
VERBOSE=false

# Git branch options
BRANCH_PER_TASK=false
CREATE_PR=false
BASE_BRANCH=""
PR_DRAFT=false

# Parallel execution
PARALLEL=false
MAX_PARALLEL=3

# PRD source options
PRD_SOURCE="markdown"  # markdown, yaml, github
PRD_FILE="PRD.md"
GITHUB_REPO=""
GITHUB_LABEL=""

# Colors (detect if terminal supports colors)
if [[ -t 1 ]] && command -v tput &>/dev/null && [[ $(tput colors 2>/dev/null || echo 0) -ge 8 ]]; then
  RED=$(tput setaf 1)
  GREEN=$(tput setaf 2)
  YELLOW=$(tput setaf 3)
  BLUE=$(tput setaf 4)
  MAGENTA=$(tput setaf 5)
  CYAN=$(tput setaf 6)
  BOLD=$(tput bold)
  DIM=$(tput dim)
  RESET=$(tput sgr0)
else
  RED="" GREEN="" YELLOW="" BLUE="" MAGENTA="" CYAN="" BOLD="" DIM="" RESET=""
fi

# Global state
ai_pid=""
monitor_pid=""
tmpfile=""
CODEX_LAST_MESSAGE_FILE=""
current_step="Thinking"
total_input_tokens=0
total_output_tokens=0
total_actual_cost="0"  # OpenCode provides actual cost
total_duration_ms=0    # Cursor provides duration
iteration=0
retry_count=0
declare -a parallel_pids=()
declare -a task_branches=()
declare -a integration_branches=()  # Track integration branches for cleanup on interrupt
WORKTREE_BASE=""  # Base directory for parallel agent worktrees
ORIGINAL_DIR=""   # Original working directory (for worktree operations)
ORIGINAL_BASE_BRANCH=""  # Original base branch before integration branches

# ============================================
# UTILITY FUNCTIONS
# ============================================

log_info() {
  echo "${BLUE}[INFO]${RESET} $*"
}

log_success() {
  echo "${GREEN}[OK]${RESET} $*"
}

log_warn() {
  echo "${YELLOW}[WARN]${RESET} $*"
}

log_error() {
  echo "${RED}[ERROR]${RESET} $*" >&2
}

log_debug() {
  if [[ "$VERBOSE" == true ]]; then
    echo "${DIM}[DEBUG] $*${RESET}"
  fi
}

# Slugify text for branch names
slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-|-$//g' | cut -c1-50
}

# ============================================
# BROWNFIELD MODE (.ralphy/ configuration)
# ============================================

# Initialize .ralphy/ directory with config files
init_ralphy_config() {
  if [[ -d "$RALPHY_DIR" ]]; then
    log_warn "$RALPHY_DIR already exists"
    REPLY='N'  # Default if read times out or fails
    read -p "Overwrite config? [y/N] " -n 1 -r -t 30 2>/dev/null || true
    echo
    [[ ! $REPLY =~ ^[Yy]$ ]] && exit 0
  fi

  mkdir -p "$RALPHY_DIR"

  # Smart detection
  local project_name=""
  local lang=""
  local framework=""
  local test_cmd=""
  local lint_cmd=""
  local build_cmd=""

  # Get project name from directory or package.json
  project_name=$(basename "$PWD")

  if [[ -f "package.json" ]]; then
    # Get name from package.json if available
    local pkg_name
    pkg_name=$(jq -r '.name // ""' package.json 2>/dev/null)
    [[ -n "$pkg_name" ]] && project_name="$pkg_name"

    # Detect language
    if [[ -f "tsconfig.json" ]]; then
      lang="TypeScript"
    else
      lang="JavaScript"
    fi

    # Detect frameworks from dependencies (collect all matches)
    local deps frameworks=()
    deps=$(jq -r '(.dependencies // {}) + (.devDependencies // {}) | keys[]' package.json 2>/dev/null || true)

    # Use grep for reliable exact matching
    echo "$deps" | grep -qx "next" && frameworks+=("Next.js")
    echo "$deps" | grep -qx "nuxt" && frameworks+=("Nuxt")
    echo "$deps" | grep -qx "@remix-run/react" && frameworks+=("Remix")
    echo "$deps" | grep -qx "svelte" && frameworks+=("Svelte")
    echo "$deps" | grep -qE "@nestjs/" && frameworks+=("NestJS")
    echo "$deps" | grep -qx "hono" && frameworks+=("Hono")
    echo "$deps" | grep -qx "fastify" && frameworks+=("Fastify")
    echo "$deps" | grep -qx "express" && frameworks+=("Express")
    # Only add React/Vue if no meta-framework detected
    if [[ ${#frameworks[@]} -eq 0 ]]; then
      echo "$deps" | grep -qx "react" && frameworks+=("React")
      echo "$deps" | grep -qx "vue" && frameworks+=("Vue")
    fi

    # Join frameworks with comma
    framework=$(IFS=', '; echo "${frameworks[*]}")

    # Detect commands from package.json scripts
    local scripts
    scripts=$(jq -r '.scripts // {}' package.json 2>/dev/null)

    # Test command (prefer bun if lockfile exists)
    if echo "$scripts" | jq -e '.test' >/dev/null 2>&1; then
      test_cmd="npm test"
      [[ -f "bun.lockb" ]] && test_cmd="bun test"
    fi

    # Lint command
    if echo "$scripts" | jq -e '.lint' >/dev/null 2>&1; then
      lint_cmd="npm run lint"
    fi

    # Build command
    if echo "$scripts" | jq -e '.build' >/dev/null 2>&1; then
      build_cmd="npm run build"
    fi

  elif [[ -f "pyproject.toml" ]] || [[ -f "requirements.txt" ]] || [[ -f "setup.py" ]]; then
    lang="Python"
    local py_frameworks=()
    local py_deps=""
    [[ -f "pyproject.toml" ]] && py_deps=$(cat pyproject.toml 2>/dev/null)
    [[ -f "requirements.txt" ]] && py_deps+=$(cat requirements.txt 2>/dev/null)
    echo "$py_deps" | grep -qi "fastapi" && py_frameworks+=("FastAPI")
    echo "$py_deps" | grep -qi "django" && py_frameworks+=("Django")
    echo "$py_deps" | grep -qi "flask" && py_frameworks+=("Flask")
    framework=$(IFS=', '; echo "${py_frameworks[*]}")
    test_cmd="pytest"
    lint_cmd="ruff check ."

  elif [[ -f "go.mod" ]]; then
    lang="Go"
    test_cmd="go test ./..."
    lint_cmd="golangci-lint run"

  elif [[ -f "Cargo.toml" ]]; then
    lang="Rust"
    test_cmd="cargo test"
    lint_cmd="cargo clippy"
    build_cmd="cargo build"
  fi

  # Show what we detected
  echo ""
  echo "${BOLD}Detected:${RESET}"
  echo "  Project:   ${CYAN}$project_name${RESET}"
  [[ -n "$lang" ]] && echo "  Language:  ${CYAN}$lang${RESET}"
  [[ -n "$framework" ]] && echo "  Framework: ${CYAN}$framework${RESET}"
  [[ -n "$test_cmd" ]] && echo "  Test:      ${CYAN}$test_cmd${RESET}"
  [[ -n "$lint_cmd" ]] && echo "  Lint:      ${CYAN}$lint_cmd${RESET}"
  [[ -n "$build_cmd" ]] && echo "  Build:     ${CYAN}$build_cmd${RESET}"
  echo ""

  # Escape values for safe YAML (double quotes inside strings)
  yaml_escape() { printf '%s' "$1" | sed 's/"/\\"/g'; }

  # Create config.yaml with detected values
  cat > "$CONFIG_FILE" << EOF
# Ralphy Configuration
# https://github.com/michaelshimeles/ralphy

# Project info (auto-detected, edit if needed)
project:
  name: "$(yaml_escape "$project_name")"
  language: "$(yaml_escape "${lang:-Unknown}")"
  framework: "$(yaml_escape "${framework:-}")"
  description: ""  # Add a brief description

# Commands (auto-detected from package.json/pyproject.toml)
commands:
  test: "$(yaml_escape "${test_cmd:-}")"
  lint: "$(yaml_escape "${lint_cmd:-}")"
  build: "$(yaml_escape "${build_cmd:-}")"

# Rules - instructions the AI MUST follow
# These are injected into every prompt
rules: []
  # Examples:
  # - "Always use TypeScript strict mode"
  # - "Follow the error handling pattern in src/utils/errors.ts"
  # - "All API endpoints must have input validation with Zod"
  # - "Use server actions instead of API routes in Next.js"

# Boundaries - files/folders the AI should not modify
boundaries:
  never_touch: []
    # Examples:
    # - "src/legacy/**"
    # - "migrations/**"
    # - "*.lock"
EOF

  # Create progress.txt
  echo "# Ralphy Progress Log" > "$PROGRESS_FILE"
  echo "" >> "$PROGRESS_FILE"

  log_success "Created $RALPHY_DIR/"
  echo ""
  echo "  ${CYAN}$CONFIG_FILE${RESET}   - Your rules and preferences"
  echo "  ${CYAN}$PROGRESS_FILE${RESET} - Progress log (auto-updated)"
  echo ""
  echo "${BOLD}Next steps:${RESET}"
  echo "  1. Add rules:  ${CYAN}ralphy --add-rule \"your rule here\"${RESET}"
  echo "  2. Or edit:    ${CYAN}$CONFIG_FILE${RESET}"
  echo "  3. Run:        ${CYAN}ralphy \"your task\"${RESET} or ${CYAN}ralphy${RESET} (with PRD.md)"
}

# Load rules from config.yaml
load_ralphy_rules() {
  [[ ! -f "$CONFIG_FILE" ]] && return

  if command -v yq &>/dev/null; then
    yq -r '.rules // [] | .[]' "$CONFIG_FILE" 2>/dev/null || true
  fi
}

# Load boundaries from config.yaml
load_ralphy_boundaries() {
  local boundary_type="$1"  # never_touch or always_test
  [[ ! -f "$CONFIG_FILE" ]] && return

  if command -v yq &>/dev/null; then
    yq -r ".boundaries.$boundary_type // [] | .[]" "$CONFIG_FILE" 2>/dev/null || true
  fi
}

# Show current config
show_ralphy_config() {
  if [[ ! -f "$CONFIG_FILE" ]]; then
    log_warn "No config found. Run 'ralphy --init' first."
    exit 1
  fi

  echo ""
  echo "${BOLD}Ralphy Configuration${RESET} ($CONFIG_FILE)"
  echo ""

  if command -v yq &>/dev/null; then
    # Project info
    local name lang framework desc
    name=$(yq -r '.project.name // "Unknown"' "$CONFIG_FILE" 2>/dev/null)
    lang=$(yq -r '.project.language // "Unknown"' "$CONFIG_FILE" 2>/dev/null)
    framework=$(yq -r '.project.framework // ""' "$CONFIG_FILE" 2>/dev/null)
    desc=$(yq -r '.project.description // ""' "$CONFIG_FILE" 2>/dev/null)

    echo "${BOLD}Project:${RESET}"
    echo "  Name:      $name"
    echo "  Language:  $lang"
    [[ -n "$framework" ]] && echo "  Framework: $framework"
    [[ -n "$desc" ]] && echo "  About:     $desc"
    echo ""

    # Commands
    local test_cmd lint_cmd build_cmd
    test_cmd=$(yq -r '.commands.test // ""' "$CONFIG_FILE" 2>/dev/null)
    lint_cmd=$(yq -r '.commands.lint // ""' "$CONFIG_FILE" 2>/dev/null)
    build_cmd=$(yq -r '.commands.build // ""' "$CONFIG_FILE" 2>/dev/null)

    echo "${BOLD}Commands:${RESET}"
    [[ -n "$test_cmd" ]] && echo "  Test:  $test_cmd" || echo "  Test:  ${DIM}(not set)${RESET}"
    [[ -n "$lint_cmd" ]] && echo "  Lint:  $lint_cmd" || echo "  Lint:  ${DIM}(not set)${RESET}"
    [[ -n "$build_cmd" ]] && echo "  Build: $build_cmd" || echo "  Build: ${DIM}(not set)${RESET}"
    echo ""

    # Rules
    echo "${BOLD}Rules:${RESET}"
    local rules
    rules=$(yq -r '.rules // [] | .[]' "$CONFIG_FILE" 2>/dev/null)
    if [[ -n "$rules" ]]; then
      echo "$rules" | while read -r rule; do
        echo "  • $rule"
      done
    else
      echo "  ${DIM}(none - add with: ralphy --add-rule \"...\")${RESET}"
    fi
    echo ""

    # Boundaries
    local never_touch
    never_touch=$(yq -r '.boundaries.never_touch // [] | .[]' "$CONFIG_FILE" 2>/dev/null)
    if [[ -n "$never_touch" ]]; then
      echo "${BOLD}Never Touch:${RESET}"
      echo "$never_touch" | while read -r path; do
        echo "  • $path"
      done
      echo ""
    fi
  else
    # Fallback: just show the file
    cat "$CONFIG_FILE"
  fi
}

# Add a rule to config.yaml
add_ralphy_rule() {
  local rule="$1"

  if [[ ! -f "$CONFIG_FILE" ]]; then
    log_error "No config found. Run 'ralphy --init' first."
    exit 1
  fi

  if ! command -v yq &>/dev/null; then
    log_error "yq is required to add rules. Install from https://github.com/mikefarah/yq"
    log_info "Or manually edit $CONFIG_FILE"
    exit 1
  fi

  # Add rule to the rules array (use env var to avoid YAML injection)
  RULE="$rule" yq -i '.rules += [env(RULE)]' "$CONFIG_FILE"
  log_success "Added rule: $rule"
}

# Load test command from config
load_test_command() {
  [[ ! -f "$CONFIG_FILE" ]] && echo "" && return

  if command -v yq &>/dev/null; then
    yq -r '.commands.test // ""' "$CONFIG_FILE" 2>/dev/null || echo ""
  else
    echo ""
  fi
}

# Load project context from config.yaml
load_project_context() {
  [[ ! -f "$CONFIG_FILE" ]] && return

  if command -v yq &>/dev/null; then
    local name lang framework desc
    name=$(yq -r '.project.name // ""' "$CONFIG_FILE" 2>/dev/null)
    lang=$(yq -r '.project.language // ""' "$CONFIG_FILE" 2>/dev/null)
    framework=$(yq -r '.project.framework // ""' "$CONFIG_FILE" 2>/dev/null)
    desc=$(yq -r '.project.description // ""' "$CONFIG_FILE" 2>/dev/null)

    local context=""
    [[ -n "$name" ]] && context+="Project: $name\n"
    [[ -n "$lang" ]] && context+="Language: $lang\n"
    [[ -n "$framework" ]] && context+="Framework: $framework\n"
    [[ -n "$desc" ]] && context+="Description: $desc\n"
    echo -e "$context"
  fi
}

# Log task to progress file
log_task_history() {
  local task="$1"
  local status="$2"  # completed, failed

  [[ ! -f "$PROGRESS_FILE" ]] && return

  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M')
  local icon="✓"
  [[ "$status" == "failed" ]] && icon="✗"

  echo "- [$icon] $timestamp - $task" >> "$PROGRESS_FILE"
}

# Build prompt with brownfield context
build_brownfield_prompt() {
  local task="$1"
  local prompt=""

  # Add project context if available
  local context
  context=$(load_project_context)
  if [[ -n "$context" ]]; then
    prompt+="## Project Context
$context

"
  fi

  # Add rules if available
  local rules
  rules=$(load_ralphy_rules)
  if [[ -n "$rules" ]]; then
    prompt+="## Rules (you MUST follow these)
$rules

"
  fi

  # Add boundaries
  local never_touch
  never_touch=$(load_ralphy_boundaries "never_touch")
  if [[ -n "$never_touch" ]]; then
    prompt+="## Boundaries
Do NOT modify these files/directories:
$never_touch

"
  fi

  # Add the task
  prompt+="## Task
$task

## Instructions
1. Implement the task described above
2. Write tests if appropriate
3. Ensure the code works correctly"

  # Add commit instruction only if auto-commit is enabled
  if [[ "$AUTO_COMMIT" == "true" ]]; then
    prompt+="
4. Commit your changes with a descriptive message"
  fi

  prompt+="

Keep changes focused and minimal. Do not refactor unrelated code."

  echo "$prompt"
}

# Run a single brownfield task
run_brownfield_task() {
  local task="$1"

  echo ""
  echo "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo "${BOLD}Task:${RESET} $task"
  echo "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""

  local prompt
  prompt=$(build_brownfield_prompt "$task")

  # Create temp file for output
  local output_file
  output_file=$(mktemp)

  log_info "Running with $AI_ENGINE..."

  # Run the AI engine (tee to show output while saving for parsing)
  case "$AI_ENGINE" in
    claude)
      claude --dangerously-skip-permissions \
        -p "$prompt" 2>&1 | tee "$output_file"
      ;;
    opencode)
      opencode --output-format stream-json \
        --approval-mode full-auto \
        "$prompt" 2>&1 | tee "$output_file"
      ;;
    cursor)
      agent --dangerously-skip-permissions \
        -p "$prompt" 2>&1 | tee "$output_file"
      ;;
    qwen)
      qwen --output-format stream-json \
        --approval-mode yolo \
        -p "$prompt" 2>&1 | tee "$output_file"
      ;;
    droid)
      droid exec --output-format stream-json \
        --auto medium \
        "$prompt" 2>&1 | tee "$output_file"
      ;;
    codex)
      codex exec --full-auto \
        --json \
        "$prompt" 2>&1 | tee "$output_file"
      ;;
  esac

  local exit_code=$?

  # Log to history
  if [[ $exit_code -eq 0 ]]; then
    log_task_history "$task" "completed"
    log_success "Task completed"
  else
    log_task_history "$task" "failed"
    log_error "Task failed"
  fi

  rm -f "$output_file"
  return $exit_code
}

# ============================================
# HELP & VERSION
# ============================================

show_help() {
  cat << EOF
${BOLD}Ralphy${RESET} - Autonomous AI Coding Loop (v${VERSION})

${BOLD}USAGE:${RESET}
  ./ralphy.sh [options]              # PRD mode (requires PRD.md)
  ./ralphy.sh "task description"     # Single task mode (brownfield)
  ./ralphy.sh --init                 # Initialize .ralphy/ config

${BOLD}CONFIG & SETUP:${RESET}
  --init              Initialize .ralphy/ with smart defaults
  --config            Show current configuration
  --add-rule "..."    Add a rule to config (e.g., "Always use Zod")

${BOLD}SINGLE TASK MODE:${RESET}
  "task description"  Run a single task without PRD (quotes required)
  --no-commit         Don't auto-commit after task completion

${BOLD}AI ENGINE OPTIONS:${RESET}
  --claude            Use Claude Code (default)
  --opencode          Use OpenCode
  --cursor            Use Cursor agent
  --codex             Use Codex CLI
  --qwen              Use Qwen-Code
  --droid             Use Factory Droid

${BOLD}WORKFLOW OPTIONS:${RESET}
  --no-tests          Skip writing and running tests
  --no-lint           Skip linting
  --fast              Skip both tests and linting

${BOLD}EXECUTION OPTIONS:${RESET}
  --max-iterations N  Stop after N iterations (0 = unlimited)
  --max-retries N     Max retries per task on failure (default: 3)
  --retry-delay N     Seconds between retries (default: 5)
  --dry-run           Show what would be done without executing

${BOLD}PARALLEL EXECUTION:${RESET}
  --parallel          Run independent tasks in parallel
  --max-parallel N    Max concurrent tasks (default: 3)

${BOLD}GIT BRANCH OPTIONS:${RESET}
  --branch-per-task   Create a new git branch for each task
  --base-branch NAME  Base branch to create task branches from (default: current)
  --create-pr         Create a pull request after each task (requires gh CLI)
  --draft-pr          Create PRs as drafts

${BOLD}PRD SOURCE OPTIONS:${RESET}
  --prd FILE          PRD file path (default: PRD.md)
  --yaml FILE         Use YAML task file instead of markdown
  --github REPO       Fetch tasks from GitHub issues (e.g., owner/repo)
  --github-label TAG  Filter GitHub issues by label

${BOLD}OTHER OPTIONS:${RESET}
  -v, --verbose       Show debug output
  -h, --help          Show this help
  --version           Show version number

${BOLD}EXAMPLES:${RESET}
  # Brownfield mode (single tasks in existing projects)
  ./ralphy.sh --init                       # Initialize config
  ./ralphy.sh "add dark mode toggle"       # Run single task
  ./ralphy.sh "fix the login bug" --cursor # Single task with Cursor

  # PRD mode (task lists)
  ./ralphy.sh                              # Run with Claude Code
  ./ralphy.sh --codex                      # Run with Codex CLI
  ./ralphy.sh --branch-per-task --create-pr  # Feature branch workflow
  ./ralphy.sh --parallel --max-parallel 4  # Run 4 tasks concurrently
  ./ralphy.sh --yaml tasks.yaml            # Use YAML task file
  ./ralphy.sh --github owner/repo          # Fetch from GitHub issues

${BOLD}PRD FORMATS:${RESET}
  Markdown (PRD.md):
    - [ ] Task description

  YAML (tasks.yaml):
    tasks:
      - title: Task description
        completed: false
        parallel_group: 1  # Optional: tasks with same group run in parallel

  GitHub Issues:
    Uses open issues from the specified repository

EOF
}

show_version() {
  echo "Ralphy v${VERSION}"
}

# ============================================
# ARGUMENT PARSING
# ============================================

parse_args() {
  while [[ $# -gt 0 ]]; do
    case $1 in
      --no-tests|--skip-tests)
        SKIP_TESTS=true
        shift
        ;;
      --no-lint|--skip-lint)
        SKIP_LINT=true
        shift
        ;;
      --fast)
        SKIP_TESTS=true
        SKIP_LINT=true
        shift
        ;;
      --opencode)
        AI_ENGINE="opencode"
        shift
        ;;
      --claude)
        AI_ENGINE="claude"
        shift
        ;;
      --cursor|--agent)
        AI_ENGINE="cursor"
        shift
        ;;
      --codex)
        AI_ENGINE="codex"
        shift
        ;;
      --qwen)
