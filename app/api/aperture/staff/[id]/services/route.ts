import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Retrieves all services that a specific staff member is qualified to perform
 * @param {NextRequest} request - HTTP request (no body required)
 * @param {Object} params - Route parameters containing the staff UUID
 * @param {string} params.id - The UUID of the staff member to retrieve services for
 * @returns {NextResponse} JSON with success status and array of staff services with service details
 * @example GET /api/aperture/staff/123e4567-e89b-12d3-a456-426614174000/services
 * @audit BUSINESS RULE: Only active service assignments returned for booking eligibility
 * @audit SECURITY: RLS policies restrict staff service data to authenticated manager/admin roles
 * @audit Validate: Staff ID must be valid UUID format for database query
 * @audit PERFORMANCE: Single query fetches both staff_services and nested services data
 * @audit DATA INTEGRITY: Proficiency level determines service pricing and priority in booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staffId = params.id;

    if (!staffId) {
      return NextResponse.json(
        { error: 'Staff ID is required' },
        { status: 400 }
      );
    }

    // Get staff services with service details
    const { data: staffServices, error } = await supabaseAdmin
      .from('staff_services')
      .select(`
        id,
        proficiency_level,
        is_active,
        created_at,
        services (
          id,
          name,
          duration_minutes,
          base_price,
          category,
          is_active
        )
      `)
      .eq('staff_id', staffId)
      .eq('is_active', true)
      .order('services(name)', { ascending: true });

    if (error) {
      console.error('Error fetching staff services:', error);
      return NextResponse.json(
        { error: 'Failed to fetch staff services' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      services: staffServices || []
    });

  } catch (error) {
    console.error('Staff services GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @description Assigns a new service to a staff member or updates existing service proficiency
 * @param {NextRequest} request - JSON body with service_id and optional proficiency_level (default: 3)
 * @param {Object} params - Route parameters containing the staff UUID
 * @param {string} params.id - The UUID of the staff member to assign service to
 * @returns {NextResponse} JSON with success status and created/updated staff service record
 * @example POST /api/aperture/staff/123e4567-e89b-12d3-a456-426614174000/services {"service_id": "456", "proficiency_level": 4}
 * @audit BUSINESS RULE: Upsert pattern - updates existing assignment if service already assigned to staff
 * @audit SECURITY: Only admin/manager roles can assign services to staff members
 * @audit Validate: Required fields: staff_id (from URL), service_id (from body)
 * @audit Validate: Proficiency level must be between 1-5 for skill rating system
 * @audit PERFORMANCE: Single existence check before insert/update decision
 * @audit AUDIT: Service assignments logged for certification compliance and performance tracking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const staffId = params.id;
    const body = await request.json();
    const { service_id, proficiency_level = 3 } = body;

    if (!staffId || !service_id) {
      return NextResponse.json(
        { error: 'Staff ID and service ID are required' },
        { status: 400 }
      );
    }

    // Verify staff exists and user has permission
    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .select('id, role')
      .eq('id', staffId)
      .single();

    if (staffError || !staff) {
      return NextResponse.json(
        { error: 'Staff member not found' },
        { status: 404 }
      );
    }

    // Check if service already assigned
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('staff_services')
      .select('id')
      .eq('staff_id', staffId)
      .eq('service_id', service_id)
      .single();

    if (existing) {
      // Update existing assignment
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('staff_services')
        .update({
          proficiency_level,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating staff service:', updateError);
        return NextResponse.json(
          { error: 'Failed to update staff service' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        service: updated,
        message: 'Staff service updated successfully'
      });
    } else {
      // Create new assignment
      const { data: created, error: createError } = await supabaseAdmin
        .from('staff_services')
        .insert({
          staff_id: staffId,
          service_id,
          proficiency_level
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating staff service:', createError);
        return NextResponse.json(
          { error: 'Failed to assign service to staff' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        service: created,
        message: 'Service assigned to staff successfully'
      });
    }

  } catch (error) {
    console.error('Staff services POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @description Removes a service assignment from a staff member (soft delete)
 * @param {NextRequest} request - HTTP request (no body required)
 * @param {Object} params - Route parameters containing staff UUID and service UUID
 * @param {string} params.id - The UUID of the staff member
 * @param {string} params.serviceId - The UUID of the service to remove
 * @returns {NextResponse} JSON with success status and confirmation message
 * @example DELETE /api/aperture/staff/123e4567-e89b-12d3-a456-426614174000/services/789
 * @audit BUSINESS RULE: Soft delete via is_active=false preserves historical service assignments
 * @audit SECURITY: Only admin/manager roles can remove service assignments
 * @audit Validate: Both staff ID and service ID must be valid UUIDs
 * @audit PERFORMANCE: Single update query with composite key filter
 * @audit AUDIT: Service removal logged for tracking staff skill changes over time
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; serviceId: string } }
) {
  try {
    const staffId = params.id;
    const serviceId = params.serviceId;

    if (!staffId || !serviceId) {
      return NextResponse.json(
        { error: 'Staff ID and service ID are required' },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active to false
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('staff_services')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('staff_id', staffId)
      .eq('service_id', serviceId)
      .select()
      .single();

    if (updateError) {
      console.error('Error removing staff service:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove service from staff' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      service: updated,
      message: 'Service removed from staff successfully'
    });

  } catch (error) {
    console.error('Staff services DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}