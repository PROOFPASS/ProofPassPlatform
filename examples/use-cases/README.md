# Casos de Uso - ProofPass Platform

Ejemplos prácticos que demuestran cómo usar ProofPass en escenarios reales.

## Ejecutar los Ejemplos

Cada ejemplo es independiente y no requiere API ni base de datos.

```bash
# Desde la raíz del proyecto
npm install
npm run build:packages

# Ejecutar ejemplos
node examples/use-cases/1-product-certification.js
node examples/use-cases/2-age-verification.js
node examples/use-cases/3-supply-chain.js
```

## Casos de Uso Disponibles

### 1. Certificación de Productos (`1-product-certification.js`)

**Escenario**: Una empresa textil quiere certificar que sus productos son orgánicos y cumplen estándares de sostenibilidad.

**Demuestra**:
- Crear credenciales de certificación W3C
- Generar pruebas ZK de cumplimiento (sin revelar métricas exactas)
- Verificación por terceros

**Actores**: Certificador (GOTS), Fabricante, Verificador

---

### 2. Verificación de Edad (`2-age-verification.js`)

**Escenario**: Un servicio necesita verificar que un usuario es mayor de 18 años sin conocer su edad exacta ni datos personales.

**Demuestra**:
- Credenciales de identidad
- Pruebas ZK de umbral (edad >= 18)
- Pruebas ZK de rango (18 <= edad <= 30)
- Privacidad total para el usuario

**Actores**: Emisor de identidad (gobierno), Usuario, Verificador (servicio online)

**Aplicaciones**:
- E-commerce de alcohol/tabaco
- Casinos online
- Redes sociales
- Servicios financieros

---

### 3. Trazabilidad Supply Chain (`3-supply-chain.js`)

**Escenario**: Rastrear un producto desde su origen hasta el consumidor final, con cada actor de la cadena agregando su certificación.

**Demuestra**:
- Múltiples credenciales de diferentes actores
- Digital Product Passport (EU DPP)
- Cadena de custodia verificable
- Pruebas ZK de sostenibilidad

**Actores**: Granja, Procesadora, Fabricante, Logística, Minorista

**Cumple con**:
- EU Digital Product Passport Regulation
- GDPR (minimización de datos)
- ESG Reporting

---

## Estructura de los Ejemplos

Cada ejemplo sigue el mismo patrón:

```
1. Crear identidades (DIDs) para los actores
2. Emitir credenciales verificables (W3C VC)
3. Generar pruebas zero-knowledge si aplica
4. Verificar todo criptográficamente
5. Mostrar resultado y aplicaciones
```

## Tecnologías Utilizadas

| Tecnología | Uso |
|------------|-----|
| **did:key** | Identidades descentralizadas |
| **W3C VC** | Credenciales verificables |
| **Ed25519** | Firmas digitales |
| **Groth16 zk-SNARK** | Pruebas zero-knowledge |
| **Status List 2021** | Revocación de credenciales |

## Próximos Pasos

Después de entender los casos de uso:

1. **Integrar en tu app**: Ver `node setup.js` → opción 2
2. **Desarrollo local**: Ver `node setup.js` → opción 3
3. **API Reference**: `docs/API_REFERENCE.md`
4. **Arquitectura técnica**: `docs/architecture/TECHNICAL_ARCHITECTURE.md`

## Contribuir Nuevos Casos de Uso

¿Tienes un caso de uso interesante? Contribuye siguiendo el patrón de los ejemplos existentes. Ver `CONTRIBUTING.md` para guías de contribución.
