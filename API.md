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
- `GET /api/services` - List all available services
- `POST /api/services` - Create new service (Admin only)

#### Locations
- `GET /api/locations` - List all salon locations

#### Availability
- `GET /api/availability/time-slots` - Get available time slots for booking
- `POST /api/availability/staff-unavailable` - Mark staff unavailable (Staff auth required)

#### Bookings (Public)
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/[id]` - Get booking details
- `PUT /api/bookings/[id]` - Update booking

### Staff/Admin APIs (Aperture)

#### Dashboard
- `GET /api/aperture/dashboard` - Dashboard data
- `GET /api/aperture/stats` - Statistics

#### Staff Management
- `GET /api/aperture/staff` - List staff members
- `POST /api/aperture/staff` - Create/Update staff

#### Resources
- `GET /api/aperture/resources` - List resources
- `POST /api/aperture/resources` - Manage resources

#### Reports
- `GET /api/aperture/reports/sales` - Sales reports
- `GET /api/aperture/reports/payments` - Payment reports
- `GET /api/aperture/reports/payroll` - Payroll reports

#### Permissions
- `GET /api/aperture/permissions` - Get role permissions
- `POST /api/aperture/permissions` - Update permissions

### Kiosk APIs
- `POST /api/kiosk/authenticate` - Authenticate kiosk
- `GET /api/kiosk/resources/available` - Get available resources for kiosk
- `POST /api/kiosk/bookings` - Create walk-in booking
- `PUT /api/kiosk/bookings/[shortId]/confirm` - Confirm booking

### Payment APIs
- `POST /api/create-payment-intent` - Create Stripe payment intent

### Admin APIs
- `GET /api/admin/locations` - List locations (Admin key required)
- `POST /api/admin/users` - Create staff/user
- `POST /api/admin/kiosks` - Create kiosk

## Data Models

### User Roles
- `customer` - End customers
- `staff` - Salon staff
- `artist` - Service providers
- `manager` - Location managers
- `admin` - System administrators
- `kiosk` - Kiosk devices

### Key Tables
- `locations` - Salon locations
- `staff` - Staff members
- `services` - Available services
- `resources` - Physical resources (stations)
- `customers` - Customer profiles
- `bookings` - Service bookings
- `kiosks` - Kiosk devices
- `audit_logs` - System audit trail

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
- Node.js 18+
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
- Real-time availability system
- Integrated payment processing
- Staff scheduling and payroll
- Customer relationship management
- Kiosk system for walk-ins

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

## Support

For API issues or feature requests, please check the TASKS.md for current priorities or create an issue in the repository.