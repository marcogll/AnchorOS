# TASKS.md — Plan de Ejecución por Fases

Este documento define las tareas ejecutables del proyecto **AnchorOS**, alineadas estrictamente con el PRD. Ninguna tarea puede introducir lógica no documentada.

---

## Convenciones

* Cada tarea produce artefactos verificables (código, migraciones, tests, documentación).
* Las reglas de negocio viven en backend.
* Todo automatismo debe ser auditable.
* Ningún agente redefine alcance.

---

## Estructura de Documentación

El proyecto mantiene una estructura de documentación organizada para facilitar navegación y mantenimiento:

### Documentos Principales (Raíz)
* **README.md** → Guía técnica y operativa del repositorio. Punto de entrada principal.
* **TASKS.md** (este documento) → Plan de ejecución por fases y estado actual del proyecto.

### Documentación Especializada (docs/)
Documentación detallada organizada por área funcional:

**Documentación Base:**
* **PRD.md** → Documento maestro de producto y reglas de negocio (fuente de verdad).
* **API.md** → Documentación completa de APIs y endpoints.
* **site_requirements.md** → Requisitos técnicos del proyecto.
* **STRIPE_SETUP.md** → Guía de integración de pagos con Stripe.

**Documentación de Dominios:**
* **ANCHOR23_FRONTEND.md** → Documentación del frontend institucional (anchor23.mx).
* **DOMAIN_CONFIGURATION.md** → Configuración de dominios y subdominios.
* **PROJECT_UPDATE_JAN_2026.md** → Actualizaciones del proyecto Enero 2026.

**Documentación de Sistemas:**
* **KIOSK_SYSTEM.md** → Documentación completa del sistema de kiosko.
* **KIOSK_IMPLEMENTATION.md** → Guía rápida de implementación del kiosko.
* **ENROLLMENT_SYSTEM.md** → Sistema de enrollment de kioskos.
* **RESOURCES_UPDATE.md** → Documentación de actualización de recursos.

**Documentación Operativa:**
* **OPERATIONAL_PROCEDURES.md** → Procedimientos operativos.
* **STAFF_TRAINING.md** → Guía de capacitación del staff.
* **CLIENT_ONBOARDING.md** → Proceso de onboarding de clientes.
* **TROUBLESHOOTING.md** → Guía de solución de problemas.

**Reglas de Mantenimiento:**
* Cuando se agrega nueva funcionalidad: actualizar TASKS.md y documentación relevante en docs/
* Cuando se modifica lógica de negocio: actualizar PRD.md primero
* Cuando se crea nuevo endpoint: actualizar API.md
* Cuando se implementa nuevo dominio: crear o actualizar documentación en docs/
* README.md debe tener siempre links actualizados a toda la documentación

---

## Convenciones de Código

Para mantener el código base mantenible y auto-documentado, se seguirán estas convenciones:

### Comentarios en Funciones PostgreSQL

Todas las funciones PostgreSQL deben incluir:
```sql
/**
 * @description Breve descripción de qué hace la función
 * @param {tipo} nombre_parametro - Descripción del parámetro
 * @returns {tipo} - Descripción del valor de retorno
 * @example SELECT funcion_de_ejemplo(param1, param2);
 */
```

**Ejemplo:**
```sql
/**
 * @description Verifica disponibilidad completa del staff validando horario laboral, reservas existentes y bloques manuales
 * @param {UUID} p_staff_id - ID del staff a verificar
 * @param {TIMESTAMPTZ} p_start_time_utc - Hora de inicio en UTC
 * @param {TIMESTAMPTZ} p_end_time_utc - Hora de fin en UTC
 * @param {UUID} p_exclude_booking_id - (Opcional) ID de reserva a excluir en verificación
 * @returns {BOOLEAN} - true si el staff está disponible, false en caso contrario
 * @example SELECT check_staff_availability('uuid...', NOW(), NOW() + INTERVAL '1 hour', NULL);
 */
CREATE OR REPLACE FUNCTION check_staff_availability(...)
```

### Comentarios en TypeScript/JavaScript

Todas las funciones deben tener JSDoc:
```typescript
/**
 * @description Breve descripción de la función
 * @param {tipo} nombreParametro - Descripción del parámetro
 * @returns {tipo} - Descripción del valor de retorno
 * @example funcionDeEjemplo(param1, param2)
 */
```

**Ejemplo:**
```typescript
/**
 * @description Genera un short ID único de 6 caracteres para bookings
 * @param {number} maxAttempts - Máximo número de intentos antes de lanzar error
 * @returns {Promise<string>} - Short ID único de 6 caracteres
 * @example generateShortId(5)
 */
export async function generateShortId(maxAttempts: number = 5): Promise<string>
```

### Comentarios en API Routes

Cada endpoint debe documentar:
```typescript
/**
 * @description Descripción de qué hace este endpoint
 * @param {NextRequest} request - Objeto de request de Next.js
 * @returns {NextResponse} - Response con estructura { success, data/error }
 */
export async function GET(request: NextRequest) {
  // Implementación
}
```

### Reglas de Nombres

* **Funciones**: camelCase (`checkStaffAvailability`, `generateShortId`)
* **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEZONE`)
* **Tablas**: snake_case (`bookings`, `customer_profiles`)
* **Columnas**: snake_case (`created_at`, `updated_at`, `first_name`)
* **Componentes**: PascalCase (`BookingForm`, `CustomerSearch`)
* **Archivos**: kebab-case (`booking-page.tsx`, `api-bookings.ts`)

### SQL Migrations

Cada migración debe incluir:
```sql
-- ============================================
-- Nombre descriptivo de la migración
-- Fecha: AAAAMMDD
-- Autor: Nombre del desarrollador
-- Ticket/Issue: Referencia al ticket o issue (opcional)
-- ============================================

-- Descripción breve de qué cambia esta migración
-- Ejemplo: Agrega columna business_hours a locations para horarios personalizados
```

### Comentarios de Auditoría

Para acciones que requieren logging en `audit_logs`:
```typescript
// Log action for audit trail
await supabaseAdmin.from('audit_logs').insert({
  entity_type: 'booking',
  entity_id: bookingId,
  action: 'create',
  new_values: { customer_id: customerId, start_time: startTime }
});
```

---

## FASE 1 — Cimientos y CRM ✅ COMPLETADA

### 1.1 Infraestructura Base ✅
* ✅ Crear proyecto Supabase.
* ✅ Definir roles: Admin / Manager / Staff / Artist / Customer / Kiosk.
* ✅ Configurar RLS base por rol (Artist NO ve email/phone de customers).
* ✅ Configurar Auth (Magic Links Email/SMS) - PENDIENTE

**Output:**
* ✅ Proyecto Supabase operativo.
* ✅ Policies iniciales documentadas.

---

### 1.2 Esquema de Base de Datos Inicial ✅
Tablas obligatorias:

* ✅ locations (incluye timezone)
* ✅ resources
* ✅ staff
* ✅ services
* ✅ customers
* ✅ invitations
* ✅ bookings
* ✅ audit_logs
* ✅ kiosks
* ✅ amenities

Tareas:
* ✅ Definir migraciones SQL versionadas.
* ✅ Claves foráneas y constraints.
* ✅ Campos de auditoría (`created_at`, `updated_at`).

**Output:**
* ✅ Migraciones SQL.
* ✅ Diagrama lógico.
* ✅ Documentación de recursos actualizada.

---

### 1.3 Short ID & Invitaciones ✅
* ✅ Implementar generador de Short ID (6 chars, collision-safe).
* ✅ Validación de unicidad antes de persistir booking.
* ✅ Generador y validación de códigos de invitación.
* ✅ Lógica de cuotas semanales por Tier.
* ✅ Reseteo automático de invitaciones cada semana (Lunes 00:00 UTC).
* ⏳ Reseteo implementado via Supabase Edge Function o cron externo.

**Output:**
* ✅ Funciones backend.
* ⏳ Tests unitarios - PENDIENTE
* ✅ Registros en `audit_logs`.

---

### 1.4 CRM Base (Customers) ✅
* ✅ Cálculo automático de Tier.
* ✅ Tracking de referidos.
* ✅ Perfil privado de cliente.
* ✅ Tiers actualizados: free, gold, black, VIP.
* ⏳ Endpoints CRUD - PENDIENTE
* ✅ Policies RLS por rol.

---

### 1.5 Sistema de Kiosko ✅
* ✅ Crear tabla `kiosks` con autenticación por API key.
* ✅ Implementar rol `kiosk` en enum `user_role`.
* ✅ Crear políticas RLS para kiosk (sin acceso a PII).
* ✅ Implementar API routes para kiosk.
* ✅ Crear componentes UI para confirmación de citas y walk-ins.
* ✅ Implementar función de asignación de recursos con prioridad.
* ✅ Auditoría completa de acciones de kiosk.

**Output:**
* ✅ Migración SQL de sistema kiosk.
* ✅ API routes completas.
* ✅ Componentes UI reutilizables.
* ✅ Documentación completa del sistema.
* ✅ Función `get_available_resources_with_priority()`.

---

### 1.6 Actualización de Recursos ✅
* ✅ Reemplazar nombres descriptivos por códigos estandarizados.
* ✅ Implementar estructura: 3 mkup, 1 lshs, 4 pedi, 4 mani por location.
* ✅ Actualizar migraciones y seed data.

**Output:**
* ✅ Migración de actualización de recursos.
* ✅ Documentación de estructura de recursos.
* ⏳ Revisión y testing de asignación de recursos - PENDIENTE.

---

## FASE 2 — Motor de Agendamiento ✅ COMPLETADA

### 2.1 Disponibilidad Doble Capa ✅
* ✅ Horario laboral + Google Calendar events + resources
* ✅ Prioridad recursos: mkup > lshs > pedi > mani (`get_available_resources_with_priority`)
* ✅ Prioridad Staff/Artist dinámica
* ✅ `get_detailed_availability(location_id, service_id, date)`
* ✅ `check_staff_availability()` + calendar conflicts

**Output:**
* ✅ `lib/google-calendar.ts` + APIs `/api/sync/calendar/*`
* ✅ Migrations 2026011800* (tables/funcs)
* ✅ Tests collision via functions

---

### 2.2 Servicios Express (Dual Artists) ✅
* ✅ Dual artist search + room block (`assign_dual_artists`)
* ✅ Premium Fee auto (`calculate_service_total`)
* ✅ Booking logic kiosk APIs updated
* ✅ `requires_dual_artist` handling
* ✅ RLS via existing staff/kiosk policies

**Output:**
* ✅ Migration 20260118030000_dual_artist_support.sql
* ✅ Kiosk walkin/bookings POST enhanced

---

### 2.3 Enhanced Availability ✅
* ✅ Dynamic priority Staff > Artist
* ✅ Resource priority mkup>lshs>pedi>mani
* ✅ Dual slots (`get_dual_availability >=2 staff`)
* ✅ Collision detection concurrent (`check_staff_availability`)

**Output:**
* ✅ Migration 20260118040000_enhanced_availability_priority.sql
* ✅ Algorithm documented in funcs

---

 ## FASE 3 — Pagos y Protección ✅ COMPLETADA

### 3.1 Stripe — Depósitos Dinámicos ✅
* Regla $200 vs 50% según día.
* Asociación pago ↔ booking (UUID interno, Short ID visible).
* Webhooks para:
* payment_intent.succeeded
* payment_intent.payment_failed
* charge.refunded
* Validación de pagos.
* Función de cálculo de depósito.

**Output:**
* ✅ Webhooks Stripe.
* ✅ Validación de pagos.
* ✅ Función de cálculo de depósito.

---

### 3.2 No-Show Logic ✅
* Ventana de cancelación 12h (UTC).
* Penalización automática:
* Marcar booking como `no_show`
* Retener depósito
* Notificar a cliente
* Override Admin.
* ✅ Auditoría en `audit_logs` (ya implementada).
* ⏳ Notificaciones por email/SMS.

**Output:**
* ✅ Función de penalización.
* ⏳ Notificaciones por email/SMS.

---

## FASE 4 — HQ Dashboard ✅ COMPLETADA

### 4.1 Calendario Multi-Columna ✅ COMPLETADO
* ✅ Vista por staff en columnas.
* ✅ Bloques de 15 minutos con horarios de negocio.
* ✅ Componente visual de citas con colores por estado.
* ✅ API `/api/aperture/calendar` para datos del calendario.
* ✅ API `/api/aperture/bookings/[id]/reschedule` para reprogramación.
* ✅ Filtros por staff y ubicación.
* ✅ Drag & drop para reprogramar con validación de conflictos.
* ✅ Creación de nuevas citas desde slots vacíos con modal.
* ⏳ Resize dinámico de bloques (opcional).
* ✅ Validación de colisiones completa.

**Output:**
* ✅ Componente de calendario (CalendarView) con modal de creación de citas.
* ✅ Lógica de reprogramación (drag & drop).
* ✅ Validación de colisiones completa.
* ✅ Interfaz de creación de citas desde slots vacíos.
* ⏳ Resize dinámico de bloques (opcional).

---

### 4.2 Gestión Operativa ✅ COMPLETADO
* ✅ **Recursos físicos**:
* ✅ Agregar/editar/eliminar recursos con API CRUD completa.
* ✅ Ver disponibilidad en tiempo real con indicadores visuales.
* ✅ Estados de ocupación y capacidades por tipo de recurso.
* ✅ **Staff**:
* ✅ CRUD completo con API y componente visual.
* ✅ Asignación a locations con validación.
* ✅ Horarios semanales y disponibilidad por staff.
* ⏳ Traspaso entre sucursales (opcional - no prioritario).

### ✅ COMENTARIOS AUDITABLES IMPLEMENTADOS
* ✅ **APIs Críticas (40+ archivos)**: JSDoc completo con validaciones manuales
* ✅ **Componentes (25+ archivos)**: Comentarios de business logic y seguridad
* ✅ **Funciones Core**: Generadores, utilidades con reglas de negocio
* ✅ **Scripts de Desarrollo**: Documentación de setup y mantenimiento
* ✅ **Contextos de Seguridad**: Auth provider con validaciones de acceso
* ✅ **Validación Manual**: Cada función incluye @audit tags para revisión
* ✅ **Performance Notes**: Comentarios de optimización y N+1 prevention
* ✅ **Security Validation**: RLS policies y permisos documentados

**Output:**
* ⏳ UI de gestión de recursos.
* ⏳ UI de gestión de staff.
* ⏳ Función de traspaso de bookings.

---

### 4.3 The Vault ⏳
* Upload de fotos privadas (Storage).
* Formularios técnicos para clientes VIP.
* Acceso restringido por rol.
* Storage bucket configuration.
* Formularios de The Vault.
* Políticas de acceso.

**Output:**
* ⏳ Storage bucket configuration.
* ⏳ Formularios de The Vault.
* ⏳ Políticas de acceso.

---

## FASE 5 — Clientes y Fidelización ✅ COMPLETADO

### 5.1 Client Management (CRM) ✅
* ✅ Clientes con búsqueda fonética (email, phone, first_name, last_name)
* ✅ Historial de reservas por cliente
* ✅ Notas técnicas con timestamp
* ✅ APIs CRUD completas
* ✅ Galería de fotos (restringido a VIP/Black/Gold)

**APIs:**
* ✅ `GET /api/aperture/clients` - Listar y buscar clientes
* ✅ `POST /api/aperture/clients` - Crear nuevo cliente
* ✅ `GET /api/aperture/clients/[id]` - Detalles completos del cliente
* ✅ `PUT /api/aperture/clients/[id]` - Actualizar cliente
* ✅ `POST /api/aperture/clients/[id]/notes` - Agregar nota técnica
* ✅ `GET /api/aperture/clients/[id]/photos` - Galería de fotos
* ✅ `POST /api/aperture/clients/[id]/photos` - Subir foto

**Output:**
* ✅ Migración SQL con customer_photos, customer preferences
* ✅ APIs completas de clientes
* ✅ Búsqueda fonética implementada
* ✅ Galería de fotos restringida por tier

---

### 5.2 Sistema de Lealtad ✅
* ✅ Puntos independientes de tiers
* ✅ Expiración de puntos (6 meses sin usar)
* ✅ Transacciones de lealtad (earned, redeemed, expired, admin_adjustment)
* ✅ Historial completo de transacciones
* ✅ API para sumar/restar puntos

**APIs:**
* ✅ `GET /api/aperture/loyalty` - Resumen de lealtad para cliente actual
* ✅ `GET /api/aperture/loyalty/[customerId]` - Historial de lealtad
* ✅ `POST /api/aperture/loyalty/[customerId]/points` - Agregar/remover puntos

**Output:**
* ✅ Migración SQL con loyalty_transactions
* ✅ APIs completas de lealtad
* ✅ Función PostgreSQL `add_loyalty_points()`
* ✅ Función PostgreSQL `get_customer_loyalty_summary()`

---

### 5.3 Membresías ✅
* ✅ Planes de membresía (Gold, Black, VIP)
* ✅ Beneficios configurables por JSON
* ✅ Subscripciones de clientes
* ✅ Tracking de créditos mensuales

**Output:**
* ✅ Migración SQL con membership_plans y customer_subscriptions
* ✅ Planes predefinidos (Gold, Black, VIP)
* ✅ Tabla de subscriptions con credits_remaining

---

## FASE 6 — Pagos y Protección ✅ COMPLETADO

### 6.1 Stripe Webhooks ✅
* ✅ `payment_intent.succeeded` - Pago completado
* ✅ `payment_intent.payment_failed` - Pago fallido
* ✅ `charge.refunded` - Reembolso procesado
* ✅ Logging de webhooks con payload completo
* ✅ Prevención de procesamiento duplicado (por event_id)

**APIs:**
* ✅ `POST /api/webhooks/stripe` - Handler de webhooks Stripe

**Output:**
* ✅ Migración SQL con webhook_logs
* ✅ Funciones PostgreSQL de procesamiento de webhooks
* ✅ API endpoint con signature verification

---

### 6.2 No-Show Logic ✅
* ✅ Detección automática de no-shows (ventana 12h)
* ✅ Cron job para detección cada 2 horas
* ✅ Penalización automática (retener depósito)
* ✅ Tracking de no-show count por cliente
* ✅ Override Admin (waive penalty)
* ✅ Check-in de clientes

**APIs:**
* ✅ `GET /api/cron/detect-no-shows` - Detectar no-shows (cron job)
* ✅ `POST /api/aperture/bookings/no-show` - Aplicar penalización manual
* ✅ `POST /api/aperture/bookings/check-in` - Registrar check-in

**Output:**
* ✅ Migración SQL con no_show_detections
* ✅ Función PostgreSQL `detect_no_show_booking()`
* ✅ Función PostgreSQL `apply_no_show_penalty()`
* ✅ Función PostgreSQL `record_booking_checkin()`
* ✅ Campos en bookings: check_in_time, check_in_staff_id, penalty_waived
* ✅ Campos en customers: no_show_count, last_no_show_date

---

### 6.3 Finanzas y Reportes ✅
* ✅ Tracking de gastos por categoría
* ✅ Reportes financieros (revenue, expenses, profit)
* ✅ Daily closing reports con PDF
* ✅ Reportes de performance de staff
* ✅ Breakdown de pagos por método

**APIs:**
* ✅ `GET /api/aperture/finance` - Resumen financiero
* ✅ `POST /api/aperture/finance/daily-closing` - Generar reporte diario
* ✅ `GET /api/aperture/finance/daily-closing` - Listar reportes
* ✅ `GET /api/aperture/finance/expenses` - Listar gastos
* ✅ `POST /api/aperture/finance/expenses` - Crear gasto
* ✅ `GET /api/aperture/finance/staff-performance` - Performance de staff

**Output:**
* ✅ Migración SQL con expenses y daily_closing_reports
* ✅ Función PostgreSQL `get_financial_summary()`
* ✅ Función PostgreSQL `get_staff_performance_report()`
* ✅ Función PostgreSQL `generate_daily_closing_report()`
* ✅ Categorías de gastos: supplies, maintenance, utilities, rent, salaries, marketing, other

---

### 7.1 Notificaciones ⏳
* Confirmaciones por WhatsApp.
* Recordatorios de citas:
* 24h antes
* 2h antes
* Alertas de no-show.
* Notificaciones de cambios de horario.
* Integración WhatsApp API.
* Templates de mensajes.
* Sistema de envío programado.

**Output:**
* ⏳ Integración WhatsApp API.
* ⏳ Templates de mensajes.
* ⏳ Sistema de envío programado.

---

### 5.2 Recibos Digitales ⏳
* Generación de PDF.
* Email automático post-servicio.
* Historial de transacciones.
* Generador de PDFs.
* Sistema de emails.
* Dashboard de transacciones.

**Output:**
* ⏳ Generador de PDFs.
* ⏳ Sistema de emails.
* ⏳ Dashboard de transacciones.

---

### 5.3 Landing Page Believers ⏳
* Página pública de booking.
* Calendario simplificado para clientes.
* Captura de datos básicos.
* Página de booking pública.
* Calendario cliente.
* Formulario de captura.

**Output:**
* ⏳ Página de booking pública.
* ⏳ Calendario cliente.
* ⏳ Formulario de captura.

---

## ESTADO ACTUAL DEL PROYECTO

### ✅ Completado
- Infraestructura base de datos
- Sistema de roles y permisos RLS
- Generadores de Short ID y códigos de invitación
- Sistema de kiosko completo
- API routes para kiosk
- Componentes UI para kiosk
- Actualización de recursos con códigos estandarizados
- Audit logging completo
- Tiers de cliente extendidos (free, gold, black, VIP)
- Sistema de disponibilidad (staff, recursos, bloques)
- API routes de disponibilidad
- API de reservas para clientes (POST/GET)
- HQ Dashboard básico (Aperture) - API dashboard funcionando con bookings, top performers, activity feed
- Calendario multi-columna con vista por staff, filtros y API completa
- Autenticación completa para Aperture (login → dashboard redirect)
- Frontend institucional anchor23.mx completo
  - Landing page con hero, fundamento, servicios, testimoniales
  - Página de servicios
  - Página de historia y filosofía
  - Página de contacto
  - Página de franquicias
  - Página de membresías (Gold, Black, VIP)
  - Páginas legales (Privacy Policy, Legal)
  - Header y footer globales

### 🚧 En Progreso
- 🚧 Aperture - Backend para staff/manager/admin (aperture.anchor23.mx)
   - ✅ API para obtener staff disponible (/api/aperture/staff)
   - ✅ API para gestión de horarios (/api/aperture/staff/schedule)
   - ✅ API para recursos (/api/aperture/resources)
   - ✅ API para dashboard (/api/aperture/dashboard) - FUNCIONANDO
   - ✅ API para calendario (/api/aperture/calendar) - FUNCIONANDO
   - ✅ API para reprogramación (/api/aperture/bookings/[id]/reschedule) - FUNCIONANDO
   - ✅ Componente CalendarioView con drag & drop framework
   - ✅ Página de calendario (/aperture/calendar) - FUNCIONANDO
   - ✅ Página principal de admin (/aperture)
   - ✅ Creación de citas desde slots vacíos
   - ✅ Autenticación de admin/staff/manager (Supabase Auth completo)
   - ✅ Gestión completa de staff (CRUD, horarios)
   - ✅ Gestión de recursos y asignación

### ⏳ Pendiente
- ✅ Implementar API pública (api.anchor23.mx) - Horarios, servicios, ubicaciones públicas
- ⏳ Implementar autenticación para staff/manager/admin (Supabase Auth)
- ⏳ Implementar sistema completo de asignación de disponibilidad
- ⏳ Integración con Google Calendar
- ⏳ Integración con Stripe (pagos y depósitos dinámicos)
- ⏳ The Vault (storage de fotos privadas)
- ⏳ Notificaciones y automatización (WhatsApp API)
- ⏳ Autenticación de clientes en The Boutique
- ⏳ Testing completo de todos los flujos

---

## ✅ FUNCIONALIDADES COMPLETADAS RECIENTEMENTE

### Calendario Multi-Columna - 95% Completo
- ✅ **Vista Multi-Columna**: Staff en columnas separadas con bloques de 15 minutos
- ✅ **Drag & Drop**: Reprogramación automática con validación de conflictos
- ✅ **Filtros Avanzados**: Por sucursal y staff individual
- ✅ **Indicadores Visuales**: Colores por estado, conflictos, tooltips detallados
- ✅ **Tiempo Real**: Auto-refresh cada 30 segundos con indicador de última actualización
- ✅ **APIs Completas**: `/api/aperture/calendar` y `/api/aperture/bookings/[id]/reschedule`
- ✅ **Página Dedicada**: `/aperture/calendar` con navegación completa

---

 ## CORRECCIONES RECIENTES ✅

### Calendario Aperture - Creación de Citas (Enero 21, 2026) ✅
**Nueva Funcionalidad:**
- Click en slot vacío del calendario abre modal de creación de cita
- Modal con selección de:
  - Cliente (lista dropdown)
  - Servicio (lista dropdown con duración y precio)
  - Ubicación (lista dropdown)
  - Staff (lista dropdown filtrado por ubicación)
  - Notas (campo de texto opcional)
- Validación de campos obligatorios antes de enviar
- API: `POST /api/bookings` para crear nueva cita
- Calendario se actualiza automáticamente después de creación exitosa

**Archivos:**
- `components/calendar-view.tsx` - Componente con modal de creación de citas

**Backend:**
- Funciones de disponibilidad validan correctamente timezones (UTC)
- `check_staff_availability` con llamadas corregidas a funciones auxiliares
- Migración: 20260121000000_fix_staff_availability_function_calls.sql

---

### Corrección de Calendario (Enero 18, 2026) ✅
**Problema:**
- Calendario mostraba días desalineados con días de la semana
- Enero 1, 2026 aparecía como Lunes en lugar de Jueves
- Grid del DatePicker no calculaba offset del primer día del mes

**Solución:**
- Agregar cálculo de offset usando getDay() del primer día del mes
- Ajustar para semana que empieza en Lunes: offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
- Agregar celdas vacías al inicio para padding correcto
- Para Enero 2026: Jueves (getDay=4) → offset=3 (3 celdas vacías antes del día 1)

**Archivos:**
- `components/booking/date-picker.tsx` - Cálculo de offset y padding cells

**Commits:**
- `dbac763` - fix: Correct calendar day offset in DatePicker component

---

### Corrección de Horarios de Negocio (Enero 18, 2026) ✅
**Problema:**
- Sistema de disponibilidad solo mostraba horarios 22:00-23:00
- Horarios de negocio (business_hours) configurados incorrectamente
- Función get_detailed_availability tenía problemas de timezone conversion

**Soluciones:**

1. **Migración de Horarios por Defecto:**
   - Actualizar business_hours a horarios normales del salón
   - Lunes a Viernes: 10:00-19:00
   - Sábado: 10:00-18:00
   - Domingo: Cerrado

2. **Mejora de Función de Disponibilidad:**
   - Reescribir get_detailed_availability con make_timestamp()
   - Eliminar concatenación de strings para construcción de timestamps
   - Manejo correcto de timezone con AT TIME ZONE
   - Mejorar NULL handling para business_hours y is_available_for_booking

**Archivos:**
- `supabase/migrations/20260118080000_fix_business_hours_default.sql`
- `supabase/migrations/20260118090000_fix_get_detailed_availability_timezone.sql`

**Commits:**
- `35d5cd0` - fix: Correct calendar offset and fix business hours showing only 22:00-23:00

---

### Página de Test Links (Enero 18, 2026) ✅
**Nueva Funcionalidad:**
- Página centralizada `/testlinks` con directorio completo del proyecto
- 21 páginas implementadas agrupadas por dominio
- 40+ API endpoints documentados con indicadores de método
- Badges de color para identificar FASE5 y FASE 6
- Diseño responsive con grid layout y efectos hover

**Archivos:**
- `app/testlinks/page.tsx` - 287 líneas de HTML/TypeScript renderizado
- Actualización de `README.md` con nueva sección 12: Test Links

**Commits:**
- `09180ff` - feat: Add testlinks page and update README with directory

---

## PRÓXIMAS TAREAS PRIORITARIAS

### 🔴 CRÍTICO - Bloquea Funcionamiento (Timeline: 1-2 días)

1. ✅ **Implementar `GET /api/aperture/stats`** - COMPLETADO
   - ✅ Dashboard de Aperture espera este endpoint
   - ✅ Sin esto, estadísticas no se cargan
   - ✅ Respuesta esperada: `{ success: true, stats: { totalBookings, totalRevenue, completedToday, upcomingToday } }`
   - ✅ Ubicación: `app/api/aperture/stats/route.ts`

2. ✅ **Implementar autenticación para Aperture** - COMPLETADO
   - ✅ Integración con Supabase Auth para roles admin/manager/staff
   - ✅ Protección de rutas de Aperture (middleware)
   - ✅ Session management
   - ✅ Página login ya existe en `/app/aperture/login/page.tsx`, integration completada
   - ✅ Post-login redirect to dashboard (/aperture)

3. ✅ **Implementar reseteo semanal de invitaciones** - COMPLETADO
   - ✅ Script/Edge Function que se ejecuta cada Lunes 00:00 UTC
   - ✅ Resetea `weekly_invitations_used` a 0 para todos los clientes Tier Gold
   - ✅ Registra acción en `audit_logs`
   - ✅ Ubicación: `app/api/cron/reset-invitations/route.ts`
   - ✅ Impacto: Membresías Gold ahora funcionan correctamente

**Configuración Necesaria:**
- Agregar `CRON_SECRET` a variables de entorno (.env.local)
- Configurar Vercel Cron Job o similar para ejecución automática
- Comando de ejemplo:
  ```bash
  curl -X GET "https://aperture.anchor23.mx/api/cron/reset-invitations" \
    -H "Authorization: Bearer YOUR_CRON_SECRET"
  ```

 ### 🟡 ALTA - Documentación y Diseño (Timeline: 1 semana)

4. ✅ **Actualizar documentación con especificaciones técnicas completas** - COMPLETADO
   - Crear documento de especificaciones técnicas (`docs/APERATURE_SPECS.md`)
   - Documentar respuesta a horas trabajadas (automático desde bookings)
   - Definir estructura de POS completa
   - Documentar sistema de múltiples cajeros

5. ✅ **Actualizar APERTURE_SQUARE_UI.md con Radix UI** - COMPLETADO
   - Agregar sección "Stack Técnico"
   - Documentar componentes Radix UI específicos
   - Ejemplos de uso de Radix con estilizado Square UI
   - Guía de accesibilidad Radix (ARIA attributes, keyboard navigation)

6. ✅ **Actualizar API.md con rutas implementadas** - COMPLETADO
   - Rutas a agregar que existen pero NO están en API.md:
     - `GET /api/availability/blocks`
     - `GET /api/public/availability`
     - `POST /api/availability/staff`
     - `POST /api/kiosk/walkin`

### ✅ COMPLETADO
- FASE 5 - Clientes y Fidelización
  - ✅ Client Management (CRM) con búsqueda fonética
  - ✅ Sistema de Lealtad con puntos y expiración
  - ✅ Membresías (Gold, Black, VIP) con beneficios
  - ✅ Galería de fotos restringida por tier
- FASE 6 - Pagos y Protección
  - ✅ Stripe Webhooks (payment_intent.succeeded, payment_failed, charge.refunded)
  - ✅ No-Show Logic con detección automática y penalización
  - ✅ Finanzas y Reportes (expenses, daily closing, staff performance)
  - ✅ Check-in de clientes

---

### 🟢 MEDIA - Componentes y Features (Timeline: 4-6 semanas restantes)

8. **Rediseñar Aperture completo con Radix UI** - ~136-171 horas
   - **FASE 0**: Documentación y Configuración (~6 horas)
   - **FASE 1**: Componentes Base con Radix UI (~20-25 horas)
     - Instalar Radix UI
     - Crear/actualizar componentes base (Button, Card, Input, Select, Tabs, etc.)
     - Crear componentes específicos de Aperture (StatsCard, BookingCard, etc.)
     - **FASE 2**: Dashboard Home (~15-20 horas) ✅ COMPLETADO
      - ✅ KPI Cards (Ventas, Citas, Clientes, Gráfico) - StatsCard implementado
      - ✅ Tabla "Top Performers" - Con Table component y medallas top 3
      - ✅ Feed de Actividad Reciente - Con timeline visual
      - ✅ API: `/api/aperture/dashboard` - Extendida con clientes, top performers, actividad
      - API: `/api/aperture/stats` (ya existe)
    - **FASE 3**: Calendario Maestro (~25-30 horas) - 95% COMPLETADO
      - ✅ Columnas por trabajador con vista visual
      - ✅ Filtros dinámicos (Staff y Ubicación)
      - ✅ Indicadores visuales (colores por estado, tooltips, conflictos)
      - ✅ APIs: `/api/aperture/calendar`, `/api/aperture/bookings/[id]/reschedule`
      - ✅ Drag & Drop con reprogramación automática
      - ✅ Notificaciones en tiempo real (auto-refresh cada 30s)
      - ⏳ Resize de bloques dinámico (opcional)
    - **FASE 4**: Miembros del Equipo y Nómina (~20-25 horas) ✅ EN PROGRESO
      - ✅ Gestión de Staff (CRUD completo con APIs funcionales)
    - ✅ APIs de Nómina (`/api/aperture/payroll` con cálculos automáticos)
    - ✅ Cálculo de Nómina (Sueldo Base + Comisiones + Propinas)
    - ✅ Configuración de Comisiones (% por servicio basado en revenue)
    - ✅ Calendario de Turnos (implementado en APIs de staff con horarios)

### 4.6 Ventas, Pagos y Facturación ✅ COMPLETADO
* ✅ **POS completo** (`/api/aperture/pos` con múltiples métodos de pago)
* ✅ **Métodos de pago**: Efectivo, tarjeta, transferencias, giftcards, membresías
* ✅ **Cierre de caja** (`/api/aperture/pos/close-day` con reconciliación)
* ✅ **Interface POS**: Carrito, selección de productos/servicios, pagos múltiples
* ✅ **Recibos digitales**: Generación automática con impresión
* ✅ **Reportes de ventas**: Diarios con breakdown por método de pago
* ⏳ Conexión con Stripe real (próxima - webhooks pendientes)
      - ✅ APIs: `/api/aperture/staff` (GET/POST/PUT/DELETE), `/api/aperture/payroll`
   - **FASE 5**: Clientes y Fidelización (Loyalty) (~20-25 horas)
     - CRM de Clientes (búsqueda fonética, histórico, notas técnicas)
     - Galería de Fotos (SOLO VIP/Black/Gold) - Good to have: control de calidad, rastreabilidad de quejas
     - Sistema de Membresías (planes, créditos)
     - Sistema de Puntos (independiente de tiers, expiran después de X meses sin usar)
     - APIs: `/api/aperture/clients`, `/api/aperture/loyalty`
   - **FASE 6**: Ventas, Pagos y Facturación (~20-25 horas)
     - POS (Punto de Venta) completo (puede crear nuevas citas + procesar pagos)
     - NO imprimir recibos (enviar email o dashboard cliente)
     - Cierre de Caja (resumen diario, PDF automático)
     - Finanzas (gastos, margen neto)
     - APIs: `/api/aperture/pos`, `/api/aperture/finance`
    - **FASE 7**: Marketing y Configuración (~10-15 horas) ⏳ PENDIENTE
     - Campañas (promociones masivas Email/WhatsApp)
     - Precios Inteligentes (configurables por servicio, aplicables ambos canales)
     - Integraciones Placeholder (Google, Instagram/FB Shopping) - Good to have, no priority
     - APIs: `/api/aperture/campaigns`, `/api/aperture/pricing`, `/api/aperture/integrations`

### 🟢 BAJA - Integraciones Pendientes (Timeline: 1-2 meses)

9. **Implementar Google Calendar Sync** - ~6-8 horas
    - Sincronización bidireccional
    - Manejo de conflictos
    - Webhook para updates de calendar

10. **Implementar Notificaciones WhatsApp** - ~4-6 horas
    - Integración con Twilio/Meta WhatsApp API
    - Templates de mensajes (confirmación, recordatorios, alertas no-show)
    - Sistema de envío programado

11. **Implementar Recibos digitales** - ~3-4 horas
    - Generador de PDFs
    - Sistema de emails (SendGrid, AWS SES, etc.)
    - Dashboard de transacciones

12. **Crear Landing page Believers** - ~4-5 horas
    - Página pública de booking
    - Calendario simplificado para clientes
    - Captura de datos básicos

13. **Implementar Tests Unitarios** - ~5-7 horas
    - Unit tests para generador de Short ID
    - Tests para disponibilidad

14. **Archivos SEO** - ~30 min
    - `public/robots.txt`
    - `public/sitemap.xml`

15. **Calendario - Funcionalidades Avanzadas** - ~8-10 horas (Próximas)
    - Resize dinámico de bloques de tiempo
    - Creación de citas desde calendario (click en slot vacío)
    - Vista semanal/mensual adicional
    - Exportar calendario a PDF

---

## NOTAS IMPORTANTES

### Aclaración sobre Kiosko
El sistema de kiosko no estaba originalmente en el PRD, pero se implementó como extensión funcional para:
- Permitir confirmación de citas en pantalla de entrada
- Facilitar reservas walk-in sin personal
- Reducir carga de trabajo de staff
- Mejorar experiencia del cliente

### Impacto de Actualización de Recursos
La migración de recursos eliminó todos los bookings existentes debido a CASCADE DELETE. Esto es aceptable en fase de desarrollo, pero en producción debe:
- Implementarse con migración de datos
- Notificar a clientes de la necesidad de reprogramar

### Good to Have - Funcionalidades Adicionales

8. **Sistema de Passes Digitales para Clientes**
   - Los clientes pueden generar passes/códigos de acceso desde su cuenta
   - Pases válidos por tiempo limitado
   - Integración con wallet móvil
   - Gestión de passes activos/inactivos
   - Auditoría de uso de passes

---

### Próximas Decisiones
1. ¿Implementar Auth con Supabase Magic Links o SMS?
2. ¿Usar Google Calendar API o Edge Functions para sync?
3. ¿Proveedor de email para notificaciones (SendGrid, AWS SES, etc.)?

---

### Corrección de Horarios de Disponibilidad en Booking (Enero 21, 2026) ✅
**Problema:**
- Sistema de booking solo mostraba horarios de 22:00 y 23:00 en lugar de los horarios de atención correctos (10:00-19:00)
- Función `get_detailed_availability` tenía problemas de conversión de timezone

**Solución:**
- Corregida función `check_staff_availability` para manejar correctamente los parámetros de timezone
- Actualizada función `get_detailed_availability` para convertir correctamente de hora local (Monterrey UTC-6) a UTC
- Creadas funciones auxiliares `check_staff_work_hours` y `check_calendar_blocking`

**Resultado:**
- ✅ Sistema ahora muestra horarios correctos: 10:00, 11:00, 12:00, 13:00, 14:00, 15:00, 16:00, 17:00, 18:00
- ✅ Respeta horarios de atención por día de la semana
- ✅ Maneja correctamente zonas horarias

---

## REGLA FINAL

Si una tarea no está aquí, no existe. Cualquier adición debe evaluarse contra el PRD y documentarse antes de ejecutarse.
