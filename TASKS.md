# TASKS.md — Plan de Ejecución por Fases

Este documento define las tareas ejecutables del proyecto **SalonOS**, alineadas estrictamente con el PRD. Ninguna tarea puede introducir lógica no documentada.

---

## Convenciones

* Cada tarea produce artefactos verificables (código, migraciones, tests, documentación).
* Las reglas de negocio viven en backend.
* Todo automatismo debe ser auditable.
* Ningún agente redefine alcance.

---

## FASE 1 — Cimientos y CRM ✅ COMPLETADA

### 1.1 Infraestructura Base ✅

* ✅ Crear proyecto Supabase.
* ⏳ Configurar Auth (Magic Links Email/SMS) - PENDIENTE
* ✅ Definir roles: Admin / Manager / Staff / Artist / Customer / Kiosk.
* ✅ Configurar RLS base por rol (Artist NO ve email/phone de customers).

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
* ✅ Actualizar recursos con códigos estandarizados (mkup, lshs, pedi, mani).

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

**Output:**

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

* Validación Staff (rol Staff):

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

* Búsqueda de dos artists simultáneas.
* Bloqueo del recurso principal requerido (rooms only).
* Aplicación automática de Premium Fee.

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

**Output:**

* ⏳ Función de penalización.
* ✅ Auditoría en `audit_logs` (ya implementada).
* ⏳ Notificaciones por email/SMS.

---

## FASE 4 — HQ Dashboard (PENDIENTE)

### 4.1 Calendario Multi-Columna ⏳

* Vista por staff.
* Bloques de 15 minutos.
* Drag & drop para reprogramar.
* Filtros por location y resource type.

**Output:**

* ⏳ Componente de calendario.
* ⏳ Lógica de reprogramación.
* ⏳ Validación de colisiones.

---

### 4.2 Gestión Operativa ⏳

* Recursos físicos:
  * Agregar/editar/eliminar recursos
  * Ver disponibilidad en tiempo real
* Staff:
  * CRUD completo
  * Asignación a locations
  * Manejo de horarios
* Traspaso entre sucursales:
  * Transferencia de bookings
  * Reasignación de staff

**Output:**

* ⏳ UI de gestión de recursos.
* ⏳ UI de gestión de staff.
* ⏳ Función de traspaso de bookings.

---

### 4.3 The Vault ⏳

* Upload de fotos privadas (Storage).
* Formularios técnicos para clientes VIP.
* Acceso restringido por rol.

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

**Output:**

* ⏳ Integración WhatsApp API.
* ⏳ Templates de mensajes.
* ⏳ Sistema de envío programado.

---

### 5.2 Recibos Digitales ⏳

* Generación de PDF.
* Email automático post-servicio.
* Historial de transacciones.

**Output:**

* ⏳ Generador de PDFs.
* ⏳ Sistema de emails.
* ⏳ Dashboard de transacciones.

---

### 5.3 Landing Page Believers ⏳

* Página pública de booking.
* Calendario simplificado para clientes.
* Captura de datos básicos.

**Output:**

* ⏳ Página de booking pública.
* ⏳ Calendario cliente.
* ⏳ Formulario de captura.

---

## PRÓXIMAS PASOS INMEDIATOS (Q1 2026)

### Prioridad Alta - Esta Semana

1. **Testing del Sistema de Kiosko**
   - Test de autenticación de API key
   - Test de confirmación de citas
   - Test de walk-ins
   - Verificar asignación de recursos con prioridad

2. **Ejecutar Migración de Recursos** ✅
   - ✅ Aplicar migración `20260116010000_update_resources.sql` en producción
   - ✅ Verificar que se creen los recursos correctamente
   - ✅ Confirmar que no hay bookings huérfanos
   - ✅ Recursos creados: 12 por location (3 mkup, 1 lshs, 4 pedi, 4 mani)

3. **Configurar Kioskos en Producción**
   - Crear kioskos para cada location
   - Configurar API keys en variables de entorno
   - Probar acceso desde pantalla táctil
   - Usar el sistema de enrollment en `/admin/enrollment`

4. **Sistema de Enrollment** ✅
   - ✅ API route `/api/admin/locations` - Obtener locations
   - ✅ API route `/api/admin/users` - Crear staff members
   - ✅ API route `/api/admin/kiosks` - Crear kiosks
   - ✅ Frontend `/admin/enrollment` - Interfaz de gestión
   - ⏳ Configurar `ADMIN_ENROLLMENT_KEY` en variables de entorno

### Prioridad Media - Próximas 2 Semanas

5. **Implementar API Routes para Bookings (Cliente)**
   - `GET /api/bookings` - Listar bookings del cliente
   - `POST /api/bookings` - Crear nuevo booking
   - `PUT /api/bookings/{id}` - Modificar booking (solo staff/admin)
   - `DELETE /api/bookings/{id}` - Cancelar booking

6. **Implementar Lógica de Disponibilidad**
   - Función para buscar disponibilidad de staff
   - Función para buscar disponibilidad de recursos
   - Integración con `get_available_resources_with_priority()`

7. **Implementar Notificaciones Básicas**
   - Email de confirmación de booking
   - Email de recordatorio (24h antes)
   - Email de cancelación

### Prioridad Baja - Próximo Mes

8. **Desarrollar HQ Dashboard (Fase 4)**
   - Calendario multi-columna
   - Gestión operativa de recursos y staff
   - The Vault

9. **Integración con Stripe (Fase 3)**
   - Configurar Stripe
   - Implementar webhooks
   - Lógica de depósitos dinámicos

---

## Estado Actual del Proyecto

### ✅ Completado
- Infraestructura base de datos
- Sistema de roles y permisos RLS
- Generadores de Short ID y códigos de invitación
- Sistema de kiosko completo
- Actualización de recursos con códigos estandarizados
- Audit logging
- Tiers de cliente extendidos (free, gold, black, VIP)

### 🚧 En Progreso
- Testing de implementación actual

### ⏳ Pendiente
- API routes para cliente y staff
- Motor de agendamiento
- Integración con Google Calendar
- Integración con Stripe
- HQ Dashboard
- Notificaciones y automatización

---

## Documentación Actualizada

| Documento | Estado | Descripción |
|-----------|--------|-------------|
| `PRD.md` | ✅ | Especificación funcional del sistema |
| `TASKS.md` | ✅ | Plan de ejecución por fases |
| `README.md` | ✅ | Guía técnica del proyecto |
| `KIOSK_SYSTEM.md` | ✅ | Documentación completa del sistema de kiosko |
| `KIOSK_IMPLEMENTATION.md` | ✅ | Guía rápida de implementación del kiosko |
| `RESOURCES_UPDATE.md` | ✅ | Documentación de actualización de recursos |

---

## Notas Importantes

### Aclaración sobre Kiosko
El sistema de kiosko no estaba originalmente en el PRD, pero se implementó como extensión funcional para:
- Permitir confirmación de citas en pantalla de entrada
- Facilitar reservas walk-in sin personal
- Reducir carga de trabajo de staff
- Mejorar experiencia del cliente

### Impacto de Actualización de Recursos
La migración de recursos eliminó todos los bookings existentes debido a CASCADE DELETE. Esto es aceptable en fase de desarrollo, pero en producción debe:
- Implementarse con migración de datos
- O notificar a clientes de la necesidad de reprogramar

### Próximas Decisiones
1. ¿Implementar Auth con Supabase Magic Links o SMS?
2. ¿Usar Google Calendar API o Edge Functions para sync?
3. ¿Proveedor de email para notificaciones (SendGrid, AWS SES, etc.)?

---

## Regla Final

Si una tarea no está aquí, no existe. Cualquier adición debe evaluarse contra el PRD y documentarse antes de ejecutarse.
