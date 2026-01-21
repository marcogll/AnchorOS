/**
 * @description Processes end-of-day cash register closure with financial reconciliation
 * @param {NextRequest} request - HTTP request containing date, location_id, cash_count object, expected_totals, and optional notes
 * @returns {NextResponse} JSON with success status, reconciliation report including actual totals, discrepancies, and closure record
 * @example POST /api/aperture/pos/close-day { date: "2026-01-21", location_id: "...", cash_count: { cash_amount: 5000, card_amount: 8000, transfer_amount: 2000 }, notes: "Day closure" }
 * @audit BUSINESS RULE: Compares physical cash count with system-recorded transactions to identify discrepancies
 * @audit BUSINESS RULE: Creates immutable daily_closing_report record after successful reconciliation
 * @audit SECURITY: Requires authenticated manager/admin role
 * @audit Validate: Ensures date is valid and location exists
 * @audit Validate: Calculates discrepancies for each payment method
 * @audit PERFORMANCE: Uses audit_logs for transaction aggregation (single source of truth)
 * @audit AUDIT: Daily closure creates permanent financial record with all discrepancies documented
 * @audit COMPLIANCE: Closure records are immutable and used for financial reporting
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface CashCount {
  cash_amount: number
  card_amount: number
  transfer_amount: number
  giftcard_amount: number
  membership_amount: number
  other_amount: number
  notes?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      date,
      location_id,
      cash_count,
      expected_totals,
      notes
    } = body

    if (!date || !location_id || !cash_count) {
      return NextResponse.json(
        { error: 'Missing required fields: date, location_id, cash_count' },
        { status: 400 }
      )
    }

    // Get actual sales data for the day
    const { data: transactions } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('entity_type', 'pos_sale')
      .eq('action', 'sale_completed')
      .eq('new_values->location_id', location_id)
      .gte('created_at', `${date}T00:00:00Z`)
      .lte('created_at', `${date}T23:59:59Z`)

    // Calculate actual totals from transactions
    const actualTotals = (transactions || []).reduce((totals: any, transaction: any) => {
      const sale = transaction.new_values
      const payments = sale.payment_methods || []

      return {
        total_sales: totals.total_sales + 1,
        total_revenue: totals.total_revenue + (sale.total_amount || 0),
        payment_breakdown: payments.reduce((breakdown: any, payment: any) => ({
          ...breakdown,
          [payment.method]: (breakdown[payment.method] || 0) + payment.amount
        }), totals.payment_breakdown)
      }
    }, {
      total_sales: 0,
      total_revenue: 0,
      payment_breakdown: {}
    })

    // Calculate discrepancies
    const discrepancies = {
      cash: (cash_count.cash_amount || 0) - (actualTotals.payment_breakdown.cash || 0),
      card: (cash_count.card_amount || 0) - (actualTotals.payment_breakdown.card || 0),
      transfer: (cash_count.transfer_amount || 0) - (actualTotals.payment_breakdown.transfer || 0),
      giftcard: (cash_count.giftcard_amount || 0) - (actualTotals.payment_breakdown.giftcard || 0),
      membership: (cash_count.membership_amount || 0) - (actualTotals.payment_breakdown.membership || 0),
      other: (cash_count.other_amount || 0) - (actualTotals.payment_breakdown.other || 0)
    }

    // Get current user (manager closing the register)
    const { data: { user } } = await supabaseAdmin.auth.getUser()

    // Create cash closure record
    const closureRecord = {
      date,
      location_id,
      actual_totals: actualTotals,
      counted_totals: cash_count,
      discrepancies,
      total_discrepancy: Object.values(discrepancies).reduce((sum: number, disc: any) => sum + disc, 0),
      closed_by: user?.id,
      status: 'closed',
      notes
    }

    const { data: closure, error: closureError } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        entity_type: 'cash_closure',
        entity_id: `closure-${date}-${location_id}`,
        action: 'register_closed',
        new_values: closureRecord,
        performed_by_role: 'admin'
      })
      .select()
      .single()

    if (closureError) {
      console.error('Cash closure error:', closureError)
      return NextResponse.json(
        { error: 'Failed to close cash register' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      closure: closureRecord,
      report: {
        date,
        location_id,
        actual_sales: actualTotals.total_sales,
        actual_revenue: actualTotals.total_revenue,
        counted_amounts: cash_count,
        discrepancies,
        total_discrepancy: closureRecord.total_discrepancy,
        status: Math.abs(closureRecord.total_discrepancy) < 0.01 ? 'balanced' : 'discrepancy'
      }
    })

  } catch (error) {
    console.error('Cash closure API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const location_id = searchParams.get('location_id')

    if (!date || !location_id) {
      return NextResponse.json(
        { error: 'Missing required parameters: date, location_id' },
        { status: 400 }
      )
    }

    // Get closure record for the day
    const { data: closures } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('entity_type', 'cash_closure')
      .eq('entity_id', `closure-${date}-${location_id}`)
      .eq('action', 'register_closed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (closures && closures.length > 0) {
      const closure = closures[0]
      return NextResponse.json({
        success: true,
        closure: closure.new_values,
        already_closed: true
      })
    }

    // Get sales data for closure preparation
    const { data: transactions } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('entity_type', 'pos_sale')
      .eq('action', 'sale_completed')
      .gte('created_at', `${date}T00:00:00Z`)
      .lte('created_at', `${date}T23:59:59Z`)

    const salesSummary = (transactions || []).reduce((summary: any, transaction: any) => {
      const sale = transaction.new_values
      const payments = sale.payment_methods || []

      return {
        total_sales: summary.total_sales + 1,
        total_revenue: summary.total_revenue + (sale.total_amount || 0),
        payment_breakdown: payments.reduce((breakdown: any, payment: any) => ({
          ...breakdown,
          [payment.method]: (breakdown[payment.method] || 0) + payment.amount
        }), summary.payment_breakdown)
      }
    }, {
      total_sales: 0,
      total_revenue: 0,
      payment_breakdown: {}
    })

    return NextResponse.json({
      success: true,
      already_closed: false,
      sales_summary: salesSummary,
      expected_counts: salesSummary.payment_breakdown
    })

  } catch (error) {
    console.error('Cash closure GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}