-- ============================================
-- VERIFICACIÓN POST-MIGRACIÓN - SALONOS
-- Ejecutar en Supabase SQL Editor después de las migraciones
-- ============================================

-- 1. Verificar Tablas Creadas
SELECT 'TABLAS' as verification_type, table_name as item
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('locations', 'resources', 'staff', 'services', 'customers', 'invitations', 'bookings', 'audit_logs')
ORDER BY table_name;

-- 2. Verificar Funciones Creadas
SELECT 'FUNCIONES' as verification_type, routine_name as item
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 3. Verificar Triggers Activos
SELECT 'TRIGGERS' as verification_type, trigger_name as item
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 4. Verificar Políticas RLS
SELECT 'POLÍTICAS RLS' as verification_type, policyname as item
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Verificar Tipos ENUM
SELECT 'ENUM TYPES' as verification_type, typname as item
FROM pg_type
WHERE typtype = 'e'
AND typname IN ('user_role', 'customer_tier', 'booking_status', 'invitation_status', 'resource_type', 'audit_action')
ORDER BY typname;

-- 6. Probar Short ID Generation
SELECT 'SHORT ID TEST' as verification_type, generate_short_id() as item;

-- 7. Probar Invitation Code Generation
SELECT 'INVITATION CODE TEST' as verification_type, generate_invitation_code() as item;

-- 8. Verificar Trigger de Validación de Secondary Artist
SELECT 'SECONDARY ARTIST TRIGGER' as verification_type, trigger_name as item
FROM information_schema.triggers
WHERE trigger_name = 'validate_booking_secondary_artist';

-- 9. Verificar Función de Reset de Invitaciones
SELECT 'RESET INVITATIONS FUNCTION' as verification_type, routine_name as item
FROM information_schema.routines
WHERE routine_name = 'reset_all_weekly_invitations';

-- 10. Verificar Función de Validación de Secondary Artist
SELECT 'VALIDATE SECONDARY ARTIST' as verification_type, routine_name as item
FROM information_schema.routines
WHERE routine_name = 'validate_secondary_artist_role';

-- 11. Verificar Week Start Function
SELECT 'WEEK START FUNCTION' as verification_type, get_week_start(CURRENT_DATE) as item;

-- 12. Contar elementos por tipo
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
