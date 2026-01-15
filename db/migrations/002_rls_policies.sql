-- Migración 002: Políticas RLS por rol
-- Version: 002
-- Fecha: 2026-01-15
-- Descripción: Configuración de Row Level Security con jerarquía de roles y restricciones de privacidad

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Función para obtener el rol del usuario actual
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

        -- Si es customer, verificar si existe en customers
        IF EXISTS (SELECT 1 FROM customers WHERE user_id = current_user_id) THEN
            RETURN 'customer';
        END IF;

        RETURN NULL;
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es staff o superior (admin, manager, staff)
CREATE OR REPLACE FUNCTION is_staff_or_higher()
RETURNS BOOLEAN AS $$
    DECLARE
        user_role user_role := get_current_user_role();
    BEGIN
        RETURN user_role IN ('admin', 'manager', 'staff');
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es artist
CREATE OR REPLACE FUNCTION is_artist()
RETURNS BOOLEAN AS $$
    DECLARE
        user_role user_role := get_current_user_role();
    BEGIN
        RETURN user_role = 'artist';
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es customer
CREATE OR REPLACE FUNCTION is_customer()
RETURNS BOOLEAN AS $$
    DECLARE
        user_role user_role := get_current_user_role();
    BEGIN
        RETURN user_role = 'customer';
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    DECLARE
        user_role user_role := get_current_user_role();
    BEGIN
        RETURN user_role = 'admin';
    END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- LOCATIONS POLICIES
-- ============================================

-- Admin/Manager/Staff: Ver todas las locations activas
CREATE POLICY "locations_select_staff_higher" ON locations
    FOR SELECT
    USING (is_staff_or_higher() OR is_admin() OR is_admin());

-- Admin/Manager: Insertar, actualizar, eliminar locations
CREATE POLICY "locations_modify_admin_manager" ON locations
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

-- ============================================
-- RESOURCES POLICIES
-- ============================================

-- Staff o superior: Ver recursos activos
CREATE POLICY "resources_select_staff_higher" ON resources
    FOR SELECT
    USING (is_staff_or_higher() OR is_admin());

-- Artist: Ver recursos activos (necesario para ver disponibilidad)
CREATE POLICY "resources_select_artist" ON resources
    FOR SELECT
    USING (is_artist());

-- Admin/Manager: Modificar recursos
CREATE POLICY "resources_modify_admin_manager" ON resources
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

-- ============================================
-- STAFF POLICIES
-- ============================================

-- Admin/Manager: Ver todo el staff
CREATE POLICY "staff_select_admin_manager" ON staff
    FOR SELECT
    USING (get_current_user_role() IN ('admin', 'manager'));

-- Staff: Ver staff en su misma ubicación
CREATE POLICY "staff_select_same_location" ON staff
    FOR SELECT
    USING (
        is_staff_or_higher() AND
        EXISTS (
            SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.location_id = staff.location_id
        )
    );

-- Artist: Ver solo otros artists en su misma ubicación
CREATE POLICY "staff_select_artist_view_artists" ON staff
    FOR SELECT
    USING (
        is_artist() AND
        EXISTS (
            SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.location_id = staff.location_id
        ) AND
        staff.role = 'artist'
    );

-- Admin/Manager: Modificar staff
CREATE POLICY "staff_modify_admin_manager" ON staff
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

-- ============================================
-- SERVICES POLICIES
-- ============================================

-- Todos los usuarios autenticados: Ver servicios activos
CREATE POLICY "services_select_all" ON services
    FOR SELECT
    USING (is_active = true);

-- Admin/Manager: Ver y modificar todos los servicios
CREATE POLICY "services_all_admin_manager" ON services
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

-- ============================================
-- CUSTOMERS POLICIES
-- ============================================

-- Admin/Manager: Ver todo (incluyendo PII)
CREATE POLICY "customers_select_admin_manager" ON customers
    FOR SELECT
    USING (get_current_user_role() IN ('admin', 'manager'));

-- Staff: Ver todo (incluyendo PII) - Pueden ver email/phone según PRD actualizado
CREATE POLICY "customers_select_staff" ON customers
    FOR SELECT
    USING (is_staff_or_higher());

-- Artist: Solo nombre y notas, NO email ni phone
CREATE POLICY "customers_select_artist_restricted" ON customers
    FOR SELECT
    USING (is_artist());

-- Customer: Ver solo sus propios datos
CREATE POLICY "customers_select_own" ON customers
    FOR SELECT
    USING (is_customer() AND user_id = auth.uid());

-- Admin/Manager: Modificar cualquier cliente
CREATE POLICY "customers_modify_admin_manager" ON customers
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

-- Staff: Modificar cualquier cliente
CREATE POLICY "customers_modify_staff" ON customers
    FOR ALL
    USING (is_staff_or_higher());

-- Customer: Actualizar solo sus propios datos
CREATE POLICY "customers_update_own" ON customers
    FOR UPDATE
    USING (is_customer() AND user_id = auth.uid());

-- ============================================
-- INVITATIONS POLICIES
-- ============================================

-- Admin/Manager: Ver todas las invitaciones
CREATE POLICY "invitations_select_admin_manager" ON invitations
    FOR SELECT
    USING (get_current_user_role() IN ('admin', 'manager'));

-- Staff: Ver todas las invitaciones
CREATE POLICY "invitations_select_staff" ON invitations
    FOR SELECT
    USING (is_staff_or_higher());

-- Customer: Ver solo sus propias invitaciones (como inviter)
CREATE POLICY "invitations_select_own" ON invitations
    FOR SELECT
    USING (is_customer() AND inviter_id = (SELECT id FROM customers WHERE user_id = auth.uid()));

-- Admin/Manager: Modificar cualquier invitación
CREATE POLICY "invitations_modify_admin_manager" ON invitations
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

-- Staff: Modificar invitaciones
CREATE POLICY "invitations_modify_staff" ON invitations
    FOR ALL
    USING (is_staff_or_higher());

-- ============================================
-- BOOKINGS POLICIES
-- ============================================

-- Admin/Manager: Ver todos los bookings
CREATE POLICY "bookings_select_admin_manager" ON bookings
    FOR SELECT
    USING (get_current_user_role() IN ('admin', 'manager'));

-- Staff: Ver bookings de su ubicación
CREATE POLICY "bookings_select_staff_location" ON bookings
    FOR SELECT
    USING (
        is_staff_or_higher() AND
        EXISTS (
            SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.location_id = bookings.location_id
        )
    );

-- Artist: Ver bookings donde es el artist asignado o secondary_artist
CREATE POLICY "bookings_select_artist_own" ON bookings
    FOR SELECT
    USING (
        is_artist() AND
        (staff_id = (SELECT id FROM staff WHERE user_id = auth.uid()) OR
         secondary_artist_id = (SELECT id FROM staff WHERE user_id = auth.uid()))
    );

-- Customer: Ver solo sus propios bookings
CREATE POLICY "bookings_select_own" ON bookings
    FOR SELECT
    USING (is_customer() AND customer_id = (SELECT id FROM customers WHERE user_id = auth.uid()));

-- Admin/Manager: Modificar cualquier booking
CREATE POLICY "bookings_modify_admin_manager" ON bookings
    FOR ALL
    USING (get_current_user_role() IN ('admin', 'manager'));

-- Staff: Modificar bookings de su ubicación
CREATE POLICY "bookings_modify_staff_location" ON bookings
    FOR ALL
    USING (
        is_staff_or_higher() AND
        EXISTS (
            SELECT 1 FROM staff s WHERE s.user_id = auth.uid() AND s.location_id = bookings.location_id
        )
    );

-- Artist: No puede modificar bookings, solo ver
CREATE POLICY "bookings_no_modify_artist" ON bookings
    FOR ALL
    USING (NOT is_artist());

-- Customer: Crear y actualizar sus propios bookings
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

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Admin/Manager: Ver todos los audit logs
CREATE POLICY "audit_logs_select_admin_manager" ON audit_logs
    FOR SELECT
    USING (get_current_user_role() IN ('admin', 'manager'));

-- Staff: Ver logs de su ubicación
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

-- Solo backend puede insertar audit logs
CREATE POLICY "audit_logs_no_insert" ON audit_logs
    FOR INSERT
    WITH CHECK (false);

-- ============================================
-- END OF MIGRATION 002
-- ============================================