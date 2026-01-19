import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Get specific client details with full history
 * @param {NextRequest} request - URL params: clientId in path
 * @returns {NextResponse} Client details with bookings, loyalty, photos
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
 * @description Update client information
 * @param {NextRequest} request - Body with updated client data
 * @returns {NextResponse} Updated client data
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
