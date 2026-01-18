import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

/**
 * @description Retrieves all active locations
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Locations API called with URL:', request.url)

    // Check Supabase connection
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    console.log('Executing locations query...')
    const { data: locationsData, error: queryError } = await supabase
      .from('locations')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    console.log('Query result - data:', !!locationsData, 'error:', !!queryError)

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
          details: queryError.details
        },
        { status: 500 }
      )
    }

    console.log('Locations found:', locationsData?.length || 0)
    return NextResponse.json({
      success: true,
      locations: locationsData || [],
      count: locationsData?.length || 0
    })
  } catch (error) {
    console.error('Locations GET unexpected error:', error)
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
