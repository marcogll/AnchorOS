# 🖼️ Assets & Images Plan

Este documento describe todos los recursos de imagen necesarios para AnchorOS y el plan de implementación del logo SVG original.

---

## 📁 1. Imágenes de Sucursales (@src/location)

**Ubicación existente:**
```text
src/location/
  ├─ A23_VIA_K01.png
  ├─ A23_VIA_K02.png
  ├─ A23_VIA_K03.png
  ├─ A23_VIA_K04.png
  └─ A23_VIA_K05.png
```

**Plan de uso sugerido:**

| Archivo           | Uso sugerido                                  | Dimensiones recomendadas | Comentarios                        |
|-------------------|----------------------------------------------|--------------------------|-------------------------------------|
| A23_VIA_K01.png   | Hero banner página de franquicias            | 1920×800 px (desktop) / 800×600 (mobile) | Optimizar JPEG 80-85% |
| A23_VIA_K02.png   | Galería de sucursales en página franquicias | 400×300 px (thumbnails) / 1200×600 (modal) | PNG o WebP optimizado |
| A23_VIA_K03.png   | Slider mobile página de franquicias        | 375×250 px (ratio 3:2)               | Comprimir para mobile |
| A23_VIA_K04.png   | Card destacado primera sucursal           | 600×400 px                               | PNG con transparencia si aplica |
| A23_VIA_K05.png   | Background sección información           | 1920×900 px (parallax) o 1920×1080 (cover) | Considerar overlay oscuro |

---

## 📁 2. Imágenes de Servicios

**Ubicación sugerida:** `src/public/images/services/` o `public/images/services/`

**Categorías según código:**
- `core` - CORE EXPERIENCES
- `nails` - NAIL COUTURE
- `hair` - HAIR FINISHING RITUALS
- `lashes` - LASH & BROW RITUALS
- `events` - EVENT EXPERIENCES
- `permanent` - PERMANENT RITUALS

**Estructura sugerida:**
```text
public/images/services/
  ├─ core/
  │   ├─ spa-hero.jpg (1920×1080)
  │   ├─ facial-hero.jpg (1920×1080)
  │   └─ experience-1.jpg (1200×800)
  ├─ nails/
  │   ├─ manicure-thumb.jpg (600×800)
  │   ├─ pedicure-thumb.jpg (600×800)
  │   └─ nail-art.jpg (800×600)
  ├─ hair/
  │   ├─ blowout.jpg (800×800)
  │   ├─ styling.jpg (800×800)
  │   └─ treatment.jpg (800×600)
  ├─ lashes/
  │   ├─ extensions.jpg (800×800)
  │   └─ brows.jpg (600×800)
  ├─ events/
  │   └─ event-thumb.jpg (1200×800)
  └─ permanent/
      └─ treatment.jpg (800×600)
```

**Tamaños mínimos sugeridos:**
- Hero de categoría: 1920×1080 px
- Thumbnails verticales: 600×800 px
- Cuadrados: 800×800 px
- Formatos: JPG 80-85% (fotos), PNG/WebP (gráficos)

---

## 📁 3. Imágenes de Sucursales para Franquicias

**Ubicación sugerida:** `public/images/franchises/` o `src/public/images/franchises/`

**Imágenes necesarias:**
- `franchise-landing-hero.jpg` - Banner principal (1920×900 px)
- `location-hero-1.jpg` - Hero sucursal 1 (1200×600 px)
- `location-hero-2.jpg` - Hero sucursal 2 (1200×600 px)
- `location-hero-3.jpg` - Hero sucursal 3 (1200×600 px)
- `franchise-team.jpg` - Foto del equipo (1200×600 px)
- `success-badge.jpg` - Badge de éxito (300×300 px)

---

## 📁 4. Imágenes de Página Principal

**Ubicación sugerida:** `public/images/home/`

**Imágenes actuales en código:**
1. `hero-bg.jpg` - Imagen Hero Section (1920×1080 px, parallax)
   - Uso: `<div className="hero-image">` en app/page.tsx:22
   - Recomendación: Foto de spa elegante, tonos cálidos, luz suave

2. `foundation-bg.jpg` - Imagen Sección Fundamento (1200×600 px)
   - Uso: `<aside className="foundation-image">` en app/page.tsx:44
   - Recomendación: Foto del logo o detalle arquitectónico

---

## 📁 5. Imágenes de Historia

**Ubicación sugerida:** `public/images/history/` o `src/public/images/history/`

**Imágenes necesarias:**
- `history-hero.jpg` - Banner principal (1920×600 px)
- `founders.jpg` - Foto de fundadores (1200×800 px)
- `timeline-1.jpg` - Foto evento 1 (800×600 px)
- `timeline-2.jpg` - Foto evento 2 (800×600 px)
- `timeline-3.jpg` - Foto evento 3 (800×600 px)

---

## 📁 6. Imágenes de Testimonios

**Ubicación sugerida:** `public/images/testimonials/`

**Imágenes necesarias:**
- `testimonial-1.jpg` - Foto cliente 1 (400×400 px, cuadrado)
- `testimonial-2.jpg` - Foto cliente 2 (400×400 px, cuadrado)
- `testimonial-3.jpg` - Foto cliente 3 (400×400 px, cuadrado)
- `testimonial-4.jpg` - Foto cliente 4 (400×400 px, cuadrado)

**Notas:**
- Fotos reales de clientes (permiso necesario)
- Tonos cálidos, iluminación suave
- Posibles background blur o overlay de marca

---

## 📁 7. Imágenes de Galerías

**Ubicación sugerida:** `public/images/gallery/`

**Estructura sugerida:**
```text
public/images/gallery/
  ├─ before-after/
  │   ├─ nails-ba-1.jpg (1200×800)
  │   ├─ nails-af-1.jpg (1200×800)
  │   ├─ brows-ba-1.jpg (1200×800)
  │   └─ brows-af-1.jpg (1200×800)
  ├─ treatments/
  │   ├─ facial-1.jpg (1200×800)
  │   ├─ spa-1.jpg (1200×800)
  │   └─ massage-1.jpg (1200×800)
  └─ events/
      ├─ event-1.jpg (1200×800)
      └─ event-2.jpg (1200×800)
```

---

## 8. Nuevos Componentes (@src/components/)

**Ubicación sugerida:** `components/`

**Componentes agregados:**
- `animated-logo.tsx` - Logo SVG animado con fade-in
- `rolling-phrases.tsx` - Frases rotativas para hero sections
- `formbricks-provider.tsx` - Provider para encuestas Formbricks
- `webhook-form.tsx` - Formulario unificado para webhooks
- `app-wrapper.tsx` - Wrapper de aplicación con contexto
- `loading-screen.tsx` - Pantalla de carga con animación
- `pattern-overlay.tsx` - Overlay de patrones decorativos
- `responsive-nav.tsx` - Navegación responsiva con menú móvil

**Iconos adicionales:**
- Diamond (check, success states)
- Crown (VIP tier)

**Colores actualizados:**
- `--charcoal-brown`: #3f362e (marrón oscuro elegante)
- `--deep-earth`: #6f5e4f (marrón medio)
- `--mocha-taupe`: #b8a89a (beige cálido)

## 9. Logo SVG Original (@src/logo.svg)

**Ruta:** `src/logo.svg`

**Propiedades:**
```xml
<svg viewBox="0 0 500 500" ...>
  <!-- Path único que combina ancla + "23" -->
  <path style="fill:#6f5e4f;stroke-width:1.14189;fill-opacity:1" d="m 243.91061,490.07237 ..." />
</svg>
```

**Plan de integración:**
1. Importar SVG COMPLETO en componentes (no path simplificado)
2. Aplicar transform para ajustar proporciones
3. Hero: Color sólido `#6F5E4F`, sin animación (aparece instantáneamente)
4. Loading: `#E9E1D8` sobre `#3F362E`, sin fade-in del logo + fade-out desde arriba

**Tamaños recomendados:**
- Hero: 160×110 px → 200×137 px (responsive)
- Loading: 160×110 px (fijo, consistente)
- SVG viewBox: `0 0 160 110` (ajustado)

---

## 9. Página de Franquicias

**Ubicación:** `app/franchises/page.tsx`

**Imágenes utilizadas:**
- Iconos: Lucide (Building2, Map, CheckCircle)
- Necesita: Imágenes de sucursales del punto 3

---

## 10. Página de Servicios

**Ubicación:** `app/servicios/page.tsx`

**Imágenes utilizadas:**
- No utiliza imágenes actualmente
- Necesita: Thumbnails de servicios del punto 2

---

## 📁 11. Página de Membresías

**Ubicación:** `app/membresias/page.tsx`

**Imágenes utilizadas:**
- Iconos: Lucide (Crown, Star, Award, Diamond)
- Necesita: Imágenes premium para mostrar exclusividad

---

## 📁 12. Página de Historia

**Ubicación:** `app/historia/page.tsx`

**Imágenes utilizadas:**
- Actualmente usa placeholders
- Necesita: Imágenes de fundadores y timeline

---

## 📁 13. Página de Contacto

**Ubicación:** `app/contacto/page.tsx`

**Imágenes utilizadas:**
- Iconos de contacto: Lucide (Mail, Phone, MapPin)
- Necesita: Imagen de ubicación o mapa

---

## 📁 14. Página de Legal

**Ubicación:** `app/legal/page.tsx`

**Imágenes utilizadas:**
- Iconos legales: Lucide (FileText, Shield, AlertTriangle)
- No necesita imágenes adicionales

---

## 📁 15. Página de Privacy Policy

**Ubicación:** `app/privacy-policy/page.tsx`

**Imágenes utilizadas:**
- Iconos de privacidad: Lucide (Lock, Eye, Shield)
- No necesita imágenes adicionales

---

## 📁 16. Dashboard Admin (Aperture)

**Ubicación:** `app/aperture/page.tsx`

**Imágenes utilizadas:**
- Iconos de admin: Lucide (Calendar, Users, Clock, DollarSign, TrendingUp)
- Avatares de staff (placeholders)
- Necesita: Fotos de staff reales

---

## 📁 17. Dashboard HQ

**Ubicación:** `app/hq/page.tsx`

**Imágenes utilizadas:**
- Iconos de operaciones: Lucide (Building2, Users, Clock, DollarSign)
- Necesita: Imágenes de sucursales

---

## 📁 18. Kiosk System

**Ubicación:** `app/kiosk/[locationId]/page.tsx`

**Imágenes utilizadas:**
- Iconos de navegación: Lucide (ArrowLeft, ArrowRight, CheckCircle)
- Logo de la sucursal actual
- Necesita: Logo de cada ubicación

---

## 📁 19. Booking System

**Ubicación:** `app/booking/*/page.tsx`

**Imágenes utilizadas:**
- Iconos de booking: Lucide (Calendar, Clock, MapPin, User, CreditCard)
- Avatares de clientes (placeholders)
- Necesita: Fotos de servicios

---

## 📁 20. Admin System

**Ubicación:** `app/admin/*/page.tsx`

**Imágenes utilizadas:**
- Iconos de admin: Lucide (Settings, Users, Shield, BarChart3)
- Avatares de staff (placeholders)
- Necesita: Fotos de staff y sucursales

---

## 🎬 Loading Screen & Animations

**Ubicación:** `components/loading-screen.tsx`

**Especificaciones técnicas:**
- **Logo SVG:** `@src/logo.svg` completo
- **Color Loading:** `#E9E1D8` (beige claro elegante)
- **Barra de carga:** `#E9E1D8` (mismo color)
- **Fondo:** `#3F362E` (marrón oscuro elegante)
- **Animación entrada:** Fade in rápido (0.3s)
- **Animación salida:** Fade out desde arriba (0.8s, translateY -100px)
- **Solo en home page:** Primera visita únicamente
- **Tamaño:** 160×110 px (viewBox optimizado)

**Secuencia completa:**
1. Pantalla aparece con fade in rápido
2. Logo SVG en #E9E1D8 sobre fondo #3F362E (aparece instantáneamente)
3. Barra de carga progresa rápidamente (120ms intervalos)
4. Al llegar al 100%, fade out desde arriba
5. Logo hero aparece instantáneamente en #6F5E4F

**Secuencia completa:**
1. Cortinilla aparece con fade in rápido
2. Logo en #E9E1D8 + barra de carga progresando
3. Al completar 100%, fade out desde arriba
4. Logo hero aparece con fade in lento en #6F5E4F

---

## 📋 21. Formbricks Integration

**Ubicación:** `components/formbricks-provider.tsx`

**Configuración:**
- Environment ID para surveys
- API Host URL
- Device detection (mobile/desktop)
- Route change tracking

**Variables de entorno:**
```bash
NEXT_PUBLIC_FORMBRICKS_ENVIRONMENT_ID=your-id
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com
```

**Uso previsto:**
- Encuestas post-experiencia
- Feedback de clientes
- NPS (Net Promoter Score)
- Estudios de satisfacción

---

## 📋 Checklist de Implementación

| Tarea                                     | Estado   | Prioridad |
|-------------------------------------------|----------|-----------|
| Crear estructura de imágenes public            | pending   | alta       |
| Optimizar imágenes A23_VIA_*               | pending   | alta       |
| Implementar logo SVG en Hero sin animación | completed | alta       |
| Implementar logo SVG en Loading sin fade-in| completed | alta       |
| Crear componente animated-logo.tsx         | completed | alta       |
| Crear componente rolling-phrases.tsx       | completed | alta       |
| Crear componente webhook-form.tsx          | completed | alta       |
| Crear componente formbricks-provider.tsx    | completed | media      |
| Crear componente responsive-nav.tsx         | completed | alta       |
| Actualizar colores a #3E352E              | completed | alta       |
| Agregar campo motivo en contacto            | completed | alta       |
| Agregar campos estado/ciudad/socios en franchise | pending | alta |
| Agregar check experiencia belleza en franchise  | pending | alta       |
| Actualizar info franchise a $100k            | completed | alta       |
| Agregar link Contacto en nav/footer         | completed | alta       |
| Agregar imágenes Hero/Fundamento      | pending   | media      |
| Agregar imágenes Historia                | pending   | media      |
| Agregar testimonios                     | pending   | media      |
| Crear galería Before/After          | pending   | baja       |
| Agregar thumbnails de servicios          | pending   | alta       |
| Probar responsive en todos los breakpoints | pending   | alta       |
| Verificar carga de imágenes (lazy load)   | pending   | media      |

---

## 🎨 Especificaciones de Branding

### Colores de Logo
- **Primary:** #6f5e4f (Marrón cálido)
- **Hero sólido:** #6F5E4F (Marrón elegante)
- **Loading SVG:** #E9E1D8 (Beige claro elegante)
- **Loading barra:** #E9E1D8 (Mismo que logo)
- **Background Loading:** #3F362E (Marrón oscuro elegante)
- **Gradient (alternativo):** #6f5e4f → #8B4513 → #5a4a3a

### Colores de Botones
- **Botón primario:** #3E352E (Marrón elegante) - reemplaza --deep-earth
- **Botón secundario:** Gradiente --bone-white → --soft-cream
- **Tarjetas featured:** #3E352E (Marrón elegante)
- **Hover effects:** #3E352E/90 (90% opacidad)

### Fondos de Secciones
- **Hero:** #F5F5DC (Bone White)
- **Services:** #F5F5DC
- **Testimonials:** Blanco con overlay sutil
- **Loading:** #3F362E

### Tipografía
- **Headings:** Playfair Display
- **Body:** Inter o similar sans-serif

---

## 🔧 Guías de Optimización

### Para Imágenes
1. **JPEG para fotos:** Calidad 80-85%, Progresivo
2. **PNG/WebP para gráficos:** Sin pérdida
3. **Lazy loading:** Usar `<img loading="lazy">`
4. **Responsive images:** `srcset` para diferentes tamaños
5. **Compression:** Usar tool (Squoosh, TinyPNG)

### Para SVG
1. **ViewBox óptimo:** Mantener proporción 500:500
2. **Clean path:** Eliminar atributos Inkscape innecesarios
3. **Optimizar tamaño:** Minificar si es posible

---

> **Nota:** Mantener este archivo actualizado con nuevas imágenes o cambios de especificaciones de assets.

