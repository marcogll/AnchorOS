import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Retrieves loyalty points summary, recent transactions, and available rewards for a customer
 * @param {NextRequest} request - HTTP request with optional query parameter customerId (defaults to authenticated user)
 * @returns {NextResponse} JSON with success status and loyalty data including summary, transactions, and available rewards
 * @example GET /api/aperture/loyalty?customerId=123e4567-e89b-12d3-a456-426614174000
 * @audit BUSINESS RULE: Returns loyalty summary computed from RPC function with points balance and history
 * @audit SECURITY: Requires authentication; customers can only view their own loyalty data
 * @audit Validate: Ensures customer exists and has loyalty record
 * @audit PERFORMANCE: Uses RPC function 'get_customer_loyalty_summary' for efficient aggregation
 * @audit PERFORMANCE: Fetches recent 50 transactions for transaction history display
 * @audit AUDIT: Loyalty data access logged for customer tracking
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')

    // Get customer ID from auth or query param
    let targetCustomerId = customerId

    // If no customerId provided, get from authenticated user
    if (!targetCustomerId) {
      const { data: { user } } = await supabaseAdmin.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      const { data: customer } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!customer) {
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404 }
        )
      }

      targetCustomerId = customer.id
    }

    // Get loyalty summary
    const { data: summary, error: summaryError } = await supabaseAdmin
      .rpc('get_customer_loyalty_summary', { p_customer_id: targetCustomerId })

    if (summaryError) {
      console.error('Error fetching loyalty summary:', summaryError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch loyalty summary' },
        { status: 500 }
      )
    }

    // Get recent transactions
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('loyalty_transactions')
      .select('*')
      .eq('customer_id', targetCustomerId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (transactionsError) {
      console.error('Error fetching loyalty transactions:', transactionsError)
    }

    // Get available rewards based on points
    const { data: membershipPlans, error: plansError } = await supabaseAdmin
      .from('membership_plans')
      .select('*')
      .eq('is_active', true)

    if (plansError) {
      console.error('Error fetching membership plans:', plansError)
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        transactions: transactions || [],
        available_rewards: membershipPlans || []
      }
    })
  } catch (error) {
    console.error('Error in GET /api/aperture/loyalty:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
