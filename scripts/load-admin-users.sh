#!/bin/bash

# Script para cargar usuarios admin en Supabase
# Uso: ./load-admin-users.sh

echo "Cargando usuarios admin en Supabase..."
echo ""

# Verificar que las variables de entorno están definidas
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "ERROR: Variables de entorno no definidas."
    echo "Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY definidas."
    echo ""
    echo "Ejemplo de uso:"
    echo "  export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    echo "  export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo "  ./load-admin-users.sh"
    exit 1
fi

# Ejecutar el script SQL
echo "Ejecutando scripts/seed-admin-users.sql..."
echo ""

psql "$SUPABASE_URL?options=project%3Ddefault" <<EOF
$(cat scripts/seed-admin-users.sql)
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Usuarios admin cargados exitosamente:"
    echo "  - frida.lara@example.com (Frida Lara) - Admin"
    echo "  - america.cruz@example.com (América de la Cruz) - Admin"
    echo "  - alejandra.ponce@example.com (Alejandra Ponce) - Admin"
    echo ""
    echo "Contraseña predeterminada: admin123"
    echo "IMPORTANTE: Cambiar contraseñas en primer inicio de sesión."
else
    echo ""
    echo "✗ Error al cargar usuarios admin"
    exit 1
fi
