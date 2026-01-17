# Sistema de Kiosko - Guía Rápida de Implementación

## Qué se Implementó

### 1. Base de Datos (SQL)
- ✅ Nuevo rol `kiosk` en el enum `user_role`
- ✅ Tabla `kiosks` con API key authentication
- ✅ Función `generate_kiosk_api_key()` para generar claves únicas
- ✅ Función `is_kiosk()` para verificar permisos
- ✅ Función `get_available_resources_with_priority()` para asignación inteligente
- ✅ Políticas RLS específicas para kiosk
- ✅ Triggers de audit logging para kiosks

### 2. Types (TypeScript)
- ✅ Agregado `kiosk` al tipo `UserRole`
- ✅ Nueva interfaz `Kiosk`
- ✅ Actualizado tipo `CustomerTier` con `black` y `VIP`
- ✅ Agregada tabla `kiosks` al tipo `Database`

### 3. API Routes (Next.js)
- ✅ `POST /api/kiosk/authenticate` - Autenticación de kiosko
- ✅ `GET /api/kiosk/bookings` - Listar bookings de la location
- ✅ `POST /api/kiosk/bookings` - Crear nuevo booking
- ✅ `POST /api/kiosk/bookings/[shortId]/confirm` - Confirmar booking
- ✅ `GET /api/kiosk/resources/available` - Ver recursos disponibles
- ✅ `POST /api/kiosk/walkin` - Crear reserva walk-in

### 4. Componentes UI
- ✅ `BookingConfirmation` - Flujo para confirmar citas
- ✅ `WalkInFlow` - Flujo para crear reservas walk-in
- ✅ `ResourceAssignment` - Muestra recursos con prioridad
- ✅ Página `kiosk/[locationId]/page.tsx` - Pantalla principal

### 5. Documentación
- ✅ Documentación completa en `docs/KIOSK_SYSTEM.md`

## Pasos para Poner en Producción

### 1. Ejecutar la Migración

```bash
# Opción 1: Via Supabase Dashboard
# 1. Ve a https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl/sql
# 2. Copia el contenido de supabase/migrations/20260116000000_add_kiosk_system.sql
# 3. Ejecuta el script

# Opción 2: Via CLI (si tienes configurado supabase db push)
supabase db push
```

### 2. Crear Kioskos

```sql
-- En Supabase SQL Editor
SELECT create_kiosk(
    '<location-uuid>',
    'kiosk-entrada-1',
    'Kiosko Entrada Principal',
    '192.168.1.100'::INET
);

-- Guarda el API key generado en un lugar seguro
```

### 3. Configurar Variables de Entorno

```env
# .env.local o .env.production
NEXT_PUBLIC_KIOSK_API_KEY=la-api-key-que-generaste-en-el-paso-anterior
```

### 4. Acceder al Kiosko

```
https://tu-dominio.com/kiosk/{location-id}
```

Ejemplo:
```
https://kiosk.anchor23.mx/550e8400-e29b-41d4-a716-446655440000
```

## Estructura de Archivos

```
AnchorOS/
├── supabase/
│   └── migrations/
│       └── 20260116000000_add_kiosk_system.sql
├── lib/
│   └── db/
│       └── types.ts
├── app/
│   ├── api/
│   │   └── kiosk/
│   │       ├── authenticate/
│   │       │   └── route.ts
│   │       ├── bookings/
│   │       │   ├── route.ts
│   │       │   └── [shortId]/
│   │       │       └── confirm/
│   │       │           └── route.ts
│   │       ├── resources/
│   │       │   └── available/
│   │       │       └── route.ts
│   │       └── walkin/
│   │           └── route.ts
│   └── kiosk/
│       └── [locationId]/
│           └── page.tsx
├── components/
│   └── kiosk/
│       ├── BookingConfirmation.tsx
│       ├── WalkInFlow.tsx
│       └── ResourceAssignment.tsx
└── docs/
    └── KIOSK_SYSTEM.md
```

## Testing

### 1. Test de Autenticación

```bash
curl -X POST https://tu-dominio.com/api/kiosk/authenticate \
  -H "Content-Type: application/json" \
  -d '{"api_key": "tu-api-key"}'
```

### 2. Test de Confirmación de Cita

```bash
# Buscar booking
curl "https://tu-dominio.com/api/kiosk/bookings?short_id=ABC123" \
  -H "x-kiosk-api-key: tu-api-key"

# Confirmar booking
curl -X POST https://tu-dominio.com/api/kiosk/bookings/ABC123/confirm \
  -H "x-kiosk-api-key: tu-api-key"
```

### 3. Test de Walk-in

```bash
curl -X POST https://tu-dominio.com/api/kiosk/walkin \
  -H "x-kiosk-api-key: tu-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_email": "cliente@email.com",
    "customer_name": "Cliente Prueba",
    "customer_phone": "8112345678",
    "service_id": "service-uuid"
  }'
```

## Características Clave

### Prioridad de Asignación de Recursos

El sistema asigna recursos automáticamente con este orden:

1. **Estaciones (stations)** - Prioridad alta
2. **Salas (rooms)** - Prioridad media
3. **Equipo (equipment)** - Prioridad baja

### Seguridad

- ✅ API key de 64 caracteres aleatorios
- ✅ Restricción opcional por IP
- ✅ Políticas RLS granulares
- ✅ Sin acceso a PII de clientes
- ✅ Audit logging completo

### UX para Cliente

- ✅ Interfaz simple y táctil-friendly
- ✅ Confirmación visual de acciones
- ✅ Validaciones en tiempo real
- ✅ Códigos de 6 caracteres fáciles de recordar
- ✅ Soporte para walk-ins inmediatos

## Próximos Pasos (Opcionales)

1. **Personalización del Diseño**
   - Ajustar colores según branding del salón
   - Agregar logo del salón
   - Modificar textos según preferencia

2. **Integraciones**
   - Google Calendar para sincronización
   - Notificaciones por SMS/email al confirmar
   - Pagos en el kiosko

3. **Funcionalidades Adicionales**
   - Soporte multi-idioma
   - Modo mantenimiento
   - Reportes de uso
   - Soporte para QR codes

## Soporte

Para más detalles, consulta `docs/KIOSK_SYSTEM.md` o revisa el código en los archivos mencionados.
