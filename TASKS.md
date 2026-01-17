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

## FASE 2 — Motor de Agendamiento (PENDIENTE)

### 2.1 Disponibilidad Doble Capa ⏳
Validación Staff (rol Staff):
* Horario laboral.
* Eventos bloqueantes en Google Calendar.
* Validación Recurso:
* Disponibilidad de estación física.
* Asignación automática con prioridad (mkup > lshs > pedi > mani).
* Regla de prioridad dinámica entre Staff y Artist.
* Implementar función de disponibilidad con parámetros:
* `location_id`
* `start_time_utc`
* `end_time_utc`
* `service_id` (opcional)

**Output:**
* ⏳ Algoritmo de disponibilidad.
* ⏳ Tests de colisión y concurrencia.
* ⏳ Documentación de algoritmo.

---

### 2.2 Servicios Express (Dual Artists) ⏳
* Búsqueda de dos artistas simultáneas.
* Bloqueo del recurso principal requerido (rooms only).
* Aplicación automática de Premium Fee.
* Lógica de booking dual.
* Casos de prueba.
* Actualización de RLS para servicios express.

**Output:**
* ⏳ Lógica de booking dual.
* ⏳ Casos de prueba.
* ⏳ Actualización de RLS para servicios express.

---

### 2.3 Google Calendar Sync ⏳
* Integración vía Service Account.
* Sincronización bidireccional.
* Manejo de conflictos.
* Sync de:
* Bookings de staff
* Bloqueos de agenda
* No-shows

**Output:**
* ⏳ Servicio de sincronización.
* ⏳ Logs de errores.
* ⏳ Webhook para updates de calendar.

---

## FASE 3 — Pagos y Protección (PENDIENTE)

### 3.1 Stripe — Depósitos Dinámicos ⏳
* Regla $200 vs 50% según día.
* Asociación pago ↔ booking (UUID interno, Short ID visible).
* Webhooks para:
* payment_intent.succeeded
* payment_intent.payment_failed
* charge.refunded
* Validación de pagos.
* Función de cálculo de depósito.

**Output:**
* ⏳ Webhooks Stripe.
* ⏳ Validación de pagos.
* ⏳ Función de cálculo de depósito.

---

### 3.2 No-Show Logic ⏳
* Ventana de cancelación 12h (UTC).
* Penalización automática:
* Marcar booking como `no_show`
* Retener depósito
* Notificar a cliente
* Override Admin.
* ✅ Auditoría en `audit_logs` (ya implementada).
* ⏳ Notificaciones por email/SMS.

**Output:**
* ⏳ Función de penalización.
* ⏳ Notificaciones por email/SMS.

---

## FASE 4 — HQ Dashboard (PENDIENTE)

### 4.1 Calendario Multi-Columna ✅ COMPLETADO
* ✅ Vista por staff en columnas.
* ✅ Bloques de 15 minutos con horarios de negocio.
* ✅ Componente visual de citas con colores por estado.
* ✅ API `/api/aperture/calendar` para datos del calendario.
* ✅ API `/api/aperture/bookings/[id]/reschedule` para reprogramación.
* ✅ Filtros por staff (ubicación próximamente).
* ⏳ Drag & drop para reprogramar (framework listo, lógica pendiente).
* ⏳ Validación de colisiones completa.

**Output:**
* ⏳ Componente de calendario.
* ⏳ Lógica de reprogramación.
* ⏳ Validación de colisiones.

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

## FASE 5 — Automatización y Lanzamiento (PENDIENTE)

### 5.1 Notificaciones ⏳
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
- ❌ API para estadísticas (/api/aperture/stats) - FALTA IMPLEMENTAR
  - ✅ Autenticación de admin/staff/manager (Supabase Auth completo)
  - ⏳ Gestión completa de staff (CRUD, horarios)
  - ⏳ Gestión de recursos y asignación

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

4. **Actualizar documentación con especificaciones técnicas completas** - ~4 horas
   - Crear documento de especificaciones técnicas (`docs/APERATURE_SPECS.md`)
   - Documentar respuesta a horas trabajadas (automático desde bookings)
   - Definir estructura de POS completa
   - Documentar sistema de múltiples cajeros

5. **Actualizar APERTURE_SQUARE_UI.md con Radix UI** - ~1.5 horas
   - Agregar sección "Stack Técnico"
   - Documentar componentes Radix UI específicos
   - Ejemplos de uso de Radix con estilizado Square UI
   - Guía de accesibilidad Radix (ARIA attributes, keyboard navigation)

6. **Actualizar API.md con rutas implementadas** - ~1 hora
   - Rutas a agregar que existen pero NO están en API.md:
     - `GET /api/availability/blocks`
     - `GET /api/public/availability`
     - `POST /api/availability/staff`
     - `POST /api/kiosk/walkin`

### 🟢 MEDIA - Componentes y Features (Timeline: 4-6 semanas restantes)

7. **Rediseñar Aperture completo con Radix UI** - ~136-171 horas
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
   - **FASE 7**: Marketing y Configuración (~10-15 horas)
     - Campañas (promociones masivas Email/WhatsApp)
     - Precios Inteligentes (configurables por servicio, aplicables ambos canales)
     - Integraciones Placeholder (Google, Instagram/FB Shopping) - Good to have, no priority
     - APIs: `/api/aperture/campaigns`, `/api/aperture/pricing`, `/api/aperture/integrations`

### 🟢 BAJA - Integraciones Pendientes (Timeline: 1-2 meses)

8. **Implementar Google Calendar Sync** - ~6-8 horas
    - Sincronización bidireccional
    - Manejo de conflictos
    - Webhook para updates de calendar

9. **Implementar Notificaciones WhatsApp** - ~4-6 horas
    - Integración con Twilio/Meta WhatsApp API
    - Templates de mensajes (confirmación, recordatorios, alertas no-show)
    - Sistema de envío programado

10. **Implementar Recibos digitales** - ~3-4 horas
    - Generador de PDFs
    - Sistema de emails (SendGrid, AWS SES, etc.)
    - Dashboard de transacciones

11. **Crear Landing page Believers** - ~4-5 horas
    - Página pública de booking
    - Calendario simplificado para clientes
    - Captura de datos básicos

12. **Implementar Tests Unitarios** - ~5-7 horas
    - Unit tests para generador de Short ID
    - Tests para disponibilidad

13. **Archivos SEO** - ~30 min
    - `public/robots.txt`
    - `public/sitemap.xml`

14. **Calendario - Funcionalidades Avanzadas** - ~8-10 horas (Próximas)
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

## REGLA FINAL

Si una tarea no está aquí, no existe. Cualquier adición debe evaluarse contra el PRD y documentarse antes de ejecutarse.
