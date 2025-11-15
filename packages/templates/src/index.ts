/**
 * ProofPass Attestation Templates
 *
 * Pre-defined templates for common attestation types with built-in validation
 *
 * @example
 * ```typescript
 * import { templates, validateClaims } from '@proofpass/templates';
 *
 * // Use a predefined template
 * const claims = {
 *   firstName: 'Alice',
 *   lastName: 'Smith',
 *   dateOfBirth: '1990-01-01',
 *   nationality: 'US'
 * };
 *
 * const result = validateClaims('identity', claims);
 * if (result.success) {
 *   console.log('Valid claims:', result.data);
 * }
 * ```
 */

import { z } from 'zod';

// Base template interface
export interface AttestationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  schema: z.ZodType<any>;
  example: Record<string, any>;
  defaultExpiration?: number; // in seconds
}

// Template validation result
export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
}

/**
 * Identity Template
 * For personal identity attestations (KYC, etc.)
 */
export const identitySchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  nationality: z.string().length(2, 'Must be ISO 3166-1 alpha-2 country code'),
  idNumber: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const identityTemplate: AttestationTemplate = {
  id: 'identity',
  name: 'Identity Verification',
  description: 'Personal identity attestation for KYC/AML compliance',
  category: 'Identity',
  schema: identitySchema,
  example: {
    firstName: 'Alice',
    lastName: 'Smith',
    dateOfBirth: '1990-01-01',
    nationality: 'US',
    email: 'alice@example.com'
  },
  defaultExpiration: 365 * 24 * 60 * 60 // 1 year
};

/**
 * Education Template
 * For academic credentials
 */
export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.enum(['associate', 'bachelor', 'master', 'doctorate', 'certificate', 'diploma']),
  fieldOfStudy: z.string().min(1, 'Field of study is required'),
  graduationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gpa: z.number().min(0).max(4).optional(),
  honors: z.string().optional(),
  studentId: z.string().optional(),
});

export const educationTemplate: AttestationTemplate = {
  id: 'education',
  name: 'Educational Credential',
  description: 'Academic degrees and certificates',
  category: 'Education',
  schema: educationSchema,
  example: {
    institution: 'MIT',
    degree: 'bachelor',
    fieldOfStudy: 'Computer Science',
    graduationDate: '2024-05-15',
    gpa: 3.8
  },
  defaultExpiration: undefined // No expiration
};

/**
 * Employment Template
 * For work history and employment verification
 */
export const employmentSchema = z.object({
  employer: z.string().min(1, 'Employer is required'),
  position: z.string().min(1, 'Position is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  responsibilities: z.array(z.string()).optional(),
  department: z.string().optional(),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'intern']).optional(),
});

export const employmentTemplate: AttestationTemplate = {
  id: 'employment',
  name: 'Employment Verification',
  description: 'Work history and employment status',
  category: 'Employment',
  schema: employmentSchema,
  example: {
    employer: 'Acme Corp',
    position: 'Senior Developer',
    startDate: '2020-01-01',
    endDate: '2024-01-01',
    employmentType: 'full-time'
  },
  defaultExpiration: 2 * 365 * 24 * 60 * 60 // 2 years
};

/**
 * License Template
 * For professional licenses and certifications
 */
export const licenseSchema = z.object({
  type: z.string().min(1, 'License type is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  issuingAuthority: z.string().min(1, 'Issuing authority is required'),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['active', 'expired', 'suspended', 'revoked']),
  restrictions: z.array(z.string()).optional(),
});

export const licenseTemplate: AttestationTemplate = {
  id: 'license',
  name: 'Professional License',
  description: 'Professional licenses and certifications',
  category: 'License',
  schema: licenseSchema,
  example: {
    type: 'Medical License',
    licenseNumber: 'MD-12345',
    issuingAuthority: 'State Medical Board',
    issueDate: '2015-06-01',
    expirationDate: '2025-06-01',
    status: 'active'
  },
  defaultExpiration: undefined // Based on expirationDate
};

/**
 * Age Verification Template
 * For age-gated access
 */
export const ageVerificationSchema = z.object({
  over18: z.boolean(),
  over21: z.boolean().optional(),
  verificationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  verificationMethod: z.enum(['id-document', 'biometric', 'third-party']),
});

export const ageVerificationTemplate: AttestationTemplate = {
  id: 'age-verification',
  name: 'Age Verification',
  description: 'Age verification for age-gated content',
  category: 'Identity',
  schema: ageVerificationSchema,
  example: {
    over18: true,
    over21: true,
    verificationDate: '2024-01-01',
    verificationMethod: 'id-document'
  },
  defaultExpiration: 30 * 24 * 60 * 60 // 30 days
};

// Import extended templates
import { supplyChainTemplates } from './supply-chain-templates';
import { productPassportTemplate } from './product-passport-template';
import { healthCertificationTemplates } from './health-certification-templates';

/**
 * All templates registry
 */
export const templates: Record<string, AttestationTemplate> = {
  // Core templates
  identity: identityTemplate,
  education: educationTemplate,
  employment: employmentTemplate,
  license: licenseTemplate,
  'age-verification': ageVerificationTemplate,

  // Supply chain templates
  ...supplyChainTemplates,

  // Product passport
  'product-passport': productPassportTemplate,

  // Health and certification templates
  ...healthCertificationTemplates,
};

/**
 * Validate claims against a template
 */
export function validateClaims<T = any>(
  templateId: string,
  claims: unknown
): ValidationResult<T> {
  const template = templates[templateId];

  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  try {
    const data = template.schema.parse(claims);
    return {
      success: true,
      data: data as T
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error
      };
    }
    throw error;
  }
}

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): AttestationTemplate | undefined {
  return templates[templateId];
}

/**
 * List all available templates
 */
export function listTemplates(): AttestationTemplate[] {
  return Object.values(templates);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): AttestationTemplate[] {
  return Object.values(templates).filter(t => t.category === category);
}

/**
 * Create a custom template
 */
export function createCustomTemplate(
  id: string,
  template: Omit<AttestationTemplate, 'id'>
): AttestationTemplate {
  const customTemplate: AttestationTemplate = {
    id,
    ...template
  };

  templates[id] = customTemplate;
  return customTemplate;
}

// Export types
export type {
  z as ZodType
};

export type IdentityClaims = z.infer<typeof identitySchema>;
export type EducationClaims = z.infer<typeof educationSchema>;
export type EmploymentClaims = z.infer<typeof employmentSchema>;
export type LicenseClaims = z.infer<typeof licenseSchema>;
export type AgeVerificationClaims = z.infer<typeof ageVerificationSchema>;

// Re-export supply chain templates and types
export * from './supply-chain-templates';

// Re-export product passport template and types
export * from './product-passport-template';

// Re-export health and certification templates and types
export * from './health-certification-templates';

// Re-export batch creation utilities
export * from './batch-creation';

// Re-export VC integration helpers
export * from './vc-integration';
