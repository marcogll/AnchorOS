import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

/**
 * @description Retrieves all active locations
 */
export async function GET(request: NextRequest) {
  try {
    console.log('=== LOCATIONS API START ===')
    console.log('Locations API called with URL:', request.url)

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

    console.log('Executing locations query...')
    const { data: locationsData, error: queryError } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    console.log('Query result - data exists:', !!locationsData, 'error exists:', !!queryError)

    if (queryError) {
      console.error('Locations GET error details:', {
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

    console.log('Locations found:', locationsData?.length || 0)
    console.log('=== LOCATIONS API END ===')
    return NextResponse.json({
      success: true,
      locations: locationsData || [],
      count: locationsData?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('=== LOCATIONS API ERROR ===')
    console.error('Locations GET unexpected error:', error)
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
