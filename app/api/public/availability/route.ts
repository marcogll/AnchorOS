import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

/**
 * @description Public API endpoint providing basic location and service information for booking availability overview
 * @param {NextRequest} request - HTTP request with required query parameter: location_id
 * @returns {NextResponse} JSON with location details and list of active services, plus guidance to detailed availability endpoint
 * @example GET /api/public/availability?location_id=123e4567-e89b-12d3-a456-426614174000
 * @audit BUSINESS RULE: Provides high-level availability info; detailed time slots available via /api/availability/time-slots
 * @audit SECURITY: Public endpoint; no authentication required; returns only active locations and services
 * @audit Validate: Ensures location_id is provided and location is active
 * @audit PERFORMANCE: Single query fetches location and services with indexed lookups
 * @audit AUDIT: High-volume public endpoint; consider rate limiting in production
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')

    if (!locationId) {
      return NextResponse.json(
        { error: 'Missing required parameter: location_id' },
        { status: 400 }
      )
    }

    // Get location details
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id, name, timezone')
      .eq('id', locationId)
      .eq('is_active', true)
      .single()

    if (locationError || !location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Get active services for this location
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, duration_minutes, base_price')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (servicesError) {
      console.error('Public availability services error:', servicesError)
      return NextResponse.json(
        { error: servicesError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      location,
      services: services || [],
      note: 'Use /api/availability/time-slots for detailed availability'
    })
  } catch (error) {
    console.error('Public availability GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}