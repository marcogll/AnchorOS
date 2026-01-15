# 📋 Guía Paso a Paso - Verificación y Seed en Supabase Dashboard

## 🎯 Paso 1: Ejecutar Script de Verificación

### 1.1 Abrir Supabase SQL Editor

1. Ve a: **https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl/sql**
2. Haz clic en **"New query"** para abrir un editor SQL vacío

### 1.2 Copiar Script de Verificación

Copia el contenido completo de: **`scripts/verify-migration.sql`**

**O ejecuta estas consultas una por una:**

#### Consulta 1: Verificar Tablas Creadas

```sql
SELECT 'TABLAS' as verification_type, table_name as item
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('locations', 'resources', 'staff', 'services', 'customers', 'invitations', 'bookings', 'audit_logs')
ORDER BY table_name;
```

**Resultado esperado:**
```
verification_type | item
TABLAS           | locations
TABLAS           | resources
TABLAS           | staff
TABLAS           | services
TABLAS           | customers
TABLAS           | invitations
TABLAS           | bookings
TABLAS           | audit_logs
```

#### Consulta 2: Verificar Funciones Creadas

```sql
SELECT 'FUNCIONES' as verification_type, routine_name as item
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Resultado esperado (14 funciones):**
```
verification_type | item
FUNCIONES       | generate_booking_short_id
FUNCIONES       | generate_invitation_code
FUNCIONES       | generate_short_id
FUNCIONES       | get_current_user_role
FUNCIONES       | get_week_start
FUNCIONES       | is_admin
FUNCIONES       | is_artist
FUNCIONES       | is_customer
FUNCIONES       | is_staff_or_higher
FUNCIONES       | log_audit
FUNCIONES       | reset_all_weekly_invitations
FUNCIONES       | reset_weekly_invitations_for_customer
FUNCIONES       | update_updated_at
FUNCIONES       | validate_secondary_artist_role
```

#### Consulta 3: Verificar Triggers Activos

```sql
SELECT 'TRIGGERS' as verification_type, trigger_name as item
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**Resultado esperado (17+ triggers):**
```
verification_type | item
TRIGGERS        | audit_bookings
TRIGGERS        | audit_customers
TRIGGERS        | audit_invitations
TRIGGERS        | audit_staff
TRIGGERS        | audit_services
TRIGGERS        | booking_generate_short_id
TRIGGERS        | bookings_updated_at
TRIGGERS        | customers_updated_at
TRIGGERS        | invitations_updated_at
TRIGGERS        | locations_updated_at
TRIGGERS        | resources_updated_at
TRIGGERS        | staff_updated_at
TRIGGERS        | services_updated_at
TRIGGERS        | validate_booking_secondary_artist
...
```

#### Consulta 4: Verificar Políticas RLS

```sql
SELECT 'POLÍTICAS RLS' as verification_type, policyname as item
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Resultado esperado (20+ políticas):**
```
verification_type | item
POLÍTICAS RLS   | audit_logs_no_insert
POLÍTICAS RLS   | audit_logs_select_admin_manager
POLÍTICAS RLS   | audit_logs_select_staff_location
POLÍTICAS RLS   | bookings_create_own
POLÍTICAS RLS   | bookings_modify_admin_manager
POLÍTICAS RLS   | bookings_modify_staff_location
POLÍTICAS RLS   | bookings_no_modify_artist
POLÍTICAS RLS   | bookings_select_admin_manager
POLÍTICAS RLS   | bookings_select_artist_own
POLÍTICAS RLS   | bookings_select_own
POLÍTICAS RLS   | bookings_select_staff_location
POLÍTICAS RLS   | bookings_update_own
POLÍTICAS RLS   | customers_modify_admin_manager
POLÍTICAS RLS   | customers_modify_staff
POLÍTICAS RLS   | customers_select_admin_manager
POLÍTICAS RLS   | customers_select_artist_restricted
POLÍTICAS RLS   | customers_select_own
POLÍTICAS RLS   | customers_select_staff
POLÍTICAS RLS   | customers_update_own
...
```

#### Consulta 5: Verificar Tipos ENUM

```sql
SELECT 'ENUM TYPES' as verification_type, typname as item
FROM pg_type
WHERE typtype = 'e'
AND typname IN ('user_role', 'customer_tier', 'booking_status', 'invitation_status', 'resource_type', 'audit_action')
ORDER BY typname;
```

**Resultado esperado (6 tipos):**
```
verification_type | item
ENUM TYPES      | audit_action
ENUM TYPES      | booking_status
ENUM TYPES      | customer_tier
ENUM TYPES      | invitation_status
ENUM TYPES      | resource_type
ENUM TYPES      | user_role
```

#### Consulta 6: Probar Short ID Generation

```sql
SELECT 'SHORT ID TEST' as verification_type, generate_short_id() as item;
```

**Resultado esperado:**
```
verification_type | item
SHORT ID TEST   | A3F7X2
```
*(El string será diferente cada vez)*

#### Consulta 7: Probar Invitation Code Generation

```sql
SELECT 'INVITATION CODE TEST' as verification_type, generate_invitation_code() as item;
```

**Resultado esperado:**
```
verification_type | item
INVITATION CODE TEST | X9J4K2M5N8
```
*(El string será diferente cada vez)*

#### Consulta 8: Verificar Trigger de Validación de Secondary Artist

```sql
SELECT 'SECONDARY ARTIST TRIGGER' as verification_type, trigger_name as item
FROM information_schema.triggers
WHERE trigger_name = 'validate_booking_secondary_artist';
```

**Resultado esperado:**
```
verification_type | item
SECONDARY ARTIST TRIGGER | validate_booking_secondary_artist
```

#### Consulta 9: Verificar Función de Reset de Invitaciones

```sql
SELECT 'RESET INVITATIONS FUNCTION' as verification_type, routine_name as item
FROM information_schema.routines
WHERE routine_name = 'reset_all_weekly_invitations';
```

**Resultado esperado:**
```
verification_type | item
RESET INVITATIONS FUNCTION | reset_all_weekly_invitations
```

#### Consulta 10: Verificar Función de Validación de Secondary Artist

```sql
SELECT 'VALIDATE SECONDARY ARTIST' as verification_type, routine_name as item
FROM information_schema.routines
WHERE routine_name = 'validate_secondary_artist_role';
```

**Resultado esperado:**
```
verification_type | item
VALIDATE SECONDARY ARTIST | validate_secondary_artist_role
```

#### Consulta 11: Verificar Week Start Function

```sql
SELECT 'WEEK START FUNCTION' as verification_type, get_week_start(CURRENT_DATE) as item;
```

**Resultado esperado:**
```
verification_type | item
WEEK START FUNCTION | 2025-01-13
```
*(La fecha será el lunes de la semana actual)*

#### Consulta 12: Contar Elementos por Tipo

```sql
SELECT
    'RESUMEN' as verification_type,
    'Tablas: ' || (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('locations', 'resources', 'staff', 'services', 'customers', 'invitations', 'bookings', 'audit_logs')) as item

UNION ALL

SELECT
    'RESUMEN' as verification_type,
    'Funciones: ' || (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as item

UNION ALL

SELECT
    'RESUMEN' as verification_type,
    'Triggers: ' || (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public') as item

UNION ALL

SELECT
    'RESUMEN' as verification_type,
    'Políticas RLS: ' || (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as item

UNION ALL

SELECT
    'RESUMEN' as verification_type,
    'Tipos ENUM: ' || (SELECT COUNT(*) FROM pg_type WHERE typtype = 'e' AND typname IN ('user_role', 'customer_tier', 'booking_status', 'invitation_status', 'resource_type', 'audit_action')) as item;
```

**Resultado esperado:**
```
verification_type | item
RESUMEN         | Tablas: 8
RESUMEN         | Funciones: 14
RESUMEN         | Triggers: 17
RESUMEN         | Políticas RLS: 24
RESUMEN         | Tipos ENUM: 6
```

---

## 🌱 Paso 2: Ejecutar Script de Seed de Datos

### 2.1 Abrir Nuevo Query en SQL Editor

1. En el mismo SQL Editor, haz clic en **"New query"**
2. O pestaña para separar la verificación del seed

### 2.2 Ejecutar Seed por Secciones

**Opción A: Ejecutar el archivo completo**
- Copia TODO el contenido de **`scripts/seed-data.sql`**
- Pega en el SQL Editor
- Haz clic en **"Run"**

**Opción B: Ejecutar por secciones** (recomendado para ver el progreso)

#### Sección 1: Crear Locations

```sql
-- 1. Crear Locations
INSERT INTO locations (name, timezone, address, phone, is_active)
VALUES
    ('Salón Principal - Centro', 'America/Mexico_City', 'Av. Reforma 222, Centro Histórico, Ciudad de México', '+52 55 1234 5678', true),
    ('Salón Norte - Polanco', 'America/Mexico_City', 'Av. Masaryk 123, Polanco, Ciudad de México', '+52 55 2345 6789', true),
    ('Salón Sur - Coyoacán', 'America/Mexico_City', 'Calle Hidalgo 456, Coyoacán, Ciudad de México', '+52 55 3456 7890', true);

-- Verificar
SELECT 'Locations creadas:', COUNT(*) FROM locations;
```

**Resultado esperado:**
```
Locations creadas: | 3
```

#### Sección 2: Crear Resources

```sql
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

-- Verificar
SELECT 'Resources creadas:', COUNT(*) FROM resources;
```

**Resultado esperado:**
```
Resources creadas: | 6
```

#### Sección 3: Crear Staff

```sql
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

-- Verificar
SELECT 'Staff creados:', COUNT(*) FROM staff;
```

**Resultado esperado:**
```
Staff creados: | 8
```

#### Sección 4: Crear Services

```sql
-- 4. Crear Services
INSERT INTO services (name, description, duration_minutes, base_price, requires_dual_artist, premium_fee_enabled, is_active)
VALUES
    ('Corte y Estilizado', 'Corte de cabello profesional con lavado y estilizado', 60, 500.00, false, false, true),
    ('Color Completo', 'Tinte completo con protección capilar', 120, 1200.00, false, true, true),
    ('Balayage Premium', 'Técnica de balayage con productos premium', 180, 2000.00, true, true, true),
    ('Tratamiento Kératina', 'Tratamiento de kératina para cabello dañado', 90, 1500.00, false, false, true),
    ('Peinado Evento', 'Peinado para eventos especiales', 45, 800.00, false, true, true),
    ('Servicio Express (Dual Artist)', 'Servicio rápido con dos artists simultáneas', 30, 600.00, true, true, true);

-- Verificar
SELECT 'Services creados:', COUNT(*) FROM services;
```

**Resultado esperado:**
```
Services creados: | 6
```

#### Sección 5: Crear Customers

```sql
-- 5. Crear Customers
INSERT INTO customers (user_id, first_name, last_name, email, phone, tier, notes, total_spent, total_visits, last_visit_date, is_active)
VALUES
    (uuid_generate_v4(), 'Sofía', 'Ramírez', 'sofia.ramirez@example.com', '+52 55 1111 1111', 'gold', 'Cliente VIP. Prefiere Artists María y Ana.', 15000.00, 25, '2025-12-20', true),
    (uuid_generate_v4(), 'Valentina', 'Hernández', 'valentina.hernandez@example.com', '+52 55 2222 2222', 'gold', 'Cliente regular. Prefiere horarios de la mañana.', 8500.00, 15, '2025-12-15', true),
    (uuid_generate_v4(), 'Camila', 'López', 'camila.lopez@example.com', '+52 55 3333 3333', 'free', 'Nueva cliente. Referida por Valentina.', 500.00, 1, '2025-12-10', true),
    (uuid_generate_v4(), 'Isabella', 'García', 'isabella.garcia@example.com', '+52 55 4444 4444', 'gold', 'Cliente VIP. Requiere servicio de Balayage.', 22000.00, 30, '2025-12-18', true);

-- Verificar
SELECT 'Customers creados:', COUNT(*) FROM customers;
```

**Resultado esperado:**
```
Customers creados: | 4
```

#### Sección 6: Crear Invitaciones

```sql
-- 6. Crear Invitaciones (para clientes Gold)
-- Resetear invitaciones para clientes Gold de la semana actual
SELECT reset_weekly_invitations_for_customer((SELECT id FROM customers WHERE email = 'sofia.ramirez@example.com' LIMIT 1));
SELECT reset_weekly_invitations_for_customer((SELECT id FROM customers WHERE email = 'valentina.hernandez@example.com' LIMIT 1));
SELECT reset_weekly_invitations_for_customer((SELECT id FROM customers WHERE email = 'isabella.garcia@example.com' LIMIT 1));

-- Verificar
SELECT 'Invitaciones creadas:', COUNT(*) FROM invitations WHERE status = 'pending';
```

**Resultado esperado:**
```
Invitaciones creadas: | 15
```
*(5 por cada cliente Gold)*

#### Sección 7: Crear Bookings de Prueba

```sql
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

-- Verificar
SELECT 'Bookings creados:', COUNT(*) FROM bookings;
```

**Resultado esperado:**
```
Bookings creados: | 5
```

#### Sección 8: Actualizar Booking con Secondary Artist

```sql
-- 8. Actualizar booking con secondary_artist (prueba de validación)
UPDATE bookings
SET secondary_artist_id = (SELECT id FROM staff WHERE display_name = 'Artist Carla López' LIMIT 1)
WHERE payment_reference = 'pay_test_004';

-- Verificar
SELECT 'Bookings con secondary_artist:', COUNT(*) FROM bookings WHERE secondary_artist_id IS NOT NULL;
```

**Resultado esperado:**
```
Bookings con secondary_artist: | 1
```

#### Sección 9: Resumen Final

```sql
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
```

**Resultado esperado:**
```
NOTICE:  ==========================================
NOTICE:  SALONOS - SEED DE DATOS COMPLETADO
NOTICE:  ==========================================
NOTICE:  Locations: 3
NOTICE:  Resources: 6
NOTICE:  Staff: 8
NOTICE:  Services: 6
NOTICE:  Customers: 4
NOTICE:  Invitations: 15
NOTICE:  Bookings: 5
NOTICE:  ==========================================
NOTICE:  ✅ Base de datos lista para desarrollo
NOTICE:  ==========================================
```

---

## 🧪 Paso 3: Pruebas Adicionales

### Test 1: Verificar Bookings con Detalles

```sql
SELECT
    b.short_id,
    c.first_name || ' ' || c.last_name as customer,
    s.display_name as artist,
    sa.display_name as secondary_artist,
    svc.name as service,
    b.start_time_utc,
    b.end_time_utc,
    b.status,
    b.total_amount
FROM bookings b
JOIN customers c ON b.customer_id = c.id
JOIN staff s ON b.staff_id = s.id
LEFT JOIN staff sa ON b.secondary_artist_id = sa.id
JOIN services svc ON b.service_id = svc.id
ORDER BY b.start_time_utc;
```

### Test 2: Verificar Invitaciones

```sql
SELECT
    i.code,
    inv.first_name || ' ' || inv.last_name as inviter,
    i.status,
    i.week_start_date,
    i.expiry_date
FROM invitations i
JOIN customers inv ON i.inviter_id = inv.id
WHERE i.status = 'pending'
ORDER BY inv.first_name, i.expiry_date;
```

### Test 3: Verificar Staff por Ubicación y Rol

```sql
SELECT
    l.name as location,
    s.role,
    s.display_name,
    s.phone,
    s.is_active
FROM staff s
JOIN locations l ON s.location_id = l.id
ORDER BY l.name, s.role, s.display_name;
```

### Test 4: Verificar Auditoría

```sql
SELECT
    entity_type,
    action,
    new_values->>'operation' as operation,
    new_values->>'table_name' as table_name,
    created_at
FROM audit_logs
WHERE new_values->>'table_name' = 'invitations'
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ Checklist de Verificación

Después de completar todos los pasos, asegúrate de:

### Verificación de Migraciones
- [x] 8 tablas creadas (locations, resources, staff, services, customers, invitations, bookings, audit_logs)
- [x] 14 funciones creadas
- [x] 17+ triggers activos
- [x] 20+ políticas RLS configuradas
- [x] 6 tipos ENUM creados
- [x] Short ID generable
- [x] Código de invitación generable

### Verificación de Seed de Datos
- [ ] 3 locations creadas
- [ ] 6 resources creadas
- [ ] 8 staff creados
- [ ] 6 services creados
- [ ] 4 customers creados
- [ ] 15 invitaciones creadas (5 por cliente Gold)
- [ ] 5 bookings creados
- [ ] 1 booking con secondary_artist

### Pruebas Funcionales
- [ ] Short ID se genera correctamente
- [ ] Código de invitación se genera correctamente
- [ ] Bookings se crean con short_id automático
- [ ] Secondary artist validation funciona
- [ ] Auditoría se registra correctamente
- [ ] Reset de invitaciones funciona

---

## 🚨 Troubleshooting

### Error: "relation already exists"

**Causa:** Ya ejecutaste esta sección anteriormente.

**Solución:** Continúa con la siguiente sección. Los datos ya existen.

### Error: "null value in column violates not-null constraint"

**Causa:** Falta crear datos dependientes primero.

**Solución:** Ejecuta las secciones en orden: Locations → Resources → Staff → Services → Customers → Invitations → Bookings

### Error: "insert or update on table violates foreign key constraint"

**Causa:** Estás intentando insertar un booking con un customer_id que no existe.

**Solución:** Verifica que el customer exista antes de crear el booking:

```sql
SELECT * FROM customers WHERE email = 'sofia.ramirez@example.com';
```

---

## 📚 Documentación Adicional

- **docs/POST_MIGRATION_SUCCESS.md** - Guía general post-migración
- **scripts/verify-migration.sql** - Script completo de verificación
- **scripts/seed-data.sql** - Script completo de seed
- **FASE_1_STATUS.md** - Estado actualizado de la Fase 1

---

**¿Listo para continuar con la configuración de Auth en Supabase Dashboard?**
