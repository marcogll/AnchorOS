# PRD — AnchorOS

**Codename: Adela**

## 1. Objetivo

AnchorOS es un sistema operativo para salones de belleza orientado a agenda, pagos, membresías e invitados, con reglas estrictas de tiempo, seguridad y automatización.

---

## 2. Principios del Sistema

* UTC-first en todo el backend.
* UUID como identificador primario interno.
* Short ID solo para referencia humana.
* Automatismos auditables.
* PRD como única fuente de verdad.

---

## 3. Roles y Membresías

### 3.1 Tiers

* Free
* Gold

### 3.2 Tier Gold — Beneficios

* Acceso prioritario a agenda.
* Beneficios financieros definidos en pricing.
* Invitaciones semanales.

### 3.3 Ecosistema de Exclusividad (Invitaciones)

* Cada cuenta Tier Gold tiene **5 invitaciones semanales**.
* Las invitaciones **se resetean cada semana** (Lunes 00:00 UTC).
* El reseteo es automático mediante:

  * Supabase Edge Function **o**
  * Cron Job externo.
* El proceso debe ser:

  * Idempotente.
  * Auditado en `audit_logs`.

### 3.4 Jerarquía de Roles

* **Admin**: Acceso total. Puede ver PII de clientes y hacer ajustes.
* **Manager**: Acceso operacional. Puede ver PII de clientes y hacer ajustes.
* **Staff**: Nivel de coordinación. Puede ver PII de clientes y hacer ajustes.
* **Artist**: Nivel de ejecución. **Solo puede ver nombre y notas** del cliente. No ve email ni phone.
* **Customer**: Nivel más bajo. Solo puede ver sus propios datos.

---

## 4. Gestión de Tiempo y Zonas Horarias

* **Todos los timestamps se almacenan en UTC**.
* `locations.timezone` define la zona local del salón.
* Conversión a hora local:

  * Solo en frontend.
  * Solo en notificaciones (WhatsApp / Email).
* Backend, reglas de negocio y validaciones **operan exclusivamente en UTC**.

---

## 5. Agenda y Bookings

### 5.1 Identificadores

* Cada booking tiene:

  * `id` (UUID, primario).
  * `short_id` (6 caracteres alfanuméricos).

### 5.2 Short ID — Reglas

* Se genera antes de persistir el booking.
* Debe verificarse unicidad.
* Si existe colisión:

  * Reintentar generación hasta ser único.
* El Short ID:

  * Es referencia de pago.
  * Es identificador operativo.
  * **No sustituye** el UUID.

---

## 6. Pagos

* Stripe como proveedor principal.
* El Short ID se utiliza como referencia visible.
* UUID se mantiene interno.

---

## 7. Auditoría

* Toda acción automática o crítica debe registrarse en `audit_logs`.
* Incluye:

  * Reseteo de invitaciones.
  * Cambios de estado de bookings.
  * Eventos de pago.

---

## 8. Límites de los Agentes de IA

* Ningún agente puede modificar reglas aquí descritas.
* Toda implementación debe alinearse estrictamente a este PRD.

---

## 9. Estado del Documento

Este PRD es la fuente única de verdad funcional del sistema AnchorOS.
