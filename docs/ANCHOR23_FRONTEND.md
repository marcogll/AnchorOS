# anchor23.mx - Frontend Institucional

## Overview

anchor23.mx es el frontend institucional de Anchor:23, diseñado para comunicar la marca, los servicios y la filosofía de exclusividad del salón de belleza.

## Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Render**: SSG (Static Site Generation)
- **Estilos**: Tailwind CSS
- **Iconos**: Lucide React
- **Tipografía**: Inter (Google Fonts)

## Estructura de Páginas

```
app/
├── layout.tsx                    # Layout global (header + footer)
├── page.tsx                      # Landing page principal
├── servicios/page.tsx             # Catálogo de servicios
├── historia/page.tsx              # Historia y filosofía
├── contacto/page.tsx              # Formulario de contacto
├── franchises/page.tsx            # Información de franquicias
├── membresias/page.tsx            # Membresías (Gold, Black, VIP)
├── privacy-policy/page.tsx        # Política de privacidad
└── legal/page.tsx                # Términos y condiciones
```

## Componentes Globales

### Layout (app/layout.tsx)

```typescript
// Header fijo con navegación
<header class="site-header">
  <nav class="nav-primary">
    <div class="logo">ANCHOR:23</div>
    <ul class="nav-links">
      <li><a href="/">Inicio</a></li>
      <li><a href="/historia">Nosotros</a></li>
      <li><a href="/servicios">Servicios</a></li>
      <li><a href="/membresias">Membresías</a></li>
    </ul>
    <div class="nav-actions">
      <a href="/membresias" class="btn-primary">
        Solicitar Membresía
      </a>
    </div>
  </nav>
</header>

// Footer con información y links legales
<footer class="site-footer">
  <div class="footer-brand">ANCHOR:23</div>
  <div class="footer-links">
    <a href="/historia">Nosotros</a>
    <a href="/servicios">Servicios</a>
    <a href="/contacto">Contáctanos</a>
  </div>
  <div class="footer-legal">
    <a href="/privacy-policy">Privacy Policy</a>
    <a href="/legal">Legal</a>
  </div>
  <div class="footer-contact">
    <span>+52 844 123 4567</span>
    <span>contacto@anchor23.mx</span>
  </div>
</footer>
```

## Landing Page (`/`)

### Secciones

1. **Hero Section**
   - Logo mark (ancla)
   - Título: "ANCHOR:23"
   - Subtítulo: "Belleza Anclada en Exclusividad"
   - CTA: "Ver servicios" → /servicios
   - CTA: "Solicitar cita" → booking.anchor23.mx
   - Imagen hero

2. **Fundamento / Origen**
   - Título: "Nada sólido nace del caos"
   - Narrativa de origen de la marca
   - Imagen de fundamento

3. **Servicios Exclusivos (Preview)**
   - Spa de Alta Gama
   - Arte y Manicure de Precisión
   - Peinado y Maquillaje de Lujo
   - CTA: "Ver todos los servicios" → /servicios

4. **Testimoniales**
   - 2 testimoniales con estrellas
   - CTA: "Solicitar Membresía" → /membresias

## Página de Servicios (`/servicios`)

### Contenido

Grid de servicios con:
- Categoría
- Despción
- Lista de servicios por categoría
- CTA: "Reservar Cita" → booking.anchor23.mx

### Categorías

1. **Spa de Alta Gama**
   - Tratamientos Faciales
   - Masajes Terapéuticos
   - Hidroterapia

2. **Arte y Manicure de Precisión**
   - Manicure de Precisión
   - Pedicure Spa
   - Arte en Uñas

3. **Peinado y Maquillaje de Lujo**
   - Corte y Estilismo
   - Color Premium
   - Maquillaje Profesional

4. **Cuidado Corporal**
   - Exfoliación Profunda
   - Envolturas Corporales
   - Tratamientos Reductores

5. **Membresías Exclusivas**
   - Gold Tier
   - Black Tier
   - VIP Tier

## Página de Historia (`/historia`)

### Secciones

1. **El Fundamento**
   - Título: "Nada sólido nace del caos"
   - Narrativa de origen
   - Imagen de historia

2. **El Significado**
   - **ANCHOR**: Estabilidad, firmeza, permanencia
   - **:23**: Dualidad equilibrada (precisión + creatividad)

3. **Nuestra Filosofía**
   - Lujo como Estándar
   - Exclusividad Inherente
   - Precisión Absoluta

## Página de Contacto (`/contacto`)

### Funcionalidades

1. **Información de Contacto**
   - Ubicación: Saltillo, Coahuila, México
   - Teléfono: +52 844 123 4567
   - Email: contacto@anchor23.mx
   - Horario: Lunes - Sábado, 10:00 - 21:00

2. **Formulario de Contacto**
   - Nombre Completo
   - Email
   - Teléfono
   - Mensaje
   - Validación y submit

3. **CTA a Booking**
   - "Reservar Cita" → booking.anchor23.mx

## Página de Franquicias (`/franchises`)

### Secciones

1. **Nuestro Modelo**
   - "Una Sucursal por Ciudad"
   - Exclusividad, Calidad, Sostenibilidad
   - Iconos ilustrativos

2. **Beneficios**
   - Modelo de negocio exclusivo
   - Una sucursal por ciudad
   - Sistema operativo completo (AnchorOS)
   - Capacitación en estándares de lujo
   - Membresía como fuente recurrente
   - Soporte continuo

3. **Requisitos**
   - Compromiso inquebrantable con la calidad
   - Experiencia en industria de belleza
   - Inversión mínima: $500,000 USD
   - Ubicación premium en ciudad de interés
   - Capacidad de contratar personal calificado

4. **Solicitud de Información**
   - Nombre Completo
   - Email
   - Teléfono
   - Ciudad de Interés
   - Experiencia en el Sector
   - Mensaje Adicional

5. **Contacto Directo**
   - Email: franchises@anchor23.mx
   - Teléfono: +52 844 987 6543

## Página de Membresías (`/membresias`)

### Tiers

#### Gold Tier
- **Precio**: $2,500 MXN/mes
- **Descripción**: Acceso prioritario y experiencias exclusivas
- **Beneficios**:
  - Reserva prioritaria
  - 15% descuento en servicios
  - Acceso anticipado a eventos
  - Consultas de belleza mensuales
  - Producto de cortesía mensual

#### Black Tier
- **Precio**: $5,000 MXN/mes
- **Descripción**: Privilegios premium y atención personalizada
- **Beneficios**:
  - Reserva prioritaria + sin espera
  - 25% descuento en servicios
  - Acceso VIP a eventos exclusivos
  - 2 tratamientos spa complementarios/mes
  - Set de productos premium trimestral

#### VIP Tier
- **Precio**: $10,000 MXN/mes (Más Popular)
- **Descripción**: La máxima expresión de exclusividad
- **Beneficios**:
  - Acceso inmediato - sin restricciones
  - 35% descuento en servicios + productos
  - Experiencias personalizadas ilimitadas
  - Estilista asignado exclusivamente
  - Evento privado anual para ti + 5 invitados
  - Acceso a instalaciones fuera de horario

### Solicitud de Membresía

Formulario con:
- Selección de tier (automático al hacer click en tarjeta)
- Nombre Completo
- Email
- Teléfono
- Mensaje Adicional

## Páginas Legales

### Privacy Policy (`/privacy-policy`)

Secciones:
1. Información que Recopilamos
2. Uso de la Información
3. Compartir de Información
4. Seguridad de Datos
5. Derechos del Usuario
6. Cookies y Tecnologías Similares
7. Cambios en la Política
8. Contacto

### Legal (`/legal`)

Secciones:
1. Aceptación de Términos
2. Servicios Prestados
3. Reservas y Cancelaciones
4. Pagos
5. Membresías
6. Conducta del Cliente
7. Propiedad Intelectual
8. Limitación de Responsabilidad
9. Modificaciones
10. Jurisdicción
11. Contacto

## Estilos y Diseño

### Colores

```css
--foreground-rgb: 20, 20, 20;      /* Gris oscuro para texto */
--background-rgb: 255, 255, 255;  /* Blanco puro */
--accent-rgb: 180, 150, 120;       /* Dorado/Tierra */
--accent-dark-rgb: 140, 110, 80;   /* Dorado oscuro */
```

### Tipografía

- **Font**: Inter (Google Fonts)
- **Títulos**: Bold, tracking-tight
- **Subtítulos**: Regular/Medium
- **Cuerpo**: Regular, leading-relaxed

### Componentes

#### Botones

```typescript
// Primary Button
<a className="btn-primary">
  Botón
</a>

// Secondary Button
<a className="btn-secondary">
  Botón
</a>
```

#### Cards

```typescript
<article className="service-card">
  <h4>Título</h4>
  <p>Descripción</p>
</article>

<article className="testimonial">
  <span className="stars">★★★★★</span>
  <p>Testimonio</p>
  <cite>Autor</cite>
</article>
```

## SEO

### Meta Tags

```typescript
export const metadata: Metadata = {
  title: 'ANCHOR:23 — Belleza Anclada en Exclusividad',
  description: 'Salón de ultra lujo. Un estándar exclusivo de precisión y elegancia.',
}
```

### Estructura Semántica

- `<header>` para navegación global
- `<main>` para contenido principal
- `<section>` para secciones principales
- `<article>` para contenido individual (servicios, testimoniales)
- `<footer>` para pie de página

## Conversion Tracking

### Funnels

1. **Conversión a Reserva**
   - Landing → Servicios → booking.anchor23.mx

2. **Conversión a Membresía**
   - Landing → Membresías → Solicitud

3. **Conversión a Franquicia**
   - Landing → Franchises → Solicitud

### CTAs Principales

- "Ver servicios" → /servicios
- "Solicitar cita" → booking.anchor23.mx
- "Solicitar Membresía" → /membresias
- "Contáctanos" → /contacto

## Performance

### Optimizaciones

- **SSG (Static Site Generation)**: Páginas pre-renderizadas
- **Next.js Image Optimization**: Imágenes optimizadas
- **Tailwind CSS**: CSS purgado al build
- **Lazy Loading**: Carga diferida de componentes
- **Minificación**: JS/CSS minificados

### Metas de Rendimiento

- Lighthouse Score: 95+
- First Contentful Paint (FCP): < 1.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

## Testing

### Testing Local

```bash
npm run dev
# Acceder a http://localhost:3000
```

### Testing de Producción

```bash
npm run build
npm start
```

### Testing de Responsividad

- Desktop: 1920x1080, 1366x768
- Tablet: 768x1024
- Mobile: 375x667, 414x896

## Analytics

### Google Analytics (Pendiente)

```typescript
// En layout.tsx
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <GoogleAnalytics gaId="GA_MEASUREMENT_ID" />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Event Tracking

```typescript
// Ejemplo de tracking de CTA
const trackCTA = (ctaName: string) => {
  window.gtag?.('event', 'cta_click', {
    cta_name: ctaName,
    page: window.location.pathname
  })
}

// Uso
<a 
  href="/servicios"
  onClick={() => trackCTA('ver_servicios')}
  className="btn-secondary"
>
  Ver servicios
</a>
```

## Mantenimiento

### Actualizaciones

- **Contenido**: Actualizar texto, precios, servicios directamente en código
- **Imágenes**: Reemplazar placeholders con imágenes reales
- **Membresías**: Actualizar precios y beneficios según cambios
- **Legales**: Actualizar políticas según cambios legales

### Checklist antes de Desplegar

- [ ] Revisar ortografía y gramática
- [ ] Verificar todos los enlaces funcionan
- [ ] Probar en múltiples dispositivos
- [ ] Verificar responsive design
- [ ] Testear todos los formularios
- [ ] Validar SEO (meta tags, headings)
- [ ] Verificar carga de imágenes
- [ ] Testear CTAs a booking.anchor23.mx

## Próximos Pasos

1. ✅ Implementar todas las páginas
2. ⏳ Reemplazar placeholders con imágenes reales
3. ⏳ Implementar Google Analytics
4. ⏳ Configurar SEO avanzado (sitemaps, robots.txt)
5. ⏳ Implementar formularios con backend real
6. ⏳ Integrar con booking.anchor23.mx
7. ⏳ Testing de usabilidad
8. ⏳ Despliegue en producción

## Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Iconos Lucide](https://lucide.dev/icons)
- [Guía de SEO para Next.js](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
