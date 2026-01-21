-- ============================================
-- STAFF SERVICES MANAGEMENT
-- Date: 2026-01-21
-- Description: Add staff_services table and proficiency system
-- ============================================

-- Create staff_services table
CREATE TABLE staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  proficiency_level INTEGER CHECK (proficiency_level >= 1 AND proficiency_level <= 5) DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, service_id)
);

-- Add indexes for performance
CREATE INDEX idx_staff_services_staff_id ON staff_services(staff_id);
CREATE INDEX idx_staff_services_service_id ON staff_services(service_id);
CREATE INDEX idx_staff_services_active ON staff_services(is_active);

-- Add RLS policies
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can view their own services
CREATE POLICY "Staff can view own services"
ON staff_services
FOR SELECT
USING (
  auth.uid()::text = (
    SELECT user_id::text FROM staff WHERE id = staff_id
  )
);

-- Policy: Managers and admins can view all staff services
CREATE POLICY "Managers and admins can view all staff services"
ON staff_services
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM staff s
    WHERE s.user_id::text = auth.uid()::text
    AND s.role IN ('manager', 'admin')
  )
);

-- Policy: Managers and admins can manage staff services
CREATE POLICY "Managers and admins can manage staff services"
ON staff_services
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM staff s
    WHERE s.user_id::text = auth.uid()::text
    AND s.role IN ('manager', 'admin')
  )
);

-- Add audit columns to bookings for tracking auto-assignment and invitations
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invitation_code_used TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS auto_assigned BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES staff(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bookings_invitation_code ON bookings(invitation_code_used);
CREATE INDEX IF NOT EXISTS idx_bookings_auto_assigned ON bookings(auto_assigned);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON staff_services TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON TABLE staff_services IS 'Tracks which services each staff member can perform and their proficiency level';
COMMENT ON COLUMN staff_services.proficiency_level IS '1=Beginner, 2=Intermediate, 3=Competent, 4=Proficient, 5=Expert';