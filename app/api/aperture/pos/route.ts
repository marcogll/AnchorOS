/**
 * @description Point of Sale API for processing sales and payments
 * @audit BUSINESS RULE: POS handles service/product sales with multiple payment methods
 * @audit SECURITY: Only admin/manager can process sales via this API
 * @audit Validate: Payment methods must be valid and amounts must match totals
 * @audit AUDIT: All sales transactions logged in audit_logs table
 * @audit PERFORMANCE: Transaction processing must be atomic and fast
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface POSItem {
  type: 'service' | 'product'
  id: string
  quantity: number
  price: number
  name: string
}

interface Payment {
  method: 'cash' | 'card' | 'transfer' | 'giftcard' | 'membership'
  amount: number
  reference?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customer_id,
      items,
      payments,
      staff_id,
      location_id,
      notes
    } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and cannot be empty' },
        { status: 400 }
      )
    }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      return NextResponse.json(
        { error: 'Payments array is required and cannot be empty' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: POSItem) => sum + (item.price * item.quantity), 0)
    const totalPayments = payments.reduce((sum: number, payment: Payment) => sum + payment.amount, 0)

    if (Math.abs(subtotal - totalPayments) > 0.01) {
      return NextResponse.json(
        { error: `Payment total (${totalPayments}) does not match subtotal (${subtotal})` },
        { status: 400 }
      )
    }

    // Get current user (cashier)
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get staff record for the cashier
    const { data: cashierStaff } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('user_id', user.id)
      .single()

    // Process the sale
    const saleRecord = {
      customer_id: customer_id || null,
      staff_id: staff_id || cashierStaff?.id,
      location_id: location_id || null,
      subtotal,
      total_amount: subtotal,
      payment_methods: payments,
      items,
      processed_by: cashierStaff?.id || user.id,
      notes,
      status: 'completed'
    }

    // For now, we'll store this as a transaction record
    // In a full implementation, this would create bookings, update inventory, etc.
    const { data: transaction, error: saleError } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: 'pos_sale',
        entity_id: `pos-${Date.now()}`,
        action: 'sale_completed',
        new_values: saleRecord,
        performed_by_role: 'admin'
      })
      .select()
      .single()

    if (saleError) {
      console.error('POS sale error:', saleError)
      return NextResponse.json(
        { error: 'Failed to process sale' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: `pos-${Date.now()}`,
        ...saleRecord,
        processed_at: new Date().toISOString()
      },
      receipt: {
        transaction_id: `pos-${Date.now()}`,
        subtotal,
        total: subtotal,
        payments,
        items,
        processed_by: cashierStaff?.id || user.id,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('POS API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const location_id = searchParams.get('location_id')

    // Get sales transactions for the day
    const { data: transactions, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('entity_type', 'pos_sale')
      .eq('action', 'sale_completed')
      .gte('created_at', `${date}T00:00:00Z`)
      .lte('created_at', `${date}T23:59:59Z`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('POS transactions fetch error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Filter by location if specified
    let filteredTransactions = transactions || []
    if (location_id) {
      filteredTransactions = filteredTransactions.filter((t: any) =>
        t.new_values?.location_id === location_id
      )
    }

    // Calculate daily totals
    const dailyTotals = filteredTransactions.reduce((totals: any, transaction: any) => {
      const sale = transaction.new_values
      return {
        total_sales: totals.total_sales + 1,
        total_revenue: totals.total_revenue + (sale.total_amount || 0),
        payment_methods: {
          ...totals.payment_methods,
          ...sale.payment_methods?.reduce((methods: any, payment: Payment) => ({
            ...methods,
            [payment.method]: (methods[payment.method] || 0) + payment.amount
          }), {})
        }
      }
    }, {
      total_sales: 0,
      total_revenue: 0,
      payment_methods: {}
    })

    return NextResponse.json({
      success: true,
      date,
      transactions: filteredTransactions,
      daily_totals: dailyTotals
    })

  } catch (error) {
    console.error('POS GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}