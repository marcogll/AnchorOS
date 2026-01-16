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

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await validateAdmin(request)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('location_id')
    const role = searchParams.get('role')

    let query = supabaseAdmin
      .from('staff')
      .select(`
        id,
        user_id,
        location_id,
        role,
        display_name,
        phone,
        is_active,
        created_at,
        updated_at,
        location (
          id,
          name,
          timezone
        )
      `)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (role) {
      query = query.eq('role', role)
    }

    const { data: staff, error: staffError } = await query.order('created_at', { ascending: false })

    if (staffError) {
      return NextResponse.json(
        { error: staffError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ staff })
  } catch (error) {
    console.error('Admin users GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await validateAdmin(request)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      location_id,
      role,
      display_name,
      phone,
      email,
      password,
      first_name,
      last_name
    } = body

    if (!location_id || !role || !display_name) {
      return NextResponse.json(
        { error: 'Missing required fields: location_id, role, display_name' },
        { status: 400 }
      )
    }

    if (!['admin', 'manager', 'staff', 'artist'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be: admin, manager, staff, or artist' },
        { status: 400 }
      )
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required to create auth user' },
        { status: 400 }
      )
    }

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name
      }
    })

    if (authError || !authUser) {
      return NextResponse.json(
        { error: authError?.message || 'Failed to create auth user' },
        { status: 400 }
      )
    }

    const { data: staff, error: staffError } = await supabaseAdmin
      .from('staff')
      .insert({
        user_id: authUser.user.id,
        location_id,
        role,
        display_name,
        phone,
        is_active: true
      })
      .select()
      .single()

    if (staffError || !staff) {
      return NextResponse.json(
        { error: staffError?.message || 'Failed to create staff record' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      staff: {
        ...staff,
        email: authUser.user.email,
        first_name: authUser.user.user_metadata?.first_name,
        last_name: authUser.user.user_metadata?.last_name
      },
      message: 'User created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Admin users POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
