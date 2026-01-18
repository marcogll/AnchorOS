import { NextRequest, NextResponse } from 'next/server';
import { googleCalendar } from '@/lib/google-calendar';

/**
 * @description Google Calendar webhook endpoint for push notifications
 * @description Verifies hub.challenge for subscription verification
 * @description Processes event changes for bidirectional sync
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const hubMode = url.searchParams.get('hub.mode');
  const hubChallenge = url.searchParams.get('hub.challenge');
  const hubVerifyToken = url.searchParams.get('hub.verify_token');

  // Verify subscription challenge
  if (hubMode === 'subscribe' && hubVerifyToken === process.env.GOOGLE_CALENDAR_VERIFY_TOKEN) {
    return new NextResponse(hubChallenge!, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Verify webhook signature
    const body = await request.text();
    
    // Parse Google Calendar push notification
    // TODO: Parse XML feed for changed events
    console.log('Google Calendar webhook received:', body);

    // Process changed events:
    // 1. Fetch changed events from Google
    // 2. Upsert to google_calendar_events table
    // 3. Trigger availability recalculation if blocking

    return NextResponse.json({ success: true, processed: true });
  } catch (error: any) {
    console.error('Google Calendar webhook failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}