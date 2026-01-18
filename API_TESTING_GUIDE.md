# AnchorOS API Testing Guide

## 📋 **Rutas a Probar - Testing Endpoints**

### **🔐 Autenticación**
- `POST /api/auth/login` - Login de usuario
  - Body: `{ email, password }`
  - Buscar: Token JWT en respuesta
- `POST /api/auth/register` - Registro de cliente
  - Body: `{ first_name, last_name, email, phone, password }`
  - Buscar: Usuario creado con ID

### **👥 Gestión de Clientes**
- `GET /api/customers` - Listar clientes
  - Headers: Authorization Bearer token
  - Buscar: Array de clientes con datos completos
- `POST /api/customers` - Crear cliente
  - Headers: Authorization Bearer token
  - Body: `{ first_name, last_name, email, phone }`
  - Buscar: Cliente creado
- `GET /api/customers/[id]` - Detalles de cliente
  - Buscar: Datos completos del cliente + bookings

### **💺 Reservas (Bookings)**
- `GET /api/bookings` - Listar reservas
  - Query params: `?status=confirmed&date=2024-01-01`
  - Buscar: Array de bookings con relaciones (customer, service, staff)
- `POST /api/bookings` - Crear reserva
  - Body: `{ customer_id, service_id, staff_id, location_id, date, notes }`
  - Buscar: Booking creado + email enviado automáticamente
- `PUT /api/bookings/[id]` - Actualizar reserva
  - Body: `{ status: 'confirmed' }`
  - Buscar: Status actualizado
- `DELETE /api/bookings/[id]` - Cancelar reserva
  - Buscar: Status cambiado a 'cancelled'

### **🏢 Ubicaciones**
- `GET /api/locations` - Listar ubicaciones
  - Buscar: Array de locations con servicios disponibles

### **👨‍💼 Staff**
- `GET /api/staff` - Listar personal
  - Buscar: Array de staff con especialidades

### **💅 Servicios**
- `GET /api/services` - Listar servicios
  - Buscar: 22 servicios de Anchor 23 con precios

### **📅 Disponibilidad**
- `GET /api/availability?service_id=1&date=2024-01-01&location_id=1`
  - Buscar: Slots disponibles por staff
- `POST /api/availability/blocks` - Bloquear horario
  - Body: `{ staff_id, start_time, end_time, reason }`
  - Buscar: Bloqueo creado

### **🏪 Kiosk (Auto-servicio)**
- `GET /api/kiosk/locations` - Ubicaciones disponibles
  - Buscar: Locations con servicios activos
- `POST /api/kiosk/bookings` - Reserva desde kiosk
  - Body: `{ service_id, customer_data, date }`
  - Buscar: Booking creado + email enviado
- `POST /api/kiosk/walkin` - Reserva inmediata
  - Body: `{ service_id, customer_data }`
  - Buscar: Booking inmediato confirmado

### **📊 Aperture (Dashboard Admin)**
- `GET /api/aperture/stats` - Estadísticas generales
  - Buscar: Métricas de negocio (revenue, bookings, etc.)
- `GET /api/aperture/reports` - Reportes detallados
  - Buscar: Datos para gráficos y análisis
- `GET /api/aperture/pos` - Sistema POS
  - Buscar: Servicios disponibles para venta

### **🧾 Recibos**
- `GET /api/receipts/[bookingId]` - Descargar PDF
  - Buscar: PDF generado con datos de reserva
- `POST /api/receipts/[bookingId]/email` - Enviar por email
  - Buscar: Email enviado con PDF adjunto

### **⚙️ Sistema**
- `GET /api/health` - Health check
  - Buscar: `{ status: 'ok' }`
- `POST /api/cron/reset-invitations` - Reset diario
  - Buscar: Invitaciones expiradas reseteadas

### **📧 Webhooks (Formularios Públicos)**
- `POST https://flows.soul23.cloud/webhook-test/4YZ7RPfo1GT` - Webhook test
  - Body: Payload completo con form type
  - Buscar: 200 OK + acknowledgment
- `POST https://flows.soul23.cloud/webhook/4YZ7RPfo1GT` - Webhook prod
  - Body: Payload completo con form type
  - Buscar: 200 OK + acknowledgment

**Form Types disponibles:**
- `contact` - Formulario de contacto
- `franchise` - Solicitud de franquicia
- `membership` - Solicitud de membresía

**Payload Base:**
```json
{
  "form": "contact|franchise|membership",
  "timestamp_utc": "2026-01-18T04:26:30.187Z",
  "device_type": "mobile|desktop|unknown"
}
```

**Contact Payload:**
```json
{
  "form": "contact",
  "nombre": "Nombre Completo",
  "email": "email@example.com",
  "telefono": "+52 844 123 4567",
  "motivo": "cita|membresia|franquicia|servicios|pago|resena|otro",
  "mensaje": "Texto del mensaje",
  "timestamp_utc": "2026-01-18T04:26:30.187Z",
  "device_type": "mobile"
}
```

**Franchise Payload:**
```json
{
  "form": "franchise",
  "nombre": "Nombre Completo",
  "email": "email@example.com",
  "telefono": "+52 844 123 4567",
  "ciudad": "Monterrey",
  "estado": "Nuevo León",
  "socios": 2,
  "experiencia_sector": "1-3-anos",
  "experiencia_belleza": true,
  "mensaje": "Mensaje adicional",
  "timestamp_utc": "2026-01-18T04:26:30.187Z",
  "device_type": "desktop"
}
```

**Membership Payload:**
```json
{
  "form": "membership",
  "membership_id": "vip",
  "nombre": "Nombre Completo",
  "email": "email@example.com",
  "telefono": "+52 844 123 4567",
  "mensaje": "Pregunta específica",
  "timestamp_utc": "2026-01-18T04:26:30.187Z",
  "device_type": "mobile"
}
```

## 🔍 **Qué Buscar en Cada Respuesta**

### **✅ Éxito**
- Status codes: 200, 201
- Estructura de datos correcta
- Relaciones cargadas (joins)
- Emails enviados (para bookings)

### **❌ Errores**
- Status codes: 400, 401, 403, 404, 500
- Mensajes de error descriptivos
- Validación de datos
- Autenticación requerida

### **🔄 Estados**
- Bookings: `pending` → `confirmed` → `completed`
- Pagos: `pending` → `paid`
- Recursos: `available` → `booked`

## 🧪 **Casos de Edge**

- **Autenticación**: Token expirado, permisos insuficientes
- **Reservas**: Doble booking, horarios conflictivos
- **Pagos**: Montos inválidos, métodos no soportados
- **Kiosk**: Datos faltantes, servicios no disponibles

## 📈 **Performance**

- Response time < 500ms para GET
- Response time < 2s para POST complejos
- Conexiones concurrentes soportadas