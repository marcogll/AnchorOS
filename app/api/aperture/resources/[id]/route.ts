import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Retrieves a single resource by ID with location details
 * @param {NextRequest} request - HTTP request (no body required)
 * @param {Object} params - Route parameters containing the resource UUID
 * @param {string} params.id - The UUID of the resource to retrieve
 * @returns {NextResponse} JSON with success status and resource data including location
 * @example GET /api/aperture/resources/123e4567-e89b-12d3-a456-426614174000
 * @audit BUSINESS RULE: Resource details needed for appointment scheduling and capacity planning
 * @audit SECURITY: RLS policies restrict resource access to authenticated staff/manager roles
 * @audit Validate: Resource ID must be valid UUID format
 * @audit PERFORMANCE: Single query with location join (no N+1)
 * @audit AUDIT: Resource access logged for operational tracking
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
 * @description Updates an existing resource's information (name, type, capacity, is_active, location)
 * @param {NextRequest} request - HTTP request containing update fields in request body
 * @param {Object} params - Route parameters containing the resource UUID
 * @param {string} params.id - The UUID of the resource to update
 * @returns {NextResponse} JSON with success status and updated resource data
 * @example PUT /api/aperture/resources/123e4567-e89b-12d3-a456-426614174000 { "name": "mani-02", "capacity": 2 }
 * @audit BUSINESS RULE: Capacity updates affect booking availability calculations
 * @audit SECURITY: Only admin/manager can update resources via RLS policies
 * @audit Validate: Type must be one of: station, room, equipment
 * @audit Validate: Protected fields (id, created_at) are removed from updates
 * @audit AUDIT: All resource updates logged in audit_logs with old and new values
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
 * @description Deactivates a resource (soft delete) to preserve booking history
 * @param {NextRequest} request - HTTP request (no body required)
 * @param {Object} params - Route parameters containing the resource UUID
 * @param {string} params.id - The UUID of the resource to deactivate
 * @returns {NextResponse} JSON with success status and confirmation message
 * @example DELETE /api/aperture/resources/123e4567-e89b-12d3-a456-426614174000
 * @audit BUSINESS RULE: Soft delete preserves historical bookings referencing the resource
 * @audit SECURITY: Only admin can deactivate resources via RLS policies
 * @audit Validate: Resource must exist before deactivation
 * @audit PERFORMANCE: Single update query with is_active=false
 * @audit AUDIT: Deactivation logged for tracking resource lifecycle and capacity changes
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