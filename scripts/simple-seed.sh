#!/bin/bash

# Script simple para seed de datos de SalonOS
# Ejecutar con: ./scripts/simple-seed.sh
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
echo "SALONOS - SEED DE DATOS"
echo "=========================================="
echo ""

# 1. Crear Locations
echo "📍 Creando locations..."
psql "$DB_URL" -c "
  INSERT INTO locations (name, timezone, address, phone, is_active)
  VALUES
    ('Salón Principal - Centro', 'America/Mexico_City', 'Av. Reforma 222, Centro Histórico, Ciudad de México', '+52 55 1234 5678', true),
    ('Salón Norte - Polanco', 'America/Mexico_City', 'Av. Masaryk 123, Polanco, Ciudad de México', '+52 55 2345 6789', true),
    ('Salón Sur - Coyoacán', 'America/Mexico_City', 'Calle Hidalgo 456, Coyoacán, Ciudad de México', '+52 55 3456 7890', true)
  ON CONFLICT DO NOTHING;
" 2>&1 | grep -v "NOTICE"

LOCATIONS_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM locations;")
echo "✅ Locations: $LOCATIONS_COUNT/3"

# 2. Crear Resources
echo ""
echo "🪑 Creando resources..."
psql "$DB_URL" -c "
  INSERT INTO resources (location_id, name, type, capacity, is_active)
  SELECT
    (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1),
    'Estación ' || generate_series(1, 3)::TEXT,
    'station',
    1,
    true
  UNION ALL
  SELECT
    (SELECT id FROM locations WHERE name = 'Salón Norte - Polanco' LIMIT 1),
    'Estación ' || generate_series(1, 2)::TEXT,
    'station',
    1,
    true
  UNION ALL
  SELECT
    (SELECT id FROM locations WHERE name = 'Salón Sur - Coyoacán' LIMIT 1),
    'Estación 1',
    'station',
    1,
    true
  ON CONFLICT DO NOTHING;
" 2>&1 | grep -v "NOTICE"

RESOURCES_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM resources;")
echo "✅ Resources: $RESOURCES_COUNT/6"

# 3. Crear Staff
echo ""
echo "👥 Creando staff..."
psql "$DB_URL" -c "
  INSERT INTO staff (user_id, location_id, role, display_name, phone, is_active)
  VALUES
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1), 'admin', 'Admin Principal', '+52 55 1111 2222', true),
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1), 'manager', 'Manager Centro', '+52 55 2222 3333', true),
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Norte - Polanco' LIMIT 1), 'manager', 'Manager Polanco', '+52 55 6666 7777', true),
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1), 'staff', 'Staff Coordinadora', '+52 55 3333 4444', true),
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1), 'artist', 'Artist María García', '+52 55 4444 5555', true),
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1), 'artist', 'Artist Ana Rodríguez', '+52 55 5555 6666', true),
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Norte - Polanco' LIMIT 1), 'artist', 'Artist Carla López', '+52 55 7777 8888', true),
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Sur - Coyoacán' LIMIT 1), 'artist', 'Artist Laura Martínez', '+52 55 8888 9999', true)
  ON CONFLICT DO NOTHING;
" 2>&1 | grep -v "NOTICE"

STAFF_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM staff;")
echo "✅ Staff: $STAFF_COUNT/8"

# 4. Crear Services
echo ""
echo "💇 Creando services..."
psql "$DB_URL" -c "
  INSERT INTO services (name, description, duration_minutes, base_price, requires_dual_artist, premium_fee_enabled, is_active)
  VALUES
    ('Corte y Estilizado', 'Corte de cabello profesional con lavado y estilizado', 60, 500.00, false, false, true),
    ('Color Completo', 'Tinte completo con protección capilar', 120, 1200.00, false, true, true),
    ('Balayage Premium', 'Técnica de balayage con productos premium', 180, 2000.00, true, true, true),
    ('Tratamiento Kératina', 'Tratamiento de kératina para cabello dañado', 90, 1500.00, false, false, true),
    ('Peinado Evento', 'Peinado para eventos especiales', 45, 800.00, false, true, true),
    ('Servicio Express (Dual Artist)', 'Servicio rápido con dos artists simultáneas', 30, 600.00, true, true, true)
  ON CONFLICT DO NOTHING;
" 2>&1 | grep -v "NOTICE"

SERVICES_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM services;")
echo "✅ Services: $SERVICES_COUNT/6"

# 5. Crear Customers
echo ""
echo "👩 Creando customers..."
psql "$DB_URL" -c "
  INSERT INTO customers (user_id, first_name, last_name, email, phone, tier, notes, total_spent, total_visits, last_visit_date, is_active)
  VALUES
    (uuid_generate_v4(), 'Sofía', 'Ramírez', 'sofia.ramirez@example.com', '+52 55 1111 1111', 'gold', 'Cliente VIP. Prefiere Artists María y Ana.', 15000.00, 25, '2025-12-20', true),
    (uuid_generate_v4(), 'Valentina', 'Hernández', 'valentina.hernandez@example.com', '+52 55 2222 2222', 'gold', 'Cliente regular. Prefiere horarios de la mañana.', 8500.00, 15, '2025-12-15', true),
    (uuid_generate_v4(), 'Camila', 'López', 'camila.lopez@example.com', '+52 55 3333 3333', 'free', 'Nueva cliente. Referida por Valentina.', 500.00, 1, '2025-12-10', true),
    (uuid_generate_v4(), 'Isabella', 'García', 'isabella.garcia@example.com', '+52 55 4444 4444', 'gold', 'Cliente VIP. Requiere servicio de Balayage.', 22000.00, 30, '2025-12-18', true)
  ON CONFLICT (email) DO NOTHING;
" 2>&1 | grep -v "NOTICE"

CUSTOMERS_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM customers;")
echo "✅ Customers: $CUSTOMERS_COUNT/4"

# 6. Crear Invitaciones (para clientes Gold)
echo ""
echo "💌 Creando invitations..."
psql "$DB_URL" -c "
  SELECT reset_weekly_invitations_for_customer((SELECT id FROM customers WHERE email = 'sofia.ramirez@example.com' LIMIT 1));
  SELECT reset_weekly_invitations_for_customer((SELECT id FROM customers WHERE email = 'valentina.hernandez@example.com' LIMIT 1));
  SELECT reset_weekly_invitations_for_customer((SELECT id FROM customers WHERE email = 'isabella.garcia@example.com' LIMIT 1));
" 2>&1 | grep -v "NOTICE"

INVITATIONS_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM invitations WHERE status = 'pending';")
echo "✅ Invitaciones: $INVITATIONS_COUNT/15"

# 7. Crear Bookings de Prueba
echo ""
echo "📅 Creando bookings..."
psql "$DB_URL" -c "
  INSERT INTO bookings (
    customer_id,
    staff_id,
    location_id,
    resource_id,
    service_id,
    start_time_utc,
    end_time_utc,
    status,
    deposit_amount,
    total_amount,
    is_paid,
    payment_reference,
    notes
  )
  SELECT
    (SELECT id FROM customers WHERE email = 'sofia.ramirez@example.com' LIMIT 1),
    (SELECT id FROM staff WHERE display_name = 'Artist María García' LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1),
    (SELECT id FROM resources WHERE location_id = (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1) LIMIT 1),
    (SELECT id FROM services WHERE name = 'Balayage Premium' LIMIT 1),
    NOW() + INTERVAL '1 day',
    NOW() + INTERVAL '4 hours',
    'confirmed',
    200.00,
    2000.00,
    true,
    'pay_test_001',
    'Balayage Premium para Sofía'
  UNION ALL
  SELECT
    (SELECT id FROM customers WHERE email = 'valentina.hernandez@example.com' LIMIT 1),
    (SELECT id FROM staff WHERE display_name = 'Artist Ana Rodríguez' LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1),
    (SELECT id FROM resources WHERE location_id = (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1) LIMIT 1),
    (SELECT id FROM services WHERE name = 'Color Completo' LIMIT 1),
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '4 hours',
    'confirmed',
    200.00,
    1200.00,
    true,
    'pay_test_002',
    'Color Completo para Valentina'
  UNION ALL
  SELECT
    (SELECT id FROM customers WHERE email = 'camila.lopez@example.com' LIMIT 1),
    (SELECT id FROM staff WHERE display_name = 'Artist María García' LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1),
    (SELECT id FROM resources WHERE location_id = (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1) LIMIT 1),
    (SELECT id FROM services WHERE name = 'Corte y Estilizado' LIMIT 1),
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '1 hour',
    'confirmed',
    50.00,
    500.00,
    true,
    'pay_test_003',
    'Primer corte para Camila'
  UNION ALL
  SELECT
    (SELECT id FROM customers WHERE email = 'isabella.garcia@example.com' LIMIT 1),
    (SELECT id FROM staff WHERE display_name = 'Artist María García' LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1),
    (SELECT id FROM resources WHERE location_id = (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1) LIMIT 1),
    (SELECT id FROM services WHERE name = 'Servicio Express (Dual Artist)' LIMIT 1),
    NOW() + INTERVAL '4 days',
    NOW() + INTERVAL '30 minutes',
    'confirmed',
    200.00,
    600.00,
    true,
    'pay_test_004',
    'Servicio Express Dual Artist - Necesita secondary_artist'
  UNION ALL
  SELECT
    (SELECT id FROM customers WHERE email = 'sofia.ramirez@example.com' LIMIT 1),
    (SELECT id FROM staff WHERE display_name = 'Artist Ana Rodríguez' LIMIT 1),
    (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1),
    (SELECT id FROM resources WHERE location_id = (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1) OFFSET 1 LIMIT 1),
    (SELECT id FROM services WHERE name = 'Peinado Evento' LIMIT 1),
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '45 minutes',
    'pending',
    200.00,
    800.00,
    false,
    NULL,
    'Peinado para evento especial'
  ON CONFLICT DO NOTHING;
" 2>&1 | grep -v "NOTICE"

BOOKINGS_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM bookings;")
echo "✅ Bookings: $BOOKINGS_COUNT/5"

# 8. Actualizar booking con secondary_artist
echo ""
echo "🔄 Actualizando booking con secondary_artist..."
psql "$DB_URL" -c "
  UPDATE bookings
  SET secondary_artist_id = (SELECT id FROM staff WHERE display_name = 'Artist Carla López' LIMIT 1)
  WHERE payment_reference = 'pay_test_004';
" 2>&1 | grep -v "NOTICE"

SECONDARY_ARTIST_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM bookings WHERE secondary_artist_id IS NOT NULL;")
echo "✅ Bookings con secondary_artist: $SECONDARY_ARTIST_COUNT/1"

# Resumen
echo ""
echo "=========================================="
echo "RESUMEN"
echo "=========================================="
echo "Locations:    $LOCATIONS_COUNT/3"
echo "Resources:    $RESOURCES_COUNT/6"
echo "Staff:        $STAFF_COUNT/8"
echo "Services:     $SERVICES_COUNT/6"
echo "Customers:    $CUSTOMERS_COUNT/4"
echo "Invitations:  $INVITATIONS_COUNT/15"
echo "Bookings:     $BOOKINGS_COUNT/5"
echo "Sec. Artist:  $SECONDARY_ARTIST_COUNT/1"
echo "=========================================="

if [ "$LOCATIONS_COUNT" -eq 3 ] && [ "$RESOURCES_COUNT" -eq 6 ] && [ "$STAFF_COUNT" -eq 8 ] && [ "$SERVICES_COUNT" -eq 6 ] && [ "$CUSTOMERS_COUNT" -eq 4 ] && [ "$INVITATIONS_COUNT" -eq 15 ] && [ "$BOOKINGS_COUNT" -eq 5 ]; then
  echo ""
  echo "🎉 SEED DE DATOS COMPLETADO EXITOSAMENTE"
  echo ""
  echo "Próximos pasos:"
  echo "1. Configurar Auth en Supabase Dashboard"
  echo "2. Crear usuarios de staff y customers"
  echo "3. Actualizar tablas staff y customers con user_ids"
else
  echo ""
  echo "⚠️  ALGUNOS DATOS NO SE CREARON CORRECTAMENTE"
  echo "Por favor, verifica los errores arriba."
fi
