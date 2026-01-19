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
* Black
* VIP

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
* **Kiosk**: Acceso limitado para dispositivos táctiles. No puede acceder a PII de clientes.
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

* Stripe como proveedor principal con webhooks para eventos de pago.
* El Short ID se utiliza como referencia visible para clientes.
* UUID se mantiene interno para integridad de datos.
* Lógica de depósitos dinámicos: $200 fijo vs 50% del servicio según timing.
* Sistema automático de penalizaciones por no-show con posibilidad de waivers.
* Soporte para múltiples métodos de pago en POS (efectivo, tarjeta, transferencias, giftcards, membresías).

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

Este PRD es la fuente única de verdad funcional del sistema AnchorOS y refleja el estado actual de implementación.

---

## 10. Tecnologías Utilizadas

### Frontend
- **Next.js 14** (App Router) con React 18 y TypeScript
- **Tailwind CSS** para estilos
- **Radix UI** para componentes accesibles
- **Framer Motion** para animaciones
- **React Hook Form + Zod** para validación de formularios
- **date-fns + date-fns-tz** para manejo de fechas
- **DnD Kit** para drag & drop

### Backend e Infraestructura
- **Supabase** (PostgreSQL + Auth + RLS + Storage)
- **Stripe** para procesamiento de pagos
- **Google APIs** para integración de calendario
- **Resend** para envío de emails
- **Formbricks** para feedback de usuarios

### Desarrollo
- **ESLint** para linting
- **PostCSS + Autoprefixer** para CSS
- **html2canvas + jsPDF** para generación de PDFs

---

## 11. Arquitectura del Sistema

AnchorOS implementa una arquitectura multi-dominio para separación clara de responsabilidades:

- **anchor23.mx**: Portal administrativo principal
- **booking.anchor23.mx**: Sistema de reservas públicas
- **aperture.anchor23.mx**: Dashboard operativo (Aperture HQ)
- **kiosk.anchor23.mx**: Sistema de quioscos táctiles

### Base de Datos
- **15+ tablas** con relaciones normalizadas
- **RLS policies** estrictas para control de acceso
- **UUIDs primarios** con Short IDs para referencias humanas
- **Auditoría completa** en `audit_logs`

---

## 12. Funcionalidades Implementadas

### Sistema de Quioscos
- Autenticación por API keys de 64 caracteres
- Creación de reservas walk-in con asignación inteligente
- Interfaz touch-friendly optimizada
- Restricciones de PII (no acceso a datos personales)

### Motor de Disponibilidad
- Asignación prioritaria: makeup > lashes > pedicure > manicure
- Detección de conflictos de recursos
- Soporte para servicios duales
- Sincronización con Google Calendar

### Gestión de Membresías Avanzada
- **Free**: Acceso básico
- **Gold**: Prioridad en agenda, 5 invitaciones semanales, beneficios financieros
- **Black**: Beneficios premium adicionales
- **VIP**: Acceso completo incluyendo galería privada

### Sistema de Pagos Completo
- Webhooks de Stripe para eventos de pago
- Lógica automática de no-shows
- Sistema de waivers para penalizaciones
- Múltiples métodos de pago en POS

### Dashboard Operativo (Aperture HQ)
- KPIs en tiempo real (ventas, reservas, clientes)
- Calendario maestro multi-columna
- Gestión completa de staff y recursos
- Reportes financieros y operativos

---

## 13. Estado Actual del Proyecto

**Nivel de Completitud: ~95%**

### Fortalezas
- Arquitectura sólida con separación clara de dominios
- Seguridad de primer nivel con RLS y auditoría completa
- Núcleo listo para producción (pagos, reservas, dashboards)
- Diseño escalable con soporte multi-ubicación
- Documentación exhaustiva (80+ archivos con JSDoc)

### Calidad Técnica
- Código bien estructurado con TypeScript
- Pruebas automatizadas en proceso
- Integraciones robustas (Stripe, Google Calendar)
- UI/UX optimizada para diferentes dispositivos

---

## 14. Trabajo Pendiente (5%)

### Mejoras en Calendar Maestro
- Redimensionamiento de bloques
- Creación de reservas desde slots vacíos
- Vistas semanales/mensuales adicionales

### The Vault (Opcional)
- Almacenamiento privado de fotos para clientes VIP

### Transferencias Cross-Location (Opcional)
- Movimiento de staff entre ubicaciones

---

## 15. Fases Futuras

### Fase 7: Automatización y Lanzamiento
- Notificaciones WhatsApp (confirmaciones, recordatorios, no-shows)
- Recibos digitales por email
- Landing page pública para adquisición de clientes
- Optimización SEO (robots.txt, sitemap.xml)

### Fase 8: Características Avanzadas
- Sincronización completa de Google Calendar
- Campañas de marketing (emails/WhatsApp masivos)
- Precios dinámicos basados en tiempo
- Integraciones externas (Instagram/Facebook shopping)

---

## 16. Validación y Testing

### Pruebas Unitarias
- Generador de Short IDs
- Funciones de disponibilidad
- Lógica de asignación de recursos

### Pruebas de Integración
- Flujos completos de reserva
- Procesamiento de pagos
- Sincronización de calendario

### Validación en Producción
- Testing de migración en entorno live
- Validación de rendimiento con carga real

---

## 17. Roadmap de Desarrollo

### Fase 1: Infraestructura Core ✅
- [x] Configurar estructura del proyecto con timestamps UTC en backend
- [x] Implementar UUID como claves primarias para todas las entidades
- [x] Agregar generación de Short ID con verificación de unicidad
- [x] Crear control de acceso basado en roles (Admin, Manager, Staff, Artist, Customer, Kiosk)
- [x] Implementar manejo de zonas horarias (UTC en backend, local en frontend)
- [x] Agregar logging de auditoría para acciones automáticas

### Fase 2: Sistema de Bookings y Agenda ✅
- [x] Construir sistema de bookings con funcionalidad de agenda
- [x] Implementar motor de disponibilidad con asignación inteligente de recursos
- [x] Integrar Google Calendar para sincronización bidireccional
- [x] Soporte para servicios de doble capacidad (2 artistas)

### Fase 3: Sistema de Pagos ✅
- [x] Integrar pagos con Stripe usando short ID como referencia
- [x] Implementar lógica de depósitos dinámicos ($200 vs 50%)
- [x] Sistema de penalizaciones por no-show con waivers

### Fase 4: Dashboard Aperture HQ (95% completado)
- [x] Dashboard principal con KPIs y métricas operativas
- [x] Calendar Maestro con vista multi-columna y drag & drop
- [x] Gestión de staff y recursos (CRUD completo)
- [x] Sistema de comisiones y nómina
- [x] Reportes diarios de cierre (PDF)
- [ ] Mejoras menores en calendario (resize, creación desde slots vacíos)

### Fase 5: Gestión de Clientes y Lealtad ✅
- [x] Crear niveles de membresía (Free, Gold, Black, VIP) con beneficios
- [x] Sistema CRM con búsqueda fonética y notas técnicas
- [x] Implementar sistema de invitaciones para tier Gold (5 semanales, reseteables)
- [x] Sistema de puntos de lealtad independientes de tiers
- [x] Galería de fotos restringida a tiers premium

### Fase 6: Finanzas y Reportes ✅
- [x] Sistema POS con múltiples métodos de pago
- [x] Reportes de rendimiento por staff
- [x] Seguimiento de gastos operativos
- [x] Analytics financieros (ingresos, gastos, utilidades)

