import { apiClient } from '../api-client';

export interface Attestation {
  id: string;
  vcId: string;
  templateId: string;
  claims: Record<string, any>;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  blockchainTxHash?: string;
  blockchain?: 'optimism' | 'arbitrum' | 'stellar';
  issuer: {
    id: string;
    name: string;
  };
  organization: {
    id: string;
    name: string;
  };
  createdAt: string;
  revokedAt?: string;
}

export interface CreateAttestationRequest {
  templateId: string;
  claims: Record<string, any>;
  blockchain?: 'optimism' | 'arbitrum' | 'stellar';
}

export interface ListAttestationsParams {
  page?: number;
  limit?: number;
  templateId?: string;
  status?: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

export interface ListAttestationsResponse {
  attestations: Attestation[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Attestations Service
 * Manages all API calls related to attestations/credentials
 */
export const attestationsService = {
  /**
   * Create a new attestation
   */
  async create(data: CreateAttestationRequest): Promise<Attestation> {
    const response = await apiClient.post('/attestations', data);
    return response.data;
  },

  /**
   * Get attestation by ID
   */
  async getById(id: string): Promise<Attestation> {
    const response = await apiClient.get(`/attestations/${id}`);
    return response.data;
  },

  /**
   * List attestations with pagination
   */
  async list(params: ListAttestationsParams = {}): Promise<ListAttestationsResponse> {
    const response = await apiClient.get('/attestations', { params });
    return response.data;
  },

  /**
   * Revoke an attestation
   */
  async revoke(id: string, reason?: string): Promise<Attestation> {
    const response = await apiClient.post(`/attestations/${id}/revoke`, { reason });
    return response.data;
  },

  /**
   * Get verification URL for attestation
   */
  getVerificationUrl(id: string, format: 'vc-http-api' | 'openid4vc' | 'deeplink' | 'chapi' | 'plain' = 'vc-http-api'): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.proofpass.com';

    switch (format) {
      case 'vc-http-api':
        return `${baseUrl}/credentials/${id}/verify`;
      case 'openid4vc':
        return `openid-vc://?credential_id=${id}&issuer=${encodeURIComponent(baseUrl)}`;
      case 'deeplink':
        return `proofpass://verify/${id}`;
      case 'chapi':
        return `${baseUrl}/chapi/credentials/${id}`;
      case 'plain':
      default:
        return `${baseUrl}/verify?credential=${id}`;
    }
  },

  /**
   * Download attestation as JSON
   */
  async downloadAsJson(id: string): Promise<Blob> {
    const attestation = await this.getById(id);
    const blob = new Blob([JSON.stringify(attestation, null, 2)], {
      type: 'application/json',
    });
    return blob;
  },
};
