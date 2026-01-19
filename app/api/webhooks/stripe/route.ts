import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Stripe from 'stripe'

/**
 * @description Handle Stripe webhooks for payment intents and refunds
 * @param {NextRequest} request - Raw Stripe webhook payload with signature
 * @returns {NextResponse} Webhook processing result
 */
export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!stripeSecretKey || !stripeWebhookSecret) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeSecretKey)

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeWebhookSecret
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const eventId = event.id

    // Check if event already processed
    const { data: existingLog } = await supabaseAdmin
      .from('webhook_logs')
      .select('*')
      .eq('event_id', eventId)
      .single()

    if (existingLog) {
      console.log(`Event ${eventId} already processed, skipping`)
      return NextResponse.json({ received: true, already_processed: true })
    }

    // Log webhook event
    await supabaseAdmin.from('webhook_logs').insert({
      event_type: event.type,
      event_id: eventId,
      payload: event.data as any
    })

    // Process based on event type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await supabaseAdmin.rpc('process_payment_intent_succeeded', {
          p_event_id: eventId,
          p_payload: event.data as any
        })
        break

      case 'payment_intent.payment_failed':
        await supabaseAdmin.rpc('process_payment_intent_failed', {
          p_event_id: eventId,
          p_payload: event.data as any
        })
        break

      case 'charge.refunded':
        await supabaseAdmin.rpc('process_charge_refunded', {
          p_event_id: eventId,
          p_payload: event.data as any
        })
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Stripe webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
