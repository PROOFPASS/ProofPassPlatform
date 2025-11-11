# @proofpass/qr-toolkit

Generate QR codes for verifiable credential verification following W3C and OpenID4VC standards.

## Standards Compliance

This toolkit supports multiple credential verification standards:

- **W3C VC-HTTP-API** - [Specification](https://w3c-ccg.github.io/vc-http-api/)
- **OpenID for Verifiable Credentials (OpenID4VC)** - [Specification](https://openid.net/specs/openid-4-verifiable-credentials-1_0.html)
- **CHAPI (Credential Handler API)** - [Specification](https://chapi.io/)
- **Deep Links** - Mobile wallet integration
- **Plain HTTP URLs** - Simple verification endpoints

## Installation

```bash
npm install @proofpass/qr-toolkit
```

## Quick Start

```typescript
import { generateQRCode } from '@proofpass/qr-toolkit';

// Generate QR code for credential verification
const qr = await generateQRCode('credential-123', {
  format: 'vc-http-api',
  baseURL: 'https://api.proofpass.com',
  size: 300
});

console.log('QR URL:', qr.url);
console.log('Data URL:', qr.dataURL); // For <img> tags
console.log('SVG:', qr.svg); // SVG markup
```

## URL Formats

### 1. W3C VC-HTTP-API (Default)

Standard HTTP API for verifiable credentials.

```typescript
const qr = await generateQRCode('credential-123', {
  format: 'vc-http-api'
});
// URL: https://api.proofpass.com/credentials/credential-123/verify
```

**Use cases:**
- Standard credential verification endpoints
- RESTful API integrations
- Web-based verifiers

### 2. OpenID4VC

OpenID Connect protocol for verifiable credentials.

```typescript
const qr = await generateQRCode('credential-123', {
  format: 'openid4vc'
});
// URL: openid-vc://?credential_id=credential-123&issuer=https%3A%2F%2Fapi.proofpass.com
```

**Use cases:**
- OpenID-based identity providers
- OAuth2/OIDC integrations
- Enterprise SSO systems

### 3. CHAPI (Credential Handler API)

Browser-based credential handler protocol.

```typescript
const qr = await generateQRCode('credential-123', {
  format: 'chapi'
});
// URL: https://api.proofpass.com/.well-known/vc-handler?credential=credential-123&action=verify
```

**Use cases:**
- Browser-based wallets
- Progressive web apps
- Cross-domain credential sharing

### 4. Deep Links

Mobile wallet deep linking.

```typescript
const qr = await generateQRCode('credential-123', {
  format: 'deeplink'
});
// URL: proofpass://verify/credential-123
```

**Use cases:**
- Native mobile apps
- Mobile wallet integration
- Direct app-to-app verification

### 5. Plain HTTP

Simple HTTP URL for custom implementations.

```typescript
const qr = await generateQRCode('credential-123', {
  format: 'plain'
});
// URL: https://api.proofpass.com/verify/credential-123
```

**Use cases:**
- Custom verification flows
- Simplified integrations
- Legacy systems

## API Reference

### `generateQRCode(credentialId, options?)`

Generate a QR code for credential verification.

**Parameters:**
- `credentialId` (string) - The credential identifier
- `options` (QRCodeOptions) - Configuration options

**Options:**
```typescript
interface QRCodeOptions {
  format?: 'vc-http-api' | 'openid4vc' | 'deeplink' | 'chapi' | 'plain';
  baseURL?: string;               // Default: 'https://api.proofpass.com'
  size?: number;                  // Default: 300
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // Default: 'M'
  color?: {
    dark?: string;                // Default: '#000000'
    light?: string;               // Default: '#FFFFFF'
  };
}
```

**Returns:** `Promise<GenerateQRResult>`
```typescript
interface GenerateQRResult {
  url: string;       // The verification URL
  format: URLFormat; // The format used
  dataURL: string;   // Base64 data URL for <img>
  svg?: string;      // SVG markup
}
```

**Example:**
```typescript
const qr = await generateQRCode('cred-123', {
  format: 'openid4vc',
  size: 400,
  errorCorrectionLevel: 'H',
  color: {
    dark: '#1a1a1a',
    light: '#ffffff'
  }
});

// Use in HTML
document.querySelector('img').src = qr.dataURL;

// Use SVG directly
document.querySelector('.qr-container').innerHTML = qr.svg;
```

### `generateQRBuffer(credentialId, options?)`

Generate QR code as a Buffer (for server-side use).

**Parameters:** Same as `generateQRCode()`

**Returns:** `Promise<Buffer>`

**Example:**
```typescript
import { generateQRBuffer } from '@proofpass/qr-toolkit';

// Express.js endpoint
app.get('/qr/:credentialId', async (req, res) => {
  const buffer = await generateQRBuffer(req.params.credentialId, {
    format: 'vc-http-api',
    size: 300
  });

  res.type('image/png');
  res.send(buffer);
});
```

### `generateMultiFormatQRCodes(credentialId, formats?, baseURL?)`

Generate QR codes in multiple formats at once.

**Parameters:**
- `credentialId` (string) - The credential identifier
- `formats` (URLFormat[]) - Array of formats (default: all formats)
- `baseURL` (string) - Base URL for HTTP formats

**Returns:** `Promise<GenerateQRResult[]>`

**Example:**
```typescript
import { generateMultiFormatQRCodes } from '@proofpass/qr-toolkit';

const qrCodes = await generateMultiFormatQRCodes('cred-123', [
  'vc-http-api',
  'openid4vc',
  'deeplink'
]);

qrCodes.forEach(qr => {
  console.log(`${qr.format}: ${qr.url}`);
});
```

### `parseVerificationURL(url)`

Parse a verification URL to extract credential ID and format.

**Parameters:**
- `url` (string) - The verification URL to parse

**Returns:** `{ credentialId: string | null, format: URLFormat, baseURL: string | null }`

**Example:**
```typescript
import { parseVerificationURL } from '@proofpass/qr-toolkit';

const result = parseVerificationURL('openid-vc://?credential_id=cred-123&issuer=https%3A%2F%2Fapi.proofpass.com');

console.log(result.credentialId); // 'cred-123'
console.log(result.format);       // 'openid4vc'
console.log(result.baseURL);      // 'https://api.proofpass.com'
```

### `isValidVerificationURL(url)`

Check if a URL is a valid verification URL.

**Parameters:**
- `url` (string) - The URL to validate

**Returns:** `boolean`

**Example:**
```typescript
import { isValidVerificationURL } from '@proofpass/qr-toolkit';

isValidVerificationURL('https://api.proofpass.com/credentials/123/verify'); // true
isValidVerificationURL('proofpass://verify/123'); // true
isValidVerificationURL('https://example.com'); // false
```

### `generateVerificationURL(credentialId, format?, baseURL?)`

Generate verification URL without QR code.

**Parameters:**
- `credentialId` (string) - The credential identifier
- `format` (URLFormat) - URL format (default: 'vc-http-api')
- `baseURL` (string) - Base URL (default: 'https://api.proofpass.com')

**Returns:** `string`

**Example:**
```typescript
import { generateVerificationURL } from '@proofpass/qr-toolkit';

const url = generateVerificationURL('cred-123', 'openid4vc');
console.log(url); // openid-vc://?credential_id=cred-123&issuer=...
```

## Advanced Usage

### Custom Styling

```typescript
const qr = await generateQRCode('credential-123', {
  size: 500,
  errorCorrectionLevel: 'H', // Higher error correction for logos
  color: {
    dark: '#2563eb',  // Blue
    light: '#f0f9ff'  // Light blue background
  }
});
```

### Error Correction Levels

- `L` - Low (7% recovery)
- `M` - Medium (15% recovery) - Default
- `Q` - Quartile (25% recovery)
- `H` - High (30% recovery) - Recommended for QR codes with logos

### Integration with ProofPass SDK

```typescript
import ProofPass from '@proofpass/client';
import { generateQRCode } from '@proofpass/qr-toolkit';

const proofpass = new ProofPass('your-api-key');

// Create attestation
const attestation = await proofpass.attestations.create({
  type: 'identity',
  subject: 'did:key:z6Mkf...',
  claims: { firstName: 'Alice', lastName: 'Smith' }
});

// Generate QR code for verification
const qr = await generateQRCode(attestation.id, {
  format: 'vc-http-api'
});

// Display QR code
console.log('Scan this QR code to verify:', qr.dataURL);
```

### React Component Example

```typescript
import { generateQRCode } from '@proofpass/qr-toolkit';
import { useState, useEffect } from 'react';

function CredentialQRCode({ credentialId, format = 'vc-http-api' }) {
  const [qrDataURL, setQrDataURL] = useState('');

  useEffect(() => {
    generateQRCode(credentialId, { format })
      .then(qr => setQrDataURL(qr.dataURL));
  }, [credentialId, format]);

  return qrDataURL ? (
    <img src={qrDataURL} alt="Credential QR Code" />
  ) : (
    <div>Loading QR code...</div>
  );
}
```

### Multi-Format Display

```typescript
import { generateMultiFormatQRCodes } from '@proofpass/qr-toolkit';

async function displayAllFormats(credentialId: string) {
  const qrCodes = await generateMultiFormatQRCodes(credentialId);

  const container = document.getElementById('qr-container');

  qrCodes.forEach(qr => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h3>${qr.format}</h3>
      <img src="${qr.dataURL}" alt="${qr.format} QR Code" />
      <p><code>${qr.url}</code></p>
    `;
    container.appendChild(div);
  });
}
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  URLFormat,
  QRCodeOptions,
  GenerateQRResult
} from '@proofpass/qr-toolkit';

const options: QRCodeOptions = {
  format: 'openid4vc',
  size: 400,
  errorCorrectionLevel: 'H'
};
```

## Error Handling

```typescript
import { generateQRCode, isValidVerificationURL } from '@proofpass/qr-toolkit';

try {
  const qr = await generateQRCode('credential-123', {
    format: 'vc-http-api'
  });

  if (isValidVerificationURL(qr.url)) {
    console.log('Valid QR code generated:', qr.url);
  }
} catch (error) {
  console.error('QR code generation failed:', error);
}
```

## Best Practices

### 1. Choose Appropriate Format

```typescript
// ✅ Good - Use standard formats for interoperability
const webQR = await generateQRCode('cred-123', { format: 'vc-http-api' });
const mobileQR = await generateQRCode('cred-123', { format: 'deeplink' });

// ❌ Avoid - Don't use plain format unless necessary
const plainQR = await generateQRCode('cred-123', { format: 'plain' });
```

### 2. Size Considerations

```typescript
// Small screens (mobile)
const mobileQR = await generateQRCode('cred-123', { size: 250 });

// Desktop/print
const printQR = await generateQRCode('cred-123', { size: 500 });

// Business cards (high error correction)
const cardQR = await generateQRCode('cred-123', {
  size: 300,
  errorCorrectionLevel: 'H'
});
```

### 3. Color and Contrast

```typescript
// ✅ Good - High contrast for readability
const readableQR = await generateQRCode('cred-123', {
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});

// ⚠️ Caution - Lower contrast may affect scanning
const brandedQR = await generateQRCode('cred-123', {
  color: {
    dark: '#0066CC',
    light: '#F0F0F0'
  },
  errorCorrectionLevel: 'H'  // Use higher error correction
});
```

### 4. Caching

```typescript
// Cache QR codes to improve performance
import { generateQRCode } from '@proofpass/qr-toolkit';

const qrCache = new Map<string, string>();

async function getCachedQRCode(credentialId: string): Promise<string> {
  if (qrCache.has(credentialId)) {
    return qrCache.get(credentialId)!;
  }

  const qr = await generateQRCode(credentialId);
  qrCache.set(credentialId, qr.dataURL);

  return qr.dataURL;
}
```

## Security Considerations

### 1. HTTPS Only for HTTP URLs

Always use HTTPS for web-based verification URLs:

```typescript
// ✅ Secure
const qr = await generateQRCode('cred-123', {
  baseURL: 'https://verify.example.com'
});

// ❌ Insecure
const qr = await generateQRCode('cred-123', {
  baseURL: 'http://verify.example.com'  // DON'T DO THIS
});
```

### 2. Validate Scanned URLs

Always validate URLs before processing:

```typescript
import { isValidVerificationURL, parseVerificationURL } from '@proofpass/qr-toolkit';

function handleScannedQR(url: string) {
  // Validate format
  if (!isValidVerificationURL(url)) {
    throw new Error('Invalid QR code format');
  }

  // Parse and verify domain
  const parsed = parseVerificationURL(url);

  if (parsed.baseURL && !parsed.baseURL.startsWith('https://')) {
    throw new Error('Insecure URL detected');
  }

  // Proceed with verification
  return verifyCredential(parsed.credentialId);
}
```

### 3. Rate Limiting

Implement rate limiting for QR code generation endpoints to prevent abuse:

```typescript
// Express.js with rate limiting
import rateLimit from 'express-rate-limit';

const qrLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.get('/qr/:credentialId', qrLimiter, async (req, res) => {
  const buffer = await generateQRBuffer(req.params.credentialId);
  res.type('image/png');
  res.send(buffer);
});
```

## Framework Integration

### Express.js

```typescript
import express from 'express';
import { generateQRBuffer, generateQRCode } from '@proofpass/qr-toolkit';

const app = express();

// PNG endpoint
app.get('/qr/:credentialId.png', async (req, res) => {
  const buffer = await generateQRBuffer(req.params.credentialId, {
    format: req.query.format as any || 'vc-http-api',
    size: parseInt(req.query.size as string) || 300
  });
  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'public, max-age=3600');
  res.send(buffer);
});

// JSON endpoint with data URL
app.get('/qr/:credentialId.json', async (req, res) => {
  const qr = await generateQRCode(req.params.credentialId, {
    format: req.query.format as any || 'vc-http-api'
  });
  res.json({
    url: qr.url,
    dataURL: qr.dataURL,
    format: qr.format
  });
});
```

### Next.js API Route

```typescript
// pages/api/credentials/[id]/qr.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { generateQRBuffer } from '@proofpass/qr-toolkit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const format = (req.query.format as string) || 'vc-http-api';
  const size = parseInt(req.query.size as string) || 400;

  try {
    const buffer = await generateQRBuffer(id as string, {
      format: format as any,
      size,
      errorCorrectionLevel: 'M'
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
}

// Usage: /api/credentials/att_123/qr?format=openid4vc&size=500
```

### Mobile App (React Native)

```typescript
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { generateQRCode } from '@proofpass/qr-toolkit';

function CredentialQR({ credentialId }) {
  const [qrDataURL, setQrDataURL] = React.useState('');

  React.useEffect(() => {
    generateQRCode(credentialId, {
      format: 'deeplink',  // Use deep links for mobile
      size: 300
    }).then(qr => setQrDataURL(qr.dataURL));
  }, [credentialId]);

  return (
    <View style={styles.container}>
      {qrDataURL && (
        <Image
          source={{ uri: qrDataURL }}
          style={styles.qrCode}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCode: {
    width: 300,
    height: 300,
  },
});
```

## Building

```bash
npm run build
```

This compiles TypeScript to JavaScript and generates type declaration files in `./dist`.

## Testing

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Related Packages

- `@proofpass/vc-toolkit` - Create and verify verifiable credentials
- `@proofpass/client` - API client for ProofPass Platform
- `@proofpass/types` - TypeScript type definitions
- `@proofpass/blockchain` - Blockchain anchoring

## Standards References

- [W3C Verifiable Credentials Data Model](https://www.w3.org/TR/vc-data-model/)
- [W3C VC-HTTP-API](https://w3c-ccg.github.io/vc-http-api/)
- [OpenID for Verifiable Credentials](https://openid.net/specs/openid-4-verifiable-credentials-1_0.html)
- [CHAPI - Credential Handler API](https://chapi.io/)
- [QR Code Error Correction](https://www.qrcode.com/en/about/error_correction.html)

## License

LGPL-3.0

## Support

- **Documentation:** [https://docs.proofpass.com](https://docs.proofpass.com)
- **GitHub Issues:** [https://github.com/PROOFPASS/ProofPassPlatform/issues](https://github.com/PROOFPASS/ProofPassPlatform/issues)
- **Email:** fboiero@frvm.utn.edu.ar
