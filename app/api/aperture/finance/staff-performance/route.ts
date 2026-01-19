import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Get staff performance report for date range
 * @param {NextRequest} request - Query params: location_id, start_date, end_date
 * @returns {NextResponse} Staff performance metrics per staff member
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
