import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description CRITICAL: Detect and mark no-show bookings (runs every 2 hours)
 * @param {NextRequest} request - Must include Bearer token with CRON_SECRET
 * @returns {NextResponse} No-show detection results with count of bookings processed
 * @example curl -H "Authorization: Bearer YOUR_CRON_SECRET" /api/cron/detect-no-shows
 * @audit BUSINESS RULE: No-show window is 12 hours after booking start time (UTC)
 * @audit SECURITY: Requires CRON_SECRET environment variable for authentication
 * @audit Validate: Only confirmed/pending bookings without check-in are affected
 * @audit AUDIT: Detection action logged in audit_logs with booking details
 * @audit PERFORMANCE: Efficient query with date range and status filters
 * @audit RELIABILITY: Cron job should run every 2 hours to detect no-shows
 */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const cronKey = authHeader.replace('Bearer ', '').trim()

    if (cronKey !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Invalid cron key' },
        { status: 403 }
      )
    }

    // Calculate no-show window: bookings that started more than 12 hours ago
    const windowStart = new Date()
    windowStart.setHours(windowStart.getHours() - 12)

    // Get eligible bookings (confirmed/pending, no check-in, started > 12h ago)
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, start_time_utc, customer_id, service_id, deposit_amount')
      .in('status', ['confirmed', 'pending'])
      .lt('start_time_utc', windowStart.toISOString())
      .is('check_in_time', null)

    if (bookingsError) {
      console.error('Error fetching bookings for no-show detection:', bookingsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      )
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings to process',
        processedCount: 0,
        detectedCount: 0
      })
    }

    let detectedCount = 0

    // Process each booking
    for (const booking of bookings) {
      const detected = await supabaseAdmin.rpc('detect_no_show_booking', {
        p_booking_id: booking.id
      })

      if (detected) {
        detectedCount++
      }
    }

    console.log(`No-show detection completed: ${detectedCount} bookings detected out of ${bookings.length} processed`)

    return NextResponse.json({
      success: true,
      message: 'No-show detection completed successfully',
      processedCount: bookings.length,
      detectedCount
    })

  } catch (error) {
    console.error('Error in no-show detection:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
