import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Get daily closing reports
 * @param {NextRequest} request - Query params: location_id, start_date, end_date, status
 * @returns {NextResponse} List of daily closing reports
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location_id = searchParams.get('location_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('daily_closing_reports')
      .select('*', { count: 'exact' })
      .order('report_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (location_id) {
      query = query.eq('location_id', location_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (start_date) {
      query = query.gte('report_date', start_date)
    }

    if (end_date) {
      query = query.lte('report_date', end_date)
    }

    const { data: reports, error, count } = await query

    if (error) {
      console.error('Error fetching daily closing reports:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch daily closing reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: reports || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('Error in GET /api/aperture/finance/daily-closing:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
