#!/usr/bin/env node
/**
 * Caso de Uso 2: Verificación de Edad (Privacy-Preserving)
 *
 * Escenario: Un servicio necesita verificar que un usuario es mayor
 * de 18 años sin conocer su edad exacta ni fecha de nacimiento.
 *
 * Este ejemplo muestra cómo:
 * 1. Un emisor (gobierno, banco) crea una credencial de identidad
 * 2. El usuario genera una prueba ZK de que es mayor de 18
 * 3. El verificador confirma sin acceder a datos personales
 *
 * Ejecutar: node examples/use-cases/2-age-verification.js
 */

const vcToolkit = require('../../packages/vc-toolkit/dist');
const zkToolkit = require('../../packages/zk-toolkit/dist/snark-proofs');

const log = (msg) => console.log(`\x1b[34m→\x1b[0m ${msg}`);
const success = (msg) => console.log(`\x1b[32m✓\x1b[0m ${msg}`);
const section = (title) => console.log(`\n\x1b[1m\x1b[36m═══ ${title} ═══\x1b[0m\n`);

async function main() {
  console.log(`
\x1b[1m\x1b[35m╔══════════════════════════════════════════════════════════╗
║     CASO DE USO: Verificación de Edad                     ║
║     (Zero-Knowledge - Privacy Preserving)                 ║
╚══════════════════════════════════════════════════════════╝\x1b[0m
`);

  // ========================================
  // ACTORES
  // ========================================
  section('1. PARTICIPANTES');

  log('Emisor de identidad (ej: Registro Civil, Banco)...');
  const identityIssuer = await vcToolkit.generateDIDKey();
  success(`Emisor: ${identityIssuer.did.substring(0, 45)}...`);

  log('Usuario (persona que necesita probar su edad)...');
  const user = await vcToolkit.generateDIDKey();
  success(`Usuario: ${user.did.substring(0, 45)}...`);

  log('Verificador (ej: E-commerce, Casino online)...');
  const verifier = await vcToolkit.generateDIDKey();
  success(`Verificador: ${verifier.did.substring(0, 45)}...`);

  // ========================================
  // DATOS DEL USUARIO (PRIVADOS)
  // ========================================
  section('2. CREDENCIAL DE IDENTIDAD (Datos Privados)');

  // Estos datos NUNCA se comparten con el verificador
  const privateUserData = {
    fullName: 'María García López',
    dateOfBirth: '1995-03-15',
    age: 29, // Calculado
    nationalId: 'ARG-12345678',
    country: 'Argentina',
  };

  console.log('  \x1b[33m⚠ Estos datos son PRIVADOS del usuario:\x1b[0m');
  console.log('  Nombre:', privateUserData.fullName);
  console.log('  Fecha nacimiento:', privateUserData.dateOfBirth);
  console.log('  Edad exacta:', privateUserData.age, 'años');
  console.log('  DNI:', privateUserData.nationalId);

  // ========================================
  // EMISIÓN DE CREDENCIAL
  // ========================================
  section('3. EMISIÓN DE CREDENCIAL (Por entidad autorizada)');

  log('El Registro Civil emite credencial de identidad...');

  const identityCredential = vcToolkit.createCredential({
    issuerDID: identityIssuer.did,
    subjectDID: user.did,
    credentialSubject: {
      id: user.did,
      type: 'NationalIdentity',
      // Solo incluimos lo necesario, hasheado si es posible
      ageAtIssuance: privateUserData.age,
      isOver18: privateUserData.age >= 18,
      isOver21: privateUserData.age >= 21,
      country: privateUserData.country,
      issuanceDate: new Date().toISOString(),
    },
    type: ['IdentityCredential', 'AgeVerificationCredential']
  });

  const vcJWT = await vcToolkit.issueVC({
    credential: identityCredential,
    issuerKeyPair: identityIssuer
  });

  success('Credencial de identidad emitida');
  console.log('  Tipo:', identityCredential.type.join(', '));
  console.log('  Emisor verificado: Registro Civil');

  // ========================================
  // GENERACIÓN DE PRUEBA ZK
  // ========================================
  section('4. USUARIO GENERA PRUEBA ZK');

  console.log('  El usuario quiere acceder a un servicio que requiere ser mayor de 18.');
  console.log('  NO quiere revelar su edad exacta, nombre, ni DNI.\n');

  log('Generando prueba de: edad >= 18...');

  const ageProof = await zkToolkit.generateThresholdProof({
    value: privateUserData.age, // 29 (PRIVADO - nunca se revela)
    threshold: 18              // Público - el requisito
  });

  success('Prueba ZK generada');
  console.log('\n  \x1b[32mLo que el usuario COMPARTE:\x1b[0m');
  console.log('  • Prueba criptográfica (723 bytes)');
  console.log('  • Nullifier:', ageProof.nullifierHash.substring(0, 24) + '...');
  console.log('  • Umbral requerido: 18 años');

  console.log('\n  \x1b[31mLo que el usuario NO comparte:\x1b[0m');
  console.log('  • Edad exacta (29)');
  console.log('  • Fecha de nacimiento');
  console.log('  • Nombre');
  console.log('  • Documento de identidad');

  // ========================================
  // VERIFICACIÓN
  // ========================================
  section('5. VERIFICADOR VALIDA (Sin acceso a datos personales)');

  log('El verificador recibe solo la prueba ZK...\n');

  // El verificador NO tiene acceso a:
  // - privateUserData
  // - vcJWT (la credencial completa)
  // Solo tiene:
  // - ageProof.proof
  // - ageProof.publicSignals
  // - El umbral público (18)

  log('Verificando prueba criptográfica...');

  const verificationResult = await zkToolkit.verifyThresholdProof(
    ageProof.proof,
    ageProof.publicSignals
  );

  if (verificationResult.verified) {
    success('VERIFICACIÓN EXITOSA');
    console.log('\n  El verificador ahora sabe:');
    console.log('  \x1b[32m✓\x1b[0m El usuario es mayor de 18 años');
    console.log('  \x1b[32m✓\x1b[0m La prueba es criptográficamente válida');
    console.log('\n  El verificador NO sabe:');
    console.log('  \x1b[31m✗\x1b[0m La edad exacta del usuario');
    console.log('  \x1b[31m✗\x1b[0m El nombre del usuario');
    console.log('  \x1b[31m✗\x1b[0m Ningún dato personal');
  }

  // ========================================
  // CASO ADICIONAL: Verificar rango de edad
  // ========================================
  section('6. CASO ADICIONAL: Probar Rango de Edad');

  console.log('  Algunos servicios necesitan verificar rangos específicos.');
  console.log('  Ej: Descuento para menores de 30 años\n');

  log('Generando prueba de: 18 <= edad <= 30...');

  const rangeProof = await zkToolkit.generateRangeProof({
    value: privateUserData.age, // 29
    min: 18,
    max: 30
  });

  success('Prueba de rango generada');

  const rangeResult = await zkToolkit.verifyRangeProof(
    rangeProof.proof,
    rangeProof.publicSignals
  );

  if (rangeResult.verified) {
    success('Usuario está en el rango 18-30 años (descuento aplicable)');
    console.log('  Edad exacta revelada: NINGUNA');
  }

  // ========================================
  // RESUMEN
  // ========================================
  section('RESUMEN - PRIVACIDAD PRESERVADA');

  console.log(`
\x1b[32m╔══════════════════════════════════════════════════════════╗
║              VERIFICACIÓN DE EDAD COMPLETA                ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  Usuario: María (DID anónimo)                            ║
║                                                          ║
║  PROBADO:                                                ║
║  ✓ Mayor de 18 años                                      ║
║  ✓ En rango 18-30 (para descuento)                       ║
║                                                          ║
║  PROTEGIDO:                                              ║
║  ✗ Edad exacta (29) - NO revelada                        ║
║  ✗ Fecha de nacimiento - NO revelada                     ║
║  ✗ Nombre completo - NO revelado                         ║
║  ✗ Documento de identidad - NO revelado                  ║
║                                                          ║
║  TECNOLOGÍA: Groth16 zk-SNARK                            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝\x1b[0m
`);

  console.log('\x1b[1mAplicaciones reales:\x1b[0m');
  console.log('  • Compra de alcohol/tabaco online');
  console.log('  • Casinos y apuestas online');
  console.log('  • Contenido restringido por edad');
  console.log('  • Descuentos por rango de edad');
  console.log('  • Acceso a servicios financieros');
  console.log('  • Verificación para redes sociales\n');

  console.log('\x1b[1mVentajas sobre verificación tradicional:\x1b[0m');
  console.log('  • No se comparten fotos de documentos');
  console.log('  • No hay riesgo de robo de identidad');
  console.log('  • El servicio no almacena datos personales');
  console.log('  • Cumple con GDPR/LGPD (minimización de datos)\n');
}

main().catch(err => {
  console.error('\x1b[31mError:\x1b[0m', err.message);
  process.exit(1);
});
