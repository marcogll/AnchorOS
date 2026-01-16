-- ============================================
-- TELEGRAM INTEGRATION Y SCORING SYSTEM
-- Agrega campos de Telegram y sistema de métricas
-- ============================================

-- ============================================
-- AGREGAR CAMPOS DE TELEGRAM A STAFF
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'telegram_id'
    ) THEN
        ALTER TABLE staff ADD COLUMN telegram_id BIGINT;
        
        CREATE INDEX idx_staff_telegram ON staff(telegram_id);
        
        RAISE NOTICE 'Added telegram_id to staff';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'email'
    ) THEN
        ALTER TABLE staff ADD COLUMN email VARCHAR(255);
        
        CREATE INDEX idx_staff_email ON staff(email);
        
        RAISE NOTICE 'Added email to staff';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'gmail'
    ) THEN
        ALTER TABLE staff ADD COLUMN gmail VARCHAR(255);
        
        CREATE INDEX idx_staff_gmail ON staff(gmail);
        
        RAISE NOTICE 'Added gmail to staff';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'google_account'
    ) THEN
        ALTER TABLE staff ADD COLUMN google_account VARCHAR(255);
        
        CREATE INDEX idx_staff_google ON staff(google_account);
        
        RAISE NOTICE 'Added google_account to staff';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'telegram_chat_id'
    ) THEN
        ALTER TABLE staff ADD COLUMN telegram_chat_id BIGINT;
        
        CREATE INDEX idx_staff_telegram_chat ON staff(telegram_chat_id);
        
        RAISE NOTICE 'Added telegram_chat_id to staff';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'telegram_notifications_enabled'
    ) THEN
        ALTER TABLE staff ADD COLUMN telegram_notifications_enabled BOOLEAN DEFAULT true;
        
        RAISE NOTICE 'Added telegram_notifications_enabled to staff';
    END IF;

END
$$;

-- ============================================
-- AGREGAR CAMPOS DE SCORING A STAFF
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'total_bookings_completed'
    ) THEN
        ALTER TABLE staff ADD COLUMN total_bookings_completed INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Added total_bookings_completed to staff';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'total_guarantees_count'
    ) THEN
        ALTER TABLE staff ADD COLUMN total_guarantees_count INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Added total_guarantees_count to staff';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'total_guarantees_amount'
    ) THEN
        ALTER TABLE staff ADD COLUMN total_guarantees_amount DECIMAL(10,2) DEFAULT 0.00;
        
        RAISE NOTICE 'Added total_guarantees_amount to staff';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'performance_score'
    ) THEN
        ALTER TABLE staff ADD COLUMN performance_score DECIMAL(5,2) DEFAULT 0.00;
        
        RAISE NOTICE 'Added performance_score to staff';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'staff'
        AND column_name = 'last_performance_update'
    ) THEN
        ALTER TABLE staff ADD COLUMN last_performance_update TIMESTAMPTZ;
        
        RAISE NOTICE 'Added last_performance_update to staff';
    END IF;
END
$$;

-- ============================================
-- CREAR TABLA TELEGRAM_NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS telegram_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type VARCHAR(50) NOT NULL, -- 'staff', 'group', 'all'
    recipient_id UUID, -- ID del staff si recipient_type = 'staff'
    telegram_chat_id BIGINT NOT NULL, -- Chat ID de Telegram
    message_type VARCHAR(50) NOT NULL, -- 'booking_created', 'booking_confirmed', 'booking_completed', 'guarantee_processed'
    message_content TEXT NOT NULL,
    booking_id UUID, -- Referencia opcional al booking
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREAR TABLA TELEGRAM_GROUPS
-- ============================================

CREATE TABLE IF NOT EXISTS telegram_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    group_name VARCHAR(100) NOT NULL,
    telegram_chat_id BIGINT UNIQUE NOT NULL,
    group_type VARCHAR(50) NOT NULL, -- 'general', 'artists', 'management', 'alerts'
    notifications_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREAR TABLA TELEGRAM_BOTS
-- ============================================

CREATE TABLE IF NOT EXISTS telegram_bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_name VARCHAR(100) NOT NULL UNIQUE,
    bot_token VARCHAR(255) NOT NULL UNIQUE,
    bot_username VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA TABLAS TELEGRAM
-- ============================================

CREATE INDEX IF NOT EXISTS idx_telegram_notifications_recipient ON telegram_notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_status ON telegram_notifications(status, created_at);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_booking ON telegram_notifications(booking_id);

CREATE INDEX IF NOT EXISTS idx_telegram_groups_location ON telegram_groups(location_id);
CREATE INDEX IF NOT EXISTS idx_telegram_groups_type ON telegram_groups(group_type);

-- ============================================
-- FUNCIÓN: ACTUALIZAR SCORING DE STAFF
-- ============================================

CREATE OR REPLACE FUNCTION update_staff_performance_score(p_staff_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_staff_record RECORD;
    v_completed_bookings INTEGER;
    v_guarantees_count INTEGER;
    v_guarantees_amount DECIMAL(10,2);
    v_performance_score DECIMAL(5,2);
BEGIN
    -- Obtener datos actuales del staff
    SELECT * INTO v_staff_record
    FROM staff
    WHERE id = p_staff_id;
    
    -- Contar bookings completados en el último mes
    SELECT COUNT(*) INTO v_completed_bookings
    FROM bookings
    WHERE staff_id = p_staff_id
    AND status = 'completed'
    AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Contar garantías procesadas (simulamos por bookings de servicios con garantía)
    -- En un sistema real, esto vendría de una tabla de garantías
    SELECT 
        COUNT(*) INTO v_guarantees_count,
        COALESCE(SUM(b.total_amount * 0.1), 0) INTO v_guarantees_amount
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    WHERE b.staff_id = p_staff_id
    AND b.status = 'completed'
    AND b.created_at >= NOW() - INTERVAL '30 days'
    AND (s.name ILIKE '%garant%' OR s.description ILIKE '%garant%');
    
    -- Calcular score de desempeño (base 100)
    -- +10 por cada booking completado
    -- +5 por cada garantía procesada
    -- +1 por cada $100 en garantías
    v_performance_score := 50.00 + 
        (v_completed_bookings * 10.00) +
        (v_guarantees_count * 5.00) +
        (v_guarantees_amount / 100.00 * 1.00);
    
    -- Limitar score entre 0 y 100
    v_performance_score := LEAST(v_performance_score, 100.00);
    v_performance_score := GREATEST(v_performance_score, 0.00);
    
    -- Actualizar staff
    UPDATE staff SET
        total_bookings_completed = v_completed_bookings,
        total_guarantees_count = v_guarantees_count,
        total_guarantees_amount = v_guarantees_amount,
        performance_score = v_performance_score,
        last_performance_update = NOW()
    WHERE id = p_staff_id;
    
    RETURN jsonb_build_object(
        'staff_id', p_staff_id,
        'completed_bookings', v_completed_bookings,
        'guarantees_count', v_guarantees_count,
        'guarantees_amount', v_guarantees_amount,
        'performance_score', v_performance_score
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: ACTUALIZAR SCORING AL COMPLETAR BOOKING
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_staff_performance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        PERFORM update_staff_performance_score(NEW.staff_id);
        
        IF NEW.secondary_artist_id IS NOT NULL THEN
            PERFORM update_staff_performance_score(NEW.secondary_artist_id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_performance_on_booking_complete ON bookings;
CREATE TRIGGER update_performance_on_booking_complete
AFTER UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_update_staff_performance();

-- ============================================
-- FUNCIÓN: ENVIAR NOTIFICACIÓN TELEGRAM
-- ============================================

CREATE OR REPLACE FUNCTION create_telegram_notification(
    p_recipient_type VARCHAR(50),
    p_recipient_id UUID,
    p_telegram_chat_id BIGINT,
    p_message_type VARCHAR(50),
    p_message_content TEXT,
    p_booking_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO telegram_notifications (
        recipient_type,
        recipient_id,
        telegram_chat_id,
        message_type,
        message_content,
        booking_id,
        status
    )
    VALUES (
        p_recipient_type,
        p_recipient_id,
        p_telegram_chat_id,
        p_message_type,
        p_message_content,
        p_booking_id,
        'pending'
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: NOTIFICAR CREACIÓN DE BOOKING
-- ============================================

CREATE OR REPLACE FUNCTION notify_booking_created()
RETURNS TRIGGER AS $$
DECLARE
    v_staff_telegram_id BIGINT;
    v_message TEXT;
BEGIN
    -- Solo notificar si el staff tiene telegram configurado
    SELECT telegram_chat_id INTO v_staff_telegram_id
    FROM staff
    WHERE id = NEW.staff_id
    AND telegram_chat_id IS NOT NULL
    AND telegram_notifications_enabled = true;
    
    IF v_staff_telegram_id IS NOT NULL THEN
        v_message := format('📅 NUEVA CITA ASIGNADA!%sCliente: %s%sServicio: %s%sHora: %s',
            E'\n',
            COALESCE((SELECT display_name FROM customers WHERE id = NEW.customer_id), 'Cliente'),
            E'\n',
            (SELECT name FROM services WHERE id = NEW.service_id),
            E'\n',
            to_char(NEW.start_time_utc, 'DD/MM/YYYY HH24:MI')
        );
        
        PERFORM create_telegram_notification(
            'staff',
            NEW.staff_id,
            v_staff_telegram_id,
            'booking_created',
            v_message,
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_booking_created_trigger ON bookings;
CREATE TRIGGER notify_booking_created_trigger
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_booking_created();

-- ============================================
-- TRIGGER: NOTIFICAR CONFIRMACIÓN DE BOOKING
-- ============================================

CREATE OR REPLACE FUNCTION notify_booking_confirmed()
RETURNS TRIGGER AS $$
DECLARE
    v_staff_telegram_id BIGINT;
    v_message TEXT;
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
        SELECT telegram_chat_id INTO v_staff_telegram_id
        FROM staff
        WHERE id = NEW.staff_id
        AND telegram_chat_id IS NOT NULL
        AND telegram_notifications_enabled = true;
        
        IF v_staff_telegram_id IS NOT NULL THEN
            v_message := format('✅ CITA CONFIRMADA!%sCódigo: %s%sCliente: %s%sHora: %s',
                E'\n',
                NEW.short_id,
                E'\n',
                COALESCE((SELECT display_name FROM customers WHERE id = NEW.customer_id), 'Cliente'),
                E'\n',
                to_char(NEW.start_time_utc, 'DD/MM/YYYY HH24:MI')
            );
            
            PERFORM create_telegram_notification(
                'staff',
                NEW.staff_id,
                v_staff_telegram_id,
                'booking_confirmed',
                v_message,
                NEW.id
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_booking_confirmed_trigger ON bookings;
CREATE TRIGGER notify_booking_confirmed_trigger
AFTER UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_booking_confirmed();

-- ============================================
-- TRIGGER: NOTIFICAR COMPLETADO DE BOOKING
-- ============================================

CREATE OR REPLACE FUNCTION notify_booking_completed()
RETURNS TRIGGER AS $$
DECLARE
    v_staff_telegram_id BIGINT;
    v_message TEXT;
    v_score_info JSONB;
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        SELECT telegram_chat_id INTO v_staff_telegram_id
        FROM staff
        WHERE id = NEW.staff_id
        AND telegram_chat_id IS NOT NULL
        AND telegram_notifications_enabled = true;
        
        IF v_staff_telegram_id IS NOT NULL THEN
            v_message := format('💅 CITA COMPLETADA!%sCódigo: %s%sCliente: %s%sServicio: %s%sTotal: $%s',
                    E'\n',
                    NEW.short_id,
                    E'\n',
                    COALESCE((SELECT display_name FROM customers WHERE id = NEW.customer_id), 'Cliente'),
                    E'\n',
                    (SELECT name FROM services WHERE id = NEW.service_id),
                    E'\n',
                    NEW.total_amount
                );
            
            PERFORM create_telegram_notification(
                'staff',
                NEW.staff_id,
                v_staff_telegram_id,
                'booking_completed',
                v_message,
                NEW.id
            );
            
            -- Enviar actualización de score
            v_score_info := update_staff_performance_score(NEW.staff_id);
            
            -- Mensaje con score
            IF v_score_info IS NOT NULL THEN
                v_message := format('📊 TU SCORE ACTUALIZADO!%sBookings completados: %d%sGarantías procesadas: %d ($%.2f)%sScore de desempeño: %.2f%s📈 ¡Sigue así!',
                            E'\n',
                            v_score_info->>'completed_bookings',
                            E'\n',
                            v_score_info->>'guarantees_count',
                            (v_score_info->>'guarantees_amount')::DECIMAL(10,2),
                            E'\n',
                            (v_score_info->>'performance_score')::DECIMAL(5,2),
                            E'\n'
                        );
                
                PERFORM create_telegram_notification(
                    'staff',
                    NEW.staff_id,
                    v_staff_telegram_id,
                    'performance_update',
                    v_message,
                    NEW.id
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_booking_completed_trigger ON bookings;
CREATE TRIGGER notify_booking_completed_trigger
AFTER UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_booking_completed();

-- ============================================
-- FUNCIÓN: ENVIAR NOTIFICACIÓN A GRUPO TELEGRAM
-- ============================================

CREATE OR REPLACE FUNCTION notify_telegram_group(
    p_group_id UUID,
    p_message_type VARCHAR(50),
    p_message_content TEXT,
    p_booking_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_group_record RECORD;
    v_notification_id UUID;
BEGIN
    SELECT * INTO v_group_record
    FROM telegram_groups
    WHERE id = p_group_id
    AND notifications_enabled = true;
    
    IF v_group_record.id IS NULL THEN
        RAISE EXCEPTION 'Telegram group not found or notifications disabled';
    END IF;
    
    v_notification_id := create_telegram_notification(
        'group',
        NULL,
        v_group_record.telegram_chat_id,
        p_message_type,
        p_message_content,
        p_booking_id
    );
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: OBTENER STAFF TOP POR SCORE
-- ============================================

CREATE OR REPLACE FUNCTION get_top_performers(p_location_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    staff_id UUID,
    display_name VARCHAR,
    role VARCHAR,
    performance_score DECIMAL(5,2),
    total_bookings_completed INTEGER,
    total_guarantees_count INTEGER,
    total_guarantees_amount DECIMAL(10,2),
    last_performance_update TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.display_name,
        s.role,
        s.performance_score,
        s.total_bookings_completed,
        s.total_guarantees_count,
        s.total_guarantees_amount,
        s.last_performance_update
    FROM staff s
    WHERE s.location_id = p_location_id
    AND s.is_active = true
    AND s.role IN ('artist', 'staff', 'manager')
    ORDER BY s.performance_score DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCIÓN: OBTENER RESUMEN DE SCORES
-- ============================================

CREATE OR REPLACE FUNCTION get_performance_summary(p_location_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'top_performers', jsonb_agg(
            jsonb_build_object(
                'staff_id', id,
                'display_name', display_name,
                'score', performance_score,
                'bookings', total_bookings_completed,
                'guarantees', total_guarantees_count,
                'guarantees_amount', total_guarantees_amount
            )
        ),
        'average_score', AVG(performance_score),
        'total_bookings', SUM(total_bookings_completed),
        'total_guarantees', SUM(total_guarantees_count),
        'total_guarantees_amount', SUM(total_guarantees_amount),
        'location_id', p_location_id
    ) INTO v_summary
    FROM staff
    WHERE location_id = p_location_id
    AND is_active = true
    AND role IN ('artist', 'staff', 'manager');
    
    RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICACIÓN
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'TELEGRAM INTEGRATION COMPLETED';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ Campos agregados a staff:';
    RAISE NOTICE '   - telegram_id';
    RAISE NOTICE '   - email';
    RAISE NOTICE '   - gmail';
    RAISE NOTICE '   - google_account';
    RAISE NOTICE '   - telegram_chat_id';
    RAISE NOTICE '   - telegram_notifications_enabled';
    RAISE NOTICE '   - total_bookings_completed';
    RAISE NOTICE '   - total_guarantees_count';
    RAISE NOTICE '   - total_guarantees_amount';
    RAISE NOTICE '   - performance_score';
    RAISE NOTICE '   - last_performance_update';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ Nuevas tablas creadas:';
    RAISE NOTICE '   - telegram_notifications';
    RAISE NOTICE '   - telegram_groups';
    RAISE NOTICE '   - telegram_bots';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ Funciones de scoring creadas:';
    RAISE NOTICE '   - update_staff_performance_score()';
    RAISE NOTICE '   - get_top_performers()';
    RAISE NOTICE '   - get_performance_summary()';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ Triggers automáticos:';
    RAISE NOTICE '   - Notificar al crear booking';
    RAISE NOTICE '   - Notificar al confirmar booking';
    RAISE NOTICE '   - Notificar al completar booking';
    RAISE NOTICE '   - Actualizar score al completar booking';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'PRÓXIMOS PASOS:';
    RAISE NOTICE '1. Crear bot de Telegram';
    RAISE NOTICE '2. Configurar webhook del bot';
    RAISE NOTICE '3. Agregar grupos de Telegram';
    RAISE NOTICE '4. Asignar chat IDs a staff';
    RAISE NOTICE '5. Implementar API de envío de mensajes';
    RAISE NOTICE '==========================================';
END
$$;
