-- ============================================
-- FASE 2.1 - GOOGLE CALENDAR EVENTS TABLE
-- Date: 20260118
-- Description: Create google_calendar_events table for bidirectional sync
-- ============================================

-- Create google_calendar_events table
CREATE TABLE IF NOT EXISTS google_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    google_event_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_time_utc TIMESTAMPTZ NOT NULL,
    end_time_utc TIMESTAMPTZ NOT NULL,
    is_blocking BOOLEAN DEFAULT false,
    is_anchoros_booking BOOLEAN DEFAULT false,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    sync_status VARCHAR(50) DEFAULT 'synced',
    sync_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE google_calendar_events IS 'Stores synchronization state of Google Calendar events with AnchorOS bookings';

-- Add column comments
COMMENT ON COLUMN google_calendar_events.staff_id IS 'Reference to staff member associated with this calendar event';
COMMENT ON COLUMN google_calendar_events.google_event_id IS 'Unique Google Calendar event ID';
COMMENT ON COLUMN google_calendar_events.is_blocking IS 'Whether this event blocks staff availability for booking';
COMMENT ON COLUMN google_calendar_events.is_anchoros_booking IS 'True if event was created by AnchorOS sync, false if external';
COMMENT ON COLUMN google_calendar_events.booking_id IS 'Reference to AnchorOS booking if this is a synced booking event';
COMMENT ON COLUMN google_calendar_events.synced_at IS 'Last synchronization timestamp';
COMMENT ON COLUMN google_calendar_events.sync_status IS 'Sync status: synced, pending, failed';
COMMENT ON COLUMN google_calendar_events.sync_error IS 'Error message if sync failed';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_google_calendar_events_staff ON google_calendar_events(staff_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_events_time ON google_calendar_events(start_time_utc, end_time_utc);
CREATE INDEX IF NOT EXISTS idx_google_calendar_events_booking ON google_calendar_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_google_calendar_events_blocking ON google_calendar_events(staff_id, is_blocking) WHERE is_blocking = true;
CREATE INDEX IF NOT EXISTS idx_google_calendar_events_sync_status ON google_calendar_events(sync_status);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_google_calendar_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_google_calendar_events_updated_at ON google_calendar_events;
CREATE TRIGGER trigger_update_google_calendar_events_updated_at
    BEFORE UPDATE ON google_calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_google_calendar_events_updated_at();

-- Add google_calendar_event_id column to bookings if not exists (for bidirectional sync)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'google_calendar_event_id') THEN
        ALTER TABLE bookings ADD COLUMN google_calendar_event_id VARCHAR(255);
        CREATE INDEX IF NOT EXISTS idx_bookings_google_event ON bookings(google_calendar_event_id);
        COMMENT ON COLUMN bookings.google_calendar_event_id IS 'Google Calendar event ID for this booking';
    END IF;
END
$$;

-- Create trigger to automatically sync booking creation/update to Google Calendar
CREATE OR REPLACE FUNCTION trigger_sync_booking_to_google_calendar()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if GOOGLE_CALENDAR_SYNC is enabled (check via environment variable)
    -- This is handled at application level, not in database trigger
    -- The trigger here is just a placeholder for potential future implementation
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: The actual sync logic is implemented in /lib/google-calendar.ts
-- This migration provides the database schema needed for bidirectional sync

-- Create function to get blocking calendar events for a staff member
CREATE OR REPLACE FUNCTION get_blocking_calendar_events(
    p_staff_id UUID,
    p_start_time_utc TIMESTAMPTZ,
    p_end_time_utc TIMESTAMPTZ
)
RETURNS TABLE (
    id UUID,
    google_event_id VARCHAR(255),
    title VARCHAR(500),
    start_time_utc TIMESTAMPTZ,
    end_time_utc TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gce.id,
        gce.google_event_id,
        gce.title,
        gce.start_time_utc,
        gce.end_time_utc
    FROM google_calendar_events gce
    WHERE gce.staff_id = p_staff_id
        AND gce.is_blocking = true
        AND gce.start_time_utc < p_end_time_utc
        AND gce.end_time_utc > p_start_time_utc
        AND gce.is_anchoros_booking = false -- Only external events block
    ORDER BY gce.start_time_utc;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if time slot conflicts with blocking calendar events
CREATE OR REPLACE FUNCTION check_calendar_blocking(
    p_staff_id UUID,
    p_start_time_utc TIMESTAMPTZ,
    p_end_time_utc TIMESTAMPTZ,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_conflict BOOLEAN := false;
BEGIN
    -- Check for blocking calendar events (excluding AnchorOS bookings)
    SELECT EXISTS(
        SELECT 1
        FROM google_calendar_events gce
        WHERE gce.staff_id = p_staff_id
            AND gce.is_blocking = true
            AND gce.start_time_utc < p_end_time_utc
            AND gce.end_time_utc > p_start_time_utc
            AND (p_exclude_booking_id IS NULL OR gce.booking_id != p_exclude_booking_id)
    ) INTO v_has_conflict;
    
    RETURN NOT v_has_conflict; -- Return true if NO conflicts (available)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON google_calendar_events TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- RLS Policies for google_calendar_events
ALTER TABLE google_calendar_events ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can see their own calendar events
CREATE POLICY "Staff can view own calendar events"
ON google_calendar_events
FOR SELECT
USING (
    auth.uid()::text = (SELECT user_id::text FROM staff WHERE id = staff_id)
    OR
    (SELECT role FROM staff WHERE id = staff_id) IN ('admin', 'manager')
);

-- Policy: Admins and managers can insert calendar events
CREATE POLICY "Admins and managers can insert calendar events"
ON google_calendar_events
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM staff
        WHERE id = staff_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
);

-- Policy: Admins and managers can update calendar events
CREATE POLICY "Admins and managers can update calendar events"
ON google_calendar_events
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM staff
        WHERE id = staff_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
);

-- Policy: Admins and managers can delete calendar events
CREATE POLICY "Admins and managers can delete calendar events"
ON google_calendar_events
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM staff
        WHERE id = staff_id
        AND user_id = auth.uid()
        AND role IN ('admin', 'manager')
    )
);
