import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description List and search clients with phonetic search, history, and technical notes
 * @param {NextRequest} request - Query params: q (search query), tier (filter by tier), limit (results limit), offset (pagination offset)
 * @returns {NextResponse} List of clients with their details
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const q = searchParams.get('q') || ''
    const tier = searchParams.get('tier')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseAdmin
      .from('customers')
      .select(`
        *,
        bookings:bookings(
          id,
          short_id,
          service_id,
          start_time_utc,
          status,
          total_price
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply tier filter
    if (tier) {
      query = query.eq('tier', tier)
    }

    // Apply phonetic search if query provided
    if (q) {
      const searchTerm = `%${q}%`
      query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
    }

    const { data: customers, error, count } = await query

    if (error) {
      console.error('Error fetching clients:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch clients' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error('Error in /api/aperture/clients:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Create new client
 * @param {NextRequest} request - Body with client details
 * @returns {NextResponse} Created client data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      first_name,
      last_name,
      email,
      phone,
      tier = 'free',
      notes,
      preferences,
      referral_code
    } = body

    // Validate required fields
    if (!first_name || !last_name) {
      return NextResponse.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Generate unique referral code if not provided
    let finalReferralCode = referral_code
    if (!finalReferralCode) {
      finalReferralCode = `${first_name.toLowerCase().replace(/[^a-z]/g, '')}${last_name.toLowerCase().replace(/[^a-z]/g, '')}${Date.now().toString(36)}`
    }

    // Create customer
    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .insert({
        first_name,
        last_name,
        email: email || null,
        phone: phone || null,
        tier,
        notes,
        preferences: preferences || {},
        referral_code: finalReferralCode
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating client:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    // Log to audit
    await supabaseAdmin.from('audit_logs').insert({
      entity_type: 'customer',
      entity_id: customer.id,
      action: 'create',
      new_values: {
        first_name,
        last_name,
        email,
        tier
      }
    })

    return NextResponse.json({
      success: true,
      data: customer
    })
  } catch (error) {
    console.error('Error in POST /api/aperture/clients:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
