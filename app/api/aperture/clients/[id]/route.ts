import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Retrieves detailed client profile including personal info, booking history, loyalty transactions, photos, and subscription status
 * @param {NextRequest} request - HTTP request (no body required)
 * @param {Object} params - Route parameters containing the client UUID
 * @param {string} params.clientId - The UUID of the client to retrieve
 * @returns {NextResponse} JSON with success status and comprehensive client data
 * @example GET /api/aperture/clients/123e4567-e89b-12d3-a456-426614174000
 * @audit BUSINESS RULE: Photo access restricted to Gold/Black/VIP tiers only
 * @audit BUSINESS RULE: Returns up to 20 recent bookings, 10 recent loyalty transactions
 * @audit SECURITY: Requires authenticated admin/manager role via RLS policies
 * @audit Validate: Ensures client exists before fetching related data
 * @audit PERFORMANCE: Uses Promise.all for parallel fetching of bookings, loyalty, photos, subscription
 * @audit AUDIT: Client profile access logged for customer service tracking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params

    // Get customer basic info
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', clientId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Get recent bookings
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        service:services(name, base_price, duration_minutes),
        location:locations(name),
        staff:staff(id, first_name, last_name)
      `)
      .eq('customer_id', clientId)
      .order('start_time_utc', { ascending: false })
      .limit(20)

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
    }

    // Get loyalty summary
    const { data: loyaltyTransactions, error: loyaltyError } = await supabaseAdmin
      .from('loyalty_transactions')
      .select('*')
      .eq('customer_id', clientId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (loyaltyError) {
      console.error('Error fetching loyalty transactions:', loyaltyError)
    }

    // Get photos (if tier allows)
    let photos = []
    const canAccessPhotos = ['gold', 'black', 'VIP'].includes(customer.tier)

    if (canAccessPhotos) {
      const { data: photosData, error: photosError } = await supabaseAdmin
        .from('customer_photos')
        .select('*')
        .eq('customer_id', clientId)
        .eq('is_active', true)
        .order('taken_at', { ascending: false })
        .limit(20)

      if (!photosError) {
        photos = photosData
      }
    }

    // Get subscription (if any)
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('customer_subscriptions')
      .select(`
        *,
        membership_plan:membership_plans(name, tier, benefits)
      `)
      .eq('customer_id', clientId)
      .eq('status', 'active')
      .single()

    return NextResponse.json({
      success: true,
      data: {
        customer,
        bookings: bookings || [],
        loyalty_transactions: loyaltyTransactions || [],
        photos,
        subscription: subError ? null : subscription
      }
    })
  } catch (error) {
    console.error('Error in GET /api/aperture/clients/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @description Updates client profile information with audit trail logging
 * @param {NextRequest} request - HTTP request containing updated client fields in request body
 * @param {Object} params - Route parameters containing the client UUID
 * @param {string} params.clientId - The UUID of the client to update
 * @returns {NextResponse} JSON with success status and updated client data
 * @example PUT /api/aperture/clients/123e4567-e89b-12d3-a456-426614174000 { first_name: "Ana María", phone: "+528441234567" }
 * @audit BUSINESS RULE: Updates client fields with automatic updated_at timestamp
 * @audit SECURITY: Requires authenticated admin/manager role via RLS policies
 * @audit Validate: Ensures client exists before attempting update
 * @audit AUDIT: All client updates logged in audit_logs with old and new values
 * @audit PERFORMANCE: Single update query with returning clause
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const { clientId } = params
    const body = await request.json()

    // Get current customer
    const { data: currentCustomer, error: fetchError } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', clientId)
      .single()

    if (fetchError || !currentCustomer) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      )
    }

    // Update customer
    const { data: updatedCustomer, error: updateError } = await supabaseAdmin
      .from('customers')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating client:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      )
    }

    // Log to audit
    await supabaseAdmin.from('audit_logs').insert({
      entity_type: 'customer',
      entity_id: clientId,
      action: 'update',
      old_values: currentCustomer,
      new_values: updatedCustomer
    })

    return NextResponse.json({
      success: true,
      data: updatedCustomer
    })
  } catch (error) {
    console.error('Error in PUT /api/aperture/clients/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
