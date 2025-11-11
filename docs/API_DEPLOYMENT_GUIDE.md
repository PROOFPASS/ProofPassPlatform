# Guía de Deployment - API ProofPass

Guía completa para deployar el API de ProofPass en `api.proofpass.co`

## 🎯 Arquitectura

```
┌─────────────────┐
│  proofpass.co   │  (Frontend Web)
│   Static Site   │
└────────┬────────┘
         │ HTTPS
         │ CORS enabled
         ▼
┌─────────────────┐
│ api.proofpass.co│  (Backend API)
│     Nginx       │  Port 443
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Node.js App   │  Port 3000
│   (Fastify)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│PostgreSQL│ │ Redis  │
└────────┘ └────────┘
```

## 📋 Pre-requisitos

### Servidor
- Ubuntu 20.04+ o similar
- 2GB RAM mínimo (4GB recomendado)
- 20GB storage
- Acceso root/sudo

### Software
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Nginx
- PM2 (process manager)
- Certbot (SSL)

### DNS
Configurar registro A en tu DNS:
```
api.proofpass.co  →  [IP_DEL_SERVIDOR]
```

## 🚀 Instalación Paso a Paso

### 1. Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Redis
sudo apt install -y redis-server

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2
sudo npm install -g pm2

# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Configurar PostgreSQL

```bash
# Conectar a PostgreSQL
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE proofpass_prod;
CREATE USER proofpass_user WITH ENCRYPTED PASSWORD 'SECURE_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE proofpass_prod TO proofpass_user;
\q

# Habilitar conexiones remotas (opcional)
sudo nano /etc/postgresql/14/main/postgresql.conf
# Descomentar y cambiar: listen_addresses = '*'

sudo nano /etc/postgresql/14/main/pg_hba.conf
# Agregar: host all all 0.0.0.0/0 md5

sudo systemctl restart postgresql
```

### 3. Configurar Redis

```bash
# Configurar Redis con password
sudo nano /etc/redis/redis.conf

# Buscar y cambiar:
# requirepass YOUR_REDIS_PASSWORD

# Reiniciar Redis
sudo systemctl restart redis
sudo systemctl enable redis
```

### 4. Clonar y Configurar Proyecto

```bash
# Crear directorio para apps
sudo mkdir -p /var/www
cd /var/www

# Clonar repositorio
sudo git clone https://github.com/yourusername/ProofPassPlatform.git
cd ProofPassPlatform

# Dar permisos
sudo chown -R $USER:$USER /var/www/ProofPassPlatform

# Instalar dependencias
npm install

# Build packages
npm run build:packages

# Build API
cd apps/api
npm run build
```

### 5. Configurar Variables de Entorno

```bash
cd /var/www/ProofPassPlatform/apps/api

# Copiar template
cp ../../.env.production.api .env.production

# Editar con tus credenciales
nano .env.production

# Valores importantes:
# NODE_ENV=production
# DATABASE_HOST=localhost
# DATABASE_PASSWORD=...
# REDIS_URL=redis://...
# JWT_SECRET=...
# STELLAR_SECRET_KEY=...
# CORS_ORIGIN=https://proofpass.co,https://www.proofpass.co
```

### 6. Ejecutar Migraciones

```bash
cd /var/www/ProofPassPlatform/apps/api

# Cargar variables
export $(cat .env.production | grep -v '^#' | xargs)

# Ejecutar migraciones
npm run migrate
```

### 7. Configurar PM2

```bash
cd /var/www/ProofPassPlatform/apps/api

# Iniciar con PM2
pm2 start dist/main.js --name proofpass-api

# Configurar auto-start en boot
pm2 startup
# Ejecutar el comando que PM2 muestra

pm2 save

# Ver logs
pm2 logs proofpass-api

# Monitorear
pm2 monit
```

### 8. Configurar Nginx

```bash
# Copiar configuración
sudo cp /var/www/ProofPassPlatform/nginx/api.proofpass.co.conf \
        /etc/nginx/sites-available/api.proofpass.co

# Crear symlink
sudo ln -s /etc/nginx/sites-available/api.proofpass.co \
            /etc/nginx/sites-enabled/

# Eliminar config default si existe
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 9. Configurar SSL con Let's Encrypt

```bash
# Obtener certificado
sudo certbot --nginx -d api.proofpass.co

# Configurar renovación automática
sudo certbot renew --dry-run

# Certbot crea cron job automáticamente en:
# /etc/cron.d/certbot
```

### 10. Verificar Deployment

```bash
# Health check
curl https://api.proofpass.co/health

# Debería retornar:
# {"status":"ok","timestamp":"...","version":"0.1.0"}

# Ver documentación
# Abrir en navegador: https://api.proofpass.co/docs
```

## 🔒 Configuración de Seguridad

### Firewall (UFW)

```bash
# Configurar firewall
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
sudo ufw status
```

### Fail2Ban (Protección contra brute force)

```bash
# Instalar
sudo apt install -y fail2ban

# Configurar
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Agregar:
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

### Hardening PostgreSQL

```bash
# Cambiar permisos
sudo chmod 750 /var/lib/postgresql/14/main

# Backup automático
sudo crontab -e
# Agregar:
0 2 * * * pg_dump proofpass_prod > /backup/proofpass_$(date +\%Y\%m\%d).sql
```

## 📊 Monitoreo y Logs

### Ver Logs de PM2

```bash
# Logs en tiempo real
pm2 logs proofpass-api

# Últimos 100 lines
pm2 logs proofpass-api --lines 100

# Logs con errores
pm2 logs proofpass-api --err

# Limpiar logs
pm2 flush
```

### Logs de Nginx

```bash
# Access logs
sudo tail -f /var/log/nginx/api.proofpass.co.access.log

# Error logs
sudo tail -f /var/log/nginx/api.proofpass.co.error.log

# Analizar logs con goaccess
sudo apt install goaccess
sudo goaccess /var/log/nginx/api.proofpass.co.access.log --log-format=COMBINED
```

### Monitoreo de Recursos

```bash
# CPU y memoria
pm2 monit

# Métricas detalladas
pm2 install pm2-server-monit

# Disk usage
df -h

# PostgreSQL stats
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

## 🔄 Actualización y Mantenimiento

### Actualizar API

```bash
cd /var/www/ProofPassPlatform

# Pull cambios
git pull origin main

# Reinstalar dependencias
npm install

# Rebuild
npm run build:packages
cd apps/api
npm run build

# Ejecutar migraciones si hay
npm run migrate

# Restart PM2
pm2 restart proofpass-api

# Ver logs
pm2 logs proofpass-api --lines 50
```

### Script de Deploy Automático

```bash
# Usar el script de deploy
cd /var/www/ProofPassPlatform/apps/api
chmod +x deploy.sh
./deploy.sh production
```

### Rollback

```bash
cd /var/www/ProofPassPlatform

# Ver commits
git log --oneline -10

# Rollback a commit específico
git checkout COMMIT_HASH

# Rebuild
npm install
npm run build:packages
cd apps/api
npm run build

# Restart
pm2 restart proofpass-api
```

## 🔐 Backup y Restore

### Backup Database

```bash
# Manual backup
pg_dump proofpass_prod > backup_$(date +%Y%m%d).sql

# Automated backup (cron)
0 2 * * * pg_dump proofpass_prod > /backup/proofpass_$(date +\%Y\%m\%d).sql

# Backup con compresión
pg_dump proofpass_prod | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# Restore desde backup
psql proofpass_prod < backup_20241030.sql

# Restore desde backup comprimido
gunzip -c backup_20241030.sql.gz | psql proofpass_prod
```

## 🐛 Troubleshooting

### API no responde

```bash
# Verificar proceso
pm2 list

# Ver logs
pm2 logs proofpass-api

# Restart
pm2 restart proofpass-api

# Verificar puerto
sudo netstat -tlnp | grep 3000
```

### Errores de Base de Datos

```bash
# Verificar conexión
psql -h localhost -U proofpass_user -d proofpass_prod

# Ver conexiones activas
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Errores de CORS

```bash
# Verificar CORS en .env
cat /var/www/ProofPassPlatform/apps/api/.env.production | grep CORS

# Test CORS
curl -H "Origin: https://proofpass.co" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://api.proofpass.co/api/v1/blockchain/anchor
```

### SSL no funciona

```bash
# Renovar certificado
sudo certbot renew --force-renewal

# Verificar certificado
sudo certbot certificates

# Test SSL
openssl s_client -connect api.proofpass.co:443
```

## 📱 Integración con Frontend

Ver [Frontend Integration Guide](FRONTEND_INTEGRATION.md) para ejemplos de código.

### Quick Test desde Frontend

```javascript
// Test desde consola del navegador en proofpass.co
fetch('https://api.proofpass.co/health')
  .then(r => r.json())
  .then(console.log);
```

## 📚 Recursos

- [API README](../apps/api/README.md)
- [Blockchain API Docs](BLOCKCHAIN_API.md)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Let's Encrypt](https://letsencrypt.org/)

## 🆘 Soporte

- GitHub Issues
- Email: support@proofpass.co
- Docs: https://docs.proofpass.co
