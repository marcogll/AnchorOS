# 🚀 Guía de Ejecución de Migraciones - Supabase Dashboard

## ⚠️ Situación Actual

No es posible ejecutar las migraciones directamente desde la línea de comandos en este entorno debido a restricciones de red (el puerto 5432 no es accesible).

## ✅ Solución: Ejecutar desde Supabase Dashboard

Esta es la forma más segura y confiable de ejecutar las migraciones.

**Nota:** Se ha corregido un error en la migración original. PostgreSQL no permite subqueries en constraints CHECK. Se ha reemplazado el constraint problemático con un trigger de validación. Usa el archivo `00_FULL_MIGRATION_CORRECTED.sql`.

---

## 📋 PASOS A SEGUIR

### Paso 1: Abrir Supabase SQL Editor

1. Ve a: **https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl/sql**

2. Haz clic en **"New query"** para abrir un editor SQL vacío.

### Paso 2: Copiar el contenido del archivo de migración

El archivo consolidado corregido está en:
```
db/migrations/00_FULL_MIGRATION_CORRECTED.sql
```

Copia **TODO** el contenido de este archivo.

### Paso 3: Pegar y ejecutar en Supabase Dashboard

1. Pega el contenido completo del archivo en el editor SQL.
2. Haz clic en el botón **"Run"** (o presiona `Ctrl+Enter` / `Cmd+Enter`).
3. Espera a que se complete la ejecución (puede tardar 10-30 segundos).

### Paso 4: Verificar la ejecución

Al finalizar, deberías ver:
- ✅ Un mensaje de éxito
- ✅ Notificaciones sobre la creación de tablas, funciones y triggers
- ✅ Un resumen de lo que se ha creado:
  - 8 tablas
  - 13 funciones
  - 15+ triggers
  - 20+ políticas RLS
  - 6 tipos ENUM

---

## 🔍 Verificación Manual

Si deseas verificar que todo se creó correctamente, ejecuta estas consultas en el SQL Editor:

### Verificar Tablas

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Esperado:** 8 tablas (locations, resources, staff, services, customers, invitations, bookings, audit_logs)

### Verificar Funciones

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

**Esperado:** 14 funciones incluyendo `generate_short_id`, `reset_weekly_invitations_for_customer`, `validate_secondary_artist_role`, etc.

### Verificar Triggers

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

**Esperado:** Múltiples triggers para auditoría y timestamps

### Verificar Políticas RLS

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Esperado:** 20+ políticas por rol (admin, manager, staff, artist, customer)

### Probar Generación de Short ID

```sql
SELECT generate_short_id();
```

**Esperado:** Un string de 6 caracteres alfanuméricos (ej: "A3F7X2")

### Probar Generación de Código de Invitación

```sql
SELECT generate_invitation_code();
```

**Esperado:** Un string de 10 caracteres alfanuméricos (ej: "X9J4K2M5N8")

### Verificar Tipos ENUM

```sql
SELECT typname, enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typtype = 'e'
ORDER BY t.typname, e.enumsortorder;
```

**Esperado:** 6 tipos ENUM (user_role, customer_tier, booking_status, invitation_status, resource_type, audit_action)

---

## 🎯 Próximos Pasos (Después de las Migraciones)

### 1. Configurar Auth en Supabase Dashboard

Ve a **Authentication → Providers** y configura:

1. **Email Provider**: Habilitar email authentication
2. **SMS Provider**: Configurar Twilio para SMS (opcional)
3. **Email Templates**: Personalizar templates de Magic Link

### 2. Crear Usuarios de Prueba

Ve a **Authentication → Users** y crea:

- **1 Admin**: Para acceso total
- **1 Manager**: Para gestión operacional
- **1 Staff**: Para coordinación
- **1 Artist**: Para ejecución de servicios
- **1 Customer Free**: Para clientes regulares
- **1 Customer Gold**: Para clientes VIP

### 3. Asignar Roles a Staff

Ejecuta este SQL en el editor para crear staff de prueba:

```sql
-- Insertar admin
INSERT INTO staff (user_id, location_id, role, display_name, is_active)
VALUES ('UUID_DEL_USUARIO_ADMIN', 'LOCATION_UUID', 'admin', 'Admin Principal', true);

-- Insertar manager
INSERT INTO staff (user_id, location_id, role, display_name, is_active)
VALUES ('UUID_DEL_USUARIO_MANAGER', 'LOCATION_UUID', 'manager', 'Manager Centro', true);

-- Insertar staff
INSERT INTO staff (user_id, location_id, role, display_name, is_active)
VALUES ('UUID_DEL_USUARIO_STAFF', 'LOCATION_UUID', 'staff', 'Staff Coordinadora', true);

-- Insertar artist
INSERT INTO staff (user_id, location_id, role, display_name, is_active)
VALUES ('UUID_DEL_USUARIO_ARTIST', 'LOCATION_UUID', 'artist', 'Artist María García', true);
```

### 4. Crear Datos de Prueba

Opcionalmente, puedes ejecutar el script de seed desde la línea de comandos (si tienes acceso):

```bash
npm run db:seed
```

O manualmente desde el SQL Editor:

```sql
-- Crear una location de prueba
INSERT INTO locations (name, timezone, address, phone, is_active)
VALUES ('Salón Principal - Centro', 'America/Mexico_City', 'Av. Reforma 222', '+52 55 1234 5678', true);

-- Crear un servicio de prueba
INSERT INTO services (name, description, duration_minutes, base_price, requires_dual_artist, premium_fee_enabled, is_active)
VALUES ('Corte y Estilizado', 'Corte de cabello profesional', 60, 500.00, false, false, true);

-- Crear un customer de prueba
INSERT INTO customers (user_id, first_name, last_name, email, phone, tier, is_active)
VALUES ('UUID_DEL_USUARIO', 'Sofía', 'Ramírez', 'sofia@example.com', '+52 55 1111 2222', 'gold', true);
```

### 5. Probar el Sistema

Una vez que tengas datos de prueba, puedes:

1. **Probar Short ID**:
   ```sql
   SELECT generate_short_id();
   ```

2. **Probar Código de Invitación**:
   ```sql
   SELECT generate_invitation_code();
   ```

3. **Probar Reset de Invitaciones**:
   ```sql
   SELECT reset_weekly_invitations_for_customer('CUSTOMER_UUID');
   ```

4. **Crear un Booking**:
   ```sql
   INSERT INTO bookings (customer_id, staff_id, location_id, resource_id, service_id, start_time_utc, end_time_utc, status, deposit_amount, total_amount, is_paid)
   VALUES ('CUSTOMER_UUID', 'STAFF_UUID', 'LOCATION_UUID', 'RESOURCE_UUID', 'SERVICE_UUID', NOW() + INTERVAL '1 day', NOW() + INTERVAL '2 days', 'confirmed', 200.00, 500.00, true);
   ```

5. **Verificar Auditoría**:
   ```sql
   SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
   ```

---

## 🚨 Solución de Problemas

### Error: "relation already exists"

**Causa:** Las tablas ya existen. La migración se ejecutó parcialmente o anteriormente.

**Solución:** Continúa con la ejecución o limpia la base de datos:

```sql
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
```

Luego ejecuta la migración nuevamente.

### Error: "function already exists"

**Causa:** Las funciones ya existen.

**Solución:** Esto es normal si estás reejecutando la migración. Los nuevos `CREATE OR REPLACE FUNCTION` no fallarán.

### Error: RLS no funciona

**Causa:** RLS no está habilitado o el usuario no tiene un rol asignado.

**Solución:**

1. Verifica que RLS está habilitado:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```

2. Verifica que el usuario tenga un registro en `staff` o `customers`:
   ```sql
   SELECT * FROM staff WHERE user_id = auth.uid();
   SELECT * FROM customers WHERE user_id = auth.uid();
   ```

3. Verifica las políticas RLS:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

---

## 📚 Documentación Adicional

- **PRD.md:** Reglas de negocio del sistema
- **TASKS.md:** Plan de ejecución por fases
- **AGENTS.md:** Roles y responsabilidades de IA
- **docs/MIGRATION_GUIDE.md:** Guía técnica de migraciones
- **db/migrations/README.md:** Documentación técnica de migraciones

---

## ✅ Checklist de Verificación

Antes de continuar con el desarrollo, asegúrate de:

- [ ] Las 8 tablas están creadas
- [ ] Las 13 funciones están creadas
- [ ] Los 15+ triggers están activos
- [ ] Las 20+ políticas RLS están configuradas
- [ ] Los 6 tipos ENUM están creados
- [ ] `generate_short_id()` funciona
- [ ] `generate_invitation_code()` funciona
- [ ] `reset_weekly_invitations_for_customer()` funciona
- [ ] Auth está configurado
- [ ] Usuarios de prueba están creados
- [ ] Staff de prueba está creado con roles correctos
- [ ] Se puede crear un booking manualmente
- [ ] La auditoría se está registrando correctamente

---

## 🎉 ¡Listo para el Desarrollo!

Una vez que hayas completado todos estos pasos, tu base de datos de SalonOS estará lista para el desarrollo de:

- **Tarea 1.3:** Short ID & Invitaciones (backend endpoints)
- **Tarea 1.4:** CRM Base (endpoints CRUD)
- **Fase 2:** Motor de Agendamiento
- **Fase 3:** Pagos y Protección
- **Fase 4:** HQ Dashboard

---

**¿Necesitas ayuda con algún paso específico?** Puedo proporcionarte consultas SQL adicionales o ayuda para configurar los usuarios de prueba.
