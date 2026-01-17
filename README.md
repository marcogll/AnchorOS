# 🥂 SalonOS

**Exclusive Studio Management & CRM Engine**
Repositorio principal del sistema SalonOS.

Este README es la puerta de entrada técnica al proyecto. Define qué es este repositorio, cómo se estructura y cómo debe ser utilizado por desarrollo, producto y operación.

---

## 1. ¿Qué es SalonOS?

SalonOS es un sistema propietario de gestión operativa y CRM diseñado para estudios de belleza de alta exclusividad. No es una agenda genérica: coordina **personas, recursos físicos, pagos, privilegios y datos** bajo reglas estrictas de control y privacidad.

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

* **PRD (Documento Maestro)** → Definición de producto y reglas de negocio.
* **README (este archivo)** → Guía técnica y operativa del repo.
* **API.md** → Documentación completa de APIs y endpoints.
* **TASKS.md** → Plan de ejecución por fases y estado actual.

El PRD es la fuente de verdad funcional. El README es la guía de ejecución.

---

## 4. Arquitectura General

### Dominios

* `anchor23.mx` - Frontend institucional (landing page + páginas informativas)
* `booking.anchor23.mx` - Frontend de reservas (The Boutique) - **Pendiente**
* `kiosk.anchor23.mx` - Sistema de autoservicio (The Kiosk)

### Experiencias

* **The Boutique**: Frontend de reserva para clientas.
* **The HQ**: Dashboard administrativo y CRM interno.
* **The Kiosk**: Sistema de autoservicio en pantalla táctil para confirmación de citas y walk-ins.

### Principios

* Security by Design.
* Exclusividad curada.
* Optimización de activos.
* Marca primero, sistema después.

---

## 5. Stack Tecnológico

* **Frontend**: Next.js 14 (App Router)
* **UI / Estilos**: Tailwind CSS + Framer Motion
* **Backend**: Supabase (PostgreSQL + Auth + RLS)
* **Pagos**: Stripe SDK
* **Calendario**: Google Calendar API v3 (Service Account)
* **Notificaciones**: WhatsApp API (Twilio / Meta)
* **Storage**: Supabase Storage (Buckets privados)

---

## 6. Estructura del Proyecto

```
/salonos
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
│   ├── hq/                       # Dashboard administrativo
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

* Node.js 18+
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
cd salonos
```

2. Instalar dependencias

```
npm install
```

3. Configurar variables de entorno

* Crear `.env.local`.

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
- ✅ HQ Dashboard (Aperture) con gestión de staff y recursos
- ✅ Reportes de ventas, pagos y nómina
- ✅ Gestión de permisos por roles
- ✅ Integración con Stripe para pagos y depósitos
- ✅ Autenticación completa (clientes con magic links, staff/admin)
- ✅ The Boutique - Frontend de reservas completo
  - Página de selección de servicios (/booking/servicios)
  - Página de confirmación de reserva (/booking/cita)
  - API para obtener servicios (/api/services)
  - API para obtener ubicaciones (/api/locations)
  - Configuración de dominios wildcard en producción
- ✅ Frontend institucional anchor23.mx completo
  - Landing page con hero, fundamento, servicios, testimoniales
  - Página de servicios
  - Página de historia y filosofía
  - Página de contacto
  - Página de franquicias
  - Página de membresías (Gold, Black, VIP)
  - Páginas legales (Privacy Policy, Legal)
  - Header y footer globales

### En Progreso 🚧
- 🚧 Lógica de no-show y penalizaciones automáticas
- 🚧 Integración con Google Calendar

### Pendiente ⏳
- ⏳ Implementar API pública (api.anchor23.mx)
- ⏳ Notificaciones por WhatsApp
- ⏳ Recibos digitales por email
- ⏳ Landing page para believers (booking público)
- ⏳ The Vault (storage de fotos privadas)

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

**Fase 3 — Pagos y Protección**: 70% completado
- Stripe depósitos dinámicos: 100%
- No-show logic: 40% (lógica implementada, automatización pendiente)

**Advertencia:** No apto para producción. Migraciones y seeds en evolución.

---

## 11. Deployment y Producción

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

## 12. anchor23.mx - Frontend Institucional

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
- `/franchises` - Modelo de franquicias con solicitud
- `/membresias` - 3 tiers (Gold, Black, VIP) con solicitudes
- `/privacy-policy` - Política de privacidad completa
- `/legal` - Términos y condiciones

**booking.anchor23.mx**
- `/booking/servicios` - Página de selección de servicios con calendario
- `/booking/cita` - Página de confirmación de reserva con formulario de cliente y pagos
- `/booking/login` - Autenticación con magic links
- `/booking/perfil` - Perfil de cliente con historial de citas
- `/booking/mis-citas` - Gestión de citas

**aperture.anchor23.mx** (Backend administrativo)
- `/aperture` - Dashboard con estadísticas y gestión
- `/aperture` (tabs: Dashboard, Staff, Resources, Reports, Permissions)
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

## 13. Sistema de Kiosko

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

## 14. Filosofía Operativa

SalonOS no busca volumen.

Busca **control, eficiencia y blindaje**.

Este repositorio implementa esa filosofía a nivel de sistema.

---

**Proyecto:** soul23
