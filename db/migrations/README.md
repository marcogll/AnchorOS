# SalonOS - Database Migrations

Este directorio contiene todas las migraciones de base de datos para Supabase.

## Orden de Ejecución

Las migraciones deben ejecutarse en orden numérico:

1. **001_initial_schema.sql**
   - Crea todas las tablas del sistema
   - Define tipos ENUM (roles, tiers, estados)
   - Crea índices y constraints
   - Implementa el sistema "Doble Capa" (Staff + Recurso)

2. **002_rls_policies.sql**
   - Habilita Row Level Security
   - Define políticas de acceso por rol
   - **Restricción crítica**: Artist solo ve nombre+notas de customers
   - Jerarquía de roles: Admin > Manager > Staff > Artist > Customer

3. **003_audit_triggers.sql**
   - Generador de Short ID (6 caracteres, collision-safe)
   - Funciones de reset semanal de invitaciones
   - Triggers de auditoría automática
   - Generación automática de invitation codes

## Ejecución Manual

### Vía Supabase Dashboard

1. Ir a SQL Editor
2. Copiar y ejecutar cada migración en orden
3. Verificar que no haya errores

### Vía CLI

```bash
# Instalar Supabase CLI si no está instalado
npm install -g supabase

# Login
supabase login

# Ejecutar migración
supabase db push --db-url="postgresql://user:pass@host:port/db"

# O para ejecutar archivo específico
psql $DATABASE_URL -f db/migrations/001_initial_schema.sql
```

## Notas Importantes

### UTC-First
Todos los timestamps se almacenan en UTC. La conversión a zona horaria local ocurre solo en:
- Frontend (The Boutique / The HQ)
- Notificaciones (WhatsApp / Email)

### Sistema Doble Capa
El sistema valida disponibilidad en dos niveles:
1. **Staff/Artist**: Horario laboral + Google Calendar
2. **Recurso**: Disponibilidad de estación física

### Reset Semanal de Invitaciones
- Ejecutado automáticamente cada Lunes 00:00 UTC
- Solo para clientes Tier Gold
- Cada cliente recibe 5 invitaciones nuevas
- Proceso idempotente y auditado

### Privacidad de Datos
- **Artist**: NO puede ver `email` ni `phone` de customers
- **Staff/Manager/Admin**: Pueden ver PII de customers
- Todas las consultas de Artist a `customers` están filtradas por RLS

## Verificación de Migraciones

```sql
-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar funciones creadas
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Verificar triggers activos
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Troubleshooting

### Error: "relation already exists"
Una tabla ya existe. Verificar si la migración anterior falló parcialmente.

### Error: "must be owner of table"
Necesitas permisos de superusuario o owner de la tabla.

### Error: RLS no funciona
Verificar que:
1. RLS está habilitado en la tabla (`ALTER TABLE table_name ENABLE ROW LEVEL SECURITY`)
2. El usuario tiene un rol asignado en `staff` o `customers`
3. Las políticas están correctamente definidas

## Próximos Migraciones

Las futuras migraciones incluirán:
- Integración con Stripe (webhook processing tables)
- Integración con Google Calendar (sync tables)
- Notificaciones WhatsApp (queue tables)
- Storage buckets para The Vault

## Contacto

Para dudas sobre las migraciones, consultar:
- PRD.md: Reglas de negocio
- TASKS.md: Plan de ejecución
- AGENTS.md: Roles y responsabilidades
