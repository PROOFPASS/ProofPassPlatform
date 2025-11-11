# Guía Rápida - Demo Blockchain

Esta guía te permite probar la funcionalidad de blockchain de ProofPass en **menos de 5 minutos** sin necesidad de configurar base de datos ni backend completo.

## 🚀 Demo Standalone (La forma más rápida)

### 1. Levantar el servidor demo

```bash
cd ProofPassPlatform
node scripts/serve-demo.js
```

### 2. Abrir en el navegador

Abre: **http://localhost:8080/blockchain-demo.html**

### 3. ¡Listo! Ya puedes:

✅ **Crear una cuenta de testnet**
- Clic en "Crear Nueva" para generar una cuenta con 10,000 XLM de prueba

✅ **Explorar cuentas**
- Ingresa cualquier dirección pública de Stellar testnet para ver su balance

✅ **Ver transacciones**
- Consulta el historial de transacciones de cualquier cuenta

✅ **Anclar datos en blockchain**
- Guarda el hash de tus datos en Stellar testnet

✅ **Verificar datos**
- Comprueba que los datos corresponden a una transacción específica

## 📋 Funcionalidades de la Demo

### Crear Cuenta Nueva
1. Ve a la pestaña "Cuenta"
2. Clic en "✨ Crear Nueva"
3. La demo generará credenciales y las financiará automáticamente
4. **Guarda la clave secreta** si quieres anclar datos

### Anclar Datos
1. Ve a la pestaña "Anclar Datos"
2. Ingresa tu clave secreta (de la cuenta que creaste)
3. Escribe los datos que quieres anclar
4. Clic en "⚓ Anclar"
5. La transacción se creará y el hash se guardará en blockchain

### Verificar Datos
1. Ve a la pestaña "Verificar"
2. Ingresa el hash de la transacción
3. Ingresa los datos originales
4. Clic en "✔️ Verificar"
5. La demo verificará que el hash coincida

## 🔗 Enlaces Útiles en la Demo

- **Stellar Expert Explorer**: Para ver detalles de transacciones y cuentas
- **Friendbot**: Para obtener más XLM de prueba si lo necesitas
- **Documentación Stellar**: Para aprender más sobre la blockchain

## 💡 Casos de Uso de Ejemplo

### 1. Certificación de Producto
```
Datos a anclar: "Certificación Orgánica - Producto #12345 - USDA Organic - 2024-10-30"
```

### 2. Firma de Documento
```
Datos a anclar: "Contrato_V1_Firmado_2024-10-30_Hash:abc123..."
```

### 3. Proof of Existence
```
Datos a anclar: "Patent_Application_2024_Invento_XYZ"
```

## 🏗️ Arquitectura de la Demo

```
┌─────────────────┐
│   Tu Navegador  │
│   (JavaScript)  │
└────────┬────────┘
         │
         │ Stellar SDK
         │ (Direct Connection)
         │
         ▼
┌─────────────────┐
│  Stellar Horizon│
│   API Testnet   │
└─────────────────┘
```

La demo se conecta **directamente** a Stellar Horizon testnet, sin necesidad de tu propio backend. Esto es perfecto para:
- Demos rápidas
- Pruebas de concepto
- Aprender cómo funciona Stellar

## 📦 Integrar en Tu Aplicación

Si quieres integrar esto en tu propia aplicación, usa el backend API:

### Paso 1: Levantar servicios

```bash
# Iniciar Docker
docker-compose up -d

# O si usas servicios locales
# PostgreSQL en puerto 5432
# Redis en puerto 6379
```

### Paso 2: Configurar credenciales

```bash
# Opción A: Usar el script (si funciona)
npm run setup:stellar

# Opción B: Crear manualmente en https://laboratory.stellar.org/
# Y agregar a .env:
STELLAR_PUBLIC_KEY=G...
STELLAR_SECRET_KEY=S...
```

### Paso 3: Iniciar el API

```bash
cd apps/api
npm run dev
```

El API estará en: http://localhost:3000

### Paso 4: Probar los endpoints

```bash
# Obtener info de blockchain
curl http://localhost:3000/api/v1/blockchain/info

# Anclar datos (requiere JWT token)
curl -X POST http://localhost:3000/api/v1/blockchain/anchor \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data":"Mi certificación"}'

# Verificar datos (público)
curl -X POST http://localhost:3000/api/v1/blockchain/verify \
  -H "Content-Type: application/json" \
  -d '{"txHash":"HASH","data":"Mi certificación"}'
```

### Paso 5: Ver documentación interactiva

Abre: http://localhost:3000/docs

## 🎯 Próximos Pasos

1. **Prueba la demo** - Familiarízate con las operaciones
2. **Lee la documentación** - `docs/BLOCKCHAIN_API.md`
3. **Levanta el backend completo** - Sigue los pasos arriba
4. **Integra en tu app** - Usa los endpoints del API
5. **Personaliza** - Adapta la UI a tus necesidades

## 🔒 Seguridad

⚠️ **IMPORTANTE**:
- Esta demo es **solo para testnet**
- **Nunca** uses claves secretas de mainnet en la web
- Para producción, las claves deben estar en el **backend**
- Los endpoints de escritura deben estar **autenticados**

## 🆘 Troubleshooting

### El servidor no inicia
```bash
# Verifica que el puerto 8080 esté libre
lsof -ti:8080 | xargs kill -9
node scripts/serve-demo.js
```

### "Account not found"
- Asegúrate de usar una dirección de **testnet** (empieza con G)
- La cuenta debe haber sido creada/financiada previamente

### "Transaction failed"
- Verifica que la clave secreta sea correcta
- Asegúrate de tener suficiente balance (mínimo 1 XLM + fees)
- Obtén más XLM en https://friendbot.stellar.org

### Error de conexión
- Verifica tu conexión a internet
- Stellar Horizon testnet debe estar accesible
- Prueba abrir: https://horizon-testnet.stellar.org/

## 📚 Recursos Adicionales

- [Stellar Developers](https://developers.stellar.org)
- [Stellar SDK Documentation](https://stellar.github.io/js-stellar-sdk/)
- [Stellar Laboratory](https://laboratory.stellar.org/)
- [Stellar Expert](https://stellar.expert/explorer/testnet)

## 🤝 Soporte

¿Problemas? Revisa:
1. `docs/BLOCKCHAIN_API.md` - Documentación completa del API
2. `docs/DEPLOYMENT.md` - Guía de despliegue
3. Issues en GitHub

---

**¡Diviértete explorando blockchain con ProofPass! 🚀**
