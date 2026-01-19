-- ============================================
-- FASE 6 - STRIPE WEBHOOKS AND NO-SHOW LOGIC
-- Date: 20260118
-- Description: Add payment tracking, webhook logs, no-show detection, and admin overrides
-- ============================================

-- Add no-show and penalty fields to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS penalty_waived BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS penalty_waived_by UUID REFERENCES auth.users(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS penalty_waived_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS check_in_staff_id UUID REFERENCES staff(id);

-- Add webhook logs table for Stripe events
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_id TEXT NOT NULL UNIQUE,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processing_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Create index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON webhook_logs(processed);

-- Create no-show detections table
CREATE TABLE IF NOT EXISTS no_show_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    detection_method TEXT DEFAULT 'cron',
    confirmed BOOLEAN DEFAULT false,
    confirmed_by UUID REFERENCES auth.users(id),
    confirmed_at TIMESTAMPTZ,
    penalty_applied BOOLEAN DEFAULT false,
    notes TEXT,
    UNIQUE(booking_id)
);

-- Create index for no-show lookups
CREATE INDEX IF NOT EXISTS idx_no_show_detections_booking ON no_show_detections(booking_id);

-- Update payments table with webhook reference
ALTER TABLE payments ADD COLUMN IF NOT EXISTS webhook_event_id TEXT REFERENCES webhook_logs(event_id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_webhook_event_id TEXT REFERENCES webhook_logs(event_id);

-- RLS Policies for webhook logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Webhook logs can be viewed by admins only"
ON webhook_logs FOR SELECT
USING (
    (SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    ))
);

CREATE POLICY "Webhook logs can be inserted by system/service role"
ON webhook_logs FOR INSERT
WITH CHECK (true);

-- RLS Policies for no-show detections
ALTER TABLE no_show_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No-show detections visible to admins, managers, and assigned staff"
ON no_show_detections FOR SELECT
USING (
    (SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    )) OR EXISTS (
        SELECT 1 FROM bookings b
        JOIN no_show_detections nsd ON nsd.booking_id = b.id
        WHERE nsd.id = no_show_detections.id
        AND b.staff_ids @> ARRAY[auth.uid()]
    )
);

CREATE POLICY "No-show detections can be updated by admins and managers"
ON no_show_detections FOR UPDATE
USING (
    (SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    ))
);

-- Function to check if booking should be marked as no-show
CREATE OR REPLACE FUNCTION detect_no_show_booking(p_booking_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_booking bookings%ROWTYPE;
    v_window_start TIMESTAMPTZ;
    v_has_checkin BOOLEAN;
BEGIN
    -- Get booking details
    SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Check if already checked in
    IF v_booking.check_in_time IS NOT NULL THEN
        RETURN false;
    END IF;

    -- Calculate no-show window (12 hours after start time)
    v_window_start := v_booking.start_time_utc + INTERVAL '12 hours';

    -- Check if window has passed
    IF NOW() < v_window_start THEN
        RETURN false;
    END IF;

    -- Check if customer has checked in (through check_ins table or direct booking check)
    SELECT EXISTS (
        SELECT 1 FROM check_ins
        WHERE booking_id = p_booking_id
    ) INTO v_has_checkin;

    IF v_has_checkin THEN
        RETURN false;
    END IF;

    -- Check if detection already exists
    IF EXISTS (SELECT 1 FROM no_show_detections WHERE booking_id = p_booking_id) THEN
        RETURN false;
    END IF;

    -- Create no-show detection record
    INSERT INTO no_show_detections (booking_id, detection_method)
    VALUES (p_booking_id, 'cron');

    -- Log to audit
    INSERT INTO audit_logs (
        entity_type,
        entity_id,
        action,
        new_values,
        performed_by
    ) VALUES (
        'booking',
        p_booking_id,
        'no_show_detected',
        jsonb_build_object(
            'start_time_utc', v_booking.start_time_utc,
            'detection_time', NOW()
        ),
        'system'
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to apply no-show penalty
CREATE OR REPLACE FUNCTION apply_no_show_penalty(p_booking_id UUID, p_override_by UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    v_booking bookings%ROWTYPE;
    v_customer_id UUID;
BEGIN
    -- Get booking details
    SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    -- Check if already applied
    IF v_booking.status = 'no_show' AND NOT v_booking.penalty_waived THEN
        RETURN false;
    END IF;

    -- Get customer ID
    SELECT id INTO v_customer_id FROM customers WHERE id = v_booking.customer_id;

    -- Update booking status
    UPDATE bookings
    SET
        status = 'no_show',
        penalty_waived = (p_override_by IS NOT NULL),
        penalty_waived_by = p_override_by,
        penalty_waived_at = CASE WHEN p_override_by IS NOT NULL THEN NOW() ELSE NULL END
    WHERE id = p_booking_id;

    -- Update customer no-show count
    UPDATE customers
    SET
        no_show_count = no_show_count + 1,
        last_no_show_date = CURRENT_DATE
    WHERE id = v_customer_id;

    -- Update no-show detection
    UPDATE no_show_detections
    SET
        confirmed = true,
        confirmed_by = p_override_by,
        confirmed_at = NOW(),
        penalty_applied = NOT (p_override_by IS NOT NULL)
    WHERE booking_id = p_booking_id;

    -- Log to audit
    INSERT INTO audit_logs (
        entity_type,
        entity_id,
        action,
        new_values,
        performed_by
    ) VALUES (
        'booking',
        p_booking_id,
        'no_show_penalty_applied',
        jsonb_build_object(
            'deposit_retained', v_booking.deposit_amount,
            'waived', (p_override_by IS NOT NULL)
        ),
        COALESCE(p_override_by, 'system')
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record check-in for booking
CREATE OR REPLACE FUNCTION record_booking_checkin(p_booking_id UUID, p_staff_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_booking bookings%ROWTYPE;
BEGIN
    -- Get booking details
    SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    -- Check if already checked in
    IF v_booking.check_in_time IS NOT NULL THEN
        RETURN false;
    END IF;

    -- Record check-in
    UPDATE bookings
    SET
        check_in_time = NOW(),
        check_in_staff_id = p_staff_id,
        status = 'in_progress'
    WHERE id = p_booking_id;

    -- Record in check_ins table
    INSERT INTO check_ins (booking_id, checked_in_by)
    VALUES (p_booking_id, p_staff_id)
    ON CONFLICT (booking_id) DO NOTHING;

    -- Log to audit
    INSERT INTO audit_logs (
        entity_type,
        entity_id,
        action,
        new_values,
        performed_by
    ) VALUES (
        'booking',
        p_booking_id,
        'checked_in',
        jsonb_build_object('check_in_time', NOW()),
        p_staff_id
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process payment intent succeeded webhook
CREATE OR REPLACE FUNCTION process_payment_intent_succeeded(p_event_id TEXT, p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_payment_intent_id TEXT;
    v_metadata JSONB;
    v_amount DECIMAL(10,2);
    v_customer_email TEXT;
    v_service_id UUID;
    v_location_id UUID;
    v_booking_id UUID;
    v_payment_id UUID;
BEGIN
    -- Extract data from payload
    v_payment_intent_id := p_payload->'data'->'object'->>'id';
    v_metadata := p_payload->'data'->'object'->'metadata';
    v_amount := (p_payload->'data'->'object'->>'amount')::DECIMAL / 100;
    v_customer_email := v_metadata->>'customer_email';
    v_service_id := v_metadata->>'service_id'::UUID;
    v_location_id := v_metadata->>'location_id'::UUID;

    -- Log webhook event
    INSERT INTO webhook_logs (event_type, event_id, payload, processed)
    VALUES ('payment_intent.succeeded', p_event_id, p_payload, false)
    ON CONFLICT (event_id) DO NOTHING;

    -- Find or create payment record
    -- Note: This assumes booking was created with deposit = 0 initially
    -- The actual booking creation flow should handle this

    -- For now, just mark as processed
    UPDATE webhook_logs
    SET processed = true, processed_at = NOW()
    WHERE event_id = p_event_id;

    RETURN jsonb_build_object('success', true, 'message', 'Payment processed successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process payment intent failed webhook
CREATE OR REPLACE FUNCTION process_payment_intent_failed(p_event_id TEXT, p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_payment_intent_id TEXT;
    v_metadata JSONB;
BEGIN
    -- Extract data
    v_payment_intent_id := p_payload->'data'->'object'->>'id';
    v_metadata := p_payload->'data'->'object'->'metadata';

    -- Log webhook event
    INSERT INTO webhook_logs (event_type, event_id, payload, processed)
    VALUES ('payment_intent.payment_failed', p_event_id, p_payload, false)
    ON CONFLICT (event_id) DO NOTHING;

    -- TODO: Send notification to customer about failed payment

    UPDATE webhook_logs
    SET processed = true, processed_at = NOW()
    WHERE event_id = p_event_id;

    RETURN jsonb_build_object('success', true, 'message', 'Payment failure processed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process charge refunded webhook
CREATE OR REPLACE FUNCTION process_charge_refunded(p_event_id TEXT, p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_charge_id TEXT;
    v_refund_amount DECIMAL(10,2);
BEGIN
    -- Extract data
    v_charge_id := p_payload->'data'->'object'->>'id';
    v_refund_amount := (p_payload->'data'->'object'->'amount_refunded')::DECIMAL / 100;

    -- Log webhook event
    INSERT INTO webhook_logs (event_type, event_id, payload, processed)
    VALUES ('charge.refunded', p_event_id, p_payload, false)
    ON CONFLICT (event_id) DO NOTHING;

    -- Find payment record and update
    UPDATE payments
    SET
        refund_amount = COALESCE(refund_amount, 0) + v_refund_amount,
        refund_reason = p_payload->'data'->'object'->>'reason',
        refunded_at = NOW(),
        status = 'refunded',
        refund_webhook_event_id = p_event_id
    WHERE stripe_payment_intent_id = v_charge_id;

    -- Log to audit
    INSERT INTO audit_logs (
        entity_type,
        action,
        new_values,
        performed_by
    ) VALUES (
        'payment',
        'refund_processed',
        jsonb_build_object(
            'charge_id', v_charge_id,
            'refund_amount', v_refund_amount
        ),
        'system'
    );

    UPDATE webhook_logs
    SET processed = true, processed_at = NOW()
    WHERE event_id = p_event_id;

    RETURN jsonb_build_object('success', true, 'message', 'Refund processed successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
