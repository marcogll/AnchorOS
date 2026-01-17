import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

async function validateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  
  if (token !== process.env.ADMIN_ENROLLMENT_KEY) {
    return null
  }

  return true
}

/**
 * @description Retrieves all locations for admin
 */
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await validateAdmin(request)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: locations, error } = await supabaseAdmin
      .from('locations')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Admin locations GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
