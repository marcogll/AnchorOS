import { NextRequest, NextResponse } from 'next/server';
import { googleCalendar } from '@/lib/google-calendar';

/**
 * @description Manual sync all staff calendars from Google
 * @method POST
 * @body { staff_ids?: string[] } - Optional staff IDs to sync
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin auth check
    const body = await request.json();
    const { staff_ids } = body;

    if (!googleCalendar.isReady()) {
      return NextResponse.json({ success: false, error: 'Google Calendar not configured' }, { status: 503 });
    }

    // TODO: Fetch staff from DB, loop through each, sync their calendar events
    // For now, test connection
    const result = await googleCalendar.testConnection();

    return NextResponse.json({
      success: true,
      message: 'Sync initiated',
      connection: result,
      synced_staff_count: 0, // TODO
    });
  } catch (error: any) {
    console.error('Calendar sync failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
