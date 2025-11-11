# OpenBao Setup for ProofPass

Configuración de OpenBao (fork opensource de Vault) para gestión segura de claves DID y secrets.

## Quick Start

### 1. Iniciar OpenBao

```bash
# Iniciar con Docker Compose
docker-compose -f docker-compose.openbao.yml up -d

# Verificar que está corriendo
curl http://localhost:8200/v1/sys/health
```

### 2. Inicializar OpenBao

```bash
# Ejecutar script de inicialización
bash openbao/scripts/init-openbao.sh
```

Este script configura:
- ✅ KV v2 secrets engine (`secret/`)
- ✅ Transit encryption engine (`transit/`)
- ✅ PKI engine (`pki/`)
- ✅ Políticas de acceso (`proofpass-app`)
- ✅ Token de aplicación

### 3. Configurar Variables de Entorno

El script de inicialización genera un token de aplicación. Cópialo y agrégalo a tu `.env`:

```bash
# En apps/api/.env
OPENBAO_ADDR=http://localhost:8200
OPENBAO_TOKEN=<token-generado>
```

### 4. Probar la Integración

```bash
# Ejecutar ejemplo
cd openbao/examples
npx tsx did-key-management.ts
```

## Arquitectura

```
┌─────────────────────────────────────────┐
│         ProofPass API (Fastify)         │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │   OpenBao Service                  │ │
│  │   (openbao.service.ts)            │ │
│  └──────────────┬─────────────────────┘ │
│                 │ HTTP/TLS               │
└─────────────────┼─────────────────────────┘
                  │
        ┌─────────▼─────────┐
        │   OpenBao Server  │
        │   (Port 8200)     │
        └─────────┬─────────┘
                  │
     ┌────────────┼────────────┐
     │            │            │
┌────▼────┐  ┌───▼────┐  ┌───▼────┐
│ KV v2   │  │Transit │  │  PKI   │
│ Engine  │  │Engine  │  │ Engine │
└─────────┘  └────────┘  └────────┘
```

## Estructura de Secrets

```
secret/
├── did-keys/                   # Claves DID individuales
│   ├── user-123-primary
│   ├── user-456-backup
│   └── ...
├── organizations/             # Claves organizacionales
│   ├── org-abc/
│   │   └── keys/
│   │       ├── primary-key
│   │       └── backup-key
│   └── org-xyz/
│       └── keys/
│           └── signing-key
└── api-keys/                  # API Keys externas
    ├── stripe
    ├── sendgrid
    └── ...
```

## Uso Básico

### Almacenar una Clave DID

```typescript
import { getOpenBaoService } from './services/openbao.service';
import { generateDIDKey } from '@proofpass/vc-toolkit';

const openBao = getOpenBaoService();
const keyPair = await generateDIDKey();

await openBao.storeDIDKey('user-123-primary', {
  did: keyPair.did,
  publicKey: keyPair.publicKeyBase58,
  privateKey: keyPair.privateKeyBase58,
  keyType: 'Ed25519',
  createdAt: new Date().toISOString(),
});
```

### Recuperar una Clave DID

```typescript
const keyData = await openBao.getDIDKey('user-123-primary');
if (keyData) {
  console.log('DID:', keyData.did);
  // Usar la clave para firmar VCs
}
```

### Cifrar Datos Sensibles

```typescript
// Cifrar
const plaintext = JSON.stringify({ email: 'user@example.com' });
const ciphertext = await openBao.encrypt(plaintext);

// Guardar ciphertext en DB
await db.users.update({ id: userId }, { encryptedData: ciphertext });

// Descifrar cuando se necesite
const encrypted = await db.users.findOne({ id: userId });
const decrypted = await openBao.decrypt(encrypted.encryptedData);
const userData = JSON.parse(decrypted);
```

## Comandos Útiles

### Ver Secrets

```bash
# Listar secrets
docker exec -it proofpass-openbao bao kv list secret/did-keys

# Leer un secret
docker exec -it proofpass-openbao bao kv get secret/did-keys/user-123-primary
```

### Backup

```bash
# Crear snapshot
docker exec proofpass-openbao bao operator raft snapshot save /tmp/backup.snap

# Copiar backup
docker cp proofpass-openbao:/tmp/backup.snap ./backups/openbao-$(date +%Y%m%d).snap
```

### Logs

```bash
# Ver logs
docker-compose -f docker-compose.openbao.yml logs -f openbao

# Ver audit log (si está habilitado)
docker exec -it proofpass-openbao tail -f /openbao/logs/audit.log
```

### UI Web

Accede a la UI de OpenBao en: http://localhost:8200/ui

- Token: `dev-root-token-proofpass` (desarrollo)
- Token: `<app-token>` (aplicación)

## Seguridad

### Desarrollo

- Token de root: `dev-root-token-proofpass`
- Sin TLS (HTTP)
- Storage: File system
- Modo dev: Auto-unsealed

### Producción

1. **TLS/SSL Obligatorio**
   ```hcl
   listener "tcp" {
     tls_cert_file = "/path/to/cert.pem"
     tls_key_file  = "/path/to/key.pem"
   }
   ```

2. **Storage Backend Distribuido**
   - Consul (recomendado para HA)
   - PostgreSQL
   - S3 (para backups)

3. **Auto-unseal**
   - AWS KMS
   - Azure Key Vault
   - GCP Cloud KMS

4. **Audit Logging**
   ```bash
   bao audit enable file file_path=/var/log/openbao/audit.log
   ```

5. **Rotación de Tokens**
   - Tokens con TTL corto (24h)
   - Renovación automática
   - Revocación al detectar compromiso

## Troubleshooting

### OpenBao no inicia

```bash
# Ver logs
docker-compose -f docker-compose.openbao.yml logs openbao

# Verificar permisos
ls -la openbao/data openbao/logs
```

### Connection refused

```bash
# Verificar que el puerto 8200 está libre
lsof -i :8200

# Verificar health
curl -v http://localhost:8200/v1/sys/health
```

### Permission denied

```bash
# Verificar token
echo $OPENBAO_TOKEN

# Verificar política
docker exec -it proofpass-openbao bao policy read proofpass-app
```

## Recursos

- [Documentación completa](../OPENBAO.md)
- [OpenBao Docs](https://openbao.org/docs/)
- [Ejemplos de uso](./examples/)

## Próximos Pasos

1. ✅ Setup básico completado
2. ⏳ Configurar TLS para producción
3. ⏳ Setup de HA cluster
4. ⏳ Configurar auto-unseal
5. ⏳ Implementar backup automático
