import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @see POST endpoint for actual assignment execution
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('location_id');
    const serviceId = searchParams.get('service_id');
    const date = searchParams.get('date');
    const startTime = searchParams.get('start_time');
    const endTime = searchParams.get('end_time');
    const excludeStaffIds = searchParams.get('exclude_staff_ids')?.split(',') || [];

    if (!locationId || !serviceId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required parameters: location_id, service_id, date, start_time, end_time' },
        { status: 400 }
      );
    }

    // Call the assignment suggestions function
    const { data: suggestions, error } = await supabaseAdmin
      .rpc('get_staff_assignment_suggestions', {
        p_location_id: locationId,
        p_service_id: serviceId,
        p_date: date,
        p_start_time_utc: startTime,
        p_end_time_utc: endTime,
        p_exclude_staff_ids: excludeStaffIds
      });

    if (error) {
      console.error('Error getting staff suggestions:', error);
      return NextResponse.json(
        { error: 'Failed to get staff suggestions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions || []
    });

  } catch (error) {
    console.error('Staff suggestions GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @description POST endpoint to automatically assign the best available staff member to an unassigned booking
 * @param {NextRequest} request - HTTP request containing booking_id in the request body
 * @returns {NextResponse} JSON with success status and assignment result including assigned staff member details
 * @example POST /api/aperture/calendar/auto-assign { booking_id: "123e4567-e89b-12d3-a456-426614174000" }
 * @audit BUSINESS RULE: Assigns the highest-ranked available staff member based on skill match and availability
 * @audit SECURITY: Requires authenticated admin/manager role via RLS policies
 * @audit Validate: Ensures booking_id is provided and booking exists with unassigned staff
 * @audit PERFORMANCE: Uses RPC function 'auto_assign_staff_to_booking' for atomic assignment
 * @audit AUDIT: Auto-assignment results logged for performance tracking and optimization
 * @see GET endpoint for retrieving suggestions before assignment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Call the auto-assignment function
    const { data: result, error } = await supabaseAdmin
      .rpc('auto_assign_staff_to_booking', {
        p_booking_id: booking_id
      });

    if (error) {
      console.error('Error auto-assigning staff:', error);
      return NextResponse.json(
        { error: 'Failed to auto-assign staff' },
        { status: 500 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Auto-assignment failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      assignment: result
    });

  } catch (error) {
    console.error('Auto-assignment POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}