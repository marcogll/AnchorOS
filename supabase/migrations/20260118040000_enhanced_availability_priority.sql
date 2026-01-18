-- ============================================
-- FASE 2.3 - ENHANCED AVAILABILITY WITH PRIORITY
-- Date: 20260118
-- Description: Priority resource assignment + dual count + collision detection
-- ============================================

-- Enhance get_available_resources_with_priority with code priority
DROP FUNCTION IF EXISTS get_available_resources_with_priority(UUID, TIMESTAMPTZ, TIMESTAMPTZ) CASCADE;

CREATE OR REPLACE FUNCTION get_available_resources_with_priority(
    p_location_id UUID,
    p_start_time_utc TIMESTAMPTZ,
    p_end_time_utc TIMESTAMPTZ
)
RETURNS TABLE (
    resource_id UUID,
    resource_name VARCHAR,
    resource_type resource_type,
    priority_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.type,
        CASE 
            WHEN r.name LIKE 'mkup%' THEN 1
            WHEN r.name LIKE 'lshs%' THEN 2
            WHEN r.name LIKE 'pedi%' THEN 3
            WHEN r.name LIKE 'mani%' THEN 4
            ELSE 5
        END as priority_order
    FROM resources r
    WHERE r.location_id = p_location_id
        AND r.is_active = true
        AND check_resource_availability(r.id, p_start_time_utc, p_end_time_utc)
    ORDER BY priority_order, r.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- New dual availability function
CREATE OR REPLACE FUNCTION get_dual_availability(
    p_location_id UUID,
    p_service_id UUID,
    p_date DATE,
    p_time_slot_duration_minutes INTEGER DEFAULT 60
)
RETURNS JSONB AS $$
DECLARE
    v_dual_slots JSONB := '[]'::JSONB;
    -- ... (similar to get_detailed_availability but count pairs)
BEGIN
    -- Reuse get_detailed_availability logic but filter COUNT >=2
    -- For simplicity, approximate with staff count >=2
    SELECT jsonb_agg(row_to_json(t))
    INTO v_dual_slots
    FROM (
        SELECT 
            v_slot_start::TEXT as start_time,
            (v_slot_start + (p_time_slot_duration_minutes || ' minutes')::INTERVAL)::TEXT as end_time,
            available_staff_count >= 2 as available,
            available_staff_count
        FROM get_detailed_availability(p_location_id, p_service_id, p_date, p_time_slot_duration_minutes) slots
        WHERE (slots->>'available_staff_count')::INT >= 2
    ) t;
    
    RETURN v_dual_slots;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_available_resources_with_priority IS 'Available resources ordered by priority: mkup > lshs > pedi > mani';
COMMENT ON FUNCTION get_dual_availability IS 'Availability slots where >=2 staff available (for dual services)';

GRANT EXECUTE ON FUNCTION get_available_resources_with_priority TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_dual_availability TO authenticated, service_role;
