import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Resend } from 'resend'

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey === 'placeholder' || apiKey === '<REDACTED>') {
    return null
  }
  return new Resend(apiKey)
}

/** @description Send receipt email for booking */
export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    // Get booking data
    const { data: booking, error: bookingError } = await supabaseAdmin
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

    // Generate PDF
    const doc = new jsPDF()
    doc.setFont('helvetica')

    // Header
    doc.setFontSize(20)
    doc.setTextColor(139, 69, 19)
    doc.text('ANCHOR:23', 20, 30)

    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Recibo de Reserva', 20, 45)

    // Details
    doc.setFontSize(12)
    let y = 65
    doc.text(`Número de Reserva: ${booking.id.slice(-8).toUpperCase()}`, 20, y)
    y += 10
    doc.text(`Cliente: ${booking.customer.first_name} ${booking.customer.last_name}`, 20, y)
    y += 10
    doc.text(`Servicio: ${booking.service.name}`, 20, y)
    y += 10
    doc.text(`Fecha y Hora: ${format(new Date(booking.date), 'PPP p', { locale: es })}`, 20, y)
    y += 10
    doc.text(`Total: $${booking.service.price} MXN`, 20, y)

    // Footer
    y = 250
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text('ANCHOR:23 - Belleza anclada en exclusividad', 20, y)

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Send email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Recibo de Reserva - ANCHOR:23</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { color: #8B4513; font-size: 24px; font-weight: bold; }
            .details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">ANCHOR:23</div>
              <h1>Confirmación de Reserva</h1>
            </div>

            <p>Hola ${booking.customer.first_name},</p>
            <p>Tu reserva ha sido confirmada. Adjunto el recibo.</p>

            <div class="details">
              <p><strong>Servicio:</strong> ${booking.service.name}</p>
              <p><strong>Fecha:</strong> ${format(new Date(booking.date), 'PPP', { locale: es })}</p>
              <p><strong>Hora:</strong> ${format(new Date(booking.date), 'p', { locale: es })}</p>
              <p><strong>Total:</strong> $${booking.service.price} MXN</p>
            </div>

            <div class="footer">
              <p>ANCHOR:23 - Saltillo, Coahuila, México</p>
            </div>
          </div>
        </body>
      </html>
    `

    const resend = getResendClient()
    if (!resend) {
      console.error('RESEND_API_KEY not configured')
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'ANCHOR:23 <noreply@anchor23.mx>',
      to: booking.customer.email,
      subject: 'Confirmación de Reserva - ANCHOR:23',
      html: emailHtml,
      attachments: [
        {
          filename: `recibo-${booking.id.slice(-8)}.pdf`,
          content: pdfBuffer
        }
      ]
    })

    if (emailError) {
      console.error('Email error:', emailError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, emailId: emailResult?.id })

  } catch (error) {
    console.error('Receipt email error:', error)
    return NextResponse.json({ error: 'Failed to send receipt email' }, { status: 500 })
  }
}