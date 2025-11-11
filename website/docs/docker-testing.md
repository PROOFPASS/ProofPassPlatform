# ProofPass Platform - Local Docker Testing Guide

Esta guía te ayudará a probar el stack completo de Docker en tu máquina local antes de deployar a producción.

## 📋 Pre-requisitos

1. **Docker Desktop** instalado y ejecutándose
   - macOS: [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
   - Windows: [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
   - Linux: [Docker Engine](https://docs.docker.com/engine/install/)

2. **Docker Compose** incluido con Docker Desktop
   - Verifica con: `docker-compose --version`

3. **OpenSSL** para generar certificados (incluido en macOS/Linux)

## 🚀 Testing Rápido con Script Automatizado

### Opción 1: Script Automatizado (Recomendado)

Ejecuta el script de testing que automatiza todo el proceso:

```bash
./scripts/test-docker-local.sh
```

El script hará:
1. ✅ Verificar que Docker esté corriendo
2. ✅ Verificar/crear `.env.production`
3. ✅ Generar certificados SSL self-signed
4. ✅ Construir imágenes Docker (API + Platform)
5. ✅ Ofrecer iniciar los servicios
6. ✅ Mostrar estado y URLs de acceso

## 🛠️ Testing Manual Paso a Paso

### 1. Preparar Entorno

```bash
# Asegúrate de estar en el directorio raíz
cd /Users/fboiero/Documents/GitHub/ProofPassPlatform

# Verifica que Docker esté corriendo
docker info
```

### 2. Configurar Variables de Entorno

El archivo `.env.production` ya está configurado para testing local con valores seguros de prueba.

Si quieres modificar algún valor:

```bash
# Editar variables de entorno
nano .env.production
```

### 3. Verificar Certificados SSL

Los certificados SSL self-signed ya fueron generados en `nginx/ssl/`:

```bash
ls -lh nginx/ssl/
```

Deberías ver:
- `api.proofpass.co.crt` y `api.proofpass.co.key`
- `platform.proofpass.co.crt` y `platform.proofpass.co.key`

### 4. Construir Imágenes Docker

```bash
# Construir imagen API
docker build -t proofpass-api:local ./apps/api

# Construir imagen Platform
docker build -t proofpass-platform:local ./apps/platform

# Verificar imágenes creadas
docker images | grep proofpass
```

### 5. Iniciar Stack Completo

```bash
# Iniciar todos los servicios
docker-compose -f docker-compose.production.yml --env-file .env.production up -d

# Ver logs en tiempo real
docker-compose -f docker-compose.production.yml logs -f

# Ver logs de un servicio específico
docker-compose -f docker-compose.production.yml logs -f api
docker-compose -f docker-compose.production.yml logs -f platform
```

### 6. Verificar Servicios

```bash
# Ver estado de todos los contenedores
docker-compose -f docker-compose.production.yml ps

# Debería mostrar todos los servicios como "Up" y "healthy"
```

### 7. Probar Endpoints

```bash
# Probar API Health Check (ignorar advertencia SSL)
curl -k https://localhost/health

# Probar Platform (ignorar advertencia SSL)
curl -k https://localhost:3001

# Probar conexión a PostgreSQL
docker-compose -f docker-compose.production.yml exec postgres psql -U proofpass -c "SELECT version();"

# Probar conexión a Redis
docker-compose -f docker-compose.production.yml exec redis redis-cli -a Redis_Local_2025_SecurePassword ping
```

## 🌐 URLs de Acceso

Con certificados self-signed (verás advertencias SSL, esto es normal):

- **API Health Check**: https://localhost/health
- **API Endpoint**: https://localhost/api
- **Platform Dashboard**: https://localhost:3001

## 🔍 Comandos Útiles

### Ver Logs

```bash
# Todos los servicios
docker-compose -f docker-compose.production.yml logs -f

# Servicio específico
docker-compose -f docker-compose.production.yml logs -f api
docker-compose -f docker-compose.production.yml logs -f platform
docker-compose -f docker-compose.production.yml logs -f nginx

# Últimas 100 líneas
docker-compose -f docker-compose.production.yml logs --tail=100 api
```

### Gestión de Servicios

```bash
# Detener servicios
docker-compose -f docker-compose.production.yml stop

# Iniciar servicios
docker-compose -f docker-compose.production.yml start

# Reiniciar un servicio
docker-compose -f docker-compose.production.yml restart api

# Detener y eliminar contenedores
docker-compose -f docker-compose.production.yml down

# Detener y eliminar contenedores + volúmenes
docker-compose -f docker-compose.production.yml down -v
```

### Debugging

```bash
# Ejecutar comando en contenedor
docker-compose -f docker-compose.production.yml exec api sh

# Ver variables de entorno de un servicio
docker-compose -f docker-compose.production.yml exec api env

# Ver uso de recursos
docker stats

# Inspeccionar red
docker network inspect proofpassplatform_proofpass-network
```

### Limpieza

```bash
# Eliminar contenedores y volúmenes
docker-compose -f docker-compose.production.yml down -v

# Eliminar imágenes locales
docker rmi proofpass-api:local proofpass-platform:local

# Limpieza completa de Docker
docker system prune -a --volumes
```

## 🧪 Tests de Funcionalidad

### Test 1: API Health Check

```bash
curl -k https://localhost/health
# Debería responder: {"status":"ok"}
```

### Test 2: Database Connection

```bash
docker-compose -f docker-compose.production.yml exec postgres psql -U proofpass -d proofpass -c "\dt"
# Debería listar las tablas de la base de datos
```

### Test 3: Platform Build

```bash
docker-compose -f docker-compose.production.yml logs platform | grep "Ready"
# Debería ver: "Ready on http://0.0.0.0:3001"
```

### Test 4: NGINX Proxy

```bash
# Test proxy a API
curl -k -I https://localhost/health

# Test proxy a Platform
curl -k -I https://localhost:3001
```

## ❗ Troubleshooting

### Problema: Docker no está corriendo

```
Error: Cannot connect to the Docker daemon
```

**Solución**: Inicia Docker Desktop desde Aplicaciones.

### Problema: Puertos ya en uso

```
Error: bind: address already in use
```

**Solución**: Verifica qué está usando los puertos:

```bash
# macOS/Linux
lsof -i :80
lsof -i :443
lsof -i :3001

# Detén el servicio conflictivo o cambia los puertos en docker-compose
```

### Problema: Servicios no inician

```bash
# Ver logs de error
docker-compose -f docker-compose.production.yml logs

# Verificar configuración
docker-compose -f docker-compose.production.yml config

# Reconstruir desde cero
docker-compose -f docker-compose.production.yml down -v
docker-compose -f docker-compose.production.yml up -d --build
```

### Problema: SSL Certificate Warnings

Esto es **normal** con certificados self-signed. Para acceder en el navegador:

1. Chrome/Edge: Click en "Advanced" → "Proceed to localhost (unsafe)"
2. Firefox: Click en "Advanced" → "Accept the Risk and Continue"
3. Safari: Click en "Show Details" → "visit this website"

### Problema: Platform no se construye

```bash
# Ver logs detallados del build
docker-compose -f docker-compose.production.yml build --no-cache platform

# Si falla por memoria, aumenta recursos en Docker Desktop
# Settings → Resources → Memory: 4GB o más
```

## 📊 Monitoreo

### Ver Estado de Servicios

```bash
# Dashboard en tiempo real
docker stats

# Estado de salud
docker-compose -f docker-compose.production.yml ps
```

### Acceder a Logs Estructurados

```bash
# API logs
docker-compose -f docker-compose.production.yml exec api tail -f /app/logs/app.log

# NGINX logs
docker-compose -f docker-compose.production.yml exec nginx tail -f /var/log/nginx/access.log
```

## 🔒 Seguridad en Testing Local

**IMPORTANTE**: Los valores en `.env.production` son solo para testing local.

**NUNCA uses estos valores en producción real:**

- ✅ OK para testing local
- ❌ NUNCA en producción
- ❌ NUNCA en repositorio público

Para producción, genera secrets seguros:

```bash
# Generar JWT Secret
openssl rand -base64 32

# Generar NextAuth Secret
openssl rand -base64 32

# Generar password seguro
openssl rand -base64 24
```

## 🎯 Próximos Pasos

Después de verificar que todo funciona localmente:

1. **Testing de Features**: Verifica que todas las funcionalidades trabajen correctamente
2. **Performance**: Mide tiempos de respuesta y uso de recursos
3. **Logs**: Revisa que los logs sean informativos y estructurados
4. **Production Deployment**: Sigue la guía en `docs/DEPLOYMENT_GUIDE.md`

## 📚 Recursos Adicionales

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Deployment a producción
- [Integration Guide](../INTEGRATION.md) - Testing de integración
- [API Documentation](./API_DOCUMENTATION.md) - Documentación de API
- [Docker Documentation](https://docs.docker.com/) - Docs oficiales de Docker

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose -f docker-compose.production.yml logs`
2. Verifica la configuración: `docker-compose -f docker-compose.production.yml config`
3. Consulta el troubleshooting en `docs/DEPLOYMENT_GUIDE.md`
4. Abre un issue en GitHub con los logs relevantes

---

**Happy Testing!** 🚀
