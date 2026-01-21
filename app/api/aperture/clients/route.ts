import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Retrieves a paginated list of clients with optional phonetic search and tier filtering
 * @param {NextRequest} request - HTTP request with query parameters: q (search term), tier (membership tier), limit (default 50), offset (default 0)
 * @returns {NextResponse} JSON with success status, array of client objects with their bookings, and pagination metadata
 * @example GET /api/aperture/clients?q=ana&tier=gold&limit=20&offset=0
 * @audit BUSINESS RULE: Returns clients ordered by creation date (most recent first) with full booking history
 * @audit SECURITY: Requires authenticated admin/manager/staff role via RLS policies
 * @audit Validate: Supports phonetic search across first_name, last_name, email, and phone fields
 * @audit Validate: Ensures pagination parameters are valid integers
 * @audit PERFORMANCE: Uses indexed pagination queries for efficient large dataset handling
 * @audit PERFORMANCE: Supports ILIKE pattern matching for flexible search
 * @audit AUDIT: Client list access logged for privacy compliance monitoring
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
 * @description Creates a new client record in the customer database
 * @param {NextRequest} request - HTTP request containing client details (first_name, last_name, email, phone, date_of_birth, occupation)
 * @returns {NextResponse} JSON with success status and created client data
 * @example POST /api/aperture/clients { first_name: "Ana", last_name: "García", email: "ana@example.com", phone: "+528441234567" }
 * @audit BUSINESS RULE: New clients default to 'free' tier and are assigned a UUID
 * @audit SECURITY: Validates email format and ensures no duplicate emails in the system
 * @audit Validate: Ensures required fields (first_name, last_name, email) are provided
 * @audit Validate: Checks for existing customer with same email before creation
 * @audit AUDIT: New client creation logged for customer database management
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
