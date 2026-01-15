# 🚀 GUÍA SIMPLE - SALONOS

## ✅ ESTADO

- ✅ Migraciones ejecutadas exitosamente en Supabase
- ✅ Scripts simples creados para facilitar el setup
- ✅ Base de datos lista para desarrollo

---

## 📋 PASOS RÁPIDOS (EN ORDEN)

### Paso 1: Verificar Conexión

```bash
npm run simple:check
```

**Qué hace:** Verifica si puedes conectarte a Supabase desde la línea de comandos.

**Si dice "Puerto 5432 está bloqueado":**
- No te preocupes
- Usa Supabase Dashboard: https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl/sql
- Ignora los pasos 2 y 3, ve directo al paso "ALTERNATIVA: USAR SUPABASE DASHBOARD"

---

### Paso 2: Verificar Migraciones

```bash
npm run simple:verify
```

**Qué hace:** Verifica que todo esté correcto en la base de datos.

**Output esperado:**
```
🎉 TODAS LAS MIGRACIONES ESTÁN CORRECTAS
```

---

### Paso 3: Crear Datos de Prueba

```bash
npm run simple:seed
```

**Qué hace:** Crea locations, staff, services, customers, invitations, bookings.

**Output esperado:**
```
🎉 SEED DE DATOS COMPLETADO EXITOSAMENTE
```

---

### Paso 4: Crear Usuarios de Auth

```bash
npm run auth:create
```

**Qué hace:** Crea usuarios de staff y customers en Supabase Auth automáticamente.

**Output esperado:**
```
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

## 🚨 ALTERNATIVA: USAR SUPABASE DASHBOARD

Si el puerto 5432 está bloqueado (común en empresas con firewall):

### Opción 1: Ejecutar Migraciones Completas
1. Ve a: https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl/sql
2. Copia el contenido de: `db/migrations/00_FULL_MIGRATION_FINAL.sql`
3. Pega en el SQL Editor
4. Haz clic en **"Run"**

### Opción 2: Crear Usuarios Manualmente
1. Ve a: https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl/auth/users
2. Haz clic en **"Add user"**
3. Crea estos usuarios:

**Admin:**
- Email: `admin@salonos.com`
- Password: `Admin123!`
- Auto Confirm: ON

**Staff (Manager Centro):**
- Email: `manager.centro@salonos.com`
- Password: `Manager123!`
- Auto Confirm: ON

**Customer (Gold):**
- Email: `sofia.ramirez@example.com`
- Password: `Customer123!`
- Auto Confirm: ON

---

## 📚 GUÍAS DETALLADAS

Si necesitas más detalles:

- **`scripts/README.md`** - Documentación completa de todos los scripts
- **`docs/STEP_BY_STEP_VERIFICATION.md`** - Guía paso a paso detallada
- **`docs/STEP_BY_STEP_AUTH_CONFIG.md`** - Guía de configuración de Auth
- **`docs/QUICK_START_POST_MIGRATION.md`** - Guía rápida de referencia

---

## ✅ CHECKLIST

Después de ejecutar todos los pasos:

- [ ] Conexión verificada (o usando Dashboard)
- [ ] Migraciones verificadas (8 tablas, 14 funciones, 17+ triggers)
- [ ] Datos de prueba creados (3 locations, 6 resources, 8 staff, 6 services, 4 customers, 15 invitations, 5 bookings)
- [ ] Usuarios de Auth creados (8 staff + 4 customers)
- [ ] Credenciales de prueba guardadas

---

## 🎯 PRÓXIMOS PASOS

### Probar el Login

1. Ve a Supabase Dashboard: https://supabase.com/dashboard/project/pvvwbnybkadhreuqijsl/auth/users
2. Verifica que los usuarios estén creados
3. Intenta hacer login con una de las credenciales de prueba

### Verificar Políticas RLS

En Supabase Dashboard, ejecuta esta consulta:

```sql
-- Verificar que Artist no puede ver email/phone de customers
SELECT
    c.first_name,
    c.email,  -- Debería ser NULL si eres Artist
    c.phone    -- Debería ser NULL si eres Artist
FROM customers c
LIMIT 1;
```

### Continuar con el Desarrollo

Una vez que todo esté configurado:

1. **Implementar Tarea 1.3:** Short ID & Invitaciones (backend)
2. **Implementar Tarea 1.4:** CRM Base (endpoints CRUD)
3. **Iniciar desarrollo del frontend** (The Boutique / The HQ)

---

## 💡 TIPS

### Tip 1: Scripts vs Dashboard
- **Scripts** son más rápidos pero requieren puerto 5432 abierto
- **Dashboard** es más lento pero siempre funciona (si el puerto está bloqueado)

### Tip 2: Guardar las Credenciales
Guarda estas credenciales en un lugar seguro:

**Admin:**
- Email: `admin@salonos.com`
- Password: `Admin123!`

**Customer (Gold):**
- Email: `sofia.ramirez@example.com`
- Password: `Customer123!`

### Tip 3: Verificar Cada Paso
No continúes al siguiente paso hasta verificar que el anterior esté correcto.

### Tip 4: Consultar los Logs
Si algo falla, consulta los logs en Supabase Dashboard.

---

## 🆘 AYUDA

Si encuentras problemas:

1. **Revisa los logs de Supabase Dashboard**
2. **Ejecuta el script de verificación** (`npm run simple:verify`)
3. **Consulta las guías detalladas** en `docs/`
4. **Si el puerto está bloqueado**, usa Supabase Dashboard

---

## 📞 CONTACTO

Para dudas sobre la implementación, consultar:
- **PRD.md**: Reglas de negocio
- **TASKS.md**: Plan de ejecución
- **AGENTS.md**: Roles y responsabilidades
- **scripts/README.md**: Documentación completa de scripts

---

## 🎉 ¡LISTO PARA COMENZAR!

Todo está preparado para que empieces el desarrollo de SalonOS.

**¿Qué deseas hacer ahora?**

1. **Ejecutar los scripts simples** (si el puerto está abierto)
2. **Usar Supabase Dashboard** (si el puerto está bloqueado)
3. **Comenzar el desarrollo del frontend** (Next.js)
4. **Implementar las tareas de backend** (Tarea 1.3 y 1.4)

---

**¡El futuro es tuyo!** 🚀
