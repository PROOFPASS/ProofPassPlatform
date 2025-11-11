# 🚀 ProofPass Platform - Quick Start Guide

## ¿Por dónde empiezo?

### 📍 Opción 1: Desarrollo Local (Más Rápido para Empezar)

**Tiempo estimado: 15-20 minutos**

```bash
# 1. Instalar dependencias básicas (si no las tienes)
brew install postgresql@15 redis node@18

# 2. Iniciar servicios
brew services start postgresql@15
brew services start redis

# 3. Crear base de datos
createdb proofpass

# 4. Configurar API
cd apps/api
cat > .env.local << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:@localhost:5432/proofpass
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev_jwt_secret
ADMIN_EMAIL=admin@proofpass.local
ADMIN_PASSWORD=admin123
CORS_ORIGIN=http://localhost:3001
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
EOF

npm install
npm run db:init  # o npm run db:migrate
npm run dev      # API en http://localhost:3000

# 5. En otra terminal - Configurar Platform
cd apps/platform
cat > .env.local << 'EOF'
NODE_ENV=development
PORT=3001
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=dev_nextauth_secret
NEXT_PUBLIC_API_URL=http://localhost:3000
ADMIN_EMAIL=admin@proofpass.local
ADMIN_PASSWORD=admin123
EOF

npm install
npm run dev      # Platform en http://localhost:3001

# 6. ¡Listo! Abre http://localhost:3001
# Login: admin@proofpass.local / admin123
```

---

### 🐳 Opción 2: Docker Local (Más Cercano a Producción)

**Tiempo estimado: 10-15 minutos** (primera vez puede tardar más por descargas)

```bash
# 1. Abrir Docker Desktop (debe estar instalado)

# 2. Ejecutar script automatizado
./scripts/test-docker-local.sh

# El script hará todo automáticamente:
# - Verificar Docker
# - Crear SSL certificates
# - Construir imágenes
# - Iniciar servicios

# 3. ¡Listo! Abre https://localhost:3001
# (Acepta advertencia SSL - es normal con certificados self-signed)
# Login: admin@proofpass.local / Admin_Local_2025
```

---

### ☁️ Opción 3: Deployment a Producción

**Tiempo estimado: 1-2 horas** (primera vez)

Ver guía completa: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)

**Pasos resumidos:**

1. **Servidor**: Contratar servidor (DigitalOcean, AWS, etc.)
2. **DNS**: Configurar dominios (api.proofpass.co, platform.proofpass.co)
3. **SSL**: Generar certificados con Let's Encrypt
4. **Deploy**: Clonar repo y ejecutar docker-compose
5. **Verificar**: Probar que todo funciona

---

## 🎯 ¿Qué Opción Elegir?

| Opción | Cuándo usarla | Pros | Contras |
|--------|---------------|------|---------|
| **Desarrollo Local** | Desarrollando nuevas features | ✅ Hot reload<br>✅ Debugging fácil<br>✅ Rápido | ❌ Necesita PostgreSQL local |
| **Docker Local** | Probando antes de deploy | ✅ Igual que producción<br>✅ Aislado | ❌ No tiene hot reload |
| **Producción** | Despliegue final | ✅ Disponible públicamente<br>✅ SSL real | ❌ Necesita servidor |

---

## 📋 Pre-requisitos Según Opción

### Desarrollo Local
```bash
# Verificar que tienes todo
node --version    # v18+
npm --version     # v8+
psql --version    # v15+
redis-cli --version  # v7+
```

### Docker Local
```bash
# Solo necesitas
docker --version  # v24+
docker compose version  # v2.20+
```

### Producción
- Servidor Ubuntu 22.04
- 4 GB RAM, 2 CPU cores
- Dominios configurados
- Docker instalado en servidor

---

## 🆘 Problemas Comunes

### "Cannot connect to database"
```bash
# Verificar que PostgreSQL está corriendo
brew services list | grep postgresql

# O con Docker
docker ps | grep postgres
```

### "Redis connection refused"
```bash
# Verificar que Redis está corriendo
brew services list | grep redis

# O con Docker
docker ps | grep redis
```

### "Docker daemon not running"
```bash
# Abrir Docker Desktop desde Aplicaciones
# Esperar a que el ícono deje de parpadear
```

### "Port 3000/3001 already in use"
```bash
# Ver qué proceso está usando el puerto
lsof -i :3000
lsof -i :3001

# Matar el proceso
kill -9 PID
```

---

## 📚 Documentación Completa

- **Plan de Implementación**: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- **Testing Docker**: [docs/DOCKER_TESTING.md](./docs/DOCKER_TESTING.md)
- **Deployment Producción**: [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)
- **Integración**: [INTEGRATION.md](./INTEGRATION.md)
- **Testing**: [TESTING.md](./TESTING.md)

---

## ✅ Checklist de Primera Vez

- [ ] Clonar repositorio
- [ ] Instalar dependencias (Node.js, PostgreSQL, Redis)
- [ ] Crear bases de datos
- [ ] Configurar .env.local
- [ ] Instalar npm packages
- [ ] Inicializar base de datos
- [ ] Iniciar API (`npm run dev`)
- [ ] Iniciar Platform (`npm run dev`)
- [ ] Abrir http://localhost:3001
- [ ] Login con admin@proofpass.local / admin123
- [ ] ✨ ¡Explorar la plataforma!

---

## 🎉 ¡Siguiente Paso!

Una vez que tengas la plataforma corriendo:

1. **Explorar el dashboard** en http://localhost:3001
2. **Probar la API** en http://localhost:3000/health
3. **Leer la documentación** para entender la arquitectura
4. **Empezar a desarrollar** nuevas features
5. **Hacer deploy a producción** cuando estés listo

---

**¿Necesitas ayuda?** Abre un issue en GitHub o consulta IMPLEMENTATION_PLAN.md para más detalles.

**¡Buena suerte!** 🚀
