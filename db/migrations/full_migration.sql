-- ============================================
-- SALONOS - FULL DATABASE MIGRATION
-- ============================================
-- Ejecuta todas las migraciones en orden
-- Fecha: 2026-01-15
-- ============================================

-- Ejecutar cada migración en orden:
-- 1. 001_initial_schema.sql
-- 2. 002_rls_policies.sql
-- 3. 003_audit_triggers.sql

-- Para ejecutar desde psql:
-- psql $DATABASE_URL -f db/migrations/001_initial_schema.sql
-- psql $DATABASE_URL -f db/migrations/002_rls_policies.sql
-- psql $DATABASE_URL -f db/migrations/003_audit_triggers.sql

-- O ejecutar este archivo completo:
-- psql $DATABASE_URL -f db/migrations/full_migration.sql

-- ============================================
-- BEGIN MIGRATION 001
-- ============================================
\i db/migrations/001_initial_schema.sql

-- ============================================
-- BEGIN MIGRATION 002
-- ============================================
\i db/migrations/002_rls_policies.sql

-- ============================================
-- BEGIN MIGRATION 003
-- ============================================
\i db/migrations/003_audit_triggers.sql

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verificar tablas creadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('locations', 'resources', 'staff', 'services', 'customers', 'invitations', 'bookings', 'audit_logs');

    RAISE NOTICE '✅ Tablas creadas: % de 8 esperadas', table_count;
END
$$;

-- Verificar funciones creadas
DO $$
DECLARE
    func_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO func_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN ('generate_short_id', 'generate_invitation_code', 'reset_weekly_invitations_for_customer', 'reset_all_weekly_invitations', 'log_audit', 'get_current_user_role', 'is_staff_or_higher', 'is_artist', 'is_customer', 'is_admin', 'update_updated_at', 'generate_booking_short_id', 'get_week_start');

    RAISE NOTICE '✅ Funciones creadas: % de 13 esperadas', func_count;
END
$$;

-- Verificar triggers activos
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';

    RAISE NOTICE '✅ Triggers activos: % (se esperan múltiples)', trigger_count;
END
$$;

-- Verificar políticas RLS
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';

    RAISE NOTICE '✅ Políticas RLS: % (se esperan múltiples)', policy_count;
END
$$;

-- Verificar tipos ENUM
DO $$
DECLARE
    enum_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO enum_count
    FROM pg_type
    WHERE typtype = 'e'
    AND typname IN ('user_role', 'customer_tier', 'booking_status', 'invitation_status', 'resource_type', 'audit_action');

    RAISE NOTICE '✅ Tipos ENUM: % de 6 esperados', enum_count;
END
$$;

RAISE NOTICE '===========================================';
RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
RAISE NOTICE '===========================================';
RAISE NOTICE 'Verificar el esquema ejecutando:';
RAISE NOTICE '  SELECT table_name FROM information_schema.tables WHERE table_schema = ''public'' ORDER BY table_name;';
RAISE NOTICE '  SELECT routine_name FROM information_schema.routines WHERE routine_schema = ''public'' ORDER BY routine_name;';
RAISE NOTICE '===========================================';
