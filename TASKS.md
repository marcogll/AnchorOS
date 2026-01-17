# TASKS.md — Plan de Ejecución por Fases

Este documento define las tareas ejecutables del proyecto **AnchorOS**, alineadas estrictamente con el PRD. Ninguna tarea puede introducir lógica no documentada.

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

### 4.1 Calendario Multi-Columna ⏳
* Vista por staff.
* Bloques de 15 minutos.
* Drag & drop para reprogramar.
* Filtros por location y resource type.
* Validación de colisiones.
* Lógica de reprogramación.

**Output:**
* ⏳ Componente de calendario.
* ⏳ Lógica de reprogramación.
* ⏳ Validación de colisiones.

---

### 4.2 Gestión Operativa ⏳
* Recursos físicos:
* Agregar/editar/eliminar recursos.
* Ver disponibilidad en tiempo real.
* Staff:
* CRUD completo.
* Asignación a locations.
* Manejo de horarios.
* Traspaso entre sucursales:
* Transferencia de bookings.
* Reasignación de staff.
* Función de traspaso de bookings.

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
- HQ Dashboard con calendario multi-columna
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
- 🚧 The Boutique - Frontend de reservas (booking.anchor23.mx)
  - ✅ Página de selección de servicios (/booking/servicios)
  - ✅ Página de confirmación de reserva (/booking/cita)
  - ✅ Página de confirmación por código (/booking/confirmacion)
  - ✅ Layout específico con navbar personalizado
  - ✅ API para obtener servicios (/api/services)
  - ✅ API para obtener ubicaciones (/api/locations)
  - ⏳ Configuración de dominios wildcard en producción
  - ⏳ Autenticación de clientes
  - ⏳ Integración con Stripe

- 🚧 Aperture - Backend para staff/manager/admin (aperture.anchor23.mx)
  - ✅ API para obtener staff disponible (/api/aperture/staff)
  - ✅ API para gestión de horarios (/api/aperture/staff/schedule)
  - ✅ API para recursos (/api/aperture/resources)
  - ✅ API para dashboard (/api/aperture/dashboard)
  - ✅ Página principal de admin (/aperture)
  - ⏳ Autenticación de admin/staff/manager
  - ⏳ Gestión completa de staff
  - ⏳ Gestión de recursos y asignación

### ⏳ Pendiente
- ⏳ Implementar API pública (api.anchor23.mx) - Horarios, servicios, ubicaciones públicas
- ⏳ Implementar autenticación para staff/manager/admin (Supabase Auth)
- ⏳ Implementar sistema completo de asignación de disponibilidad
- ⏳ Integración con Google Calendar
- ⏳ Integración con Stripe (pagos y depósitos dinámicos)
- ⏳ The Vault (storage de fotos privadas)
- ⏳ Notificaciones y automatización (WhatsApp API)
- ⏳ Autenticación de clientes en The Boutique
- ⏳ Testing completo de todos los flujos

---

## PRÓXIMAS TARES PRIORITARIAS

### Prioridad Alta - Esta Semana (Timeline: 7 días)

1. **Terminar The Boutique (booking.anchor23.mx)** - 3-4 días
   - Implementar autenticación de clientes (depende de: Supabase Auth configurado)
   - Completar flujo de reserva (depende de: auth implementado)
   - Integrar con sistema de pagos (Stripe) (depende de: webhooks Stripe)
   - Testing completo del flujo (depende de: integración completa)

2. **Completar Aperture (aperture.anchor23.mx)** - 4-5 días
   - Implementar autenticación de admin/staff/manager (depende de: Supabase Auth)
   - Gestión completa de staff (CRUD, horarios) (depende de: auth implementado, APIs existentes)
   - Gestión de recursos y asignación (depende de: staff gestión)
   - Dashboard operativo completo (depende de: gestión implementada)
   - Testing de APIs (depende de: todas las funciones)

3. **Configurar Kioskos en Producción** - 1-2 días
   - Crear kioskos para cada location (depende de: migraciones en prod)
   - Configurar API keys en variables de entorno (depende de: env setup)
   - Probar acceso desde pantalla táctil (depende de: kioskos creados)
   - Usar el sistema de enrollment en `/admin/enrollment` (depende de: admin auth)

### Prioridad Media - Próximas 2 Semanas (Timeline: 14 días)

4. **Implementar API Pública (api.anchor23.mx)** - 3-4 días
   - Horarios de operación públicos (depende de: locations table)
   - Lista de servicios disponibles (depende de: services table, RLS público)
   - Ubicaciones y contacto (depende de: locations table)
   - Información sin datos sensibles (depende de: RLS configurado)

5. **Sistema de Autenticación Completo** - 5-7 días
   - Supabase Auth para staff/admin (depende de: roles configurados)
   - Perfiles de cliente en The Boutique (depende de: auth cliente)
   - Gestión de sesiones (depende de: Supabase Auth completo)

6. **Integración con Stripe** - 4-5 días
   - Webhooks para pagos (depende de: Stripe account, endpoints)
   - Depósitos dinámicos ($200 vs 50%) (depende de: webhooks)
   - Lógica de no-show y penalizaciones (depende de: webhooks, bookings logic)

### Prioridad Baja - Próximo Mes (Timeline: 30 días)

7. **Documentar nuevos endpoints y configuración** - 7-10 días
   - API docs para aperture.anchor23.mx (depende de: APIs completas)
   - API docs para api.anchor23.mx (depende de: API pública implementada)
   - Configuración de dominios wildcard (depende de: dominio setup)
   - Guías de despliegue y testing (depende de: sistema completo)

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
