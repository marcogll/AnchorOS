# Dockerfile optimizado para Next.js production
FROM node:20-alpine AS base

# Instalar dependencias para build
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables de entorno para build - Coolify inyectará las reales en runtime
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=16384"
ENV NEXT_ESLINT_IGNORE_DURING_BUILDS=true
ENV NEXT_PRIVATE_WORKERS=1
ENV NEXT_PRIVATE_SKIP_BUILD_WORKER=true
ENV NODE_EXTRA_CA_CERTS=""
ENV CI=true

# Build optimizado con incremento de memoria y deshabilitando checks
RUN set -e && \
    NODE_OPTIONS="--max-old-space-size=16384" SKIP_ESLINT=true SKIP_TYPE_CHECK=true npm run build && \
    npm cache clean --force && \
    rm -rf /tmp/* || \
    (echo "Build failed, attempting fallback build..." && \
     NODE_OPTIONS="--max-old-space-size=16384" npx next build --no-lint && \
     npm cache clean --force && \
     rm -rf /tmp/*)

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios para producción (standalone)
# Next.js standalone ya incluye todo lo necesario
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
