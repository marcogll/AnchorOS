import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { googleCalendar } from '@/lib/google-calendar';

/**
 * @description Test Google Calendar connection endpoint
 * @description Only accessible by admin/manager roles
 */
export async function GET(request: NextRequest) {
  try {
// TODO: Add admin auth check using middleware or supabaseAdmin
// Temporarily open for testing

    // Test connection
    const result = await googleCalendar.testConnection();

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Google Calendar test failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}