/**
 * ProofPass QR Toolkit
 *
 * Generate QR codes for verifiable credentials following W3C and OpenID4VC standards
 *
 * Supported standards:
 * - W3C VC-HTTP-API: https://w3c-ccg.github.io/vc-http-api/
 * - OpenID for Verifiable Credentials (OpenID4VC): https://openid.net/specs/openid-4-verifiable-credentials-1_0.html
 * - CHAPI (Credential Handler API): https://chapi.io/
 * - Deep Links for mobile wallets
 */

import QRCode from 'qrcode';

export type URLFormat = 'vc-http-api' | 'openid4vc' | 'deeplink' | 'chapi' | 'plain';

export interface QRCodeOptions {
  format?: URLFormat;
  baseURL?: string;
  size?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  color?: {
    dark?: string;
    light?: string;
  };
}

export interface GenerateQRResult {
  url: string;
  format: URLFormat;
  dataURL: string;
  svg?: string;
}

/**
 * Generate verification URL following specified standard
 */
export function generateVerificationURL(
  credentialId: string,
  format: URLFormat = 'vc-http-api',
  baseURL: string = 'https://api.proofpass.com'
): string {
  switch (format) {
    case 'vc-http-api':
      // W3C VC-HTTP-API standard
      // https://w3c-ccg.github.io/vc-http-api/#verify-credential
      return `${baseURL}/credentials/${credentialId}/verify`;

    case 'openid4vc':
      // OpenID for Verifiable Credentials
      // https://openid.net/specs/openid-4-verifiable-credentials-1_0.html
      return `openid-vc://?credential_id=${credentialId}&issuer=${encodeURIComponent(baseURL)}`;

    case 'deeplink':
      // Mobile wallet deep link
      return `proofpass://verify/${credentialId}`;

    case 'chapi':
      // Credential Handler API (CHAPI)
      // https://chapi.io/
      return `${baseURL}/.well-known/vc-handler?credential=${credentialId}&action=verify`;

    case 'plain':
      // Simple HTTP URL
      return `${baseURL}/verify/${credentialId}`;

    default:
      throw new Error(`Unsupported URL format: ${format}`);
  }
}

/**
 * Generate QR code for credential verification
 *
 * @example
 * ```typescript
 * import { generateQRCode } from '@proofpass/qr-toolkit';
 *
 * // W3C VC-HTTP-API format (default)
 * const qr = await generateQRCode('credential-123');
 * console.log(qr.url); // https://api.proofpass.com/credentials/credential-123/verify
 *
 * // OpenID4VC format
 * const qr = await generateQRCode('credential-123', { format: 'openid4vc' });
 * ```
 */
export async function generateQRCode(
  credentialId: string,
  options: QRCodeOptions = {}
): Promise<GenerateQRResult> {
  const {
    format = 'vc-http-api',
    baseURL = 'https://api.proofpass.com',
    size = 300,
    errorCorrectionLevel = 'M',
    color = { dark: '#000000', light: '#FFFFFF' }
  } = options;

  // Generate URL
  const url = generateVerificationURL(credentialId, format, baseURL);

  // Generate QR code data URL
  const dataURL = await QRCode.toDataURL(url, {
    width: size,
    errorCorrectionLevel,
    color
  });

  // Generate SVG (optional)
  const svg = await QRCode.toString(url, {
    type: 'svg',
    width: size,
    errorCorrectionLevel,
    color
  });

  return {
    url,
    format,
    dataURL,
    svg
  };
}

/**
 * Generate QR code buffer (for server-side use)
 */
export async function generateQRBuffer(
  credentialId: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const {
    format = 'vc-http-api',
    baseURL = 'https://api.proofpass.com',
    size = 300,
    errorCorrectionLevel = 'M',
    color = { dark: '#000000', light: '#FFFFFF' }
  } = options;

  const url = generateVerificationURL(credentialId, format, baseURL);

  return QRCode.toBuffer(url, {
    width: size,
    errorCorrectionLevel,
    color
  });
}

/**
 * Generate multiple QR codes in different formats
 */
export async function generateMultiFormatQRCodes(
  credentialId: string,
  formats: URLFormat[] = ['vc-http-api', 'openid4vc', 'deeplink'],
  baseURL?: string
): Promise<GenerateQRResult[]> {
  return Promise.all(
    formats.map(format =>
      generateQRCode(credentialId, { format, baseURL })
    )
  );
}

/**
 * Parse verification URL to extract credential ID and format
 */
export function parseVerificationURL(url: string): {
  credentialId: string | null;
  format: URLFormat;
  baseURL: string | null;
} {
  // OpenID4VC format
  if (url.startsWith('openid-vc://')) {
    const urlObj = new URL(url);
    const credentialId = urlObj.searchParams.get('credential_id');
    const issuer = urlObj.searchParams.get('issuer');
    return {
      credentialId,
      format: 'openid4vc',
      baseURL: issuer ? decodeURIComponent(issuer) : null
    };
  }

  // Deep link format
  if (url.startsWith('proofpass://verify/')) {
    const credentialId = url.replace('proofpass://verify/', '');
    return {
      credentialId,
      format: 'deeplink',
      baseURL: null
    };
  }

  // HTTP/HTTPS formats
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const urlObj = new URL(url);

    // CHAPI format
    if (url.includes('/.well-known/vc-handler')) {
      const credentialId = urlObj.searchParams.get('credential');
      return {
        credentialId,
        format: 'chapi',
        baseURL: `${urlObj.protocol}//${urlObj.host}`
      };
    }

    // VC-HTTP-API format
    const vcHttpMatch = url.match(/\/credentials\/([^/]+)\/verify/);
    if (vcHttpMatch) {
      return {
        credentialId: vcHttpMatch[1],
        format: 'vc-http-api',
        baseURL: `${urlObj.protocol}//${urlObj.host}`
      };
    }

    // Plain format
    const plainMatch = url.match(/\/verify\/([^/]+)/);
    if (plainMatch) {
      return {
        credentialId: plainMatch[1],
        format: 'plain',
        baseURL: `${urlObj.protocol}//${urlObj.host}`
      };
    }
  }

  throw new Error(`Cannot parse verification URL: ${url}`);
}

/**
 * Validate if URL follows supported standard
 */
export function isValidVerificationURL(url: string): boolean {
  try {
    parseVerificationURL(url);
    return true;
  } catch {
    return false;
  }
}

// Export types
export type { QRCode };
