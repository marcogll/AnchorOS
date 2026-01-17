import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Get staff role by user ID for authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId' },
        { status: 400 }
      )
    }

    const { data: staff, error } = await supabaseAdmin
      .from('staff')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (error || !staff) {
      console.error('Error fetching staff role:', error)
      return NextResponse.json(
        { success: false, error: 'Staff record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      role: staff.role
    })
  } catch (error) {
    console.error('Staff role check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
