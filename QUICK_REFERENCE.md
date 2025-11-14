# ProofPass Platform - Referencia Rápida

## Comandos Más Usados

### Desarrollo Local
```bash
# Verificar y arreglar entorno
./scripts/check-and-fix.sh

# Ejecutar tests
./scripts/run-tests.sh all

# Iniciar servicios
docker-compose up

# Desarrollo (con hot reload)
npm run dev:api       # API en 3000
npm run dev:platform  # Platform en 3001
```

### Docker
```bash
# Construir imágenes
./scripts/docker-test.sh all

# Levantar stack completo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar todo
docker-compose down
```

### Database
```bash
# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate

# Ver base de datos
npm run db:studio

# Reset completo
npm run db:reset
```

### Build
```bash
# Build packages
npm run build:packages

# Build API
npm run build:api

# Build todo
npm run build
```

## Estructura del Proyecto

```
ProofPassPlatform/
├── apps/
│   ├── api/           # Backend (Fastify + PostgreSQL)
│   └── platform/      # Frontend (Next.js 15 + React 19)
├── packages/
│   ├── types/         # TypeScript types compartidos
│   ├── vc-toolkit/    # W3C Verifiable Credentials
│   ├── zk-toolkit/    # Zero-knowledge proofs
│   ├── blockchain/    # Multi-blockchain (Stellar, Optimism, Arbitrum)
│   ├── client/        # SDK JavaScript
│   ├── templates/     # Templates de credentials
│   └── qr-toolkit/    # Generación de QR codes
├── scripts/           # Scripts de utilidad
├── docs/              # Documentación completa
└── examples/          # Ejemplos y demos
```

## Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `README.md` | Documentación principal |
| `TESTING_AND_DOCKER_SETUP.md` | Guía de tests y Docker |
| `DEPENDENCY_AUDIT.md` | Auditoría de dependencias |
| `docs/GETTING_STARTED.md` | Guía completa de inicio |
| `docs/DEPLOYMENT.md` | Guía de deployment |
| `scripts/README.md` | Documentación de scripts |
| `.env.docker` | Configuración para Docker |
| `docker-compose.yml` | Orquestación de servicios |

## URLs y Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| API | 3000 | http://localhost:3000 |
| Platform | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Prisma Studio | 5555 | http://localhost:5555 |
| API Swagger | 3000 | http://localhost:3000/documentation |

## Testing

```bash
# Todos los tests
./scripts/run-tests.sh all

# Por tipo
./scripts/run-tests.sh api
./scripts/run-tests.sh platform
./scripts/run-tests.sh packages

# Con coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Docker Commands

```bash
# Build imagen API
docker build -t proofpass-api .

# Build imagen Platform
docker build -t proofpass-platform -f apps/platform/Dockerfile apps/platform

# Run API solo
docker run -p 3000:3000 --env-file .env.docker proofpass-api

# Stack completo
docker-compose up -d

# Ver estado
docker-compose ps

# Logs de un servicio
docker-compose logs -f api

# Reiniciar un servicio
docker-compose restart api

# Limpiar todo
docker-compose down -v
```

## Dependencias Principales

### API
- **Fastify** 4.25.2 - Framework web
- **PostgreSQL** + **Prisma** - Database
- **Redis** - Cache y rate limiting
- **JWT** - Autenticación
- **OpenTelemetry** - Observabilidad

### Platform
- **Next.js** 15.5.6 - Framework React
- **React** 19.2.0 - UI library
- **Tailwind CSS** - Styling
- **Radix UI** - Components
- **TanStack Query** - State management

### Packages
- **@proofpass/vc-toolkit** - W3C VCs
- **@proofpass/zk-toolkit** - ZK proofs
- **@proofpass/blockchain** - Multi-chain

## Troubleshooting Rápido

### Docker no inicia
```bash
# macOS
open -a Docker

# Verificar
docker ps
```

### PostgreSQL no conecta
```bash
# Con Docker
docker-compose up -d postgres

# Local
brew services start postgresql
```

### Tests fallan
```bash
# Rebuild packages
npm run build:packages

# Regenerar Prisma
cd apps/api && npx prisma generate
```

### Port en uso
```bash
# Ver qué usa el puerto
lsof -i :3000

# Matar proceso
kill -9 <PID>
```

## CI/CD

### GitHub Actions
- **Trigger**: Push/PR a main o develop
- **Jobs**:
  1. Test API (con PostgreSQL/Redis)
  2. Test Platform
  3. Security Audit
  4. Build Docker (solo main)
  5. Deploy (placeholder)

### Container Registry
- **Registry**: ghcr.io/proofpass/proofpassplatform
- **Images**: api, platform
- **Tags**: latest, {sha}
- **Limpieza**: Mantiene 2 versiones

## Variables de Entorno

### API (.env)
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
REDIS_URL=redis://...
STELLAR_SECRET_KEY=...
```

### Platform (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=...
```

## Documentación Completa

- **Getting Started**: `docs/GETTING_STARTED.md`
- **Deployment**: `docs/DEPLOYMENT.md`
- **API Reference**: `docs/API_REFERENCE.md`
- **Testing**: `docs/testing/MAINTAINABLE_TESTS.md`
- **Security**: `docs/SECURITY.md`
- **Architecture**: `docs/architecture/`

## Flujos de Trabajo Comunes

### Nuevo Feature
```bash
1. git checkout -b feat/nueva-funcionalidad
2. # Hacer cambios
3. npm run build:packages
4. npm run test
5. git add .
6. git commit -m "feat: descripción"
7. git push origin feat/nueva-funcionalidad
8. # Abrir PR en GitHub
```

### Deploy a Producción
```bash
1. Verificar tests: ./scripts/run-tests.sh all
2. Verificar Docker: ./scripts/docker-test.sh all
3. Merge a main
4. CI/CD automático
5. Verificar en production
```

### Debugging Local
```bash
1. ./scripts/check-and-fix.sh
2. docker-compose up -d postgres redis
3. npm run dev:api
4. # En otra terminal
5. npm run dev:platform
6. # Ver logs
```

## Tips

- Ejecuta `check-and-fix.sh` antes de empezar
- Usa `test:watch` durante desarrollo
- Revisa logs con `docker-compose logs -f`
- Usa Prisma Studio para ver la DB
- Ejecuta tests antes de commits

## Ayuda

- **Scripts**: `scripts/README.md`
- **Testing**: `TESTING_AND_DOCKER_SETUP.md`
- **Dependencies**: `DEPENDENCY_AUDIT.md`
- **Issues**: GitHub Issues
- **Docs**: `docs/README.md`

---

**Última actualización**: Noviembre 2024
**Versión**: 2.0.0
