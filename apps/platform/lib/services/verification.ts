import { apiClient } from '../api-client';
import { Attestation } from './attestations';

export interface VerificationResult {
  valid: boolean;
  credential: Attestation | null;
  errors: string[];
  verificationDetails: {
    signatureValid: boolean;
    notRevoked: boolean;
    notExpired: boolean;
    issuerTrusted: boolean;
    blockchainVerified: boolean;
  };
  verifiedAt: string;
}

export interface VerifyCredentialRequest {
  credentialId?: string;
  vcId?: string;
  url?: string;
}

/**
 * Verification Service
 * Handles public verification of verifiable credentials
 */
export const verificationService = {
  /**
   * Verify a credential by ID or URL
   */
  async verify(request: VerifyCredentialRequest): Promise<VerificationResult> {
    try {
      const response = await apiClient.post('/verify', request);
      return response.data;
    } catch (error: any) {
      // Return failed verification result
      return {
        valid: false,
        credential: null,
        errors: [error.response?.data?.message || error.message || 'Verification failed'],
        verificationDetails: {
          signatureValid: false,
          notRevoked: false,
          notExpired: false,
          issuerTrusted: false,
          blockchainVerified: false,
        },
        verifiedAt: new Date().toISOString(),
      };
    }
  },

  /**
   * Verify a credential by ID (shorthand)
   */
  async verifyById(credentialId: string): Promise<VerificationResult> {
    return this.verify({ credentialId });
  },

  /**
   * Verify a credential by VC ID (shorthand)
   */
  async verifyByVcId(vcId: string): Promise<VerificationResult> {
    return this.verify({ vcId });
  },

  /**
   * Verify a credential by URL (shorthand)
   */
  async verifyByUrl(url: string): Promise<VerificationResult> {
    return this.verify({ url });
  },

  /**
   * Extract credential ID from various URL formats
   */
  extractCredentialId(input: string): string | null {
    // Remove whitespace
    const trimmed = input.trim();

    // Direct ID (UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(trimmed)) {
      return trimmed;
    }

    // URL with credential parameter
    try {
      const url = new URL(trimmed);

      // Check query parameter: ?credential=xxx
      const credParam = url.searchParams.get('credential');
      if (credParam) return credParam;

      // Check path: /verify/xxx or /credentials/xxx/verify
      const pathMatch = url.pathname.match(/\/(?:verify|credentials)\/([a-f0-9-]+)/i);
      if (pathMatch) return pathMatch[1];

      // Check deep link: proofpass://verify/xxx
      if (url.protocol === 'proofpass:') {
        const deepLinkMatch = url.pathname.match(/^\/?\/?verify\/([a-f0-9-]+)/i);
        if (deepLinkMatch) return deepLinkMatch[1];
      }
    } catch {
      // Not a valid URL, might be just an ID
      return null;
    }

    return null;
  },

  /**
   * Get verification status label
   */
  getStatusLabel(result: VerificationResult): {
    label: string;
    variant: 'success' | 'destructive' | 'warning';
    description: string;
  } {
    if (!result.valid) {
      return {
        label: 'No Válida',
        variant: 'destructive',
        description: 'Esta credencial no pasó la verificación',
      };
    }

    const { verificationDetails } = result;

    if (!verificationDetails.notRevoked) {
      return {
        label: 'Revocada',
        variant: 'destructive',
        description: 'Esta credencial ha sido revocada por el emisor',
      };
    }

    if (!verificationDetails.notExpired) {
      return {
        label: 'Expirada',
        variant: 'warning',
        description: 'Esta credencial ha alcanzado su fecha de expiración',
      };
    }

    if (!verificationDetails.signatureValid) {
      return {
        label: 'Firma Inválida',
        variant: 'destructive',
        description: 'La firma criptográfica no es válida',
      };
    }

    return {
      label: 'Verificada',
      variant: 'success',
      description: 'Credencial válida y verificada correctamente',
    };
  },

  /**
   * Get blockchain verification label
   */
  getBlockchainLabel(result: VerificationResult): {
    label: string;
    variant: 'success' | 'secondary';
  } {
    if (result.verificationDetails.blockchainVerified) {
      return {
        label: 'Verificada en Blockchain',
        variant: 'success',
      };
    }

    return {
      label: 'No anclada en Blockchain',
      variant: 'secondary',
    };
  },
};
