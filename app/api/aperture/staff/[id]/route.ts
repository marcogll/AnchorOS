import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Gets a specific staff member by ID
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
 * @description Updates a staff member
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