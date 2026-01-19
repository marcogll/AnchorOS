-- ============================================
-- FASE 6 - FINANCIAL REPORTING AND EXPENSES
-- Date: 20260118
-- Description: Add expenses tracking, financial reports, and daily closing
-- ============================================

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id),
    category TEXT NOT NULL CHECK (category IN ('supplies', 'maintenance', 'utilities', 'rent', 'salaries', 'marketing', 'other')),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'check')),
    receipt_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for expenses
CREATE INDEX IF NOT EXISTS idx_expenses_location ON expenses(location_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Create daily closing reports table
CREATE TABLE IF NOT EXISTS daily_closing_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id),
    report_date DATE NOT NULL,
    cashier_id UUID REFERENCES auth.users(id),
    total_sales DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    refunds_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    refunds_count INTEGER NOT NULL DEFAULT 0,
    discrepancies JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'final')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    pdf_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(location_id, report_date)
);

-- Create index for daily closing reports
CREATE INDEX IF NOT EXISTS idx_daily_closing_location_date ON daily_closing_reports(location_id, report_date);

-- Add transaction reference to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id TEXT UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cashier_id UUID REFERENCES auth.users(id);

-- RLS Policies for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expenses visible to admins, managers (location only)"
ON expenses FOR SELECT
USING (
    (SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )) OR (
        location_id = (SELECT raw_user_meta_data->>'location_id' FROM auth.users WHERE id = auth.uid())
        AND (SELECT EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'manager'
        ))
    )
);

CREATE POLICY "Expenses can be created by admins and managers"
ON expenses FOR INSERT
WITH CHECK (
    (SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    ))
);

CREATE POLICY "Expenses can be updated by admins and managers"
ON expenses FOR UPDATE
USING (
    (SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    ))
);

-- RLS Policies for daily closing reports
ALTER TABLE daily_closing_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily closing visible to admins, managers, and cashier"
ON daily_closing_reports FOR SELECT
USING (
    (SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )) OR (
        cashier_id = auth.uid()
    ) OR (
        location_id = (SELECT raw_user_meta_data->>'location_id' FROM auth.users WHERE id = auth.uid())
        AND (SELECT EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'manager'
        ))
    )
);

CREATE POLICY "Daily closing can be created by staff"
ON daily_closing_reports FOR INSERT
WITH CHECK (
    (SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager', 'staff')
    ))
);

CREATE POLICY "Daily closing can be reviewed by admins and managers"
ON daily_closing_reports FOR UPDATE
WHERE status = 'pending'
USING (
    (SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    ))
);

-- Function to generate daily closing report
CREATE OR REPLACE FUNCTION generate_daily_closing_report(p_location_id UUID, p_report_date DATE)
RETURNS UUID AS $$
DECLARE
    v_report_id UUID;
    v_location_id UUID;
    v_total_sales DECIMAL(10,2);
    v_payment_breakdown JSONB;
    v_transaction_count INTEGER;
    v_refunds_total DECIMAL(10,2);
    v_refunds_count INTEGER;
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
BEGIN
    -- Set time range (all day UTC, converted to location timezone)
    v_start_time := p_report_date::TIMESTAMPTZ;
    v_end_time := (p_report_date + INTERVAL '1 day')::TIMESTAMPTZ;

    -- Get or use location_id
    v_location_id := COALESCE(p_location_id, (SELECT id FROM locations LIMIT 1));

    -- Calculate total sales from completed bookings
    SELECT COALESCE(SUM(total_price), 0) INTO v_total_sales
    FROM bookings
    WHERE location_id = v_location_id
        AND status = 'completed'
        AND start_time_utc >= v_start_time
        AND start_time_utc < v_end_time;

    -- Get payment breakdown
    SELECT jsonb_object_agg(payment_method, total)
    INTO v_payment_breakdown
    FROM (
        SELECT payment_method, COALESCE(SUM(amount), 0) AS total
        FROM payments
        WHERE created_at >= v_start_time AND created_at < v_end_time
        GROUP BY payment_method
    ) AS breakdown;

    -- Count transactions
    SELECT COUNT(*) INTO v_transaction_count
    FROM payments
    WHERE created_at >= v_start_time AND created_at < v_end_time;

    -- Calculate refunds
    SELECT
        COALESCE(SUM(refund_amount), 0),
        COUNT(*)
    INTO v_refunds_total, v_refunds_count
    FROM payments
    WHERE refunded_at >= v_start_time AND refunded_at < v_end_time
        AND refunded_at IS NOT NULL;

    -- Create or update report
    INSERT INTO daily_closing_reports (
        location_id,
        report_date,
        cashier_id,
        total_sales,
        payment_breakdown,
        transaction_count,
        refunds_total,
        refunds_count,
        status
    ) VALUES (
        v_location_id,
        p_report_date,
        auth.uid(),
        v_total_sales,
        COALESCE(v_payment_breakdown, '{}'::jsonb),
        v_transaction_count,
        v_refunds_total,
        v_refunds_count,
        'pending'
    )
    ON CONFLICT (location_id, report_date) DO UPDATE SET
        total_sales = EXCLUDED.total_sales,
        payment_breakdown = EXCLUDED.payment_breakdown,
        transaction_count = EXCLUDED.transaction_count,
        refunds_total = EXCLUDED.refunds_total,
        refunds_count = EXCLUDED.refunds_count,
        cashier_id = auth.uid()
    RETURNING id INTO v_report_id;

    -- Log to audit
    INSERT INTO audit_logs (
        entity_type,
        entity_id,
        action,
        new_values,
        performed_by
    ) VALUES (
        'daily_closing_report',
        v_report_id,
        'generated',
        jsonb_build_object(
            'location_id', v_location_id,
            'report_date', p_report_date,
            'total_sales', v_total_sales
        ),
        auth.uid()
    );

    RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get financial summary for date range
CREATE OR REPLACE FUNCTION get_financial_summary(p_location_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS JSONB AS $$
DECLARE
    v_summary JSONB;
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
    v_total_revenue DECIMAL(10,2);
    v_total_expenses DECIMAL(10,2);
    v_net_profit DECIMAL(10,2);
    v_booking_count INTEGER;
    v_expense_breakdown JSONB;
BEGIN
    -- Set time range
    v_start_time := p_start_date::TIMESTAMPTZ;
    v_end_time := (p_end_date + INTERVAL '1 day')::TIMESTAMPTZ;

    -- Get total revenue
    SELECT COALESCE(SUM(total_price), 0) INTO v_total_revenue
    FROM bookings
    WHERE location_id = p_location_id
        AND status = 'completed'
        AND start_time_utc >= v_start_time
        AND start_time_utc < v_end_time;

    -- Get total expenses
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
    FROM expenses
    WHERE location_id = p_location_id
        AND expense_date >= p_start_date
        AND expense_date <= p_end_date;

    -- Calculate net profit
    v_net_profit := v_total_revenue - v_total_expenses;

    -- Get booking count
    SELECT COUNT(*) INTO v_booking_count
    FROM bookings
    WHERE location_id = p_location_id
        AND status IN ('completed', 'no_show')
        AND start_time_utc >= v_start_time
        AND start_time_utc < v_end_time;

    -- Get expense breakdown by category
    SELECT jsonb_object_agg(category, total)
    INTO v_expense_breakdown
    FROM (
        SELECT category, COALESCE(SUM(amount), 0) AS total
        FROM expenses
        WHERE location_id = p_location_id
            AND expense_date >= p_start_date
            AND expense_date <= p_end_date
        GROUP BY category
    ) AS breakdown;

    -- Build summary
    v_summary := jsonb_build_object(
        'location_id', p_location_id,
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'revenue', jsonb_build_object(
            'total', v_total_revenue,
            'booking_count', v_booking_count
        ),
        'expenses', jsonb_build_object(
            'total', v_total_expenses,
            'breakdown', COALESCE(v_expense_breakdown, '{}'::jsonb)
        ),
        'profit', jsonb_build_object(
            'net', v_net_profit,
            'margin', CASE WHEN v_total_revenue > 0 THEN (v_net_profit / v_total_revenue * 100)::DECIMAL(10,2) ELSE 0 END
        )
    );

    RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get staff performance report
CREATE OR REPLACE FUNCTION get_staff_performance_report(p_location_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS JSONB AS $$
DECLARE
    v_report JSONB;
    v_staff_list JSONB;
    v_start_time TIMESTAMPTZ;
    v_end_time TIMESTAMPTZ;
BEGIN
    -- Set time range
    v_start_time := p_start_date::TIMESTAMPTZ;
    v_end_time := (p_end_date + INTERVAL '1 day')::TIMESTAMPTZ;

    -- Build staff performance list
    SELECT jsonb_agg(
        jsonb_build_object(
            'staff_id', s.id,
            'staff_name', s.first_name || ' ' || s.last_name,
            'role', s.role,
            'bookings_completed', COALESCE(b_stats.count, 0),
            'revenue_generated', COALESCE(b_stats.revenue, 0),
            'hours_worked', COALESCE(b_stats.hours, 0),
            'tips_received', COALESCE(b_stats.tips, 0),
            'no_shows', COALESCE(b_stats.no_shows, 0)
        )
    ) INTO v_staff_list
    FROM staff s
    LEFT JOIN (
        SELECT
            unnest(staff_ids) AS staff_id,
            COUNT(*) AS count,
            SUM(total_price) AS revenue,
            SUM(EXTRACT(EPOCH FROM (end_time_utc - start_time_utc)) / 3600) AS hours,
            SUM(COALESCE(tips, 0)) AS tips,
            SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) AS no_shows
        FROM bookings
        WHERE location_id = p_location_id
            AND status IN ('completed', 'no_show')
            AND start_time_utc >= v_start_time
            AND start_time_utc < v_end_time
        GROUP BY unnest(staff_ids)
    ) b_stats ON s.id = b_stats.staff_id
    WHERE s.location_id = p_location_id
        AND s.is_active = true;

    -- Build report
    v_report := jsonb_build_object(
        'location_id', p_location_id,
        'period', jsonb_build_object(
            'start_date', p_start_date,
            'end_date', p_end_date
        ),
        'staff', COALESCE(v_staff_list, '[]'::jsonb)
    );

    RETURN v_report;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at trigger for expenses
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
