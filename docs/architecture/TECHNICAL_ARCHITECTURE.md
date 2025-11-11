# ProofPass Platform - Arquitectura Técnica Completa

Guía detallada de todas las tecnologías, componentes y cómo funcionan juntos.

## Índice

1. [Visión General](#1-visión-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura de Aplicaciones](#3-arquitectura-de-aplicaciones)
4. [Packages y Librerías](#4-packages-y-librerías)
5. [Blockchain Multi-Chain](#5-blockchain-multi-chain)
6. [Verifiable Credentials (W3C)](#6-verifiable-credentials-w3c)
7. [Base de Datos](#7-base-de-datos)
8. [Autenticación y Autorización](#8-autenticación-y-autorización)
9. [Pagos con Stripe](#9-pagos-con-stripe)
10. [Flujos de Datos](#10-flujos-de-datos)
11. [Seguridad](#11-seguridad)
12. [Testing](#12-testing)

---

## 1. Visión General

ProofPass es una **plataforma SaaS multi-blockchain** para crear, gestionar y verificar **attestations** (certificaciones digitales) como:
- Credenciales verificables (diplomas, certificados)
- Identidades digitales (KYC/AML)
- Licencias profesionales
- Verificación de edad
- Pasaportes digitales

### Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard  │  │ Organization │  │   Payments   │      │
│  │   (Admin)   │  │  Management  │  │   (Stripe)   │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS/REST
┌────────────────────────▼────────────────────────────────────┐
│                    BACKEND API (Express)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Auth    │  │  Attest  │  │ Passport │  │  Payments │  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes   │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
└────────────────┬───────────────┬────────────────────────────┘
                 │               │
        ┌────────▼───────┐      │
        │   PostgreSQL   │      │
        │   (Prisma)     │      │
        └────────────────┘      │
                                │
        ┌───────────────────────▼────────────────────┐
        │       BLOCKCHAIN LAYER (Multi-Chain)       │
        │  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
        │  │ Optimism │  │ Arbitrum │  │ Stellar │  │
        │  │  (L2)    │  │   (L2)   │  │  (L1)   │  │
        │  └──────────┘  └──────────┘  └─────────┘  │
        └────────────────────────────────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │   VERIFIABLE CREDENTIALS        │
        │   (W3C Standard + Ed25519)      │
        └─────────────────────────────────┘
```

---

## 2. Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Next.js** | 15.5.6 | Framework React con SSR/SSG |
| **React** | 19.2.0 | Librería UI |
| **TypeScript** | 5.3.3 | Tipado estático |
| **Tailwind CSS** | 3.4.0 | Estilos utility-first |
| **NextAuth.js** | 4.24.5 | Autenticación |
| **React Query** | 5.17.0 | Estado del servidor |
| **React Hook Form** | 7.49.0 | Manejo de formularios |
| **Zod** | 3.22.4 | Validación de schemas |

**¿Por qué Next.js?**
- SSR (Server-Side Rendering) para SEO
- File-based routing
- API routes integradas
- Optimización automática de imágenes
- Fast Refresh

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Node.js** | 18+ | Runtime JavaScript |
| **Express** | 4.18.0 | Framework HTTP |
| **Prisma** | 5.8.0 | ORM para PostgreSQL |
| **PostgreSQL** | 14+ | Base de datos relacional |
| **JWT** | 9.0.2 | Tokens de autenticación |
| **Stripe** | 14.10.0 | Procesamiento de pagos |

**¿Por qué Express?**
- Ligero y flexible
- Ecosistema maduro
- Fácil integración con TypeScript
- Middleware extensible

### Blockchain

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Ethers.js** | 6.9.0 | Interacción con EVM chains |
| **Stellar SDK** | 11.2.0 | Interacción con Stellar |
| **Optimism** | L2 | Attestations en Ethereum L2 |
| **Arbitrum** | L2 | Attestations en Ethereum L2 |
| **Stellar** | L1 | Attestations en Stellar |

**¿Por qué Multi-Chain?**
- **Optimism**: Gas bajo, compatible con Ethereum
- **Arbitrum**: Mayor adopción, EVM compatible
- **Stellar**: Ultra-barato, diseñado para pagos/assets

### Verifiable Credentials

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **@noble/ed25519** | 2.0.0 | Criptografía Ed25519 |
| **@noble/hashes** | 1.3.0 | Funciones hash |
| **multibase** | 4.0.6 | Encoding multi-formato |
| **multiformats** | 12.1.0 | Formatos de datos |

**¿Por qué Ed25519?**
- Firmas más pequeñas (64 bytes vs 65 RSA)
- Más rápido
- Resistente a ataques de canal lateral
- Estándar W3C DID

### Testing

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Jest** | 29.7.0 | Framework de testing |
| **ts-jest** | 29.1.1 | Jest con TypeScript |
| **Coverage** | 85%+ | Threshold mínimo |

---

## 3. Arquitectura de Aplicaciones

### apps/api (Backend)

```
apps/api/
├── src/
│   ├── routes/           # Endpoints REST
│   │   ├── auth.ts       # POST /auth/login, /auth/register
│   │   ├── attestations.ts   # CRUD attestations
│   │   ├── passports.ts      # CRUD passports
│   │   ├── organizations.ts  # CRUD organizations
│   │   └── payments.ts       # Stripe webhooks
│   ├── middleware/
│   │   ├── auth.ts       # Verificar JWT
│   │   ├── rateLimit.ts  # Rate limiting
│   │   └── validation.ts # Validar schemas
│   ├── services/
│   │   ├── blockchain.ts # Interacción blockchain
│   │   ├── vc.ts         # Crear VCs
│   │   └── stripe.ts     # Pagos
│   └── prisma/
│       └── schema.prisma # Modelo de datos
└── tests/
```

**Flujo de Request:**

```
Cliente → Middleware (Auth) → Middleware (Validation)
   → Controller → Service → Database/Blockchain
   → Response
```

**Ejemplo de Endpoint:**

```typescript
// POST /api/attestations
router.post('/attestations',
  authMiddleware,           // Verificar JWT
  validateSchema(createAttestationSchema), // Validar datos
  async (req, res) => {
    const { templateId, claims, userId } = req.body;

    // 1. Crear VC (W3C)
    const vc = await vcService.createCredential({
      issuer: req.user.did,
      credentialSubject: claims,
    });

    // 2. Guardar en DB
    const attestation = await prisma.attestation.create({
      data: {
        vcId: vc.id,
        templateId,
        claims,
        userId,
      },
    });

    // 3. Registrar en blockchain
    await blockchainService.registerAttestation(
      attestation.id,
      vc.proof.proofValue
    );

    res.json(attestation);
  }
);
```

### apps/platform (Frontend)

```
apps/platform/
├── app/                  # Next.js App Router
│   ├── (auth)/
│   │   ├── login/        # Página de login
│   │   └── register/     # Página de registro
│   ├── dashboard/        # Dashboard principal
│   │   ├── page.tsx      # Vista general
│   │   ├── attestations/ # Gestión de attestations
│   │   ├── passports/    # Gestión de passports
│   │   └── settings/     # Configuración
│   ├── api/              # API routes (NextAuth)
│   │   └── auth/
│   └── layout.tsx        # Layout principal
├── components/
│   ├── ui/               # Componentes UI reutilizables
│   └── features/         # Componentes de features
└── lib/
    ├── api.ts            # Cliente API
    └── utils.ts          # Utilidades
```

**Flujo de Autenticación:**

```
1. Usuario → /login
2. NextAuth → Verificar credenciales con API
3. API → Verificar en DB
4. API → Generar JWT
5. NextAuth → Crear sesión
6. Usuario → Redirigir a /dashboard
```

**Ejemplo de Componente:**

```typescript
// app/dashboard/attestations/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AttestationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['attestations'],
    queryFn: () => api.get('/attestations'),
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      <h1>Mis Attestations</h1>
      {data.map(attestation => (
        <AttestationCard key={attestation.id} {...attestation} />
      ))}
    </div>
  );
}
```

---

## 4. Packages y Librerías

### packages/types (TypeScript Types)

**Propósito**: Tipos compartidos entre todos los packages.

```typescript
// packages/types/src/index.ts
export interface Attestation {
  id: string;
  templateId: string;
  claims: Record<string, any>;
  vcId: string;
  status: 'active' | 'revoked';
  createdAt: Date;
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: any;
  proof: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    proofValue: string;
  };
}
```

### packages/blockchain (Multi-Chain)

**Propósito**: Abstracción para interactuar con múltiples blockchains.

```typescript
// packages/blockchain/src/blockchain-manager.ts
export class BlockchainManager {
  private providers: Map<string, IBlockchainProvider>;

  constructor() {
    this.providers = new Map([
      ['optimism', new OptimismProvider()],
      ['arbitrum', new ArbitrumProvider()],
      ['stellar', new StellarProvider()],
    ]);
  }

  async registerAttestation(
    chain: 'optimism' | 'arbitrum' | 'stellar',
    attestationId: string,
    proofHash: string
  ): Promise<string> {
    const provider = this.providers.get(chain);
    const txHash = await provider.registerAttestation(
      attestationId,
      proofHash
    );
    return txHash;
  }
}
```

**Optimism Provider:**

```typescript
// packages/blockchain/src/providers/optimism.ts
import { ethers } from 'ethers';

export class OptimismProvider implements IBlockchainProvider {
  private provider: ethers.Provider;
  private contract: ethers.Contract;

  async registerAttestation(
    attestationId: string,
    proofHash: string
  ): Promise<string> {
    // 1. Crear transacción
    const tx = await this.contract.registerAttestation(
      attestationId,
      proofHash,
      { gasLimit: 100000 }
    );

    // 2. Esperar confirmación
    const receipt = await tx.wait();

    return receipt.transactionHash;
  }

  async verifyAttestation(
    attestationId: string
  ): Promise<boolean> {
    const data = await this.contract.getAttestation(attestationId);
    return data.isValid;
  }
}
```

**Stellar Provider:**

```typescript
// packages/blockchain/src/providers/stellar.ts
import * as StellarSdk from 'stellar-sdk';

export class StellarProvider implements IBlockchainProvider {
  private server: StellarSdk.Server;
  private keypair: StellarSdk.Keypair;

  async registerAttestation(
    attestationId: string,
    proofHash: string
  ): Promise<string> {
    // 1. Crear account si no existe
    const account = await this.server.loadAccount(
      this.keypair.publicKey()
    );

    // 2. Crear transacción con memo (data)
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.PUBLIC,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: attestationId,
          value: Buffer.from(proofHash),
        })
      )
      .setTimeout(30)
      .build();

    // 3. Firmar y enviar
    transaction.sign(this.keypair);
    const result = await this.server.submitTransaction(transaction);

    return result.hash;
  }
}
```

### packages/vc-toolkit (Verifiable Credentials)

**Propósito**: Crear, firmar y verificar VCs según estándar W3C.

```typescript
// packages/vc-toolkit/src/vc-signer.ts
import * as ed25519 from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';

export class VCSignerEd25519 {
  async createCredential(options: {
    issuer: string;
    credentialSubject: any;
    type?: string[];
  }): Promise<VerifiableCredential> {
    const vc = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
      ],
      id: `urn:uuid:${crypto.randomUUID()}`,
      type: ['VerifiableCredential', ...(options.type || [])],
      issuer: options.issuer,
      issuanceDate: new Date().toISOString(),
      credentialSubject: options.credentialSubject,
    };

    // Crear proof (firma)
    const proof = await this.createProof(vc);

    return { ...vc, proof };
  }

  private async createProof(vc: any) {
    // 1. Canonicalizar (serializar de forma determinística)
    const canonicalized = JSON.stringify(vc);

    // 2. Hash
    const hash = sha256(Buffer.from(canonicalized));

    // 3. Firmar con Ed25519
    const signature = await ed25519.sign(hash, this.privateKey);

    return {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      proofPurpose: 'assertionMethod',
      verificationMethod: this.did + '#key-1',
      proofValue: Buffer.from(signature).toString('base64'),
    };
  }

  async verifyCredential(vc: VerifiableCredential): Promise<boolean> {
    const { proof, ...credential } = vc;

    // 1. Re-crear hash
    const canonicalized = JSON.stringify(credential);
    const hash = sha256(Buffer.from(canonicalized));

    // 2. Verificar firma
    const signature = Buffer.from(proof.proofValue, 'base64');
    const publicKey = await this.resolvePublicKey(proof.verificationMethod);

    return ed25519.verify(signature, hash, publicKey);
  }
}
```

### packages/client (SDK JavaScript)

**Propósito**: SDK para que desarrolladores integren ProofPass en sus apps.

```typescript
// packages/client/src/index.ts
export class ProofPass {
  private apiKey: string;
  private baseURL: string;

  constructor(config: string | { apiKey: string; baseURL?: string }) {
    if (typeof config === 'string') {
      this.apiKey = config;
      this.baseURL = 'https://api.proofpass.com';
    } else {
      this.apiKey = config.apiKey;
      this.baseURL = config.baseURL || 'https://api.proofpass.com';
    }
  }

  // Namespace para attestations
  attestations = {
    create: async (data: CreateAttestationData) => {
      return this.request('POST', '/attestations', data);
    },
    get: async (id: string) => {
      return this.request('GET', `/attestations/${id}`);
    },
    revoke: async (id: string) => {
      return this.request('POST', `/attestations/${id}/revoke`);
    },
  };

  // Namespace para passports
  passports = {
    create: async (data: CreatePassportData) => {
      return this.request('POST', '/passports', data);
    },
    verify: async (passportId: string) => {
      return this.request('POST', '/passports/verify', { passportId });
    },
  };

  private async request(method: string, path: string, data?: any) {
    const response = await fetch(`${this.baseURL}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }
}

// Uso:
const proofpass = new ProofPass('pk_live_...');

const attestation = await proofpass.attestations.create({
  templateId: 'identity',
  claims: {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
  },
});
```

### packages/templates (Attestation Templates)

**Propósito**: Plantillas predefinidas con validación Zod.

```typescript
// packages/templates/src/identity.ts
import { z } from 'zod';

export const identitySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  nationality: z.string().length(2),
  email: z.string().email().optional(),
});

export type IdentityClaims = z.infer<typeof identitySchema>;

export const identityTemplate = {
  id: 'identity',
  name: 'Identity Verification',
  description: 'KYC/AML identity attestation',
  schema: identitySchema,
  category: 'identity',
};
```

### packages/qr-toolkit (QR Codes)

**Propósito**: Generar QR codes para compartir VCs.

```typescript
// packages/qr-toolkit/src/index.ts
import QRCode from 'qrcode';

export async function generateQRCode(
  credentialId: string,
  format: 'vc-http-api' | 'openid4vc' | 'deeplink' = 'vc-http-api'
): Promise<string> {
  const url = generateVerificationURL(credentialId, format);

  // Generar QR code como data URL
  const qrDataURL = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 400,
  });

  return qrDataURL;
}

export function generateVerificationURL(
  credentialId: string,
  format: 'vc-http-api' | 'openid4vc' | 'deeplink' = 'vc-http-api'
): string {
  switch (format) {
    case 'vc-http-api':
      return `https://api.proofpass.com/credentials/${credentialId}/verify`;

    case 'openid4vc':
      return `openid-vc://?credential_id=${credentialId}&issuer=${encodeURIComponent('https://api.proofpass.com')}`;

    case 'deeplink':
      return `proofpass://verify/${credentialId}`;
  }
}
```

---

## 5. Blockchain Multi-Chain

### ¿Por qué Multi-Chain?

```
┌───────────────────────────────────────────────────────────┐
│                    Blockchain Strategy                     │
├───────────────────────────────────────────────────────────┤
│  Optimism (L2)                                            │
│  ✓ Gas: ~$0.01 per tx                                     │
│  ✓ Compatible con Ethereum tooling                        │
│  ✓ Finalidad rápida (~2 segundos)                         │
│  ✓ Usado para: Attestations de alta frecuencia           │
├───────────────────────────────────────────────────────────┤
│  Arbitrum (L2)                                            │
│  ✓ Gas: ~$0.01 per tx                                     │
│  ✓ Mayor adopción enterprise                              │
│  ✓ Throughput más alto                                    │
│  ✓ Usado para: Passports digitales                        │
├───────────────────────────────────────────────────────────┤
│  Stellar (L1)                                             │
│  ✓ Gas: ~$0.00001 per tx                                  │
│  ✓ Finalidad inmediata (3-5 segundos)                     │
│  ✓ Diseñado para pagos/assets                             │
│  ✓ Usado para: Micro-attestations, IoT                    │
└───────────────────────────────────────────────────────────┘
```

### Smart Contract (Optimism/Arbitrum)

```solidity
// contracts/AttestationRegistry.sol
pragma solidity ^0.8.20;

contract AttestationRegistry {
    struct Attestation {
        bytes32 proofHash;      // Hash del VC proof
        address issuer;         // Quien emitió
        uint256 timestamp;      // Cuándo
        bool isRevoked;         // Estado
    }

    mapping(string => Attestation) public attestations;

    event AttestationRegistered(
        string indexed attestationId,
        bytes32 proofHash,
        address issuer
    );

    event AttestationRevoked(
        string indexed attestationId
    );

    function registerAttestation(
        string memory attestationId,
        bytes32 proofHash
    ) external {
        require(
            attestations[attestationId].timestamp == 0,
            "Attestation already exists"
        );

        attestations[attestationId] = Attestation({
            proofHash: proofHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            isRevoked: false
        });

        emit AttestationRegistered(attestationId, proofHash, msg.sender);
    }

    function revokeAttestation(string memory attestationId) external {
        Attestation storage att = attestations[attestationId];
        require(att.issuer == msg.sender, "Not issuer");
        require(!att.isRevoked, "Already revoked");

        att.isRevoked = true;
        emit AttestationRevoked(attestationId);
    }

    function verifyAttestation(
        string memory attestationId,
        bytes32 proofHash
    ) external view returns (bool) {
        Attestation memory att = attestations[attestationId];
        return
            att.timestamp != 0 &&
            !att.isRevoked &&
            att.proofHash == proofHash;
    }
}
```

---

## 6. Verifiable Credentials (W3C)

### Anatomía de un VC

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1"
  ],
  "id": "urn:uuid:3978344f-8596-4c3a-a978-8fcaba3903c5",
  "type": ["VerifiableCredential", "IdentityCredential"],
  "issuer": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  "issuanceDate": "2024-01-15T19:23:24Z",
  "credentialSubject": {
    "id": "did:key:z6MkjchhfUsD6mmvni8mCdXHw216Xrm9bQe2mBH1P5RDjVJG",
    "firstName": "Alice",
    "lastName": "Smith",
    "dateOfBirth": "1990-01-01",
    "nationality": "US"
  },
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2024-01-15T19:23:24Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK#key-1",
    "proofValue": "z58DAdFfa9SkqZMVPxAQpic7ndSayn1PzZs6ZjWp1CktyGesjuTSwRdoWhAfGFCF5bppETSTojQCrfFPP2oumHKtz"
  }
}
```

### Flujo de Creación y Verificación

```
CREACIÓN DE VC:
1. Usuario solicita attestation
   ↓
2. API valida claims contra template schema
   ↓
3. VC Toolkit crea VC structure
   ↓
4. Firma con Ed25519 (issuer's private key)
   ↓
5. Guarda en DB (PostgreSQL)
   ↓
6. Registra hash en blockchain
   ↓
7. Retorna VC al usuario

VERIFICACIÓN DE VC:
1. Verificador recibe VC (QR, JSON, etc)
   ↓
2. Verifica firma Ed25519 (issuer's public key)
   ↓
3. Verifica hash en blockchain
   ↓
4. Verifica no revocado (Status List 2021)
   ↓
5. Retorna resultado: válido/inválido
```

---

## 7. Base de Datos

### Prisma Schema

```prisma
// apps/api/prisma/schema.prisma

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  passwordHash  String
  did           String         @unique  // Decentralized ID
  createdAt     DateTime       @default(now())

  organization  Organization?  @relation(fields: [organizationId], references: [id])
  organizationId String?

  attestations  Attestation[]
  apiKeys       ApiKey[]
}

model Organization {
  id            String         @id @default(uuid())
  name          String
  slug          String         @unique
  plan          Plan           @default(FREE)
  stripeCustomerId String?

  users         User[]
  attestations  Attestation[]
  createdAt     DateTime       @default(now())
}

model Attestation {
  id            String         @id @default(uuid())
  vcId          String         @unique
  templateId    String
  claims        Json
  status        AttestationStatus @default(ACTIVE)

  // Blockchain
  blockchainTxHash String?
  blockchain    String?        // 'optimism' | 'arbitrum' | 'stellar'

  // Relaciones
  issuer        User           @relation(fields: [issuerId], references: [id])
  issuerId      String
  organization  Organization   @relation(fields: [organizationId], references: [id])
  organizationId String

  createdAt     DateTime       @default(now())
  revokedAt     DateTime?
}

model Passport {
  id            String         @id @default(uuid())
  userId        String
  attestationIds String[]      // Array de attestation IDs
  qrCode        String?        // QR code data URL
  expiresAt     DateTime?

  createdAt     DateTime       @default(now())
}

model ApiKey {
  id            String         @id @default(uuid())
  key           String         @unique
  name          String
  lastUsedAt    DateTime?

  user          User           @relation(fields: [userId], references: [id])
  userId        String

  createdAt     DateTime       @default(now())
}

enum Plan {
  FREE
  BASIC
  PRO
  ENTERPRISE
}

enum AttestationStatus {
  ACTIVE
  REVOKED
  EXPIRED
}
```

### Consultas Comunes

```typescript
// Crear attestation
const attestation = await prisma.attestation.create({
  data: {
    vcId: vc.id,
    templateId: 'identity',
    claims: { firstName: 'Alice', ... },
    issuerId: user.id,
    organizationId: org.id,
  },
  include: {
    issuer: true,
    organization: true,
  },
});

// Buscar con filtros
const attestations = await prisma.attestation.findMany({
  where: {
    organizationId: org.id,
    status: 'ACTIVE',
    createdAt: {
      gte: new Date('2024-01-01'),
    },
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10,
});

// Revocar attestation
await prisma.attestation.update({
  where: { id: attestationId },
  data: {
    status: 'REVOKED',
    revokedAt: new Date(),
  },
});
```

---

## 8. Autenticación y Autorización

### JWT (JSON Web Tokens)

```typescript
// apps/api/src/services/auth.ts
import jwt from 'jsonwebtoken';

export function generateToken(user: User): string {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '7d',
      issuer: 'proofpass-api',
    }
  );
}

export function verifyToken(token: string): DecodedToken {
  return jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
}
```

### Middleware de Autenticación

```typescript
// apps/api/src/middleware/auth.ts
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### NextAuth.js (Frontend)

```typescript
// apps/platform/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Llamar a API backend
        const res = await fetch('http://localhost:3000/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" }
        });

        const user = await res.json();

        if (res.ok && user) {
          return user;
        }
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      return session;
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

## 9. Pagos con Stripe

### Webhooks

```typescript
// apps/api/src/routes/payments.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

router.post('/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature']!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      // Actualizar plan de organización
      await prisma.organization.update({
        where: { stripeCustomerId: session.customer },
        data: { plan: 'PRO' },
      });
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object;

      // Downgrade a FREE
      await prisma.organization.update({
        where: { stripeCustomerId: subscription.customer },
        data: { plan: 'FREE' },
      });
      break;
  }

  res.json({ received: true });
});
```

---

## 10. Flujos de Datos

### Flujo Completo: Crear Attestation

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/attestations
     │ { templateId, claims }
     ▼
┌─────────────────────┐
│  API (Express)      │
│  1. Auth Middleware │ ← Verificar JWT
│  2. Validation      │ ← Validar schema (Zod)
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  VC Toolkit         │
│  1. Create VC       │ ← Estructura W3C
│  2. Sign (Ed25519)  │ ← Firma criptográfica
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  Database (Prisma)  │
│  1. Save attestation│
│  2. Link to user    │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  Blockchain         │
│  1. Hash VC proof   │
│  2. Send tx         │ ← Optimism/Arbitrum/Stellar
│  3. Wait confirm    │
└────┬────────────────┘
     │
     ▼
┌─────────────────────┐
│  Response           │
│  { id, vcId, tx }   │
└─────────────────────┘
```

### Flujo: Verificar Attestation

```
┌──────────┐
│ Verifier │
└────┬─────┘
     │ Escanea QR code
     │ o recibe VC JSON
     ▼
┌─────────────────────┐
│  API Verify         │
│  GET /verify/:id    │
└────┬────────────────┘
     │
     ├─▶ [1] Verify Signature (Ed25519)
     │   ✓ Public key from DID
     │   ✓ Verify proof
     │
     ├─▶ [2] Check Blockchain
     │   ✓ Query contract
     │   ✓ Verify hash matches
     │
     ├─▶ [3] Check Revocation
     │   ✓ Query Status List
     │   ✓ Not revoked
     │
     └─▶ [4] Return Result
         ✓ Valid/Invalid
         ✓ Issuer info
         ✓ Claims
```

---

## 11. Seguridad

### Medidas Implementadas

1. **Autenticación**: JWT con expiración
2. **Rate Limiting**: Max 100 req/15min
3. **CORS**: Solo dominios permitidos
4. **SQL Injection**: Prisma (ORM seguro)
5. **XSS**: Next.js sanitization automática
6. **CSRF**: NextAuth tokens
7. **Secrets**: Variables de entorno, nunca hardcoded
8. **HTTPS**: Obligatorio en producción
9. **Helmet.js**: Headers de seguridad

### Ejemplo de Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

---

## 12. Testing

### Coverage por Package

```
packages/blockchain/     ≥85% coverage
packages/vc-toolkit/     ≥85% coverage
packages/client/         ≥85% coverage
packages/templates/      ≥85% coverage
packages/qr-toolkit/     ≥85% coverage
```

### Ejemplo de Test

```typescript
// packages/vc-toolkit/__tests__/vc-signer.test.ts
import { VCSignerEd25519 } from '../src/vc-signer';

describe('VCSignerEd25519', () => {
  let signer: VCSignerEd25519;

  beforeEach(() => {
    signer = new VCSignerEd25519({
      privateKey: '...',
      did: 'did:key:...',
    });
  });

  it('debe crear un VC válido', async () => {
    const vc = await signer.createCredential({
      issuer: 'did:key:...',
      credentialSubject: {
        id: 'did:key:...',
        firstName: 'Alice',
      },
    });

    expect(vc).toHaveProperty('proof');
    expect(vc.proof.type).toBe('Ed25519Signature2020');
  });

  it('debe verificar un VC válido', async () => {
    const vc = await signer.createCredential({...});
    const isValid = await signer.verifyCredential(vc);

    expect(isValid).toBe(true);
  });
});
```

---

## Resumen de Tecnologías

| Componente | Tecnología Principal | Propósito |
|------------|---------------------|-----------|
| **Frontend** | Next.js 15 + React 19 | UI/UX, SSR |
| **Backend** | Express + TypeScript | API REST |
| **Database** | PostgreSQL + Prisma | Persistencia |
| **Blockchain** | Ethers.js + Stellar SDK | Multi-chain |
| **Credentials** | Ed25519 + W3C VC | VCs verificables |
| **Auth** | JWT + NextAuth | Autenticación |
| **Payments** | Stripe | SaaS subscriptions |
| **Testing** | Jest + ts-jest | Unit tests (85%+) |
| **DevOps** | Docker + GitHub Actions | CI/CD |

---

**¿Preguntas sobre algún componente específico?**

Este documento cubre la arquitectura completa. Para profundizar en un área específica, consulta:
- `packages/*/README.md` - Docs de cada package
- `LOCAL_SETUP.md` - Setup local
- `DEPLOYMENT.md` - Deployment a producción
