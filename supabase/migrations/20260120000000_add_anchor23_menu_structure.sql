-- ============================================
-- ADD ANCHOR 23 MENU STRUCTURE
-- Date: 20260120
-- Description: Add columns to support complex service structure from Anchor 23 menu
-- ============================================

-- Add new columns for complex service structure
ALTER TABLE services ADD COLUMN IF NOT EXISTS subtitle VARCHAR(200);
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_type VARCHAR(20) DEFAULT 'fixed';
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_min INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_max INTEGER;
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_prerequisite BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS prerequisite_details JSONB;
ALTER TABLE services ADD COLUMN IF NOT EXISTS membership_benefits JSONB;

-- Update existing duration_minutes to duration_max for backward compatibility
-- This ensures existing services still work while new services can use ranges
UPDATE services SET duration_max = duration_minutes WHERE duration_max IS NULL AND duration_minutes IS NOT NULL;

-- Add check constraints for new fields
ALTER TABLE services ADD CONSTRAINT IF NOT EXISTS check_price_type
    CHECK (price_type IN ('fixed', 'starting_at'));

ALTER TABLE services ADD CONSTRAINT IF NOT EXISTS check_duration_range
    CHECK (duration_min IS NULL OR duration_max IS NULL OR duration_min <= duration_max);

ALTER TABLE services ADD CONSTRAINT IF NOT EXISTS check_duration_not_null
    CHECK (
        (duration_min IS NOT NULL AND duration_max IS NOT NULL) OR
        (duration_min IS NULL AND duration_max IS NOT NULL)
    );

-- Add comments for documentation
COMMENT ON COLUMN services.subtitle IS 'Optional subtitle displayed under service name';
COMMENT ON COLUMN services.price_type IS 'fixed or starting_at pricing type';
COMMENT ON COLUMN services.duration_min IS 'Minimum duration in minutes for ranged services';
COMMENT ON COLUMN services.duration_max IS 'Maximum duration in minutes for ranged services';
COMMENT ON COLUMN services.requires_prerequisite IS 'Whether service requires prerequisite service';
COMMENT ON COLUMN services.prerequisite_details IS 'JSON details about prerequisite requirements';
COMMENT ON COLUMN services.membership_benefits IS 'JSON details about member-specific benefits';