# ProofPass - Scripts de Utilidad

Scripts para facilitar el desarrollo, testing y deployment de ProofPass Platform.

## 🚀 Scripts Principales

### 1. check-and-fix.sh
Verifica y arregla problemas comunes en el entorno de desarrollo.

```bash
./scripts/check-and-fix.sh
```

**Qué hace:**
- ✅ Verifica Node.js, npm, Docker
- ✅ Instala dependencias si faltan
- ✅ Construye packages si es necesario
- ✅ Crea archivos de configuración (`.env.docker`)

### 2. run-tests.sh
Ejecuta los tests del proyecto.

```bash
# Ejecutar todos los tests
./scripts/run-tests.sh all

# Solo tests del API
./scripts/run-tests.sh api

# Solo tests del Platform
./scripts/run-tests.sh platform

# Solo tests de packages
./scripts/run-tests.sh packages

# Sin coverage
./scripts/run-tests.sh all no
```

**Qué hace:**
- ✅ Verifica y levanta PostgreSQL y Redis si es necesario
- ✅ Ejecuta tests con o sin coverage
- ✅ Reporta resultados claros

### 3. docker-test.sh
Construye y prueba las imágenes Docker.

```bash
# Construir todas las imágenes
./scripts/docker-test.sh all

# Solo API
./scripts/docker-test.sh api

# Solo Platform
./scripts/docker-test.sh platform
```

**Qué hace:**
- ✅ Verifica que Docker esté corriendo
- ✅ Construye imágenes Docker
- ✅ Muestra tamaño de las imágenes
- ✅ Opcionalmente prueba los containers

## 🎯 Flujo Recomendado

### Para Desarrollo Local

```bash
# 1. Verificar entorno
./scripts/check-and-fix.sh

# 2. Ejecutar tests
./scripts/run-tests.sh all

# 3. Levantar servicios
docker-compose up
```

### Para Testing de Docker

```bash
# 1. Verificar entorno
./scripts/check-and-fix.sh

# 2. Construir imágenes
./scripts/docker-test.sh all

# 3. Levantar con docker-compose
docker-compose up
```

### Para CI/CD

Los tests se ejecutan automáticamente en GitHub Actions. Ver `.github/workflows/ci.yml`.

## 📝 Otros Scripts Disponibles

- **deploy-prod.sh**: Deploy a producción
- **deploy-aws.sh**: Deploy específico para AWS
- **test-docker-local.sh**: Testing de Docker con setup local
- **local-setup.sh**: Setup inicial del ambiente local
- **quick-start.sh**: Inicio rápido del proyecto

## 🔧 Troubleshooting

### Docker no está corriendo

```bash
# macOS
open -a Docker

# Espera a que Docker esté listo
docker ps
```

### PostgreSQL no se conecta

```bash
# Con Docker
docker-compose up -d postgres

# Local (macOS)
brew services start postgresql
```

### Tests fallan

```bash
# Rebuild packages
npm run build:packages

# Regenerar prisma client
cd apps/api && npx prisma generate

# Ejecutar migraciones
cd apps/api && npx prisma migrate dev
```

### Error de permisos

```bash
# Hacer scripts ejecutables
chmod +x scripts/*.sh
```

## 🚀 Comandos Rápidos

```bash
# Check everything
./scripts/check-and-fix.sh && ./scripts/run-tests.sh all

# Build and test Docker
./scripts/docker-test.sh all && docker-compose up

# Full CI/CD simulation
./scripts/check-and-fix.sh && \
./scripts/run-tests.sh all && \
./scripts/docker-test.sh all
```

## 📚 Documentación Adicional

- [Getting Started](../docs/GETTING_STARTED.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)
- [Testing Guide](../docs/testing/MAINTAINABLE_TESTS.md)
- [CI/CD Workflow](../.github/workflows/ci.yml)

## 💡 Tips

1. **Siempre ejecuta `check-and-fix.sh` primero** - Esto asegura que tu entorno está listo
2. **Usa `run-tests.sh` antes de commits** - Previene errores en CI/CD
3. **Prueba con Docker antes de deploy** - Asegura que las imágenes funcionan
4. **Mira los logs** - Cada script muestra información útil

## 🤝 Contribuir

Si encuentras problemas o quieres mejorar estos scripts:

1. Abre un issue
2. Propón cambios
3. Documenta nuevos scripts aquí

---

**¿Preguntas?** Ver [documentación principal](../README.md)
