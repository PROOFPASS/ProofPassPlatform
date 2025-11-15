/**
 * Verifiable Credential Integration Helpers
 *
 * Utilities to create W3C Verifiable Credentials from templates
 */

import type { AttestationTemplate } from './index';
import { validateClaims, getTemplate } from './index';

export interface VCCreateOptions {
  issuer: string;
  subject?: string;
  expirationDate?: string;
  issuanceDate?: string;
  credentialId?: string;
  context?: string[];
  type?: string[];
}

export interface TemplateBasedVC {
  '@context': string[];
  id?: string;
  type: string[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: {
    id?: string;
    [key: string]: any;
  };
  templateId: string;
  templateName: string;
}

/**
 * Create a W3C Verifiable Credential from a template
 *
 * @param templateId Template ID to use
 * @param claims Claims data
 * @param options VC creation options
 * @returns Template-based VC (unsigned)
 *
 * @example
 * ```typescript
 * const vc = createVCFromTemplate('education', educationClaims, {
 *   issuer: 'did:key:z6Mkf...',
 *   subject: 'did:key:z6Mks...',
 *   expirationDate: '2025-12-31',
 * });
 * ```
 */
export function createVCFromTemplate(
  templateId: string,
  claims: any,
  options: VCCreateOptions
): TemplateBasedVC {
  // Get template
  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Validate claims
  const validation = validateClaims(templateId, claims);
  if (!validation.success) {
    throw new Error(`Claims validation failed: ${validation.errors?.message}`);
  }

  // Build W3C VC
  const now = new Date().toISOString();

  const vc: TemplateBasedVC = {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      ...(options.context || []),
    ],
    type: ['VerifiableCredential', ...(options.type || [template.name])],
    issuer: options.issuer,
    issuanceDate: options.issuanceDate || now,
    credentialSubject: {
      ...validation.data,
    },
    templateId: template.id,
    templateName: template.name,
  };

  // Optional fields
  if (options.credentialId) {
    vc.id = options.credentialId;
  }

  if (options.subject) {
    vc.credentialSubject.id = options.subject;
  }

  // Set expiration (from options, template default, or none)
  if (options.expirationDate) {
    vc.expirationDate = options.expirationDate;
  } else if (template.defaultExpiration) {
    const expDate = new Date(Date.now() + template.defaultExpiration * 1000);
    vc.expirationDate = expDate.toISOString();
  }

  return vc;
}

/**
 * Create multiple VCs from templates
 *
 * @param credentialSpecs Array of credential specifications
 * @param commonOptions Common options for all VCs
 * @returns Array of unsigned VCs
 *
 * @example
 * ```typescript
 * const vcs = createMultipleVCs([
 *   { templateId: 'farm-origin', claims: farmData },
 *   { templateId: 'processing', claims: processingData },
 * ], {
 *   issuer: 'did:key:z6Mkf...',
 * });
 * ```
 */
export function createMultipleVCs(
  credentialSpecs: Array<{
    templateId: string;
    claims: any;
    options?: Partial<VCCreateOptions>;
  }>,
  commonOptions: VCCreateOptions
): TemplateBasedVC[] {
  return credentialSpecs.map((spec) => {
    const mergedOptions = {
      ...commonOptions,
      ...spec.options,
    };

    return createVCFromTemplate(spec.templateId, spec.claims, mergedOptions);
  });
}

/**
 * Create a product passport with aggregated credentials
 *
 * @param productClaims Product passport claims
 * @param supplyChainVCs Array of supply chain VCs
 * @param options VC creation options
 * @returns Product passport VC with embedded credential references
 *
 * @example
 * ```typescript
 * const passport = createProductPassportVC(
 *   {
 *     productId: 'PROD-001',
 *     productName: 'Coffee',
 *     credentials: supplyChainVCs.map(vc => ({
 *       type: vc.type[1],
 *       id: vc.id,
 *       issuedAt: vc.issuanceDate,
 *       issuer: vc.issuer,
 *     })),
 *   },
 *   supplyChainVCs,
 *   { issuer: 'did:key:z6Mkf...' }
 * );
 * ```
 */
export function createProductPassportVC(
  productClaims: any,
  supplyChainVCs: TemplateBasedVC[],
  options: VCCreateOptions
): TemplateBasedVC {
  // Validate product passport claims
  const template = getTemplate('product-passport');
  if (!template) {
    throw new Error('Product passport template not found');
  }

  // Add credential references
  const credentials = supplyChainVCs.map((vc) => ({
    type: vc.type[1] || 'VerifiableCredential',
    id: vc.id || 'unknown',
    issuedAt: vc.issuanceDate,
    issuer: vc.issuer,
  }));

  const enrichedClaims = {
    ...productClaims,
    credentials,
  };

  return createVCFromTemplate('product-passport', enrichedClaims, options);
}

/**
 * Extract template information from a VC
 *
 * @param vc Verifiable Credential
 * @returns Template metadata or null
 */
export function extractTemplateInfo(vc: any): {
  templateId: string;
  templateName: string;
} | null {
  if (vc.templateId && vc.templateName) {
    return {
      templateId: vc.templateId,
      templateName: vc.templateName,
    };
  }
  return null;
}

/**
 * Validate VC against its template
 *
 * @param vc Verifiable Credential
 * @returns Validation result
 */
export function validateVCAgainstTemplate(vc: TemplateBasedVC): {
  valid: boolean;
  errors?: string[];
} {
  const errors: string[] = [];

  // Check required W3C fields
  if (!vc['@context']) errors.push('Missing @context');
  if (!vc.type || !Array.isArray(vc.type)) errors.push('Missing or invalid type');
  if (!vc.issuer) errors.push('Missing issuer');
  if (!vc.issuanceDate) errors.push('Missing issuanceDate');
  if (!vc.credentialSubject) errors.push('Missing credentialSubject');

  // Check template fields
  if (!vc.templateId) errors.push('Missing templateId');
  if (!vc.templateName) errors.push('Missing templateName');

  // Validate claims against template
  if (vc.templateId) {
    try {
      const { id, ...claims } = vc.credentialSubject;
      const validation = validateClaims(vc.templateId, claims);
      if (!validation.success) {
        errors.push(`Claims validation failed: ${validation.errors?.message}`);
      }
    } catch (error) {
      errors.push(`Template validation error: ${error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Create a supply chain batch VC package
 *
 * @param productInfo Product information
 * @param supplyChainData Array of supply chain step data
 * @param issuer Issuer DID
 * @returns Complete supply chain VC package
 *
 * @example
 * ```typescript
 * const package = createSupplyChainPackage(
 *   { productId: 'COFFEE-001', productName: 'Ethiopian Coffee' },
 *   [
 *     { templateId: 'farm-origin', claims: farmData },
 *     { templateId: 'processing', claims: processingData },
 *   ],
 *   'did:key:z6Mkf...'
 * );
 * ```
 */
export function createSupplyChainPackage(
  productInfo: {
    productId: string;
    productName: string;
    productType: string;
    manufacturer: string;
  },
  supplyChainData: Array<{ templateId: string; claims: any }>,
  issuer: string
): {
  supplyChainVCs: TemplateBasedVC[];
  productPassport: TemplateBasedVC;
} {
  // Create supply chain VCs
  const supplyChainVCs = createMultipleVCs(supplyChainData, { issuer });

  // Create product passport
  const passportClaims = {
    ...productInfo,
    credentials: supplyChainVCs.map((vc) => ({
      type: vc.type[1] || 'VerifiableCredential',
      id: vc.id || `vc-${Date.now()}`,
      issuedAt: vc.issuanceDate,
      issuer: vc.issuer,
    })),
    lifecycle: {
      manufacturedDate: new Date().toISOString().split('T')[0],
    },
  };

  const productPassport = createVCFromTemplate(
    'product-passport',
    passportClaims,
    { issuer }
  );

  return {
    supplyChainVCs,
    productPassport,
  };
}
