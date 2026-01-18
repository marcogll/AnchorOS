# 🚀 AnchorOS Deployment Guide

## 📋 **Pre-requisitos**

- VPS con Ubuntu/Debian 20.04+
- Docker y Docker Compose instalados
- Dominio apuntando a tu VPS
- Certificados SSL (Let's Encrypt recomendado)

## 🛠️ **Configuración Inicial**

### 1. **Clonar y configurar**
```bash
git clone https://github.com/your-repo/anchoros.git
cd anchoros
cp .env.example .env
# Editar .env con tus valores reales
```

### 2. **Variables críticas**
```bash
# Requeridas para funcionamiento básico
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
RESEND_API_KEY=re_xxxxx
NEXT_PUBLIC_APP_URL=https://tu-dominio.com

# Formbricks (opcional - encuestas)
NEXT_PUBLIC_FORMBRICKS_ENVIRONMENT_ID=your-environment-id
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com

# Optional: Redis para caching
REDIS_URL=redis://redis:6379

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### 3. **SSL Certificates**
```bash
# Instalar Certbot
sudo apt install certbot

# Generar certificados
sudo certbot certonly --standalone -d tu-dominio.com

# Copiar a directorio ssl/
sudo mkdir ssl
sudo cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem ssl/
```

## 🚀 **Deployment**

### **Opción 1: Script Automático**
```bash
./deploy.sh production
```

### **Opción 2: Manual**
```bash
# Build e iniciar
docker-compose -f docker-compose.prod.yml up -d --build

# Verificar
curl http://localhost/health
```

## 📊 **Monitoreo**

### **Logs**
```bash
# Todos los servicios
docker-compose -f docker-compose.prod.yml logs -f

# Servicio específico
docker-compose -f docker-compose.prod.yml logs -f anchoros
```

### **Recursos**
```bash
# Uso de CPU/Memoria
docker stats

# Espacio en disco
df -h
```

### **Health Checks**
```bash
# API health
curl https://tu-dominio.com/api/health

# Nginx status
curl -H "Host: tu-dominio.com" http://localhost/health
```

## 🔧 **Mantenimiento**

### **Updates**
```bash
# Pull latest changes
git pull origin main

# Redeploy
./deploy.sh production
```

### **Backup**
```bash
# Database backup (si usas PostgreSQL local)
docker exec anchoros_db pg_dump -U postgres anchoros > backup.sql

# Logs backup
docker-compose -f docker-compose.prod.yml logs > logs_backup.txt
```

### **SSL Renewal**
```bash
# Renew certificates
sudo certbot renew

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 🚨 **Troubleshooting**

### **App no responde**
```bash
# Verificar contenedores
docker ps

# Logs de la app
docker logs anchoros_app

# Reiniciar app
docker-compose -f docker-compose.prod.yml restart anchoros
```

### **Error 502 Bad Gateway**
```bash
# Nginx no puede conectar con Next.js
docker logs anchoros_nginx

# Verificar que Next.js esté corriendo
curl http://localhost:3000
```

### **Alta carga de CPU**
```bash
# Verificar procesos
docker stats

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

## 📈 **Optimizaciones de Performance**

### **Nginx Caching**
- Static files: 1 año cache
- API responses: No cache
- Rate limiting: 10 req/s

### **Next.js Optimizations**
- Standalone build
- Gzip compression
- Image optimization
- Console removal en prod

### **Database**
- Conexión pool
- Query optimization
- Redis caching (opcional)

## 📝 **Formbricks Integration**

### **Configuración de Encuestas**
```bash
# Activar Formbricks para recolección de feedback
NEXT_PUBLIC_FORMBRICKS_ENVIRONMENT_ID=clxxxxxxxx
NEXT_PUBLIC_FORMBRICKS_API_HOST=https://app.formbricks.com
```

### **Webhooks**
```bash
# Endpoints de webhook para formularios
# Test: https://flows.soul23.cloud/webhook-test/4YZ7RPfo1GT
# Prod: https://flows.soul23.cloud/webhook/4YZ7RPfo1GT

# Formularios que envían a webhooks:
# - contact (Contacto)
# - franchise (Franquicias)
# - membership (Membresías)

# Payload structure:
{
  "form": "contact|franchise|membership",
  "timestamp_utc": "ISO-8601",
  "device_type": "mobile|desktop|unknown",
  "...": "campos específicos del formulario"
}
```

### **Form Types y Campos**

**Contact (contacto)**
```json
{
  "form": "contact",
  "nombre": "string",
  "email": "string",
  "telefono": "string",
  "motivo": "cita|membresia|franquicia|servicios|pago|resena|otro",
  "mensaje": "string",
  "timestamp_utc": "string",
  "device_type": "string"
}
```

**Franchise (franquicias)**
```json
{
  "form": "franchise",
  "nombre": "string",
  "email": "string",
  "telefono": "string",
  "ciudad": "string",
  "estado": "string",
  "socios": "number",
  "experiencia_sector": "string",
  "experiencia_belleza": "boolean",
  "mensaje": "string",
  "timestamp_utc": "string",
  "device_type": "string"
}
```

**Membership (membresías)**
```json
{
  "form": "membership",
  "membership_id": "gold|black|vip",
  "nombre": "string",
  "email": "string",
  "telefono": "string",
  "mensaje": "string",
  "timestamp_utc": "string",
  "device_type": "string"
}
```

## 🔒 **Seguridad**

- SSL/TLS 1.2+
- Rate limiting
- Security headers
- No exposición de puertos internos
- Variables de entorno seguras

## 📞 **Soporte**

Para issues, revisar:
1. Docker logs
2. Network connectivity
3. Environment variables
4. SSL certificates
5. Database connections