# Quick Start: Stellar Testnet Integration
## Comandos Simples para Generar Evidencias

**Fecha**: 13 de Noviembre, 2025
**Objetivo**: Generar evidencias de credentials y passports en Stellar testnet

---

## ⚡ Inicio Rápido (3 Comandos)

### 1. Setup de Stellar Testnet

```bash
# Este comando crea una cuenta en Stellar testnet y muestra las claves
npm run setup:stellar
```

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

**Acción requerida**: Copia las claves y agrégalas al archivo `apps/api/.env`:

```bash
# Editar .env manualmente o usar estos comandos (reemplaza con tus claves reales)
sed -i '' 's/STELLAR_PUBLIC_KEY=.*/STELLAR_PUBLIC_KEY=TU_CLAVE_PUBLICA_AQUI/' apps/api/.env
sed -i '' 's/STELLAR_SECRET_KEY=.*/STELLAR_SECRET_KEY=TU_CLAVE_SECRETA_AQUI/' apps/api/.env
```

---

### 2. Ejecutar Demo y Generar Evidencias

```bash
# Este comando ejecuta todo el flujo y genera evidencias automáticamente
./scripts/test-stellar-integration.sh
```

**Este script hace TODO automáticamente:**
- ✅ Verifica configuración
- ✅ Inicia API server (si es necesario)
- ✅ Crea Verifiable Credentials
- ✅ Genera Zero-Knowledge Proofs
- ✅ Crea Product Passports
- ✅ Ancla en Stellar testnet
- ✅ Verifica todo
- ✅ **Genera evidencias completas**

---

### 3. Ver Evidencias Generadas

```bash
# Ver el directorio de evidencias creado
ls -la stellar-test-evidence-*/

# Ver el reporte completo
cat stellar-test-evidence-*/EVIDENCE_REPORT.md

# Ver transaction hashes de blockchain
cat stellar-test-evidence-*/05-transaction-hashes.txt

# Ver links de Stellar Explorer (para verificar en blockchain)
cat stellar-test-evidence-*/08-stellar-explorer-links.txt
```

---

## 🔧 Si Hay Problemas de Compilación

### Problema: "Cannot find module"

**Solución**: Compilar paquetes primero

```bash
# Compilar todos los paquetes (puede tomar varios minutos)
npm run build:packages

# O compilar solo stellar-sdk
cd packages/stellar-sdk && npm run build && cd ../..
```

### Problema: "API not running"

**Solución**: Iniciar API manualmente en otra terminal

```bash
# Terminal 1: Iniciar API
cd apps/api
npm run dev

# Terminal 2: Ejecutar test de integración
./scripts/test-stellar-integration.sh
```

### Problema: "Docker daemon not running"

**Solución**: No te preocupes, Docker NO es necesario para Stellar testnet.
El demo funciona perfectamente sin Docker.

---

## 📦 Alternativa: Ejecutar Demo Manualmente

Si el script automático falla, puedes ejecutar el demo paso a paso:

### Paso 1: Preparar Demo Client

```bash
cd examples/demo-client
npm install
```

### Paso 2: Asegurarse que API está corriendo

```bash
# En otra terminal
cd apps/api
npm run dev
```

### Paso 3: Ejecutar Demo Completo

```bash
# Ejecuta todo el flujo: VC → ZKP → Passport → Anchoring → Verification
npm run demo
```

**Output contendrá:**
- Transaction hashes
- Credential IDs
- Passport IDs
- Status de verificaciones

### Paso 4: Guardar Output como Evidencia

```bash
# Ejecutar y guardar output
npm run demo > ../evidence-$(date +%Y%m%d_%H%M%S).log 2>&1
cat ../evidence-*.log
```

---

## 📋 Evidencias que Necesitas Compartir

### 1. Transaction Hashes ⭐
Los hashes que prueban que los datos están en Stellar blockchain.

**Dónde encontrarlos**:
- En el output del demo: busca líneas que digan "Transaction Hash:"
- En `stellar-test-evidence-*/05-transaction-hashes.txt`

**Ejemplo**:
```
Transaction Hash: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f
```

### 2. Stellar Explorer Links ⭐
Links para verificar las transacciones en blockchain públicamente.

**Dónde encontrarlos**:
- En `stellar-test-evidence-*/08-stellar-explorer-links.txt`

**Ejemplo**:
```
https://stellar.expert/explorer/testnet/tx/1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f
```

Estos links son públicos y cualquiera puede verificar la transacción.

### 3. Credential IDs
IDs de los Verifiable Credentials creados.

**Dónde encontrarlos**:
- En el output del demo
- En `stellar-test-evidence-*/06-credential-ids.txt`

### 4. Passport IDs
IDs de los Product Passports creados.

**Dónde encontrarlos**:
- En el output del demo
- En `stellar-test-evidence-*/07-passport-ids.txt`

---

## ✅ Verificación de Éxito

### Cómo saber que funcionó correctamente

1. **Setup de Stellar exitoso**:
   - ✅ Viste las claves pública y privada
   - ✅ El balance mostró 10000 XLM

2. **Demo completó sin errores**:
   - ✅ Viste "[SUCCESS]" en varios pasos
   - ✅ No hay mensajes "[ERROR]" al final
   - ✅ Viste "Transaction Hash:" al menos una vez

3. **Evidencias generadas**:
   - ✅ Existe directorio `stellar-test-evidence-*`
   - ✅ Archivos de evidencias tienen contenido (no están vacíos)
   - ✅ Links de Stellar Explorer abren correctamente

4. **Verificación en blockchain**:
   - ✅ Links de Stellar Explorer muestran transacciones
   - ✅ Status de transacción es "success"
   - ✅ Timestamp coincide con tu ejecución

---

## 🚀 Comando TODO-EN-UNO

Si quieres ejecutar todo de una vez (después del setup de Stellar):

```bash
# Este comando ejecuta el test completo y muestra las evidencias al final
./scripts/test-stellar-integration.sh && \
echo -e "\n\n=== EVIDENCIAS GENERADAS ===\n" && \
cat stellar-test-evidence-*/EVIDENCE_REPORT.md && \
echo -e "\n\n=== STELLAR EXPLORER LINKS ===\n" && \
cat stellar-test-evidence-*/08-stellar-explorer-links.txt
```

---

## 📚 Documentación Completa

Para más detalles, consulta:

- **STELLAR_INTEGRATION_GUIDE.md** - Guía completa paso a paso
- **FINAL_VERIFICATION_SUMMARY.md** - Resumen de todo lo logrado
- **VERIFICATION_REPORT.md** - Estado completo de verificación
- **PRODUCTION_READINESS.md** - Guía de deployment a producción

---

## 🆘 Soporte

Si necesitas ayuda:

1. **Revisa los logs**: Los archivos `.log` contienen información detallada
2. **Verifica .env**: Asegúrate que las claves de Stellar estén configuradas
3. **Revisa la documentación**: Los archivos .md tienen troubleshooting detallado
4. **Contacto**: fboiero@frvm.utn.edu.ar

---

## 📊 Checklist Rápido

Usa este checklist para asegurarte de completar todo:

- [ ] Ejecuté `npm run setup:stellar`
- [ ] Copié las claves al archivo `.env`
- [ ] Ejecuté `./scripts/test-stellar-integration.sh`
- [ ] Revisé que no hubo errores
- [ ] Verifiqué que se creó el directorio de evidencias
- [ ] Revisé el reporte: `cat stellar-test-evidence-*/EVIDENCE_REPORT.md`
- [ ] Obtuve los transaction hashes: `cat stellar-test-evidence-*/05-transaction-hashes.txt`
- [ ] Obtuve los links de explorer: `cat stellar-test-evidence-*/08-stellar-explorer-links.txt`
- [ ] Abrí los links y verifiqué las transacciones en Stellar Explorer
- [ ] Las transacciones muestran estado "success"
- [ ] Guardé las evidencias en lugar seguro

---

## 🎯 Resumen

**3 comandos principales:**
```bash
# 1. Setup
npm run setup:stellar

# 2. Ejecutar (genera evidencias automáticamente)
./scripts/test-stellar-integration.sh

# 3. Ver evidencias
cat stellar-test-evidence-*/08-stellar-explorer-links.txt
```

**Eso es todo!** 🎉

Las evidencias se generan automáticamente y las puedes compartir para demostrar que los credentials y passports fueron anclados exitosamente en Stellar testnet.

---

**Creado**: 13 de Noviembre, 2025
**Versión**: Quick Start v1.0
**Proyecto**: ProofPass Platform v0.1.0
