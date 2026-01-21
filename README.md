# 🥂 AnchorOS

**Exclusive Studio Management & CRM Engine**  
**Codename: Adela**
Repositorio principal del sistema AnchorOS.

Este README es la puerta de entrada técnica al proyecto. Define qué es este repositorio, cómo se estructura y cómo debe ser utilizado por desarrollo, producto y operación.

---

## 1. ¿Qué es AnchorOS?

AnchorOS es un sistema propietario de gestión operativa y CRM diseñado para estudios de belleza de alta exclusividad. No es una agenda genérica: coordina **personas, recursos físicos, pagos, privilegios y datos** bajo reglas estrictas de control y privacidad.

El sistema está diseñado para:

* Optimizar el uso de estaciones físicas.
* Proteger la base de datos de clientes.
* Controlar el crecimiento mediante invitaciones.
* Garantizar rentabilidad en días de alta demanda.
* Facilitar la operativa mediante kioskos de autoservicio.

---

## 2. Alcance de este Repositorio

Este repositorio contiene:

* **anchor23.mx** - Frontend institucional (landing page + páginas informativas)
* **The Boutique** - Frontend de reserva para clientas (booking.anchor23.mx)
* **The HQ** - Dashboard administrativo y CRM interno
* **The Kiosk** - Sistema de autoservicio en pantalla táctil
* Lógica de negocio de agendamiento y disponibilidad
* Integraciones externas (Stripe, Google Calendar, WhatsApp)
* Esquema base de datos y políticas de seguridad

No contiene:

* Material de marketing digital.
* Operación manual del salón.
* Datos productivos.

---

## 3. Documentación Oficial

Este proyecto se rige por los siguientes documentos:

### Documentos Principales (Raíz)
* **[README.md](./README.md)** (este archivo) → Guía técnica y operativa del repo.
* **[TASKS.md](./TASKS.md)** → Plan de ejecución por fases y estado actual.

 ### Documentación Especializada (docs/)
 * **[docs/PRD.md](./docs/PRD.md)** → Definición de producto y reglas de negocio.
 * **[docs/API.md](./docs/API.md)** → Documentación completa de APIs y endpoints.
 * **[docs/STRIPE_SETUP.md](./docs/STRIPE_SETUP.md)** → Guía de integración de pagos con Stripe.
 * **[docs/site_requirements.md](./docs/site_requirements.md)** → Requisitos técnicos del proyecto.
 * **[docs/ANCHOR23_FRONTEND.md](./docs/ANCHOR23_FRONTEND.md)** → Documentación del frontend institucional.
 * **[docs/APERTURE_SQUARE_UI.md](./docs/APERTURE_SQUARE_UI.md)** → Guía de estilo Square UI para Aperture (HQ Dashboard).
 * **[docs/APERTURE_SPECS.md](./docs/APERTURE_SPECS.md)** → Especificaciones técnicas completas de Aperture.
 * **[docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md)** → Sistema de diseño completo para AnchorOS.
 * **[docs/DOMAIN_CONFIGURATION.md](./docs/DOMAIN_CONFIGURATION.md)** → Configuración de dominios y subdominios.
 * **[docs/KIOSK_SYSTEM.md](./docs/KIOSK_SYSTEM.md)** → Documentación completa del sistema de kiosko.
 * **[docs/KIOSK_IMPLEMENTATION.md](./docs/KIOSK_IMPLEMENTATION.md)** → Guía rápida de implementación del kiosko.
 * **[docs/ENROLLMENT_SYSTEM.md](./docs/ENROLLMENT_SYSTEM.md)** → Sistema de enrollment de kioskos.
 * **[docs/RESOURCES_UPDATE.md](./docs/RESOURCES_UPDATE.md)** → Documentación de actualización de recursos.
 * **[docs/OPERATIONAL_PROCEDURES.md](./docs/OPERATIONAL_PROCEDURES.md)** → Procedimientos operativos.
 * **[docs/STAFF_TRAINING.md](./docs/STAFF_TRAINING.md)** → Guía de capacitación del staff.
 * **[docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** → Guía de solución de problemas.
 * **[docs/CLIENT_ONBOARDING.md](./docs/CLIENT_ONBOARDING.md)** → Proceso de onboarding de clientes.
 * **[docs/PROJECT_UPDATE_JAN_2026.md](./docs/PROJECT_UPDATE_JAN_2026.md)** → Actualizaciones del proyecto Enero 2026.
 * **[docs/RECENT_FIXES_JAN_2026.md](./docs/RECENT_FIXES_JAN_2026.md)** → Correcciones recientes de calendario, horarios y disponibilidad.

El PRD es la fuente de verdad funcional. El README es la guía de ejecución.

---

## 4. Arquitectura General

### Dominios

* `anchor23.mx` - Frontend institucional (landing page + páginas informativas)
* `booking.anchor23.mx` - Frontend de reservas (The Boutique) - **En Progreso 90%**
* `kiosk.anchor23.mx` - Sistema de autoservicio (The Kiosk)
* `aperture.anchor23.mx` - Dashboard administrativo y CRM (The HQ) - **0% completado (redefinido)**
* `api.anchor23.mx` - API pública para integraciones externas

### Experiencias

* **The Boutique**: Frontend de reserva para clientas.
* **The HQ** (Aperture): Dashboard administrativo y CRM interno con 6 pantallas principales.
* **The Kiosk**: Sistema de autoservicio en pantalla táctil para confirmación de citas y walk-ins.

### Principios

* Security by Design.
* Exclusividad curada.
* Optimización de activos.
* Marca primero, sistema después.

---

## 5. Stack Tecnológico

* **Frontend**: Next.js 14 (App Router)
* **UI / Estilos**: Tailwind CSS + Radix UI + Square UI custom styling
* **Backend**: Supabase (PostgreSQL + Auth + RLS)
* **Pagos**: Stripe SDK
* **Calendario**: Google Calendar API v3 (Service Account)
* **Notificaciones**: WhatsApp API (Twilio / Meta)
* **Storage**: Supabase Storage (Buckets privados)

---

## 6. Estructura del Proyecto

```
/anchoros
├── app/                          # Next.js App Router
│   ├── (anchor23)/               # anchor23.mx - Frontend institucional
│   │   ├── page.tsx              # Landing page
│   │   ├── servicios/             # Página de servicios
│   │   ├── historia/              # Página de historia/filosofía
│   │   ├── contacto/              # Formulario de contacto
│   │   ├── franchises/           # Información de franquicias
│   │   ├── membresias/            # Membresías (Gold, Black, VIP)
│   │   ├── privacy-policy/        # Política de privacidad
│   │   └── legal/                # Términos y condiciones
│   ├── boutique/                  # booking.anchor23.mx - Frontend de reservas
│   │   ├── servicios/             # Selección de servicios
│   │   ├── cita/                 # Confirmación de reserva
│   │   └── confirmacion/          # Confirmación de reserva (pendiente)
│   ├── aperture/                   # aperture.anchor23.mx - Dashboard administrativo
│   │   ├── page.tsx                # Dashboard Home
│   │   ├── calendar/
│   │   │   └── page.tsx            # Calendario Maestro
│   │   ├── staff/
│   │   │   ├── page.tsx            # Gestión de Staff
│   │   │   └── payroll/
│   │   │       └── page.tsx        # Cálculo de Nómina
│   │   ├── clients/
│   │   │   ├── page.tsx            # CRM de Clientes
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx        # Perfil de Cliente
│   │   │   └── gallery/
│   │   │       └── page.tsx        # Galería de Fotos
│   │   ├── loyalty/
│   │   │   ├── page.tsx            # Sistema de Puntos
│   │   │   ├── memberships/
│   │   │   │   └── page.tsx        # Membresías
│   │   │   └── rewards/
│   │   │       └── page.tsx        # Recompensas
│   │   ├── pos/
│   │   │   ├── page.tsx            # Punto de Venta
│   │   │   └── checkout/
│   │   │       └── page.tsx        # Procesar cobro
│   │   ├── finance/
│   │   │   ├── page.tsx            # Finanzas
│   │   │   └── close-day/
│   │   │       └── page.tsx        # Cierre de Caja
│   │   └── admin/
│   │       └── settings/
│   │           └── page.tsx        # Marketing y Configuración
│   ├── hq/                         # Dashboard administrativo (antiguo, será reemplazado)
│   ├── kiosk/                    # kiosk.anchor23.mx - Sistema de autoservicio
│   └── api/                      # API routes
│       ├── kiosk/                 # Endpoints para kiosko
│       ├── bookings/               # Gestión de reservas
│       ├── services/               # API para obtener servicios
│       ├── locations/              # API para obtener ubicaciones
│       ├── availability/           # Sistema de disponibilidad
│       └── admin/                 # Endpoints administrativos
├── components/                    # Componentes UI reutilizables
│   ├── kiosk/                    # Componentes del sistema de kiosko
│   └── ui/                       # Componentes base (Button, Input, Card, etc.)
├── lib/                           # Lógica de negocio y helpers
│   ├── db/                        # Tipos TypeScript del esquema
│   └── utils/                     # Utilidades (short-id, etc.)
├── supabase/
│   └── migrations/                # Migraciones SQL versionadas
├── integrations/                   # Stripe, Google, WhatsApp
├── styles/             # Configuración Tailwind
└── docs/               # Documentación adicional
    ├── DOMAIN_CONFIGURATION.md    # Configuración de dominios y subdominios
    ├── KIOSK_SYSTEM.md           # Documentación completa del kiosko
    ├── KIOSK_IMPLEMENTATION.md   # Guía rápida de implementación
    └── RESOURCES_UPDATE.md      # Documentación de actualización de recursos
```

---

## 7. Requisitos de Entorno

 * Node.js 20+ (actualizado para compatibilidad con Supabase)
 * Cuenta Supabase
 * Cuenta Stripe
 * Proyecto Google Cloud (Calendar API)
 * Credenciales WhatsApp API

Variables de entorno obligatorias:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Google Calendar
GOOGLE_SERVICE_ACCOUNT_JSON=

# WhatsApp
WHATSAPP_API_KEY=

# Kiosko (opcional - para modo kiosko)
NEXT_PUBLIC_KIOSK_API_KEY=
```

---

## 8. Setup Local

1. Clonar el repositorio

```
git clone <repo-url>
cd anchoros
```

2. Instalar dependencias

```
npm install
```

3. Configurar variables de entorno

* Copiar `.env.template` a `.env.local` y configurar las variables requeridas.

4. Levantar entorno local

```
npm run dev
```

El sitio estará disponible en **http://localhost:2311**

---

## 9. Convenciones de Desarrollo

* El PRD define la lógica: no se improvisa comportamiento.
* Toda regla crítica debe vivir en backend.
* RLS obligatorio en todas las tablas sensibles.
* El frontend nunca expone datos privados del cliente.
* Cambios de alcance requieren actualización del PRD.

---

 ## 10. Estado del Proyecto

### Progreso General
- **FASE 1**: 100% ✅ Completada
- **FASE 2**: 100% ✅ Completada
- **FASE 3**: 100% ✅ Completada
- **FASE 4**: 100% ✅ COMPLETADA
- **FASE 5**: 100% ✅ Completada
- **FASE 6**: 100% ✅ Completada
- **FASE 7**: 5% ⏳ Pendiente

### Completado ✅
- ✅ Esquema de base de datos completo
- ✅ Sistema de roles y permisos RLS
- ✅ Generadores de Short ID y códigos de invitación
- ✅ Sistema de kiosko completo con enrollment
- ✅ API routes para kiosko
- ✅ Componentes UI para kiosko
- ✅ Actualización de recursos con códigos estandarizados
- ✅ Audit logging completo
- ✅ Tiers de cliente extendidos (free, gold, black, VIP)
- ✅ Sistema de disponibilidad (staff, recursos, bloques)
- ✅ API routes de disponibilidad
- ✅ API de reservas para clientes (POST/GET)
- ✅ HQ Dashboard completo (Aperture) - Calendario drag&drop, gestión staff/recursos
- ✅ API routes completas para Aperture (40+ endpoints con CRUD y validaciones)
- ✅ Calendario multi-columna con tiempo real y reprogramación automática
- ✅ Gestión operativa completa (staff CRUD, recursos con disponibilidad)
- ✅ Frontend institucional anchor23.mx completo (5 páginas principales)
- ✅ **COMENTARIOS AUDITABLES**: 80+ archivos con JSDoc para auditoría manual
- ✅ **SEGURIDAD**: RLS policies y validaciones documentadas en todo el código
  - Landing page con hero, fundamento, servicios, testimoniales
  - Página de servicios
  - Página de historia y filosofía
  - Página de contacto
  - Página de franquicias
  - Página de membresías (Gold, Black, VIP)
  - Páginas legales (Privacy Policy, Legal)
  - Header y footer globales

### En Progreso 🚧
- 🚧 The Boutique - Frontend de reservas (booking.anchor23.mx) - 90%
   - ✅ Página de selección de servicios (/booking/servicios)
   - ✅ Página de búsqueda de clientes (/booking/cita - paso 1)
   - ✅ Página de registro de clientes (/booking/registro)
   - ✅ Página de confirmación de reserva (/booking/cita - pasos 2-3)
   - ✅ Página de confirmación por código (/booking/confirmacion)
   - ✅ Layout específico con navbar personalizado
   - ✅ API para obtener servicios (/api/services)
   - ✅ API para obtener ubicaciones (/api/locations)
   - ✅ API para buscar clientes (/api/customers - GET)
   - ✅ API para registrar clientes (/api/customers - POST)
   - ✅ Sistema de horarios de negocio por ubicación
   - ✅ Componente de pagos mock para pruebas
   - ⏳ Configuración de dominios wildcard en producción
   - ⏳ Integración con Stripe real (webhooks)

- 🚧 Aperture - Dashboard administrativo (aperture.anchor23.mx) - 95% ✅
   - ✅ APIs completas para staff, recursos, calendario, dashboard
   - ✅ Calendario multi-columna con drag & drop y tiempo real
   - ✅ Gestión CRUD completa de staff y recursos
   - ✅ Componentes con Square UI design
   - ✅ Autenticación completa con middleware de protección
   - ✅ Comentarios auditables en todo el código
   - ⏳ Sistema de nómina y comisiones (próxima semana)
    - ✅ POS completo con múltiples métodos de pago
    - ✅ CRM avanzado con fidelización

- 🚧 Lógica de no-show y penalizaciones automáticas
- 🚧 Integración con Google Calendar (20% - en progreso)

 ### Pendiente ⏳
- ⏳ The Vault (storage de fotos privadas VIP/Black/Gold)
- ⏳ Notificaciones por WhatsApp
- ⏳ Recibos digitales por email
- ⏳ Landing page para believers (booking público)
- ⏳ Tests unitarios
  - ⏳ Archivos SEO (robots.txt, sitemap.xml)

 ### Correcciones Recientes ✅ (Enero 2026)
  - ✅ **Calendario Booking - Desfase de Días**: Corrección del DatePicker para alinear correctamente los días de la semana
    - Enero 1, 2026 ahora se muestra correctamente como Jueves
    - Se agregó cálculo de offset y celdas de padding
    - Commit: `dbac763`
  - ✅ **Horarios Disponibles - Solo 22:00-23:00**: Corrección de business hours y timezone
    - Ahora muestra horarios normales del salón (10:00-19:00)
    - Se mejoró la función get_detailed_availability con make_timestamp()
    - Migraciones: 20260118080000, 20260118090000
    - Commit: `35d5cd0`
  - ✅ **Página de Test Links**: Directorio centralizado de todas las páginas y APIs
    - 21 páginas implementadas agrupadas por dominio
    - 40+ API endpoints documentados con indicadores
    - Diseño responsive con grid layout y efectos hover
    - Commit: `09180ff`
  - ✅ **Documentación de Correcciones**: Documento completo con detalles técnicos
    - docs/RECENT_FIXES_JAN_2026.md con análisis de problemas y soluciones
    - Ejemplos de código antes/después
     - Validación y testing notes
     - Commit: `88ea79f`
   - ✅ **Calendario Aperture - Creación de Citas**: Nueva funcionalidad de crear citas desde slots vacíos
     - Click en slot vacío abre modal de creación de cita
     - Selección de cliente, servicio, ubicación y staff
     - Validación de disponibilidad antes de crear
     - API: `POST /api/bookings` para creación de citas
     - Actualización: 2026-01-21
   - ✅ **Fix check_staff_availability**: Corrección de llamadas a funciones auxiliares
     - Migración: 20260121000000_fix_staff_availability_function_calls.sql
     - Parámetros corregidos para check_staff_work_hours y check_calendar_blocking
     - Actualización: 2026-01-21
   - ✅ **Test Links Page**: Página centralizada con enlaces a todas las páginas y APIs del proyecto

 ### Fase Actual
**Fase 1 — Cimientos y CRM**: 100% completado
- Infraestructura base: 100%
- Esquema de base de datos: 100%
- Short ID & Invitaciones: 100%
- CRM Base: 100%
- Sistema de Kiosko: 100%
- Actualización de Recursos: 100%
- Sistema de Disponibilidad: 100%
- Frontend Institucional: 100%

**Fase 2 — Motor de Agendamiento**: 80% completado
- Disponibilidad dual capa: 100%
- API de reservas: 100%
- The Boutique: 90% (frontend completo, autenticación y pagos parcialmente implementados)
- Integración Pagos (Stripe): 90% (depósitos implementados, webhooks pendientes)
- Integración Calendar: 20% (en progreso)
- Aperture Backend: 100%

 **Fase 3 — Pagos y Protección**: 100% ✅ COMPLETADA
- Stripe depósitos dinámicos: 100%
- No-show logic: 100% (detección automática, penalización, check-in)
- Webhooks Stripe: 100% (payment_intent.succeeded, payment_failed, charge.refunded)

**Fase 4 — HQ Dashboard (APERTURE)**: 95% ✅ EN PROGRESO
- ✅ Dashboard Home (KPI Cards, Top Performers, Activity Feed completos)
- ✅ Calendario Maestro (Drag & Drop, filtros, tiempo real, conflictos)
- ✅ Gestión de Staff (CRUD completo con APIs y componentes)
- ✅ Gestión de Recursos (CRUD con disponibilidad en tiempo real)
- ✅ Autenticación completa con middleware de protección
- ✅ Comentarios auditables en todo el código (80+ archivos)
    - ✅ Nómina y comisiones (implementado con cálculos automáticos)
- ⏳ POS completo con múltiples métodos de pago
- ⏳ CRM avanzado con fidelización
    - ✅ CRM avanzado con fidelización completo
    - ✅ Finanzas y reportes implementados
    - ⏳ The Vault (storage de fotos privadas) - PENDIENTE

**Fase 5 — Clientes y Fidelización**: 100% ✅ COMPLETADA
- ✅ Client Management (CRM) con búsqueda fonética
- ✅ Sistema de Lealtad con puntos y expiración
- ✅ Membresías (Gold, Black, VIP) con beneficios
- ✅ Galería de fotos restringida por tier

**Fase 6 — Pagos y Protección**: 100% ✅ COMPLETADA
- ✅ Stripe Webhooks (payment_intent.succeeded, payment_failed, charge.refunded)
- ✅ No-Show Logic con detección automática y penalización
- ✅ Finanzas y Reportes (expenses, daily closing, staff performance)
- ✅ Check-in de clientes

**Fase 7 — Automatización y Lanzamiento**: 5% ⏳ PENDIENTE
- Notificaciones WhatsApp: 0% (variables configuradas, no implementado)
- Recibos digitales: 0% (pendiente)
- Landing page Believers: 0% (pendiente)

**Advertencia:** No apto para producción. Migraciones y seeds en evolución.

---

## 11. Aperture - HQ Dashboard

Aperture (aperture.anchor23.mx) es el dashboard administrativo y CRM interno de AnchorOS. Diseñado con estilo Square UI y construido con Radix UI + Tailwind CSS.

### Especificaciones Técnicas
- **Documento de estilo**: [docs/APERTURE_SQUARE_UI.md](docs/APERTURE_SQUARE_UI.md)
- **Sistema de diseño**: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)
- **Stack UI**: Radix UI + Tailwind CSS + Square UI custom styling

### Plan de Implementación
El plan completo de 7 fases está documentado en [TASKS.md](TASKS.md) con:
- Tiempos estimados: ~136-171 horas (~17-21 días hábiles)
- Estructura detallada de cada fase
- Sprint structure recomendado

### Pantallas Principales

#### 1. Dashboard Home (Vista Pájaro)
- KPI Cards (4): Ventas Totales, Comparativa Semanal, Citas Totales, Nuevos Clientes
- Gráfico de Rendimiento (líneas/áreas suaves)
- Tabla "Top Performers" (Staff y Servicios)
- Feed de Actividad Reciente (scroll infinito)

#### 2. Calendario Maestro (Agenda Dinámica)
- Estructura: Columnas por trabajador, filas por bloques de 15/30 min
- Drag & Drop (mover entre horas y trabajadores)
- Resize de bloques (incrementos de 15 min)
- Filtros dinámicos (Sucursal, Staff)
- Indicadores visuales (línea tiempo actual, bloqueos, tooltips)

#### 3. Miembros del Equipo y Nómina
- Gestión de Staff (CRUD con foto, rating, toggle activo)
- Configuración de Comisiones (% por servicio y producto)
- Cálculo de Nómina (Sueldo Base + Comisiones + Propinas)
- Calendario de Turnos (vista semanal)

#### 4. Clientes y Fidelización (Loyalty)
- CRM de Clientes (búsqueda fonética, histórico, notas técnicas)
- Galería de Fotos (SOLO VIP/Black/Gold) - Good to have: control de calidad
- Sistema de Membresías (planes, créditos)
- Sistema de Puntos (independiente de tiers, expiran después de X meses)

#### 5. Ventas, Pagos y Facturación
- POS (Punto de Venta) completo (puede crear nuevas citas + procesar pagos)
- Opciones de pago: Efectivo, Transferencia, Membership, Tarjeta, Giftcard, PIA
- NO imprimir recibos (enviar email o dashboard cliente)
- Cierre de Caja (resumen diario, PDF automático)
- Finanzas (gastos, margen neto)

#### 6. Marketing y Configuración
- Campañas (promociones masivas Email/WhatsApp)
- Precios Inteligentes (configurables por servicio, aplicables ambos canales)
- Integraciones Placeholder (Google, Instagram/FB Shopping) - Good to have, no priority

---

## 12. Test Links - Directorio de Páginas y APIs

Para facilitar el testing y navegación del proyecto, hemos creado una página centralizada con enlaces a todas las páginas y endpoints:

**🔗 [Test Links - /testlinks](/testlinks)**

Esta página proporciona:

### Páginas del Proyecto (21 páginas implementadas)

**anchor23.mx - Frontend Institucional:**
- `/` - Home (Landing page)
- `/servicios` - Página de servicios
- `/historia` - Historia y filosofía
- `/contacto` - Formulario de contacto
- `/franchises` - Información de franquicias
- `/membresias` - Membresías (Gold, Black, VIP)
- `/privacy-policy` - Política de privacidad
- `/legal` - Términos y condiciones

**booking.anchor23.mx - The Boutique (Frontend de Reservas):**
- `/booking/servicios` - Selección de servicios
- `/booking/cita` - Flujo de reserva
- `/booking/confirmacion` - Confirmación por código
- `/booking/registro` - Registro de nuevos clientes
- `/booking/login` - Login de clientes
- `/booking/perfil` - Perfil de cliente
- `/booking/mis-citas` - Gestión de citas

**aperture.anchor23.mx - Dashboard Administrativo:**
- `/aperture/login` - Login de administradores
- `/aperture` - Dashboard Home (KPIs, Top Performers, Activity Feed)
- `/aperture/calendar` - Calendario Maestro (drag & drop, filtros, tiempo real)

**Otros:**
- `/kiosk/[locationId]` - Sistema de autoservicio (reemplazar con UUID)
- `/hq` - Dashboard administrativo antiguo
- `/admin/enrollment` - Sistema de enrollment de kioskos

### API Endpoints (40+ endpoints implementados)

**APIs Públicas:**
- `/api/services` - Listar servicios
- `/api/locations` - Listar ubicaciones
- `/api/customers` - Búsqueda y registro de clientes
- `/api/availability/*` - Sistema de disponibilidad
- `/api/bookings` - Gestión de reservas

**Kiosk APIs:**
- `/api/kiosk/authenticate` - Autenticación de kiosk
- `/api/kiosk/resources/available` - Recursos disponibles
- `/api/kiosk/bookings` - Crear reservas
- `/api/kiosk/walkin` - Walk-in bookings

**Aperture APIs:**
- `/api/aperture/dashboard` - Datos del dashboard
- `/api/aperture/stats` - Estadísticas generales
- `/api/aperture/calendar` - Calendario data
- `/api/aperture/staff/*` - CRUD de staff
- `/api/aperture/resources/*` - Gestión de recursos
- `/api/aperture/payroll` - Cálculo de nómina
- `/api/aperture/pos/*` - Punto de venta y cierre de caja

**FASE 5 - Clientes y Fidelización:**
- `/api/aperture/clients/*` - CRM completo de clientes
- `/api/aperture/loyalty/*` - Sistema de puntos y recompensas

**FASE 6 - Pagos y Protección:**
- `/api/webhooks/stripe` - Webhooks de Stripe
- `/api/cron/reset-invitations` - Reseteo semanal de invitaciones
- `/api/cron/detect-no-shows` - Detección de no-shows
- `/api/aperture/bookings/check-in` - Check-in de clientes
- `/api/aperture/bookings/no-show` - Penalización de no-shows
- `/api/aperture/finance/*` - Finanzas y reportes

**Guía completa de APIs:** Ver [API.md](./docs/API.md) para documentación detallada de todos los endpoints.

---

## 13. Deployment y Producción

### Requisitos para Producción
- VPS o cloud provider (Vercel recomendado para Next.js)
- Base de datos Supabase production
- Configuración de dominios wildcard (`*.anchor23.mx`)
- SSL certificates automáticos
- Monitoring y logging (Sentry recomendado)

### Variables de Entorno de Producción
Además de las variables locales, configurar:
```
# Producción
NEXT_PUBLIC_APP_URL=https://anchor23.mx
NEXT_PUBLIC_BOOKING_URL=https://booking.anchor23.mx
NEXT_PUBLIC_KIOSK_URL=https://kiosk.anchor23.mx
NEXT_PUBLIC_APERTURE_URL=https://aperture.anchor23.mx

# Webhooks Stripe
STRIPE_WEBHOOK_ENDPOINT_SECRET=

# Google Calendar (opcional para producción)
GOOGLE_CALENDAR_ID=
```

### Pasos de Deployment
1. Configurar Supabase production con RLS habilitado
2. Ejecutar migraciones: `supabase db push`
3. Configurar dominios y SSL
4. Desplegar en Vercel con build settings personalizados
5. Configurar webhooks de Stripe para pagos
6. Probar autenticación y bookings end-to-end

### Monitoreo
- Logs de Supabase para queries lentas
- Alertas de Stripe para fallos de pago
- Uptime monitoring para dominios críticos

---

## 14. anchor23.mx - Frontend Institucional

Dominio institucional. Contenido estático, marca, narrativa y conversión inicial.

### Arquitectura de Dominios
- `anchor23.mx` - Frontend institucional (landing page + páginas informativas)
- `booking.anchor23.mx` - The Boutique (frontend de reservas) - **En Progreso 20%**
- `kiosk.anchor23.mx` - The Kiosk (pantallas táctiles)

### Páginas Implementadas

**anchor23.mx**
- `/` - Landing page (Hero, Fundamento, Servicios Preview, Testimonios)
- `/servicios` - Grid de servicios con descripciones
- `/historia` - Historia, filosofía y significado de la marca
- `/contacto` - Formulario de contacto con información
- `/franquicias` - Modelo de franquicias con solicitud
- `/membresias` - 3 tiers (Gold, Black, VIP) con solicitudes
- `/privacy-policy` - Política de privacidad completa
- `/legal` - Términos y condiciones

**booking.anchor23.mx**
- `/booking/servicios` - Página de selección de servicios con calendario
- `/booking/cita` - Flujo de reserva en pasos:
  1. Búsqueda de cliente por email/telefono
  2. Confirmación de datos personales
  3. Pago del depósito (mock actualmente)
- `/booking/registro` - Registro de nuevos clientes con:
  - Nombre y apellido
  - Email y teléfono
  - Fecha de nacimiento
  - Ocupación (lista desplegable)
- `/booking/login` - Autenticación con magic links
- `/booking/perfil` - Perfil de cliente con historial de citas
- `/booking/mis-citas` - Gestión de citas

**aperture.anchor23.mx** (Pendiente implementación completa - Plan 0%)
- `/aperture` - Dashboard Home con:
  - KPI Cards (Ventas, Citas, Clientes, Gráfico)
  - Gráfico de Rendimiento (líneas/áreas suaves)
  - Tabla "Top Performers" (Staff y Servicios)
  - Feed de Actividad Reciente (scroll infinito)
- `/aperture/calendar` - Calendario Maestro con:
  - Columnas por trabajador, filas por bloques de 15/30 min
  - Drag & Drop (mover entre horas y trabajadores)
  - Resize de bloques (incrementos de 15 min)
  - Filtros dinámicos (Sucursal, Staff)
  - Indicadores visuales (línea tiempo actual, bloqueos, tooltips)
- `/aperture/staff` - Gestión de Staff con:
  - Cards por trabajador (foto, puesto, rating, toggle activo)
  - CRUD completo
  - Configuración de Comisiones (% por servicio y producto)
  - Calendario de Turnos (vista semanal)
- `/aperture/staff/payroll` - Cálculo de Nómina:
  - Tabla: Nombre | Sueldo Base | Comisiones Servicios | Comisiones Productos | Propinas | Total a Pagar
  - Exportar a Excel/CSV/PDF
- `/aperture/clients` - CRM de Clientes:
  - Tabla con búsqueda fonética
  - Perfil completo de cliente (personal_data, bookings_history, purchases_history, notes)
  - Notas técnicas ("Alérgica a tal marca", "Prefiere café")
- `/aperture/clients/[id]` - Perfil de Cliente:
  - Historial de citas y compras
  - Galería de fotos (SOLO VIP/Black/Gold)
  - Membresías y créditos
- `/aperture/clients/[id]/gallery` - Galería de Fotos:
  - SOLO para clientes VIP/Black/Gold
  - Good to have: control de calidad, rastreabilidad de quejas
- `/aperture/loyalty` - Sistema de Fidelización:
  - Configuración de reglas (100 MXN = 1 Punto)
  - Listado de recompensas canjeables
- `/aperture/loyalty/memberships` - Sistema de Membresías:
  - Creación de planes ("Plan VIP 4 Manicuras al mes")
  - Control de "créditos" restantes en el perfil
- `/aperture/loyalty/rewards` - Recompensas Canjeables
- `/aperture/loyalty/points/[client_id]` - Puntos del cliente
- `/aperture/pos` - Punto de Venta (POS):
  - Interfaz táctil optimizada
  - Selección de servicios/productos
  - Categorías: Servicios, Productos de venta, Membresías, Giftcards
  - Opciones de pago: Efectivo, Transferencia, Membership, Tarjeta, Giftcard, PIA
  - Puede crear nuevas citas + procesar pagos
  - NO imprimir recibos (enviar email o dashboard cliente)
- `/aperture/pos/checkout` - Procesar cobro
- `/aperture/finance` - Finanzas:
  - Gestión de gastos (egresos: renta, insumos)
  - Cálculo de margen de beneficio neto
  - Reporte mensual
- `/aperture/finance/close-day` - Cierre de Caja:
  - Resumen diario: efectivo, tarjeta, transferencias
  - Botón "Cerrar Día" genera reporte PDF automático
  - Múltiples cajeros con control de movimientos
- `/aperture/admin/settings` - Marketing y Configuración:
  - Campañas (promociones masivas Email/WhatsApp)
  - Precios Inteligentes (reglas para horas pico/bajas)
  - Integraciones Placeholder (Google, Instagram/FB Shopping)
- `/` - Landing page (Hero, Fundamento, Servicios Preview, Testimonios)
- `/servicios` - Grid de servicios con descripciones
- `/historia` - Historia, filosofía y significado de la marca
- `/contacto` - Formulario de contacto con información
- `/franchises` - Modelo de franquicias con solicitud
- `/membresias` - 3 tiers (Gold, Black, VIP) con solicitudes
- `/privacy-policy` - Política de privacidad completa
- `/legal` - Términos y condiciones

**booking.anchor23.mx**
- `/booking/servicios` - Página de selección de servicios con calendario
- `/booking/cita` - Flujo de reserva en pasos:
  1. Búsqueda de cliente por email/telefono
  2. Confirmación de datos personales
  3. Pago del depósito (mock actualmente)
- `/booking/registro` - Registro de nuevos clientes con:
  - Nombre y apellido
  - Email y teléfono
  - Fecha de nacimiento
  - Ocupación (lista desplegable)
- `/booking/login` - Autenticación con magic links
- `/booking/perfil` - Perfil de cliente con historial de citas
- `/booking/mis-citas` - Gestión de citas

### Sistema de Horarios de Negocio
Cada ubicación tiene horarios de apertura personalizados por día de la semana almacenados en la columna `business_hours` (JSONB):

**Formato de estructura:**
```json
{
  "monday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "tuesday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "wednesday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "thursday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "friday": {"open": "10:00", "close": "19:00", "is_closed": false},
  "saturday": {"open": "10:00", "close": "18:00", "is_closed": false},
  "sunday": {"is_closed": true}
}
```

**Horarios por defecto (actualizados vía migración):**
- Lunes a Viernes: 10:00 AM - 7:00 PM
- Sábado: 10:00 AM - 6:00 PM
- Domingo: Cerrado

**Implementación:**
- Función PostgreSQL `get_detailed_availability()` respeta horarios de cada día
- Solo se muestran slots dentro del horario de apertura
- Días marcados como `is_closed: true` no muestran disponibilidad
- Los horarios se pueden personalizar por ubicación individualmente

**aperture.anchor23.mx** (Backend administrativo)
- `/aperture` - Dashboard Home con KPI Cards, Gráfico, Top Performers, Activity Feed
- `/aperture/calendar` - Calendario Maestro con Drag & Drop, Resize, Filtros dinámicos
- `/aperture/staff` - Gestión de Staff (CRUD, Comisiones, Nómina, Turnos)
- `/aperture/clients` - CRM de Clientes, Galería VIP, Membresías, Puntos
- `/aperture/pos` - Punto de Venta (POS), Cierre de Caja, Finanzas
- `/aperture/admin` - Marketing, Precios Inteligentes, Integraciones
- Reportes: Ventas, Pagos, Nómina
- Gestión de permisos por roles

**kiosk.anchor23.mx**
- Sistema completo de kiosko con autenticación por API key

### Tecnologías
- Next.js 14 (App Router) con SSG
- Tailwind CSS para estilos
- Lucide React para iconos
- HTML semántico

### APIs
Ver documentación completa en `API.md` para todos los endpoints disponibles.

### Principios de Diseño
- HTML semántico
- Secciones claras
- Conversión silenciosa hacia booking.anchor23.mx
- Booking y Kiosk desacoplados
- Marca primero, sistema después
- Arquitectura lista para escalar sin diluir exclusividad

### Flujo de Conversión
1. Landing page → Interés en servicios
2. /servicios → Conocimiento de oferta
3. /membresias → Solicitud de membresía
4. CTA directo → booking.anchor23.mx (reserva)
5. /franchises → Solicitud de franquicia

---

## 15. Sistema de Kiosko

El sistema de kiosko permite a los clientes interactuar con el salón mediante pantallas táctiles en la entrada.

### Funcionalidades
- **Confirmación de Citas**: Los clientes confirman su llegada ingresando el código de 6 caracteres (short_id)
- **Reservas Walk-in**: Creación de reservas inmediatas para clientes sin cita previa
- **Asignación Inteligente de Recursos**: Prioridad automática (mkup > lshs > pedi > mani)

### Seguridad
- Autenticación por API key de 64 caracteres
- Políticas RLS restrictivas (sin acceso a PII de clientes)
- Audit logging completo de todas las acciones

### Documentación
- Guía completa: `docs/KIOSK_SYSTEM.md`
- Implementación rápida: `docs/KIOSK_IMPLEMENTATION.md`

### Acceso al Kiosko
```
https://kiosk.anchor23.mx/{location-id}
```

---

## 16. Filosofía Operativa

AnchorOS no busca volumen.

Busca **control, eficiencia y blindaje**.

Este repositorio implementa esa filosofía a nivel de sistema.

---

## 17. Codename: Adela

AnchorOS se conoce internamente como **Adela**, un acrónimo que representa los pilares fundamentales del sistema:

- **A**ttention - Atención personalizada y detallada a cada cliente
- **D**igital Engagement - Compromiso digital con la marca y servicios
- **E**ngagement Logistics - Logística de interacción eficiente
- **L**ogistics Analytics - Análisis de datos para optimización operativa
- **A**nalytics - Inteligencia de datos para decisiones estratégicas

Adela simboliza la transformación digital de los salones de belleza de alta gama, combinando lujo, tecnología y eficiencia operativa.

---

**Proyecto:** soul23
