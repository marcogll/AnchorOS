-- Migración 001: Esquema base de datos SalonOS
-- Version: 001
-- Fecha: 2026-01-15
-- Descripción: Creación de tablas principales con jerarquía de roles y sistema doble capa

-- Habilitar UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff', 'artist', 'customer');
CREATE TYPE customer_tier AS ENUM ('free', 'gold');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE invitation_status AS ENUM ('pending', 'used', 'expired');
CREATE TYPE resource_type AS ENUM ('station', 'room', 'equipment');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'reset_invitations', 'payment', 'status_change');

-- ============================================
-- LOCATIONS
-- ============================================

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    address TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESOURCES
-- ============================================

CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type resource_type NOT NULL,
    capacity INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STAFF
-- ============================================

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    role user_role NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'artist')),
    display_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, location_id)
);

-- ============================================
-- SERVICES
-- ============================================

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
    requires_dual_artist BOOLEAN DEFAULT false,
    premium_fee_enabled BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CUSTOMERS
-- ============================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    tier customer_tier DEFAULT 'free',
    notes TEXT,
    total_spent DECIMAL(10, 2) DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    last_visit_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVITATIONS
-- ============================================

CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    code VARCHAR(10) UNIQUE NOT NULL,
    email VARCHAR(255),
    status invitation_status DEFAULT 'pending',
    week_start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOOKINGS
-- ============================================

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    short_id VARCHAR(6) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
    secondary_artist_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
    start_time_utc TIMESTAMPTZ NOT NULL,
    end_time_utc TIMESTAMPTZ NOT NULL,
    status booking_status DEFAULT 'pending',
    deposit_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    payment_reference VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action audit_action NOT NULL,
    old_values JSONB,
    new_values JSONB,
    performed_by UUID,
    performed_by_role user_role,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Locations
CREATE INDEX idx_locations_active ON locations(is_active);

-- Resources
CREATE INDEX idx_resources_location ON resources(location_id);
CREATE INDEX idx_resources_active ON resources(location_id, is_active);

-- Staff
CREATE INDEX idx_staff_user ON staff(user_id);
CREATE INDEX idx_staff_location ON staff(location_id);
CREATE INDEX idx_staff_role ON staff(location_id, role, is_active);

-- Services
CREATE INDEX idx_services_active ON services(is_active);

-- Customers
CREATE INDEX idx_customers_tier ON customers(tier);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_active ON customers(is_active);

-- Invitations
CREATE INDEX idx_invitations_inviter ON invitations(inviter_id);
CREATE INDEX idx_invitations_code ON invitations(code);
CREATE INDEX idx_invitations_week ON invitations(week_start_date, status);

-- Bookings
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_staff ON bookings(staff_id);
CREATE INDEX idx_bookings_secondary_artist ON bookings(secondary_artist_id);
CREATE INDEX idx_bookings_location ON bookings(location_id);
CREATE INDEX idx_bookings_resource ON bookings(resource_id);
CREATE INDEX idx_bookings_time ON bookings(start_time_utc, end_time_utc);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_short_id ON bookings(short_id);

-- Audit logs
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at);
CREATE INDEX idx_audit_performed ON audit_logs(performed_by);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER invitations_updated_at BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- CONSTRAINTS
-- ============================================

-- Constraint: Booking time validation
ALTER TABLE bookings ADD CONSTRAINT check_booking_time
    CHECK (end_time_utc > start_time_utc);

-- Constraint: Booking cannot overlap for same resource (enforced in app layer with proper locking)
-- This is documented for future constraint implementation

-- Trigger for secondary_artist validation (PostgreSQL doesn't allow subqueries in CHECK constraints)
CREATE OR REPLACE FUNCTION validate_secondary_artist_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.secondary_artist_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM staff s
            WHERE s.id = NEW.secondary_artist_id AND s.role = 'artist' AND s.is_active = true
        ) THEN
            RAISE EXCEPTION 'secondary_artist_id must reference an active staff member with role ''artist''';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_booking_secondary_artist BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION validate_secondary_artist_role();

-- Constraint: Invitation week_start_date must be Monday
ALTER TABLE invitations ADD CONSTRAINT check_week_start_is_monday
    CHECK (EXTRACT(ISODOW FROM week_start_date) = 1);

-- ============================================
-- END OF MIGRATION 001
-- ============================================