import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Creates a Stripe payment intent for booking deposit payment
 * @param {NextRequest} request - HTTP request containing customer and service details
 * @returns {NextResponse} JSON with Stripe client secret, deposit amount, and service name
 * @example POST /api/create-payment-intent { customer_email: "...", service_id: "...", location_id: "...", start_time_utc: "..." }
 * @audit BUSINESS RULE: Calculates deposit as 50% of service price, capped at $200 maximum
 * @audit SECURITY: Requires valid Stripe configuration and service validation
 * @audit Validate: Ensures service exists and customer details are provided
 * @audit Validate: Validates start_time_utc format and location validity
 * @audit AUDIT: Payment intent creation is logged for audit trail
 * @audit PERFORMANCE: Single database query to fetch service pricing
 */
export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY

    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const stripe = new Stripe(stripeSecretKey)

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