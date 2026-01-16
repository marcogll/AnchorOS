-- ============================================
-- CREAR TABLAS DE DISPONIBILIDAD
-- ============================================

-- ============================================
-- AGREGAR CAMPOS DE HORARIO A STAFF
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'work_hours_start') THEN
        ALTER TABLE staff ADD COLUMN work_hours_start TIME;
        RAISE NOTICE 'Added work_hours_start to staff';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'work_hours_end') THEN
        ALTER TABLE staff ADD COLUMN work_hours_end TIME;
        RAISE NOTICE 'Added work_hours_end to staff';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'work_days') THEN
        ALTER TABLE staff ADD COLUMN work_days TEXT DEFAULT 'MON,TUE,WED,THU,FRI,SAT';
        RAISE NOTICE 'Added work_days to staff';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'is_available_for_booking') THEN
        ALTER TABLE staff ADD COLUMN is_available_for_booking BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_available_for_booking to staff';
    END IF;
END
$$;

-- ============================================
-- TABLA: booking_blocks
-- Bloqueos de tiempo para recursos específicos
-- ============================================

CREATE TABLE IF NOT EXISTS booking_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    start_time_utc TIMESTAMPTZ NOT NULL,
    end_time_utc TIMESTAMPTZ NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT booking_blocks_time_check CHECK (end_time_utc > start_time_utc)
);

CREATE INDEX idx_booking_blocks_location_time ON booking_blocks(location_id, start_time_utc, end_time_utc);
CREATE INDEX idx_booking_blocks_resource ON booking_blocks(resource_id);

-- ============================================
-- TABLA: staff_availability
-- Disponibilidad manual del staff por día
-- ============================================

CREATE TABLE IF NOT EXISTS staff_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    CONSTRAINT staff_availability_time_check CHECK (end_time > start_time),
    CONSTRAINT staff_availability_unique UNIQUE (staff_id, date)
);

CREATE INDEX idx_staff_availability_staff_date ON staff_availability(staff_id, date);

-- ============================================
-- FUNCIÓN: check_staff_work_hours
-- Verifica si el staff está en horario laboral
-- ============================================

CREATE OR REPLACE FUNCTION check_staff_work_hours(
    p_staff_id UUID,
    p_start_time_utc TIMESTAMPTZ,
    p_end_time_utc TIMESTAMPTZ,
    p_location_timezone TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_work_hours_start TIME;
    v_work_hours_end TIME;
    v_work_days TEXT;
    v_day_of_week TEXT;
    v_local_start TIME;
    v_local_end TIME;
BEGIN
    -- Obtener horario del staff
    SELECT 
        work_hours_start,
        work_hours_end,
        work_days
    INTO 
        v_work_hours_start,
        v_work_hours_end,
        v_work_days
    FROM staff
    WHERE id = p_staff_id;

    -- Si no tiene horario definido, asumir disponible 24/7
    IF v_work_hours_start IS NULL OR v_work_hours_end IS NULL THEN
        RETURN true;
    END IF;

    -- Obtener día de la semana en zona horaria local
    v_day_of_week := TO_CHAR(p_start_time_utc AT TIME ZONE p_location_timezone, 'DY');

    -- Verificar si trabaja ese día
    IF v_work_days IS NULL OR NOT (',' || v_work_days || ',') LIKE ('%,' || v_day_of_week || ',%') THEN
        RETURN false;
    END IF;

    -- Convertir horas UTC a horario local
    v_local_start := (p_start_time_utc AT TIME ZONE p_location_timezone)::TIME;
    v_local_end := (p_end_time_utc AT TIME ZONE p_location_timezone)::TIME;

    -- Verificar si está dentro del horario laboral
    RETURN v_local_start >= v_work_hours_start AND v_local_end <= v_work_hours_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: check_staff_availability
-- Verifica disponibilidad completa del staff
-- ============================================

CREATE OR REPLACE FUNCTION check_staff_availability(
    p_staff_id UUID,
    p_start_time_utc TIMESTAMPTZ,
    p_end_time_utc TIMESTAMPTZ,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_work_hours BOOLEAN;
    v_has_booking_conflict BOOLEAN;
    v_has_manual_block BOOLEAN;
    v_location_timezone TEXT;
BEGIN
    -- Obtener zona horaria de la ubicación del staff
    SELECT timezone INTO v_location_timezone
    FROM locations
    WHERE id = (SELECT location_id FROM staff WHERE id = p_staff_id);

    -- Verificar horario laboral
    v_is_work_hours := check_staff_work_hours(p_staff_id, p_start_time_utc, p_end_time_utc, v_location_timezone);

    IF NOT v_is_work_hours THEN
        RETURN false;
    END IF;

    -- Verificar conflictos con otras reservas
    SELECT EXISTS(
        SELECT 1
        FROM bookings
        WHERE staff_id = p_staff_id
        AND status NOT IN ('cancelled', 'no_show')
        AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
        AND NOT (p_end_time_utc <= start_time_utc OR p_start_time_utc >= end_time_utc)
    ) INTO v_has_booking_conflict;

    IF v_has_booking_conflict THEN
        RETURN false;
    END IF;

    -- Verificar bloques manuales de disponibilidad
    SELECT EXISTS(
        SELECT 1
        FROM staff_availability
        WHERE staff_id = p_staff_id
        AND date = (p_start_time_utc AT TIME ZONE v_location_timezone)::DATE
        AND is_available = false
        AND NOT (p_end_time_utc AT TIME ZONE v_location_timezone::TIME <= start_time
               OR p_start_time_utc AT TIME ZONE v_location_timezone::TIME >= end_time)
    ) INTO v_has_manual_block;

    IF v_has_manual_block THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: get_available_staff
-- Obtiene staff disponible para un rango de tiempo
-- ============================================

CREATE OR REPLACE FUNCTION get_available_staff(
    p_location_id UUID,
    p_start_time_utc TIMESTAMPTZ,
    p_end_time_utc TIMESTAMPTZ
)
RETURNS TABLE (
    staff_id UUID,
    staff_name TEXT,
    role TEXT,
    work_hours_start TIME,
    work_hours_end TIME,
    work_days TEXT,
    location_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id::UUID,
        s.display_name::TEXT,
        s.role::TEXT,
        s.work_hours_start::TIME,
        s.work_hours_end::TIME,
        s.work_days::TEXT,
        s.location_id
    FROM staff s
    WHERE s.location_id = p_location_id
    AND s.is_active = true
    AND s.is_available_for_booking = true
    AND s.role IN ('artist', 'staff', 'manager')
    AND check_staff_availability(s.id, p_start_time_utc, p_end_time_utc)
    ORDER BY
        CASE s.role
            WHEN 'manager' THEN 1
            WHEN 'staff' THEN 2
            WHEN 'artist' THEN 3
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: get_detailed_availability
-- Obtiene slots de tiempo disponibles
-- ============================================

CREATE OR REPLACE FUNCTION get_detailed_availability(
    p_location_id UUID,
    p_service_id UUID,
    p_date DATE,
    p_time_slot_duration_minutes INTEGER DEFAULT 60
)
RETURNS JSONB AS $$
DECLARE
    v_service_duration INTEGER;
    v_location_timezone TEXT;
    v_start_time TIME := '09:00'::TIME;
    v_end_time TIME := '21:00'::TIME;
    v_time_slots JSONB := '[]'::JSONB;
    v_slot_start TIMESTAMPTZ;
    v_slot_end TIMESTAMPTZ;
    v_available_staff_count INTEGER;
BEGIN
    -- Obtener duración del servicio
    SELECT duration_minutes INTO v_service_duration
    FROM services
    WHERE id = p_service_id;

    IF v_service_duration IS NULL THEN
        RETURN '[]'::JSONB;
    END IF;

    -- Obtener zona horaria de la ubicación
    SELECT timezone INTO v_location_timezone
    FROM locations
    WHERE id = p_location_id;

    IF v_location_timezone IS NULL THEN
        RETURN '[]'::JSONB;
    END IF;

    -- Generar slots de tiempo para el día
    v_slot_start := (p_date || ' ' || v_start_time::TEXT)::TIMESTAMPTZ
        AT TIME ZONE v_location_timezone;

    v_slot_end := (p_date || ' ' || v_end_time::TEXT)::TIMESTAMPTZ
        AT TIME ZONE v_location_timezone;

    -- Iterar por cada slot
    WHILE v_slot_start < v_slot_end LOOP
        -- Verificar staff disponible para este slot
        SELECT COUNT(*) INTO v_available_staff_count
        FROM (
            SELECT 1
            FROM staff s
            WHERE s.location_id = p_location_id
            AND s.is_active = true
            AND s.is_available_for_booking = true
            AND s.role IN ('artist', 'staff', 'manager')
            AND check_staff_availability(s.id, v_slot_start, v_slot_start + (v_service_duration || ' minutes')::INTERVAL)
        ) AS available_staff;

        -- Agregar slot al resultado
        IF v_available_staff_count > 0 THEN
            v_time_slots := v_time_slots || jsonb_build_object(
                'start_time', v_slot_start::TEXT,
                'end_time', (v_slot_start + (p_time_slot_duration_minutes || ' minutes')::INTERVAL)::TEXT,
                'available', true,
                'available_staff_count', v_available_staff_count
            );
        END IF;

        -- Avanzar al siguiente slot
        v_slot_start := v_slot_start + (p_time_slot_duration_minutes || ' minutes')::INTERVAL;
    END LOOP;

    RETURN v_time_slots;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICACIÓN
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'SISTEMA DE DISPONIBILIDAD COMPLETADO';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Tablas creadas:';
    RAISE NOTICE '  - booking_blocks';
    RAISE NOTICE '  - staff_availability';
    RAISE NOTICE 'Funciones RPC creadas:';
    RAISE NOTICE '  - check_staff_work_hours';
    RAISE NOTICE '  - check_staff_availability';
    RAISE NOTICE '  - get_available_staff';
    RAISE NOTICE '  - get_detailed_availability';
    RAISE NOTICE '==========================================';
END
$$;
