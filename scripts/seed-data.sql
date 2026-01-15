-- ============================================
-- SEED DE DATOS - SALONOS
-- Ejecutar en Supabase SQL Editor después de las migraciones
-- ============================================

-- 1. Crear Locations
INSERT INTO locations (name, timezone, address, phone, is_active)
VALUES
    ('Salón Principal - Centro', 'America/Mexico_City', 'Av. Reforma 222, Centro Histórico, Ciudad de México', '+52 55 1234 5678', true),
    ('Salón Norte - Polanco', 'America/Mexico_City', 'Av. Masaryk 123, Polanco, Ciudad de México', '+52 55 2345 6789', true),
    ('Salón Sur - Coyoacán', 'America/Mexico_City', 'Calle Hidalgo 456, Coyoacán, Ciudad de México', '+52 55 3456 7890', true);

-- 2. Crear Resources
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
    true;

-- 3. Crear Staff
INSERT INTO staff (user_id, location_id, role, display_name, phone, is_active)
VALUES
    -- Admin Principal
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1), 'admin', 'Admin Principal', '+52 55 1111 2222', true),
    -- Managers
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1), 'manager', 'Manager Centro', '+52 55 2222 3333', true),
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Norte - Polanco' LIMIT 1), 'manager', 'Manager Polanco', '+52 55 6666 7777', true),
    -- Staff
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1), 'staff', 'Staff Coordinadora', '+52 55 3333 4444', true),
    -- Artists
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1), 'artist', 'Artist María García', '+52 55 4444 5555', true),
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1), 'artist', 'Artist Ana Rodríguez', '+52 55 5555 6666', true),
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Norte - Polanco' LIMIT 1), 'artist', 'Artist Carla López', '+52 55 7777 8888', true),
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Sur - Coyoacán' LIMIT 1), 'artist', 'Artist Laura Martínez', '+52 55 8888 9999', true);

-- 4. Crear Services
INSERT INTO services (name, description, duration_minutes, base_price, requires_dual_artist, premium_fee_enabled, is_active)
VALUES
    ('Corte y Estilizado', 'Corte de cabello profesional con lavado y estilizado', 60, 500.00, false, false, true),
    ('Color Completo', 'Tinte completo con protección capilar', 120, 1200.00, false, true, true),
    ('Balayage Premium', 'Técnica de balayage con productos premium', 180, 2000.00, true, true, true),
    ('Tratamiento Kératina', 'Tratamiento de kératina para cabello dañado', 90, 1500.00, false, false, true),
    ('Peinado Evento', 'Peinado para eventos especiales', 45, 800.00, false, true, true),
    ('Servicio Express (Dual Artist)', 'Servicio rápido con dos artists simultáneas', 30, 600.00, true, true, true);

-- 5. Crear Customers
INSERT INTO customers (user_id, first_name, last_name, email, phone, tier, notes, total_spent, total_visits, last_visit_date, is_active)
VALUES
    (uuid_generate_v4(), 'Sofía', 'Ramírez', 'sofia.ramirez@example.com', '+52 55 1111 1111', 'gold', 'Cliente VIP. Prefiere Artists María y Ana.', 15000.00, 25, '2025-12-20', true),
    (uuid_generate_v4(), 'Valentina', 'Hernández', 'valentina.hernandez@example.com', '+52 55 2222 2222', 'gold', 'Cliente regular. Prefiere horarios de la mañana.', 8500.00, 15, '2025-12-15', true),
    (uuid_generate_v4(), 'Camila', 'López', 'camila.lopez@example.com', '+52 55 3333 3333', 'free', 'Nueva cliente. Referida por Valentina.', 500.00, 1, '2025-12-10', true),
    (uuid_generate_v4(), 'Isabella', 'García', 'isabella.garcia@example.com', '+52 55 4444 4444', 'gold', 'Cliente VIP. Requiere servicio de Balayage.', 22000.00, 30, '2025-12-18', true);

-- 6. Crear Invitaciones (para clientes Gold)
-- Resetear invitaciones para clientes Gold de la semana actual
SELECT reset_weekly_invitations_for_customer((SELECT id FROM customers WHERE email = 'sofia.ramirez@example.com' LIMIT 1));
SELECT reset_weekly_invitations_for_customer((SELECT id FROM customers WHERE email = 'valentina.hernandez@example.com' LIMIT 1));
SELECT reset_weekly_invitations_for_customer((SELECT id FROM customers WHERE email = 'isabella.garcia@example.com' LIMIT 1));

-- 7. Crear Bookings de Prueba
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
    'Peinado para evento especial';

-- 8. Actualizar booking con secondary_artist (prueba de validación)
UPDATE bookings
SET secondary_artist_id = (SELECT id FROM staff WHERE display_name = 'Artist Carla López' LIMIT 1)
WHERE payment_reference = 'pay_test_004';

-- 9. Resumen de datos creados
DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SALONOS - SEED DE DATOS COMPLETADO';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Locations: %', (SELECT COUNT(*) FROM locations);
    RAISE NOTICE 'Resources: %', (SELECT COUNT(*) FROM resources);
    RAISE NOTICE 'Staff: %', (SELECT COUNT(*) FROM staff);
    RAISE NOTICE 'Services: %', (SELECT COUNT(*) FROM services);
    RAISE NOTICE 'Customers: %', (SELECT COUNT(*) FROM customers);
    RAISE NOTICE 'Invitations: %', (SELECT COUNT(*) FROM invitations WHERE status = 'pending');
    RAISE NOTICE 'Bookings: %', (SELECT COUNT(*) FROM bookings);
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ Base de datos lista para desarrollo';
    RAISE NOTICE '==========================================';
END
$$;
