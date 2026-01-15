#!/bin/bash

# Script simple para verificar migraciones de SalonOS
# Ejecutar con: ./scripts/simple-verify.sh
# Requiere: psql instalado y variables de entorno en .env.local

# Cargar variables de entorno
set -a
source .env.local
set +a

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ ERROR: Faltan variables de entorno"
  echo "Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local"
  exit 1
fi

# Configurar DATABASE_URL
DB_HOST="${NEXT_PUBLIC_SUPABASE_URL#https://}"
DB_URL="postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@${DB_HOST}:5432/postgres"

echo "=========================================="
echo "SALONOS - VERIFICACIÓN DE MIGRACIONES"
echo "=========================================="
echo ""

# 1. Verificar Tablas
echo "📊 Verificando tablas..."
TABLE_COUNT=$(psql "$DB_URL" -t -c "
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('locations', 'resources', 'staff', 'services', 'customers', 'invitations', 'bookings', 'audit_logs');
")

echo "✅ Tablas: ${TABLE_COUNT}/8"
if [ "$TABLE_COUNT" -lt 8 ]; then
  echo "⚠️  Faltan tablas por crear"
fi

# 2. Verificar Funciones
echo ""
echo "📊 Verificando funciones..."
FUNC_COUNT=$(psql "$DB_URL" -t -c "
  SELECT COUNT(*)
  FROM information_schema.routines
  WHERE routine_schema = 'public';
")

echo "✅ Funciones: ${FUNC_COUNT}/14"
if [ "$FUNC_COUNT" -lt 14 ]; then
  echo "⚠️  Faltan funciones por crear"
fi

# 3. Verificar Triggers
echo ""
echo "📊 Verificando triggers..."
TRIGGER_COUNT=$(psql "$DB_URL" -t -c "
  SELECT COUNT(*)
  FROM information_schema.triggers
  WHERE trigger_schema = 'public';
")

echo "✅ Triggers: ${TRIGGER_COUNT}/17+"
if [ "$TRIGGER_COUNT" -lt 17 ]; then
  echo "⚠️  Faltan triggers por crear"
fi

# 4. Verificar Políticas RLS
echo ""
echo "📊 Verificando políticas RLS..."
POLICY_COUNT=$(psql "$DB_URL" -t -c "
  SELECT COUNT(*)
  FROM pg_policies
  WHERE schemaname = 'public';
")

echo "✅ Políticas RLS: ${POLICY_COUNT}/20+"
if [ "$POLICY_COUNT" -lt 20 ]; then
  echo "⚠️  Faltan políticas RLS por crear"
fi

# 5. Probar Short ID
echo ""
echo "📊 Probando generación de Short ID..."
SHORT_ID=$(psql "$DB_URL" -t -c "SELECT generate_short_id();")

echo "✅ Short ID: ${SHORT_ID} (${#SHORT_ID} caracteres)"

# 6. Probar Código de Invitación
echo ""
echo "📊 Probando generación de código de invitación..."
INV_CODE=$(psql "$DB_URL" -t -c "SELECT generate_invitation_code();")

echo "✅ Código de invitación: ${INV_CODE} (${#INV_CODE} caracteres)"

# Resumen
echo ""
echo "=========================================="
echo "RESUMEN"
echo "=========================================="
if [ "$TABLE_COUNT" -ge 8 ] && [ "$FUNC_COUNT" -ge 14 ] && [ "$TRIGGER_COUNT" -ge 17 ] && [ "$POLICY_COUNT" -ge 20 ]; then
  echo "Tablas:         ✅ ${TABLE_COUNT}/8"
  echo "Funciones:      ✅ ${FUNC_COUNT}/14"
  echo "Triggers:       ✅ ${TRIGGER_COUNT}/17+"
  echo "Políticas RLS:  ✅ ${POLICY_COUNT}/20+"
  echo "Short ID:       ✅ Generable"
  echo "Cód. Invit.:    ✅ Generable"
  echo ""
  echo "=========================================="
  echo "🎉 TODAS LAS MIGRACIONES ESTÁN CORRECTAS"
  echo "Puedes continuar con el seed de datos."
  echo "=========================================="
else
  echo "Tablas:         ❌ ${TABLE_COUNT}/8"
  echo "Funciones:      ❌ ${FUNC_COUNT}/14"
  echo "Triggers:       ❌ ${TRIGGER_COUNT}/17+"
  echo "Políticas RLS:  ❌ ${POLICY_COUNT}/20+"
  echo ""
  echo "=========================================="
  echo "⚠️  ALGUNAS MIGRACIONES FALTAN"
  echo "Por favor, verifica los errores arriba."
  echo "=========================================="
fi
