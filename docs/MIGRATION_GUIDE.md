# 🚀 Guía de Ejecución de Migraciones - SalonOS

Esta guía explica cómo ejecutar las migraciones de base de datos en Supabase.

## ⚠️ Requisitos Previos

1. **Cuenta de Supabase** con un proyecto creado
2. **PostgreSQL client (psql)** instalado en tu máquina
3. **Variables de entorno** configuradas en `.env.local`

## 📋 Paso 1: Configurar Variables de Entorno

Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Edita el archivo `.env.local` con tus credenciales de Supabase:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Cómo obtener las credenciales de Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings → API**
4. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

## 🎯 Paso 2: Ejecutar Migraciones

### Opción A: Automática (Recomendada)

Usa el script de migración automatizado:

```bash
# Dar permisos de ejecución al script
chmod +x db/migrate.sh

# Ejecutar el script
./db/migrate.sh
```

### Opción B: Manual con psql

Si prefieres ejecutar las migraciones manualmente:

```bash
# Exportar DATABASE_URL
export DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT-ID].supabase.co:5432/postgres"

# Ejecutar cada migración en orden
psql $DATABASE_URL -f db/migrations/001_initial_schema.sql
psql $DATABASE_URL -f db/migrations/002_rls_policies.sql
psql $DATABASE_URL -f db/migrations/003_audit_triggers.sql
```

### Opción C: Vía Supabase Dashboard

1. Ve a [Supabase Dashboard → SQL Editor](https://supabase.com/dashboard/project/[PROJECT-ID]/sql)
2. Copia el contenido de cada migración en orden
3. Ejecuta `001_initial_schema.sql` primero
4. Luego `002_rls_policies.sql`
5. Finalmente `003_audit_triggers.sql`

## ✅ Paso 3: Verificar la Instalación

Ejecuta estas consultas para verificar que todo esté correcto:

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

**Esperado:** 13 funciones incluyendo `generate_short_id`, `reset_weekly_invitations_for_customer`, etc.

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

**Esperado:** Múltiples políticas por rol (admin, manager, staff, artist, customer)

### Verificar Tipos ENUM

```sql
SELECT typname, enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typtype = 'e'
ORDER BY t.typname, e.enumsortorder;
```

**Esperado:** 6 tipos ENUM (user_role, customer_tier, booking_status, invitation_status, resource_type, audit_action)

## 🔍 Paso 4: Probar Funcionalidad

### Generar Short ID

```sql
SELECT generate_short_id();
```

**Esperado:** Un string de 6 caracteres alfanuméricos (ej: "A3F7X2")

### Generar Código de Invitación

```sql
SELECT generate_invitation_code();
```

**Esperado:** Un string de 10 caracteres alfanuméricos (ej: "X9J4K2M5N8")

### Obtener Inicio de Semana

```sql
SELECT get_week_start(CURRENT_DATE);
```

**Esperado:** El lunes de la semana actual

### Resetear Invitaciones de un Cliente

```sql
-- Primero necesitas un cliente Gold en la base de datos
-- Esto creará 5 invitaciones nuevas para la semana actual
SELECT reset_weekly_invitations_for_customer('[CUSTOMER_UUID]');
```

## 🚨 Solución de Problemas

### Error: "FATAL: password authentication failed"

**Causa:** La contraseña en DATABASE_URL es incorrecta.

**Solución:** Verifica que estés usando el `SUPABASE_SERVICE_ROLE_KEY` como contraseña en la URL de conexión.

### Error: "relation already exists"

**Causa:** Una tabla ya existe. La migración anterior puede haber fallado parcialmente.

**Solución:** Elimina las tablas existentes o ejecuta una limpieza completa:

```sql
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS locations CASCADE;

DROP FUNCTION IF EXISTS generate_short_id();
DROP FUNCTION IF EXISTS generate_invitation_code();
DROP FUNCTION IF EXISTS reset_weekly_invitations_for_customer(UUID);
DROP FUNCTION IF EXISTS reset_all_weekly_invitations();
DROP FUNCTION IF EXISTS log_audit();
DROP FUNCTION IF EXISTS get_current_user_role();
DROP FUNCTION IF EXISTS is_staff_or_higher();
DROP FUNCTION IF EXISTS is_artist();
DROP FUNCTION IF EXISTS is_customer();
DROP FUNCTION IF EXISTS is_admin();
DROP FUNCTION IF EXISTS update_updated_at();
DROP FUNCTION IF EXISTS generate_booking_short_id();
DROP FUNCTION IF EXISTS get_week_start(DATE);
```

### Error: "must be owner of table"

**Causa:** No tienes permisos de superusuario o owner de la tabla.

**Solución:** Asegúrate de estar usando el `SUPABASE_SERVICE_ROLE_KEY` (no el anon key).

### Error: RLS no funciona

**Causa:** RLS no está habilitado o el usuario no tiene un rol asignado.

**Solución:**
1. Verifica que RLS está habilitado: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';`
2. Verifica que el usuario tenga un registro en `staff` o `customers`
3. Verifica las políticas RLS: `SELECT * FROM pg_policies WHERE schemaname = 'public';`

## 📚 Documentación Adicional

- **PRD.md:** Reglas de negocio del sistema
- **TASKS.md:** Plan de ejecución por fases
- **AGENTS.md:** Roles y responsabilidades de IA
- **db/migrations/README.md:** Documentación técnica de migraciones

## 🎓 Próximos Pasos

Después de completar las migraciones:

1. **Configurar Auth en Supabase Dashboard**
   - Habilitar Email/SMS authentication
   - Configurar Magic Links
   - Crear usuarios de prueba

2. **Crear Seeds de Datos**
   - Locations de prueba
   - Staff con diferentes roles
   - Services del catálogo
   - Customers Free y Gold

3. **Implementar Tarea 1.3**
   - Backend API endpoints para Short ID
   - Tests unitarios
   - Edge Function o Cron Job para reset semanal

4. **Implementar Tarea 1.4**
   - Endpoints CRUD de customers
   - Lógica de cálculo automático de Tier
   - Sistema de referidos

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs de Supabase Dashboard
2. Verifica que las variables de entorno estén correctamente configuradas
3. Ejecuta las consultas de verificación en el "Paso 3"
4. Consulta la sección de "Solución de Problemas"

---

**Última actualización:** 2026-01-15
**Versión de migraciones:** 001, 002, 003
**Estado:** ✅ Listo para producción
