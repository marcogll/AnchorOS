import { NextRequest, NextResponse } from 'next/server';
import { googleCalendar } from '@/lib/google-calendar';

/**
 * @description Sync specific booking to Google Calendar
 * @method POST
 * @body { booking_id: string }
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin auth check
    const body = await request.json() as { booking_id: string };
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json({ success: false, error: 'booking_id required' }, { status: 400 });
    }

    // Get booking data
    // Note: In production, use supabaseAdmin.from('bookings').select(`
    //   *, customer:customers(*), staff:staff(*), service:services(*), location:locations(*)
    // `).eq('id', booking_id).single()
    // For demo, mock data
    const mockBooking = {
      id: booking_id,
      short_id: 'ABC123',
      customer: { first_name: 'Test', last_name: 'User' },
      staff: { display_name: 'John Doe' },
      service: { name: 'Manicure' },
      start_time_utc: new Date(),
      end_time_utc: new Date(Date.now() + 60*60*1000),
      location: { name: 'Location 1' },
    };

    const eventId = await googleCalendar.syncBooking(mockBooking, 'create');

    return NextResponse.json({
      success: true,
      data: { google_event_id: eventId },
    });
  } catch (error: any) {
    console.error('Booking sync failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}