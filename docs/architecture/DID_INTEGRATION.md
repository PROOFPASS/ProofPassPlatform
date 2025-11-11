# Integración de DIDs Reales - ProofPass

## Resumen de la implementación

Esta guía documenta la integración de DIDs (Decentralized Identifiers) reales en ProofPass, reemplazando la implementación simplificada por un sistema completo basado en estándares W3C.

## Métodos DID Soportados

### 1. did:key
- **Descripción**: DID method auto-contenido basado en claves públicas
- **Formato**: `did:key:z6Mk...` (usando multicodec para Ed25519)
- **Ventajas**: No requiere registry, completamente autónomo
- **Uso**: Identificadores temporales, desarrollo, testing

### 2. did:web
- **Descripción**: DID method basado en dominios web
- **Formato**: `did:web:example.com:user:alice`
- **Ventajas**: Fácil de hospedar, familiar para desarrolladores
- **Uso**: Organizaciones, producción

### 3. did:pkh (Futuro)
- **Descripción**: DID method basado en blockchain addresses
- **Formato**: `did:pkh:eip155:1:0x...`
- **Ventajas**: Integración con wallets Ethereum/Stellar
- **Uso**: Web3 integration

## Arquitectura

```
packages/vc-toolkit/
├── src/
│   ├── did/
│   │   ├── did-key.ts          # did:key implementation
│   │   ├── did-web.ts          # did:web implementation
│   │   ├── did-resolver.ts     # Universal DID resolver
│   │   └── did-document.ts     # DID Document utilities
│   ├── vc/
│   │   ├── vc-issuer.ts        # Issue VCs with did-jwt-vc
│   │   ├── vc-verifier.ts      # Verify VCs
│   │   └── vc-signer.ts        # Sign VCs with DIDs
│   └── index.ts
```

## Dependencias

```json
{
  "did-jwt": "^7.4.7",
  "did-jwt-vc": "^3.2.0",
  "did-resolver": "^4.1.0",
  "key-did-resolver": "^3.0.0",
  "web-did-resolver": "^2.0.27",
  "@noble/ed25519": "^2.3.0",
  "@noble/hashes": "^1.8.0"
}
```

## Implementación

### 1. DID:key Generation

```typescript
import { generateDIDKey } from '@proofpass/vc-toolkit'

// Generar nuevo DID:key con Ed25519
const { did, keyPair } = await generateDIDKey()
// did: "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH"
```

### 2. DID:web Setup

```typescript
import { createDIDWeb } from '@proofpass/vc-toolkit'

// Crear DID:web para tu organización
const { did, didDocument } = await createDIDWeb({
  domain: 'proofpass.com',
  path: ['organizations', 'org-123']
})
// did: "did:web:proofpass.com:organizations:org-123"

// Host el DID Document en:
// https://proofpass.com/.well-known/did.json
// o
// https://proofpass.com/organizations/org-123/did.json
```

### 3. Firmar Verifiable Credentials

```typescript
import { issueVC } from '@proofpass/vc-toolkit'

const credential = {
  '@context': ['https://www.w3.org/2018/credentials/v1'],
  type: ['VerifiableCredential', 'UniversityDegreeCredential'],
  issuer: 'did:key:z6MkpTHR...',
  issuanceDate: new Date().toISOString(),
  credentialSubject: {
    id: 'did:key:z6MkjRag...',
    degree: {
      type: 'BachelorDegree',
      name: 'Bachelor of Science'
    }
  }
}

// Firmar con did-jwt-vc
const vcJwt = await issueVC(credential, issuerKeyPair)
```

### 4. Verificar Credentials

```typescript
import { verifyVC } from '@proofpass/vc-toolkit'

const result = await verifyVC(vcJwt)

if (result.verified) {
  console.log('VC es válido')
  console.log('Issuer:', result.issuer)
  console.log('Subject:', result.credentialSubject)
}
```

## Configuración de Producción

### 1. Hosting de DID Documents (did:web)

#### Opción A: Nginx

```nginx
# /etc/nginx/sites-available/proofpass.com
server {
    listen 443 ssl;
    server_name proofpass.com;

    location /.well-known/did.json {
        alias /var/www/proofpass/did-documents/root.json;
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
    }

    location ~ ^/organizations/([^/]+)/did.json$ {
        alias /var/www/proofpass/did-documents/orgs/$1.json;
        add_header Content-Type application/json;
        add_header Access-Control-Allow-Origin *;
    }
}
```

#### Opción B: API Endpoint

```typescript
// apps/api/src/modules/did/routes.ts
server.get('/.well-known/did.json', async (request, reply) => {
  const didDocument = await getDIDDocument('root')
  return reply.type('application/json').send(didDocument)
})

server.get('/organizations/:orgId/did.json', async (request, reply) => {
  const { orgId } = request.params
  const didDocument = await getDIDDocument(orgId)
  return reply.type('application/json').send(didDocument)
})
```

### 2. Key Management

**IMPORTANTE**: Las claves privadas NUNCA deben estar en el código

```typescript
// Usar KMS o Vault (próximo paso del roadmap)
import { getPrivateKey } from './kms'

const privateKey = await getPrivateKey('org-123-signing-key')
const keyPair = await importKeyPair(privateKey)
```

### 3. Key Rotation

```typescript
// Rotar claves cada 90 días
import { rotateOrgKeys } from '@proofpass/vc-toolkit'

const { oldKeyId, newKeyId, didDocument } = await rotateOrgKeys(orgId)

// Actualizar DID Document con nueva clave
await updateDIDDocument(orgId, didDocument)

// Mantener clave vieja durante 30 días para verificación
await scheduleKeyDeprecation(oldKeyId, 30)
```

## Testing

```bash
cd packages/vc-toolkit
npm test
```

### Test Cases

1. **DID:key generation**: Verificar formato correcto
2. **DID:web creation**: Verificar URL mapping
3. **VC issuance**: Firmar y verificar
4. **VC verification**: Validar firmas
5. **Key rotation**: Probar ciclo completo

## Beneficios de esta implementación

✅ **Estándares W3C**: Compatible con ecosistema VC
✅ **Interoperabilidad**: DIDs reconocidos universalmente
✅ **Seguridad**: Criptografía Ed25519 robusta
✅ **Escalabilidad**: did:web para prod, did:key para dev
✅ **Verificabilidad**: Cualquier verifier puede validar VCs
✅ **Production-ready**: Listo para ambientes reales

## Próximos Pasos

1. ✅ Implementar did:key y did:web
2. ✅ Integrar did-jwt-vc para firmas
3. ⏳ Migrar KMS/Vault para claves (siguiente fase)
4. ⏳ Implementar key rotation automática
5. ⏳ Agregar did:pkh para blockchain wallets
6. ⏳ Dashboard para gestión de DIDs

## Referencias

- [W3C DID Core](https://www.w3.org/TR/did-core/)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
- [did:key Spec](https://w3c-ccg.github.io/did-method-key/)
- [did:web Spec](https://w3c-ccg.github.io/did-method-web/)
- [did-jwt-vc](https://github.com/decentralized-identity/did-jwt-vc)
