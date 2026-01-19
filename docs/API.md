# AnchorOS API Documentation

## Overview
AnchorOS is a comprehensive salon management system built with Next.js, Supabase, and Stripe integration.

## Authentication
- **Client Authentication**: Magic link via Supabase Auth
- **Staff/Admin Authentication**: Supabase Auth with role-based access
- **Kiosk Authentication**: API key based

## API Endpoints

### Public APIs

#### Services
- `GET /api/services` - List all available services (with detailed logging and error diagnostics)
- `GET /api/services?location_id={id}` - Filter services by location
- `POST /api/services` - Create new service (Admin only)

#### Locations
- `GET /api/locations` - List all salon locations (with detailed logging and error diagnostics)

#### Availability
- `GET /api/availability/time-slots` - Get available time slots for booking
- `POST /api/availability/staff-unavailable` - Mark staff unavailable (Staff auth required)
- `GET /api/availability/blocks` - Get manual availability blocks
- `GET /api/public/availability` - Get public availability information (no auth required)
- `POST /api/availability/staff` - Set staff availability

#### Customers
- `GET /api/customers` - Search customer by email or phone
- `POST /api/customers` - Register new customer

#### Bookings (Public)
- `POST /api/bookings` - Create new booking (supports customer_id or customer info)
- `GET /api/bookings/[id]` - Get booking details
- `PATCH /api/bookings/[id]` - Update booking (partial update)
- `PUT /api/bookings/[id]` - Update booking (full replacement)

### Staff/Admin APIs (Aperture)

#### Dashboard
- `GET /api/aperture/dashboard` - Dashboard data
- `GET /api/aperture/stats` - Statistics

#### Staff Management
- `GET /api/aperture/staff` - List staff with filters (location, role, schedule)
- `POST /api/aperture/staff` - Create new staff member
- `GET /api/aperture/staff/[id]` - Get specific staff member
- `PUT /api/aperture/staff/[id]` - Update staff member
- `DELETE /api/aperture/staff/[id]` - Deactivate staff member

#### Resources Management
- `GET /api/aperture/resources` - List resources with availability
- `POST /api/aperture/resources` - Create new resource
- `GET /api/aperture/resources/[id]` - Get specific resource
- `PUT /api/aperture/resources/[id]` - Update resource
- `DELETE /api/aperture/resources/[id]` - Deactivate resource

#### Calendar Management
- `GET /api/aperture/calendar` - Get calendar data with bookings
- `POST /api/aperture/bookings/[id]/reschedule` - Reschedule booking

#### Locations
- `GET /api/aperture/locations` - List all locations

#### Reports
- `GET /api/aperture/reports/sales` - Sales reports
- `GET /api/aperture/reports/payments` - Payment reports
- `GET /api/aperture/reports/payroll` - Payroll reports

#### POS (Point of Sale)
- `POST /api/aperture/pos` - Create sale transaction (cart, payments, receipt)
- `POST /api/aperture/pos/close-day` - Close day and generate daily report with PDF

#### Payroll
- `GET /api/aperture/payroll` - Calculate payroll for staff (base salary + commission + tips)
- `GET /api/aperture/payroll/[staffId]` - Get payroll details for specific staff

#### Permissions
- `GET /api/aperture/permissions` - Get role permissions
- `POST /api/aperture/permissions` - Update permissions

### Kiosk APIs
- `POST /api/kiosk/authenticate` - Authenticate kiosk
- `GET /api/kiosk/resources/available` - Get available resources for kiosk
- `POST /api/kiosk/bookings` - Create walk-in booking
- `POST /api/kiosk/walkin` - Create walk-in booking without reservation
- `PUT /api/kiosk/bookings/[shortId]/confirm` - Confirm booking

### Payment APIs
- `POST /api/create-payment-intent` - Create Stripe payment intent for booking deposit
- `POST /api/webhooks/stripe` - Stripe webhook handler (payment_intent.succeeded, payment_intent.payment_failed, charge.refunded)

### Admin APIs
- `GET /api/admin/locations` - List locations (Admin key required)
- `POST /api/admin/users` - Create staff/user
- `POST /api/admin/kiosks` - Create kiosk

### Cron Jobs
- `GET /api/cron/reset-invitations` - Reset weekly invitation quotas for Gold tier (Monday 00:00 UTC)
- `GET /api/cron/detect-no-shows` - Detect and mark no-show bookings (every 2 hours)

### Client Management (FASE 5 - Pending Implementation)
- `GET /api/aperture/clients` - List and search clients (phonetic search, history, technical notes)
- `POST /api/aperture/clients` - Create new client
- `GET /api/aperture/clients/[id]` - Get client details
- `PUT /api/aperture/clients/[id]` - Update client information
- `POST /api/aperture/clients/[id]/notes` - Add technical note to client
- `GET /api/aperture/clients/[id]/photos` - Get client photo gallery (VIP/Black/Gold only)

### Loyalty System (FASE 5 - Pending Implementation)
- `GET /api/aperture/loyalty` - Get loyalty points and rewards
- `POST /api/aperture/loyalty/redeem` - Redeem loyalty points
- `GET /api/aperture/loyalty/[customerId]` - Get customer loyalty history
- `POST /api/aperture/loyalty/[customerId]/points` - Add/remove loyalty points

## Data Models

### User Roles
- `customer` - End customers
- `staff` - Salon staff
- `artist` - Service providers
- `manager` - Location managers
- `admin` - System administrators
- `kiosk` - Kiosk devices

### Key Tables
- `locations` - Salon locations with business hours (JSONB)
- `staff` - Staff members
- `services` - Available services with category
- `resources` - Physical resources (stations)
- `customers` - Customer profiles
- `bookings` - Service bookings
- `kiosks` - Kiosk devices
- `audit_logs` - System audit trail

### Business Hours Structure
Locations table includes `business_hours` JSONB column with format:
```json
{
  "monday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "tuesday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "wednesday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "thursday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "friday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "saturday": {"open": "10:00", "close": "18:00", "is_closed": false},
  "sunday": {"is_closed": true}
}
```

Default business hours (updated via migration):
- Monday-Friday: 10:00 AM - 7:00 PM
- Saturday: 10:00 AM - 6:00 PM
- Sunday: Closed

## Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`

### Optional
- `ADMIN_ENROLLMENT_KEY` - For staff enrollment
- `GOOGLE_SERVICE_ACCOUNT_KEY` - For Calendar sync

## Deployment

### Prerequisites
- Node.js 20+ (updated for Supabase compatibility)
- Supabase account
- Stripe account
- Google Cloud (for Calendar)

### Setup Steps
1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Run database migrations: `npm run db:migrate`
5. Seed data: `npm run db:seed`
6. Build: `npm run build`
7. Start: `npm start`

## Features

### Core Functionality
- Multi-location salon management
- Real-time availability system with business hours
- Customer registration and lookup by email/phone
- Location-specific opening/closing times
- Automated payment processing (currently mock)
- Staff scheduling and payroll
- Customer relationship management
- Kiosk system for walk-ins

### Booking Flow
1. Customer selects service and location
2. Customer chooses date and time slot
3. Customer searches by email or phone:
   - If found: Pre-fill data and proceed
   - If not found: Redirect to registration
4. Customer completes registration if needed
5. Customer confirms personal details
6. Customer pays deposit (mock currently)
7. Booking confirmed with email confirmation

### Advanced Features
- Role-based access control
- Audit logging
- Automated no-show handling
- Commission-based payroll
- Sales analytics and reporting
- Permission management

### Security
- Row Level Security (RLS) in Supabase
- API key authentication for kiosks
- Magic link authentication for customers
- Encrypted payment processing

## Recent Improvements (January 2026)

### Supabase Connection Fixes
- **Lazy Client Initialization**: Supabase client now initializes only when needed, ensuring environment variables are available at runtime
- **Enhanced Error Diagnostics**: APIs now provide detailed logging for connection issues
- **Node.js 20 Compatibility**: Updated runtime for better Supabase SDK compatibility
- **Connection Testing**: APIs test Supabase connectivity before executing queries

### API Enhancements
- **Detailed Logging**: Services and Locations APIs now log connection status, query results, and errors
- **Better Error Messages**: Failed requests return structured error information with timestamps
- **Connectivity Validation**: Pre-flight checks ensure Supabase is reachable before processing requests

### Troubleshooting
If APIs return `"TypeError: fetch failed"`:
1. Verify Supabase environment variables are correctly set in deployment platform
2. Check Supabase service status and connectivity
3. Review deployment logs for initialization errors
4. Ensure Node.js 20+ is being used

### Example Error Response
```json
{
  "error": "TypeError: fetch failed",
  "details": "Failed to connect to Supabase",
  "timestamp": "2026-01-18T15:00:00.000Z"
}
```

### Example Success Response
```json
{
  "success": true,
  "services": [...],
  "count": 22,
  "timestamp": "2026-01-18T15:00:00.000Z"
}
```

## Support

For API issues or feature requests, please check the TASKS.md for current priorities or create an issue in the repository.