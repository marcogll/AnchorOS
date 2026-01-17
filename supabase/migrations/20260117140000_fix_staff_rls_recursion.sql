-- Fix RLS policy recursion issue
-- 
-- Solution: Create SECURITY DEFINER function to get user's location
-- This bypasses RLS when checking user's own data

-- Create a function that returns the current user's staff location
CREATE OR REPLACE FUNCTION get_current_user_location_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT location_id FROM staff WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Drop problematic policies
DROP POLICY IF EXISTS "staff_select_own" ON staff;
DROP POLICY IF EXISTS "staff_select_same_location" ON staff;
DROP POLICY IF EXISTS "staff_select_artist_view_artists" ON staff;

-- Create self-query policy - simplest approach without functions
CREATE POLICY "staff_select_self" ON staff
    FOR SELECT
    USING (user_id = auth.uid());

-- Recreate the same_location policy using the function
CREATE POLICY "staff_select_same_location" ON staff
    FOR SELECT
    USING (
        is_staff_or_higher() AND
        location_id = get_current_user_location_id()
    );

-- Recreate the artist_view_artists policy using the function
CREATE POLICY "staff_select_artist_view_artists" ON staff
    FOR SELECT
    USING (
        is_artist() AND
        location_id = get_current_user_location_id() AND
        staff.role = 'artist'
    );
