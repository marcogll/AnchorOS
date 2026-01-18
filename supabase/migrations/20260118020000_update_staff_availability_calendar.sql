-- ============================================
-- FASE 2.1 - UPDATE AVAILABILITY WITH CALENDAR SYNC
-- Date: 20260118
-- Description: Update check_staff_availability to include Google Calendar conflicts
-- ============================================

/**
 * @description Updated check_staff_availability with Google Calendar integration
 * @param {UUID} p_staff_id - ID del staff a verificar
 * @param {TIMESTAMPTZ} p_start_time_utc - Hora de inicio en UTC
 * @param {TIMESTAMPTZ} p_end_time_utc - Hora de fin en UTC
 * @param {UUID} p_exclude_booking_id - (Opcional) ID de reserva a excluir
 * @returns {BOOLEAN} - true si el staff está disponible, false en caso contrario
 * @example SELECT check_staff_availability('uuid...', NOW(), NOW() + INTERVAL '1 hour', NULL);
 */

-- Drop existing function
DROP FUNCTION IF EXISTS check_staff_availability(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) CASCADE;

CREATE OR REPLACE FUNCTION check_staff_availability(
    p_staff_id UUID,
    p_start_time_utc TIMESTAMPTZ,
    p_end_time_utc TIMESTAMPTZ,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_staff RECORD;
    v_has_work_conflict BOOLEAN := false;
    v_has_booking_conflict BOOLEAN := false;
    v_has_calendar_conflict BOOLEAN := false;
    v_has_block_conflict BOOLEAN := false;
BEGIN
    -- 1. Check if staff exists and is active
    SELECT * INTO v_staff FROM staff WHERE id = p_staff_id;
    
    IF NOT FOUND OR NOT v_staff.is_active OR NOT v_staff.is_available_for_booking THEN
        RETURN false;
    END IF;

    -- 2. Check work hours and days
    v_has_work_conflict := NOT check_staff_work_hours(p_staff_id, p_start_time_utc, p_end_time_utc);
    IF v_has_work_conflict THEN
        RETURN false;
    END IF;

    -- 3. Check existing bookings conflict
    SELECT EXISTS (
        SELECT 1 FROM bookings b
        WHERE b.staff_id = p_staff_id
            AND b.status != 'cancelled'
            AND b.start_time_utc < p_end_time_utc
            AND b.end_time_utc > p_start_time_utc
            AND (p_exclude_booking_id IS NULL OR b.id != p_exclude_booking_id)
    ) INTO v_has_booking_conflict;
    
    IF v_has_booking_conflict THEN
        RETURN false;
    END IF;

    -- 4. Check manual blocks conflict
    SELECT EXISTS (
        SELECT 1 FROM staff_availability sa
        WHERE sa.staff_id = p_staff_id
            AND sa.date = p_start_time_utc::DATE
            AND sa.is_available = false
            AND (p_start_time_utc::TIME >= sa.start_time AND p_start_time_utc::TIME < sa.end_time
                 OR p_end_time_utc::TIME > sa.start_time AND p_end_time_utc::TIME <= sa.end_time
                 OR p_start_time_utc::TIME <= sa.start_time AND p_end_time_utc::TIME >= sa.end_time)
    ) INTO v_has_block_conflict;
    
    IF v_has_block_conflict THEN
        RETURN false;
    END IF;

    -- 5. NEW: Check Google Calendar blocking events conflict
    v_has_calendar_conflict := NOT check_calendar_blocking(p_staff_id, p_start_time_utc, p_end_time_utc, p_exclude_booking_id);
    
    IF v_has_calendar_conflict THEN
        RETURN false;
    END IF;

    -- All checks passed - staff is available
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_detailed_availability to use the updated function (already calls it)
-- No change needed as it cascades

-- Test function
COMMENT ON FUNCTION check_staff_availability IS 'Enhanced availability check including Google Calendar sync. Verifies work hours, bookings, manual blocks, and external calendar events.';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_staff_availability TO authenticated, anon, service_role;
