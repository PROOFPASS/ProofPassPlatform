# ProofPass Platform - Estado Actual del Desarrollo

**Última actualización:** Noviembre 3, 2025
**Autor:** @fboiero

## 🎯 Resumen Ejecutivo

ProofPass Platform es una plataforma SaaS completa para la emisión y verificación de attestations digitales con soporte de blockchain. El proyecto ha completado la **Fase 1 (Backend Core)** y está listo para continuar con la implementación EVM.

## ✅ Implementaciones Completadas

### 1. Backend API (Fastify + PostgreSQL + Redis)

**Commit:** Multiple commits desde `009ebd8` hasta `6d28dc9`
**Estado:** ✅ **COMPLETADO Y PRODUCTION-READY**

#### Características:
- **Framework:** Fastify con TypeScript strict mode
- **Base de datos:** PostgreSQL con Prisma ORM
- **Cache:** Redis para rate limiting y queues
- **Autenticación:** JWT + API Keys con salting
- **Seguridad:**
  - Helmet para HTTP headers
  - Rate limiting multi-tier (Redis)
  - Content-Type validation
  - Request size limiting
  - Input sanitization
  - CORS configurado
- **Observabilidad:**
  - OpenTelemetry completo (traces + metrics)
  - Prometheus exporters
  - Jaeger integration
  - Pino logger con pretty print
- **Job Queues:**
  - BullMQ con 5 queues
  - VC Issuance, VC Verification, Webhooks, Emails, DID Operations
  - Worker pools configurables
  - Retry automático con exponential backoff
  - API REST para gestión de queues
- **Documentación API:** Swagger/OpenAPI completo

#### Endpoints Principales:
```
GET  /health                    - Health check
GET  /ready                     - Readiness check
GET  /docs                      - Swagger UI
GET  /metrics                   - Prometheus metrics

POST /api/v1/auth/login         - Login
POST /api/v1/auth/register      - Registro

POST /api/v1/attestations       - Crear attestation
GET  /api/v1/attestations/:id   - Obtener attestation

GET  /queue/stats                - Estadísticas de queues
GET  /queue/:name/jobs           - Listar jobs
POST /queue/:name/job/:id/retry  - Retry job

GET  /api/v1/usage/stats         - Estadísticas de uso
GET  /api/v1/usage/report        - Reporte mensual
```

### 2. DIDs y Verifiable Credentials (W3C Compliant)

**Commits:** `f74182d`, `5331b51`
**Estado:** ✅ **COMPLETADO Y W3C COMPLIANT**

#### DID Methods Implementados:
- **did:key** (Self-contained)
  - Ed25519 signatures
  - Multicodec encoding (0xed01)
  - Base58 identifiers
  - Compatible con did-jwt-vc

- **did:web** (Domain-based)
  - DNS-based DIDs para organizaciones
  - DID Documents W3C compliant
  - Resolución HTTPS automática
  - Path customization

#### Verifiable Credentials:
- **Issuance:**
  - Usando `did-jwt-vc` ^3.2.0
  - JWT format con EdDSA signatures
  - Custom credential types
  - Expiration handling

- **Verification:**
  - DID resolution automática
  - Signature verification
  - Expiration checks
  - Batch verification support

#### Tests:
- 60+ tests individuales
- Coverage > 85%
- Jest configurado
- 4 test suites completos

### 3. Rate Limiting y Quota Management

**Commit:** `f74182d`
**Estado:** ✅ **COMPLETADO**

#### Tiers Configurados:
| Tier       | Requests/hora | Requests/mes | VCs/mes |
|------------|--------------|--------------|---------|
| Free       | 100          | 10,000       | 100     |
| Pro        | 1,000        | 200,000      | 5,000   |
| Enterprise | 10,000       | 2,000,000    | 50,000  |

#### Features:
- Rate limiting distribuido (Redis)
- Tracking granular (hora/día/mes)
- Endpoints de métricas
- Quota checking antes de operaciones
- Usage recording automático

### 4. Blockchain Integration (Stellar)

**Commit:** `009ebd8`
**Estado:** ✅ **STELLAR COMPLETADO**

#### Implementación:
- Stellar SDK integrado
- Testnet y Mainnet support
- Asset emission para attestations
- Transaction signing
- Balance checking
- Tests completos

#### Archivos:
- `packages/blockchain/src/stellar/stellar-client.ts`
- `packages/blockchain/src/stellar/attestation-contract.ts`
- `packages/blockchain/__tests__/stellar.test.ts`

### 5. OpenBao (Secrets Management)

**Commit:** `e365f4b`
**Estado:** ✅ **INTEGRACIÓN COMPLETA**

#### Features:
- KV Secrets Engine v2
- Transit Engine para encryption
- Dynamic secrets
- Lease management
- Auto-renewal de tokens
- Error handling completo

### 6. Security Features (Phase 4)

**Estado:** ✅ **COMPLETADO**

#### Implementaciones:
- Security headers (Helmet)
- Content Security Policy
- Request validation
- Input sanitization
- Rate limiting por endpoint
- API key authentication
- JWT token management
- CORS whitelist

## 🚧 En Desarrollo / Pendiente

### 1. EVM Blockchain Support (Optimism/Base/Arbitrum)

**Estado:** ❌ **NO INICIADO**
**Prioridad:** 🔥 **ALTA - PRÓXIMO TRABAJO**

#### Objetivo:
Implementar soporte completo para blockchains EVM (Ethereum Virtual Machine) incluyendo Optimism, Base (Coinbase) y Arbitrum para ampliar las capacidades de attestations on-chain.

#### Alcance Técnico:

**A. Smart Contracts (Solidity)**
```
packages/blockchain/contracts/
  ├── AttestationRegistry.sol      - Registro principal de attestations
  ├── AttestationVerifier.sol      - Verificación on-chain
  └── AccessControl.sol            - Control de permisos
```

Características requeridas:
- ERC-721 o ERC-1155 para attestations como NFTs
- Merkle trees para batch attestations
- Gas optimization
- Upgradeable contracts (UUPS pattern)
- Events para indexing
- Multi-signature support

**B. SDK/Client (TypeScript)**
```
packages/blockchain/src/evm/
  ├── evm-client.ts                - Cliente principal
  ├── contracts/                   - Contract ABIs y wrappers
  ├── providers/                   - Optimism, Base, Arbitrum
  └── utils/                       - Gas estimation, signing
```

Funcionalidades:
- ethers.js v6 integration
- Wallet integration (MetaMask, WalletConnect)
- Gas price optimization
- Transaction batching
- Event listening y indexing
- Retry logic con exponential backoff

**C. Backend Integration**
```
apps/api/src/modules/blockchain/
  ├── evm-service.ts               - Service layer
  ├── evm-controller.ts            - API endpoints
  └── queue/evm-jobs.ts            - Async job processors
```

Endpoints necesarios:
- `POST /api/v1/blockchain/evm/attestation` - Crear attestation on-chain
- `GET /api/v1/blockchain/evm/attestation/:id` - Verificar attestation
- `GET /api/v1/blockchain/evm/gas-price` - Gas price estimation
- `POST /api/v1/blockchain/evm/batch` - Batch attestations

**D. Networks Support**

| Network  | Chain ID | RPC URL Env Var           | Explorer                     |
|----------|----------|---------------------------|------------------------------|
| Optimism | 10       | OPTIMISM_RPC_URL          | optimistic.etherscan.io      |
| Base     | 8453     | BASE_RPC_URL              | basescan.org                 |
| Arbitrum | 42161    | ARBITRUM_RPC_URL          | arbiscan.io                  |
| Sepolia  | 11155111 | SEPOLIA_RPC_URL (testnet) | sepolia.etherscan.io         |

**E. Testing**
- Unit tests para smart contracts (Hardhat)
- Integration tests con local testnet (Anvil/Ganache)
- E2E tests con testnets
- Gas cost analysis
- Security audit (Slither, Mythril)

**F. Documentación**
- EVM_INTEGRATION.md con arquitectura
- Contract deployment guides
- API examples
- Gas optimization tips
- Security best practices

#### Estimación:
- Smart Contracts: 2-3 días
- SDK Implementation: 2-3 días
- Backend Integration: 1-2 días
- Testing: 1-2 días
- **Total: ~8-10 días**

### 2. Zero-Knowledge Proofs (ZKP) - Production Readiness

**Estado:** ⚠️ **IMPLEMENTACIÓN DUAL - REQUIERE INTEGRACIÓN**
**Prioridad:** 🔥 **ALTA - CRÍTICO PARA PRIVACIDAD**

#### Situación Actual:

El sistema ZKP tiene **DOS implementaciones paralelas**:

**A. Implementación Simplificada (En Uso Actualmente)** ❌
- **Archivo:** `packages/zk-toolkit/src/circuits.ts`
- **Tecnología:** SHA-256 hashes + HMAC (NO son pruebas zero-knowledge reales)
- **Estado:** Funcional pero **NO es criptográficamente segura**
- **Problema:** Solo provee commitment-based proofs, sin propiedades ZK
- **Exportado por:** `packages/zk-toolkit/src/index.ts` (API pública usa esto)

**B. Implementación Real (Existe pero NO se Usa)** ⚠️
- **Archivo:** `packages/zk-toolkit/src/snark-proofs.ts`
- **Tecnología:** zk-SNARKs (Groth16) con snarkjs
- **Estado:** Código completo pero **falta infraestructura**
- **Problema:** No exportado, requiere artifacts que no existen
- **Potencial:** Production-ready una vez configurado

#### Análisis Detallado:

**1. Implementación Simplificada (circuits.ts)**

Archivos involucrados:
```typescript
packages/zk-toolkit/src/circuits.ts           // Proofs simplificados
apps/api/src/modules/zkp/service.ts           // API usa estos proofs
apps/api/src/modules/zkp/routes.ts            // Endpoints ZKP
```

Limitaciones críticas:
- ❌ **NO son zero-knowledge**: Los proofs usan hashes que pueden ser reverseados
- ❌ **NO son sound**: Un atacante puede falsificar proofs
- ❌ **NO proveen privacy**: No hay ocultamiento real de datos
- ❌ **NO son producción**: Claramente marcado como "MVP/demo"

Nota en el código (líneas 5-9):
```typescript
/**
 * NOTE: These are simplified proof systems for MVP.
 * Production implementation should use:
 * - snarkjs + circom for zk-SNARKs
 * - bulletproofs-js for bulletproofs
 */
```

**2. Implementación Real (snark-proofs.ts)**

Archivos involucrados:
```typescript
packages/zk-toolkit/src/snark-proofs.ts       // Real zk-SNARKs
packages/zk-toolkit/src/replay-protection.ts  // Nullifier tracking
```

Features implementadas:
- ✅ snarkjs integration (Groth16 proof system)
- ✅ Witness generation
- ✅ Public signals handling
- ✅ Nullifier generation (anti-replay)
- ✅ Three circuit types: threshold, range, set-membership
- ✅ Verification functions completas

**Problema crítico:** Requiere artifacts que no existen:
```
packages/zk-toolkit/build/threshold_js/threshold.wasm      ❌ No existe
packages/zk-toolkit/keys/threshold_final.zkey              ❌ No existe
packages/zk-toolkit/keys/threshold_verification_key.json   ❌ No existe
packages/zk-toolkit/build/range_js/range.wasm              ❌ No existe
packages/zk-toolkit/build/set-membership_js/...            ❌ No existe
```

**3. Replay Protection**

Implementación:
- ✅ Código completo en `replay-protection.ts`
- ⚠️ In-memory store (no persistence)
- ✅ SQL migration provisto para PostgreSQL
- ❌ NO integrado con database real

#### ¿Qué Falta para Producción?

**FASE 1: Circom Circuits (2-3 días)** 🔥

Crear archivos `.circom`:

```
packages/zk-toolkit/circuits/
  ├── threshold.circom              - Proof de value >= threshold
  ├── range.circom                  - Proof de min <= value <= max
  ├── set-membership.circom         - Proof de value in set
  ├── poseidon.circom               - Hash function (from circomlib)
  └── comparators.circom            - Comparison circuits
```

Cada circuit necesita:
- Input signals definition
- Output signals (public)
- Constraint logic
- Tests unitarios

Ejemplo estructura `threshold.circom`:
```circom
pragma circom 2.0.0;

include "comparators.circom";
include "poseidon.circom";

template Threshold() {
    // Private inputs
    signal input value;
    signal private input nullifier;

    // Public inputs
    signal input threshold;

    // Public outputs
    signal output nullifierHash;
    signal output isValid;

    // Constraints
    component gte = GreaterEqThan(64);
    gte.in[0] <== value;
    gte.in[1] <== threshold;
    isValid <== gte.out;

    // Nullifier hash (anti-replay)
    component hasher = Poseidon(1);
    hasher.inputs[0] <== nullifier;
    nullifierHash <== hasher.out;
}

component main = Threshold();
```

**FASE 2: Build Pipeline (1-2 días)**

Setup de compilación:

```bash
# Instalar Circom compiler
npm install -g circom

# Instalar snarkjs
npm install --save-dev snarkjs

# Scripts en package.json
"scripts": {
  "circuits:compile": "circom circuits/*.circom --r1cs --wasm --sym",
  "circuits:info": "snarkjs r1cs info build/*.r1cs",
  "circuits:export": "snarkjs r1cs export json build/*.r1cs",
  "circuits:test": "node tests/circuit-tests.js"
}
```

Archivos a crear:
- `packages/zk-toolkit/scripts/compile-circuits.sh`
- `packages/zk-toolkit/scripts/generate-witnesses.js`
- `packages/zk-toolkit/tests/circuit-tests.js`

**FASE 3: Trusted Setup (2-3 días)** 🔥

El proceso más crítico y delicado:

**A. Powers of Tau Ceremony**
```bash
# Phase 1: Universal setup (solo una vez)
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
```

**B. Circuit-Specific Setup**
```bash
# Para threshold circuit
snarkjs groth16 setup build/threshold.r1cs pot12_final.ptau threshold_0000.zkey
snarkjs zkey contribute threshold_0000.zkey threshold_final.zkey --name="Contribution 1" -v
snarkjs zkey export verificationkey threshold_final.zkey threshold_verification_key.json

# Repetir para range.circom y set-membership.circom
```

**C. Security Considerations**
- Multi-party computation (MPC) para trusted setup
- Mínimo 3-5 contribuciones independientes
- Destrucción segura de toxic waste
- Auditoría del proceso

Archivos generados:
```
packages/zk-toolkit/keys/
  ├── pot12_final.ptau                      # Universal setup
  ├── threshold_final.zkey                  # Proving key
  ├── threshold_verification_key.json       # Verification key
  ├── range_final.zkey
  ├── range_verification_key.json
  ├── set-membership_final.zkey
  └── set-membership_verification_key.json
```

**FASE 4: Integration & Testing (2-3 días)**

**A. Actualizar exports**
```typescript
// packages/zk-toolkit/src/index.ts
export * from './snark-proofs';  // Cambiar de './circuits'
export * from './replay-protection';
```

**B. Migrar API service**
```typescript
// apps/api/src/modules/zkp/service.ts
import { SNARKProofs } from '@proofpass/zk-toolkit';

// Cambiar de:
import { generateThresholdProof } from '@proofpass/zk-toolkit';

// A:
import { SNARKProofs } from '@proofpass/zk-toolkit';
const { proof, publicSignals } = await SNARKProofs.generateThresholdProof(inputs);
```

**C. Integrar replay protection**
```typescript
// apps/api/src/modules/zkp/service.ts
import { verifyAndRecordNullifier } from '@proofpass/zk-toolkit';

// Después de verificar proof
await verifyAndRecordNullifier(
  nullifierHash,
  'threshold',
  { userId, attestationId }
);
```

**D. Database migration**
```sql
-- prisma/migrations/XXX_add_nullifier_tracking/migration.sql
CREATE TABLE nullifiers (
  nullifier VARCHAR(128) PRIMARY KEY,
  proof_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id VARCHAR(255),
  attestation_id VARCHAR(255),
  metadata JSONB,
  INDEX idx_nullifier_timestamp (timestamp),
  INDEX idx_nullifier_type (proof_type)
);

CREATE TABLE zkp_transactions (
  tx_hash VARCHAR(128) PRIMARY KEY,
  blockchain VARCHAR(50) NOT NULL,
  data_hash VARCHAR(64) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);
```

**FASE 5: Performance & Production (1-2 días)**

**A. Benchmarking**
- Proof generation time (target: <5s)
- Verification time (target: <100ms)
- Memory usage
- Key loading time

**B. Optimizations**
- Key caching en memoria
- Worker pools para proof generation
- Queue system para proofs pesados
- Circuit size optimization

**C. Monitoring**
```typescript
// Metrics
- zkp_proof_generation_duration_seconds
- zkp_proof_verification_duration_seconds
- zkp_proof_generation_errors_total
- zkp_nullifier_collisions_total
```

**FASE 6: Security Audit (3-5 días)** 🔒

**A. Circuit Auditing**
- Review de constraints
- Soundness verification
- Completeness checks
- Under-constrained circuits detection

Herramientas:
```bash
npm install -g circom-inspect
circom-inspect build/threshold.r1cs
```

**B. Cryptographic Review**
- Trusted setup verification
- Key generation process
- Randomness sources
- Side-channel vulnerabilities

**C. Integration Security**
- Nullifier tracking completeness
- Replay attack prevention
- Input validation
- Error handling

#### Dependencias a Agregar:

```json
{
  "dependencies": {
    "snarkjs": "^0.7.0",
    "ffjavascript": "^0.2.60"
  },
  "devDependencies": {
    "circom": "^2.1.6",
    "circom_tester": "^0.0.19"
  }
}
```

#### Archivos a Crear:

```
packages/zk-toolkit/
  ├── circuits/                        ❌ CREAR
  │   ├── threshold.circom
  │   ├── range.circom
  │   ├── set-membership.circom
  │   ├── poseidon.circom
  │   └── comparators.circom
  ├── build/                           ❌ CREAR (auto-generated)
  │   ├── threshold_js/
  │   ├── range_js/
  │   └── set-membership_js/
  ├── keys/                            ❌ CREAR (trusted setup)
  │   ├── pot12_final.ptau
  │   ├── threshold_final.zkey
  │   ├── threshold_verification_key.json
  │   └── ...
  ├── scripts/                         ❌ CREAR
  │   ├── compile-circuits.sh
  │   ├── trusted-setup.sh
  │   └── generate-witnesses.js
  └── docs/                            ❌ CREAR
      ├── CIRCUITS.md
      ├── TRUSTED_SETUP.md
      └── SECURITY.md
```

#### Estimación de Tiempo:

| Fase | Descripción | Días | Prioridad |
|------|-------------|------|-----------|
| 1 | Circom Circuits | 2-3 | 🔥 Alta |
| 2 | Build Pipeline | 1-2 | 🔥 Alta |
| 3 | Trusted Setup | 2-3 | 🔥 Crítica |
| 4 | Integration | 2-3 | Alta |
| 5 | Performance | 1-2 | Media |
| 6 | Security Audit | 3-5 | 🔥 Crítica |
| **TOTAL** | **11-18 días** | | |

#### Riesgos y Consideraciones:

**1. Trusted Setup Ceremony**
- Requiere múltiples participantes independientes
- Proceso irreversible (re-hacer cuesta días)
- Debe ser documentado públicamente
- Critical path: No se puede usar hasta completar

**2. Performance**
- Groth16 proofs pueden ser lentos (1-10s)
- Proofs grandes pueden consumir mucha memoria
- Necesita hardware adecuado (min 8GB RAM)

**3. Usabilidad**
- API users deben esperar async proof generation
- Queue system necesario para scale
- Proofs deben ser almacenados (no regenerables)

**4. Mantenimiento**
- Circuits no pueden cambiar post-setup
- Nuevos circuits requieren nuevo trusted setup
- Keys deben ser backed up securely

#### Alternativas (Si ZKP Real No es Viable):

**Opción A: Usar protocolo existente**
- Semaphore (identity proofs)
- MACI (anonymous voting)
- Aztec (private transactions)

**Opción B: Diferir ZKP, usar crypto alternativa**
- Blind signatures (RSA blind signatures)
- Anonymous credentials (CL signatures)
- Ring signatures (Monero-style)

**Opción C: MVP con disclaimer**
- Mantener proofs simplificados
- Agregar disclaimer claro en documentación
- Roadmap público para ZKP real

#### Recomendación:

**Para ProofPass Platform:**

**Corto Plazo (MVP):**
- Mantener implementación simplificada
- Agregar disclaimer prominente
- Documentar limitaciones claramente
- Planificar migración a SNARKs

**Medio Plazo (Beta):**
- Implementar Fases 1-4 (Circom + Integration)
- Testing extensivo
- Security review interno

**Largo Plazo (Production):**
- Trusted setup con MPC ceremony
- Security audit externo
- Performance optimization
- Migración gradual de usuarios

**Recursos Necesarios:**
- Desarrollador con experiencia en Circom: 1 persona
- Cryptographer para review: 1 consultoría
- DevOps para infraestructura: 0.5 persona
- Testing: 1 persona

### 3. Frontend Dashboard (Next.js)

**Estado:** ⚠️ **PARCIALMENTE INICIADO**

#### Completado:
- Next.js 15.5.6 setup
- Tailwind CSS configurado
- App Router structure
- TypeScript configurado

#### Pendiente:
- Authentication UI (NextAuth.js)
- Organizations dashboard
- Payments management
- API Keys management
- Analytics dashboard
- Attestations UI

### 3. Deployment & DevOps

**Estado:** ⚠️ **PARCIALMENTE COMPLETADO**

#### Completado:
- Docker setup para desarrollo
- docker-compose.yml con servicios
- Scripts de setup local

#### Pendiente:
- Kubernetes manifests
- CI/CD pipelines (GitHub Actions)
- Production dockerfile optimizado
- Monitoring dashboards (Grafana)
- Alerting setup
- Backup strategies
- CDN configuration

## 📊 Métricas del Proyecto

### Código
- **Lenguajes:** TypeScript (strict), Solidity (pendiente)
- **Líneas de código:** ~15,000+ (backend)
- **Test coverage:** > 85% (packages)
- **Packages:** 9 monorepo packages

### Dependencias Principales
- Fastify ^4.25.0
- Prisma ^5.8.0
- BullMQ ^5.1.0
- OpenTelemetry ^1.18.0
- did-jwt-vc ^3.2.0
- Stellar SDK ^11.0.0
- ethers.js ^6.x (pendiente)

### Performance
- API Response time: <100ms (p95)
- Database queries: <50ms (p95)
- Rate limit: Configurable por tier
- Queue throughput: ~1000 jobs/min

## 🔐 Security Status

### Implementado:
- ✅ Input validation y sanitization
- ✅ Rate limiting multi-tier
- ✅ JWT authentication
- ✅ API key management
- ✅ CORS whitelist
- ✅ Security headers (Helmet)
- ✅ Request size limiting
- ✅ OpenBao secrets management

### Pendiente:
- ⏳ Smart contract audit
- ⏳ Penetration testing
- ⏳ Bug bounty program
- ⏳ SOC 2 compliance

## 📚 Documentación

### Existente:
- ✅ README.md (general)
- ✅ QUEUE.md (BullMQ guide)
- ✅ DID_INTEGRATION.md (DIDs y VCs)
- ✅ LOCAL_DEVELOPMENT.md (setup local)
- ✅ TECHNICAL_ARCHITECTURE.md
- ✅ API Documentation (Swagger)

### Por Crear:
- ⏳ EVM_INTEGRATION.md (próximo)
- ⏳ DEPLOYMENT.md
- ⏳ SECURITY.md
- ⏳ CONTRIBUTING.md
- ⏳ API_REFERENCE.md detallado

## 🎯 Próximos Pasos

### Inmediato (Esta semana):
1. 🔥 **Implementar EVM blockchain support**
   - Smart contracts en Solidity
   - SDK con ethers.js
   - Integration con Optimism/Base/Arbitrum
   - Tests completos
   - Documentación

### Corto plazo (Próximas 2 semanas):
2. Completar Frontend Dashboard
3. Implementar autenticación completa
4. Setup CI/CD pipelines
5. Deploy a staging environment

### Medio plazo (Próximo mes):
6. Performance optimization
7. Security audit
8. Beta testing con usuarios reales
9. Documentación completa para developers
10. Marketing website

## 🐛 Issues Conocidos

1. **tsx watch hot-reload** - Problemas con tsx watch causando reloads constantes
   - **Workaround:** Usar `npx tsx` directamente o compilar con `npm run build`

2. **Package-lock.json** - Cambios frecuentes por instalaciones
   - **Solución:** Commit periódicos, usar `npm ci` en CI/CD

3. **OpenTelemetry overhead** - Ligero impacto en performance en desarrollo
   - **Solución:** Disable en ambiente local si es necesario

## 📞 Contacto y Soporte

**Desarrollador:** @fboiero
**Repositorio:** GitHub.com/fboiero/ProofPassPlatform
**Issues:** GitHub Issues
**Documentación:** /docs folder

---

**Leyenda:**
- ✅ Completado y production-ready
- ⚠️ En progreso o parcialmente completo
- ❌ No iniciado
- 🔥 Alta prioridad
- ⏳ Pendiente planificación

**Última revisión:** 2025-11-03
