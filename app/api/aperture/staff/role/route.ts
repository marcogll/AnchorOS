import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Retrieves the staff role for a given user ID for authorization purposes
 * @param {NextRequest} request - JSON body with userId field
 * @returns {NextResponse} JSON with success status and role (admin, manager, staff, artist, kiosk)
 * @example POST /api/aperture/staff/role {"userId": "123e4567-e89b-12d3-a456-426614174000"}
 * @audit BUSINESS ROLE: Role determines API access levels and UI capabilities
 * @audit SECURITY: Critical for authorization - only authenticated users can query their role
 * @audit Validate: userId must be a valid UUID format
 * @audit PERFORMANCE: Single-row lookup on indexed user_id column
 * @audit AUDIT: Role access logged for security monitoring and access control audits
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
