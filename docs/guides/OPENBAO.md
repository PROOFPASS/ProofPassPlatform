# OpenBao Integration

OpenBao (fork opensource de HashiCorp Vault) para gestión segura de claves y secrets en ProofPass Platform.

## 📋 Índice

- [¿Qué es OpenBao?](#qué-es-openbao)
- [Arquitectura](#arquitectura)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Secrets Engines](#secrets-engines)
- [Políticas de Seguridad](#políticas-de-seguridad)
- [Backup y Recuperación](#backup-y-recuperación)
- [Producción](#producción)

## ¿Qué es OpenBao?

OpenBao es un fork opensource mantenido por la comunidad de HashiCorp Vault, creado después de que Vault cambiara a una licencia BSL. Proporciona:

- **Secrets Management**: Almacenamiento seguro de claves, contraseñas, certificados
- **Encryption as a Service**: Cifrado/descifrado sin exponer claves
- **Dynamic Secrets**: Generación on-demand de credenciales temporales
- **PKI Management**: Gestión de certificados X.509
- **Audit Logging**: Registro completo de todas las operaciones

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      ProofPass Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌────────────────┐               │
│  │   API Server │◄────────┤  OpenBao       │               │
│  │   (Fastify)  │   HTTP  │  Service       │               │
│  └──────────────┘         └────────────────┘               │
│         │                          │                         │
│         │                          │                         │
│         ▼                          ▼                         │
│  ┌──────────────────────────────────────┐                  │
│  │           OpenBao Server             │                  │
│  ├──────────────────────────────────────┤                  │
│  │  ┌──────────┐  ┌──────────┐         │                  │
│  │  │ KV v2    │  │ Transit  │         │                  │
│  │  │ Engine   │  │ Engine   │         │                  │
│  │  └──────────┘  └──────────┘         │                  │
│  │                                       │                  │
│  │  ┌──────────┐  ┌──────────┐         │                  │
│  │  │ PKI      │  │ Auth     │         │                  │
│  │  │ Engine   │  │ Methods  │         │                  │
│  │  └──────────┘  └──────────┘         │                  │
│  └──────────────────────────────────────┘                  │
│                      │                                       │
│                      ▼                                       │
│          ┌─────────────────────┐                           │
│          │  Persistent Storage │                           │
│          │  (File/Consul/etc)  │                           │
│          └─────────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Instalación

### 1. Usando Docker Compose (Desarrollo)

```bash
# Iniciar OpenBao
docker-compose -f docker-compose.openbao.yml up -d

# Ver logs
docker-compose -f docker-compose.openbao.yml logs -f openbao

# Verificar estado
curl http://localhost:8200/v1/sys/health
```

### 2. Inicializar OpenBao

```bash
# Ejecutar script de inicialización
bash openbao/scripts/init-openbao.sh
```

Este script configura:
- ✅ KV v2 secrets engine
- ✅ Transit encryption engine
- ✅ PKI engine
- ✅ Políticas de acceso
- ✅ Token de aplicación

### 3. Configurar Variables de Entorno

```bash
# En apps/api/.env
OPENBAO_ADDR=http://localhost:8200
OPENBAO_TOKEN=<token-generado-por-init-script>
OPENBAO_NAMESPACE=
```

## Configuración

### Estructura de Secrets

```
secret/
├── did-keys/                    # Claves DID individuales
│   ├── user-123-key-1
│   ├── user-456-key-2
│   └── ...
├── organizations/              # Claves organizacionales
│   ├── org-abc/
│   │   └── keys/
│   │       ├── primary-key
│   │       └── backup-key
│   └── org-xyz/
│       └── keys/
│           └── signing-key
└── api-keys/                   # API Keys y credentials
    ├── stripe
    ├── sendgrid
    └── ...
```

### Políticas

**proofpass-app-policy** (apps/api/src/services):
- ✅ CRUD en `secret/data/did-keys/*`
- ✅ CRUD en `secret/data/organizations/*/keys/*`
- ✅ Read en `secret/data/api-keys/*`
- ✅ Encrypt/Decrypt con Transit
- ✅ PKI certificate issuance

Ver: `openbao/policies/proofpass-app-policy.hcl`

## Uso

### 1. Inicializar el Servicio

```typescript
import { initializeOpenBao } from './services/openbao.service';

// En el startup de la aplicación
const openBaoService = initializeOpenBao({
  address: process.env.OPENBAO_ADDR!,
  token: process.env.OPENBAO_TOKEN!,
});

// Health check
const isHealthy = await openBaoService.healthCheck();
console.log('OpenBao health:', isHealthy);
```

### 2. Almacenar Claves DID

```typescript
import { getOpenBaoService } from './services/openbao.service';
import { generateDIDKey } from '@proofpass/vc-toolkit';

const openBao = getOpenBaoService();
const keyPair = await generateDIDKey();

// Almacenar en OpenBao
await openBao.storeDIDKey('user-123-primary', {
  did: keyPair.did,
  publicKey: keyPair.publicKeyBase58,
  privateKey: keyPair.privateKeyBase58,
  keyType: 'Ed25519',
  createdAt: new Date().toISOString(),
});
```

### 3. Recuperar Claves

```typescript
// Recuperar clave
const keyData = await openBao.getDIDKey('user-123-primary');

if (keyData) {
  console.log('DID:', keyData.did);
  // Usar la clave para firmar VCs
}
```

### 4. Listar Claves

```typescript
// Listar todas las claves DID
const keys = await openBao.listDIDKeys();
console.log('Available keys:', keys);

// Listar claves de una organización
const orgKeys = await openBao.listOrganizationKeys('org-abc');
console.log('Organization keys:', orgKeys);
```

### 5. Encryption as a Service

```typescript
// Cifrar datos sensibles
const plaintext = JSON.stringify({ email: 'user@example.com', phone: '+1234567890' });
const ciphertext = await openBao.encrypt(plaintext);

// Almacenar ciphertext en DB
await db.users.update({ id: userId }, { encryptedData: ciphertext });

// Recuperar y descifrar
const encrypted = await db.users.findOne({ id: userId });
const decrypted = await openBao.decrypt(encrypted.encryptedData);
const userData = JSON.parse(decrypted);
```

### 6. Generar Data Encryption Keys

```typescript
// Generar DEK para cifrado de archivos
const { plaintext: dek, ciphertext: encryptedDek } = await openBao.generateDataKey();

// Usar DEK para cifrar archivo (AES-256)
const encryptedFile = encryptFileWithAES(fileData, dek);

// Almacenar encryptedDek junto al archivo
// No almacenar el DEK en texto plano
```

## Secrets Engines

### KV v2 (Key-Value)

- **Path**: `secret/`
- **Uso**: Almacenamiento de claves DID, credentials
- **Features**: Versioning, soft delete, metadata

### Transit

- **Path**: `transit/`
- **Uso**: Encryption as a service
- **Operations**: encrypt, decrypt, generate data key
- **Key**: `proofpass`

### PKI

- **Path**: `pki/`
- **Uso**: Gestión de certificados X.509
- **Features**: Certificate issuance, CRL, OCSP

## Políticas de Seguridad

### Principio de Mínimo Privilegio

Cada componente tiene solo los permisos necesarios:

```hcl
# API Server - Solo acceso a sus propios secrets
path "secret/data/did-keys/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}

# Background Jobs - Solo lectura
path "secret/data/did-keys/*" {
  capabilities = ["read", "list"]
}
```

### Rotación de Tokens

```bash
# Generar nuevo token
bao token create -policy=proofpass-app -period=24h

# Actualizar en .env
OPENBAO_TOKEN=<nuevo-token>

# Restart aplicación
```

### Audit Logging

```bash
# Habilitar audit log
bao audit enable file file_path=/openbao/logs/audit.log

# Ver logs
tail -f /openbao/logs/audit.log
```

## Backup y Recuperación

### Backup

```bash
# Backup de secrets
docker exec proofpass-openbao bao operator raft snapshot save /tmp/backup.snap

# Copiar backup
docker cp proofpass-openbao:/tmp/backup.snap ./backups/openbao-$(date +%Y%m%d).snap
```

### Recuperación

```bash
# Restaurar desde snapshot
docker cp ./backups/openbao-20250101.snap proofpass-openbao:/tmp/backup.snap
docker exec proofpass-openbao bao operator raft snapshot restore /tmp/backup.snap
```

## Producción

### 1. High Availability

```yaml
# docker-compose.prod.yml
services:
  openbao-1:
    image: openbao/openbao:latest
    volumes:
      - openbao-data-1:/openbao/data
    command: server -config=/openbao/config/openbao-config.hcl

  openbao-2:
    image: openbao/openbao:latest
    volumes:
      - openbao-data-2:/openbao/data
    command: server -config=/openbao/config/openbao-config.hcl

  openbao-3:
    image: openbao/openbao:latest
    volumes:
      - openbao-data-3:/openbao/data
    command: server -config=/openbao/config/openbao-config.hcl
```

### 2. TLS/SSL

```hcl
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_cert_file = "/openbao/tls/server.crt"
  tls_key_file  = "/openbao/tls/server.key"
}
```

### 3. Storage Backend

**Consul** (Recomendado para HA):
```hcl
storage "consul" {
  address = "consul:8500"
  path    = "openbao/"
}
```

**PostgreSQL**:
```hcl
storage "postgresql" {
  connection_url = "postgres://user:pass@postgres:5432/openbao"
}
```

### 4. Auto-unseal

```hcl
seal "awskms" {
  region     = "us-east-1"
  kms_key_id = "alias/openbao-unseal-key"
}
```

### 5. Monitoring

```bash
# Prometheus metrics
curl http://localhost:8200/v1/sys/metrics?format=prometheus

# Health check
curl http://localhost:8200/v1/sys/health
```

### 6. Disaster Recovery

1. **Backup automático diario**
2. **Replicación en múltiples regiones**
3. **Snapshots en S3/Cloud Storage**
4. **Procedimiento de recovery documentado**

## Recursos

- [OpenBao Documentation](https://openbao.org/docs/)
- [OpenBao GitHub](https://github.com/openbao/openbao)
- [Vault API Reference](https://www.vaultproject.io/api-docs) (compatible)

## Próximos Pasos

1. ✅ Setup básico de OpenBao
2. ✅ Integración con API
3. ⏳ Auto-unseal para producción
4. ⏳ HA cluster setup
5. ⏳ Backup automático
6. ⏳ Monitoring y alertas
