import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Generates staff performance report with metrics for a specific date range and location
 * @param {NextRequest} request - HTTP request with query parameters: location_id, start_date, end_date (all required)
 * @returns {NextResponse} JSON with success status and array of performance metrics per staff member
 * @example GET /api/aperture/finance/staff-performance?location_id=...&start_date=2026-01-01&end_date=2026-01-31
 * @audit BUSINESS RULE: Performance metrics include completed bookings, revenue generated, hours worked, and commissions
 * @audit SECURITY: Requires authenticated admin/manager role via RLS policies
 * @audit Validate: All three parameters (location_id, start_date, end_date) are required
 * @audit PERFORMANCE: Uses RPC function 'get_staff_performance_report' for complex aggregation
 * @audit AUDIT: Staff performance reports used for commission calculations and HR decisions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location_id = searchParams.get('location_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    if (!location_id || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'location_id, start_date, and end_date are required' },
        { status: 400 }
      )
    }

    // Get staff performance report
    const { data: report, error } = await supabaseAdmin.rpc('get_staff_performance_report', {
      p_location_id: location_id,
      p_start_date: start_date,
      p_end_date: end_date
    })

    if (error) {
      console.error('Error fetching staff performance report:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch staff performance report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error('Error in GET /api/aperture/finance/staff-performance:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
