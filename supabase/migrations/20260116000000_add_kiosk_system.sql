-- ============================================
-- SALONOS - KIOSK IMPLEMENTATION
-- Agregar rol 'kiosk' y tabla kiosks al sistema
-- ============================================

-- ============================================
-- AGREGAR ROL 'kiosk' AL ENUM user_role
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'kiosk' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) THEN
        ALTER TYPE user_role ADD VALUE 'kiosk' BEFORE 'customer';
    END IF;
END $$;

-- ============================================
-- CREAR TABLA KIOSKS
-- ============================================

CREATE TABLE IF NOT EXISTS kiosks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    ip_address INET,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREAR ÍNDICES PARA KIOSKS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_kiosks_location ON kiosks(location_id);
CREATE INDEX IF NOT EXISTS idx_kiosks_api_key ON kiosks(api_key);
CREATE INDEX IF NOT EXISTS idx_kiosks_active ON kiosks(is_active);
CREATE INDEX IF NOT EXISTS idx_kiosks_ip ON kiosks(ip_address);

-- ============================================
-- CREAR TRIGGER UPDATE_AT PARA KIOSKS
-- ============================================

DROP TRIGGER IF EXISTS kiosks_updated_at ON kiosks;
CREATE TRIGGER kiosks_updated_at BEFORE UPDATE ON kiosks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCIÓN PARA GENERAR API KEY
-- ============================================

CREATE OR REPLACE FUNCTION generate_kiosk_api_key()
RETURNS VARCHAR(64) AS $$
DECLARE
    chars VARCHAR(62) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    api_key VARCHAR(64);
    attempts INT := 0;
    max_attempts INT := 10;
BEGIN
    LOOP
        api_key := '';
        FOR i IN 1..64 LOOP
            api_key := api_key || substr(chars, floor(random() * 62 + 1)::INT, 1);
        END LOOP;

        IF NOT EXISTS (SELECT 1 FROM kiosks WHERE api_key = api_key) THEN
            RETURN api_key;
        END IF;

        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Failed to generate unique api_key after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN PARA OBTENER KIOSK ACTUAL
-- ============================================

CREATE OR REPLACE FUNCTION get_current_kiosk_id()
RETURNS UUID AS $$
    DECLARE
        current_kiosk_id UUID;
        api_key_param TEXT;
    BEGIN
        api_key_param := current_setting('app.kiosk_api_key', true);
        
        IF api_key_param IS NOT NULL THEN
            SELECT id INTO current_kiosk_id
            FROM kiosks
            WHERE api_key = api_key_param AND is_active = true
            LIMIT 1;
        END IF;
        
        RETURN current_kiosk_id;
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN HELPER is_kiosk()
-- ============================================

CREATE OR REPLACE FUNCTION is_kiosk()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_current_kiosk_id() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN PARA OBTENER LOCATION DEL KIOSK ACTUAL
-- ============================================

CREATE OR REPLACE FUNCTION get_current_kiosk_location_id()
RETURNS UUID AS $$
    DECLARE
        location_id UUID;
    BEGIN
        SELECT location_id INTO location_id
        FROM kiosks
        WHERE id = get_current_kiosk_id();
        
        RETURN location_id;
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ENABLE RLS ON KIOSKS
-- ============================================

ALTER TABLE kiosks ENABLE ROW LEVEL SECURITY;

-- POLICY PARA KIOSKS: Solo admin/manager pueden ver/modificar
DROP POLICY IF EXISTS "kiosks_select_admin_manager" ON kiosks;
CREATE POLICY "kiosks_select_admin_manager" ON kiosks
    FOR SELECT
    USING (get_current_user_role() IN ('admin', 'manager'));

DROP POLICY IF EXISTS "kiosks_modify_admin_manager" ON kiosks;
CREATE POLICY "kiosks_modify_admin_manager" ON kiosks
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

-- ============================================
-- AUDIT LOG TRIGGER PARA KIOSKS
-- ============================================

DROP TRIGGER IF EXISTS audit_kiosks ON kiosks;
CREATE TRIGGER audit_kiosks AFTER INSERT OR UPDATE OR DELETE ON kiosks
    FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ============================================
-- POLÍTICAS RLS PARA KIOSK EN OTRAS TABLAS
-- ============================================

-- BOOKINGS: Kiosk puede ver bookings de su location (limitado)
DROP POLICY IF EXISTS "bookings_select_kiosk" ON bookings;
CREATE POLICY "bookings_select_kiosk" ON bookings
    FOR SELECT
    USING (
        is_kiosk() AND
        location_id = get_current_kiosk_location_id() AND
        status IN ('pending', 'confirmed')
    );

DROP POLICY IF EXISTS "bookings_create_kiosk" ON bookings;
CREATE POLICY "bookings_create_kiosk" ON bookings
    FOR INSERT
    WITH CHECK (
        is_kiosk() AND
        location_id = get_current_kiosk_location_id()
    );

DROP POLICY IF EXISTS "bookings_confirm_kiosk" ON bookings;
CREATE POLICY "bookings_confirm_kiosk" ON bookings
    FOR UPDATE
    USING (
        is_kiosk() AND
        location_id = get_current_kiosk_location_id() AND
        status = 'pending'
    )
    WITH CHECK (
        is_kiosk() AND
        location_id = get_current_kiosk_location_id() AND
        status = 'confirmed'
    );

-- RESOURCES: Kiosk puede ver recursos disponibles de su location
DROP POLICY IF EXISTS "resources_select_kiosk" ON resources;
CREATE POLICY "resources_select_kiosk" ON resources
    FOR SELECT
    USING (
        is_kiosk() AND
        location_id = get_current_kiosk_location_id() AND
        is_active = true
    );

-- SERVICES: Kiosk puede ver servicios activos (policy ya existe, pero agregamos comentario)
-- La policy services_select_all permite a cualquier usuario ver servicios activos

-- LOCATIONS: Kiosk solo puede ver su propia location
DROP POLICY IF EXISTS "locations_select_kiosk" ON locations;
CREATE POLICY "locations_select_kiosk" ON locations
    FOR SELECT
    USING (
        is_kiosk() AND
        id = get_current_kiosk_location_id()
    );

-- CUSTOMERS: Kiosk NO puede ver datos de clientes (PII restriction)
-- No se crea policy, por lo que el acceso es denegado

-- ============================================
-- FUNCIÓN PARA CREAR KIOSK (para admin/manager)
-- ============================================

CREATE OR REPLACE FUNCTION create_kiosk(
    p_location_id UUID,
    p_device_name VARCHAR(100),
    p_display_name VARCHAR(100),
    p_ip_address INET DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    new_kiosk_id UUID;
    new_api_key VARCHAR(64);
BEGIN
    IF get_current_user_role() NOT IN ('admin', 'manager') THEN
        RAISE EXCEPTION 'Only admin or manager can create kiosks';
    END IF;

    new_api_key := generate_kiosk_api_key();

    INSERT INTO kiosks (location_id, device_name, display_name, api_key, ip_address)
    VALUES (p_location_id, p_device_name, p_display_name, new_api_key, p_ip_address)
    RETURNING id INTO new_kiosk_id;

    RETURN jsonb_build_object(
        'kiosk_id', new_kiosk_id,
        'api_key', new_api_key,
        'message', 'Kiosk created successfully. Save the API key securely as it will not be shown again.'
    )::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN PARA OBTENER RECURSOS DISPONIBLES (CON PRIORIDAD)
-- ============================================

CREATE OR REPLACE FUNCTION get_available_resources_with_priority(
    p_location_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
    resource_id UUID,
    resource_name VARCHAR,
    resource_type resource_type,
    capacity INTEGER,
    priority INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id AS resource_id,
        r.name AS resource_name,
        r.type AS resource_type,
        r.capacity,
        CASE r.type
            WHEN 'station' THEN 1
            WHEN 'room' THEN 2
            WHEN 'equipment' THEN 3
        END AS priority
    FROM resources r
    WHERE r.location_id = p_location_id
    AND r.is_active = true
    AND NOT EXISTS (
        SELECT 1
        FROM bookings b
        WHERE b.resource_id = r.id
        AND b.status NOT IN ('cancelled', 'no_show')
        AND (
            (b.start_time_utc < p_end_time AND b.end_time_utc > p_start_time)
        )
    )
    ORDER BY priority, r.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA: KIOSKS DE PRUEBA
-- ============================================
-- Nota: Los kiosks se crearán manualmente vía UI de enrollment

-- ============================================
-- VERIFICACIÓN
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'SALONOS - KIOSK IMPLEMENTATION COMPLETED';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '✅ user_role enum updated with kiosk';
    RAISE NOTICE '✅ kiosks table created';
    RAISE NOTICE '✅ Indexes created';
    RAISE NOTICE '✅ Functions created:';
    RAISE NOTICE '   - generate_kiosk_api_key()';
    RAISE NOTICE '   - get_current_kiosk_id()';
    RAISE NOTICE '   - is_kiosk()';
    RAISE NOTICE '   - get_current_kiosk_location_id()';
    RAISE NOTICE '   - create_kiosk()';
    RAISE NOTICE '   - get_available_resources_with_priority()';
    RAISE NOTICE '✅ RLS policies created for kiosk';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Create additional kiosks using:';
    RAISE NOTICE '   SELECT create_kiosk(location_id, device_name, display_name);';
    RAISE NOTICE '2. Test kiosk authentication via API';
    RAISE NOTICE '3. Implement API routes in Next.js';
    RAISE NOTICE '===========================================';
END
$$;
