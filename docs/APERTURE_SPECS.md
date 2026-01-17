# Aperture Technical Specifications

**Especificaciones técnicas completas para Aperture (HQ Dashboard)**
**Última actualización: Enero 2026**

---

## 1. Objetivo

Este documento define las especificaciones técnicas para el desarrollo de Aperture (aperture.anchor23.mx), el dashboard administrativo y CRM interno de AnchorOS.

---

## 2. Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Radix UI (componentes accesibles preconstruidos)
- **Estilizado**: Tailwind CSS + Square UI custom styling
- **Icons**: Lucide React (24px, stroke 2px)
- **Charts**: Recharts o similar (para gráficos de rendimiento)
- **PDF Generation**: PDFKit o similar (para cierre de caja)

### Backend
- **Database**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth (magic links para clientes, password para staff/admin)
- **API**: Next.js App Router API routes

### Integraciones
- **Payments**: Stripe SDK
- **Calendar**: Google Calendar API v3 (Service Account)
- **Notifications**: WhatsApp API (Twilio / Meta) - Good to have, no priority

---

## 3. Horas Trabajadas - Respuesta a Pregunta 9

### Calculo de Horas Trabajadas

**Enfoque**: El sistema de nómina calcula el **tiempo efectivo de trabajo** basado en la comparación entre **tiempo programado** y **tiempo real utilizado**.

#### Lógica de Cálculo

1. **Tiempo Programado**:
   - Basado en la duración de los servicios agendados
   - Calculado desde `bookings.start_time_utc` hasta `bookings.end_time_utc`
   - Excluye tiempos de espera entre citas

2. **Tiempo Real Utilizado**:
   - Actualizado manualmente por el staff después de completar una cita
   - Se almacena en tabla de control (opcional: `staff_time_tracking`)
   - Permite ajustes por diferencias en duración real

#### Campos de Base de Datos

**Tabla `bookings` (ya existe):**
```sql
- id (UUID)
- staff_id (UUID)
- service_id (UUID)
- start_time_utc (TIMESTAMPTZ)
- end_time_utc (TIMESTAMPTZ)
- scheduled_duration_minutes (INTEGER) - Calculado automáticamente
- actual_duration_minutes (INTEGER) - Actualizado manualmente por staff
- time_difference_minutes (INTEGER) - Diferencia calculada
- status (TEXT) - 'confirmed', 'pending', 'in_progress', 'completed', 'no_show'
```

**Nueva tabla sugerida: `staff_time_tracking`**
```sql
CREATE TABLE staff_time_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  scheduled_duration_minutes INTEGER NOT NULL,
  actual_duration_minutes INTEGER NOT NULL,
  time_difference_minutes INTEGER NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_time_tracking_staff_date ON staff_time_tracking(staff_id, created_at);
```

#### Algoritmo de Cálculo

```sql
-- Duración programada (automática)
UPDATE bookings
SET scheduled_duration_minutes = EXTRACT(EPOCH FROM (end_time_utc - start_time_utc)) / 60
WHERE scheduled_duration_minutes IS NULL;

-- Diferencia de tiempo (automática)
UPDATE bookings
SET time_difference_minutes = actual_duration_minutes - scheduled_duration_minutes
WHERE status = 'completed' AND actual_duration_minutes IS NOT NULL;
```

#### Cálculo de Nómina

**Horas Totales por Periodo:**
```sql
SELECT
  s.id,
  s.display_name,
  SUM(b.scheduled_duration_minutes) / 60 AS scheduled_hours,
  SUM(b.actual_duration_minutes) / 60 AS actual_hours,
  COUNT(b.id) AS total_bookings,
  SUM(CASE WHEN b.time_difference_minutes > 0 THEN b.time_difference_minutes ELSE 0 END) / 60 AS extra_hours
FROM staff s
LEFT JOIN bookings b ON b.staff_id = s.id
  WHERE b.status = 'completed'
  AND b.start_time_utc >= $1::TIMESTAMPTZ
  AND b.start_time_utc < $2::TIMESTAMPTZ
GROUP BY s.id, s.display_name;
```

#### Reglas de Negocio

1. **Tiempo programado**: Base para el cálculo de nómina
2. **Tiempo real**: Ajustes permitidos por staff (por ex: cliente llegó tarde, servicio se extendió)
3. **Tiempo extra**: Se paga al 100% si fue trabajo adicional
4. **Tiempo faltante**: Se descuenta del pago (horarios no cubiertos por citas)
5. **Tiempo no-productivo**: No se paga (esperas, preparación post-cita)

---

## 4. Estructura del Sistema de POS (Punto de Venta)

### 4.1 Arquitectura del POS

#### Componentes Principales

**1. Service Selector**
- Grid de categorías: Servicios, Productos de venta, Membresías, Giftcards
- Búsqueda fonética de productos/servicios
- Filtros por tipo y categoría

**2. Customer Selection**
- Buscador de clientes (email/teléfono)
- Selección de cliente existente o registro de nuevo
- Display de tier y saldo de créditos/membresía

**3. Payment Processor**
- Métodos de pago disponibles:
  - Efectivo
  - Transferencia
  - Membership (créditos de membresía)
  - Tarjeta (Stripe terminal)
  - Giftcard (código canjeable)
  - PIA (Paid in Advance - depósito ya pagado)
- Cálculo automático de cambio

**4. Receipt Options**
- NO imprimir recibos físicos
- Enviar por email (SendGrid, AWS SES, o similar)
- Guardar en dashboard del cliente

**5. Transaction History**
- Historial de transacciones del día
- Filtros por método de pago y cajero

### 4.2 Opciones de Pago

#### 1. Efectivo
- Registro manual del monto recibido
- No requiere integración externa

#### 2. Transferencia
- Referencia bancaria del cliente
- Comprobante de transferencia
- Estado: "pendiente" hasta confirmación

#### 3. Membership (Créditos de Membresía)
- Verificar saldo disponible
- Deducir créditos automáticamente
- Restringir a clientes con membresía activa

#### 4. Tarjeta (Stripe Terminal)
- Integración con Stripe SDK para terminales físicas
- Procesamiento de pago en tiempo real
- Confirmación de transacción

#### 5. Giftcard
- Validar código de giftcard
- Verificar saldo y estado (activo/inactivo/expirado)
- Deducir saldo del giftcard

#### 6. PIA (Paid in Advance)
- Verificar depósito previamente pagado
- Aplicar al saldo total de la transacción
- No requiere pago adicional

### 4.3 Campos de Base de Datos

**Nueva tabla: `pos_sales`**
```sql
CREATE TABLE pos_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  
  -- Payment details
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'membership', 'card', 'giftcard', 'pia')),
  payment_amount DECIMAL(10, 2) NOT NULL,
  payment_reference TEXT,
  payment_status TEXT NOT NULL DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  
  -- Transaction details
  total_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  tip_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Items sold
  items JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

CREATE INDEX idx_pos_sales_location_date ON pos_sales(location_id, created_at);
CREATE INDEX idx_pos_sales_staff_date ON pos_sales(staff_id, created_at);
```

**Formato de `items` JSONB:**
```json
{
  "services": [
    {
      "service_id": "uuid",
      "service_name": "Manicure",
      "quantity": 1,
      "unit_price": 150.00,
      "total": 150.00
    }
  ],
  "products": [
    {
      "product_id": "uuid",
      "product_name": "Cuticle Remover",
      "quantity": 2,
      "unit_price": 45.00,
      "total": 90.00
    }
  ],
  "memberships": [
    {
      "membership_id": "uuid",
      "membership_name": "VIP Monthly",
      "quantity": 1,
      "unit_price": 500.00,
      "total": 500.00
    }
  ]
}
```

**Nueva tabla: `giftcards`**
```sql
CREATE TABLE giftcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  initial_balance DECIMAL(10, 2) NOT NULL,
  current_balance DECIMAL(10, 2) NOT NULL,
  purchased_by UUID REFERENCES customers(id) ON DELETE SET NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

CREATE INDEX idx_giftcards_code ON giftcards(code);
```

### 4.4 API Endpoints

**POS Sales:**
```typescript
POST /api/aperture/pos/sales
Body: {
  customer_id: UUID | null,
  items: {
    services: Array<{ service_id, quantity }>,
    products: Array<{ product_id, quantity }>,
    memberships: Array<{ membership_id, quantity }>
  },
  payment_method: 'cash' | 'transfer' | 'membership' | 'card' | 'giftcard' | 'pia',
  payment_amount: number,
  tip_amount?: number,
  giftcard_code?: string
}
Response: { success, sale_id, items, total_amount, change }
```

**Daily Summary:**
```typescript
GET /api/aperture/pos/daily-summary?date=YYYY-MM-DD&location_id=UUID
Response: {
  success: true,
  summary: {
    total_sales,
    by_payment_method: { cash, transfer, membership, card, giftcard, pia },
    transactions_count
  }
}
```

---

## 5. Sistema de Múltiples Cajeros

### 5.1 Arquitectura

Cada cajero tiene su propia sesión y cierre de caja independiente. El sistema permite:
- Múltiples cajeros trabajando simultáneamente
- Control individual de transacciones por cajero
- Rastreo de errores en cobros por usuario específico
- Cierre de caja individual por cajero

### 5.2 Campos de Base de Datos

**Nueva tabla: `daily_cash_close`**
```sql
CREATE TABLE daily_cash_close (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  cashier_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  
  -- Cash balance tracking
  opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cash_sales DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cash_refunds DECIMAL(10, 2) NOT NULL DEFAULT 0,
  closing_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  cash_difference DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Transaction summary
  total_sales DECIMAL(10, 2) NOT NULL DEFAULT 0,
  card_sales DECIMAL(10, 2) NOT NULL DEFAULT 0,
  transfer_sales DECIMAL(10, 2) NOT NULL DEFAULT 0,
  membership_sales DECIMAL(10, 2) NOT NULL DEFAULT 0,
  giftcard_sales DECIMAL(10, 2) NOT NULL DEFAULT 0,
  pia_sales DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Timestamps
  date DATE NOT NULL,
  open_at TIMESTAMPTZ NOT NULL,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

CREATE INDEX idx_daily_cash_close_location_date ON daily_cash_close(location_id, date);
CREATE INDEX idx_daily_cash_close_cashier_date ON daily_cash_close(cashier_id, date);
CREATE UNIQUE INDEX idx_daily_cash_close_unique ON daily_cash_close(location_id, cashier_id, date);
```

### 5.3 Flujo de Cierre de Caja

#### 1. Apertura de Caja
- Cajero registra monto de efectivo inicial (`opening_balance`)
- Sistema crea registro de apertura (`open_at` timestamp)

#### 2. Registro de Ventas
- Todas las transacciones se asocian al `cashier_id` activo
- Sistema calcula totales por método de pago en tiempo real

#### 3. Cierre de Caja
- Cajero cierra el día:
  1. Conta efectivo en caja
  2. Ingresa `closing_balance` real
  3. Sistema calcula `cash_difference`
  4. Genera reporte PDF automático
  5. Envía reporte al dueño por email

#### 4. Rastreo de Errores
- Si `cash_difference` ≠ 0:
  - Sistema marca discrepancia
  - Asocia la transacción específica al cajero
  - Permite investigación del error con el usuario correcto

### 5.4 API Endpoints

**Open Cash Register:**
```typescript
POST /api/aperture/pos/open-cash-register
Body: {
  opening_balance: number
}
Response: { success, cash_register_id, open_at }
```

**Close Cash Register:**
```typescript
POST /api/aperture/pos/close-cash-register
Body: {
  closing_balance: number,
  notes?: string
}
Response: {
  success: true,
  summary: { total_sales, cash_difference, transactions_count },
  pdf_report_url
}
```

**Get Active Cash Registers:**
```typescript
GET /api/aperture/pos/active-cash-registers?location_id=UUID
Response: {
  success: true,
  registers: [
    {
      id,
      cashier_id,
      cashier_name,
      opening_balance,
      current_balance,
      open_at,
      location_name
    }
  ]
}
```

---

## 6. Sistema de Finanzas

### 6.1 Campos de Base de Datos

**Nueva tabla: `expenses`**
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  expense_date DATE NOT NULL,
  
  -- Recurring expenses
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  recurring_end_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES staff(id) ON DELETE SET NULL
);

CREATE INDEX idx_expenses_location_date ON expenses(location_id, expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
```

### 6.2 Categorías de Gastos

- **Renta**: Alquiler del local
- **Insumos**: Productos para servicios (cuticles, esmaltes, etc.)
- **Servicios**: Servicios externos contratados
- **Personal**: Pagos de nómina (si se maneja por cash)
- **Marketing**: Publicidad y promociones
- **Utilidades**: Electricidad, agua, internet
- **Otros**: Cualquier otro gasto

### 6.3 API Endpoints

**Create Expense:**
```typescript
POST /api/aperture/finance/expenses
Body: {
  category,
  description,
  amount,
  expense_date,
  is_recurring?: boolean,
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly',
  recurring_end_date?: string
}
Response: { success, expense_id }
```

**Get Financial Report:**
```typescript
GET /api/aperture/finance/report?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD&location_id=UUID
Response: {
  success: true,
  report: {
    total_revenue,
    total_expenses,
    net_margin,
    expenses_by_category,
    profit_margin_percentage
  }
}
```

---

## 7. Convenciones de Código

### TypeScript
- **Strict mode**: Habilitado
- **Interfaces**: Definir tipos para todas las respuestas de API
- **Enums**: Usar enums para constantes (status, roles, métodos de pago)

### Naming Conventions
- **Componentes**: PascalCase (ej: `StatsCard`, `BookingCard`)
- **Funciones**: camelCase (ej: `fetchBookings`, `calculatePayroll`)
- **Variables**: camelCase (ej: `totalSales`, `staffId`)
- **Constantes**: UPPER_SNAKE_CASE (ej: `API_URL`, `DEFAULT_TIMEOUT`)

### SQL
- **Table names**: snake_case (ej: `daily_cash_close`, `pos_sales`)
- **Column names**: snake_case (ej: `opening_balance`, `cash_difference`)
- **Functions**: snake_case (ej: `calculate_weekly_invitations_reset`)

---

## 8. Consideraciones de Seguridad

1. **Row Level Security (RLS)**:
   - Todas las tablas sensibles deben tener políticas RLS
   - Solo roles apropiados pueden acceder a datos financieros
   - Audit logging completo de todas las acciones

2. **Validaciones**:
   - Validar todos los inputs de usuario
   - Verificar permisos antes de permitir acciones
   - Validar montos de pagos (rangos aceptables)

3. **Auditoría**:
   - Todas las acciones financieras deben registrarse en `audit_logs`
   - Incluir: acción, usuario, timestamp, detalles

---

## 9. Checklist de Implementación

### Fase 0: Documentación y Configuración ✅
- [x] Crear documento de especificaciones técnicas
- [x] Documentar cálculo de horas trabajadas
- [x] Definir estructura de POS completa
- [x] Documentar sistema de múltiples cajeros

### Fase 1-7: Pendiente
- [ ] Instalar Radix UI
- [ ] Crear componentes base Square UI
- [ ] Implementar Dashboard Home
- [ ] Implementar Calendario Maestro
- [ ] Implementar Staff & Nómina
- [ ] Implementar Clientes & Fidelización
- [ ] Implementar POS
- [ ] Implementar Finanzas
- [ ] Implementar Marketing & Configuración
- [ ] Testing completo

---

## 10. Documentos Relacionados

- [TASKS.md](../TASKS.md) - Plan de ejecución por fases
- [APERTURE_SQUARE_UI.md](./APERTURE_SQUARE_UI.md) - Guía de estilo Square UI
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - Sistema de diseño completo
- [API.md](./API.md) - Documentación de APIs y endpoints
- [PRD.md](./PRD.md) - Documento maestro de producto

---

## 11. Notas Importantes

1. **Precios Inteligentes**:
   - Configurables por servicio
   - Aplican a ambos canales (booking + POS)
   - Solo activables en temporada alta (backend toggle)

2. **Sin Impresión de Recibos**:
   - Email a cliente
   - Dashboard del cliente
   - Reporte PDF al dueño (cierre de caja)

3. **Múltiples Cajeros**:
   - Cada cajero con su propio cierre de caja
   - Rastreo de errores por usuario específico
   - Control de movimientos para investigación

4. **Horas Trabajadas**:
   - Automático desde bookings (tiempo programado)
   - Actualización manual de tiempo real por staff
   - Cálculo de diferencias
   - Nómina basada en horas reales trabajadas
