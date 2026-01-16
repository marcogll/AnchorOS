# Configuración de Dominios - Anchor:23

## Arquitectura de Dominios

El proyecto SalonOS está diseñado para funcionar con múltiples subdominios, cada uno con una función específica:

| Subdominio | Función | Estado | URL de ejemplo |
|-------------|----------|---------|----------------|
| `anchor23.mx` | Frontend institucional (landing page + páginas informativas) | ✅ Completado | `https://anchor23.mx` |
| `booking.anchor23.mx` | The Boutique - Frontend de reservas | ⏳ Pendiente | `https://booking.anchor23.mx` |
| `kiosk.anchor23.mx` | The Kiosk - Sistema de autoservicio táctil | ✅ Completado | `https://kiosk.anchor23.mx/{location-id}` |

---

## Configuración en Next.js

### 1. Configuración DNS

#### Registros DNS Requeridos

En tu proveedor de DNS (ej. Cloudflare, GoDaddy, Namecheap):

```
# Registros A (o CNAME)
anchor23.mx          → A record → IP del servidor
booking.anchor23.mx   → CNAME → anchor23.mx
kiosk.anchor23.mx     → CNAME → anchor23.mx

# Registros wildcard (opcional, para subdominios futuros)
*.anchor23.mx         → CNAME → anchor23.mx
```

### 2. Configuración en Vercel (o VPS)

Si despliegas en Vercel:

1. Agregar dominios en `Settings → Domains`
2. Configurar subdominios:
   - `anchor23.mx` como dominio principal
   - `booking.anchor23.mx` como dominio adicional
   - `kiosk.anchor23.mx` como dominio adicional

3. Vercel manejará automáticamente la configuración SSL

### 3. Configuración en VPS (Nginx + Next.js)

Si despliegas en VPS propio:

```nginx
# /etc/nginx/sites-available/anchor23
server {
    listen 80;
    server_name anchor23.mx booking.anchor23.mx kiosk.anchor23.mx;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirección HTTP a HTTPS
server {
    listen 80;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name anchor23.mx booking.anchor23.mx kiosk.anchor23.mx;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Rutas por Subdominio

### anchor23.mx (Frontend Institucional)

Rutas disponibles:
- `/` - Landing page
- `/servicios` - Página de servicios
- `/historia` - Historia y filosofía
- `/contacto` - Formulario de contacto
- `/franchises` - Información de franquicias
- `/membresias` - Membresías exclusivas
- `/privacy-policy` - Política de privacidad
- `/legal` - Términos y condiciones

### booking.anchor23.mx (The Boutique) - Pendiente

Rutas planificadas:
- `/` - Selección de servicio y calendario
- `/reservar` - Flujo de reserva paso a paso
- `/mis-citas` - Historial de citas del cliente
- `/perfil` - Perfil del cliente
- `/login` - Autenticación de clientes

### kiosk.anchor23.mx (The Kiosk)

Rutas disponibles:
- `/[locationId]` - Pantalla principal del kiosko
- `/api/kiosk/authenticate` - Autenticación del dispositivo
- `/api/kiosk/bookings` - Gestión de reservas
- `/api/kiosk/walkin` - Reservas walk-in
- `/api/kiosk/bookings/[shortId]/confirm` - Confirmación de citas
- `/api/kiosk/resources/available` - Recursos disponibles

---

## Configuración de Environment Variables

Cada subdominio puede requerir variables de entorno específicas:

```env
# anchor23.mx (compartido)
NEXT_PUBLIC_SITE_URL=https://anchor23.mx

# booking.anchor23.mx (pendiente)
NEXT_PUBLIC_BOOKING_URL=https://booking.anchor23.mx

# kiosk.anchor23.mx
NEXT_PUBLIC_KIOSK_URL=https://kiosk.anchor23.mx
NEXT_PUBLIC_KIOSK_API_KEY=tu_api_key_de_64_caracteres
```

---

## Enlaces Cruzados

### Desde anchor23.mx

```typescript
// CTA en landing page
<a href="https://booking.anchor23.mx">Solicitar Cita</a>

// Enlace a kiosko (solo visible en ubicación física)
<a href="https://kiosk.anchor23.mx/{location-id}">Kiosko</a>
```

### Desde booking.anchor23.mx

```typescript
// Enlace a información de servicios
<a href="https://anchor23.mx/servicios">Más información</a>

// Enlace a política de privacidad
<a href="https://anchor23.mx/privacy-policy">Privacidad</a>
```

### Desde kiosk.anchor23.mx

```typescript
// El kiosko es autónomo, no tiene enlaces externos
// Solo comunica con la API del kiosko
```

---

## Testing de Subdominios

### Local con `/etc/hosts`

Para probar localmente:

```
# /etc/hosts (Linux/Mac) o C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1  anchor23.mx
127.0.0.1  booking.anchor23.mx
127.0.0.1  kiosk.anchor23.mx
```

Luego accede a:
- `http://anchor23.mx:2311`
- `http://booking.anchor23.mx:2311` (pendiente)
- `http://kiosk.anchor23.mx:2311/{location-id}`

### Puerto Local

El puerto configurado por defecto es **2311**. Para iniciar el servidor:

```bash
npm run dev
```

El sitio estará disponible en: **http://localhost:2311**

### Con ngrok (testing rápido)

```bash
# Para anchor23.mx
ngrok http 2311 --subdomain=anchor23-mx

# Para booking.anchor23.mx
ngrok http 2311 --subdomain=booking-anchor23-mx

# Para kiosk.anchor23.mx
ngrok http 2311 --subdomain=kiosk-anchor23-mx
```

---

## Seguridad Considerations

### HTTPS Obligatorio

Todos los dominios deben usar HTTPS:
- Certificado SSL automático (Vercel, Netlify, Cloudflare)
- Let's Encrypt (VPS con Certbot)
- Compra de certificado comercial

### CORS Configuration

En `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization' },
        ],
      },
    ]
  },
}
```

### API Key Protection

El kiosko usa API keys de 64 caracteres para autenticación:
- Generar keys únicas por dispositivo
- Rotar keys periódicamente
- Logs de auditoría de autenticación

---

## Despliegue

### Vercel (Recomendado)

1. Conectar repositorio de Git
2. Configurar dominios en `Settings → Domains`
3. Desplegar automáticamente en push a `main`

### VPS Personal

```bash
# Clonar repositorio
git clone <repo-url> /var/www/salonos
cd /var/www/salonos

# Instalar dependencias
npm install

# Configurar environment variables
cp .env.example .env.local
nano .env.local

# Build y start
npm run build
npm start

# Configurar PM2 para proceso en segundo plano
pm2 start npm --name "salonos" -- start
pm2 save
pm2 startup
```

---

## Troubleshooting

### Subdominios no resuelven

1. Verificar configuración DNS
2. Esperar propagación DNS (puede tardar hasta 48h)
3. Verificar con `dig booking.anchor23.mx`

### SSL/Certificate errors

1. Verificar configuración de certificados
2. Certbot renew: `sudo certbot renew`
3. Reiniciar Nginx: `sudo systemctl restart nginx`

### Rutas no funcionan

1. Verificar configuración de Next.js router
2. Rebuild: `npm run build`
3. Verificar logs: `pm2 logs` o `vercel logs`

---

## Próximos Pasos

1. ✅ Configurar DNS para `anchor23.mx`
2. ⏳ Desplegar y configurar `booking.anchor23.mx`
3. ✅ Desplegar y configurar `kiosk.anchor23.mx`
4. ⏳ Configurar SSL/TLS para todos los subdominios
5. ⏳ Implementar autenticación de clientes en The Boutique
6. ⏳ Implementar integración de pagos (Stripe) en booking
