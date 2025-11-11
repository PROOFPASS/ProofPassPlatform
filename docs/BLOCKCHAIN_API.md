# Blockchain API

Esta documentación describe el módulo de blockchain que permite firmar y verificar datos en la blockchain de Stellar.

## Características

- Anclar datos a Stellar Testnet/Mainnet
- Consultar transacciones por hash
- Verificar que los datos fueron anclados correctamente
- Obtener historial de transacciones
- Ver información de la cuenta blockchain

## Configuración

Agrega las siguientes variables a tu archivo `.env`:

```bash
STELLAR_NETWORK=testnet  # o 'mainnet'
STELLAR_PUBLIC_KEY=tu_public_key
STELLAR_SECRET_KEY=tu_secret_key
```

### Crear una cuenta de Testnet

```bash
npm run setup:stellar
```

Este comando creará una nueva cuenta de testnet y te mostrará las credenciales para agregar a tu `.env`.

## Endpoints

### GET /api/v1/blockchain/info

Obtiene información sobre la configuración blockchain (público, sin autenticación).

**Respuesta:**
```json
{
  "network": "testnet",
  "publicKey": "G...",
  "horizonUrl": "https://horizon-testnet.stellar.org",
  "explorerUrl": "https://stellar.expert/explorer/testnet/account/G..."
}
```

### GET /api/v1/blockchain/balance

Obtiene el balance de la cuenta (requiere autenticación).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Respuesta:**
```json
{
  "balance": "10000.0000000",
  "publicKey": "G...",
  "network": "testnet"
}
```

### POST /api/v1/blockchain/anchor

Ancla datos a la blockchain (requiere autenticación).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "data": "Mi documento importante",
  "metadata": {
    "type": "document",
    "description": "Certificación de producto"
  }
}
```

**Respuesta:**
```json
{
  "txHash": "abc123...",
  "sequence": "123456",
  "fee": "100",
  "timestamp": "2024-10-29T12:00:00.000Z",
  "publicKey": "G...",
  "network": "testnet",
  "dataHash": "sha256..."
}
```

### GET /api/v1/blockchain/transactions/:txHash

Obtiene detalles de una transacción por su hash (público).

**Respuesta:**
```json
{
  "hash": "abc123...",
  "memo": "...",
  "sequence": "123456",
  "sourceAccount": "G...",
  "feeCharged": "100",
  "operationCount": 1,
  "createdAt": "2024-10-29T12:00:00.000Z",
  "successful": true
}
```

### GET /api/v1/blockchain/transactions

Obtiene el historial de transacciones (requiere autenticación).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `limit` (opcional): Número de transacciones a retornar (1-100, default: 10)

**Respuesta:**
```json
{
  "transactions": [...],
  "count": 10
}
```

### POST /api/v1/blockchain/verify

Verifica que datos fueron anclados en una transacción específica (público).

**Body:**
```json
{
  "txHash": "abc123...",
  "data": "Mi documento importante"
}
```

**Respuesta:**
```json
{
  "valid": true,
  "txHash": "abc123..."
}
```

## Ejemplos de Uso

### Usando cURL

#### Anclar datos
```bash
curl -X POST http://localhost:3000/api/v1/blockchain/anchor \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Certificación de producto orgánico",
    "metadata": {
      "type": "certification",
      "description": "USDA Organic"
    }
  }'
```

#### Verificar datos
```bash
curl -X POST http://localhost:3000/api/v1/blockchain/verify \
  -H "Content-Type: application/json" \
  -d '{
    "txHash": "abc123...",
    "data": "Certificación de producto orgánico"
  }'
```

#### Consultar transacción
```bash
curl http://localhost:3000/api/v1/blockchain/transactions/abc123...
```

### Usando JavaScript/TypeScript

```typescript
// Anclar datos
const response = await fetch('http://localhost:3000/api/v1/blockchain/anchor', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    data: 'Mi documento importante',
    metadata: {
      type: 'document',
      description: 'Certificación'
    }
  })
});

const result = await response.json();
console.log('Transaction hash:', result.txHash);
console.log('Explorer:', `https://stellar.expert/explorer/testnet/tx/${result.txHash}`);

// Verificar datos
const verifyResponse = await fetch('http://localhost:3000/api/v1/blockchain/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    txHash: result.txHash,
    data: 'Mi documento importante'
  })
});

const verification = await verifyResponse.json();
console.log('Valid:', verification.valid);
```

## Script de Prueba

Un script completo para probar el anclaje en testnet está disponible:

```bash
npm run test:blockchain
```

Este script:
1. Crea una cuenta de testnet si no existe
2. Verifica el balance
3. Ancla datos de prueba
4. Consulta la transacción
5. Verifica el anclaje
6. Muestra el historial de transacciones

## Integración con el Dashboard

Para embeber los datos en tu página web:

```html
<!-- Widget para mostrar certificación -->
<div id="blockchain-cert">
  <h3>Certificación Verificada en Blockchain</h3>
  <div id="cert-data"></div>
  <a id="explorer-link" target="_blank">Ver en Block Explorer</a>
</div>

<script>
async function loadCertification(txHash) {
  const response = await fetch(`/api/v1/blockchain/transactions/${txHash}`);
  const tx = await response.json();

  document.getElementById('cert-data').innerHTML = `
    <p>Estado: ${tx.successful ? '✓ Verificado' : '✗ No verificado'}</p>
    <p>Fecha: ${new Date(tx.createdAt).toLocaleString()}</p>
    <p>Hash: ${tx.hash}</p>
  `;

  document.getElementById('explorer-link').href =
    `https://stellar.expert/explorer/testnet/tx/${tx.hash}`;
}

// Cargar certificación
loadCertification('YOUR_TX_HASH');
</script>
```

## Seguridad

- Los endpoints de escritura (anchor) requieren autenticación JWT
- Los endpoints de lectura son públicos para permitir verificación independiente
- La clave secreta nunca se expone a través del API
- Los datos se almacenan como hash SHA-256 en la blockchain

## Costos

En testnet: Gratis (XLM de prueba)
En mainnet:
- Cada transacción cuesta ~0.00001 XLM
- Se recomienda mantener al menos 2 XLM en la cuenta para fees y reserves

## Próximos Pasos

1. Ejecutar `npm run setup:stellar` para crear cuenta de testnet
2. Agregar credenciales al `.env`
3. Iniciar el API: `cd apps/api && npm run dev`
4. Probar endpoints con la documentación Swagger en http://localhost:3000/docs
5. Integrar en tu aplicación web

## Soporte

Para más información sobre Stellar:
- Documentación: https://developers.stellar.org
- Explorer Testnet: https://stellar.expert/explorer/testnet
- Friendbot (fondos testnet): https://friendbot.stellar.org
