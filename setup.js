#!/usr/bin/env node
/**
 * ProofPass Platform - Setup Wizard
 *
 * Detecta automáticamente el entorno y guía al usuario a través
 * del setup correcto para su caso de uso.
 *
 * Uso: node setup.js
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colores para terminal
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

function log(msg, color = c.reset) {
  console.log(`${color}${msg}${c.reset}`);
}

function success(msg) { log(`✓ ${msg}`, c.green); }
function info(msg) { log(`→ ${msg}`, c.blue); }
function warn(msg) { log(`⚠ ${msg}`, c.yellow); }
function error(msg) { log(`✗ ${msg}`, c.red); }

function checkCommand(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function getVersion(cmd) {
  try {
    return execSync(`${cmd} --version`, { encoding: 'utf8' }).trim().split('\n')[0];
  } catch {
    return null;
  }
}

async function main() {
  console.log(`
${c.cyan}${c.bold}╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   ██████╗ ██████╗  ██████╗  ██████╗ ███████╗██████╗        ║
║   ██╔══██╗██╔══██╗██╔═══██╗██╔═══██╗██╔════╝██╔══██╗       ║
║   ██████╔╝██████╔╝██║   ██║██║   ██║█████╗  ██████╔╝       ║
║   ██╔═══╝ ██╔══██╗██║   ██║██║   ██║██╔══╝  ██╔═══╝        ║
║   ██║     ██║  ██║╚██████╔╝╚██████╔╝██║     ██║            ║
║   ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝            ║
║                                                            ║
║              Setup Wizard v1.0                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝${c.reset}
`);

  // ============================================
  // Paso 1: Detectar entorno
  // ============================================
  log('\n📋 PASO 1: Detectando entorno...\n', c.bold);

  const env = {
    node: getVersion('node'),
    npm: getVersion('npm'),
    docker: checkCommand('docker'),
    postgres: checkCommand('psql'),
    redis: checkCommand('redis-cli'),
    git: checkCommand('git'),
  };

  // Node.js (requerido)
  if (env.node) {
    const nodeVersion = parseInt(env.node.match(/v?(\d+)/)?.[1] || '0');
    if (nodeVersion >= 18) {
      success(`Node.js: ${env.node}`);
    } else {
      error(`Node.js ${env.node} - Se requiere v18+`);
      process.exit(1);
    }
  } else {
    error('Node.js no encontrado - Instalar desde https://nodejs.org');
    process.exit(1);
  }

  // npm
  if (env.npm) {
    success(`npm: ${env.npm}`);
  }

  // Opcionales
  if (env.docker) success('Docker: disponible');
  else info('Docker: no disponible (opcional)');

  if (env.postgres) success('PostgreSQL: disponible');
  else info('PostgreSQL: no disponible (necesario para API)');

  if (env.redis) success('Redis: disponible');
  else info('Redis: no disponible (opcional)');

  // ============================================
  // Paso 2: Determinar caso de uso
  // ============================================
  log('\n📋 PASO 2: ¿Qué quieres hacer?\n', c.bold);

  console.log(`
  ${c.cyan}1${c.reset}) ${c.bold}Ver demo rápida${c.reset} (2 min)
     Solo quiero ver cómo funciona, sin instalar nada más.

  ${c.cyan}2${c.reset}) ${c.bold}Integrar en mi app${c.reset} (5 min)
     Quiero usar las librerías en mi proyecto existente.

  ${c.cyan}3${c.reset}) ${c.bold}Desarrollo local${c.reset} (15 min)
     Quiero levantar toda la plataforma localmente.

  ${c.cyan}4${c.reset}) ${c.bold}Producción${c.reset} (30 min)
     Quiero desplegar en un servidor.
`);

  const choice = await ask(`${c.bold}Elige una opción (1-4): ${c.reset}`);

  switch (choice.trim()) {
    case '1':
      await runQuickDemo();
      break;
    case '2':
      await showIntegrationGuide();
      break;
    case '3':
      await setupLocalDev(env);
      break;
    case '4':
      await showProductionGuide();
      break;
    default:
      warn('Opción no válida. Ejecutando demo rápida...');
      await runQuickDemo();
  }

  rl.close();
}

// ============================================
// Opción 1: Demo rápida (sin dependencias)
// ============================================
async function runQuickDemo() {
  log('\n🚀 DEMO RÁPIDA\n', c.bold + c.cyan);

  info('Esta demo muestra el flujo completo SIN necesidad de API o base de datos.');
  info('Usa las librerías directamente para demostrar las capacidades.\n');

  const demoPath = path.join(__dirname, 'scripts', 'demo-standalone.js');

  if (!fs.existsSync(demoPath)) {
    error('Demo no encontrada. Ejecuta: npm install');
    process.exit(1);
  }

  log('Ejecutando demo...\n', c.dim);

  const demo = spawn('node', [demoPath], { stdio: 'inherit' });

  demo.on('close', (code) => {
    if (code === 0) {
      log('\n' + '═'.repeat(60), c.green);
      success('Demo completada exitosamente!');
      log('═'.repeat(60) + '\n', c.green);

      console.log(`${c.bold}¿Qué sigue?${c.reset}

  ${c.cyan}•${c.reset} Para integrar en tu app:  ${c.dim}node setup.js${c.reset} → opción 2
  ${c.cyan}•${c.reset} Para desarrollo local:    ${c.dim}node setup.js${c.reset} → opción 3
  ${c.cyan}•${c.reset} Documentación:            ${c.dim}docs/GETTING_STARTED.md${c.reset}
  ${c.cyan}•${c.reset} API Reference:            ${c.dim}docs/API_REFERENCE.md${c.reset}
`);
    }
    process.exit(code);
  });
}

// ============================================
// Opción 2: Guía de integración
// ============================================
async function showIntegrationGuide() {
  log('\n📦 GUÍA DE INTEGRACIÓN\n', c.bold + c.cyan);

  console.log(`
${c.bold}Instala los paquetes que necesites:${c.reset}

  ${c.dim}# Credenciales verificables (W3C VC)${c.reset}
  npm install @proofpass/vc-toolkit

  ${c.dim}# Zero-Knowledge Proofs (Groth16)${c.reset}
  npm install @proofpass/zk-toolkit

  ${c.dim}# Blockchain (Stellar, Optimism, Arbitrum)${c.reset}
  npm install @proofpass/blockchain

  ${c.dim}# Cliente API (si usas el backend de ProofPass)${c.reset}
  npm install @proofpass/client

  ${c.dim}# Códigos QR para credenciales${c.reset}
  npm install @proofpass/qr-toolkit

${c.bold}Ejemplo básico - Crear y verificar credencial:${c.reset}
`);

  console.log(`${c.cyan}
const { generateDIDKey, createCredential, issueVC, verifyVC } = require('@proofpass/vc-toolkit');

async function example() {
  // 1. Crear identidades
  const issuer = await generateDIDKey();
  const subject = await generateDIDKey();

  // 2. Crear credencial
  const credential = createCredential({
    issuerDID: issuer.did,
    subjectDID: subject.did,
    credentialSubject: {
      id: subject.did,
      name: 'Mi Producto',
      certified: true
    },
    type: ['ProductCredential']
  });

  // 3. Firmar
  const vcJWT = await issueVC({ credential, issuerKeyPair: issuer });

  // 4. Verificar
  const result = await verifyVC(vcJWT);
  console.log('Válido:', result.verified);
}

example();
${c.reset}`);

  console.log(`
${c.bold}Ejemplo ZK Proof - Probar sin revelar:${c.reset}
`);

  console.log(`${c.cyan}
const { generateThresholdProof, verifyThresholdProof } = require('@proofpass/zk-toolkit');

async function zkExample() {
  // Probar que edad >= 18 SIN revelar la edad exacta
  const proof = await generateThresholdProof({
    value: 25,      // Edad real (privada)
    threshold: 18   // Umbral público
  });

  // Cualquiera puede verificar
  const { verified } = await verifyThresholdProof(
    proof.proof,
    proof.publicSignals
  );

  console.log('Cumple requisito:', verified);
  // El verificador NO sabe que la edad es 25
}

zkExample();
${c.reset}`);

  console.log(`
${c.bold}Más ejemplos:${c.reset}
  ${c.dim}examples/demo-client/${c.reset}     - Flujo completo paso a paso
  ${c.dim}docs/API_REFERENCE.md${c.reset}    - API REST completa
  ${c.dim}packages/*/README.md${c.reset}     - Documentación de cada paquete
`);
}

// ============================================
// Opción 3: Setup desarrollo local
// ============================================
async function setupLocalDev(env) {
  log('\n🔧 SETUP DESARROLLO LOCAL\n', c.bold + c.cyan);

  // Verificar PostgreSQL
  if (!env.postgres && !env.docker) {
    error('Necesitas PostgreSQL o Docker para desarrollo local.');
    console.log(`
  ${c.bold}Opciones:${c.reset}

  ${c.cyan}macOS:${c.reset}    brew install postgresql@14
  ${c.cyan}Ubuntu:${c.reset}   sudo apt install postgresql
  ${c.cyan}Docker:${c.reset}   docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15
`);
    process.exit(1);
  }

  // 1. Instalar dependencias
  log('\n1️⃣  Instalando dependencias...', c.bold);
  try {
    execSync('npm install', { stdio: 'inherit' });
    success('Dependencias instaladas');
  } catch (e) {
    error('Error instalando dependencias');
    process.exit(1);
  }

  // 2. Compilar packages
  log('\n2️⃣  Compilando packages...', c.bold);
  try {
    execSync('npm run build:packages', { stdio: 'inherit' });
    success('Packages compilados');
  } catch (e) {
    warn('Error compilando algunos packages (puede continuar)');
  }

  // 3. Configurar API
  log('\n3️⃣  Configurando API...', c.bold);
  const apiEnvPath = path.join(__dirname, 'apps', 'api', '.env');
  const apiEnvExample = path.join(__dirname, 'apps', 'api', '.env.example');

  if (!fs.existsSync(apiEnvPath)) {
    if (fs.existsSync(apiEnvExample)) {
      fs.copyFileSync(apiEnvExample, apiEnvPath);
      info('Archivo .env creado desde .env.example');
    } else {
      // Crear .env básico
      const basicEnv = `
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/proofpass_dev"
JWT_SECRET="dev-secret-change-in-production-min-32-chars"
REDIS_URL="redis://localhost:6379"
CORS_ORIGIN="http://localhost:3001"
`.trim();
      fs.writeFileSync(apiEnvPath, basicEnv);
      info('Archivo .env creado con valores por defecto');
    }
  } else {
    success('Archivo .env ya existe');
  }

  // 4. Setup base de datos
  log('\n4️⃣  Configurando base de datos...', c.bold);

  if (env.docker && !env.postgres) {
    info('Iniciando PostgreSQL con Docker...');
    try {
      execSync('docker run -d --name proofpass-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=proofpass_dev postgres:15', { stdio: 'inherit' });
      success('PostgreSQL iniciado en Docker');
      // Esperar a que inicie
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      warn('Contenedor puede ya existir, continuando...');
    }
  }

  // Ejecutar migraciones
  log('\n5️⃣  Ejecutando migraciones...', c.bold);
  try {
    process.chdir(path.join(__dirname, 'apps', 'api'));
    execSync('npx prisma generate', { stdio: 'inherit' });
    execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
    process.chdir(__dirname);
    success('Migraciones completadas');
  } catch (e) {
    warn('Error en migraciones - puede necesitar crear la BD manualmente');
    console.log(`
  ${c.dim}Ejecuta manualmente:${c.reset}
  createdb proofpass_dev
  cd apps/api && npx prisma migrate dev
`);
  }

  // 6. Listo!
  log('\n' + '═'.repeat(60), c.green);
  success('Setup completado!');
  log('═'.repeat(60) + '\n', c.green);

  console.log(`${c.bold}Para iniciar:${c.reset}

  ${c.cyan}Terminal 1 - API:${c.reset}
  npm run dev:api

  ${c.cyan}Terminal 2 - Dashboard (opcional):${c.reset}
  npm run dev:platform

  ${c.cyan}Terminal 3 - Probar:${c.reset}
  curl http://localhost:3000/health

${c.bold}Credenciales por defecto:${c.reset}
  Email:    admin@proofpass.local
  Password: Admin123!

${c.bold}URLs:${c.reset}
  API:       http://localhost:3000
  Swagger:   http://localhost:3000/docs
  Dashboard: http://localhost:3001
`);
}

// ============================================
// Opción 4: Guía de producción
// ============================================
async function showProductionGuide() {
  log('\n🏭 GUÍA DE PRODUCCIÓN\n', c.bold + c.cyan);

  console.log(`
${c.bold}Requisitos mínimos:${c.reset}
  • 4 CPU cores, 8GB RAM
  • PostgreSQL 14+
  • Redis 7+
  • Docker (recomendado)
  • Dominio con SSL

${c.bold}Pasos:${c.reset}

  ${c.cyan}1.${c.reset} Revisar checklist de producción:
     ${c.dim}cat PRODUCTION_READINESS.md${c.reset}

  ${c.cyan}2.${c.reset} Configurar variables de entorno:
     ${c.dim}cp .env.production.example .env.production${c.reset}

     Variables críticas:
     • DATABASE_URL (con SSL)
     • JWT_SECRET (mínimo 32 chars, generado con openssl)
     • STELLAR_ISSUER_SECRET (clave de producción)
     • CORS_ORIGIN (tu dominio)

  ${c.cyan}3.${c.reset} Desplegar con Docker:
     ${c.dim}docker-compose -f docker-compose.production.yml up -d${c.reset}

  ${c.cyan}4.${c.reset} Verificar:
     ${c.dim}curl https://tu-dominio.com/health${c.reset}

${c.bold}Documentación detallada:${c.reset}
  • ${c.dim}docs/DEPLOYMENT.md${c.reset}
  • ${c.dim}PRODUCTION_READINESS.md${c.reset}
  • ${c.dim}docs/deployment/${c.reset}

${c.bold}Seguridad:${c.reset}
  • ${c.dim}SECURITY.md${c.reset}
  • ${c.dim}docs/security/${c.reset}

${c.yellow}⚠  Para producción, se recomienda:${c.reset}
  • Auditoría de seguridad externa
  • Configurar monitoreo (Prometheus/Grafana)
  • Backups automáticos de PostgreSQL
  • Rate limiting ajustado a tu caso de uso
`);
}

// Ejecutar
main().catch(e => {
  error(e.message);
  process.exit(1);
});
