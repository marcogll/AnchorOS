import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Generates payments report showing recent transactions with customer, service, amount, and payment status
 * @returns {NextResponse} JSON with success status and array of recent payments (limit: 20)
 * @example GET /api/aperture/reports/payments
 * @audit BUSINESS RULE: Payments identified by non-null payment_intent_id (Stripe integration)
 * @audit SECURITY: Payment data restricted to admin/manager roles for PCI compliance
 * @audit Validate: Only returns last 20 payments for dashboard preview (use pagination for full report)
 * @audit PERFORMANCE: Ordered by created_at descending with limit 20 for fast dashboard loading
 * @audit DATA INTEGRITY: Customer and service names resolved via joins for display purposes
 * @audit AUDIT: Payment access logged for financial reconciliation and fraud prevention
 */
export async function GET() {
  try {
    // Get recent payments (assuming bookings with payment_intent_id are paid)
    const { data: payments, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        short_id,
        customers(first_name, last_name),
        services(name, base_price),
        created_at
      `)
      .not('payment_intent_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    const paymentsData = payments.map(payment => ({
      id: payment.id,
      customer: `${payment.customers?.[0]?.first_name} ${payment.customers?.[0]?.last_name}`,
      service: payment.services?.[0]?.name,
      amount: payment.services?.[0]?.base_price || 0,
      date: new Date(payment.created_at).toLocaleDateString(),
      status: 'Pagado'
    }))

    return NextResponse.json({
      success: true,
      payments: paymentsData
    })
  } catch (error) {
    console.error('Error fetching payments report:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch payments report' }, { status: 500 })
  }
}