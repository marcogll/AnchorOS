# Sistema de Kiosko - AnchorOS

## Resumen

El sistema de kiosko permite a los clientes interactuar con el salón mediante pantallas táctiles en la entrada, facilitando la confirmación de citas y la creación de reservas walk-in sin necesidad de personal.

## Características

### 1. Confirmación de Citas
- Los clientes pueden confirmar su llegada ingresando el código de 6 caracteres (short_id) de su cita
- Verificación de estado de la cita (pending → confirmed)
- Visualización de detalles limitados (sin PII)

### 2. Reservas Walk-in
- Creación de reservas inmediatas para clientes sin cita previa
- Asignación automática de recursos con prioridad
- Selección de servicios disponibles
- Registro de datos básicos del cliente

### 3. Asignación de Recursos con Prioridad
- **Prioridad 1 (Alta):** Estaciones (stations)
- **Prioridad 2 (Media):** Salas (rooms)
- **Prioridad 3 (Baja):** Equipo (equipment)

## Arquitectura

### Base de Datos

#### Nueva Tabla: `kiosks`
```sql
CREATE TABLE kiosks (
    id UUID PRIMARY KEY,
    location_id UUID REFERENCES locations(id),
    device_name VARCHAR(100) UNIQUE,
    display_name VARCHAR(100),
    API key VARCHAR(64) UNIQUE,
    ip_address INET,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

#### Nuevo Rol: `'kiosk'`
Agregado al enum `user_role` para manejar permisos específicos.

### API Routes

#### Autenticación
- `POST /api/kiosk/authenticate` - Valida API key y devuelve información del kiosko

#### Bookings
- `GET /api/kiosk/bookings?short_id={id}` - Busca booking por short_id
- `GET /api/kiosk/bookings?date={date}` - Lista bookings de una fecha
- `POST /api/kiosk/bookings` - Crea nuevo booking
- `POST /api/kiosk/bookings/{shortId}/confirm` - Confirma booking (pending → confirmed)

#### Recursos
- `GET /api/kiosk/resources/available?start_time={...}&end_time={...}` - Lista recursos disponibles con prioridad

#### Walk-in
- `POST /api/kiosk/walkin` - Crea reserva walk-in inmediata

### Componentes UI

- `BookingConfirmation` - Flujo para confirmar citas existentes
- `WalkInFlow` - Flujo completo para crear reservas walk-in
- `ResourceAssignment` - Muestra recursos disponibles con prioridad

## Seguridad

### Autenticación
- Basada en API key (64 caracteres aleatorios)
- Validación en cada request vía header `x-kiosk-api-key`

### Permisos RLS

#### El Kiosko PUEDE:
- Ver bookings de su location (solo: short_id, start_time, status)
- Crear bookings walk-in (clientes sin pre-reserva)
- Confirmar bookings existentes (solo cambiar status → confirmed)
- Ver/consultar resources disponibles de su location
- Ver services activos
- Ver datos básicos de su location

#### El Kiosko NO PUEDE:
- Ver datos sensibles del cliente (PII)
- Ver bookings de otras locations
- Modificar bookings existentes (solo status → confirmed)
- Cancelar bookings
- Ver datos de otros kioskos

## Instalación

### 1. Ejecutar Migración SQL

```bash
# En Supabase SQL Editor o via CLI
psql -h <your-host> -U <your-user> -d <your-db> -f supabase/migrations/20260116000000_add_kiosk_system.sql
```

### 2. Configurar Variables de Entorno

```env
NEXT_PUBLIC_KIOSK_API_KEY=your-kiosk-api-key-here
```

### 3. Crear Kioskos

```sql
SELECT create_kiosk(
    '<location-id>',
    'kiosk-entrance-1',
    'Kiosko Entrada Principal',
    '192.168.1.100'::INET
);
```

**IMPORTANTE:** Guarda la API key generada de forma segura. Solo se muestra una vez.

## Uso

### Iniciar Kiosko

1. Navega a `/kiosk/{locationId}` en tu navegador
2. El kiosko se autentica automáticamente usando la API key configurada
3. Verás la pantalla principal con dos opciones:
   - **Confirmar Cita** - Para clientes con cita previa
   - **Reserva Inmediata** - Para clientes sin cita (walk-in)

### Flujo de Confirmación de Cita

1. El cliente ingresa el código de 6 caracteres de su cita
2. El sistema busca el booking
3. Si existe y está en estado `pending`, muestra los detalles
4. El cliente confirma su llegada
5. El status cambia a `confirmed`
6. Se muestra confirmación visual

### Flujo de Walk-in

1. Seleccionar servicio disponible
2. Ingresar datos del cliente (nombre, email, teléfono opcional)
3. Verificar disponibilidad de recursos
4. Confirmar reserva
5. El sistema asigna automáticamente:
   - Artista disponible (prioridad: staff → manager → artist)
   - Recurso disponible con mayor prioridad
6. Se muestra código de reserva (short_id)

## Prioridad de Asignación de Recursos

La función `get_available_resources_with_priority()` ordena recursos por:

1. **Tipo** (station > room > equipment)
2. **Nombre** (alfabético)

Esto asegura que los kioskos siempre asignen la mejor opción disponible.

## API Key Management

### Generar Nueva API Key

```sql
-- Para un kiosko existente (no soportado directamente)
-- Debes crear un nuevo kiosko y borrar el antiguo

DELETE FROM kiosks WHERE id = '<old-kiosk-id>';

SELECT create_kiosk(
    '<location-id>',
    'kiosk-new',
    'Nuevo Kiosko',
    NULL
);
```

### Validar API Key en Frontend

```typescript
const response = await fetch('/api/kiosk/authenticate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: process.env.NEXT_PUBLIC_KIOSK_API_KEY
  })
})
```

## Monitoreo y Auditoría

### Audit Logs

Todas las acciones del kiosko se registran en `audit_logs` con:
- `performed_by_role = 'kiosk'`
- `entity_type = 'bookings'` u otros
- `action = 'create' | 'update' | 'status_change'`

### Consultas Útiles

```sql
-- Ver kioskos activos
SELECT device_name, display_name, ip_address, location_id 
FROM kiosks 
WHERE is_active = true;

-- Ver bookings creados por kiosko hoy
SELECT * FROM bookings
WHERE DATE(created_at) = CURRENT_DATE
AND metadata @> '{"source": "kiosk"}';

-- Ver confirmaciones de kiosko
SELECT * FROM audit_logs
WHERE performed_by_role = 'kiosk'
AND action = 'status_change'
AND created_at >= NOW() - INTERVAL '1 hour';
```

## Troubleshooting

### Error: "Invalid API key"
- Verifica que la API key esté configurada en `.env`
- Verifica que el kiosko exista y esté activo en la base de datos
- Revisa los logs del servidor

### Error: "No resources available"
- Verifica que hay recursos activos en la location
- Revisa los horarios de los bookings existentes
- Asegúrate de que el service_id es válido

### Error: "Booking not found in kiosk location"
- Verifica que el short_id es correcto
- Confirma que el booking pertenece a la location del kiosko

## Mejoras Futuras

- [ ] Soporte para múltiples idiomas
- [ ] Integración con pagos en el kiosko
- [ ] Sistema de notificaciones al confirmar cita
- [ ] Modo mantenimiento para kioskos individuales
- [ ] Reportes de uso de kioskos
- [ ] Soporte para escanear QR codes en lugar de ingresar short_id
- [ ] Sincronización offline
- [ ] Soporte para devices móviles (tablets)
