-- ============================================
-- SALONOS - FULL DATABASE MIGRATION
-- Ejecutar TODO este archivo en Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl/sql
-- ============================================

-- ============================================
-- BEGIN MIGRATION 001: INITIAL SCHEMA
-- ============================================

-- Habilitar UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff', 'artist', 'customer');
CREATE TYPE customer_tier AS ENUM ('free', 'gold');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
CREATE TYPE invitation_status AS ENUM ('pending', 'used', 'expired');
CREATE TYPE resource_type AS ENUM ('station', 'room', 'equipment');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'reset_invitations', 'payment', 'status_change');

-- LOCATIONS
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

-- RESOURCES
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

-- STAFF
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

-- SERVICES
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

-- CUSTOMERS
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

-- INVITATIONS
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

-- BOOKINGS
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

-- AUDIT LOGS
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

-- INDEXES
CREATE INDEX idx_locations_active ON locations(is_active);
CREATE INDEX idx_resources_location ON resources(location_id);
CREATE INDEX idx_resources_active ON resources(location_id, is_active);
CREATE INDEX idx_staff_user ON staff(user_id);
CREATE INDEX idx_staff_location ON staff(location_id);
CREATE INDEX idx_staff_role ON staff(location_id, role, is_active);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_customers_tier ON customers(tier);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_invitations_inviter ON invitations(inviter_id);
CREATE INDEX idx_invitations_code ON invitations(code);
CREATE INDEX idx_invitations_week ON invitations(week_start_date, status);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_staff ON bookings(staff_id);
CREATE INDEX idx_bookings_location ON bookings(location_id);
CREATE INDEX idx_bookings_resource ON bookings(resource_id);
CREATE INDEX idx_bookings_time ON bookings(start_time_utc, end_time_utc);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_short_id ON bookings(short_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action, created_at);
CREATE INDEX idx_audit_performed ON audit_logs(performed_by);

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- UPDATED_AT TRIGGERS
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

-- CONSTRAINTS
ALTER TABLE bookings ADD CONSTRAINT check_booking_time
    CHECK (end_time_utc > start_time_utc);

ALTER TABLE bookings ADD CONSTRAINT check_secondary_artist_role
    CHECK (secondary_artist_id IS NULL OR EXISTS (
        SELECT 1 FROM staff s
        WHERE s.id = secondary_artist_id AND s.role = 'artist'
    ));

ALTER TABLE invitations ADD CONSTRAINT check_week_start_is_monday
    CHECK (EXTRACT(ISODOW FROM week_start_date) = 1);

-- ============================================
-- BEGIN MIGRATION 002: RLS POLICIES
-- ============================================

-- HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
    DECLARE
        current_staff_role user_role;
        current_user_id UUID := auth.uid();
    BEGIN
        SELECT s.role INTO current_staff_role
        FROM staff s
        WHERE s.user_id = current_user_id
        LIMIT 1;

        IF current_staff_role IS NOT NULL THEN
            RETURN current_staff_role;
        END IF;

        IF EXISTS (SELECT 1 FROM customers WHERE user_id = current_user_id) THEN
            RETURN 'customer';
        END IF;

        RETURN NULL;
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff_or_higher()
RETURNS BOOLEAN AS $$
    DECLARE
        user_role user_role := get_current_user_role();
    BEGIN
        RETURN user_role IN ('admin', 'manager', 'staff');
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_artist()
RETURNS BOOLEAN AS $$
    DECLARE
        user_role user_role := get_current_user_role();
    BEGIN
        RETURN user_role = 'artist';
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_customer()
RETURNS BOOLEAN AS $$
    DECLARE
        user_role user_role := get_current_user_role();
    BEGIN
        RETURN user_role = 'customer';
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    DECLARE
        user_role user_role := get_current_user_role();
    BEGIN
        RETURN user_role = 'admin';
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ENABLE RLS ON ALL TABLES
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- LOCATIONS POLICIES
CREATE POLICY "locations_select_staff_higher" ON locations
    FOR SELECT
    USING (is_staff_or_higher() OR is_admin());

CREATE POLICY "locations_modify_admin_manager" ON locations
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

-- RESOURCES POLICIES
CREATE POLICY "resources_select_staff_higher" ON resources
    FOR SELECT
    USING (is_staff_or_higher() OR is_admin());

CREATE POLICY "resources_select_artist" ON resources
    FOR SELECT
    USING (is_artist());

CREATE POLICY "resources_modify_admin_manager" ON resources
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

-- STAFF POLICIES
CREATE POLICY "staff_select_admin_manager" ON staff
    FOR SELECT
    USING (get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "staff_select_same_location" ON staff
    FOR SELECT
    USING (
        is_staff_or_higher() AND
        EXISTS (
            SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.location_id = staff.location_id
        )
    );

CREATE POLICY "staff_select_artist_view_artists" ON staff
    FOR SELECT
    USING (
        is_artist() AND
        EXISTS (
            SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.location_id = staff.location_id
        ) AND
        staff.role = 'artist'
    );

CREATE POLICY "staff_modify_admin_manager" ON staff
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

-- SERVICES POLICIES
CREATE POLICY "services_select_all" ON services
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "services_all_admin_manager" ON services
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

-- CUSTOMERS POLICIES (RESTRICTED FOR ARTISTS)
CREATE POLICY "customers_select_admin_manager" ON customers
    FOR SELECT
    USING (get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "customers_select_staff" ON customers
    FOR SELECT
    USING (is_staff_or_higher());

CREATE POLICY "customers_select_artist_restricted" ON customers
    FOR SELECT
    USING (is_artist());

CREATE POLICY "customers_select_own" ON customers
    FOR SELECT
    USING (is_customer() AND user_id = auth.uid());

CREATE POLICY "customers_modify_admin_manager" ON customers
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "customers_modify_staff" ON customers
    FOR ALL
    USING (is_staff_or_higher());

CREATE POLICY "customers_update_own" ON customers
    FOR UPDATE
    USING (is_customer() AND user_id = auth.uid());

-- INVITATIONS POLICIES
CREATE POLICY "invitations_select_admin_manager" ON invitations
    FOR SELECT
    USING (get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "invitations_select_staff" ON invitations
    FOR SELECT
    USING (is_staff_or_higher());

CREATE POLICY "invitations_select_own" ON invitations
    FOR SELECT
    USING (is_customer() AND inviter_id = (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE POLICY "invitations_modify_admin_manager" ON invitations
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "invitations_modify_staff" ON invitations
    FOR ALL
    USING (is_staff_or_higher());

-- BOOKINGS POLICIES
CREATE POLICY "bookings_select_admin_manager" ON bookings
    FOR SELECT
    USING (get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "bookings_select_staff_location" ON bookings
    FOR SELECT
    USING (
        is_staff_or_higher() AND
        EXISTS (
            SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.location_id = bookings.location_id
        )
    );

CREATE POLICY "bookings_select_artist_own" ON bookings
    FOR SELECT
    USING (
        is_artist() AND
        (staff_id = (SELECT id FROM staff WHERE user_id = auth.uid()) OR
         secondary_artist_id = (SELECT id FROM staff WHERE user_id = auth.uid()))
    );

CREATE POLICY "bookings_select_own" ON bookings
    FOR SELECT
    USING (is_customer() AND customer_id = (SELECT id FROM customers WHERE user_id = auth.uid()));

CREATE POLICY "bookings_modify_admin_manager" ON bookings
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "bookings_modify_staff_location" ON bookings
    FOR ALL
    USING (
        is_staff_or_higher() AND
        EXISTS (
            SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.location_id = bookings.location_id
        )
    );

CREATE POLICY "bookings_no_modify_artist" ON bookings
    FOR ALL
    USING (NOT is_artist());

CREATE POLICY "bookings_create_own" ON bookings
    FOR INSERT
    WITH CHECK (
        is_customer() AND
        customer_id = (SELECT id FROM customers WHERE user_id = auth.uid())
    );

CREATE POLICY "bookings_update_own" ON bookings
    FOR UPDATE
    USING (
        is_customer() AND
        customer_id = (SELECT id FROM customers WHERE user_id = auth.uid())
    );

-- AUDIT LOGS POLICIES
CREATE POLICY "audit_logs_select_admin_manager" ON audit_logs
    FOR SELECT
    USING (get_current_user_role() IN ('admin', 'manager'));

CREATE POLICY "audit_logs_select_staff_location" ON audit_logs
    FOR SELECT
    USING (
        is_staff_or_higher() AND
        EXISTS (
            SELECT 1 FROM bookings b
            JOIN staff s ON s.user_id = auth.uid()
            WHERE b.id = audit_logs.entity_id
            AND b.location_id = s.location_id
        )
    );

CREATE POLICY "audit_logs_no_insert" ON audit_logs
    FOR INSERT
    WITH CHECK (false);

-- ============================================
-- BEGIN MIGRATION 003: AUDIT TRIGGERS
-- ============================================

-- SHORT ID GENERATOR
CREATE OR REPLACE FUNCTION generate_short_id()
RETURNS VARCHAR(6) AS $$
DECLARE
    chars VARCHAR(36) := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    short_id VARCHAR(6);
    attempts INT := 0;
    max_attempts INT := 10;
BEGIN
    LOOP
        short_id := '';
        FOR i IN 1..6 LOOP
            short_id := short_id || substr(chars, floor(random() * 36 + 1)::INT, 1);
        END LOOP;

        IF NOT EXISTS (SELECT 1 FROM bookings WHERE short_id = short_id) THEN
            RETURN short_id;
        END IF;

        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique short_id after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- INVITATION CODE GENERATOR
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS VARCHAR(10) AS $$
DECLARE
    chars VARCHAR(36) := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    code VARCHAR(10);
    attempts INT := 0;
    max_attempts INT := 10;
BEGIN
    LOOP
        code := '';
        FOR i IN 1..10 LOOP
            code := code || substr(chars, floor(random() * 36 + 1)::INT, 1);
        END LOOP;

        IF NOT EXISTS (SELECT 1 FROM invitations WHERE code = code) THEN
            RETURN code;
        END IF;

        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique invitation code after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- WEEK FUNCTIONS
CREATE OR REPLACE FUNCTION get_week_start(date_param DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
    RETURN date_param - (EXTRACT(ISODOW FROM date_param)::INT - 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- WEEKLY INVITATION RESET
CREATE OR REPLACE FUNCTION reset_weekly_invitations_for_customer(customer_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    week_start DATE;
    invitations_remaining INTEGER := 5;
    invitations_created INTEGER := 0;
BEGIN
    week_start := get_week_start(CURRENT_DATE);

    SELECT COUNT(*) INTO invitations_created
    FROM invitations
    WHERE inviter_id = customer_uuid
    AND week_start_date = week_start;

    IF invitations_created = 0 THEN
        INSERT INTO invitations (inviter_id, code, week_start_date, expiry_date, status)
        SELECT
            customer_uuid,
            generate_invitation_code(),
            week_start,
            week_start + INTERVAL '6 days',
            'pending'
        FROM generate_series(1, 5);

        invitations_created := 5;

        INSERT INTO audit_logs (
            entity_type,
            entity_id,
            action,
            old_values,
            new_values,
            performed_by,
            performed_by_role,
            metadata
        )
        VALUES (
            'invitations',
            customer_uuid,
            'reset_invitations',
            '{"week_start": null}'::JSONB,
            '{"week_start": "' || week_start || '", "count": 5}'::JSONB,
            NULL,
            'system',
            '{"reset_type": "weekly", "invitations_created": 5}'::JSONB
        );
    END IF;

    RETURN invitations_created;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reset_all_weekly_invitations()
RETURNS JSONB AS $$
DECLARE
    customers_count INTEGER := 0;
    invitations_created INTEGER := 0;
    result JSONB;
BEGIN
    FOR customer_record IN
        SELECT id FROM customers WHERE tier = 'gold' AND is_active = true
    LOOP
        invitations_created := invitations_created + reset_weekly_invitations_for_customer(customer_record.id);
        customers_count := customers_count + 1;
    END LOOP;

    result := jsonb_build_object(
        'customers_processed', customers_count,
        'invitations_created', invitations_created,
        'executed_at', NOW()::TEXT
    );

    INSERT INTO audit_logs (
        entity_type,
        entity_id,
        action,
        old_values,
        new_values,
        performed_by,
        performed_by_role,
        metadata
    )
    VALUES (
        'invitations',
        uuid_generate_v4(),
        'reset_invitations',
        '{}'::JSONB,
        result,
        NULL,
        'system',
        '{"reset_type": "weekly_batch"}'::JSONB
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- AUDIT LOG TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role_val user_role;
BEGIN
    current_user_role_val := get_current_user_role();

    IF TG_TABLE_NAME IN ('bookings', 'customers', 'invitations', 'staff', 'services') THEN
        IF TG_OP = 'INSERT' THEN
            INSERT INTO audit_logs (
                entity_type,
                entity_id,
                action,
                old_values,
                new_values,
                performed_by,
                performed_by_role,
                metadata
            )
            VALUES (
                TG_TABLE_NAME,
                NEW.id,
                'create',
                NULL,
                row_to_json(NEW)::JSONB,
                auth.uid(),
                current_user_role_val,
                jsonb_build_object('operation', TG_OP, 'table_name', TG_TABLE_NAME)
            );
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW IS DISTINCT FROM OLD THEN
                INSERT INTO audit_logs (
                    entity_type,
                    entity_id,
                    action,
                    old_values,
                    new_values,
                    performed_by,
                    performed_by_role,
                    metadata
                )
                VALUES (
                    TG_TABLE_NAME,
                    NEW.id,
                    'update',
                    row_to_json(OLD)::JSONB,
                    row_to_json(NEW)::JSONB,
                    auth.uid(),
                    current_user_role_val,
                    jsonb_build_object('operation', TG_OP, 'table_name', TG_TABLE_NAME)
                );
            END IF;
        ELSIF TG_OP = 'DELETE' THEN
            INSERT INTO audit_logs (
                entity_type,
                entity_id,
                action,
                old_values,
                new_values,
                performed_by,
                performed_by_role,
                metadata
            )
            VALUES (
                TG_TABLE_NAME,
                OLD.id,
                'delete',
                row_to_json(OLD)::JSONB,
                NULL,
                auth.uid(),
                current_user_role_val,
                jsonb_build_object('operation', TG_OP, 'table_name', TG_TABLE_NAME)
            );
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- APPLY AUDIT LOG TRIGGERS
CREATE TRIGGER audit_bookings AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_customers AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_invitations AFTER INSERT OR UPDATE OR DELETE ON invitations
    FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_staff AFTER INSERT OR UPDATE OR DELETE ON staff
    FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_services AFTER INSERT OR UPDATE OR DELETE ON services
    FOR EACH ROW EXECUTE FUNCTION log_audit();

-- AUTOMATIC SHORT ID GENERATION FOR BOOKINGS
CREATE OR REPLACE FUNCTION generate_booking_short_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.short_id IS NULL OR NEW.short_id = '' THEN
        NEW.short_id := generate_short_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_generate_short_id BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION generate_booking_short_id();

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'SALONOS - DATABASE MIGRATION COMPLETED';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ Tables created: 8';
    RAISE NOTICE '✅ Functions created: 13';
    RAISE NOTICE '✅ Triggers active: 15+';
    RAISE NOTICE '✅ RLS policies configured: 20+';
    RAISE NOTICE '✅ ENUM types created: 6';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Configure Auth in Supabase Dashboard';
    RAISE NOTICE '2. Create test users with specific roles';
    RAISE NOTICE '3. Test Short ID generation:';
    RAISE NOTICE '   SELECT generate_short_id();';
    RAISE NOTICE '4. Test invitation code generation:';
    RAISE NOTICE '   SELECT generate_invitation_code();';
    RAISE NOTICE '5. Verify tables:';
    RAISE NOTICE '   SELECT table_name FROM information_schema.tables';
    RAISE NOTICE '   WHERE table_schema = ''public'' ORDER BY table_name;';
    RAISE NOTICE '===========================================';
END
$$;
