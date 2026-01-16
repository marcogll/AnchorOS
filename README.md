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

* Frontend de cliente (The Boutique).
* Dashboard administrativo (The HQ).
* Lógica de negocio de agendamiento.
* Integraciones externas (Stripe, Google Calendar, WhatsApp).
* Esquema base de datos y políticas de seguridad.

No contiene:

* Material de marketing.
* Operación manual del salón.
* Datos productivos.

---

## 3. Documentación Oficial

Este proyecto se rige por los siguientes documentos:

* **PRD (Documento Maestro)** → Definición de producto y reglas de negocio.
* **README (este archivo)** → Guía técnica y operativa del repo.

El PRD es la fuente de verdad funcional. El README es la guía de ejecución.

---

## 4. Arquitectura General

### Experiencias

* **The Boutique**: Frontend de reserva para clientas.
* **The HQ**: Dashboard administrativo y CRM interno.
* **The Kiosk**: Sistema de autoservicio en pantalla táctil para confirmación de citas y walk-ins.

### Principios

* Security by Design.
* Exclusividad curada.
* Optimización de activos.

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
├── app/                # Next.js App Router
│   ├── boutique/       # Frontend clienta
│   ├── hq/             # Dashboard administrativo
│   ├── kiosk/          # Sistema de autoservicio (pantalla táctil)
│   └── api/            # API routes
│       ├── kiosk/      # Endpoints para kiosko
│       └── ...
├── components/         # Componentes UI reutilizables
│   ├── kiosk/          # Componentes del sistema de kiosko
│   └── ui/             # Componentes base (Button, Input, Card, etc.)
├── lib/                # Lógica de negocio y helpers
│   └── db/             # Tipos TypeScript del esquema
├── supabase/
│   └── migrations/     # Migraciones SQL versionadas
├── integrations/       # Stripe, Google, WhatsApp
├── styles/             # Configuración Tailwind
└── docs/               # Documentación adicional
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
- ✅ Sistema de kiosko completo
- ✅ API routes para kiosko
- ✅ Componentes UI para kiosko
- ✅ Actualización de recursos con códigos estandarizados
- ✅ Audit logging completo
- ✅ Tiers de cliente extendidos (free, gold, black, VIP)

### En Progreso 🚧
- 🚧 Testing del sistema de kiosko
- 🚧 Validación de migración de recursos

### Pendiente ⏳
- ⏳ API routes para cliente y staff
- ⏳ Motor de agendamiento con disponibilidad
- ⏳ Integración con Google Calendar
- ⏳ Integración con Stripe
- ⏳ HQ Dashboard (calendario multi-columna, gestión operativa)
- ⏳ The Vault (storage de fotos privadas)
- ⏳ Notificaciones y automatización
- ⏳ Landing page pública

### Fase Actual
**Fase 1 — Cimientos y CRM**: 90% completado
- Infraestructura base: 100%
- Esquema de base de datos: 100%
- Short ID & Invitaciones: 100%
- CRM Base: 100%
- Sistema de Kiosko: 100%
- Actualización de Recursos: 100%

**Advertencia:** No apto para producción. Migraciones y seeds en evolución.

---

## 11. Sistema de Kiosko

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
https://tu-dominio.com/kiosk/{location-id}
```

## 12. Filosofía Operativa

SalonOS no busca volumen.

Busca **control, eficiencia y blindaje**.

Este repositorio implementa esa filosofía a nivel de sistema.

---

**Proyecto:** soul23
