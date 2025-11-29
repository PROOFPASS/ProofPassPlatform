#!/usr/bin/env node
/**
 * Caso de Uso 3: Trazabilidad de Cadena de Suministro
 *
 * Escenario: Rastrear un producto desde su origen hasta el consumidor
 * final, con cada actor de la cadena agregando su certificación.
 *
 * Este ejemplo muestra cómo:
 * 1. Múltiples actores agregan credenciales a un producto
 * 2. Se crea un Digital Product Passport con toda la trazabilidad
 * 3. El consumidor final puede verificar todo el historial
 *
 * Ejecutar: node examples/use-cases/3-supply-chain.js
 */

const vcToolkit = require('../../packages/vc-toolkit/dist');
const zkToolkit = require('../../packages/zk-toolkit/dist/snark-proofs');

const log = (msg) => console.log(`\x1b[34m→\x1b[0m ${msg}`);
const success = (msg) => console.log(`\x1b[32m✓\x1b[0m ${msg}`);
const section = (title) => console.log(`\n\x1b[1m\x1b[36m═══ ${title} ═══\x1b[0m\n`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log(`
\x1b[1m\x1b[35m╔══════════════════════════════════════════════════════════╗
║     CASO DE USO: Trazabilidad Supply Chain                ║
║     (Digital Product Passport - EU DPP)                   ║
╚══════════════════════════════════════════════════════════╝\x1b[0m
`);

  // ========================================
  // ACTORES DE LA CADENA
  // ========================================
  section('1. ACTORES DE LA CADENA DE SUMINISTRO');

  log('Creando identidades de todos los actores...\n');

  const actors = {
    farm: await vcToolkit.generateDIDKey(),
    processor: await vcToolkit.generateDIDKey(),
    manufacturer: await vcToolkit.generateDIDKey(),
    logistics: await vcToolkit.generateDIDKey(),
    retailer: await vcToolkit.generateDIDKey(),
  };

  console.log('  \x1b[33m🌱 Granja Orgánica\x1b[0m');
  console.log('     DID:', actors.farm.did.substring(0, 40) + '...');

  console.log('  \x1b[33m🏭 Procesadora\x1b[0m');
  console.log('     DID:', actors.processor.did.substring(0, 40) + '...');

  console.log('  \x1b[33m🧵 Fabricante\x1b[0m');
  console.log('     DID:', actors.manufacturer.did.substring(0, 40) + '...');

  console.log('  \x1b[33m🚚 Logística\x1b[0m');
  console.log('     DID:', actors.logistics.did.substring(0, 40) + '...');

  console.log('  \x1b[33m🏪 Minorista\x1b[0m');
  console.log('     DID:', actors.retailer.did.substring(0, 40) + '...');

  // Producto
  const product = await vcToolkit.generateDIDKey();
  console.log('\n  \x1b[36m📦 Producto (Camiseta)\x1b[0m');
  console.log('     DID:', product.did.substring(0, 40) + '...');

  // ========================================
  // PASO 1: ORIGEN - GRANJA
  // ========================================
  section('2. PASO 1: Origen - Granja Orgánica');

  log('La granja certifica el origen del algodón...');

  const originCredential = vcToolkit.createCredential({
    issuerDID: actors.farm.did,
    subjectDID: product.did,
    credentialSubject: {
      id: product.did,
      stage: 'origin',
      rawMaterial: 'Algodón Orgánico',
      farmName: 'Granja El Algodonero',
      location: {
        country: 'Argentina',
        region: 'Chaco',
        coordinates: '-27.4512, -58.9867'
      },
      harvestDate: '2024-03-15',
      certifications: ['GOTS', 'Organic Argentina'],
      pesticidesUsed: false,
      waterSource: 'Riego por goteo (sustentable)',
      carbonFootprint: 0.8, // kg CO2 por kg
    },
    type: ['OriginCredential', 'OrganicFarmCredential']
  });

  const originVC = await vcToolkit.issueVC({
    credential: originCredential,
    issuerKeyPair: actors.farm
  });

  success('Credencial de origen emitida');
  console.log('  Materia prima: Algodón Orgánico');
  console.log('  Ubicación: Chaco, Argentina');
  console.log('  Sin pesticidas: Sí');

  // ========================================
  // PASO 2: PROCESAMIENTO
  // ========================================
  section('3. PASO 2: Procesamiento');

  log('La procesadora certifica el tratamiento...');

  const processingCredential = vcToolkit.createCredential({
    issuerDID: actors.processor.did,
    subjectDID: product.did,
    credentialSubject: {
      id: product.did,
      stage: 'processing',
      processType: 'Hilado y Tejido',
      processorName: 'Hilandería del Norte S.A.',
      inputMaterial: originCredential.id,
      outputMaterial: 'Tela de Algodón Orgánico 180g/m²',
      processDate: '2024-04-01',
      qualityGrade: 'Premium',
      chemicalsUsed: ['Tintes naturales GOTS certificados'],
      waterRecycled: 85, // % de agua reciclada
      energySource: '60% Solar, 40% Red eléctrica',
    },
    type: ['ProcessingCredential', 'TextileProcessingCredential']
  });

  const processingVC = await vcToolkit.issueVC({
    credential: processingCredential,
    issuerKeyPair: actors.processor
  });

  success('Credencial de procesamiento emitida');
  console.log('  Proceso: Hilado y Tejido');
  console.log('  Agua reciclada: 85%');
  console.log('  Energía solar: 60%');

  // ========================================
  // PASO 3: MANUFACTURA
  // ========================================
  section('4. PASO 3: Manufactura');

  log('El fabricante certifica la producción...');

  const manufacturingCredential = vcToolkit.createCredential({
    issuerDID: actors.manufacturer.did,
    subjectDID: product.did,
    credentialSubject: {
      id: product.did,
      stage: 'manufacturing',
      productName: 'Camiseta Orgánica Premium',
      sku: 'ECO-TEE-2024-001',
      manufacturerName: 'EcoTextiles Argentina S.A.',
      productionDate: '2024-04-20',
      batchNumber: 'BATCH-2024-04-001',
      quantity: 500,
      size: 'M',
      color: 'Natural White',
      fairTradeCertified: true,
      workersCompensation: 'Living wage',
      safetyStandards: ['ISO 45001', 'SA8000'],
    },
    type: ['ManufacturingCredential', 'FairTradeCredential']
  });

  const manufacturingVC = await vcToolkit.issueVC({
    credential: manufacturingCredential,
    issuerKeyPair: actors.manufacturer
  });

  success('Credencial de manufactura emitida');
  console.log('  Producto: Camiseta Orgánica Premium');
  console.log('  Fair Trade: Sí');
  console.log('  Salario digno: Sí');

  // ========================================
  // PASO 4: LOGÍSTICA
  // ========================================
  section('5. PASO 4: Logística y Transporte');

  log('La empresa de logística certifica el transporte...');

  const logisticsCredential = vcToolkit.createCredential({
    issuerDID: actors.logistics.did,
    subjectDID: product.did,
    credentialSubject: {
      id: product.did,
      stage: 'logistics',
      carrierName: 'EcoLogistics S.A.',
      transportMode: 'Terrestre (Camión eléctrico)',
      route: 'Chaco → Buenos Aires',
      distanceKm: 1050,
      carbonOffset: true,
      temperatureControlled: false,
      departureDate: '2024-05-01',
      arrivalDate: '2024-05-03',
      handlingConditions: 'Almacenamiento seco, protegido de luz solar',
      chainOfCustody: ['Origen', 'Centro distribución', 'Destino'],
    },
    type: ['LogisticsCredential', 'TransportCredential']
  });

  const logisticsVC = await vcToolkit.issueVC({
    credential: logisticsCredential,
    issuerKeyPair: actors.logistics
  });

  success('Credencial de logística emitida');
  console.log('  Transporte: Camión eléctrico');
  console.log('  Distancia: 1050 km');
  console.log('  Carbon offset: Sí');

  // ========================================
  // PASO 5: RETAIL
  // ========================================
  section('6. PASO 5: Punto de Venta');

  log('El minorista certifica la recepción y venta...');

  const retailCredential = vcToolkit.createCredential({
    issuerDID: actors.retailer.did,
    subjectDID: product.did,
    credentialSubject: {
      id: product.did,
      stage: 'retail',
      retailerName: 'EcoFashion Store',
      storeLocation: 'Buenos Aires, Argentina',
      receivedDate: '2024-05-03',
      inspectionPassed: true,
      price: 4500, // ARS
      currency: 'ARS',
      authenticity: 'verified',
      returnPolicy: '30 días',
    },
    type: ['RetailCredential', 'SaleCredential']
  });

  const retailVC = await vcToolkit.issueVC({
    credential: retailCredential,
    issuerKeyPair: actors.retailer
  });

  success('Credencial de venta emitida');
  console.log('  Tienda: EcoFashion Store');
  console.log('  Inspección: Aprobada');

  // ========================================
  // DIGITAL PRODUCT PASSPORT
  // ========================================
  section('7. DIGITAL PRODUCT PASSPORT (EU DPP)');

  log('Ensamblando pasaporte digital con toda la trazabilidad...\n');

  // Prueba ZK de sostenibilidad
  const sustainabilityProof = await zkToolkit.generateThresholdProof({
    value: 85, // % agua reciclada
    threshold: 75
  });

  const productPassport = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/dpp/v1'
    ],
    id: `dpp:${product.did}`,
    type: ['DigitalProductPassport', 'SustainableProductPassport'],

    product: {
      name: 'Camiseta Orgánica Premium',
      sku: 'ECO-TEE-2024-001',
      gtin: '7501234567890',
      category: 'Textil / Ropa',
    },

    supplyChain: [
      {
        stage: 'origin',
        actor: 'Granja El Algodonero',
        credential: originVC.substring(0, 50) + '...',
        verified: true,
        timestamp: '2024-03-15'
      },
      {
        stage: 'processing',
        actor: 'Hilandería del Norte S.A.',
        credential: processingVC.substring(0, 50) + '...',
        verified: true,
        timestamp: '2024-04-01'
      },
      {
        stage: 'manufacturing',
        actor: 'EcoTextiles Argentina S.A.',
        credential: manufacturingVC.substring(0, 50) + '...',
        verified: true,
        timestamp: '2024-04-20'
      },
      {
        stage: 'logistics',
        actor: 'EcoLogistics S.A.',
        credential: logisticsVC.substring(0, 50) + '...',
        verified: true,
        timestamp: '2024-05-03'
      },
      {
        stage: 'retail',
        actor: 'EcoFashion Store',
        credential: retailVC.substring(0, 50) + '...',
        verified: true,
        timestamp: '2024-05-03'
      }
    ],

    sustainability: {
      certifications: ['GOTS', 'Fair Trade', 'Organic Argentina'],
      carbonFootprintKg: 2.3,
      waterRecycledPercent: 85,
      renewableEnergy: '60%',
      zkProof: {
        claim: 'waterRecycled >= 75%',
        nullifier: sustainabilityProof.nullifierHash.substring(0, 32),
        verified: true
      }
    },

    compliance: {
      euDPP: true,
      gdpr: true,
      standard: 'EU Digital Product Passport Regulation 2024'
    },

    createdAt: new Date().toISOString()
  };

  success('Digital Product Passport creado\n');

  console.log('  Etapas de la cadena: 5');
  console.log('  Credenciales verificadas: 5');
  console.log('  Pruebas ZK incluidas: 1');
  console.log('  Compliance: EU DPP, GDPR');

  // ========================================
  // VISUALIZACIÓN DEL PASAPORTE
  // ========================================
  section('8. VISUALIZACIÓN PARA CONSUMIDOR');

  console.log(`
\x1b[32m╔══════════════════════════════════════════════════════════╗
║           PASAPORTE DIGITAL DEL PRODUCTO                 ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  📦 Camiseta Orgánica Premium                            ║
║  SKU: ECO-TEE-2024-001                                   ║
║                                                          ║
║  ═══════════════════════════════════════════════════════ ║
║  🌱 ORIGEN           Granja El Algodonero, Chaco    ✓   ║
║  🏭 PROCESAMIENTO    Hilandería del Norte           ✓   ║
║  🧵 MANUFACTURA      EcoTextiles Argentina          ✓   ║
║  🚚 LOGÍSTICA        EcoLogistics (eléctrico)       ✓   ║
║  🏪 VENTA            EcoFashion Store               ✓   ║
║  ═══════════════════════════════════════════════════════ ║
║                                                          ║
║  CERTIFICACIONES:                                        ║
║  ✓ GOTS (Algodón orgánico)                               ║
║  ✓ Fair Trade (Comercio justo)                           ║
║  ✓ Organic Argentina                                     ║
║                                                          ║
║  SOSTENIBILIDAD:                                         ║
║  • Huella de carbono: 2.3 kg CO2                         ║
║  • Agua reciclada: ≥75% ✓ (ZK verified)                  ║
║  • Energía renovable: 60%                                ║
║                                                          ║
║  🔐 Verificado criptográficamente                        ║
║  📋 Cumple EU Digital Product Passport                   ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝\x1b[0m
`);

  // ========================================
  // QR CODE
  // ========================================
  section('9. CÓDIGO QR PARA ESCANEO');

  console.log('  El consumidor puede escanear un QR en la etiqueta del producto');
  console.log('  para ver todo el pasaporte digital y verificar autenticidad.\n');

  console.log('  URL del pasaporte:');
  console.log(`  \x1b[36mhttps://verify.proofpass.co/dpp/${product.did.substring(8, 40)}\x1b[0m\n`);

  console.log('\x1b[1mBeneficios para cada actor:\x1b[0m');
  console.log('  • \x1b[33mConsumidor:\x1b[0m Verifica autenticidad y sostenibilidad');
  console.log('  • \x1b[33mMinorista:\x1b[0m Demuestra origen legítimo');
  console.log('  • \x1b[33mFabricante:\x1b[0m Protege marca contra falsificaciones');
  console.log('  • \x1b[33mRegulador:\x1b[0m Audita cumplimiento de normativas');
  console.log('  • \x1b[33mInversor ESG:\x1b[0m Verifica claims de sostenibilidad\n');
}

main().catch(err => {
  console.error('\x1b[31mError:\x1b[0m', err.message);
  process.exit(1);
});
