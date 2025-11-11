import apiClient from '../api-client';

/**
 * Credential/Attestation interfaces matching backend API
 */
export interface Credential {
  id: string;
  issuer_did: string;
  subject: string;
  type: string;
  claims: Record<string, any>;
  issued_at: Date;
  credential: string; // JWT string
  blockchain_tx_hash?: string;
  blockchain_network?: 'stellar' | 'optimism';
  qr_code?: string;
  status: 'pending' | 'anchored' | 'failed';
  created_at: Date;
  updated_at: Date;
  user_id: string;
}

export interface CreateCredentialRequest {
  subject: string; // DID of the subject
  type: string; // e.g., 'EducationCredential', 'AgeVerification'
  claims: Record<string, any>;
  blockchain_network?: 'stellar' | 'optimism';
  expirationDate?: string; // ISO 8601 date string
}

export interface VerificationResult {
  valid: boolean;
  attestation?: Credential;
  verification: {
    credentialValid: boolean;
    blockchainVerified: boolean;
  };
  errors: string[];
}

/**
 * Credentials Service
 * Manages W3C Verifiable Credentials (Attestations)
 */
export const credentialsService = {
  /**
   * Create a new verifiable credential
   */
  async create(data: CreateCredentialRequest): Promise<Credential> {
    const response = await apiClient.post('/api/v1/attestations', data);
    return this.parseCredential(response);
  },

  /**
   * Get credential by ID
   */
  async getById(id: string): Promise<Credential> {
    const response = await apiClient.get(`/api/v1/attestations/${id}`);
    return this.parseCredential(response);
  },

  /**
   * List all credentials for authenticated user
   */
  async list(): Promise<Credential[]> {
    const response = await apiClient.get('/api/v1/attestations');
    const credentials = response.attestations || [];
    return credentials.map((c: any) => this.parseCredential(c));
  },

  /**
   * Verify a credential
   */
  async verify(id: string): Promise<VerificationResult> {
    const response = await apiClient.post(`/api/v1/attestations/${id}/verify`);
    return response;
  },

  /**
   * Download credential as JWT file
   */
  async downloadJWT(id: string): Promise<Blob> {
    const credential = await this.getById(id);
    const blob = new Blob([credential.credential], {
      type: 'text/plain',
    });
    return blob;
  },

  /**
   * Download credential as JSON
   */
  async downloadJSON(id: string): Promise<Blob> {
    const credential = await this.getById(id);
    const blob = new Blob([JSON.stringify(credential, null, 2)], {
      type: 'application/json',
    });
    return blob;
  },

  /**
   * Get verification URL for QR code
   */
  getVerificationUrl(id: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${baseUrl}/api/v1/attestations/${id}/verify`;
  },

  /**
   * Parse credential from API response, converting date strings to Date objects
   */
  parseCredential(data: any): Credential {
    return {
      ...data,
      issued_at: new Date(data.issued_at),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    };
  },

  /**
   * Helper to trigger file download
   */
  triggerDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Download credential JWT
   */
  async downloadCredentialJWT(id: string, filename?: string) {
    const blob = await this.downloadJWT(id);
    this.triggerDownload(blob, filename || `credential-${id}.jwt`);
  },

  /**
   * Download credential JSON
   */
  async downloadCredentialJSON(id: string, filename?: string) {
    const blob = await this.downloadJSON(id);
    this.triggerDownload(blob, filename || `credential-${id}.json`);
  },
};
