import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

/**
 * @description Fetches payroll report for staff based on recent bookings
 */
export async function GET() {
  try {
    // Get staff and their bookings this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const { data: staffBookings, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        staff_id,
        staff(display_name),
        services(base_price),
        created_at
      `)
      .eq('status', 'completed')
      .gte('created_at', weekAgo.toISOString())

    if (error) throw error

    const payrollMap: { [key: string]: any } = {}

    staffBookings.forEach(booking => {
      const staffId = booking.staff_id
      if (!payrollMap[staffId]) {
        payrollMap[staffId] = {
          id: staffId,
          name: booking.staff?.[0]?.display_name || 'Unknown',
          bookings: 0,
          commission: 0
        }
      }
      payrollMap[staffId].bookings += 1
      payrollMap[staffId].commission += (booking.services?.[0]?.base_price || 0) * 0.1 // 10% commission
    })

    // Assume base hours and pay
    const payroll = Object.values(payrollMap).map((staff: any) => ({
      ...staff,
      hours: 40, // Assume 40 hours
      basePay: 1000, // Base weekly pay
      weeklyPay: staff.basePay + staff.commission
    }))

    return NextResponse.json({
      success: true,
      payroll
    })
  } catch (error) {
    console.error('Error fetching payroll report:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch payroll report' }, { status: 500 })
  }
}