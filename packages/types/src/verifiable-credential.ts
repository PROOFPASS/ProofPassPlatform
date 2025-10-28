/**
 * W3C Verifiable Credential types
 * Based on W3C VC Data Model v1.1
 */

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string | Issuer;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  proof: Proof;
}

export interface Issuer {
  id: string;
  name?: string;
}

export interface CredentialSubject {
  id?: string;
  [key: string]: any;
}

export interface Proof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  jws?: string;
}

export interface VerifiablePresentation {
  '@context': string[];
  type: string[];
  verifiableCredential: VerifiableCredential[];
  proof: Proof;
}
