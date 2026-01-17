-- Fix RLS policy to allow users to query their own staff record
-- This fixes the PRIMARY blocker in the authentication flow where
-- middleware.ts (lines 31-35) queries staff table to get user role
-- but RLS policies block the query because there's no self-query policy

-- Create policy for self-query (most specific, should be checked first)
DROP POLICY IF EXISTS "staff_select_own" ON staff;
CREATE POLICY "staff_select_own" ON staff
    FOR SELECT
    USING (
        -- Allow user to query their own staff record
        user_id = auth.uid()
    );
