# ProofPass - Setup de Producción

Guía completa para deployar ProofPass en producción con frontend en `proofpass.co` y backend en `api.proofpass.co`

## 🏗️ Arquitectura de Producción

```
┌─────────────────────────────────────────────────────────────┐
│                       FRONTEND                              │
│                    proofpass.co                             │
│              (Static Site / Vercel / Netlify)              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTPS/CORS
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    BACKEND API                               │
│                  api.proofpass.co                           │
│                                                             │
│  ┌──────────┐   ┌───────────┐   ┌─────────────┐           │
│  │  Nginx   │──▶│ Node.js   │──▶│ PostgreSQL  │           │
│  │ (Port 443)│   │ (Port 3000)│   │             │           │
│  └──────────┘   └─────┬─────┘   └─────────────┘           │
│                       │                                     │
│                       └──────────▶ Redis                    │
│                                                             │
│                              ▼                              │
│                      Stellar Blockchain                     │
│                      (Mainnet/Testnet)                      │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Estructura del Proyecto

```
ProofPassPlatform/
├── apps/
│   ├── api/                    # Backend API
│   │   ├── src/
│   │   │   ├── main.ts        # Entry point
│   │   │   ├── modules/
│   │   │   │   ├── auth/      # Autenticación
│   │   │   │   ├── blockchain/ # Blockchain ops
│   │   │   │   ├── attestations/
│   │   │   │   ├── passports/
│   │   │   │   └── zkp/
│   │   │   ├── middleware/    # Security, rate limit
│   │   │   └── config/        # DB, Redis, env
│   │   ├── deploy.sh          # Deployment script
│   │   └── README.md          # API documentation
│   │
│   └── dashboard/              # Frontend (opcional)
│       └── public/
│           └── blockchain-demo.html
│
├── packages/                   # Shared libraries
│   ├── stellar-sdk/           # Stellar integration
│   ├── vc-toolkit/            # Verifiable Credentials
│   ├── zk-toolkit/            # Zero-Knowledge Proofs
│   └── types/                 # TypeScript types
│
├── nginx/                      # Nginx configs
│   └── api.proofpass.co.conf  # API reverse proxy
│
├── docs/                       # Documentation
│   ├── API_DEPLOYMENT_GUIDE.md
│   ├── FRONTEND_INTEGRATION.md
│   ├── BLOCKCHAIN_API.md
│   └── QUICKSTART_BLOCKCHAIN.md
│
├── scripts/                    # Utility scripts
│   ├── setup.sh
│   ├── test-blockchain.ts
│   └── serve-demo.js
│
├── .env.production.api         # Production config template
└── docker-compose.yml          # Docker setup (dev)
```

## 🚀 Quick Start para Producción

### 1. Pre-requisitos

**Servidor/VPS:**
- Ubuntu 20.04+ o similar
- 2-4GB RAM
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- Nginx
- PM2

**Dominios configurados:**
- `api.proofpass.co` → IP del servidor
- `proofpass.co` → Hosting del frontend (Vercel/Netlify)

### 2. Instalación Rápida del API

```bash
# Clonar repositorio
git clone https://github.com/yourusername/ProofPassPlatform.git
cd ProofPassPlatform

# Configurar variables de entorno
cp .env.production.api apps/api/.env.production
nano apps/api/.env.production
# Completar con tus credenciales

# Ejecutar deployment script
cd apps/api
chmod +x deploy.sh
./deploy.sh production
```

### 3. Configurar Nginx

```bash
# Copiar configuración
sudo cp nginx/api.proofpass.co.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/api.proofpass.co.conf \
            /etc/nginx/sites-enabled/

# Obtener SSL con Let's Encrypt
sudo certbot --nginx -d api.proofpass.co

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 4. Integrar en Frontend

Ver [docs/FRONTEND_INTEGRATION.md](docs/FRONTEND_INTEGRATION.md) para código completo.

**Ejemplo mínimo:**

```javascript
// En tu web proofpass.co
const API_URL = 'https://api.proofpass.co/api/v1';

// Registro
const response = await fetch(`${API_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123',
    name: 'John Doe'
  })
});

const { token, user } = await response.json();
localStorage.setItem('token', token);

// Anclar en blockchain
const anchor = await fetch(`${API_URL}/blockchain/anchor`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    data: 'Certificación #12345'
  })
});

const { txHash } = await anchor.json();
console.log('TX Hash:', txHash);
```

## 🔐 Seguridad

### Variables de Entorno Críticas

Asegúrate de cambiar estos valores en `.env.production`:

```bash
# CAMBIAR ESTOS VALORES
JWT_SECRET=generate-random-32-char-string-here
API_KEY_SALT=generate-random-32-char-salt-here
DATABASE_PASSWORD=your-secure-db-password
REDIS_PASSWORD=your-secure-redis-password
STELLAR_SECRET_KEY=your-mainnet-secret-key

# CONFIGURAR CORS
CORS_ORIGIN=https://proofpass.co,https://www.proofpass.co
```

### Generar Secrets Seguros

```bash
# JWT Secret (32+ caracteres)
openssl rand -base64 32

# API Key Salt
openssl rand -hex 32
```

### Rate Limits (Producción)

Configurados en `.env.production.api`:

- **Auth endpoints:** 5 requests / 15 minutos
- **User endpoints:** 60 requests / minuto
- **Expensive ops:** 10 requests / minuto
- **Global:** 100 requests / minuto

## 📊 Monitoreo

### Health Checks

```bash
# API health
curl https://api.proofpass.co/health

# Readiness (incluye DB y Redis)
curl https://api.proofpass.co/ready
```

### Logs

```bash
# PM2 logs
pm2 logs proofpass-api

# Nginx logs
sudo tail -f /var/log/nginx/api.proofpass.co.access.log
sudo tail -f /var/log/nginx/api.proofpass.co.error.log

# Sistema
journalctl -u nginx -f
```

### Métricas

```bash
# PM2 monitoring
pm2 monit

# System resources
htop

# Database connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

## 🔄 Actualizaciones

```bash
# Pull cambios
cd /var/www/ProofPassPlatform
git pull origin main

# Deploy
cd apps/api
./deploy.sh production

# Verificar
pm2 logs proofpass-api
curl https://api.proofpass.co/health
```

## 🌐 Endpoints del API

### Públicos (sin autenticación)
- `GET /health` - Health check
- `GET /ready` - Readiness check
- `GET /api/v1/blockchain/info` - Info blockchain
- `GET /api/v1/blockchain/transactions/:hash` - Consultar TX
- `POST /api/v1/blockchain/verify` - Verificar datos
- `GET /docs` - Documentación Swagger

### Autenticación
- `POST /api/v1/auth/register` - Registrar usuario
- `POST /api/v1/auth/login` - Iniciar sesión
- `GET /api/v1/auth/me` - Usuario actual (requiere token)

### Blockchain (requiere auth)
- `GET /api/v1/blockchain/balance` - Ver balance
- `POST /api/v1/blockchain/anchor` - Anclar datos
- `GET /api/v1/blockchain/transactions` - Historial

### Attestations (requiere auth)
- `POST /api/v1/attestations` - Crear atestación
- `GET /api/v1/attestations/:id` - Ver atestación
- `POST /api/v1/attestations/:id/verify` - Verificar

### Passports (requiere auth)
- `POST /api/v1/passports` - Crear pasaporte
- `GET /api/v1/passports/:id` - Ver pasaporte
- `PATCH /api/v1/passports/:id` - Actualizar pasaporte

## 📚 Documentación Completa

- **[API Deployment Guide](docs/API_DEPLOYMENT_GUIDE.md)** - Guía detallada de deployment
- **[Frontend Integration](docs/FRONTEND_INTEGRATION.md)** - Ejemplos de integración
- **[Blockchain API](docs/BLOCKCHAIN_API.md)** - Documentación blockchain
- **[API README](apps/api/README.md)** - README del API
- **[Swagger Docs](https://api.proofpass.co/docs)** - Documentación interactiva

## 🔍 Testing

### API Testing

```bash
# Health
curl https://api.proofpass.co/health

# Blockchain info (público)
curl https://api.proofpass.co/api/v1/blockchain/info

# Register
curl -X POST https://api.proofpass.co/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Login y obtener token
TOKEN=$(curl -X POST https://api.proofpass.co/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  | jq -r '.token')

# Anchor data (con auth)
curl -X POST https://api.proofpass.co/api/v1/blockchain/anchor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"data":"Test certification"}'
```

### Frontend Testing

```javascript
// Abrir consola en proofpass.co y ejecutar:
fetch('https://api.proofpass.co/health')
  .then(r => r.json())
  .then(console.log);
```

## 🆘 Troubleshooting

### API no responde

```bash
# Verificar proceso
pm2 list

# Ver logs
pm2 logs proofpass-api --lines 100

# Restart
pm2 restart proofpass-api
```

### CORS Errors

```bash
# Verificar configuración
grep CORS_ORIGIN /var/www/ProofPassPlatform/apps/api/.env.production

# Test CORS
curl -H "Origin: https://proofpass.co" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://api.proofpass.co/api/v1/blockchain/anchor
```

### Database Connection

```bash
# Test connection
psql -h localhost -U proofpass_user -d proofpass_prod

# Ver conexiones
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

### SSL Issues

```bash
# Renovar certificado
sudo certbot renew

# Verificar certificado
sudo certbot certificates

# Test SSL
openssl s_client -connect api.proofpass.co:443
```

## 🔒 Backup

### Database Backup

```bash
# Manual backup
pg_dump proofpass_prod > backup_$(date +%Y%m%d).sql

# Automated (añadir a crontab)
0 2 * * * pg_dump proofpass_prod > /backup/proofpass_$(date +\%Y\%m\%d).sql
```

### Restore

```bash
# Restore database
psql proofpass_prod < backup_20241030.sql
```

## 🎯 Checklist de Producción

Antes de lanzar, verifica:

- [ ] Variables de entorno configuradas correctamente
- [ ] JWT_SECRET y API_KEY_SALT únicos y seguros
- [ ] CORS_ORIGIN configurado para tu dominio
- [ ] SSL/HTTPS configurado con Let's Encrypt
- [ ] Firewall configurado (UFW)
- [ ] PM2 configurado para auto-restart
- [ ] Backups automatizados de DB
- [ ] Logs rotación configurada
- [ ] Monitoreo activo (PM2, logs)
- [ ] Rate limits apropiados
- [ ] Stellar en mainnet (no testnet) para producción
- [ ] Documentación actualizada
- [ ] Health checks funcionando
- [ ] Frontend puede conectarse al API

## 📞 Soporte

- **Issues:** [GitHub Issues](https://github.com/yourusername/ProofPassPlatform/issues)
- **Email:** support@proofpass.co
- **Docs:** Ver carpeta `/docs`

## 📄 Licencia

Ver [LICENSE](LICENSE) para detalles.

---

**🚀 ¡Tu plataforma ProofPass está lista para producción!**

Para más información, consulta la documentación completa en la carpeta `/docs`.
