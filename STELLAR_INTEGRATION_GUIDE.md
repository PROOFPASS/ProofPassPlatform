# Gu\u00eda de Integraci\u00f3n con Stellar Testnet
## ProofPass Platform

**Fecha**: 13 de Noviembre, 2025
**Versi\u00f3n**: v0.1.0
**Prop\u00f3sito**: Generar evidencias de pruebas y pasaportes en Stellar testnet

---

## Resumen

Esta gu\u00eda proporciona instrucciones paso a paso para ejecutar la integraci\u00f3n completa con Stellar testnet y generar evidencias verificables de:

- ✅ Creaci\u00f3n de Verifiable Credentials (VCs)
- ✅ Generaci\u00f3n de Zero-Knowledge Proofs (ZKPs)
- ✅ Creaci\u00f3n de Product Passports
- ✅ Anclaje en blockchain (Stellar testnet)
- ✅ Verificaci\u00f3n de credentials y passports
- ✅ Evidencias con transaction hashes y links a explorer

---

## Estado Actual de Verificaci\u00f3n

### ✅ Completado

1. **Profesionalizaci\u00f3n del Proyecto**
   - 163 emojis eliminados de 26 archivos
   - 12 nuevos archivos de proyecto est\u00e1ndar creados
   - 21 archivos professionalizados
   - 6,200+ l\u00edneas de documentaci\u00f3n agregadas
   - 7 plantillas de GitHub creadas

2. **Configuraci\u00f3n de ESLint**
   - Error de dependencia circular corregido
   - Configuraci\u00f3n simplificada y funcional

3. **Verificaci\u00f3n de Estructura**
   - 174 archivos TypeScript identificados
   - Paquetes existentes verificados (9 paquetes total)
   - Configuraci\u00f3n de Stellar testnet presente en .env
   - Scripts de verificaci\u00f3n creados

4. **Docker**
   - Docker instalado (v20.10.24)
   - Nota: Daemon no est\u00e1 corriendo actualmente

### 🔄 En Progreso / Pendiente

1. **Compilaci\u00f3n de Paquetes**
   - Los paquetes toman tiempo considerable para compilar (174 archivos TS)
   - Algunos paquetes ya est\u00e1n compilados (blockchain, client, etc.)
   - Paquete stellar-sdk necesita ser compilado antes de ejecutar setup

2. **Tests**
   - Jest configurado correctamente
   - Tests disponibles pero no ejecutados completamente a\u00fan

3. **Integraci\u00f3n con Stellar Testnet**
   - Scripts creados y listos
   - Pendiente de ejecuci\u00f3n tras compilaci\u00f3n

---

## Prerequisitos

### 1. Compilar Todos los Paquetes

Antes de ejecutar la integraci\u00f3n con Stellar, aseg\u00farate de que todos los paquetes est\u00e9n compilados:

```bash
# Compilar todos los paquetes (esto puede tomar varios minutos)
npm run build:packages

# O compilar individualmente si es necesario
cd packages/stellar-sdk && npm run build
cd packages/types && npm run build
cd packages/vc-toolkit && npm run build
cd packages/blockchain && npm run build
cd packages/client && npm run build
cd packages/templates && npm run build
cd packages/qr-toolkit && npm run build
```

### 2. Verificar Configuraci\u00f3n de Stellar

Verifica que el archivo `apps/api/.env` tenga la configuraci\u00f3n correcta:

```bash
# Verificar configuraci\u00f3n actual
grep STELLAR apps/api/.env
```

Deber\u00edas ver:
```
STELLAR_NETWORK=testnet
STELLAR_SECRET_KEY=
STELLAR_PUBLIC_KEY=
```

---

## Paso 1: Setup de Cuenta Stellar Testnet

### Opci\u00f3n A: Usando el Script Autom\u00e1tico

```bash
# Ejecutar setup de Stellar
npm run setup:stellar
```

Este script:
- Crea una nueva cuenta en Stellar testnet
- Solicita fondos del faucet de testnet (10,000 XLM)
- Muestra las claves p\u00fablica y secreta
- Verifica el balance de la cuenta

**Output esperado:**
```
[INFO] Creating Stellar testnet account...

[SUCCESS] Account created successfully!

Public Key (STELLAR_PUBLIC_KEY):
GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

Secret Key (STELLAR_SECRET_KEY):
SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

[WARNING] IMPORTANT: Save these keys securely!
[WARNING] Add them to your .env file

Testing account...
[OK] Account balance: 10000.0000000 XLM
```

### Opci\u00f3n B: Manual

Si el script autom\u00e1tico falla, puedes crear la cuenta manualmente:

1. Visita: https://laboratory.stellar.org/#account-creator?network=test
2. Haz clic en "Generate keypair"
3. Copia las claves
4. Haz clic en "Fund with Friendbot" para obtener XLM de testnet
5. Actualiza el archivo `apps/api/.env` con las claves

### Actualizar .env con las Claves

```bash
# Editar .env manualmente o usar sed
sed -i '' 's/STELLAR_PUBLIC_KEY=.*/STELLAR_PUBLIC_KEY=TU_CLAVE_PUBLICA/' apps/api/.env
sed -i '' 's/STELLAR_SECRET_KEY=.*/STELLAR_SECRET_KEY=TU_CLAVE_SECRETA/' apps/api/.env
```

---

## Paso 2: Ejecutar Test de Integraci\u00f3n Completo

### Script Autom\u00e1tico con Evidencias

Hemos creado un script que ejecuta todo el flujo de integraci\u00f3n y recolecta evidencias autom\u00e1ticamente:

```bash
# Dar permisos de ejecuci\u00f3n (ya aplicado)
chmod +x scripts/test-stellar-integration.sh

# Ejecutar test de integraci\u00f3n
./scripts/test-stellar-integration.sh
```

### Qu\u00e9 Hace Este Script

El script `test-stellar-integration.sh` ejecuta autom\u00e1ticamente:

1. **Verificaci\u00f3n de Configuraci\u00f3n**
   - Verifica que .env existe
   - Valida configuraci\u00f3n de Stellar testnet

2. **Setup de Stellar** (si es necesario)
   - Ejecuta npm run setup:stellar

3. **Inicio de API Server** (si no est\u00e1 corriendo)
   - Inicia el servidor API en background
   - Espera a que est\u00e9 listo (health check)

4. **Ejecuci\u00f3n de Demo Completo**
   - Crea Verifiable Credentials
   - Genera Zero-Knowledge Proofs
   - Crea Product Passports
   - Ancla en Stellar testnet
   - Verifica todo el flujo

5. **Recolecci\u00f3n de Evidencias**
   - Extrae transaction hashes
   - Extrae credential IDs
   - Extrae passport IDs
   - Genera links a Stellar Explorer
   - Captura logs completos

6. **Generaci\u00f3n de Reporte**
   - Crea reporte markdown completo
   - Incluye todos los hashes y IDs
   - Links para verificaci\u00f3n en blockchain

### Output Esperado

El script crear\u00e1 un directorio con evidencias:

```
stellar-test-evidence-YYYYMMDD_HHMMSS/
├── 01-config.txt
├── 02-stellar-setup.log
├── 03-api-server.log
├── 03-api-health.json
├── 04-demo-output.log
├── 05-transaction-hashes.txt
├── 06-credential-ids.txt
├── 07-passport-ids.txt
├── 08-stellar-explorer-links.txt
└── EVIDENCE_REPORT.md
```

---

## Paso 3: Verificar Evidencias en Blockchain

### Ver Transaction Hashes

```bash
# Ver los hashes de las transacciones
cat stellar-test-evidence-*/05-transaction-hashes.txt
```

### Ver Links de Stellar Explorer

```bash
# Ver los links directos al explorer
cat stellar-test-evidence-*/08-stellar-explorer-links.txt
```

Ejemplo de link:
```
https://stellar.expert/explorer/testnet/tx/abc123...
```

### Verificar en Stellar Expert

1. Abre los links del archivo `08-stellar-explorer-links.txt`
2. Ver\u00e1s la transacci\u00f3n en el explorer con:
   - Timestamp
   - Transaction hash
   - Source account
   - Operations realizadas
   - Memo (contiene el hash del credential/passport)
   - Estado (success/failed)

---

## Paso 4: Ejecutar Demo Manualmente (Alternativa)

Si prefieres ejecutar el demo paso a paso:

### Preparar Demo Client

```bash
cd examples/demo-client
npm install
```

### Ejecutar Pasos Individuales

```bash
# 1. Crear Verifiable Credential
npm run create:vc

# 2. Generar Zero-Knowledge Proof
npm run generate:zkp

# 3. Crear Product Passport
npm run create:passport

# 4. Verificar Todo
npm run verify:all
```

### O Ejecutar Todo de Una Vez

```bash
# Ejecutar flujo completo
npm run demo
```

---

## Evidencias Requeridas

Para demostrar que la integraci\u00f3n con Stellar testnet funciona correctamente, necesitas mostrar:

### 1. Transaction Hashes ✅

Los hashes de las transacciones en Stellar testnet que prueban que se anclaron datos en blockchain.

**Ubicaci\u00f3n**: `stellar-test-evidence-*/05-transaction-hashes.txt`

**Ejemplo**:
```
Transaction Hash: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f
```

### 2. Credential IDs ✅

Los IDs \u00fanicos de los Verifiable Credentials creados.

**Ubicaci\u00f3n**: `stellar-test-evidence-*/06-credential-ids.txt`

**Ejemplo**:
```
Credential ID: vc:proofpass:12345678-1234-1234-1234-123456789012
```

### 3. Passport IDs ✅

Los IDs \u00fanicos de los Product Passports creados.

**Ubicaci\u00f3n**: `stellar-test-evidence-*/07-passport-ids.txt`

**Ejemplo**:
```
Passport ID: pp:proofpass:98765432-9876-9876-9876-987654321098
```

### 4. Stellar Explorer Links ✅

Links directos a Stellar Expert que muestran las transacciones verificadas.

**Ubicaci\u00f3n**: `stellar-test-evidence-*/08-stellar-explorer-links.txt`

**Ejemplo**:
```
https://stellar.expert/explorer/testnet/tx/1a2b3c4d...
```

### 5. Logs Completos ✅

Output completo de la ejecuci\u00f3n del demo.

**Ubicaci\u00f3n**: `stellar-test-evidence-*/04-demo-output.log`

### 6. Reporte de Evidencias ✅

Reporte markdown con resumen completo.

**Ubicaci\u00f3n**: `stellar-test-evidence-*/EVIDENCE_REPORT.md`

---

## Troubleshooting

### Error: "Cannot find module stellar-sdk"

**Causa**: El paquete stellar-sdk no est\u00e1 compilado.

**Soluci\u00f3n**:
```bash
cd packages/stellar-sdk
npm run build
cd ../..
```

### Error: "Docker daemon not running"

**Causa**: Docker Desktop no est\u00e1 iniciado.

**Soluci\u00f3n**:
- Inicia Docker Desktop
- O ejecuta sin Docker (el demo funciona sin Docker)

### Error: "API server not responding"

**Causa**: El servidor API no est\u00e1 corriendo o no est\u00e1 listo.

**Soluci\u00f3n**:
```bash
# Iniciar API manualmente
cd apps/api
npm run dev

# En otra terminal, ejecutar el demo
cd examples/demo-client
npm run demo
```

### Error: "Stellar account not configured"

**Causa**: Las claves de Stellar no est\u00e1n configuradas en .env

**Soluci\u00f3n**:
```bash
# Ejecutar setup
npm run setup:stellar

# Actualizar .env con las claves generadas
```

### Error: "Transaction failed"

**Causa**: Posibles problemas:
- Cuenta sin fondos
- Network down
- Invalid memo format

**Soluci\u00f3n**:
1. Verificar balance: `npm run setup:stellar` para ver balance
2. Si balance es 0, volver a fundar con Friendbot
3. Verificar que STELLAR_NETWORK=testnet en .env

---

## Verificaci\u00f3n de Evidencias

### Checklist de Verificaci\u00f3n

Usar este checklist para verificar que todas las evidencias fueron generadas:

- [ ] Script `test-stellar-integration.sh` ejecutado exitosamente
- [ ] Directorio de evidencias creado con timestamp
- [ ] Archivo `01-config.txt` existe y muestra testnet
- [ ] Archivo `02-stellar-setup.log` muestra setup exitoso
- [ ] Archivo `04-demo-output.log` contiene output completo del demo
- [ ] Archivo `05-transaction-hashes.txt` contiene al menos 1 hash
- [ ] Archivo `06-credential-ids.txt` contiene IDs de credentials
- [ ] Archivo `07-passport-ids.txt` contiene IDs de passports
- [ ] Archivo `08-stellar-explorer-links.txt` contiene links v\u00e1lidos
- [ ] Archivo `EVIDENCE_REPORT.md` generado con resumen completo
- [ ] Links de Stellar Explorer abren correctamente
- [ ] Transacciones muestran estado "success" en explorer
- [ ] Memos de transacciones contienen hashes de credentials/passports

### Validaci\u00f3n en Blockchain

Para cada transaction hash en `05-transaction-hashes.txt`:

1. **Abrir en Stellar Expert**: Usar link de `08-stellar-explorer-links.txt`
2. **Verificar Status**: Debe mostrar "success"
3. **Verificar Timestamp**: Debe coincidir con fecha de ejecuci\u00f3n
4. **Verificar Memo**: Debe contener hash del credential/passport
5. **Verificar Source Account**: Debe ser tu cuenta (STELLAR_PUBLIC_KEY)

### Formato de Reporte Final

Al terminar, deber\u00edas tener un reporte como este:

```markdown
# Evidencia de Integraci\u00f3n Stellar Testnet

## Fecha de Ejecuci\u00f3n
2025-11-13 22:45:00 UTC

## Transacciones en Blockchain

### Transacci\u00f3n 1: Credential Anchoring
- **Hash**: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f
- **Explorer**: https://stellar.expert/explorer/testnet/tx/1a2b3c4d...
- **Status**: SUCCESS
- **Credential ID**: vc:proofpass:12345678-1234-1234-1234-123456789012

### Transacci\u00f3n 2: Passport Anchoring
- **Hash**: 9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g9f8e7d6c5b4a3210fedcba98
- **Explorer**: https://stellar.expert/explorer/testnet/tx/9z8y7x6w...
- **Status**: SUCCESS
- **Passport ID**: pp:proofpass:98765432-9876-9876-9876-987654321098

## Verificaci\u00f3n
✅ Todos los credentials fueron creados exitosamente
✅ Todos los ZK proofs fueron generados correctamente
✅ Todos los passports fueron creados
✅ Todas las transacciones fueron ancladas en Stellar testnet
✅ Todas las verificaciones pasaron
```

---

## Comandos R\u00e1pidos de Referencia

```bash
# Setup completo
npm run build:packages
npm run setup:stellar

# Ejecutar test de integraci\u00f3n con evidencias
./scripts/test-stellar-integration.sh

# Ver evidencias generadas
ls -la stellar-test-evidence-*/
cat stellar-test-evidence-*/EVIDENCE_REPORT.md

# Ver transaction hashes
cat stellar-test-evidence-*/05-transaction-hashes.txt

# Ver links de explorer
cat stellar-test-evidence-*/08-stellar-explorer-links.txt

# Ejecutar demo manualmente
cd examples/demo-client
npm install
npm run demo
```

---

## Siguientes Pasos

Despu\u00e9s de generar las evidencias exitosamente:

1. **Archivar Evidencias**
   - Guardar el directorio `stellar-test-evidence-*` en lugar seguro
   - Hacer backup del reporte de evidencias

2. **Compartir Evidencias**
   - Compartir links de Stellar Explorer
   - Compartir transaction hashes
   - Compartir `EVIDENCE_REPORT.md`

3. **Verificaci\u00f3n Externa**
   - Cualquier persona puede verificar los hashes en Stellar Explorer
   - Las transacciones son p\u00fablicas y permanentes en testnet

4. **Deployment a Mainnet**
   - Una vez verificado en testnet, seguir gu\u00eda `PRODUCTION_READINESS.md`
   - Cambiar `STELLAR_NETWORK=mainnet` en .env
   - Usar cuenta de mainnet con fondos reales

---

## Documentaci\u00f3n Relacionada

- **VERIFICATION_REPORT.md** - Reporte completo de verificaci\u00f3n post-professionalizaci\u00f3n
- **VERIFICATION_PLAN.md** - Plan de verificaci\u00f3n con checklist completo
- **PRODUCTION_READINESS.md** - Gu\u00eda de deployment a producci\u00f3n (70+ items)
- **DEVELOPMENT.md** - Gu\u00eda de desarrollo local
- **EXECUTIVE_SUMMARY.md** - Resumen ejecutivo del proyecto

---

## Soporte

Para problemas o preguntas:
- **Email**: fboiero@frvm.utn.edu.ar
- **Issues**: GitHub Issues (ver CONTRIBUTING.md)
- **Documentaci\u00f3n**: Ver carpeta `docs/`

---

**\u00daltima Actualizaci\u00f3n**: 13 de Noviembre, 2025
**Autor**: Claude AI Assistant (Anthropic)
**Proyecto**: ProofPass Platform v0.1.0
