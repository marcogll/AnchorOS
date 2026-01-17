# Admin Enrollment System

Sistema de administración de usuarios y kiosks para AnchorOS.

## Descripción

Este sistema permite a los administradores:
- Crear nuevos miembros de staff (admin, manager, staff, artist)
- Crear nuevos kiosks para cada location
- Ver listas de usuarios y kiosks existentes
- Gestionar locations activas

## Acceso

### URL
```
http://localhost:3000/admin/enrollment
```

### Autenticación

El sistema requiere una clave de administración para acceder. Configura esto en `.env.local`:

```env
ADMIN_ENROLLMENT_KEY=tu-clave-segura-aqui
```

## Seguridad

- Autenticación por Bearer token
- Validación de roles (admin, manager, staff, artist)
- API keys de kiosks generadas aleatoriamente (64 caracteres)
- Restricción opcional por IP address para kiosks

## Uso

### Crear Staff Member

1. Ingresa tu `ADMIN_ENROLLMENT_KEY`
2. Selecciona la tab "Staff Members"
3. Completa el formulario:
   - Location
   - Role (Admin, Manager, Staff, Artist)
   - Display Name (público)
   - First/Last Name (privado)
   - Email (para autenticación)
   - Password (contraseña inicial)
   - Phone (opcional)
4. Haz clic en "Create Staff Member"

### Crear Kiosk

1. Ingresa tu `ADMIN_ENROLLMENT_KEY`
2. Selecciona la tab "Kiosks"
3. Completa el formulario:
   - Location
   - Device Name (identificador único)
   - Display Name (nombre legible)
   - IP Address (opcional, para restricción)
4. Haz clic en "Create Kiosk"
5. ⚠️ **IMPORTANTE**: Guarda el API Key generado de forma segura

## Documentación

- [Guía Completa](../docs/ENROLLMENT_SYSTEM.md)
- [Sistema de Kiosko](../docs/KIOSK_SYSTEM.md)
- [PRD](../PRD.md)
