# Aperture Technical Specifications

**Documento maestro de especificaciones técnicas de Aperture (HQ Dashboard)**
**Última actualización: Enero 2026**

---

## 1. Arquitectura General

### 1.1 Stack Tecnológico

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript 5.x
- Tailwind CSS + Radix UI
- Lucide React (icons)
- date-fns (manejo de fechas)

**Backend:**
- Next.js API Routes
- Supabase PostgreSQL
- Supabase Auth (roles: admin, manager, staff, customer, kiosk, artist)
- Stripe (pagos)

**Infraestructura:**
- Vercel (hosting)
- Supabase (database, auth, storage)
- Vercel Cron Jobs (tareas programadas)

---

## 2. Esquema de Base de Datos

### 2.1 Tablas Core

```sql
-- Locations (sucursales)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Mexico_City',
  business_hours JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff (empleados)
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'staff', 'artist')),
  location_id UUID REFERENCES locations(id),
  hourly_rate DECIMAL(10,2) DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 0, -- Porcentaje de comisión
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources (recursos físicos)
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- Código estandarizado: mkup-1, lshs-1, pedi-1, mani-1
  type TEXT NOT NULL CHECK (type IN ('mkup', 'lshs', 'pedi', 'mani')),
  location_id UUID REFERENCES locations(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services (servicios)
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  requires_dual_artist BOOLEAN DEFAULT false,
  premium_fee DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers (clientes)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'gold', 'black', 'VIP')),
  weekly_invitations_used INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES customers(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookings (reservas)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  service_id UUID REFERENCES services(id),
  location_id UUID REFERENCES locations(id),
  staff_ids UUID[] NOT NULL, -- Array de staff IDs (1 o 2 para dual artist)
  resource_id UUID REFERENCES resources(id),
  start_time_utc TIMESTAMPTZ NOT NULL,
  end_time_utc TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  total_price DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments (pagos)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer', 'gift_card', 'membership', 'stripe')),
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll (nómina)
CREATE TABLE payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary DECIMAL(10,2) DEFAULT 0,
  commission_total DECIMAL(10,2) DEFAULT 0,
  tips_total DECIMAL(10,2) DEFAULT 0,
  total_payment DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (auditoría)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. APIs Principales

### 3.1 Dashboard Stats

**Endpoint:** `GET /api/aperture/stats`

**Response:**
```typescript
{
  success: true,
  stats: {
    totalBookings: number,      // Reservas del mes actual
    totalRevenue: number,       // Revenue del mes (servicios completados)
    completedToday: number,     // Citas completadas hoy
    upcomingToday: number       // Citas pendientes hoy
  }
}
```

**Business Rules:**
- Month calculations: first day to last day of current month (UTC)
- Today calculations: 00:00 to 23:59:59.999 local timezone converted to UTC
- Revenue only includes `status = 'completed'` bookings

---

### 3.2 Dashboard Data

**Endpoint:** `GET /api/aperture/dashboard`

**Response:**
```typescript
{
  success: true,
  data: {
    customers: {
      total: number,
      newToday: number,
      newMonth: number
    },
    topPerformers: Array<{
      id: string,
      name: string,
      bookingsCompleted: number,
      revenueGenerated: number
    }>,
    activityFeed: Array<{
      id: string,
      type: 'booking' | 'payment' | 'staff' | 'system',
      description: string,
      timestamp: string,
      metadata?: any
    }>
  }
}
```

---

### 3.3 Calendar API

**Endpoint:** `GET /api/aperture/calendar`

**Query Params:**
- `date`: YYYY-MM-DD (default: today)
- `location_id`: UUID (optional, filter by location)
- `staff_ids`: UUID[] (optional, filter by staff)

**Response:**
```typescript
{
  success: true,
  data: {
    date: string,
    slots: Array<{
      time: string,           // HH:mm format
      bookings: Array<{
        id: string,
        short_id: string,
        customer_name: string,
        service_name: string,
        staff_ids: string[],
        staff_names: string[],
        resource_id: string,
        status: string,
        duration: number,
        requires_dual_artist: boolean,
        start_time: string,
        end_time: string,
        notes?: string
      }>
    }>
  },
  staff: Array<{
    id: string,
    name: string,
    role: string,
    bookings_count: number
  }>
}
```

---

### 3.4 Reschedule Booking

**Endpoint:** `POST /api/aperture/bookings/[id]/reschedule`

**Request:**
```typescript
{
  new_start_time_utc: string,  // ISO 8601 timestamp
  new_resource_id?: string      // Optional new resource
}
```

**Response:**
```typescript
{
  success: boolean,
  message?: string,
  conflict?: {
    type: 'staff' | 'resource',
    message: string,
    details: any
  }
}
```

**Validation:**
- Check staff availability for new time
- Check resource availability for new time
- Verify no conflicts with existing bookings
- Update booking if no conflicts

---

### 3.5 Staff Management

**CRUD Endpoints:**
- `GET /api/aperture/staff` - List all staff
- `GET /api/aperture/staff/[id]` - Get single staff
- `POST /api/aperture/staff` - Create staff
- `PUT /api/aperture/staff/[id]` - Update staff
- `DELETE /api/aperture/staff/[id]` - Delete staff

**Staff Object:**
```typescript
{
  id: string,
  first_name: string,
  last_name: string,
  email: string,
  phone?: string,
  role: 'admin' | 'manager' | 'staff' | 'artist',
  location_id?: string,
  hourly_rate: number,
  commission_rate: number,
  is_active: boolean,
  business_hours?: {
    monday: { start: string, end: string, is_off: boolean },
    tuesday: { start: string, end: string, is_off: boolean },
    // ... other days
  }
}
```

---

### 3.6 Payroll Calculation

**Endpoint:** `GET /api/aperture/payroll`

**Query Params:**
- `period_start`: YYYY-MM-DD
- `period_end`: YYYY-MM-DD
- `staff_id`: UUID (optional)

**Response:**
```typescript
{
  success: true,
  data: {
    staff_payroll: Array<{
      staff_id: string,
      staff_name: string,
      base_salary: number,        // hourly_rate * hours_worked
      commission_total: number,   // revenue * commission_rate
      tips_total: number,         // Sum of tips
      total_payment: number,      // Sum of above
      bookings_count: number,
      hours_worked: number
    }>,
    summary: {
      total_payroll: number,
      total_bookings: number,
      period: {
        start: string,
        end: string
      }
    }
  }
}
```

**Calculation Logic:**
```
base_salary = hourly_rate * sum(booking duration / 60)
commission_total = total_revenue * (commission_rate / 100)
tips_total = sum(tips from completed bookings)
total_payment = base_salary + commission_total + tips_total
```

---

### 3.7 POS (Point of Sale)

**Endpoint:** `POST /api/aperture/pos`

**Request:**
```typescript
{
  items: Array<{
    type: 'service' | 'product',
    id: string,
    name: string,
    price: number,
    quantity: number
  }>,
  payments: Array<{
    method: 'cash' | 'card' | 'transfer' | 'gift_card' | 'membership',
    amount: number,
    stripe_payment_intent_id?: string
  }>,
  customer_id?: string,
  booking_id?: string,
  notes?: string
}
```

**Response:**
```typescript
{
  success: boolean,
  transaction_id: string,
  total_amount: number,
  change?: number,  // For cash payments
  receipt_url?: string
}
```

---

### 3.8 Close Day

**Endpoint:** `POST /api/aperture/pos/close-day`

**Request:**
```typescript
{
  date: string,  // YYYY-MM-DD
  location_id?: string
}
```

**Response:**
```typescript
{
  success: true,
  summary: {
    date: string,
    location_id?: string,
    total_sales: number,
    payment_breakdown: {
      cash: number,
      card: number,
      transfer: number,
      gift_card: number,
      membership: number,
      stripe: number
    },
    transaction_count: number,
    refunds: number,
    discrepancies: Array<{
      type: string,
      expected: number,
      actual: number,
      difference: number
    }>
  },
  pdf_url: string
}
```

---

## 4. Horas Trabajadas (Automático desde Bookings)

### 4.1 Cálculo Automático

Las horas trabajadas por staff se calculan automáticamente desde bookings completados:

```typescript
async function getStaffWorkHours(staffId: string, periodStart: Date, periodEnd: Date) {
  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_time_utc, end_time_utc')
    .contains('staff_ids', [staffId])
    .eq('status', 'completed')
    .gte('start_time_utc', periodStart.toISOString())
    .lte('start_time_utc', periodEnd.toISOString());

  const totalMinutes = bookings.reduce((sum, booking) => {
    const start = new Date(booking.start_time_utc);
    const end = new Date(booking.end_time_utc);
    return sum + (end.getTime() - start.getTime()) / 60000;
  }, 0);

  return totalMinutes / 60; // Return hours
}
```

### 4.2 Integración con Nómina

El cálculo de nómina utiliza estas horas automáticamente:

```typescript
base_salary = staff.hourly_rate * work_hours
commission = total_revenue * (staff.commission_rate / 100)
```

---

## 5. POS System Specifications

### 5.1 Características Principales

**Carrito de Compra:**
- Soporte para múltiples productos/servicios
- Cantidad por item
- Descuentos aplicables
- Subtotal, taxes (si aplica), total

**Métodos de Pago:**
- Efectivo (con cálculo de cambio)
- Tarjeta (Stripe)
- Transferencia bancaria
- Gift Cards
- Membresías (créditos del cliente)
- Pagos mixtos (combinar múltiples métodos)

**Múltiples Cajeros:**
- Each staff can open a POS session
- Track cashier per transaction
- Close day per cashier or per location

### 5.2 Flujo de Cierre de Caja

1. Solicitar fecha y location_id
2. Calcular total ventas del día
3. Breakdown por método de pago
4. Verificar conciliación (esperado vs real)
5. Generar PDF reporte
6. Marcar day como "closed" (opcional flag)

---

## 6. Webhooks Stripe

### 6.1 Endpoints

**Endpoint:** `POST /api/webhooks/stripe`

**Headers:**
- `Stripe-Signature`: Signature verification

**Events:**
- `payment_intent.succeeded`: Payment completed
- `payment_intent.payment_failed`: Payment failed
- `charge.refunded`: Refund processed

### 6.2 payment_intent.succeeded

**Actions:**
1. Extract metadata (booking details)
2. Verify booking exists
3. Update `payments` table with completed status
4. Update booking `deposit_paid = true`
5. Create audit log entry
6. Send confirmation email/WhatsApp (si configurado)

### 6.3 payment_intent.payment_failed

**Actions:**
1. Update `payments` table with failed status
2. Send notification to customer
3. Log failure in audit logs
4. Optionally cancel booking or mark as pending

### 6.4 charge.refunded

**Actions:**
1. Update `payments` table with refunded status
2. Send refund confirmation to customer
3. Log refund in audit logs
4. Update booking status if applicable

---

## 7. No-Show Logic

### 7.1 Ventana de Cancelación

**Regla:** 12 horas antes de la cita (UTC)

### 7.2 Detección de No-Show

```typescript
async function detectNoShows() {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12h ago

  const { data: noShows } = await supabase
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .lte('start_time_utc', windowStart.toISOString());

  for (const booking of noShows) {
    // Check if customer showed up
    const { data: checkIn } = await supabase
      .from('check_ins')
      .select('*')
      .eq('booking_id', booking.id)
      .single();

    if (!checkIn) {
      // Mark as no-show
      await markAsNoShow(booking.id);
    }
  }
}
```

### 7.3 Penalización Automática

**Actions:**
1. Mark booking status as `no_show`
2. Retain deposit (do not refund)
3. Send notification to customer
4. Log action in audit_logs
5. Track no-show count per customer (for future restrictions)

### 7.4 Override Admin

Admin puede marcar un no-show como "exonerated" (perdonado):
- Status remains `no_show` but with flag `penalty_waived = true`
- Refund deposit if appropriate
- Log admin override in audit logs

---

## 8. Seguridad y Permisos

### 8.1 RLS Policies

**Admin:**
- Full access to all tables
- Can override no-show penalties
- Can view all financial data

**Manager:**
- Access to location data only
- Can manage staff and bookings
- View financial reports for location

**Staff/Artist:**
- View own bookings and schedule
- Cannot view customer PII (email, phone)
- Cannot modify financial data

**Kiosk:**
- View only availability data
- Can create bookings with validated data
- No access to PII

### 8.2 API Authentication

**Admin/Manager/Staff:**
- Require valid Supabase session
- Check user role
- Filter by location for managers

**Public:**
- Use anon key
- Only public endpoints (availability, services, locations)

**Cron Jobs:**
- Require CRON_SECRET header
- Service role key required

---

## 9. Performance Considerations

### 9.1 Database Indexes

```sql
-- Critical indexes
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_staff ON bookings USING GIN(staff_ids);
CREATE INDEX idx_bookings_status_time ON bookings(status, start_time_utc);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
```

### 9.2 N+1 Prevention

Use explicit joins for related data:
```typescript
// BAD - N+1 queries
const bookings = await supabase.from('bookings').select('*');
for (const booking of bookings) {
  const customer = await supabase.from('customers').select('*').eq('id', booking.customer_id);
}

// GOOD - Single query
const bookings = await supabase
  .from('bookings')
  .select(`
    *,
    customer:customers(*),
    service:services(*),
    location:locations(*)
  `);
```

---

## 10. Testing Strategy

### 10.1 Unit Tests

- Generador de Short ID (collision detection)
- Cálculo de depósitos (200 vs 50% rule)
- Cálculo de nómina (salario base + comisiones + propinas)
- Disponibilidad de staff (horarios + calendar events)

### 10.2 Integration Tests

- API endpoints (GET, POST, PUT, DELETE)
- Stripe webhooks
- Cron jobs (reset invitations)
- No-show detection

### 10.3 E2E Tests

- Booking flow completo (customer → kiosk → staff)
- POS flow (items → payment → receipt)
- Dashboard navigation y visualización
- Calendar drag & drop

---

## 11. Deployment

### 11.1 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Cron
CRON_SECRET=

# Email/WhatsApp (future)
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

### 11.2 Cron Jobs

```yaml
# vercel.json
{
  "crons": [
    {
      "path": "/api/cron/reset-invitations",
      "schedule": "0 0 * * 1"  # Monday 00:00 UTC
    },
    {
      "path": "/api/cron/detect-no-shows",
      "schedule": "0 */2 * * *"  # Every 2 hours
    }
  ]
}
```

---

## 12. Futuras Mejoras

### 12.1 Short Term (Q1 2026)
- [ ] Implementar The Vault (storage de fotos privadas)
- [ ] Implementar notificaciones WhatsApp
- [ ] Implementar recibos digitales con PDF
- [ ] Landing page Believers pública

### 12.2 Medium Term (Q2 2026)
- [ ] Google Calendar Sync bidireccional
- [ ] Sistema de lealtad con puntos
- [ ] Campañas de marketing masivas
- [ ] Precios dinámicos inteligentes

### 12.3 Long Term (Q3-Q4 2026)
- [ ] Sistema de passes digitales
- [ ] Móvil app para clientes
- [ ] Analytics avanzados con ML
- [ ] Integración con POS hardware
