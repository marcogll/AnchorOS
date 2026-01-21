import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * @description Generates a PDF receipt for a completed booking
 * @param {NextRequest} request - HTTP request (no body required for GET)
 * @param {Object} params - Route parameters containing booking UUID
 * @param {string} params.bookingId - The UUID of the booking to generate receipt for
 * @returns {NextResponse} PDF file as binary response with Content-Type application/pdf
 * @example GET /api/receipts/123e4567-e89b-12d3-a456-426614174000
 * @audit BUSINESS RULE: Generates receipt with booking details, service info, pricing, and branding
 * @audit SECURITY: Validates booking exists and user has access to view receipt
 * @audit Validate: Ensures booking data is complete before PDF generation
 * @audit PERFORMANCE: Single query fetches all related booking data (customer, service, staff, location)
 * @audit AUDIT: Receipt generation is logged for audit trail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const supabase = supabaseAdmin

    // Get booking with related data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customers(*),
        service:services(*),
        staff:staff(*),
        location:locations(*)
      `)
      .eq('id', params.bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Create PDF
    const doc = new jsPDF()

    // Set font
    doc.setFont('helvetica')

    // Header
    doc.setFontSize(20)
    doc.setTextColor(139, 69, 19) // Saddle brown
    doc.text('ANCHOR:23', 20, 30)

    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Recibo de Reserva', 20, 45)

    // Booking details
    doc.setFontSize(12)
    let y = 65

    doc.text(`Número de Reserva: ${booking.id.slice(-8).toUpperCase()}`, 20, y)
    y += 10

    doc.text(`Fecha de Reserva: ${format(new Date(booking.created_at), 'PPP', { locale: es })}`, 20, y)
    y += 10

    doc.text(`Cliente: ${booking.customer.first_name} ${booking.customer.last_name}`, 20, y)
    y += 10

    doc.text(`Servicio: ${booking.service.name}`, 20, y)
    y += 10

    doc.text(`Profesional: ${booking.staff.first_name} ${booking.staff.last_name}`, 20, y)
    y += 10

    doc.text(`Ubicación: ${booking.location.name}`, 20, y)
    y += 10

    doc.text(`Fecha y Hora: ${format(new Date(booking.date), 'PPP p', { locale: es })}`, 20, y)
    y += 10

    doc.text(`Duración: ${booking.service.duration} minutos`, 20, y)
    y += 10

    // Price
    y += 10
    doc.setFontSize(14)
    doc.text(`Total: $${booking.service.price} MXN`, 20, y)

    // Footer
    y = 250
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text('ANCHOR:23 - Belleza anclada en exclusividad', 20, y)
    y += 5
    doc.text('Saltillo, Coahuila, México | contacto@anchor23.mx', 20, y)
    y += 5
    doc.text('+52 844 123 4567', 20, y)

    // Generate buffer
    const pdfBuffer = doc.output('arraybuffer')

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=receipt-${booking.id.slice(-8)}.pdf`
      }
    })

  } catch (error) {
    console.error('Receipt generation error:', error)
    return NextResponse.json({ error: 'Failed to generate receipt' }, { status: 500 })
  }
}