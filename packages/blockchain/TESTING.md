# Testing Local - @proofpass/blockchain

Guía para testear las integraciones blockchain localmente.

## Paso 1: Obtener fondos de testnet

### Optimism Sepolia

1. Consigue ETH en Sepolia:
   - Faucet: https://sepoliafaucet.com/
   - O usa Alchemy: https://sepoliafaucet.net/

2. Haz bridge de Sepolia ETH a Optimism Sepolia:
   - Bridge: https://app.optimism.io/bridge
   - O usa el faucet directo: https://app.optimism.io/faucet

### Arbitrum Sepolia

1. Ya tienes ETH en Sepolia del paso anterior

2. Haz bridge a Arbitrum Sepolia:
   - Bridge: https://bridge.arbitrum.io/
   - O usa faucet: https://faucet.quicknode.com/arbitrum/sepolia

### Stellar Testnet

1. Crea una cuenta de prueba:
   - Laboratory: https://laboratory.stellar.org/#account-creator?network=test
   - Automáticamente te da 10,000 XLM de prueba

2. Guarda el **Secret Key** (empieza con 'S')

## Paso 2: Configurar variables de entorno

```bash
# En el directorio packages/blockchain
cp .env.example .env
```

Edita `.env` y agrega tus claves:

```bash
# Tu private key de Ethereum (mismo para Optimism y Arbitrum)
ETH_PRIVATE_KEY=0x1234567890abcdef...

# Tu secret key de Stellar (empieza con S)
STELLAR_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Opcional: Solo verificar balance sin anclar datos
SKIP_ANCHORING=false
```

**⚠️ IMPORTANTE**: Nunca subas el archivo `.env` a git. Ya está en `.gitignore`.

## Paso 3: Instalar dependencias

```bash
# Desde la raíz del proyecto
npm install

# O desde el directorio packages/blockchain
cd packages/blockchain
npm install
```

## Paso 4: Compilar el paquete

```bash
# Desde packages/blockchain
npm run build
```

## Paso 5: Ejecutar el test

```bash
# Desde packages/blockchain
npx tsx examples/test-local.ts
```

## Qué hace el test

El script de test realiza las siguientes operaciones:

1. **Configuración**: Lee las claves del `.env` y configura las redes
2. **Balance**: Verifica el balance en cada red configurada
3. **Fees**: Estima el costo de un anclaje en cada red
4. **Anclaje** (opcional): Ancla datos de prueba en la primera red
5. **Verificación**: Verifica que el anclaje fue exitoso
6. **Estado**: Obtiene el estado de la transacción

## Salida esperada

```
🚀 Iniciando test de blockchain local...

📝 Configurando redes...
✅ Optimism Sepolia configurado
✅ Arbitrum Sepolia configurado
✅ Stellar Testnet configurado

✅ 3 red(es) configurada(s): optimism-sepolia, arbitrum-sepolia, stellar-testnet

💰 Verificando balances...
  optimism-sepolia: 0.5 ETH
  arbitrum-sepolia: 0.3 ETH
  stellar-testnet: 10000.0 XLM

💵 Estimando fees...
  optimism-sepolia: ~21000 wei
  arbitrum-sepolia: ~21000 wei
  stellar-testnet: ~100 stroops

⚓ Probando anclaje de datos...
  Hash de prueba: 3a5f8b2c9d1e4f...

  📤 Anclando en optimism-sepolia...
  ✅ Anclado exitosamente!
     TX Hash: 0xabc123...
     Block: 12345678
     Fee: 0.00042
     Network: optimism-sepolia

  🔍 Verificando anclaje...
  ✅ Verificación exitosa!
     Timestamp: 2025-10-31T12:34:56.789Z

  📊 Estado de la transacción...
     Confirmado: Sí
     Confirmaciones: 5

✅ Test completado!
```

## Omitir el anclaje real

Si solo quieres verificar que todo está configurado correctamente sin gastar fondos:

```bash
SKIP_ANCHORING=true npx tsx examples/test-local.ts
```

Esto solo verificará balances y estimará fees, sin hacer transacciones reales.

## Costos aproximados

Los costos en testnet son similares a mainnet:

- **Optimism Sepolia**: ~$0.001-$0.01 por transacción (gratis con faucet)
- **Arbitrum Sepolia**: ~$0.0001-$0.001 por transacción (gratis con faucet)
- **Stellar Testnet**: ~$0.00001 por operación (gratis con faucet)

## Troubleshooting

### Error: "Insufficient funds"

- **Solución**: Consigue más fondos de testnet usando los faucets

### Error: "Invalid private key"

- **Solución**: Verifica que el formato de tu private key es correcto:
  - Ethereum: Debe empezar con `0x` y tener 66 caracteres (0x + 64 hex)
  - Stellar: Debe empezar con `S` y tener 56 caracteres

### Error: "Network error" o "Connection refused"

- **Solución**: Verifica tu conexión a internet o usa un RPC custom:

```bash
OPTIMISM_RPC_URL=https://sepolia.optimism.io
ARBITRUM_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
```

### Error: "Transaction underpriced"

- **Solución**: La red está congestionada. Espera unos minutos e intenta nuevamente

## Testing programático

Puedes importar y usar el paquete directamente:

```typescript
import { BlockchainManager } from '@proofpass/blockchain';
import { createHash } from 'crypto';

async function myTest() {
  const manager = new BlockchainManager();

  // Configurar
  manager.addProvider({
    network: 'optimism-sepolia',
    privateKey: process.env.ETH_PRIVATE_KEY!
  });

  // Anclar
  const hash = createHash('sha256').update('test data').digest('hex');
  const result = await manager.getProvider().anchorData(hash);

  console.log('TX:', result.txHash);
}

myTest();
```

## Exploradores de bloques

Puedes verificar tus transacciones en:

- **Optimism Sepolia**: https://sepolia-optimism.etherscan.io/
- **Arbitrum Sepolia**: https://sepolia.arbiscan.io/
- **Stellar Testnet**: https://stellar.expert/explorer/testnet

## Siguiente paso

Una vez que hayas testeado en testnet, puedes configurar mainnet:

```typescript
// Optimism Mainnet
manager.addProvider({
  network: 'optimism',
  privateKey: process.env.ETH_PRIVATE_KEY!
});

// Arbitrum One
manager.addProvider({
  network: 'arbitrum',
  privateKey: process.env.ETH_PRIVATE_KEY!
});

// Stellar Mainnet
manager.addProvider({
  network: 'stellar-mainnet',
  privateKey: process.env.STELLAR_SECRET!
});
```

**⚠️ En mainnet usarás fondos reales. Ten cuidado con tus claves privadas.**
