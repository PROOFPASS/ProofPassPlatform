import { apiClient } from '../api-client';
import { Attestation } from './attestations';

export interface Passport {
  id: string;
  did: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  attestations: Attestation[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePassportRequest {
  attestationIds: string[];
}

/**
 * Passports Service
 * Manages digital passports for users
 */
export const passportsService = {
  /**
   * Get user's passport (creates one if doesn't exist)
   */
  async getMyPassport(): Promise<Passport> {
    const response = await apiClient.get('/passports/me');
    return response.data;
  },

  /**
   * Get passport by ID (public view)
   */
  async getById(id: string): Promise<Passport> {
    const response = await apiClient.get(`/passports/${id}`);
    return response.data;
  },

  /**
   * Add attestation to passport
   */
  async addAttestation(passportId: string, attestationId: string): Promise<Passport> {
    const response = await apiClient.post(`/passports/${passportId}/attestations`, {
      attestationId,
    });
    return response.data;
  },

  /**
   * Remove attestation from passport
   */
  async removeAttestation(passportId: string, attestationId: string): Promise<Passport> {
    const response = await apiClient.delete(`/passports/${passportId}/attestations/${attestationId}`);
    return response.data;
  },

  /**
   * Download passport as JSON
   */
  async downloadAsJson(passportId: string): Promise<Blob> {
    const passport = await this.getById(passportId);
    const blob = new Blob([JSON.stringify(passport, null, 2)], {
      type: 'application/json',
    });
    return blob;
  },

  /**
   * Get shareable passport URL
   */
  getShareUrl(passportId: string): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/passport/${passportId}`;
  },
};
