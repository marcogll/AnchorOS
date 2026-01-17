import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * @description Creates a Stripe payment intent for booking deposit (50% of service price, max $200)
 * @param {NextRequest} request - Request containing booking details
 * @returns {NextResponse} Payment intent client secret and amount
 */
export async function POST(request: NextRequest) {
  try {
    const {
      customer_email,
      customer_phone,
      customer_first_name,
      customer_last_name,
      service_id,
      location_id,
      start_time_utc,
      notes
    } = await request.json()

    // Get service price
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('base_price, name')
      .eq('id', service_id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 400 })
    }

    // Calculate deposit (50% or $200 max)
    const depositAmount = Math.min(service.base_price * 0.5, 200) * 100 // in cents

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmount),
      currency: 'usd',
      metadata: {
        service_id,
        location_id,
        start_time_utc,
        customer_email,
        customer_phone,
        customer_first_name,
        customer_last_name,
        notes: notes || ''
      },
      receipt_email: customer_email,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: depositAmount,
      serviceName: service.name
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}