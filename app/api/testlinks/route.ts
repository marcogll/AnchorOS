import { NextRequest, NextResponse } from 'next/server'

/**
 * @description Test links page - Access to all AnchorOS pages and API endpoints
 * @param {NextRequest} request
 * @returns {NextResponse} HTML page with links to all pages and APIs
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:2311'

  const pages = [
    // anchor23.mx - Frontend Institucional
    { name: 'Home (Landing)', url: '/' },
    { name: 'Servicios', url: '/servicios' },
    { name: 'Historia', url: '/historia' },
    { name: 'Contacto', url: '/contacto' },
    { name: 'Franquicias', url: '/franchises' },
    { name: 'Membresías', url: '/membresias' },
    { name: 'Privacy Policy', url: '/privacy-policy' },
    { name: 'Legal', url: '/legal' },

    // booking.anchor23.mx - The Boutique (Frontend de Reservas)
    { name: 'Booking - Servicios', url: '/booking/servicios' },
    { name: 'Booking - Cita', url: '/booking/cita' },
    { name: 'Booking - Confirmación', url: '/booking/confirmacion' },
    { name: 'Booking - Registro', url: '/booking/registro' },
    { name: 'Booking - Login', url: '/booking/login' },
    { name: 'Booking - Perfil', url: '/booking/perfil' },
    { name: 'Booking - Mis Citas', url: '/booking/mis-citas' },

    // aperture.anchor23.mx - Dashboard Administrativo
    { name: 'Aperture - Login', url: '/aperture/login' },
    { name: 'Aperture - Dashboard', url: '/aperture' },
    { name: 'Aperture - Calendario', url: '/aperture/calendar' },

    // kiosk.anchor23.mx - Sistema de Autoservicio
    { name: 'Kiosk - [locationId]', url: '/kiosk/LOCATION_ID_HERE' },

    // Admin & Enrollment
    { name: 'HQ Dashboard (Antiguo)', url: '/hq' },
    { name: 'Admin Enrollment', url: '/admin/enrollment' },
  ]

  const apis = [
    // APIs Públicas
    { name: 'Services', url: '/api/services', method: 'GET' },
    { name: 'Locations', url: '/api/locations', method: 'GET' },
    { name: 'Customers (List)', url: '/api/customers', method: 'GET' },
    { name: 'Customers (Create)', url: '/api/customers', method: 'POST' },
    { name: 'Availability', url: '/api/availability', method: 'GET' },
    { name: 'Availability Time Slots', url: '/api/availability/time-slots', method: 'GET' },
    { name: 'Public Availability', url: '/api/public/availability', method: 'GET' },
    { name: 'Availability Blocks', url: '/api/availability/blocks', method: 'GET' },
    { name: 'Bookings (List)', url: '/api/bookings', method: 'GET' },
    { name: 'Bookings (Create)', url: '/api/bookings', method: 'POST' },

    // Kiosk APIs
    { name: 'Kiosk - Authenticate', url: '/api/kiosk/authenticate', method: 'POST' },
    { name: 'Kiosk - Available Resources', url: '/api/kiosk/resources/available', method: 'GET' },
    { name: 'Kiosk - Bookings', url: '/api/kiosk/bookings', method: 'POST' },
    { name: 'Kiosk - Walkin', url: '/api/kiosk/walkin', method: 'POST' },

    // Payment APIs
    { name: 'Create Payment Intent', url: '/api/create-payment-intent', method: 'POST' },

    // Aperture APIs
    { name: 'Aperture - Dashboard', url: '/api/aperture/dashboard', method: 'GET' },
    { name: 'Aperture - Stats', url: '/api/aperture/stats', method: 'GET' },
    { name: 'Aperture - Calendar', url: '/api/aperture/calendar', method: 'GET' },
    { name: 'Aperture - Staff (List)', url: '/api/aperture/staff', method: 'GET' },
    { name: 'Aperture - Staff (Create)', url: '/api/aperture/staff', method: 'POST' },
    { name: 'Aperture - Resources', url: '/api/aperture/resources', method: 'GET' },
    { name: 'Aperture - Payroll', url: '/api/aperture/payroll', method: 'GET' },
    { name: 'Aperture - POS', url: '/api/aperture/pos', method: 'POST' },
    { name: 'Aperture - Close Day', url: '/api/aperture/pos/close-day', method: 'POST' },

    // Client Management (FASE 5)
    { name: 'Aperture - Clients (List)', url: '/api/aperture/clients', method: 'GET' },
    { name: 'Aperture - Clients (Create)', url: '/api/aperture/clients', method: 'POST' },
    { name: 'Aperture - Client Details', url: '/api/aperture/clients/[id]', method: 'GET' },
    { name: 'Aperture - Client Notes', url: '/api/aperture/clients/[id]/notes', method: 'POST' },
    { name: 'Aperture - Client Photos', url: '/api/aperture/clients/[id]/photos', method: 'GET' },

    // Loyalty System (FASE 5)
    { name: 'Aperture - Loyalty', url: '/api/aperture/loyalty', method: 'GET' },
    { name: 'Aperture - Loyalty History', url: '/api/aperture/loyalty/[customerId]', method: 'GET' },

    // Webhooks (FASE 6)
    { name: 'Stripe Webhooks', url: '/api/webhooks/stripe', method: 'POST' },

    // Cron Jobs (FASE 6)
    { name: 'Reset Invitations (Cron)', url: '/api/cron/reset-invitations', method: 'GET' },
    { name: 'Detect No-Shows (Cron)', url: '/api/cron/detect-no-shows', method: 'GET' },

    // Bookings Actions (FASE 6)
    { name: 'Bookings - Check-in', url: '/api/aperture/bookings/check-in', method: 'POST' },
    { name: 'Bookings - No-Show', url: '/api/aperture/bookings/no-show', method: 'POST' },

    // Finance (FASE 6)
    { name: 'Aperture - Finance Summary', url: '/api/aperture/finance', method: 'GET' },
    { name: 'Aperture - Daily Closing', url: '/api/aperture/finance/daily-closing', method: 'GET' },
    { name: 'Aperture - Expenses (List)', url: '/api/aperture/finance/expenses', method: 'GET' },
    { name: 'Aperture - Expenses (Create)', url: '/api/aperture/finance/expenses', method: 'POST' },
    { name: 'Aperture - Staff Performance', url: '/api/aperture/finance/staff-performance', method: 'GET' },
  ]

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AnchorOS - Test Links</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #667eea;
            font-size: 1.8em;
            margin-bottom: 20px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        .card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            transition: all 0.3s ease;
        }
        .card:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            border-color: #667eea;
        }
        .card h3 {
            color: #333;
            font-size: 1.1em;
            margin-bottom: 10px;
        }
        .card a {
            display: block;
            color: #667eea;
            text-decoration: none;
            font-size: 0.9em;
            word-break: break-all;
        }
        .card a:hover {
            text-decoration: underline;
        }
        .method {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 0.75em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .get { background: #28a745; color: white; }
        .post { background: #007bff; color: white; }
        .put { background: #ffc107; color: #333; }
        .delete { background: #dc3545; color: white; }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.7em;
            font-weight: bold;
            margin-left: 5px;
        }
        .phase-5 { background: #ff9800; color: white; }
        .phase-6 { background: #9c27b0; color: white; }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #e9ecef;
        }
        .info {
            background: #e7f3ff;
            border-left: 4px solid #007bff;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .info strong {
            color: #007bff;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🥂 AnchorOS - Test Links</h1>
            <p>Complete directory of all pages and API endpoints</p>
        </div>
        <div class="content">
            <div class="info">
                <strong>⚠️ Note:</strong> Replace <code>LOCATION_ID_HERE</code> with actual UUID from your database.
                For cron jobs, use: <code>curl -H "Authorization: Bearer YOUR_CRON_SECRET"</code>
            </div>

            <div class="section">
                <h2>📄 Pages</h2>
                <div class="grid">
                    ${pages.map(page => `
                        <div class="card">
                            <h3>${page.name}</h3>
                            <a href="${baseUrl}${page.url}" target="_blank">${baseUrl}${page.url}</a>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <h2>🔌 API Endpoints</h2>
                <div class="grid">
                    ${apis.map(api => `
                        <div class="card">
                            <div>
                                <span class="method ${api.method.toLowerCase()}">${api.method}</span>
                                ${api.name.includes('FASE') ? `<span class="badge ${api.name.includes('FASE 5') ? 'phase-5' : 'phase-6'}">${api.name.match(/FASE \d+/)?.[0] || 'FASE'}</span>` : ''}
                            </div>
                            <h3>${api.name}</h3>
                            <a href="${baseUrl}${api.url}" target="_blank">${baseUrl}${api.url}</a>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        <div class="footer">
            <p>AnchorOS - Codename: Adela | Last updated: ${new Date().toISOString()}</p>
        </div>
    </div>
</body>
</html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}