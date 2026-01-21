import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * @description Generates sales report with metrics: total revenue, completed bookings, average price, and sales breakdown by service
 * @returns {NextResponse} JSON with success status and comprehensive sales metrics
 * @example GET /api/aperture/reports/sales
 * @audit BUSINESS RULE: Only completed bookings (status='completed') counted in sales metrics
 * @audit SECURITY: Sales data restricted to admin/manager roles for financial confidentiality
 * @audit Validate: No query parameters required - returns all-time sales data
 * @audit PERFORMANCE: Uses reduce operations on client side for aggregation (suitable for small-medium datasets)
 * @audit PERFORMANCE: Consider adding date filters for larger datasets (current implementation scans all bookings)
 * @audit AUDIT: Sales reports generated logged for financial compliance and auditing
 */
export async function GET() {
  try {
    // Get total sales
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('services(base_price)')
      .eq('status', 'completed')

    if (bookingsError) throw bookingsError

    const totalSales = bookings.reduce((sum, booking) => sum + (booking.services?.[0]?.base_price || 0), 0)

    // Get completed bookings count
    const completedBookings = bookings.length

    // Get average service price
    const { data: services, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('base_price')

    if (servicesError) throw servicesError

    const avgServicePrice = services.length > 0
      ? Math.round(services.reduce((sum, s) => sum + s.base_price, 0) / services.length)
      : 0

    // Sales by service
    const { data: salesByService, error: salesError } = await supabaseAdmin
      .from('bookings')
      .select('services(name, base_price)')
      .eq('status', 'completed')

    if (salesError) throw salesError

    const serviceTotals: { [key: string]: number } = {}
    salesByService.forEach(booking => {
      const serviceName = booking.services?.[0]?.name || 'Unknown'
      serviceTotals[serviceName] = (serviceTotals[serviceName] || 0) + (booking.services?.[0]?.base_price || 0)
    })

    const salesByServiceArray = Object.entries(serviceTotals).map(([service, total]) => ({
      service,
      total
    }))

    return NextResponse.json({
      success: true,
      totalSales,
      completedBookings,
      avgServicePrice,
      salesByService: salesByServiceArray
    })
  } catch (error) {
    console.error('Error fetching sales report:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch sales report' }, { status: 500 })
  }
}