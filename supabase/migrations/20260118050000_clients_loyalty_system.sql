-- ============================================
-- FASE 5 - CLIENTS AND LOYALTY SYSTEM
-- Date: 20260118
-- Description: Add customer notes, photo gallery, loyalty points, and membership plans
-- ============================================

-- Add customer notes and technical information
ALTER TABLE customers ADD COLUMN IF NOT EXISTS technical_notes TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS loyalty_points_expiry_date DATE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS no_show_count INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_no_show_date DATE;

-- Create customer photos table (for VIP/Black/Gold only)
CREATE TABLE IF NOT EXISTS customer_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    description TEXT,
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true
);

-- Create index for photos lookup
CREATE INDEX IF NOT EXISTS idx_customer_photos_customer ON customer_photos(customer_id);

-- Create loyalty transactions table
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'admin_adjustment')),
    description TEXT,
    reference_type TEXT,
    reference_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create index for loyalty lookup
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created ON loyalty_transactions(created_at DESC);

-- Create membership plans table
CREATE TABLE IF NOT EXISTS membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    tier TEXT NOT NULL CHECK (tier IN ('gold', 'black', 'VIP')),
    monthly_credits INTEGER DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    benefits JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customer subscriptions table
CREATE TABLE IF NOT EXISTS customer_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    membership_plan_id UUID NOT NULL REFERENCES membership_plans(id),
    start_date DATE NOT NULL,
    end_date DATE,
    auto_renew BOOLEAN DEFAULT false,
    credits_remaining INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'paused')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(customer_id, status)
);

-- Create index for subscriptions
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_customer ON customer_subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_subscriptions_status ON customer_subscriptions(status);

-- Insert default membership plans
INSERT INTO membership_plans (name, tier, monthly_credits, price, benefits) VALUES
('Gold Membership', 'gold', 5, 499.00, '{
    "weekly_invitations": 5,
    "priority_booking": false,
    "exclusive_services": [],
    "discount_percentage": 5,
    "photo_gallery": true
}'::jsonb),
('Black Membership', 'black', 10, 999.00, '{
    "weekly_invitations": 10,
    "priority_booking": true,
    "exclusive_services": ["spa_day", "premium_manicure"],
    "discount_percentage": 10,
    "photo_gallery": true,
    "priority_support": true
}'::jsonb),
('VIP Membership', 'VIP', 15, 1999.00, '{
    "weekly_invitations": 15,
    "priority_booking": true,
    "exclusive_services": ["spa_day", "premium_manicure", "exclusive_hair_treatment"],
    "discount_percentage": 20,
    "photo_gallery": true,
    "priority_support": true,
    "personal_stylist": true,
    "private_events": true
}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- RLS Policies for customer photos
ALTER TABLE customer_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos can be viewed by admins, managers, and customer owner"
ON customer_photos FOR SELECT
USING (
    (SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    )) OR customer_id = (SELECT id FROM customers WHERE user_id = auth.uid())
);

CREATE POLICY "Photos can be created by admins, managers, and assigned staff"
ON customer_photos FOR INSERT
WITH CHECK (
    (SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager', 'staff', 'artist')
    ))
);

CREATE POLICY "Photos can be deleted by admins and managers only"
ON customer_photos FOR DELETE
USING (
    (SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    ))
);

-- RLS Policies for loyalty transactions
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loyalty transactions visible to admins, managers, and customer owner"
ON loyalty_transactions FOR SELECT
USING (
    (SELECT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'manager')
    )) OR customer_id = (SELECT id FROM customers WHERE user_id = auth.uid())
);

-- Function to add loyalty points
CREATE OR REPLACE FUNCTION add_loyalty_points(
    p_customer_id UUID,
    p_points INTEGER,
    p_transaction_type TEXT DEFAULT 'earned',
    p_description TEXT,
    p_reference_type TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_transaction_id UUID;
    v_points_expiry_date DATE;
BEGIN
    -- Validate customer exists
    IF NOT EXISTS (SELECT 1 FROM customers WHERE id = p_customer_id) THEN
        RAISE EXCEPTION 'Customer not found';
    END IF;

    -- Calculate expiry date (6 months from now for earned points)
    IF p_transaction_type = 'earned' THEN
        v_points_expiry_date := (CURRENT_DATE + INTERVAL '6 months');
    END IF;

    -- Create transaction
    INSERT INTO loyalty_transactions (
        customer_id,
        points,
        transaction_type,
        description,
        reference_type,
        reference_id,
        created_by
    ) VALUES (
        p_customer_id,
        p_points,
        p_transaction_type,
        p_description,
        p_reference_type,
        p_reference_id,
        auth.uid()
    ) RETURNING id INTO v_transaction_id;

    -- Update customer points balance
    UPDATE customers
    SET
        loyalty_points = loyalty_points + p_points,
        loyalty_points_expiry_date = v_points_expiry_date
    WHERE id = p_customer_id;

    -- Log to audit
    INSERT INTO audit_logs (
        entity_type,
        entity_id,
        action,
        new_values,
        performed_by
    ) VALUES (
        'customer',
        p_customer_id,
        'loyalty_points_updated',
        jsonb_build_object(
            'points_change', p_points,
            'new_balance', (SELECT loyalty_points FROM customers WHERE id = p_customer_id)
        ),
        auth.uid()
    );

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if customer can access photo gallery
CREATE OR REPLACE FUNCTION can_access_photo_gallery(p_customer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM customers
        WHERE id = p_customer_id
        AND tier IN ('gold', 'black', 'VIP')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get customer loyalty summary
CREATE OR REPLACE FUNCTION get_customer_loyalty_summary(p_customer_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'points', COALESCE(loyalty_points, 0),
        'expiry_date', loyalty_points_expiry_date,
        'no_show_count', COALESCE(no_show_count, 0),
        'last_no_show', last_no_show_date,
        'transactions_earned', COALESCE((SELECT COUNT(*) FROM loyalty_transactions WHERE customer_id = p_customer_id AND transaction_type = 'earned'), 0),
        'transactions_redeemed', COALESCE((SELECT COUNT(*) FROM loyalty_transactions WHERE customer_id = p_customer_id AND transaction_type = 'redeemed'), 0)
    ) INTO v_summary
    FROM customers
    WHERE id = p_customer_id;

    RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
