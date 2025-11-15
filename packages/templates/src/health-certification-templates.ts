/**
 * Health and Certification Templates
 *
 * Templates for health credentials and professional certifications
 */

import { z } from 'zod';
import type { AttestationTemplate } from './index';

/**
 * Health Record Template
 * For medical records and health information
 */
export const healthRecordSchema = z.object({
  recordType: z.enum(['vaccination', 'test-result', 'diagnosis', 'prescription', 'allergy']),
  patientId: z.string().min(1, 'Patient ID is required'),

  // Provider information
  provider: z.object({
    name: z.string(),
    licenseNumber: z.string().optional(),
    facility: z.string().optional(),
  }),

  // Record details
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1, 'Description is required'),

  // Vaccination specific
  vaccination: z.object({
    vaccine: z.string(),
    manufacturer: z.string(),
    lotNumber: z.string(),
    doseNumber: z.number().positive(),
    totalDoses: z.number().positive(),
  }).optional(),

  // Test result specific
  testResult: z.object({
    testType: z.string(),
    result: z.enum(['positive', 'negative', 'inconclusive']),
    value: z.string().optional(),
    unit: z.string().optional(),
    referenceRange: z.string().optional(),
  }).optional(),

  // Privacy
  consentGiven: z.boolean(),
  dataRetentionPeriod: z.number().optional(), // days
});

export const healthRecordTemplate: AttestationTemplate = {
  id: 'health-record',
  name: 'Health Record',
  description: 'Medical records and health information',
  category: 'Health',
  schema: healthRecordSchema,
  example: {
    recordType: 'vaccination',
    patientId: 'PATIENT-12345',
    provider: {
      name: 'Dr. Smith',
      licenseNumber: 'MD-67890',
      facility: 'City Medical Center',
    },
    date: '2024-01-15',
    description: 'COVID-19 Vaccination',
    vaccination: {
      vaccine: 'COVID-19 mRNA',
      manufacturer: 'Pfizer',
      lotNumber: 'LOT123456',
      doseNumber: 1,
      totalDoses: 2,
    },
    consentGiven: true,
    dataRetentionPeriod: 3650, // 10 years
  },
  defaultExpiration: 10 * 365 * 24 * 60 * 60, // 10 years
};

/**
 * Professional Certification Template
 * For professional certifications and training
 */
export const certificationSchema = z.object({
  certificationType: z.string().min(1, 'Certification type is required'),
  certificationName: z.string().min(1, 'Certification name is required'),
  certificationNumber: z.string().min(1, 'Certification number is required'),

  // Issuing organization
  issuingOrganization: z.object({
    name: z.string(),
    accreditationBody: z.string().optional(),
    website: z.string().url().optional(),
  }),

  // Recipient
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientId: z.string().optional(),

  // Dates
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),

  // Certification details
  skillsAcquired: z.array(z.string()).optional(),
  courseDuration: z.number().optional(), // hours
  assessmentScore: z.number().min(0).max(100).optional(),

  // Verification
  verificationUrl: z.string().url().optional(),
  credentialId: z.string().optional(),

  // Status
  status: z.enum(['active', 'expired', 'suspended', 'revoked']),
  renewalRequired: z.boolean().optional(),
});

export const certificationTemplate: AttestationTemplate = {
  id: 'certification',
  name: 'Professional Certification',
  description: 'Professional certifications and training credentials',
  category: 'Certification',
  schema: certificationSchema,
  example: {
    certificationType: 'Technical',
    certificationName: 'Blockchain Developer Certification',
    certificationNumber: 'CERT-BDC-2024-001',
    issuingOrganization: {
      name: 'Blockchain Certification Institute',
      accreditationBody: 'International Standards Organization',
      website: 'https://blockchain-cert.org',
    },
    recipientName: 'Jane Doe',
    recipientId: 'DEV-12345',
    issueDate: '2024-06-15',
    expirationDate: '2027-06-15',
    skillsAcquired: [
      'Smart Contract Development',
      'Blockchain Architecture',
      'Cryptography',
      'Consensus Mechanisms',
    ],
    courseDuration: 120,
    assessmentScore: 95,
    verificationUrl: 'https://blockchain-cert.org/verify/CERT-BDC-2024-001',
    status: 'active',
    renewalRequired: true,
  },
  defaultExpiration: 3 * 365 * 24 * 60 * 60, // 3 years
};

/**
 * Training Completion Template
 * For completed training programs
 */
export const trainingSchema = z.object({
  programName: z.string().min(1, 'Program name is required'),
  programType: z.enum(['course', 'workshop', 'bootcamp', 'seminar', 'certification-program']),

  // Provider
  provider: z.object({
    name: z.string(),
    accredited: z.boolean().optional(),
  }),

  // Participant
  participantName: z.string().min(1, 'Participant name is required'),
  participantId: z.string().optional(),

  // Training details
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.number().positive(), // hours

  // Content
  topics: z.array(z.string()),
  learningOutcomes: z.array(z.string()).optional(),

  // Assessment
  assessment: z.object({
    type: z.enum(['exam', 'project', 'presentation', 'none']),
    passed: z.boolean(),
    score: z.number().min(0).max(100).optional(),
  }).optional(),

  // Attendance
  attendanceRate: z.number().min(0).max(100), // percentage

  // Credential
  certificateIssued: z.boolean(),
  certificateNumber: z.string().optional(),
});

export const trainingTemplate: AttestationTemplate = {
  id: 'training',
  name: 'Training Completion',
  description: 'Completed training programs and workshops',
  category: 'Education',
  schema: trainingSchema,
  example: {
    programName: 'Advanced Web3 Development',
    programType: 'bootcamp',
    provider: {
      name: 'Tech Academy',
      accredited: true,
    },
    participantName: 'John Smith',
    participantId: 'STUDENT-789',
    startDate: '2024-09-01',
    completionDate: '2024-11-30',
    duration: 240,
    topics: [
      'Solidity Programming',
      'DeFi Protocols',
      'NFT Development',
      'dApp Architecture',
    ],
    learningOutcomes: [
      'Build and deploy smart contracts',
      'Create decentralized applications',
      'Implement security best practices',
    ],
    assessment: {
      type: 'project',
      passed: true,
      score: 92,
    },
    attendanceRate: 98,
    certificateIssued: true,
    certificateNumber: 'TRAIN-2024-WEB3-789',
  },
  defaultExpiration: 2 * 365 * 24 * 60 * 60, // 2 years
};

// Export all health and certification templates
export const healthCertificationTemplates = {
  'health-record': healthRecordTemplate,
  'certification': certificationTemplate,
  'training': trainingTemplate,
};

// Export types
export type HealthRecordClaims = z.infer<typeof healthRecordSchema>;
export type CertificationClaims = z.infer<typeof certificationSchema>;
export type TrainingClaims = z.infer<typeof trainingSchema>;
