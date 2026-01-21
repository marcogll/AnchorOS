-- ============================================
-- FIX: Correct function calls in check_staff_availability
-- Date: 2026-01-21
-- Description: Fix parameter issues in check_staff_availability function calls
-- ============================================

-- Drop and recreate check_staff_availability with correct function calls
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
    v_location_timezone TEXT;
    v_has_work_conflict BOOLEAN := false;
    v_has_booking_conflict BOOLEAN := false;
    v_has_calendar_conflict BOOLEAN := false;
    v_has_block_conflict BOOLEAN := false;
BEGIN
    -- 1. Check if staff exists and is active
    SELECT s.*, l.timezone INTO v_staff, v_location_timezone
    FROM staff s
    JOIN locations l ON s.location_id = l.id
    WHERE s.id = p_staff_id;

    IF NOT FOUND OR NOT v_staff.is_active OR NOT v_staff.is_available_for_booking THEN
        RETURN false;
    END IF;

    -- 2. Check work hours and days (with correct parameters)
    v_has_work_conflict := NOT check_staff_work_hours(p_staff_id, p_start_time_utc, p_end_time_utc, v_location_timezone);
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

    -- 5. Check Google Calendar blocking events conflict
    v_has_calendar_conflict := NOT check_calendar_blocking(p_staff_id, p_start_time_utc, p_end_time_utc, p_exclude_booking_id);

    IF v_has_calendar_conflict THEN
        RETURN false;
    END IF;

    -- All checks passed - staff is available
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_staff_availability TO authenticated, anon, service_role;

COMMENT ON FUNCTION check_staff_availability IS 'Enhanced availability check including work hours, bookings, manual blocks, and Google Calendar sync with corrected function calls';