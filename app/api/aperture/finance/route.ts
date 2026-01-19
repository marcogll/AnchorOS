import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Get financial summary for date range and location
 * @param {NextRequest} request - Query params: location_id, start_date, end_date
 * @returns {NextResponse} Financial summary with revenue, expenses, and profit
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location_id = searchParams.get('location_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')

    if (!start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'start_date and end_date are required' },
        { status: 400 }
      )
    }

    // Get financial summary
    const { data: summary, error } = await supabaseAdmin.rpc('get_financial_summary', {
      p_location_id: location_id || null,
      p_start_date: start_date,
      p_end_date: end_date
    })

    if (error) {
      console.error('Error fetching financial summary:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch financial summary' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error('Error in GET /api/aperture/finance:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
