# Stripe Payment Integration

## Current Status
Stripe is **ENABLED in mock mode** for testing. Real Stripe integration is partially implemented but not yet activated.

## Current Implementation

### Mock Payment System
- **Component**: `components/booking/mock-payment-form.tsx`
- **Usage**: Used in `/booking/cita` for customer bookings
- **Functionality**:
  - Validates card number format (Luhn algorithm)
  - Accepts any card with correct format
  - Simulates payment processing
  - Does not charge real payments

### Environment Variables
Currently set in `.env.local` (keys removed for security - use your own Stripe keys):
```bash
NEXT_PUBLIC_STRIPE_ENABLED=false
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Note**: `NEXT_PUBLIC_STRIPE_ENABLED=false` means we use mock payments. Stripe keys are stored but not used yet.

## To Enable Real Stripe Payments

### 1. Update Environment Variables

In `.env.local`:

```bash
NEXT_PUBLIC_STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_test_your_real_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_real_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_real_webhook_secret
```

### 2. Create Stripe Webhook Endpoint

Create `app/api/stripe/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_WEBHOOK_SECRET!)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      // Update booking status to confirmed
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'confirmed', is_paid: true })
        .eq('payment_reference', paymentIntent.id)
      break

    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object as Stripe.PaymentIntent
      // Update booking status to pending/notify customer
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'pending' })
        .eq('payment_reference', failedIntent.id)
      break

    case 'charge.refunded':
      // Handle refunds - mark as cancelled or retain deposit
      break

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
```

### 3. Replace Mock Payment with Real Stripe

In `app/booking/cita/page.tsx`:

Replace the `MockPaymentForm` component usage with real Stripe integration:

```tsx
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'

// Replace the mock payment section with:
<CardElement
  options={{
    style: {
      base: {
        fontSize: '16px',
        color: 'var(--charcoal-brown)',
        '::placeholder': {
          color: 'var(--mocha-taupe)',
        },
      },
    },
  }}
/>
```

### 4. Update Payment Handling

Replace the `handleMockPayment` function with real Stripe confirmation:

```tsx
const handlePayment = async () => {
  if (!stripe || !elements) return

  const { error, paymentIntent } = await stripe.confirmCardPayment(
    paymentIntent.clientSecret,
    {
      payment_method: {
        card: elements.getElement(CardElement)!,
      }
    }
  )

  if (error) {
    // Handle error
    setErrors({ submit: error.message })
    setPageLoading(false)
  } else {
    // Payment succeeded, create booking
    createBooking(paymentIntent.id)
  }
}
```

### 5. Configure Stripe Dashboard

1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://booking.anchor23.mx/api/stripe/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 6. Update Create Payment Intent API

Ensure `/api/create-payment-intent` uses your real Stripe secret key.

## Deposit Calculation Logic

According to PRD, deposit is calculated as:
- **Weekday (Mon-Fri)**: 50% of service price, max $200
- **Weekend (Sat-Sun)**: $200 flat rate

Current implementation: `Math.min(service.base_price * 0.5, 200)`

Weekend logic needs to be added.

## Testing

### Mock Payment Testing (Current)
- Use any valid card number (Luhn algorithm compliant)
- Any expiration date in the future
- Any 3-digit CVC
- Payment always succeeds

### Real Stripe Testing (When Enabled)
- Use Stripe test cards: https://stripe.com/docs/testing
- Test success scenarios: `4242 4242 4242 4242`
- Test failure scenarios: `4000 0000 0002` (generic decline)
- Verify webhooks are received correctly
- Test refunds via Stripe Dashboard

## Deployment Checklist

Before going live with Stripe:
- [ ] Update `NEXT_PUBLIC_STRIPE_ENABLED=true`
- [ ] Use live Stripe keys (not test keys)
- [ ] Configure production webhook endpoint
- [ ] Test payment flow end-to-end
- [ ] Verify bookings are marked as confirmed
- [ ] Test refund flow
- [ ] Monitor Stripe dashboard for errors
- [ ] Set up email notifications for payment failures