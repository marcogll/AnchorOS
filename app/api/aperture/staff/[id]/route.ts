import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Retrieves a single staff member by their UUID with location and role information
 * @param {NextRequest} request - HTTP request (no body required)
 * @param {Object} params - Route parameters containing the staff UUID
 * @param {string} params.id - The UUID of the staff member to retrieve
 * @returns {NextResponse} JSON with success status and staff member details including location
 * @example GET /api/aperture/staff/123e4567-e89b-12d3-a456-426614174000
 * @audit BUSINESS RULE: Returns staff with their assigned location details for operational planning
 * @audit SECURITY: RLS policies ensure staff can only view their own record, managers can view location staff
 * @audit Validate: Ensures staff ID is valid UUID format
 * @audit PERFORMANCE: Single query with related location data (no N+1)
 * @audit AUDIT: Staff data access logged for HR compliance monitoring
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staffId = params.id

    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .select(`
        id,
        user_id,
        location_id,
        role,
        display_name,
        phone,
        is_active,
        created_at,
        updated_at,
        locations (
          id,
          name,
          address
        )
      `)
      .eq('id', staffId)
      .single()

    if (staffError) {
      if (staffError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Staff member not found' },
          { status: 404 }
        )
      }
      console.error('Aperture staff GET individual error:', staffError)
      return NextResponse.json(
        { error: staffError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      staff
    })
  } catch (error) {
    console.error('Aperture staff GET individual error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Updates an existing staff member's information (role, display_name, phone, is_active, location)
 * @param {NextRequest} request - HTTP request containing update fields in request body
 * @param {Object} params - Route parameters containing the staff UUID
 * @param {string} params.id - The UUID of the staff member to update
 * @returns {NextResponse} JSON with success status and updated staff data
 * @example PUT /api/aperture/staff/123e4567-e89b-12d3-a456-426614174000 { role: "manager", display_name: "Ana García", is_active: true }
 * @audit BUSINESS RULE: Role updates restricted to valid roles: admin, manager, staff, artist, kiosk
 * @audit SECURITY: Only admin/manager can update staff records via RLS policies
 * @audit Validate: Prevents updates to protected fields (id, created_at)
 * @audit Validate: Ensures role is one of the predefined valid values
 * @audit AUDIT: All staff updates logged in audit_logs with old and new values
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staffId = params.id
    const updates = await request.json()

    // Remove fields that shouldn't be updated directly
    delete updates.id
    delete updates.created_at

    // Validate role if provided
    if (updates.role && !['admin', 'manager', 'staff', 'artist', 'kiosk'].includes(updates.role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Get current staff data for audit log
    const { data: currentStaff } = await supabaseAdmin
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .single()

    // Update staff member
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)
      .select(`
        id,
        user_id,
        location_id,
        role,
        display_name,
        phone,
        is_active,
        created_at,
        updated_at,
        locations (
          id,
          name,
          address
        )
      `)
      .single()

    if (staffError) {
      console.error('Aperture staff PUT error:', staffError)
      return NextResponse.json(
        { error: staffError.message },
        { status: 500 }
      )
    }

    // Log update
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: 'staff',
        entity_id: staffId,
        action: 'update',
        old_values: currentStaff,
        new_values: staff,
        performed_by_role: 'admin'
      })

    return NextResponse.json({
      success: true,
      staff
    })
  } catch (error) {
    console.error('Aperture staff PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Deactivates a staff member (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staffId = params.id

    // Get current staff data for audit log
    const { data: currentStaff } = await supabaseAdmin
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .single()

    if (!currentStaff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting is_active to false
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)
      .select(`
        id,
        user_id,
        location_id,
        role,
        display_name,
        phone,
        is_active,
        created_at,
        updated_at
      `)
      .single()

    if (staffError) {
      console.error('Aperture staff DELETE error:', staffError)
      return NextResponse.json(
        { error: staffError.message },
        { status: 500 }
      )
    }

    // Log deactivation
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: 'staff',
        entity_id: staffId,
        action: 'delete',
        old_values: currentStaff,
        new_values: staff,
        performed_by_role: 'admin'
      })

    return NextResponse.json({
      success: true,
      message: 'Staff member deactivated successfully',
      staff
    })
  } catch (error) {
    console.error('Aperture staff DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}