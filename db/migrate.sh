#!/bin/bash

# ============================================
# SALONOS - DATABASE MIGRATION SCRIPT
# ============================================
# Ejecuta todas las migraciones de base de datos
# ============================================

set -e  # Detener en errores

echo "=========================================="
echo "SALONOS - DATABASE MIGRATION"
echo "=========================================="
echo ""

# Verificar que .env.local existe
if [ ! -f .env.local ]; then
    echo "❌ ERROR: .env.local no encontrado"
    echo "Por favor, crea el archivo .env.local con tus credenciales de Supabase"
    echo "Puedes copiar el archivo .env.example:"
    echo "  cp .env.local.example .env.local"
    exit 1
fi

# Cargar variables de entorno desde .env.local
echo "📂 Cargando variables de entorno desde .env.local..."
export $(grep -v '^#' .env.local | xargs)

# Verificar que las variables de Supabase estén configuradas
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ ERROR: Faltan variables de entorno de Supabase"
    echo "Verifica que tu archivo .env.local contenga:"
    echo "  NEXT_PUBLIC_SUPABASE_URL"
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "  SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo "✅ Variables de entorno cargadas"
echo ""

# Extraer DATABASE_URL de NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
# Formato esperado: postgresql://postgres:[password]@[project-id].supabase.co:5432/postgres

echo "🔍 Verificando conexión a Supabase..."
echo "   URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
echo ""

# Verificar si psql está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ ERROR: psql no está instalado"
    echo "Por favor, instala PostgreSQL client:"
    echo "  macOS: brew install postgresql"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  Windows: Descargar desde https://www.postgresql.org/download/windows/"
    exit 1
fi

echo "✅ psql encontrado"
echo ""

# Ejecutar migraciones
echo "🚀 Iniciando migraciones..."
echo ""

echo "📦 MIGRACIÓN 001: Esquema inicial..."
if psql "${NEXT_PUBLIC_SUPABASE_URL/https:\/\//postgresql:\/\/postgres:}${SUPABASE_SERVICE_ROLE_KEY}@${NEXT_PUBLIC_SUPABASE_URL#https://}" -f db/migrations/001_initial_schema.sql; then
    echo "✅ MIGRACIÓN 001 completada"
else
    echo "❌ ERROR en MIGRACIÓN 001"
    exit 1
fi

echo ""
echo "📦 MIGRACIÓN 002: Políticas RLS..."
if psql "${NEXT_PUBLIC_SUPABASE_URL/https:\/\//postgresql:\/\/postgres:}${SUPABASE_SERVICE_ROLE_KEY}@${NEXT_PUBLIC_SUPABASE_URL#https://}" -f db/migrations/002_rls_policies.sql; then
    echo "✅ MIGRACIÓN 002 completada"
else
    echo "❌ ERROR en MIGRACIÓN 002"
    exit 1
fi

echo ""
echo "📦 MIGRACIÓN 003: Triggers de auditoría..."
if psql "${NEXT_PUBLIC_SUPABASE_URL/https:\/\//postgresql:\/\/postgres:}${SUPABASE_SERVICE_ROLE_KEY}@${NEXT_PUBLIC_SUPABASE_URL#https://}" -f db/migrations/003_audit_triggers.sql; then
    echo "✅ MIGRACIÓN 003 completada"
else
    echo "❌ ERROR en MIGRACIÓN 003"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ TODAS LAS MIGRACIONES COMPLETADAS"
echo "=========================================="
echo ""
echo "📊 Verificación del esquema:"
echo ""

# Verificación básica
psql "${NEXT_PUBLIC_SUPABASE_URL/https:\/\//postgresql:\/\/postgres:}${SUPABASE_SERVICE_ROLE_KEY}@${NEXT_PUBLIC_SUPABASE_URL#https://}" -c "SELECT 'Tablas creadas: ' || COUNT(*) as info FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('locations', 'resources', 'staff', 'services', 'customers', 'invitations', 'bookings', 'audit_logs');"

psql "${NEXT_PUBLIC_SUPABASE_URL/https:\/\//postgresql:\/\/postgres:}${SUPABASE_SERVICE_ROLE_KEY}@${NEXT_PUBLIC_SUPABASE_URL#https://}" -c "SELECT 'Funciones creadas: ' || COUNT(*) as info FROM information_schema.routines WHERE routine_schema = 'public';"

psql "${NEXT_PUBLIC_SUPABASE_URL/https:\/\//postgresql:\/\/postgres:}${SUPABASE_SERVICE_ROLE_KEY}@${NEXT_PUBLIC_SUPABASE_URL#https://}" -c "SELECT 'Políticas RLS: ' || COUNT(*) as info FROM pg_policies WHERE schemaname = 'public';"

echo ""
echo "🎉 Setup de base de datos completado exitosamente"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Configurar Auth en Supabase Dashboard"
echo "   2. Crear usuarios de prueba con roles específicos"
echo "   3. Ejecutar seeds de datos de prueba"
echo ""
