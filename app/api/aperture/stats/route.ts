import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * @description Get Aperture dashboard statistics
 * @returns Statistics for dashboard display
 */

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here'

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setHours(23, 59, 59, 999);

    const todayStartUTC = todayStart.toISOString();
    const todayEndUTC = todayEnd.toISOString();

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const monthEndUTC = monthEnd.toISOString();

    const { count: totalBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEndUTC);

    if (bookingsError) {
      console.error('Error fetching total bookings:', bookingsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch total bookings' },
        { status: 500 }
      );
    }

    const { data: payments, error: paymentsError } = await supabase
      .from('bookings')
      .select('total_price')
      .eq('status', 'completed')
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEndUTC);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    const totalRevenue = payments?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;

    const { count: completedToday, error: completedError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('end_time_utc', todayStartUTC)
      .lte('end_time_utc', todayEndUTC);

    if (completedError) {
      console.error('Error fetching completed today:', completedError);
    }

    const { count: upcomingToday, error: upcomingError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .in('status', ['confirmed', 'pending'])
      .gte('start_time_utc', todayStartUTC)
      .lte('start_time_utc', todayEndUTC);

    if (upcomingError) {
      console.error('Error fetching upcoming today:', upcomingError);
    }

    const stats = {
      totalBookings: totalBookings || 0,
      totalRevenue: totalRevenue,
      completedToday: completedToday || 0,
      upcomingToday: upcomingToday || 0
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error in /api/aperture/stats:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
