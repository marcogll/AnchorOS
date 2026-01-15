-- Migración 003: Funciones auxiliares y triggers de auditoría
-- Version: 003
-- Fecha: 2026-01-15
-- Descripción: Generador de Short ID, funciones de reset semanal de invitaciones y triggers de auditoría

-- ============================================
-- SHORT ID GENERATOR
-- ============================================

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

-- ============================================
-- INVITATION CODE GENERATOR
-- ============================================

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

-- ============================================
-- WEEKLY INVITATION RESET
-- ============================================

CREATE OR REPLACE FUNCTION get_week_start(date_param DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
    RETURN date_param - (EXTRACT(ISODOW FROM date_param)::INT - 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION reset_weekly_invitations_for_customer(customer_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    week_start DATE;
    invitations_remaining INTEGER := 5;
    invitations_created INTEGER := 0;
BEGIN
    week_start := get_week_start(CURRENT_DATE);

    -- Verificar si ya existen invitaciones para esta semana
    SELECT COUNT(*) INTO invitations_created
    FROM invitations
    WHERE inviter_id = customer_uuid
    AND week_start_date = week_start;

    -- Si no hay invitaciones para esta semana, crear las 5 nuevas
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

        -- Registrar en audit_logs
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
    customer_record RECORD;
BEGIN
    -- Resetear invitaciones solo para clientes Gold
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

    -- Registrar ejecución masiva
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

-- ============================================
-- AUDIT LOG TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
DECLARE
    current_user_role_val user_role;
BEGIN
    -- Obtener rol del usuario actual
    current_user_role_val := get_current_user_role();

    -- Solo auditar tablas críticas
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
            -- Solo auditar si hubo cambios relevantes
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

-- ============================================
-- APPLY AUDIT LOG TRIGGERS
-- ============================================

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

-- ============================================
-- AUTOMATIC SHORT ID GENERATION FOR BOOKINGS
-- ============================================

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
-- END OF MIGRATION 003
-- ============================================