/**
 * Job Types and Data Interfaces
 * Type definitions for different queue jobs
 */

// VC Issuance Job
export interface VCIssuanceJobData {
  issuerDid: string;
  subjectDid: string;
  credentialType: string;
  claims: Record<string, any>;
  expirationDate?: string;
  organizationId: string;
  userId: string;
  callbackUrl?: string;
}

export interface VCIssuanceJobResult {
  vcJwt: string;
  credentialId: string;
  issuedAt: string;
}

// VC Verification Job
export interface VCVerificationJobData {
  vcJwt: string;
  verifierDid?: string;
  organizationId: string;
  userId: string;
  callbackUrl?: string;
}

export interface VCVerificationJobResult {
  valid: boolean;
  claims?: Record<string, any>;
  issuer?: string;
  subject?: string;
  error?: string;
}

// Webhook Job
export interface WebhookJobData {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  payload: Record<string, any>;
  event: string;
  organizationId: string;
  retries?: number;
}

export interface WebhookJobResult {
  statusCode: number;
  success: boolean;
  response?: any;
  error?: string;
}

// Email Job
export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
  organizationId: string;
  userId?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    encoding?: string;
  }>;
}

export interface EmailJobResult {
  messageId: string;
  success: boolean;
  error?: string;
}

// DID Operation Job
export interface DIDOperationJobData {
  operation: 'create' | 'update' | 'deactivate';
  didMethod: 'key' | 'web';
  organizationId: string;
  userId: string;
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

export interface DIDOperationJobResult {
  did: string;
  operation: string;
  success: boolean;
  error?: string;
}

// Generic job result
export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
}
