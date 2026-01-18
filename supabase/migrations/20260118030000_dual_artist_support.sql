-- ============================================
-- FASE 2.2 - DUAL ARTIST SERVICES SUPPORT
-- Date: 20260118
-- Description: Add premium_amount to services and dual artist assignment functions
-- ============================================

-- Add premium_amount column to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS premium_amount DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN services.premium_amount IS 'Additional fee for premium/express services (auto-applied if premium_fee_enabled)';

-- Update seed data for express services (example)
UPDATE services 
SET premium_amount = 500 
WHERE name LIKE '%Express%' OR requires_dual_artist = true;

-- Create function to assign dual artists
CREATE OR REPLACE FUNCTION assign_dual_artists(
    p_location_id UUID,
    p_start_time_utc TIMESTAMPTZ,
    p_end_time_utc TIMESTAMPTZ,
    p_service_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_primary_artist UUID;
    v_secondary_artist UUID;
    v_room_resource UUID;
    v_service RECORD;
    v_artists JSONB;
BEGIN
    -- Get service details
    SELECT * INTO v_service FROM services WHERE id = p_service_id;
    
    IF NOT FOUND OR NOT v_service.requires_dual_artist THEN
        RETURN jsonb_build_object(
            'primary_artist', NULL,
            'secondary_artist', NULL,
            'room_resource', NULL,
            'error', 'Service does not require dual artists'
        );
    END IF;

    -- 1. Find available room resource
    SELECT id INTO v_room_resource
    FROM resources r
    WHERE r.location_id = p_location_id
        AND r.type = 'room'  -- Assuming room type enum exists
        AND check_resource_availability(r.id, p_start_time_utc, p_end_time_utc)
    ORDER BY r.name  -- or priority
    LIMIT 1;

    IF v_room_resource IS NULL THEN
        RETURN jsonb_build_object(
            'primary_artist', NULL,
            'secondary_artist', NULL,
            'room_resource', NULL,
            'error', 'No available room resource'
        );
    END IF;

    -- 2. Find 2 available artists/staff (priority: artist > staff)
    SELECT jsonb_agg(jsonb_build_object('id', s.id, 'display_name', s.display_name, 'role', s.role)) INTO v_artists
    FROM staff s
    WHERE s.location_id = p_location_id
        AND s.is_active = true
        AND s.is_available_for_booking = true
        AND s.role IN ('artist', 'staff')
        AND check_staff_availability(s.id, p_start_time_utc, p_end_time_utc)
    ORDER BY 
        CASE s.role 
            WHEN 'artist' THEN 1 
            WHEN 'staff' THEN 2 
        END,
        s.display_name
    LIMIT 2;

    IF jsonb_array_length(v_artists) < 2 THEN
        RETURN jsonb_build_object(
            'primary_artist', NULL,
            'secondary_artist', NULL,
            'room_resource', v_room_resource,
            'error', 'Insufficient available artists (need 2)'
        );
    END IF;

    SELECT (v_artists->0)->>'id' INTO v_primary_artist;
    SELECT (v_artists->1)->>'id' INTO v_secondary_artist;

    RETURN jsonb_build_object(
        'primary_artist', v_primary_artist,
        'secondary_artist', v_secondary_artist,
        'room_resource', v_room_resource,
        'success', true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate service total with premium
CREATE OR REPLACE FUNCTION calculate_service_total(p_service_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total DECIMAL(10,2);
BEGIN
    SELECT 
        COALESCE(base_price, 0) + 
        CASE WHEN premium_fee_enabled THEN COALESCE(premium_amount, 0) ELSE 0 END
    INTO v_total
    FROM services 
    WHERE id = p_service_id;

    RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION assign_dual_artists TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION calculate_service_total TO authenticated, service_role;

COMMENT ON FUNCTION assign_dual_artists IS 'Automatically assigns primary/secondary artists and room for dual-artist services';
COMMENT ON FUNCTION calculate_service_total IS 'Calculates total price including premium fee if enabled';
