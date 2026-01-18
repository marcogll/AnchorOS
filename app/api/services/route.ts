import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

/**
 * @description Retrieves active services, optionally filtered by location
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Services API called with URL:', request.url)

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    console.log('Location ID filter:', locationId)

    // Check Supabase connection
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    let query = supabase
      .from('services')
      .select('id, name, description, duration_minutes, base_price, requires_dual_artist, premium_fee_enabled, category, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    console.log('Executing query...')
    const { data: servicesData, error: queryError } = await query

    console.log('Query result - data:', !!servicesData, 'error:', !!queryError)

    if (queryError) {
      console.error('Services GET error details:', {
        message: queryError.message,
        code: queryError.code,
        details: queryError.details,
        hint: queryError.hint
      })
      return NextResponse.json(
        {
          error: queryError.message,
          code: queryError.code,
          details: queryError.details
        },
        { status: 500 }
      )
    }

    console.log('Services found:', servicesData?.length || 0)
    return NextResponse.json({
      success: true,
      services: servicesData || [],
      count: servicesData?.length || 0
    })
  } catch (error) {
    console.error('Services GET unexpected error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error')
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
