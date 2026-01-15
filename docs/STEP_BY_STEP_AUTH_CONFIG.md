# 🔐 Guía Paso a Paso - Configuración de Auth en Supabase Dashboard

## 🎯 Objetivo

Configurar el sistema de autenticación de Supabase para que los usuarios puedan:
- Registrarse con email
- Iniciar sesión con Magic Links
- Tener roles asignados (Admin, Manager, Staff, Artist, Customer)

---

## 📋 Paso 1: Abrir Configuración de Auth

1. Ve a: **https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl**
2. En el menú lateral, haz clic en **"Authentication"**
3. Haz clic en **"Providers"**

---

## 🔑 Paso 2: Configurar Email Provider

### 2.1 Habilitar Email Auth

1. En la sección **"Providers"**, busca **"Email"**
2. Haz clic en el botón **"Enable"**
3. Configura las siguientes opciones:

**Email Confirmation:**
```
Confirm email: ON (activado)
```

**Email Templates:**
- **Confirm signup:** Habilitar
- **Reset password:** Habilitar
- **Email change:** Habilitar (opcional)
- **Magic Link:** Habilitar (opcional)

### 2.2 Configurar Site URL

1. En la sección **"URL Configuration"**, configura:
   - **Site URL:** `http://localhost:3000`
   - **Redirect URLs:** `http://localhost:3000/auth/callback`

**Nota:** Para producción, cambiar `localhost:3000` por tu dominio de producción.

### 2.3 Configurar SMTP (Opcional)

Para desarrollo, puedes usar el SMTP por defecto de Supabase.

Si deseas usar tu propio servidor SMTP:

1. Ve a **"Authentication" → "URL Configuration"**
2. Desplázate hasta **"SMTP Settings"**
3. Configura:
   - **SMTP Host:** `smtp.gmail.com` (ejemplo)
   - **SMTP Port:** `587`
   - **SMTP User:** `tu-email@gmail.com`
   - **SMTP Password:** `tu-app-password`
   - **Sender Email:** `tu-email@gmail.com`
   - **Sender Name:** `SalonOS`

---

## 📱 Paso 3: Configurar SMS Provider (Opcional)

Para autenticación por SMS (opcional para inicio):

### 3.1 Habilitar Twilio

1. En **"Providers"**, busca **"Phone"**
2. Haz clic en **"Enable"**
3. Selecciona **"Twilio"** como proveedor
4. Configura:
   - **Account SID:** Obtenido de Twilio Dashboard
   - **Auth Token:** Obtenido de Twilio Dashboard
   - **Twilio Phone Number:** `+14155238886` (o tu número de Twilio)
   - **Message Service SID:** (opcional)

### 3.2 Verificar SMS Test

1. En la sección **"Phone"**, haz clic en **"Test"**
2. Ingresa un número de teléfono de prueba
3. Envía un mensaje de prueba

---

## 🧑 Paso 4: Crear Usuarios de Staff

### 4.1 Obtener User IDs del Seed

Primero, necesitamos los `user_id` que se crearon en el seed. Ejecuta esta consulta en el SQL Editor:

```sql
SELECT
    s.display_name,
    s.role,
    s.user_id as supabase_user_id_to_create
FROM staff s
ORDER BY s.role, s.display_name;
```

Copia los `user_id` de cada miembro del staff.

### 4.2 Crear Usuarios en Supabase Auth

**Opción A: Manual (recomendado para empezar)**

1. Ve a **"Authentication" → "Users"**
2. Haz clic en **"Add user"**
3. Para cada miembro del staff, crea un usuario:

**Admin Principal:**
- **Email:** `admin@salonos.com`
- **Password:** `Admin123!` (o una segura)
- **Auto Confirm User:** ON
- **User Metadata (opcional):**
  ```json
  {
    "role": "admin",
    "display_name": "Admin Principal"
  }
  ```

**Manager Centro:**
- **Email:** `manager.centro@salonos.com`
- **Password:** `Manager123!`
- **Auto Confirm User:** ON
- **User Metadata:**
  ```json
  {
    "role": "manager",
    "display_name": "Manager Centro"
  }
  ```

**Manager Polanco:**
- **Email:** `manager.polanco@salonos.com`
- **Password:** `Manager123!`
- **Auto Confirm User:** ON
- **User Metadata:**
  ```json
  {
    "role": "manager",
    "display_name": "Manager Polanco"
  }
  ```

**Staff Coordinadora:**
- **Email:** `staff.coordinadora@salonos.com`
- **Password:** `Staff123!`
- **Auto Confirm User:** ON
- **User Metadata:**
  ```json
  {
    "role": "staff",
    "display_name": "Staff Coordinadora"
  }
  ```

**Artist María García:**
- **Email:** `artist.maria@salonos.com`
- **Password:** `Artist123!`
- **Auto Confirm User:** ON
- **User Metadata:**
  ```json
  {
    "role": "artist",
    "display_name": "Artist María García"
  }
  ```

**Artist Ana Rodríguez:**
- **Email:** `artist.ana@salonos.com`
- **Password:** `Artist123!`
- **Auto Confirm User:** ON
- **User Metadata:**
  ```json
  {
    "role": "artist",
    "display_name": "Artist Ana Rodríguez"
  }
  ```

**Artist Carla López:**
- **Email:** `artist.carla@salonos.com`
- **Password:** `Artist123!`
- **Auto Confirm User:** ON
- **User Metadata:**
  ```json
  {
    "role": "artist",
    "display_name": "Artist Carla López"
  }
  ```

**Artist Laura Martínez:**
- **Email:** `artist.laura@salonos.com`
- **Password:** `Artist123!`
- **Auto Confirm User:** ON
- **User Metadata:**
  ```json
  {
    "role": "artist",
    "display_name": "Artist Laura Martínez"
  }
  ```

**Opción B: Automática con SQL (más avanzado)**

Si prefieres crear usuarios automáticamente con SQL y luego actualizar sus IDs en la tabla staff:

1. Crea una tabla temporal para mapear los usuarios:
```sql
-- Primero, crea los usuarios en Supabase Auth manualmente (opción A)
-- Luego ejecuta esta consulta para obtener sus IDs:
SELECT
    id as auth_user_id,
    email
FROM auth.users
ORDER BY created_at DESC
LIMIT 8;
```

2. Actualiza la tabla staff con los nuevos IDs:
```sql
-- Ejemplo para actualizar un usuario
UPDATE staff
SET user_id = 'NUEVO_AUTH_USER_ID_DESDE_SUPABASE'
WHERE display_name = 'Artist María García';
```

---

## 👩 Step 5: Crear Usuarios de Customers

### 5.1 Obtener User IDs del Seed

Ejecuta esta consulta en el SQL Editor:

```sql
SELECT
    c.email,
    c.first_name || ' ' || c.last_name as full_name,
    c.tier,
    c.user_id as supabase_user_id_to_create
FROM customers c
ORDER BY c.last_name, c.first_name;
```

### 5.2 Crear Usuarios en Supabase Auth

1. Ve a **"Authentication" → "Users"**
2. Haz clic en **"Add user"**
3. Para cada customer, crea un usuario:

**Sofía Ramírez (Gold):**
- **Email:** `sofia.ramirez@example.com`
- **Password:** `Customer123!`
- **Auto Confirm User:** ON
- **User Metadata:**
  ```json
  {
    "tier": "gold",
    "display_name": "Sofía Ramírez"
  }
  ```

**Valentina Hernández (Gold):**
- **Email:** `valentina.hernandez@example.com`
- **Password:** `Customer123!`
- **Auto Confirm User:** ON
- **User Metadata:**
  ```json
  {
    "tier": "gold",
    "display_name": "Valentina Hernández"
  }
  ```

**Camila López (Free):**
- **Email:** `camila.lopez@example.com`
- **Password:** `Customer123!`
- **Auto Confirm User:** ON
- **User Metadata:**
  ```json
  {
    "tier": "free",
    "display_name": "Camila López"
  }
  ```

**Isabella García (Gold):**
- **Email:** `isabella.garcia@example.com`
- **Password:** `Customer123!`
- **Auto Confirm User:** ON
- **User Metadata:**
  ```json
  {
    "tier": "gold",
    "display_name": "Isabella García"
  }
  ```

---

## 🔗 Step 6: Actualizar Tablas con User IDs

### 6.1 Actualizar Staff

Después de crear los usuarios en Supabase Auth, necesitas actualizar la tabla `staff` con los nuevos `user_id`.

1. Obten los nuevos `id` de `auth.users`:

```sql
SELECT
    id as auth_user_id,
    email,
    raw_user_meta_data->>'role' as role,
    raw_user_meta_data->>'display_name' as display_name
FROM auth.users
WHERE raw_user_meta_data->>'role' IN ('admin', 'manager', 'staff', 'artist')
ORDER BY raw_user_meta_data->>'role', raw_user_meta_data->>'display_name';
```

2. Actualiza la tabla `staff`:

```sql
-- Ejemplo para actualizar un usuario de staff
UPDATE staff
SET user_id = 'NUEVO_AUTH_USER_ID_DESDE_SUPABASE'
WHERE display_name = 'Artist María García';

-- Repite para todos los usuarios de staff
```

### 6.2 Actualizar Customers

1. Obten los nuevos `id` de `auth.users`:

```sql
SELECT
    id as auth_user_id,
    email,
    raw_user_meta_data->>'tier' as tier,
    raw_user_meta_data->>'display_name' as display_name
FROM auth.users
WHERE email LIKE '%example.com'
ORDER BY raw_user_meta_data->>'display_name';
```

2. Actualiza la tabla `customers`:

```sql
-- Ejemplo para actualizar un customer
UPDATE customers
SET user_id = 'NUEVO_AUTH_USER_ID_DESDE_SUPABASE'
WHERE email = 'sofia.ramirez@example.com';

-- Repite para todos los customers
```

---

## 🧪 Step 7: Verificar Usuarios Creados

### 7.1 Verificar en Supabase Auth

1. Ve a **"Authentication" → "Users"**
2. Verifica que todos los usuarios estén listados
3. Debes ver:
   - 8 usuarios de staff (admin, managers, staff, artists)
   - 4 usuarios de customers

### 7.2 Verificar en Base de Datos

Ejecuta esta consulta en el SQL Editor:

```sql
-- Verificar staff con user_id actualizado
SELECT
    'STAFF' as type,
    s.display_name,
    s.role,
    s.user_id is not null as user_id_set,
    au.email as auth_user_email,
    au.raw_user_meta_data->>'display_name' as auth_display_name
FROM staff s
LEFT JOIN auth.users au ON s.user_id = au.id
ORDER BY s.role, s.display_name;
```

**Resultado esperado:**
```
type  | display_name           | role    | user_id_set | auth_user_email
STAFF | Admin Principal        | admin   | true        | admin@salonos.com
STAFF | Manager Centro         | manager | true        | manager.centro@salonos.com
STAFF | Manager Polanco        | manager | true        | manager.polanco@salonos.com
STAFF | Staff Coordinadora    | staff   | true        | staff.coordinadora@salonos.com
STAFF | Artist María García     | artist  | true        | artist.maria@salonos.com
STAFF | Artist Ana Rodríguez    | artist  | true        | artist.ana@salonos.com
STAFF | Artist Carla López      | artist  | true        | artist.carla@salonos.com
STAFF | Artist Laura Martínez   | artist  | true        | artist.laura@salonos.com
```

```sql
-- Verificar customers con user_id actualizado
SELECT
    'CUSTOMER' as type,
    c.first_name || ' ' || c.last_name as name,
    c.tier,
    c.user_id is not null as user_id_set,
    au.email as auth_user_email,
    au.raw_user_meta_data->>'tier' as auth_tier
FROM customers c
LEFT JOIN auth.users au ON c.user_id = au.id
ORDER BY c.last_name, c.first_name;
```

**Resultado esperado:**
```
type     | name                  | tier | user_id_set | auth_user_email
CUSTOMER | Camila López           | free | true        | camila.lopez@example.com
CUSTOMER | Isabella García         | gold | true        | isabella.garcia@example.com
CUSTOMER | Sofía Ramírez         | gold | true        | sofia.ramirez@example.com
CUSTOMER | Valentina Hernández    | gold | true        | valentina.hernandez@example.com
```

---

## 🎨 Step 8: Configurar Email Templates (Opcional)

### 8.1 Confirm Signup Template

1. Ve a **"Authentication" → "Email Templates"**
2. Haz clic en **"Confirm signup"**
3. Personaliza el template:

```html
<h2>Bienvenida a SalonOS</h2>

<p>Hola {{ .Email }}</p>

<p>Gracias por registrarte en SalonOS. Tu cuenta ha sido creada exitosamente.</p>

<p>Si no creaste esta cuenta, por favor ignora este email.</p>

<p>Saludos,<br>El equipo de SalonOS</p>
```

### 8.2 Reset Password Template

1. Haz clic en **"Reset password"**
2. Personaliza el template:

```html
<h2>Restablecer Contraseña - SalonOS</h2>

<p>Hola {{ .Email }}</p>

<p>Hemos recibido una solicitud para restablecer tu contraseña en SalonOS.</p>

<p><a href="{{ .ConfirmationURL }}">Haz clic aquí para restablecer tu contraseña</a></p>

<p>Este enlace expirará en 24 horas.</p>

<p>Si no solicitaste restablecer tu contraseña, por favor ignora este email.</p>

<p>Saludos,<br>El equipo de SalonOS</p>
```

---

## ✅ Step 9: Probar Autenticación

### 9.1 Probar Login con Staff

1. Ve a una página de login (aún no creada en el frontend)
2. Intenta iniciar sesión con:
   - **Email:** `admin@salonos.com`
   - **Password:** `Admin123!`

### 9.2 Probar Login con Customer

1. Intenta iniciar sesión con:
   - **Email:** `sofia.ramirez@example.com`
   - **Password:** `Customer123!`

### 9.3 Verificar Token JWT

Ejecuta esta consulta en el SQL Editor después de iniciar sesión:

```sql
-- Verificar sesión actual
SELECT
    auth.uid() as current_user_id,
    auth.email() as current_user_email,
    auth.role() as current_user_role
FROM (SELECT 1) as dummy;
```

---

## 🔐 Step 10: Configurar Policies de RLS con Auth

Las políticas de RLS ya están configuradas en la base de datos. Ahora que los usuarios están creados en Supabase Auth, las políticas deberían funcionar correctamente.

### Verificar que las Políticas Funcionan

Ejecuta esta consulta en el SQL Editor con diferentes usuarios:

```sql
-- Probar como Admin
-- (Inicia sesión como admin en Supabase Dashboard primero)
SELECT
    'ADMIN TEST' as test_type,
    s.display_name,
    s.role,
    s.phone as can_see_phone
FROM staff s
LIMIT 1;

-- Esta consulta debería mostrar los datos del staff porque admin tiene acceso total
```

```sql
-- Probar como Artist
-- (Inicia sesión como artist en Supabase Dashboard primero)
SELECT
    'ARTIST TEST' as test_type,
    c.first_name,
    c.last_name,
    c.email as can_see_email,
    c.phone as can_see_phone
FROM customers c
LIMIT 1;

-- Esta consulta debería mostrar solo first_name y last_name, email y phone deberían ser NULL
-- debido a la política RLS que restringe el acceso de artist a datos PII
```

---

## 🚨 Troubleshooting

### Error: "User already registered"

**Causa:** El usuario ya existe en Supabase Auth.

**Solución:**
1. Ve a **"Authentication" → "Users"**
2. Busca el usuario por email
3. Si existe, usa ese usuario
4. Si no, elige un email diferente

### Error: "Invalid login credentials"

**Causa:** El email o password es incorrecto.

**Solución:**
1. Verifica el email y password
2. Si olvidaste el password, usa el link de **"Forgot password"**
3. O re crea el usuario en Supabase Auth

### Error: "User ID mismatch"

**Causa:** El `user_id` en la tabla staff/customers no coincide con el ID en `auth.users`.

**Solución:**
1. Obtén el ID correcto de `auth.users`
2. Actualiza la tabla staff/customers con el ID correcto

---

## 📚 Documentación Adicional

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **RLS Policies:** https://supabase.com/docs/guides/auth/row-level-security
- **Email Templates:** https://supabase.com/docs/guides/auth/auth-email

---

## ✅ Checklist de Configuración

- [ ] Email Provider habilitado y configurado
- [ ] Site URL configurado
- [ ] SMS Provider configurado (opcional)
- [ ] 8 usuarios de staff creados en Supabase Auth
- [ ] 4 usuarios de customers creados en Supabase Auth
- [ ] Tabla staff actualizada con user_ids correctos
- [ ] Tabla customers actualizada con user_ids correctos
- [ ] Email templates configurados (opcional)
- [ ] Login probado con admin
- [ ] Login probado con customer
- [ ] Políticas RLS verificadas

---

## 🎯 Próximos Pasos

Después de completar la configuración de Auth:

1. **Implementar frontend de autenticación** en Next.js
2. **Crear API endpoints** para login/logout
3. **Implementar Tarea 1.3:** Short ID & Invitaciones (backend)
4. **Implementar Tarea 1.4:** CRM Base (endpoints CRUD)

---

**¿Listo para continuar con el desarrollo de la aplicación?**
