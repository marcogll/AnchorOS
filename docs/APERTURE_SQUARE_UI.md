# Aperture Design System - Square UI Style

**Documento de estilo de diseño para Aperture (HQ Dashboard)**
**Última actualización: Enero 2026**

---

## 1. Stack Técnico

### Frontend Framework
- **Next.js 14** (App Router) - Ya implementado
- **UI Library**: **Radix UI** (componentes accesibles preconstruidos)
- **Estilizado**: **Tailwind CSS + Square UI custom styling**
- **Icons**: Lucide React (24px, stroke 2px)

### Backend
- **Database**: Supabase (PostgreSQL + RLS)
- **Auth**: Supabase Auth

### Notas Importantes
- **Radix UI es la librería principal** para componentes accesibles
- Solo si Radix NO tiene un componente, usar Headless UI
- Estilizado personalizado con tokens Square UI
- Accesibilidad priorizada (ARIA attributes, keyboard navigation)

---

## 2. Objetivo

Aperture (aperture.anchor23.mx) es el dashboard administrativo y CRM interno de AnchorOS. El estilo de diseño debe seguir principios similares a **SquareUi** pero construido con **Radix UI**:

- Minimalista y limpio
- Cards bien definidas con sombras sutiles
- Espaciado generoso
- Foco en usabilidad y claridad
- Animaciones sutiles
- **Accesibilidad completa** (prioridad Radix)

---

## 3. Componentes Radix UI Utilizados

### Componentes Instalados

```bash
npm install @radix-ui/react-button @radix-ui/react-select @radix-ui/react-tabs \
  @radix-ui/react-dropdown-menu @radix-ui/react-dialog \
  @radix-ui/react-tooltip @radix-ui/react-label @radix-ui/react-switch \
  @radix-ui/react-checkbox
```

### Componentes Radix con Estilizado Square UI

1. **@radix-ui/react-button**
   - Estilos: `primary`, `secondary`, `ghost`, `danger`, `success`, `warning`
   - Squared corners (border-radius: 0 o 4px)
   - Full width con variant `default` (ancho 100%)
   - Transiciones suaves (150ms ease-out)

2. **@radix-ui/react-select**
   - Dropdown con Square UI styling
   - Background: `--ui-bg-card`
   - Border: `--ui-border`
   - Hover: background `--ui-bg-hover`
   - Selected: background `--ui-bg-hover`, font-weight 500

3. **@radix-ui/react-tabs**
   - Tabs con Square UI styling
   - Active indicator: borde inferior 2px solid `--ui-primary`
   - Colors: `--ui-text-primary` para activo, `--ui-text-secondary` para inactivo

4. **@radix-ui/react-dropdown-menu**
   - Menús desplegables Square UI
   - Background: `--ui-bg-card`
   - Border: `--ui-border`
   - Shadow: `--ui-shadow-md`
   - Hover: `background: var(--ui-bg-hover)`

5. **@radix-ui/react-dialog**
   - Modals con Square UI styling
   - Background: `--ui-bg-card`
   - Border: `--ui-border`
   - Radius: `--ui-radius-xl`
   - Shadow: `--ui-shadow-xl`

6. **@radix-ui/react-tooltip**
   - Tooltips con Square UI styling
   - Background: `--ui-text-primary`
- Font size: `--text-sm`
- Padding: `--space-2` / `--space-3`
- Shadow: `--ui-shadow-md`

7. **@radix-ui/react-label**
   - Labels con Square UI styling
   - Color: `--ui-text-primary`
- Font-weight: 500 o 600
- Required indicator con asterisco rojo

8. **@radix-ui/react-switch**
   - Switches con Square UI styling
   - Track: `--ui-border`
- Thumb: `--ui-primary` background
- Thumb radius: 0 (squared)

9. **@radix-ui/react-checkbox**
   - Checkboxes con Square UI styling
   - Border: `--ui-border`
- Checked: Background `--ui-primary`
- Checkmark color: `--ui-text-inverse`

### Componentes Custom (No Radix UI)

1. **Card** - Custom
   - Background: `--ui-bg-card`
   - Border: `--ui-border`
   - Radius: `--ui-radius-lg` (8px)
   - Shadow: `--ui-shadow-md` o `--ui-shadow-lg`
   - Variants: `default`, `elevated`, `bordered`

2. **Avatar** - Custom
   - Iniciales para usuarios sin foto
   - Status indicators: online (green), offline (gray), busy (red)
   - Radius: `--ui-radius-full`

3. **Table** - Custom
   - Headers con `font-weight: 600`
   - Row hover: `background: var(--ui-bg-hover)`
   - Sticky header
   - Sort indicators

4. **Badge** - Custom
   - Variants: `default`, `success`, `warning`, `error`, `info`
   - Small: `text-xs`, Medium: `text-sm`
- Radius: `--ui-radius-full`

---

## 4. Estilos Square UI Componentes

Aperture (aperture.anchor23.mx) es el dashboard administrativo y CRM interno de AnchorOS. El estilo de diseño debe seguir principios similares a SquareUi:

- Minimalista y limpio
- Cards bien definidas con sombras sutiles
- Espaciado generoso
- Foco en usabilidad y claridad
- Animaciones sutiles

---

## 2. Paleta de Colores

### Primarios
```css
--ui-primary: #006AFF;
--ui-primary-hover: #005ED6;
--ui-primary-light: #E6F0FF;
```

### Neutros
```css
--ui-bg: #F6F8FA;
--ui-bg-card: #FFFFFF;
--ui-bg-hover: #F3F4F6;

--ui-border: #E1E4E8;
--ui-border-light: #F3F4F6;
```

### Texto
```css
--ui-text-primary: #24292E;
--ui-text-secondary: #586069;
--ui-text-tertiary: #8B949E;
--ui-text-inverse: #FFFFFF;
```

### Estados
```css
--ui-success: #28A745;
--ui-success-light: #D4EDDA;

--ui-warning: #DBAB09;
--ui-warning-light: #FFF3CD;

--ui-error: #D73A49;
--ui-error-light: #F8D7DA;

--ui-info: #0366D6;
--ui-info-light: #CCE5FF;
```

### Grises Semánticos
```css
--ui-gray-50: #F6F8FA;
--ui-gray-100: #EAECEF;
--ui-gray-200: #D1D5DA;
--ui-gray-300: #B4B9C2;
--ui-gray-400: #8A8A8A;
--ui-gray-500: #586069;
--ui-gray-600: #444C56;
--ui-gray-700: #24292F;
--ui-gray-800: #1F2428;
--ui-gray-900: #0D1117;
```

---

## 3. Bordes y Radii

```css
--ui-radius-sm: 4px;
--ui-radius-md: 6px;
--ui-radius-lg: 8px;
--ui-radius-xl: 12px;
--ui-radius-2xl: 16px;
--ui-radius-full: 9999px;
```

**Uso recomendado:**
- `md` para inputs y small cards
- `lg` para buttons y medium cards
- `xl` para modals y large cards
- `full` para avatares y badges

---

## 4. Sombras (Elevations)

```css
--ui-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.04);
--ui-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
--ui-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
--ui-shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
```

**Uso recomendado:**
- `sm` para tooltips y dropdowns
- `md` para cards y modals
- `lg` para sidebars y panels
- `xl` para overlays y fullscreen modals

---

## 5. Tipografía

### Font Family
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

### Font Sizes
```css
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;         /* 16px */
--text-lg: 1.125rem;      /* 18px */
--text-xl: 1.25rem;       /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
--text-5xl: 3rem;        /* 48px */
```

### Font Weights
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

**Uso recomendado:**
- `text-xs` + `font-medium` para labels
- `text-sm` + `font-normal` para body text
- `text-base` + `font-semibold` para headings
- `text-xl` + `font-bold` para page titles
- `text-3xl` + `font-bold` for hero titles

---

## 6. Espaciado (Spacing)

```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

**Uso recomendado:**
- `space-2` para padding de inputs
- `space-4` para padding de cards
- `space-6` para gaps en grid
- `space-8` para section padding
- `space-12` para margin entre secciones grandes

---

## 7. Z-Index Layers

```css
--z-dropdown: 100;
--z-sticky: 200;
--z-fixed: 300;
--z-modal-backdrop: 400;
--z-modal: 500;
--z-popover: 600;
--z-tooltip: 700;
```

---

## 8. Transiciones y Animaciones

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

**Principios:**
- Todas las transiciones deben usar `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out)
- Animaciones de entrada: `fadeIn`, `slideUp`, `scaleIn`
- Animaciones de salida: `fadeOut`, `slideDown`, `scaleOut`
- No usar animaciones llamativas o distractivas

---

## 9. Grid System

### Breakpoints
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Columnas
- Mobile: 4 columnas
- Tablet: 8 columnas
- Desktop: 12 columnas

### Gutter
- Todos los niveles: 16px (1rem)

---

## 10. Estados de Componentes

### Button States
```css
.btn-primary {
  background: var(--ui-primary);
  color: var(--ui-text-inverse);
  border-radius: var(--ui-radius-lg);
  padding: var(--space-2) var(--space-4);
  transition: all var(--transition-base);
}

.btn-primary:hover {
  background: var(--ui-primary-hover);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  background: var(--ui-gray-300);
  cursor: not-allowed;
  opacity: 0.6;
}
```

### Input States
```css
.input {
  background: var(--ui-bg-card);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-md);
  padding: var(--space-2) var(--space-3);
  transition: border-color var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--ui-primary);
  box-shadow: 0 0 0 3px var(--ui-primary-light);
}

.input:disabled {
  background: var(--ui-gray-50);
  cursor: not-allowed;
}
```

### Card States
```css
.card {
  background: var(--ui-bg-card);
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius-xl);
  box-shadow: var(--ui-shadow-md);
  transition: all var(--transition-base);
}

.card:hover {
  box-shadow: var(--ui-shadow-lg);
  transform: translateY(-2px);
}
```

---

## 11. Layout Pattern

### Sidebar Layout
```typescript
<Sidebar>
  width: 256px;
  height: 100vh;
  background: var(--ui-gray-50);
  border-right: 1px solid var(--ui-border);
  position: fixed;
  left: 0;
  top: 0;
</Sidebar>

<MainContent>
  margin-left: 256px;
  background: var(--ui-bg);
  min-height: 100vh;
</MainContent>
```

### Card Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>
```

---

## 12. Accesibilidad

### Contrast Ratios
- Background `--ui-bg-card` + Text `--ui-text-primary`: 12.4:1 ✅ (AAA)
- Background `--ui-primary` + Text `--ui-text-inverse`: 4.6:1 ✅ (AA)
- Background `--ui-success` + Text `--ui-text-inverse`: 4.5:1 ✅ (AA)

### Focus States
- Todos los elementos interactivos deben tener focus visible
- Usar `outline: 2px solid var(--ui-primary)` con offset

### Keyboard Navigation
- Todas las acciones deben ser accesibles por teclado
- Tab order lógico y predecible

---

## 13. Dark Mode (Opcional)

No implementado actualmente, pero preparado con:
```css
@media (prefers-color-scheme: dark) {
  :root {
    --ui-bg: #0D1117;
    --ui-bg-card: #161B22;
    --ui-text-primary: #F0F6FC;
    --ui-text-secondary: #8B949E;
    --ui-border: #30363D;
  }
}
```

---

## 14. Iconografía

- Tamaño estándar: 24px
- Stroke width: 2px
- Color: hereda del texto o usa variables de color

### Icon Sizes
```css
--icon-xs: 16px;
--icon-sm: 20px;
--icon-md: 24px; /* estándar */
--icon-lg: 32px;
--icon-xl: 40px;
```

---

## 15. Componentes Específicos de Aperture

### Stats Card
```typescript
<StatsCard>
  icon: IconComponent;
  title: string;
  value: number | string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
</StatsCard>
```

### Booking Card
```typescript
<BookingCard>
  customerName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'completed' | 'no_show';
  staff: StaffInfo;
</BookingCard>
```

### Calendar Time Slot
```typescript
<TimeSlot>
  time: string;
  isAvailable: boolean;
  booking?: BookingInfo;
  onClick: () => void;
</TimeSlot>
```

---

## 16. Responsive Adaptations

### Mobile (< 640px)
- Sidebar: hidden behind hamburger menu
- Table: horizontal scroll
- Grid: 1 columna
- Modal: fullscreen

### Tablet (640px - 1024px)
- Sidebar: collapsable (64px when collapsed)
- Table: horizontal scroll if needed
- Grid: 2 columnas
- Modal: centered with max-width

### Desktop (> 1024px)
- Sidebar: fixed 256px
- Table: sticky header
- Grid: 3-4 columnas
- Modal: centered with max-width

---

## 17. Convenciones de Código

### Naming Convention
```typescript
// Componentes: PascalCase
const StatsCard = () => { }

// Props: camelCase
interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
}

// CSS classes: kebab-case
.stats-card { }

// CSS variables: kebab-case con prefijo 'ui-'
--ui-primary: #006AFF;
```

### Estructura de Archivos
```
components/hq/
├── StatsCard.tsx
├── BookingCard.tsx
├── MultiColumnCalendar.tsx
├── StaffTable.tsx
├── ResourceGrid.tsx
└── index.ts
```

---

## 18. Checklist de Implementación

Antes de considerar un componente como "completado":

- [ ] Implementa todos los estados (default, hover, focus, active, disabled)
- [ ] Usa variables CSS del sistema
- [ ] Tiene accesibilidad (contrast, keyboard, focus)
- [ ] Es responsive (mobile, tablet, desktop)
- [ ] Tiene animaciones sutiles (150-300ms)
- [ ] Tiene TypeScript types completos
- [ ] Está documentado con JSDoc
- [ ] Tiene ejemplos de uso

---

## 19. Recursos

- **SquareUi Kit**: https://squareui.com
- **Inter Font**: https://fonts.google.com/specimen/Inter
- **Tailwind CSS**: https://tailwindcss.com
- **Lucide Icons**: https://lucide.dev

---

## 20. Notas Importantes

### Principios de Diseño
1. **Claridad sobre creatividad**: La información debe ser fácil de entender, no decorativa
2. **Consistencia**: Todos los componentes similares deben comportarse igual
3. **Minimalismo**: Menos es más. Elimina elementos innecesarios
4. **Feedback**: Las acciones deben dar feedback inmediato (loading, success, error)
5. **Accesibilidad**: Todo debe ser accesible por teclado y screen readers

### Lo que NO hacer
- ❌ No usar gradients
- ❌ No usar sombras duras
- ❌ No usar colores saturados
- ❌ No usar animaciones llamativas
- ❌ No usar UI densa
- ❌ No usar efectos innecesarios

### Lo que SÍ hacer
- ✅ Usar espacio negativo dominante
- ✅ Usar tipografía legible
- ✅ Usar animaciones sutiles
- ✅ Usar contrastes apropiados
- ✅ Usar focus states visibles
- ✅ Usar feedback inmediato
- ✅ Usar grid systems consistentes
- ✅ Usar espaciado generoso

---

## 21. Changelog

### 2026-01-17
- Documento inicial creado
- Definición de paleta de colores
- Definición de sistema de tipografía
- Definición de principios de diseño
