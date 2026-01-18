import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

/**
 * @description Retrieves active services, optionally filtered by location
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')

    let query = supabase
      .from('services')
      .select('id, name, description, duration_minutes, base_price, requires_dual_artist, premium_fee_enabled, category, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    const { data: services, error } = await query

    if (error) {
      console.error('Services GET error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      services: services || []
    })
  } catch (error) {
    console.error('Services GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
