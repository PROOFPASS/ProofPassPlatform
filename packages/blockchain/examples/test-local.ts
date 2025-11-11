/**
 * Test local para @proofpass/blockchain
 *
 * Este script te permite probar las integraciones blockchain localmente
 * usando las redes testnet de cada blockchain.
 */

import { BlockchainManager } from '../src/blockchain-manager';
import { createHash } from 'crypto';

async function testBlockchainIntegration() {
  console.log('🚀 Iniciando test de blockchain local...\n');

  // 1. Crear el manager
  const manager = new BlockchainManager();

  // 2. Configurar las redes (necesitarás tus propias claves)
  console.log('📝 Configurando redes...');

  // Para Optimism Sepolia (testnet)
  // Necesitas: Una wallet de Ethereum y ETH en Sepolia OP
  // Faucet: https://app.optimism.io/faucet
  if (process.env.ETH_PRIVATE_KEY && process.env.ETH_PRIVATE_KEY !== 'your-private-key-here') {
    try {
      manager.addProvider({
        network: 'optimism-sepolia',
        privateKey: process.env.ETH_PRIVATE_KEY
      });
      console.log('✅ Optimism Sepolia configurado');
    } catch (error: any) {
      console.log('⚠️  Optimism Sepolia no configurado:', error.message);
    }
  } else {
    console.log('⚠️  ETH_PRIVATE_KEY no configurada (Optimism/Arbitrum)');
  }

  // Para Arbitrum Sepolia (testnet)
  // Mismo private key de Ethereum funciona para ambos L2
  // Faucet: https://faucet.quicknode.com/arbitrum/sepolia
  if (process.env.ETH_PRIVATE_KEY && process.env.ETH_PRIVATE_KEY !== 'your-private-key-here') {
    try {
      manager.addProvider({
        network: 'arbitrum-sepolia',
        privateKey: process.env.ETH_PRIVATE_KEY
      });
      console.log('✅ Arbitrum Sepolia configurado');
    } catch (error: any) {
      console.log('⚠️  Arbitrum Sepolia no configurado:', error.message);
    }
  }

  // Para Stellar Testnet
  // Puedes generar una cuenta test en: https://laboratory.stellar.org/#account-creator?network=test
  if (process.env.STELLAR_SECRET_KEY && process.env.STELLAR_SECRET_KEY !== 'SXXXXXX...') {
    try {
      manager.addProvider({
        network: 'stellar-testnet',
        privateKey: process.env.STELLAR_SECRET_KEY
      });
      console.log('✅ Stellar Testnet configurado');
    } catch (error: any) {
      console.log('⚠️  Stellar Testnet no configurado:', error.message);
    }
  } else {
    console.log('⚠️  STELLAR_SECRET_KEY no configurada');
  }

  const networks = manager.getNetworks();

  if (networks.length === 0) {
    console.log('\n❌ No hay redes configuradas. Por favor configura al menos una red.');
    console.log('\n📖 Instrucciones:');
    console.log('1. Copia .env.example a .env en el directorio raíz');
    console.log('2. Agrega tus claves privadas a .env');
    console.log('3. Ejecuta este script nuevamente\n');
    return;
  }

  console.log(`\n✅ ${networks.length} red(es) configurada(s): ${networks.join(', ')}\n`);

  // 3. Test de balance
  console.log('💰 Verificando balances...');
  for (const network of networks) {
    try {
      const provider = manager.getProvider(network);
      const balance = await provider.getBalance();
      const currency = network.includes('stellar') ? 'XLM' : 'ETH';
      console.log(`  ${network}: ${balance} ${currency}`);
    } catch (error: any) {
      console.log(`  ❌ ${network}: Error - ${error.message}`);
    }
  }

  // 4. Test de estimación de fees
  console.log('\n💵 Estimando fees...');
  for (const network of networks) {
    try {
      const provider = manager.getProvider(network);
      const fee = await provider.estimateFee(1);
      console.log(`  ${network}: ~${fee} wei`);
    } catch (error: any) {
      console.log(`  ❌ ${network}: Error - ${error.message}`);
    }
  }

  // 5. Test de anclaje de datos (opcional - comenta si no quieres gastar fondos)
  const SKIP_ANCHORING = process.env.SKIP_ANCHORING === 'true';

  if (!SKIP_ANCHORING) {
    console.log('\n⚓ Probando anclaje de datos...');

    // Crear un hash de prueba
    const testData = JSON.stringify({
      type: 'test',
      timestamp: new Date().toISOString(),
      message: 'ProofPass blockchain test'
    });

    const dataHash = createHash('sha256').update(testData).digest('hex');
    console.log(`  Hash de prueba: ${dataHash.substring(0, 16)}...`);

    // Anclar en la primera red disponible
    const firstNetwork = networks[0];
    try {
      console.log(`\n  📤 Anclando en ${firstNetwork}...`);
      const provider = manager.getProvider(firstNetwork);

      const result = await provider.anchorData(dataHash, {
        test: true,
        timestamp: new Date().toISOString()
      });

      console.log(`  ✅ Anclado exitosamente!`);
      console.log(`     TX Hash: ${result.txHash}`);
      console.log(`     Block: ${result.blockNumber}`);
      console.log(`     Fee: ${result.fee}`);
      console.log(`     Network: ${result.network}`);

      // Verificar el anclaje
      console.log(`\n  🔍 Verificando anclaje...`);
      const verification = await provider.verifyAnchor(result.txHash, dataHash);

      if (verification.valid) {
        console.log(`  ✅ Verificación exitosa!`);
        console.log(`     Timestamp: ${verification.timestamp}`);
      } else {
        console.log(`  ❌ Verificación falló`);
      }

      // Obtener estado de la transacción
      console.log(`\n  📊 Estado de la transacción...`);
      const status = await provider.getTransactionStatus(result.txHash);
      console.log(`     Confirmado: ${status.confirmed ? 'Sí' : 'No'}`);
      console.log(`     Confirmaciones: ${status.confirmations || 0}`);

    } catch (error: any) {
      console.log(`  ❌ Error al anclar: ${error.message}`);
    }
  } else {
    console.log('\n⏭️  Anclaje omitido (SKIP_ANCHORING=true)');
  }

  console.log('\n✅ Test completado!\n');
}

// Ejecutar el test
testBlockchainIntegration().catch(error => {
  console.error('❌ Error en el test:', error);
  process.exit(1);
});
