# Sistema de Enrollment - Guía de Implementación

## Resumen

El sistema de enrollment permite a los administradores agregar nuevos usuarios (staff, artists, managers) y kiosks al sistema SalonOS mediante una interfaz web segura.

---

## Arquitectura

### Componentes

#### 1. Frontend
- **Ruta**: `/admin/enrollment`
- **Tecnología**: Next.js 14 App Router + React
- **Características**:
  - Autenticación por admin key
  - Tabs separados para Staff y Kiosks
  - Listado de usuarios/kiosks existentes
  - Formularios validados

#### 2. API Routes

##### `/api/admin/locations`
- **GET**: Obtener todas las locations activas
- **Auth**: Bearer token (ADMIN_ENROLLMENT_KEY)

##### `/api/admin/users`
- **GET**: Listar staff members (filtrable por location y role)
- **POST**: Crear nuevo staff member
- **Campos requeridos**:
  - `location_id` - UUID de la location
  - `role` - admin | manager | staff | artist
  - `display_name` - Nombre público del staff
  - `email` - Email para autenticación
  - `password` - Contraseña inicial
  - `first_name`, `last_name` - Nombres para perfil
  - `phone` - Teléfono (opcional)
- **Acción**:
  1. Crea usuario en Supabase Auth
  2. Crea registro en tabla `staff`
  3. Devuelve respuesta con éxito

##### `/api/admin/kiosks`
- **GET**: Listar kiosks (filtrable por location)
- **POST**: Crear nuevo kiosk
- **Campos requeridos**:
  - `location_id` - UUID de la location
  - `device_name` - Identificador único del dispositivo
  - `display_name` - Nombre legible del kiosko
  - `ip_address` - IP para restricción (opcional)
- **Acción**:
  1. Llama función SQL `create_kiosk()`
  2. Genera API key de 64 caracteres
  3. Devuelve API key (solo se muestra una vez)

---

## Instalación

### 1. Configurar Variables de Entorno

Agrega a tu archivo `.env.local`:

```env
# Admin Enrollment Key (genera una segura)
ADMIN_ENROLLMENT_KEY=your-secure-admin-key-here-change-me
```

### 2. Instalar Dependencias Necesarias

```bash
npm install @radix-ui/react-label @radix-ui/react-select @radix-ui/react-tabs lucide-react clsx tailwind-merge
```

### 3. Verificar Archivos Creados

Deberías tener estos archivos:

```
app/
├── admin/
│   └── enrollment/
│       └── page.tsx
└── api/
    └── admin/
        ├── locations/route.ts
        ├── users/route.ts
        └── kiosks/route.ts

components/
└── ui/
    ├── button.tsx
    ├── card.tsx
    ├── input.tsx
    ├── label.tsx
    ├── select.tsx
    └── tabs.tsx

lib/
└── utils.ts
```

### 4. Ejecutar Migraciones

```bash
npx supabase db push
```

Esto debería aplicar:
- `20260116000000_add_kiosk_system.sql`
- `20260116010000_update_resources.sql`
- `20260116020000_cleanup_and_fix_resources.sql`

---

## Uso del Sistema

### 1. Acceder al Sistema

Navega a: `http://localhost:3000/admin/enrollment`

### 2. Autenticación

1. Ingresa tu `ADMIN_ENROLLMENT_KEY`
2. Haz clic en "Access Enrollment System"
3. La clave se guardará en localStorage para futuras sesiones

### 3. Crear Staff Member

1. Selecciona la tab "Staff Members"
2. Completa el formulario:
   - **Location**: Selecciona del dropdown
   - **Role**: Admin, Manager, Staff, o Artist
   - **Display Name**: e.g., "María García"
   - **First Name**: e.g., "María"
   - **Last Name**: e.g., "García"
   - **Email**: e.g., "maria@salon.com"
   - **Password**: Contraseña inicial
   - **Phone**: (opcional)
3. Haz clic en "Create Staff Member"
4. Verifica que aparezca en la lista de "Existing Staff Members"

### 4. Crear Kiosk

1. Selecciona la tab "Kiosks"
2. Completa el formulario:
   - **Location**: Selecciona del dropdown
   - **Device Name**: Identificador único (e.g., "kiosk-entrance-1")
   - **Display Name**: Nombre legible (e.g., "Kiosko Entrada Principal")
   - **IP Address**: IP para restricción (opcional, e.g., "192.168.1.100")
3. Haz clic en "Create Kiosk"
4. ⚠️ **IMPORTANTE**: Guarda el API key generado en un lugar seguro
   - Solo se mostrará una vez
   - Debes agregarla a `NEXT_PUBLIC_KIOSK_API_KEY` en .env.local
   - O compartirla manualmente al dispositivo del kiosko

---

## Seguridad

### Autenticación

- **Método**: Bearer token en header `Authorization`
- **Validación**: Token debe coincidir con `ADMIN_ENROLLMENT_KEY`
- **Almacenamiento**: Cliente guarda token en localStorage

### Protección de Rutas

Las API routes verifican:
```typescript
const authHeader = request.headers.get('authorization')
const token = authHeader.replace('Bearer ', '')
if (token !== process.env.ADMIN_ENROLLMENT_KEY) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### API Keys de Kioskos

- Generadas aleatoriamente (64 caracteres)
- Solo se muestran una vez
- Deben guardarse de forma segura
- Se pueden rotar creando un nuevo kiosko

---

## Troubleshooting

### Error: "Unauthorized"

**Causa**: ADMIN_ENROLLMENT_KEY incorrecto o no configurado

**Solución**:
1. Verifica que `ADMIN_ENROLLMENT_KEY` esté en `.env.local`
2. Reinicia el servidor: `npm run dev`
3. Limpia localStorage y re-autentica

### Error: "Missing required fields"

**Causa**: Faltan campos obligatorios en el formulario

**Solución**:
- Staff: location_id, role, display_name, email, password
- Kiosk: location_id, device_name, display_name

### Error: "A kiosk with this device_name already exists"

**Causa**: Ya existe un kiosko con ese nombre

**Solución**:
1. Verifica en la lista de kiosks existentes
2. Usa un `device_name` diferente
3. O elimina el kiosko existente primero

### Error: "Failed to create auth user"

**Causa**: Email ya existe en Supabase Auth

**Solución**:
1. El usuario debe existir
2. Usa un email diferente
3. O contacta al usuario para que restablezca su contraseña

---

## Testing

### Test de Creación de Staff

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-key" \
  -d '{
    "location_id": "location-uuid",
    "role": "artist",
    "display_name": "Test Artist",
    "first_name": "Test",
    "last_name": "Artist",
    "email": "test@salon.com",
    "password": "test123",
    "phone": "+52 55 1234 5678"
  }'
```

### Test de Creación de Kiosk

```bash
curl -X POST http://localhost:3000/api/admin/kiosks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-admin-key" \
  -d '{
    "location_id": "location-uuid",
    "device_name": "kiosk-test-1",
    "display_name": "Test Kiosk",
    "ip_address": "192.168.1.200"
  }'
```

### Test de Listado de Locations

```bash
curl http://localhost:3000/api/admin/locations \
  -H "Authorization: Bearer your-admin-key"
```

---

## Integración con Sistema de Kiosko

### Después de Crear un Kiosk

1. **Obtener la API Key** (solo se muestra una vez)
2. **Configurar en Frontend del Kiosko**:

En `.env.local`:
```env
NEXT_PUBLIC_KIOSK_API_KEY=la-api-key-generada
```

3. **Probar Acceso al Kiosko**:

Navega a: `http://localhost:3000/kiosk/{location-id}`

El kiosko debería autenticarse automáticamente.

---

## Próximas Mejoras

### Funcionalidades Futuras

- [ ] Desactivar staff/kiosks en lugar de eliminar
- [ ] Editar staff/kiosks existentes
- [ ] Ver historial de cambios (audit logs)
- [ ] Exportar lista de staff a CSV
- [ ] Asignar múltiples locations a un staff member
- [ ] Validación de email único antes de crear

### Seguridad Futura

- [ ] Rate limiting para prevenir abusos
- [ ] 2FA para el sistema de enrollment
- [ ] Logs de acceso al sistema de enrollment
- [ ] Notificación de creación de usuario

---

## Documentación Relacionada

- `KIOSK_SYSTEM.md` - Documentación completa del sistema de kiosko
- `KIOSK_IMPLEMENTATION.md` - Guía rápida de implementación
- `TASKS.md` - Plan de ejecución del proyecto
- `PRD.md` - Especificación funcional del sistema

---

## Soporte

Para problemas técnicos:
1. Revisa los logs del servidor
2. Verifica que las migraciones se aplicaron correctamente
3. Confirma que las variables de entorno están configuradas
4. Consulta la documentación de Supabase Auth

---

**Fecha**: 16 de Enero, 2026
**Versión**: v1.0.0
**Estado**: Completado y listo para producción
