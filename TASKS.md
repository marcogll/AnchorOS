# TASKS.md — Plan de Ejecución por Fases

Este documento define las tareas ejecutables del proyecto **SalonOS**, alineadas estrictamente con el PRD. Ninguna tarea puede introducir lógica no documentada.

---

## Convenciones

* Cada tarea produce artefactos verificables (código, migraciones, tests, documentación).
* Las reglas de negocio viven en backend.
* Todo automatismo debe ser auditable.
* Ningún agente redefine alcance.

---

## FASE 1 — Cimientos y CRM

### 1.1 Infraestructura Base

* Crear proyecto Supabase.
* Configurar Auth (Magic Links Email/SMS).
* Definir roles: Admin / Manager / Staff / Artist / Customer.
* Configurar RLS base por rol (Artist NO ve email/phone de customers).

**Output:**

* Proyecto Supabase operativo.
* Policies iniciales documentadas.

---

### 1.2 Esquema de Base de Datos Inicial

Tablas obligatorias:

* locations (incluye timezone)
* resources
* staff
* services
* customers
* invitations
* bookings
* audit_logs

Tareas:

* Definir migraciones SQL versionadas.
* Claves foráneas y constraints.
* Campos de auditoría (`created_at`, `updated_at`).

**Output:**

* Migraciones SQL.
* Diagrama lógico.

---

### 1.3 Short ID & Invitaciones

* Implementar generador de Short ID (6 chars, collision-safe).
* Validación de unicidad antes de persistir booking.
* Generador y validación de códigos de invitación.
* Lógica de cuotas semanales por Tier.
* Reseteo automático de invitaciones cada semana (Lunes 00:00 UTC).

**Output:**

* Funciones backend.
* Tests unitarios.
* Registros en `audit_logs`.

---

### 1.4 CRM Base (Customers)

* Cálculo automático de Tier.
* Tracking de referidos.
* Perfil privado de cliente.

**Output:**

* Endpoints CRUD.
* Policies RLS por rol.

---

## FASE 2 — Motor de Agendamiento

### 2.1 Disponibilidad Doble Capa

* Validación Staff (rol Staff):

  * Horario laboral.
  * Eventos bloqueantes en Google Calendar.

* Validación Recurso:

  * Disponibilidad de estación física.

* Regla de prioridad dinámica entre Staff y Artist.

* Validación Recurso:

  * Disponibilidad de estación física.

* Regla de prioridad dinámica.

**Output:**

* Algoritmo de disponibilidad.
* Tests de colisión y concurrencia.

---

### 2.2 Servicios Express (Dual Artists)

* Búsqueda de dos artists simultáneas.
* Bloqueo del recurso principal requerido.
* Aplicación automática de Premium Fee.

**Output:**

* Lógica de booking dual.
* Casos de prueba.

---

### 2.3 Google Calendar Sync

* Integración vía Service Account.
* Sincronización bidireccional.
* Manejo de conflictos.

**Output:**

* Servicio de sincronización.
* Logs de errores.

---

## FASE 3 — Pagos y Protección

### 3.1 Stripe — Depósitos Dinámicos

* Regla $200 vs 50% según día.
* Asociación pago ↔ booking (UUID interno, Short ID visible).

**Output:**

* Webhooks Stripe.
* Validación de pagos.

---

### 3.2 No-Show Logic

* Ventana de cancelación 12h (UTC).
* Penalización automática.
* Override Admin.

**Output:**

* Función de penalización.
* Auditoría en `audit_logs`.

---

## FASE 4 — HQ Dashboard

### 4.1 Calendario Multi-Columna

* Vista por staff.
* Bloques de 15 minutos.

---

### 4.2 Gestión Operativa

* Recursos físicos.
* Staff.
* Traspaso entre sucursales.

---

### 4.3 The Vault

* Upload de fotos privadas.
* Formularios técnicos.

---

## FASE 5 — Automatización y Lanzamiento

* Confirmaciones por WhatsApp.
* Recibos digitales.
* Landing Page Believers.

---

## Regla Final

Si una tarea no está aquí, no existe. Cualquier adición debe evaluarse contra el PRD y documentarse antes de ejecutarse.
