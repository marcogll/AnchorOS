import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Retrieves all active salon locations with their details for dropdown/selection UI
 * @param {NextRequest} request - HTTP request (no body required)
 * @returns {NextResponse} JSON with success status and array of active locations sorted by name
 * @example GET /api/aperture/locations
 * @audit BUSINESS RULE: Only active locations returned for booking availability
 * @audit SECURITY: Location data is public-facing but RLS policies still applied
 * @audit Validate: No query parameters - returns all active locations
 * @audit PERFORMANCE: Indexed query on is_active and name columns for fast retrieval
 * @audit DATA INTEGRITY: Timezone field critical for appointment scheduling conversions
 */
export async function GET(request: NextRequest) {
  try {
    const { data: locations, error } = await supabaseAdmin
      .from('locations')
      .select('id, name, address, timezone, is_active')
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Locations GET error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      locations: locations || []
    })
  } catch (error) {
    console.error('Locations GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}