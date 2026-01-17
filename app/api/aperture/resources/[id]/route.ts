import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Gets a specific resource by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resourceId = params.id

    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('resources')
      .select(`
        id,
        location_id,
        name,
        type,
        capacity,
        is_active,
        created_at,
        updated_at,
        locations (
          id,
          name,
          address
        )
      `)
      .eq('id', resourceId)
      .single()

    if (resourceError) {
      if (resourceError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Resource not found' },
          { status: 404 }
        )
      }
      console.error('Aperture resource GET individual error:', resourceError)
      return NextResponse.json(
        { error: resourceError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resource
    })
  } catch (error) {
    console.error('Aperture resource GET individual error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Updates a resource
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resourceId = params.id
    const updates = await request.json()

    // Remove fields that shouldn't be updated directly
    delete updates.id
    delete updates.created_at

    // Validate type if provided
    if (updates.type && !['station', 'room', 'equipment'].includes(updates.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: station, room, or equipment' },
        { status: 400 }
      )
    }

    // Get current resource data for audit log
    const { data: currentResource } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single()

    // Update resource
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('resources')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', resourceId)
      .select(`
        id,
        location_id,
        name,
        type,
        capacity,
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

    if (resourceError) {
      console.error('Aperture resource PUT error:', resourceError)
      return NextResponse.json(
        { error: resourceError.message },
        { status: 500 }
      )
    }

    // Log update
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: 'resource',
        entity_id: resourceId,
        action: 'update',
        old_values: currentResource,
        new_values: resource,
        performed_by_role: 'admin'
      })

    return NextResponse.json({
      success: true,
      resource
    })
  } catch (error) {
    console.error('Aperture resource PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Deactivates a resource (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resourceId = params.id

    // Get current resource data for audit log
    const { data: currentResource } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single()

    if (!currentResource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Soft delete by setting is_active to false
    const { data: resource, error: resourceError } = await supabaseAdmin
      .from('resources')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', resourceId)
      .select(`
        id,
        location_id,
        name,
        type,
        capacity,
        is_active,
        created_at,
        updated_at
      `)
      .single()

    if (resourceError) {
      console.error('Aperture resource DELETE error:', resourceError)
      return NextResponse.json(
        { error: resourceError.message },
        { status: 500 }
      )
    }

    // Log deactivation
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: 'resource',
        entity_id: resourceId,
        action: 'delete',
        old_values: currentResource,
        new_values: resource,
        performed_by_role: 'admin'
      })

    return NextResponse.json({
      success: true,
      message: 'Resource deactivated successfully',
      resource
    })
  } catch (error) {
    console.error('Aperture resource DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}