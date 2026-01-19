import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Get loyalty history for specific customer
 * @param {NextRequest} request - URL params: customerId in path
 * @returns {NextResponse} Customer loyalty transactions and history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params

    // Get loyalty summary
    const { data: summary, error: summaryError } = await supabaseAdmin
      .rpc('get_customer_loyalty_summary', { p_customer_id: customerId })

    if (summaryError) {
      console.error('Error fetching loyalty summary:', summaryError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch loyalty summary' },
        { status: 500 }
      )
    }

    // Get loyalty transactions with pagination
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: transactions, error: transactionsError, count } = await supabaseAdmin
      .from('loyalty_transactions')
      .select('*', { count: 'exact' })
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (transactionsError) {
      console.error('Error fetching loyalty transactions:', transactionsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch loyalty transactions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        transactions: transactions || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
        }
      }
    })
  } catch (error) {
    console.error('Error in GET /api/aperture/loyalty/[customerId]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Add or remove loyalty points for customer
 * @param {NextRequest} request - Body with points, transaction_type, description, reference_type, reference_id
 * @returns {NextResponse} Transaction result and updated summary
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const { customerId } = params
    const body = await request.json()
    const {
      points,
      transaction_type = 'admin_adjustment',
      description,
      reference_type,
      reference_id
    } = body

    if (!points || typeof points !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Points amount is required and must be a number' },
        { status: 400 }
      )
    }

    // Add loyalty points
    const { data: transactionId, error: error } = await supabaseAdmin
      .rpc('add_loyalty_points', {
        p_customer_id: customerId,
        p_points: points,
        p_transaction_type: transaction_type,
        p_description: description,
        p_reference_type: reference_type,
        p_reference_id: reference_id
      })

    if (error) {
      console.error('Error adding loyalty points:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Get updated summary
    const { data: summary } = await supabaseAdmin
      .rpc('get_customer_loyalty_summary', { p_customer_id: customerId })

    return NextResponse.json({
      success: true,
      data: {
        transaction_id: transactionId,
        summary
      }
    })
  } catch (error) {
    console.error('Error in POST /api/aperture/loyalty/[customerId]/points:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
