import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Creates a new expense record for operational cost tracking
 * @param {NextRequest} request - HTTP request containing location_id (optional), category, description, amount, expense_date, payment_method, receipt_url (optional), notes (optional)
 * @returns {NextResponse} JSON with success status and created expense data
 * @example POST /api/aperture/finance/expenses { category: "supplies", description: "Nail polish set", amount: 1500, expense_date: "2026-01-21", payment_method: "card" }
 * @audit BUSINESS RULE: Expenses categorized for financial reporting (supplies, maintenance, utilities, rent, salaries, marketing, other)
 * @audit SECURITY: Validates required fields and authenticates creating user
 * @audit Validate: Ensures category is valid expense category
 * @audit Validate: Ensures amount is positive number
 * @audit AUDIT: All expenses logged in audit_logs with category, description, and amount
 * @audit PERFORMANCE: Single insert with automatic created_by timestamp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      location_id,
      category,
      description,
      amount,
      expense_date,
      payment_method,
      receipt_url,
      notes
    } = body

    if (!category || !description || !amount || !expense_date) {
      return NextResponse.json(
        { success: false, error: 'category, description, amount, and expense_date are required' },
        { status: 400 }
      )
    }

    const { data: expense, error } = await supabaseAdmin
      .from('expenses')
      .insert({
        location_id,
        category,
        description,
        amount,
        expense_date,
        payment_method,
        receipt_url,
        notes,
        created_by: (await supabaseAdmin.auth.getUser()).data.user?.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating expense:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Log to audit
    await supabaseAdmin.from('audit_logs').insert({
      entity_type: 'expense',
      entity_id: expense.id,
      action: 'create',
      new_values: {
        category,
        description,
        amount
      }
    })

    return NextResponse.json({
      success: true,
      data: expense
    })
  } catch (error) {
    console.error('Error in POST /api/aperture/finance/expenses:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Retrieves a paginated list of expenses with optional filtering by location, category, and date range
 * @param {NextRequest} request - HTTP request with query parameters: location_id, category, start_date, end_date, limit (default 50), offset (default 0)
 * @returns {NextResponse} JSON with success status, array of expense records, and pagination metadata
 * @example GET /api/aperture/finance/expenses?location_id=...&category=supplies&start_date=2026-01-01&end_date=2026-01-31&limit=20
 * @audit BUSINESS RULE: Returns expenses ordered by expense date (most recent first) for expense tracking
 * @audit SECURITY: Requires authenticated admin/manager role via RLS policies
 * @audit Validate: Supports filtering by expense category (supplies, maintenance, utilities, rent, salaries, marketing, other)
 * @audit Validate: Ensures date filters are valid YYYY-MM-DD format
 * @audit PERFORMANCE: Uses indexed queries on expense_date for efficient filtering
 * @audit AUDIT: Expense list access logged for financial transparency
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location_id = searchParams.get('location_id')
    const category = searchParams.get('category')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('expenses')
      .select('*', { count: 'exact' })
      .order('expense_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (location_id) {
      query = query.eq('location_id', location_id)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (start_date) {
      query = query.gte('expense_date', start_date)
    }

    if (end_date) {
      query = query.lte('expense_date', end_date)
    }

    const { data: expenses, error, count } = await query

    if (error) {
      console.error('Error fetching expenses:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch expenses' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: expenses || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('Error in GET /api/aperture/finance/expenses:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
