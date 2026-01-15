# 🚀 Scripts Simples - SalonOS

Este directorio contiene scripts simplificados para facilitar el setup de SalonOS.

---

## 📋 Scripts Disponibles

### 1. check-connection.sh
**Qué hace:** Verifica la conexión a Supabase y si el puerto 5432 está abierto.

**Cómo ejecutar:**
```bash
./scripts/check-connection.sh
```

**Output esperado:**
```
✅ psql instalado
✅ Host alcanzable
✅ Puerto 5432 está abierto
✅ Conexión a base de datos exitosa
✅ Tablas encontradas: 8/8
✅ Funciones encontradas: 14
```

**Si falla:**
- Si el puerto está bloqueado, usa Supabase Dashboard
- Si falla la conexión, verifica las credenciales

---

### 2. simple-verify.sh
**Qué hace:** Verifica que todas las migraciones están correctas.

**Cómo ejecutar:**
```bash
./scripts/simple-verify.sh
```

**Output esperado:**
```
📊 Verificando tablas...
✅ Tablas: 8/8

📊 Verificando funciones...
✅ Funciones: 14/14

📊 Verificando triggers...
✅ Triggers: 17+/17+

📊 Verificando políticas RLS...
✅ Políticas RLS: 24+/20+

📊 Probando generación de Short ID...
✅ Short ID: A3F7X2 (6 caracteres)

📊 Probando generación de código de invitación...
✅ Código de invitación: X9J4K2M5N8 (10 caracteres)

==========================================
RESUMEN
==========================================
🎉 TODAS LAS MIGRACIONES ESTÁN CORRECTAS
==========================================
```

---

### 3. simple-seed.sh
**Qué hace:** Crea todos los datos de prueba en la base de datos.

**Cómo ejecutar:**
```bash
./scripts/simple-seed.sh
```

**Output esperado:**
```
📍 Creando locations...
✅ Locations: 3/3

🪑 Creando resources...
✅ Resources: 6/6

👥 Creando staff...
✅ Staff: 8/8

💇 Creando services...
✅ Services: 6/6

👩 Creando customers...
✅ Customers: 4/4

💌 Creando invitations...
✅ Invitaciones: 15/15

📅 Creando bookings...
✅ Bookings: 5/5

==========================================
RESUMEN
==========================================
🎉 SEED DE DATOS COMPLETADO EXITOSAMENTE
==========================================
```

---

### 4. create-auth-users.js
**Qué hace:** Crea usuarios de staff y customers en Supabase Auth automáticamente.

**Requiere:** `npm install @supabase/supabase-js`

**Cómo ejecutar:**
```bash
node scripts/create-auth-users.js
```

**Output esperado:**
```
👥 Creando usuarios de staff (8 usuarios)...

✅ Admin Principal creado (ID: ...)
✅ Manager Centro creado (ID: ...)
✅ Manager Polanco creado (ID: ...)
✅ Staff Coordinadora creado (ID: ...)
✅ Artist María García creado (ID: ...)
✅ Artist Ana Rodríguez creado (ID: ...)
✅ Artist Carla López creado (ID: ...)
✅ Artist Laura Martínez creado (ID: ...)
✅ Usuarios de staff creados: 8/8

🔄 Actualizando tabla staff con user_ids...

✅ Admin Principal actualizado con user_id
✅ Manager Centro actualizado con user_id
...
✅ Staff actualizados: 8/8

👩 Creando usuarios de customers (4 usuarios)...

✅ Sofía Ramírez creado (ID: ...)
✅ Valentina Hernández creado (ID: ...)
✅ Camila López creado (ID: ...)
✅ Isabella García creado (ID: ...)
✅ Usuarios de customers creados: 4/4

🔄 Actualizando tabla customers con user_ids...

✅ Sofía Ramírez actualizado con user_id
...
✅ Customers actualizados: 4/4

==========================================
RESUMEN FINAL
==========================================
Staff creados:      8/8
Staff actualizados:   8/8
Customers creados:  4/4
Customers actualizados: 4/4
==========================================

🎉 TODOS LOS USUARIOS HAN SIDO CREADOS Y ACTUALIZADOS

📝 Credenciales de prueba:

ADMIN:
  Email: admin@salonos.com
  Password: Admin123!

CUSTOMER (Gold):
  Email: sofia.ramirez@example.com
  Password: Customer123!
```

---

## 🚨 Si el Puerto 5432 Está Bloqueado

Si ejecutas `check-connection.sh` y el puerto está bloqueado, tienes estas opciones:

### Opción A: Usar Supabase Dashboard (Recomendado)
1. Ve a: https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl/sql
2. Copia el contenido de: `db/migrations/00_FULL_MIGRATION_FINAL.sql`
3. Pega en el SQL Editor
4. Haz clic en "Run"

### Opción B: Usar SQL desde Dashboard
Para el seed, ejecuta estas consultas una por una:

**Crear locations:**
```sql
INSERT INTO locations (name, timezone, address, phone, is_active)
VALUES
    ('Salón Principal - Centro', 'America/Mexico_City', 'Av. Reforma 222', '+52 55 1234 5678', true),
    ('Salón Norte - Polanco', 'America/Mexico_City', 'Av. Masaryk 123', '+52 55 2345 6789', true),
    ('Salón Sur - Coyoacán', 'America/Mexico_City', 'Calle Hidalgo 456', '+52 55 3456 7890', true);
```

**Crear staff:**
```sql
INSERT INTO staff (user_id, location_id, role, display_name, phone, is_active)
VALUES
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1), 'admin', 'Admin Principal', '+52 55 1111 2222', true),
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1), 'manager', 'Manager Centro', '+52 55 2222 3333', true),
    (uuid_generate_v4(), (SELECT id FROM locations WHERE name = 'Salón Principal - Centro' LIMIT 1), 'artist', 'Artist María García', '+52 55 4444 5555', true);
```

**Crear usuarios de Auth manualmente:**
1. Ve a: https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl/auth/users
2. Haz clic en "Add user"
3. Crea los usuarios con los emails de `scripts/create-auth-users.js`

---

## 📝 Flujo de Ejecución Recomendado

### Si el puerto 5432 está ABIERTO:

```bash
# 1. Verificar conexión
./scripts/check-connection.sh

# 2. Verificar migraciones
./scripts/simple-verify.sh

# 3. Crear datos de prueba
./scripts/simple-seed.sh

# 4. Crear usuarios de Auth
node scripts/create-auth-users.js
```

### Si el puerto 5432 está BLOQUEADO:

```bash
# 1. Verificar conexión
./scripts/check-connection.sh

# Esto te dirá que el puerto está bloqueado
# Entonces usa Supabase Dashboard
```

**En Supabase Dashboard:**
1. Ve a: https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl/sql
2. Copia el contenido de: `db/migrations/00_FULL_MIGRATION_FINAL.sql`
3. Pega en el SQL Editor
4. Haz clic en "Run"
5. Para el seed, ejecuta las consultas de `scripts/simple-seed.sh` una por una
6. Para crear usuarios, usa el Dashboard manualmente

---

## 🔧 Troubleshooting

### Error: "psql: command not found"
**Solución:** Instala PostgreSQL client
- macOS: `brew install postgresql`
- Ubuntu/Debian: `sudo apt-get install postgresql-client`
- Windows: Descargar desde https://www.postgresql.org/download/windows/

### Error: "connection to server failed"
**Solución:**
1. Verifica que las variables de entorno estén en `.env.local`
2. Verifica que el puerto 5432 no esté bloqueado
3. Si está bloqueado, usa Supabase Dashboard

### Error: "Password authentication failed"
**Solución:**
1. Verifica que `SUPABASE_SERVICE_ROLE_KEY` sea correcto
2. Verifica que no tenga espacios o caracteres especiales
3. Regenera el key en Supabase Dashboard si es necesario

### Error: "relation already exists"
**Solución:**
- Los datos ya existen. Continúa con el siguiente script
- O elimina y recrea la base de datos

### Error: "User already registered"
**Solución:**
- El usuario ya existe en Supabase Auth
- Borra el usuario en Supabase Dashboard y vuelve a ejecutar el script

---

## 📚 Documentación Adicional

- **`docs/STEP_BY_STEP_VERIFICATION.md`** - Guía detallada paso a paso
- **`docs/STEP_BY_STEP_AUTH_CONFIG.md`** - Guía de configuración de Auth
- **`docs/POST_MIGRATION_SUCCESS.md`** - Guía post-migración
- **`docs/QUICK_START_POST_MIGRATION.md`** - Guía rápida de referencia

---

## ✅ Checklist

### Verificar Conexión
- [ ] `check-connection.sh` ejecutado
- [ ] Puerto 5432 abierto (o usar Dashboard)
- [ ] Conexión a DB exitosa

### Verificar Migraciones
- [ ] `simple-verify.sh` ejecutado
- [ ] Todas las tablas creadas (8/8)
- [ ] Todas las funciones creadas (14/14)
- [ ] Todos los triggers activos (17+)

### Seed de Datos
- [ ] `simple-seed.sh` ejecutado
- [ ] Locations creadas (3/3)
- [ ] Resources creados (6/6)
- [ ] Staff creado (8/8)
- [ ] Services creados (6/6)
- [ ] Customers creados (4/4)
- [ ] Invitaciones creadas (15/15)
- [ ] Bookings creados (5/5)

### Crear Usuarios Auth
- [ ] `create-auth-users.js` ejecutado
- [ ] Staff creados (8/8)
- [ ] Staff actualizados (8/8)
- [ ] Customers creados (4/4)
- [ ] Customers actualizados (4/4)

---

## 🎯 Próximos Pasos

Después de completar todos los scripts:

1. **Probar login** con las credenciales:
   - Admin: `admin@salonos.com` / `Admin123!`
   - Customer: `sofia.ramirez@example.com` / `Customer123!`

2. **Verificar políticas RLS** en Supabase Dashboard

3. **Continuar con el desarrollo** de la aplicación

---

**¿Necesitas ayuda con alguno de los scripts?**
