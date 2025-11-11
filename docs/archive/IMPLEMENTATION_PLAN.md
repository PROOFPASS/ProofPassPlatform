# ProofPass Platform - Plan de Implementación Completo

Este documento te guía paso a paso desde cero hasta tener la plataforma funcionando en producción.

## 📋 Índice

1. [Pre-requisitos](#pre-requisitos)
2. [Fase 1: Configuración Local](#fase-1-configuración-local)
3. [Fase 2: Testing en Docker Local](#fase-2-testing-en-docker-local)
4. [Fase 3: Deployment a Producción](#fase-3-deployment-a-producción)
5. [Fase 4: Post-Deployment](#fase-4-post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Pre-requisitos

### Software Necesario

```bash
# Verificar instalaciones
node --version    # Debe ser v18+
npm --version     # Debe ser v8+
docker --version  # Debe ser v24+
git --version     # Debe ser v2.40+
```

### Si falta algo:

**Node.js 18+:**
```bash
# macOS con Homebrew
brew install node@18

# O descargar de https://nodejs.org/
```

**Docker Desktop:**
- macOS: https://www.docker.com/products/docker-desktop
- Instalar y abrir Docker Desktop

---

## Fase 1: Configuración Local

### 1.1 Preparar el Repositorio

```bash
# Ya tienes el repo clonado en:
cd /Users/fboiero/Documents/GitHub/ProofPassPlatform

# Verificar que estás en la rama main
git branch

# Ver commits pendientes de push
git log --oneline -5
```

### 1.2 Configurar PostgreSQL Local (para desarrollo)

**Opción A: Con Homebrew (recomendado para desarrollo)**

```bash
# Instalar PostgreSQL
brew install postgresql@15

# Iniciar servicio
brew services start postgresql@15

# Crear base de datos
createdb proofpass

# Crear usuario
psql postgres -c "CREATE USER proofpass WITH PASSWORD 'local_dev_password';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE proofpass TO proofpass;"
```

**Opción B: Con Docker (si prefieres)**

```bash
docker run -d \
  --name proofpass-postgres \
  -e POSTGRES_USER=proofpass \
  -e POSTGRES_PASSWORD=local_dev_password \
  -e POSTGRES_DB=proofpass \
  -p 5432:5432 \
  postgres:15-alpine
```

### 1.3 Configurar Redis Local

**Opción A: Con Homebrew**

```bash
# Instalar Redis
brew install redis

# Iniciar servicio
brew services start redis
```

**Opción B: Con Docker**

```bash
docker run -d \
  --name proofpass-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### 1.4 Configurar Variables de Entorno para Desarrollo

**API Backend:**

```bash
cd apps/api

# Crear .env.local
cat > .env.local << 'EOF'
# Development Environment
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://proofpass:local_dev_password@localhost:5432/proofpass

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=dev_jwt_secret_change_in_production

# Admin
ADMIN_EMAIL=admin@proofpass.local
ADMIN_PASSWORD=admin123

# CORS
CORS_ORIGIN=http://localhost:3001

# Stellar (testnet)
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
EOF
```

**Platform Dashboard:**

```bash
cd ../platform

# Crear .env.local
cat > .env.local << 'EOF'
# Development Environment
NODE_ENV=development
PORT=3001

# NextAuth
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=dev_nextauth_secret_change_in_production

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000

# Admin credentials (same as API)
ADMIN_EMAIL=admin@proofpass.local
ADMIN_PASSWORD=admin123
EOF
```

### 1.5 Instalar Dependencias

```bash
# Volver al root
cd /Users/fboiero/Documents/GitHub/ProofPassPlatform

# Instalar dependencias de API
cd apps/api
npm install

# Instalar dependencias de Platform
cd ../platform
npm install

# Volver al root
cd ../..
```

### 1.6 Inicializar Base de Datos

```bash
cd apps/api

# Ejecutar migraciones (si existen)
npm run db:migrate

# O inicializar manualmente
npm run db:init

# Verificar que funciona
npm run db:verify
```

### 1.7 Probar Localmente (Desarrollo)

**Terminal 1 - API:**
```bash
cd apps/api
npm run dev

# Debería iniciar en http://localhost:3000
# Probar: curl http://localhost:3000/health
```

**Terminal 2 - Platform:**
```bash
cd apps/platform
npm run dev

# Debería iniciar en http://localhost:3001
# Abrir en navegador: http://localhost:3001
```

**Credenciales de acceso:**
- Email: `admin@proofpass.local`
- Password: `admin123`

---

## Fase 2: Testing en Docker Local

Esta fase te permite probar el stack completo como correrá en producción.

### 2.1 Iniciar Docker Desktop

1. Abrir Docker Desktop desde Aplicaciones
2. Esperar a que el ícono de Docker en la barra de menú deje de parpadear
3. Verificar: `docker info`

### 2.2 Usar el Script Automatizado

```bash
# Volver al root del proyecto
cd /Users/fboiero/Documents/GitHub/ProofPassPlatform

# Ejecutar script de testing
./scripts/test-docker-local.sh
```

El script hará:
1. ✅ Verificar Docker
2. ✅ Verificar/crear `.env.production`
3. ✅ Generar certificados SSL self-signed
4. ✅ Construir imágenes Docker
5. ✅ Preguntar si quieres iniciar servicios

### 2.3 Verificar Servicios

```bash
# Ver estado de contenedores
docker-compose -f docker-compose.production.yml ps

# Deberías ver todos como "Up" y "healthy"

# Ver logs
docker-compose -f docker-compose.production.yml logs -f
```

### 2.4 Probar Endpoints (con certificados self-signed)

```bash
# API Health Check
curl -k https://localhost/health

# Platform (navegador)
# Ir a: https://localhost:3001
# (Acepta la advertencia SSL - es normal con certificados self-signed)
```

### 2.5 Detener Servicios

```bash
# Detener servicios
docker-compose -f docker-compose.production.yml down

# Detener y eliminar volúmenes (limpieza completa)
docker-compose -f docker-compose.production.yml down -v
```

---

## Fase 3: Deployment a Producción

### 3.1 Preparar Servidor de Producción

**Requisitos del servidor:**
- Ubuntu 22.04 LTS (recomendado)
- 4 GB RAM mínimo (8 GB recomendado)
- 2 CPU cores mínimo (4 recomendado)
- 50 GB de almacenamiento SSD
- IP pública estática
- Puertos 80, 443, 22 abiertos

**Proveedores sugeridos:**
- DigitalOcean (Droplet $24/mes)
- Linode (Dedicated 4 GB $24/mes)
- AWS EC2 (t3.medium)
- Hetzner Cloud (CX31 ~$10/mes)

### 3.2 Configurar DNS

Apunta tus dominios a la IP del servidor:

```
Tipo A:
- api.proofpass.co → IP_DEL_SERVIDOR
- platform.proofpass.co → IP_DEL_SERVIDOR
```

Verifica que los DNS se propagaron:
```bash
dig api.proofpass.co
dig platform.proofpass.co
```

### 3.3 Preparar el Servidor

**Conectarse al servidor:**
```bash
ssh root@IP_DEL_SERVIDOR
```

**Actualizar sistema:**
```bash
apt update && apt upgrade -y
```

**Instalar Docker:**
```bash
# Docker install script
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose
apt install docker-compose-plugin -y

# Verificar
docker --version
docker compose version
```

**Configurar Firewall:**
```bash
# Instalar UFW
apt install ufw -y

# Configurar reglas
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS

# Activar
ufw enable

# Verificar
ufw status
```

**Crear usuario para deployment (opcional pero recomendado):**
```bash
# Crear usuario
adduser proofpass

# Agregar a grupo docker
usermod -aG docker proofpass

# Cambiar a ese usuario
su - proofpass
```

### 3.4 Clonar Repositorio en Servidor

```bash
# Como usuario proofpass (o root)
cd /opt

# Clonar repo
git clone https://github.com/TU_USUARIO/ProofPassPlatform.git
cd ProofPassPlatform

# Checkout a la rama/tag de producción
git checkout main  # o el tag/branch que quieras
```

### 3.5 Configurar SSL con Let's Encrypt

**Instalar Certbot:**
```bash
apt install certbot -y
```

**Generar certificados (los dominios deben apuntar al servidor):**
```bash
# IMPORTANTE: Detén NGINX/servicios en puerto 80/443 primero
docker compose -f docker-compose.production.yml down

# Generar certificados
certbot certonly --standalone -d api.proofpass.co
certbot certonly --standalone -d platform.proofpass.co

# Los certificados se guardan en:
# /etc/letsencrypt/live/api.proofpass.co/
# /etc/letsencrypt/live/platform.proofpass.co/
```

**Copiar certificados al proyecto:**
```bash
# Crear directorio SSL
mkdir -p nginx/ssl

# Copiar certificados API
cp /etc/letsencrypt/live/api.proofpass.co/fullchain.pem nginx/ssl/api.proofpass.co.crt
cp /etc/letsencrypt/live/api.proofpass.co/privkey.pem nginx/ssl/api.proofpass.co.key

# Copiar certificados Platform
cp /etc/letsencrypt/live/platform.proofpass.co/fullchain.pem nginx/ssl/platform.proofpass.co.crt
cp /etc/letsencrypt/live/platform.proofpass.co/privkey.pem nginx/ssl/platform.proofpass.co.key

# Ajustar permisos
chmod 644 nginx/ssl/*.crt
chmod 600 nginx/ssl/*.key
```

**Configurar auto-renovación:**
```bash
# Crear script de renovación
cat > /opt/renew-certs.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/api.proofpass.co/fullchain.pem /opt/ProofPassPlatform/nginx/ssl/api.proofpass.co.crt
cp /etc/letsencrypt/live/api.proofpass.co/privkey.pem /opt/ProofPassPlatform/nginx/ssl/api.proofpass.co.key
cp /etc/letsencrypt/live/platform.proofpass.co/fullchain.pem /opt/ProofPassPlatform/nginx/ssl/platform.proofpass.co.crt
cp /etc/letsencrypt/live/platform.proofpass.co/privkey.pem /opt/ProofPassPlatform/nginx/ssl/platform.proofpass.co.key
cd /opt/ProofPassPlatform && docker compose -f docker-compose.production.yml restart nginx
EOF

chmod +x /opt/renew-certs.sh

# Agregar a crontab (se ejecuta diariamente)
echo "0 3 * * * /opt/renew-certs.sh >> /var/log/cert-renew.log 2>&1" | crontab -
```

### 3.6 Configurar Variables de Entorno de Producción

```bash
cd /opt/ProofPassPlatform

# Copiar template
cp .env.production.example .env.production

# Editar con valores reales
nano .env.production
```

**Generar secrets seguros:**
```bash
# JWT Secret
openssl rand -base64 32

# NextAuth Secret
openssl rand -base64 32

# Database Password
openssl rand -base64 24

# Redis Password
openssl rand -base64 24
```

**Ejemplo de .env.production (reemplaza los valores):**
```bash
# Database Configuration
POSTGRES_USER=proofpass
POSTGRES_PASSWORD=GENERA_PASSWORD_SEGURO_AQUI
POSTGRES_DB=proofpass

# Redis Configuration
REDIS_PASSWORD=GENERA_PASSWORD_SEGURO_AQUI

# API Backend Configuration
JWT_SECRET=GENERA_SECRET_SEGURO_AQUI
ADMIN_EMAIL=admin@tudominio.com
ADMIN_PASSWORD=GENERA_PASSWORD_SEGURO_AQUI
CORS_ORIGIN=https://platform.proofpass.co

# Stellar Network Configuration
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# Platform Dashboard Configuration
NEXTAUTH_URL=https://platform.proofpass.co
NEXTAUTH_SECRET=GENERA_SECRET_SEGURO_AQUI
NEXT_PUBLIC_API_URL=https://api.proofpass.co
```

### 3.7 Iniciar Servicios en Producción

```bash
cd /opt/ProofPassPlatform

# Construir imágenes
docker compose -f docker-compose.production.yml build

# Iniciar servicios
docker compose -f docker-compose.production.yml up -d

# Ver logs
docker compose -f docker-compose.production.yml logs -f
```

### 3.8 Verificar Deployment

```bash
# Ver estado de contenedores
docker compose -f docker-compose.production.yml ps

# Todos deberían estar "Up" y "healthy"

# Probar API
curl https://api.proofpass.co/health

# Probar Platform (en navegador)
# https://platform.proofpass.co
```

### 3.9 Inicializar Base de Datos

```bash
# Ejecutar migraciones dentro del contenedor
docker compose -f docker-compose.production.yml exec api npm run db:migrate

# O inicializar manualmente
docker compose -f docker-compose.production.yml exec api npm run db:init
```

---

## Fase 4: Post-Deployment

### 4.1 Configurar Backups Automáticos

**Backup de Base de Datos:**
```bash
# Crear script de backup
cat > /opt/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/db"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

cd /opt/ProofPassPlatform
docker compose -f docker-compose.production.yml exec -T postgres \
  pg_dump -U proofpass proofpass > $BACKUP_DIR/proofpass_$DATE.sql

# Comprimir
gzip $BACKUP_DIR/proofpass_$DATE.sql

# Mantener solo últimos 30 días
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
EOF

chmod +x /opt/backup-db.sh

# Ejecutar diariamente a las 2 AM
echo "0 2 * * * /opt/backup-db.sh >> /var/log/backup-db.log 2>&1" | crontab -
```

### 4.2 Configurar Monitoreo

**Logs centralizados:**
```bash
# Ver logs en tiempo real
docker compose -f docker-compose.production.yml logs -f

# Ver logs de servicio específico
docker compose -f docker-compose.production.yml logs -f api
docker compose -f docker-compose.production.yml logs -f platform
```

**Recursos del sistema:**
```bash
# Monitorear uso de recursos
docker stats

# Ver uso de disco
df -h

# Ver memoria
free -h
```

### 4.3 Configurar Alertas (Opcional)

**Instalar herramienta de monitoreo:**

Opciones recomendadas:
- **UptimeRobot** (gratis): https://uptimerobot.com/
  - Monitorea https://api.proofpass.co/health
  - Alertas por email/SMS

- **Grafana + Prometheus** (self-hosted)
- **Datadog** (pago)
- **New Relic** (pago)

### 4.4 Actualización de la Plataforma

**Cuando necesites actualizar:**

```bash
cd /opt/ProofPassPlatform

# 1. Hacer backup antes de actualizar
/opt/backup-db.sh

# 2. Pull últimos cambios
git pull origin main

# 3. Reconstruir imágenes
docker compose -f docker-compose.production.yml build

# 4. Detener servicios
docker compose -f docker-compose.production.yml down

# 5. Iniciar con nuevas imágenes
docker compose -f docker-compose.production.yml up -d

# 6. Ver logs para verificar
docker compose -f docker-compose.production.yml logs -f
```

---

## Troubleshooting

### Problema: Servicios no inician

```bash
# Ver logs de error
docker compose -f docker-compose.production.yml logs

# Ver estado de contenedores
docker compose -f docker-compose.production.yml ps

# Reiniciar servicios
docker compose -f docker-compose.production.yml restart

# Reconstruir desde cero
docker compose -f docker-compose.production.yml down -v
docker compose -f docker-compose.production.yml up -d --build
```

### Problema: No puedo acceder a la plataforma

```bash
# 1. Verificar que los servicios estén corriendo
docker compose -f docker-compose.production.yml ps

# 2. Verificar que NGINX esté escuchando
docker compose -f docker-compose.production.yml exec nginx nginx -t

# 3. Verificar DNS
dig api.proofpass.co
dig platform.proofpass.co

# 4. Verificar firewall
ufw status

# 5. Verificar certificados SSL
openssl x509 -in nginx/ssl/api.proofpass.co.crt -noout -dates
```

### Problema: Base de datos no se conecta

```bash
# Verificar que PostgreSQL esté corriendo
docker compose -f docker-compose.production.yml exec postgres pg_isready

# Conectarse a la base de datos
docker compose -f docker-compose.production.yml exec postgres psql -U proofpass

# Ver logs de PostgreSQL
docker compose -f docker-compose.production.yml logs postgres
```

### Problema: Out of memory

```bash
# Ver uso de memoria
docker stats

# Aumentar swap (temporal)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Reiniciar servicios
docker compose -f docker-compose.production.yml restart
```

### Problema: SSL certificates expiraron

```bash
# Renovar manualmente
certbot renew

# Copiar certificados
/opt/renew-certs.sh

# Reiniciar NGINX
docker compose -f docker-compose.production.yml restart nginx
```

---

## 🎯 Checklist de Deployment

### Pre-Deployment
- [ ] Node.js 18+ instalado
- [ ] Docker Desktop instalado y corriendo
- [ ] PostgreSQL configurado (local o Docker)
- [ ] Redis configurado (local o Docker)
- [ ] Variables de entorno configuradas (`.env.local`)
- [ ] Dependencias instaladas (`npm install`)
- [ ] Base de datos inicializada
- [ ] API corriendo en local (`http://localhost:3000`)
- [ ] Platform corriendo en local (`http://localhost:3001`)
- [ ] Login funciona con credenciales de admin

### Docker Local Testing
- [ ] Docker Desktop iniciado
- [ ] Script de testing ejecutado (`./scripts/test-docker-local.sh`)
- [ ] Imágenes Docker construidas
- [ ] Servicios iniciados con docker-compose
- [ ] Health checks pasando
- [ ] API accesible en `https://localhost/health`
- [ ] Platform accesible en `https://localhost:3001`
- [ ] Login funciona en Docker

### Production Deployment
- [ ] Servidor de producción provisionado
- [ ] DNS configurados (api.proofpass.co, platform.proofpass.co)
- [ ] Docker instalado en servidor
- [ ] Firewall configurado (puertos 80, 443, 22)
- [ ] Repositorio clonado en servidor
- [ ] Certificados SSL de Let's Encrypt generados
- [ ] Certificados copiados a nginx/ssl/
- [ ] Variables de entorno de producción configuradas
- [ ] Secrets generados con openssl
- [ ] Servicios iniciados en producción
- [ ] Health checks pasando
- [ ] API accesible públicamente
- [ ] Platform accesible públicamente
- [ ] Login funciona en producción

### Post-Deployment
- [ ] Backups automáticos configurados
- [ ] Auto-renovación de SSL configurada
- [ ] Monitoreo configurado (UptimeRobot u otro)
- [ ] Alertas configuradas
- [ ] Documentación actualizada
- [ ] Equipo notificado

---

## 📞 Soporte

Si necesitas ayuda:

1. Revisa los logs: `docker compose -f docker-compose.production.yml logs`
2. Consulta `docs/DOCKER_TESTING.md` para testing local
3. Consulta `docs/DEPLOYMENT_GUIDE.md` para más detalles
4. Abre un issue en GitHub con los logs relevantes

---

## 📚 Próximos Pasos Sugeridos

Después de tener todo funcionando:

1. **Configurar CI/CD completo**: El workflow de GitHub Actions ya está configurado
2. **Implementar monitoreo avanzado**: Grafana + Prometheus
3. **Configurar CDN**: CloudFlare para mejor performance
4. **Implementar rate limiting**: A nivel de NGINX o aplicación
5. **Configurar alertas**: Para errores y downtime
6. **Documentar procedimientos**: De incident response
7. **Realizar load testing**: Con k6 o Artillery
8. **Configurar staging environment**: Para testing antes de producción

---

**¡Buena suerte con tu deployment!** 🚀
