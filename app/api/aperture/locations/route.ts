import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Gets all active locations
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