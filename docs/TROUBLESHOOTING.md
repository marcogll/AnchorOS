# Guía de Troubleshooting — AnchorOS

Esta guía ayuda a resolver problemas comunes durante el setup y desarrollo de AnchorOS.

## Configuración de Entorno

### Supabase Auth Issues

#### Error: "Auth session not found"
- **Causa**: Variables de entorno de Supabase mal configuradas
- **Solución**:
  - Verificar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Asegurarse que las URLs no tengan trailing slash
  - Probar conexión: `curl https://your-project.supabase.co/rest/v1/`

#### Error: "RLS policy violation"
- **Causa**: Políticas de Row Level Security no aplicadas
- **Solución**:
  - Ejecutar migraciones: `supabase db push`
  - Verificar políticas en Supabase Dashboard > Authentication > Policies
  - Para kioskos: asegurar API key válida en headers `x-kiosk-api-key`

#### Error: "Magic link not received"
- **Causa**: SMTP no configurado en Supabase
- **Solución**:
  - Configurar SMTP en Supabase Dashboard > Authentication > Email Templates
  - Usar servicio como SendGrid o AWS SES
  - Probar con email de prueba en dashboard

## Integraciones Externas

### Stripe Webhooks

#### Error: "Webhook signature verification failed"
- **Causa**: Webhook secret mal configurado
- **Solución**:
  - Obtener secret desde Stripe Dashboard > Developers > Webhooks
  - Configurar `STRIPE_WEBHOOK_SECRET` en variables de entorno
  - Verificar endpoint URL en Stripe coincida con producción

#### Error: "Payment intent not found"
- **Causa**: Cliente secret expirado o inválido
- **Solución**:
  - Regenerar payment intent en backend
  - Verificar tiempo de expiración (24h por defecto)
  - Usar idempotency key para evitar duplicados

#### Error: "Deposit calculation incorrect"
- **Causa**: Lógica de depósito no actualizada
- **Solución**:
  - Verificar regla: MIN(service_price * 0.5, 200)
  - Probar con diferentes precios de servicio
  - Revisar logs de webhook para valores

### Google Calendar

#### Error: "Service account authentication failed"
- **Causa**: Credenciales de Google incorrectas
- **Solución**:
  - Descargar JSON de service account desde Google Cloud Console
  - Configurar `GOOGLE_SERVICE_ACCOUNT_JSON` como string JSON
  - Verificar permisos: Calendar API enabled, service account tiene acceso al calendar

#### Error: "Calendar sync conflicts"
- **Causa**: Eventos duplicados o sobrepuestos
- **Solución**:
  - Implementar lógica de merge para conflictos
  - Usar event ID como key para evitar duplicados
  - Loggear conflictos para resolución manual

## Base de Datos

### Migraciones

#### Error: "Migration failed"
- **Causa**: Dependencias de migración no resueltas
- **Solución**:
  - Ejecutar en orden: `supabase migration up`
  - Verificar foreign keys existen antes de crear constraints
  - Backup antes de migrar en producción

#### Error: "Duplicate key value violates unique constraint"
- **Causa**: Datos existentes violan nueva constraint
- **Solución**:
  - Limpiar datos conflictivos antes de migrar
  - Usar `ON CONFLICT` en inserts
  - Revisar seeds data

### RPC Functions

#### Error: "Function does not exist"
- **Causa**: Función no creada en Supabase
- **Solución**:
  - Ejecutar SQL de funciones desde migrations
  - Verificar nombre exacto de función
  - Probar directamente en Supabase SQL Editor

## Frontend Issues

### Next.js Build

#### Error: "Module not found"
- **Causa**: Dependencias faltantes
- **Solución**:
  - Ejecutar `npm install` o `yarn install`
  - Verificar package.json versiones compatibles
  - Limpiar node_modules: `rm -rf node_modules && npm install`

#### Error: "TypeScript errors"
- **Causa**: Tipos desactualizados
- **Solución**:
  - Regenerar types: `supabase gen types typescript --local > lib/db/types.ts`
  - Verificar imports correctos
  - Usar `any` temporalmente para debugging

## Kiosko System

#### Error: "Kiosk not authorized"
- **Causa**: API key inválida o expirada
- **Solución**:
  - Generar nueva API key en admin dashboard
  - Configurar en variables de entorno del kiosko
  - Verificar headers: `x-kiosk-api-key`

#### Error: "No resources available"
- **Causa**: Recursos no asignados o bloqueados
- **Solución**:
  - Verificar migración de recursos ejecutada
  - Chequear disponibilidad por horario
  - Revisar lógica de priority assignment

## Deployment

### Vercel Issues

#### Error: "Build failed"
- **Causa**: Variables de entorno faltantes
- **Solución**:
  - Configurar todas las env vars en Vercel dashboard
  - Verificar build logs para errores específicos
  - Usar `--verbose` en build command

#### Error: "Domain configuration failed"
- **Causa**: Wildcard domains no soportados
- **Solución**:
  - Configurar subdominios individuales
  - Usar proxy reverso para wildcard routing
  - Verificar DNS settings

## Logs y Debugging

### Verificar Logs
- **Supabase**: Dashboard > Logs > API/PostgreSQL
- **Vercel**: Dashboard > Functions > Logs
- **Stripe**: Dashboard > Developers > Logs
- **Local**: `npm run dev` con console.log

### Common Debug Steps
1. Verificar variables de entorno
2. Probar endpoints con curl/Postman
3. Revisar network tab en browser dev tools
4. Chequear logs de errores
5. Verificar permisos y políticas

## Contacto

Si el problema persiste, documentar:
- Pasos para reproducir
- Logs de error completos
- Configuración del entorno
- Versiones de dependencias

Crear issue en GitHub con esta información.