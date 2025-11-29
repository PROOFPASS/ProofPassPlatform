/**
 * Tests para ProofPass QR Toolkit
 * Coverage objetivo: 100%
 */

import {
  generateVerificationURL,
  generateQRCode,
  generateQRBuffer,
  generateMultiFormatQRCodes,
  parseVerificationURL,
  isValidVerificationURL,
  type URLFormat,
  type QRCodeOptions,
} from '../src/index';
import QRCode from 'qrcode';

// Mock QRCode library
jest.mock('qrcode');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedToDataURL = QRCode.toDataURL as jest.Mock<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedToString = QRCode.toString as jest.Mock<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockedToBuffer = QRCode.toBuffer as jest.Mock<any>;

describe('ProofPass QR Toolkit', () => {
  const testCredentialId = 'cred-123-test';
  const testBaseURL = 'https://test.proofpass.com';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateVerificationURL', () => {
    it('debe generar URL en formato vc-http-api por defecto', () => {
      const url = generateVerificationURL(testCredentialId);

      expect(url).toBe('https://api.proofpass.com/credentials/cred-123-test/verify');
    });

    it('debe generar URL en formato vc-http-api con baseURL custom', () => {
      const url = generateVerificationURL(testCredentialId, 'vc-http-api', testBaseURL);

      expect(url).toBe('https://test.proofpass.com/credentials/cred-123-test/verify');
    });

    it('debe generar URL en formato openid4vc', () => {
      const url = generateVerificationURL(testCredentialId, 'openid4vc', testBaseURL);

      expect(url).toBe('openid-vc://?credential_id=cred-123-test&issuer=https%3A%2F%2Ftest.proofpass.com');
      expect(url).toContain('openid-vc://');
      expect(url).toContain('credential_id=');
      expect(url).toContain('issuer=');
    });

    it('debe generar URL en formato deeplink', () => {
      const url = generateVerificationURL(testCredentialId, 'deeplink');

      expect(url).toBe('proofpass://verify/cred-123-test');
    });

    it('debe generar URL en formato chapi', () => {
      const url = generateVerificationURL(testCredentialId, 'chapi', testBaseURL);

      expect(url).toBe('https://test.proofpass.com/.well-known/vc-handler?credential=cred-123-test&action=verify');
    });

    it('debe generar URL en formato plain', () => {
      const url = generateVerificationURL(testCredentialId, 'plain', testBaseURL);

      expect(url).toBe('https://test.proofpass.com/verify/cred-123-test');
    });

    it('debe lanzar error para formato no soportado', () => {
      expect(() => {
        generateVerificationURL(testCredentialId, 'invalid-format' as URLFormat);
      }).toThrow('Unsupported URL format: invalid-format');
    });

    it('debe manejar credential IDs con caracteres especiales', () => {
      const complexId = 'cred-123-abc_XYZ:789';
      const url = generateVerificationURL(complexId, 'vc-http-api', testBaseURL);

      expect(url).toContain(complexId);
    });
  });

  describe('generateQRCode', () => {
    beforeEach(() => {
      mockedToDataURL.mockResolvedValue('data:image/png;base64,mockdata');
      mockedToString.mockResolvedValue('<svg>mock</svg>');
    });

    it('debe generar QR code con opciones por defecto', async () => {
      const result = await generateQRCode(testCredentialId);

      expect(result.url).toBe('https://api.proofpass.com/credentials/cred-123-test/verify');
      expect(result.format).toBe('vc-http-api');
      expect(result.dataURL).toBe('data:image/png;base64,mockdata');
      expect(result.svg).toBe('<svg>mock</svg>');

      expect(mockedToDataURL).toHaveBeenCalledWith(
        result.url,
        expect.objectContaining({
          width: 300,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#FFFFFF' },
        })
      );
    });

    it('debe generar QR code con opciones customizadas', async () => {
      const options: QRCodeOptions = {
        format: 'openid4vc',
        baseURL: testBaseURL,
        size: 500,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#FF0000',
          light: '#00FF00',
        },
      };

      const result = await generateQRCode(testCredentialId, options);

      expect(result.format).toBe('openid4vc');
      expect(result.url).toContain('openid-vc://');

      expect(mockedToDataURL).toHaveBeenCalledWith(
        result.url,
        expect.objectContaining({
          width: 500,
          errorCorrectionLevel: 'H',
          color: { dark: '#FF0000', light: '#00FF00' },
        })
      );
    });

    it('debe generar QR code en formato deeplink', async () => {
      const result = await generateQRCode(testCredentialId, { format: 'deeplink' });

      expect(result.url).toBe('proofpass://verify/cred-123-test');
      expect(result.format).toBe('deeplink');
    });

    it('debe generar QR code en formato chapi', async () => {
      const result = await generateQRCode(testCredentialId, { format: 'chapi', baseURL: testBaseURL });

      expect(result.url).toContain('/.well-known/vc-handler');
      expect(result.format).toBe('chapi');
    });

    it('debe generar QR code en formato plain', async () => {
      const result = await generateQRCode(testCredentialId, { format: 'plain', baseURL: testBaseURL });

      expect(result.url).toBe('https://test.proofpass.com/verify/cred-123-test');
      expect(result.format).toBe('plain');
    });

    it('debe generar SVG correctamente', async () => {
      const result = await generateQRCode(testCredentialId);

      expect(mockedToString).toHaveBeenCalledWith(
        result.url,
        expect.objectContaining({
          type: 'svg',
        })
      );
    });

    it('debe soportar diferentes niveles de error correction', async () => {
      const levels: Array<'L' | 'M' | 'Q' | 'H'> = ['L', 'M', 'Q', 'H'];

      for (const level of levels) {
        await generateQRCode(testCredentialId, { errorCorrectionLevel: level });

        expect(mockedToDataURL).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            errorCorrectionLevel: level,
          })
        );
      }
    });
  });

  describe('generateQRBuffer', () => {
    beforeEach(() => {
      mockedToBuffer.mockResolvedValue(Buffer.from('mockbuffer'));
    });

    it('debe generar buffer con opciones por defecto', async () => {
      const buffer = await generateQRBuffer(testCredentialId);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString()).toBe('mockbuffer');

      expect(mockedToBuffer).toHaveBeenCalledWith(
        'https://api.proofpass.com/credentials/cred-123-test/verify',
        expect.objectContaining({
          width: 300,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#FFFFFF' },
        })
      );
    });

    it('debe generar buffer con opciones customizadas', async () => {
      const options: QRCodeOptions = {
        format: 'openid4vc',
        baseURL: testBaseURL,
        size: 600,
        errorCorrectionLevel: 'Q',
        color: { dark: '#0000FF', light: '#FFFF00' },
      };

      await generateQRBuffer(testCredentialId, options);

      expect(mockedToBuffer).toHaveBeenCalledWith(
        expect.stringContaining('openid-vc://'),
        expect.objectContaining({
          width: 600,
          errorCorrectionLevel: 'Q',
          color: { dark: '#0000FF', light: '#FFFF00' },
        })
      );
    });

    it('debe generar buffer para todos los formatos', async () => {
      const formats: URLFormat[] = ['vc-http-api', 'openid4vc', 'deeplink', 'chapi', 'plain'];

      for (const format of formats) {
        await generateQRBuffer(testCredentialId, { format });
        expect(mockedToBuffer).toHaveBeenCalled();
      }
    });
  });

  describe('generateMultiFormatQRCodes', () => {
    beforeEach(() => {
      mockedToDataURL.mockResolvedValue('data:image/png;base64,mockdata');
      mockedToString.mockResolvedValue('<svg>mock</svg>');
    });

    it('debe generar QR codes en formatos por defecto', async () => {
      const results = await generateMultiFormatQRCodes(testCredentialId);

      expect(results.length).toBe(3);
      expect(results[0].format).toBe('vc-http-api');
      expect(results[1].format).toBe('openid4vc');
      expect(results[2].format).toBe('deeplink');
    });

    it('debe generar QR codes en formatos custom', async () => {
      const formats: URLFormat[] = ['chapi', 'plain'];
      const results = await generateMultiFormatQRCodes(testCredentialId, formats);

      expect(results.length).toBe(2);
      expect(results[0].format).toBe('chapi');
      expect(results[1].format).toBe('plain');
    });

    it('debe usar baseURL en todos los formatos', async () => {
      const formats: URLFormat[] = ['vc-http-api', 'chapi'];
      const results = await generateMultiFormatQRCodes(testCredentialId, formats, testBaseURL);

      expect(results[0].url).toContain(testBaseURL);
      expect(results[1].url).toContain(testBaseURL);
    });

    it('debe generar QR code único', async () => {
      const formats: URLFormat[] = ['vc-http-api'];
      const results = await generateMultiFormatQRCodes(testCredentialId, formats);

      expect(results.length).toBe(1);
      expect(results[0].format).toBe('vc-http-api');
    });

    it('debe generar QR codes en los 5 formatos', async () => {
      const formats: URLFormat[] = ['vc-http-api', 'openid4vc', 'deeplink', 'chapi', 'plain'];
      const results = await generateMultiFormatQRCodes(testCredentialId, formats);

      expect(results.length).toBe(5);
      const resultFormats = results.map(r => r.format);
      expect(resultFormats).toEqual(formats);
    });
  });

  describe('parseVerificationURL', () => {
    it('debe parsear URL en formato vc-http-api', () => {
      const url = 'https://api.proofpass.com/credentials/cred-123/verify';
      const result = parseVerificationURL(url);

      expect(result.credentialId).toBe('cred-123');
      expect(result.format).toBe('vc-http-api');
      expect(result.baseURL).toBe('https://api.proofpass.com');
    });

    it('debe parsear URL en formato openid4vc', () => {
      const url = 'openid-vc://?credential_id=cred-456&issuer=https%3A%2F%2Ftest.com';
      const result = parseVerificationURL(url);

      expect(result.credentialId).toBe('cred-456');
      expect(result.format).toBe('openid4vc');
      expect(result.baseURL).toBe('https://test.com');
    });

    it('debe parsear URL en formato deeplink', () => {
      const url = 'proofpass://verify/cred-789';
      const result = parseVerificationURL(url);

      expect(result.credentialId).toBe('cred-789');
      expect(result.format).toBe('deeplink');
      expect(result.baseURL).toBeNull();
    });

    it('debe parsear URL en formato chapi', () => {
      const url = 'https://example.com/.well-known/vc-handler?credential=cred-abc&action=verify';
      const result = parseVerificationURL(url);

      expect(result.credentialId).toBe('cred-abc');
      expect(result.format).toBe('chapi');
      expect(result.baseURL).toBe('https://example.com');
    });

    it('debe parsear URL en formato plain', () => {
      const url = 'https://example.com/verify/cred-xyz';
      const result = parseVerificationURL(url);

      expect(result.credentialId).toBe('cred-xyz');
      expect(result.format).toBe('plain');
      expect(result.baseURL).toBe('https://example.com');
    });

    it('debe parsear URL con HTTP en lugar de HTTPS', () => {
      const url = 'http://localhost:3000/credentials/cred-local/verify';
      const result = parseVerificationURL(url);

      expect(result.credentialId).toBe('cred-local');
      expect(result.format).toBe('vc-http-api');
      expect(result.baseURL).toBe('http://localhost:3000');
    });

    it('debe lanzar error para URL inválida', () => {
      expect(() => {
        parseVerificationURL('invalid-url');
      }).toThrow('Cannot parse verification URL: invalid-url');
    });

    it('debe lanzar error para URL sin credential ID', () => {
      expect(() => {
        parseVerificationURL('https://example.com/random/path');
      }).toThrow('Cannot parse verification URL');
    });

    it('debe manejar URLs con puertos', () => {
      const url = 'https://api.proofpass.com:8080/credentials/cred-port/verify';
      const result = parseVerificationURL(url);

      expect(result.credentialId).toBe('cred-port');
      expect(result.baseURL).toBe('https://api.proofpass.com:8080');
    });

    it('debe manejar credential IDs con caracteres especiales', () => {
      const complexId = 'cred-123_ABC:xyz';
      const url = `https://api.proofpass.com/credentials/${complexId}/verify`;
      const result = parseVerificationURL(url);

      expect(result.credentialId).toBe(complexId);
    });
  });

  describe('isValidVerificationURL', () => {
    it('debe retornar true para URL válida en formato vc-http-api', () => {
      const url = 'https://api.proofpass.com/credentials/cred-123/verify';

      expect(isValidVerificationURL(url)).toBe(true);
    });

    it('debe retornar true para URL válida en formato openid4vc', () => {
      const url = 'openid-vc://?credential_id=cred-456&issuer=https%3A%2F%2Ftest.com';

      expect(isValidVerificationURL(url)).toBe(true);
    });

    it('debe retornar true para URL válida en formato deeplink', () => {
      const url = 'proofpass://verify/cred-789';

      expect(isValidVerificationURL(url)).toBe(true);
    });

    it('debe retornar true para URL válida en formato chapi', () => {
      const url = 'https://example.com/.well-known/vc-handler?credential=cred-abc&action=verify';

      expect(isValidVerificationURL(url)).toBe(true);
    });

    it('debe retornar true para URL válida en formato plain', () => {
      const url = 'https://example.com/verify/cred-xyz';

      expect(isValidVerificationURL(url)).toBe(true);
    });

    it('debe retornar false para URL inválida', () => {
      expect(isValidVerificationURL('invalid-url')).toBe(false);
      expect(isValidVerificationURL('https://example.com/random')).toBe(false);
      expect(isValidVerificationURL('')).toBe(false);
    });

    it('debe retornar false para URL vacía', () => {
      expect(isValidVerificationURL('')).toBe(false);
    });
  });

  describe('Flujo end-to-end completo', () => {
    beforeEach(() => {
      mockedToDataURL.mockResolvedValue('data:image/png;base64,mockdata');
      mockedToString.mockResolvedValue('<svg>mock</svg>');
      mockedToBuffer.mockResolvedValue(Buffer.from('mockbuffer'));
    });

    it('debe completar flujo: generate URL -> generate QR -> parse URL', async () => {
      // 1. Generate URL
      const url = generateVerificationURL(testCredentialId, 'vc-http-api', testBaseURL);
      expect(url).toContain('/credentials/');
      expect(url).toContain('/verify');

      // 2. Generate QR Code
      const qr = await generateQRCode(testCredentialId, {
        format: 'vc-http-api',
        baseURL: testBaseURL,
      });
      expect(qr.url).toBe(url);
      expect(qr.dataURL).toBeTruthy();
      expect(qr.svg).toBeTruthy();

      // 3. Parse URL
      const parsed = parseVerificationURL(url);
      expect(parsed.credentialId).toBe(testCredentialId);
      expect(parsed.format).toBe('vc-http-api');
      expect(parsed.baseURL).toBe(testBaseURL);

      // 4. Validate URL
      expect(isValidVerificationURL(url)).toBe(true);
    });

    it('debe completar flujo multi-format: generate -> validate all', async () => {
      const formats: URLFormat[] = ['vc-http-api', 'openid4vc', 'deeplink', 'chapi', 'plain'];

      // 1. Generate multi-format QR codes
      const qrCodes = await generateMultiFormatQRCodes(testCredentialId, formats, testBaseURL);
      expect(qrCodes.length).toBe(5);

      // 2. Validate all URLs
      for (const qr of qrCodes) {
        expect(isValidVerificationURL(qr.url)).toBe(true);
        expect(qr.dataURL).toBeTruthy();
        expect(qr.svg).toBeTruthy();
      }

      // 3. Parse all URLs
      for (let i = 0; i < qrCodes.length; i++) {
        const parsed = parseVerificationURL(qrCodes[i].url);
        expect(parsed.format).toBe(formats[i]);

        // Deeplink no tiene baseURL
        if (formats[i] !== 'deeplink') {
          expect(parsed.credentialId).toBeTruthy();
        }
      }
    });

    it('debe completar flujo buffer: generate -> validate', async () => {
      // 1. Generate Buffer
      const buffer = await generateQRBuffer(testCredentialId, {
        format: 'openid4vc',
        baseURL: testBaseURL,
        size: 400,
      });

      expect(buffer).toBeInstanceOf(Buffer);

      // 2. Generate URL for validation
      const url = generateVerificationURL(testCredentialId, 'openid4vc', testBaseURL);

      // 3. Validate and parse
      expect(isValidVerificationURL(url)).toBe(true);
      const parsed = parseVerificationURL(url);
      expect(parsed.format).toBe('openid4vc');
    });

    it('debe manejar diferentes credential IDs en flujo completo', async () => {
      const credentialIds = [
        'simple-123',
        'complex-abc_XYZ:789',
        'uuid-550e8400-e29b-41d4-a716-446655440000',
      ];

      for (const credId of credentialIds) {
        // Generate
        const url = generateVerificationURL(credId, 'vc-http-api', testBaseURL);

        // Validate
        expect(isValidVerificationURL(url)).toBe(true);

        // Parse
        const parsed = parseVerificationURL(url);
        expect(parsed.credentialId).toBe(credId);

        // Generate QR
        const qr = await generateQRCode(credId, {
          format: 'vc-http-api',
          baseURL: testBaseURL,
        });
        expect(qr.url).toContain(credId);
      }
    });
  });
});
