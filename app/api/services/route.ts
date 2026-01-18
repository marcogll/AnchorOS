import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

/**
 * @description Retrieves active services, optionally filtered by location
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== SERVICES API START ===')
    console.log('Services API called with URL:', request.url)

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    console.log('Location ID filter:', locationId)

    // Test basic fetch to Supabase URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    console.log('Testing basic connectivity to Supabase...')
    try {
      const testResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json'
        }
      })
      console.log('Basic Supabase connectivity test:', testResponse.status, testResponse.statusText)
    } catch (fetchError) {
      console.error('Basic fetch test failed:', fetchError)
    }

    let query = supabase
      .from('services')
      .select('id, name, description, duration_minutes, base_price, requires_dual_artist, premium_fee_enabled, category, is_active, created_at, updated_at')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    console.log('Executing Supabase query...')
    const { data: servicesData, error: queryError } = await query

    console.log('Query result - data exists:', !!servicesData, 'error exists:', !!queryError)

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
          details: queryError.details,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      )
    }

    console.log('Services found:', servicesData?.length || 0)
    console.log('=== SERVICES API END ===')
    return NextResponse.json({
      success: true,
      services: servicesData || [],
      count: servicesData?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('=== SERVICES API ERROR ===')
    console.error('Services GET unexpected error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'Unknown error')
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
