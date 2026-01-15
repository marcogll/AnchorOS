#!/bin/bash

# Script para verificar conexión a Supabase y desbloquear puertos
# Ejecutar con: ./scripts/check-connection.sh

echo "=========================================="
echo "SALONOS - VERIFICACIÓN DE CONEXIÓN"
echo "=========================================="
echo ""

# Cargar variables de entorno
set -a
source .env.local
set +a

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ ERROR: Faltan variables de entorno"
  echo "Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local"
  exit 1
fi

# Extraer host de la URL
DB_HOST="${NEXT_PUBLIC_SUPABASE_URL#https://}"

echo "📊 Información de conexión:"
echo "   Host: $DB_HOST"
echo "   Puerto: 5432"
echo ""

# 1. Verificar si psql está instalado
echo "1️⃣  Verificando si psql está instalado..."
if command -v psql &> /dev/null; then
  PSQL_VERSION=$(psql --version)
  echo "   ✅ psql instalado: $PSQL_VERSION"
else
  echo "   ❌ psql NO está instalado"
  echo ""
  echo "   Para instalar psql:"
  echo "   - macOS: brew install postgresql"
  echo "   - Ubuntu/Debian: sudo apt-get install postgresql-client"
  echo "   - Windows: Descargar desde https://www.postgresql.org/download/windows/"
  exit 1
fi

echo ""

# 2. Verificar conectividad con ping
echo "2️⃣  Verificando conectividad con ping..."
if ping -c 2 -4 $DB_HOST &> /dev/null; then
  echo "   ✅ Host alcanzable"
else
  echo "   ❌ Host NO alcanzable"
  echo "   Verifica tu conexión a internet"
  exit 1
fi

echo ""

# 3. Verificar si el puerto 5432 está abierto
echo "3️⃣  Verificando si el puerto 5432 está abierto..."
if command -v nc &> /dev/null; then
  if nc -z -w5 $DB_HOST 5432 2>/dev/null; then
    echo "   ✅ Puerto 5432 está abierto"
  else
    echo "   ❌ Puerto 5432 está bloqueado"
    echo ""
    echo "   📋 SOLUCIÓN:"
    echo "   El puerto 5432 está bloqueado, posiblemente por:"
    echo "   1. Firewall de tu empresa/ISP"
    echo "   2. VPN corporativa"
    echo "   3. Configuración de red local"
    echo ""
    echo "   Opciones:"
    echo "   a. Usar Supabase Dashboard (recomendado)"
    echo "   b. Configurar VPN para permitir el puerto 5432"
    echo "   c. Usar túnel SSH para bypass del firewall"
    echo "   d. Contactar a tu administrador de red"
    exit 1
  fi
else
  echo "   ⚠️  nc no está disponible, no se puede verificar el puerto"
  echo "   Continuando con la prueba de conexión..."
fi

echo ""

# 4. Configurar DATABASE_URL
DB_URL="postgresql://postgres:${SUPABASE_SERVICE_ROLE_KEY}@${DB_HOST}:5432/postgres"

# 5. Probar conexión a la base de datos
echo "4️⃣  Probar conexión a la base de datos..."
if psql "$DB_URL" -c "SELECT 'Connection successful' as status;" &> /dev/null; then
  echo "   ✅ Conexión a base de datos exitosa"
else
  echo "   ❌ Conexión a base de datos fallida"
  echo ""
  echo "   📋 SOLUCIÓN:"
  echo "   1. Verifica que las credenciales sean correctas"
  echo "   2. Verifica que el proyecto de Supabase esté activo"
  echo "   3. Verifica que el service_role_key sea correcto"
  echo "   4. Si el puerto está bloqueado, usa Supabase Dashboard"
  exit 1
fi

echo ""

# 6. Verificar tablas
echo "5️⃣  Verificando tablas..."
TABLE_COUNT=$(psql "$DB_URL" -t -c "
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('locations', 'resources', 'staff', 'services', 'customers', 'invitations', 'bookings', 'audit_logs');
")

echo "   ✅ Tablas encontradas: $TABLE_COUNT/8"

# 7. Verificar funciones
echo "6️⃣  Verificando funciones..."
FUNC_COUNT=$(psql "$DB_URL" -t -c "
  SELECT COUNT(*)
  FROM information_schema.routines
  WHERE routine_schema = 'public';
")

echo "   ✅ Funciones encontradas: $FUNC_COUNT"

echo ""

# 8. Resumen
echo "=========================================="
echo "RESUMEN"
echo "=========================================="
echo "Host:                  $DB_HOST"
echo "Puerto:                5432"
echo "psql:                  ✅ Instalado"
echo "Conexión:             ✅ Exitosa"
echo "Tablas:                $TABLE_COUNT/8"
echo "Funciones:             $FUNC_COUNT"
echo "=========================================="

if [ "$TABLE_COUNT" -eq 8 ] && [ "$FUNC_COUNT" -ge 14 ]; then
  echo ""
  echo "🎉 CONEXIÓN VERIFICADA EXITOSAMENTE"
  echo ""
  echo "Próximos pasos:"
  echo "1. Ejecutar: ./scripts/simple-verify.sh"
  echo "2. Ejecutar: ./scripts/simple-seed.sh"
  echo "3. Ejecutar: node scripts/create-auth-users.js"
  echo ""
  echo "O usar Supabase Dashboard:"
  echo "https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl/sql"
else
  echo ""
  echo "⚠️  ALGUNOS ELEMENTOS FALTAN"
  echo "Por favor, ejecuta las migraciones nuevamente"
fi
