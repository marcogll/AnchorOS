import { Resend } from 'resend'

/**
 * @description Email service integration using Resend API for transactional emails
 * @audit BUSINESS RULE: Sends HTML-formatted emails with PDF receipt attachments
 * @audit SECURITY: Requires RESEND_API_KEY environment variable for authentication
 * @audit PERFORMANCE: Uses Resend SDK for reliable email delivery
 * @audit AUDIT: Email send results logged for delivery tracking
 */

/** Resend client instance configured with API key */
const resendClient = new Resend(process.env.RESEND_API_KEY!)

/**
 * @description Interface defining data required for receipt email
 * @property {string} to - Recipient email address
 * @property {string} customerName - Customer's first name for personalization
 * @property {string} bookingId - UUID of the booking for receipt generation
 * @property {string} serviceName - Name of the booked service
 * @property {string} date - Formatted date of the appointment
 * @property {string} time - Formatted time of the appointment
 * @property {string} location - Name and address of the salon location
 * @property {string} staffName - Assigned staff member name
 * @property {number} price - Total price of the service in MXN
 * @property {string} pdfUrl - URL path to the generated PDF receipt
 */
interface ReceiptEmailData {
  to: string
  customerName: string
  bookingId: string
  serviceName: string
  date: string
  time: string
  location: string
  staffName: string
  price: number
  pdfUrl: string
}

/**
 * @description Sends a receipt confirmation email with PDF attachment to the customer
 * @param {ReceiptEmailData} data - Email data including customer details and booking information
 * @returns {Promise<{ success: boolean; data?: any; error?: any }>} - Result of email send operation
 * @example sendReceiptEmail({ to: 'customer@email.com', customerName: 'Ana', bookingId: '...', serviceName: 'Manicure', date: '2026-01-21', time: '10:00', location: 'ANCHOR:23 Saltillo', staffName: 'Maria', price: 1500, pdfUrl: '/receipts/...' })
 * @audit BUSINESS RULE: Sends branded HTML email with ANCHOR:23 styling and Spanish content
 * @audit Validate: Attaches PDF receipt with booking ID in filename
 * @audit PERFORMANCE: Single API call to Resend with HTML content and attachment
 * @audit AUDIT: Email sending logged for customer communication tracking
 */
export async function sendReceiptEmail(data: ReceiptEmailData) {
  try {
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
            .btn { display: inline-block; background: #8B4513; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">ANCHOR:23</div>
              <h1>Confirmación de Reserva</h1>
            </div>

            <p>Hola ${data.customerName},</p>

            <p>Tu reserva ha sido confirmada exitosamente. Aquí están los detalles:</p>

            <div class="details">
              <h3>Detalles de la Reserva</h3>
              <p><strong>Servicio:</strong> ${data.serviceName}</p>
              <p><strong>Fecha:</strong> ${data.date}</p>
              <p><strong>Hora:</strong> ${data.time}</p>
              <p><strong>Ubicación:</strong> ${data.location}</p>
              <p><strong>Profesional:</strong> ${data.staffName}</p>
              <p><strong>Total:</strong> $${data.price} MXN</p>
            </div>

            <p>Adjunto encontrarás el recibo en formato PDF para tus registros.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.pdfUrl}" class="btn">Descargar Recibo PDF</a>
            </div>

            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

            <p>¡Te esperamos en ANCHOR:23!</p>

            <div class="footer">
              <p>ANCHOR:23 - Belleza anclada en exclusividad</p>
              <p>Saltillo, Coahuila, México</p>
              <p>+52 844 123 4567 | contacto@anchor23.mx</p>
            </div>
          </div>
        </body>
      </html>
    `

    const { data: result, error } = await resendClient.emails.send({
      from: 'ANCHOR:23 <noreply@anchor23.mx>',
      to: data.to,
      subject: 'Confirmación de Reserva - ANCHOR:23',
      html: emailHtml,
      attachments: [
        {
          filename: `recibo-${data.bookingId.slice(-8)}.pdf`,
          path: data.pdfUrl
        }
      ]
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error }
    }

    return { success: true, data: result }

  } catch (error) {
    console.error('Email service error:', error)
    return { success: false, error }
  }
}
