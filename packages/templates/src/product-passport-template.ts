/**
 * Digital Product Passport Template
 *
 * Aggregates multiple credentials into a comprehensive product passport
 */

import { z } from 'zod';
import type { AttestationTemplate } from './index';

/**
 * Product Passport Template
 * Comprehensive product information aggregating supply chain credentials
 */
export const productPassportSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  productName: z.string().min(1, 'Product name is required'),
  productType: z.string().min(1, 'Product type is required'),
  manufacturer: z.string().min(1, 'Manufacturer is required'),

  // Product details
  description: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  barcodes: z.object({
    gtin: z.string().optional(), // Global Trade Item Number
    upc: z.string().optional(),
    ean: z.string().optional(),
    qrCode: z.string().optional(),
  }).optional(),

  // Supply chain credentials
  credentials: z.array(z.object({
    type: z.string(),
    id: z.string(),
    issuedAt: z.string(),
    issuer: z.string(),
  })),

  // Blockchain anchoring
  blockchain: z.object({
    network: z.enum(['stellar-testnet', 'stellar-mainnet', 'ethereum', 'polygon']),
    transactionId: z.string(),
    timestamp: z.string(),
    blockNumber: z.number().optional(),
  }).optional(),

  // Sustainability info
  sustainability: z.object({
    carbonFootprint: z.number().optional(), // kg CO2
    waterUsage: z.number().optional(), // liters
    recyclable: z.boolean().optional(),
    certifications: z.array(z.string()).optional(),
  }).optional(),

  // Compliance
  compliance: z.object({
    regulations: z.array(z.string()).optional(),
    safetyStandards: z.array(z.string()).optional(),
    certifications: z.array(z.string()).optional(),
  }).optional(),

  // Lifecycle
  lifecycle: z.object({
    manufacturedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    warrantyPeriod: z.number().optional(), // days
  }),

  // Additional metadata
  metadata: z.record(z.any()).optional(),
});

export const productPassportTemplate: AttestationTemplate = {
  id: 'product-passport',
  name: 'Digital Product Passport',
  description: 'Comprehensive product information with supply chain traceability',
  category: 'Product',
  schema: productPassportSchema,
  example: {
    productId: 'COFFEE-ET-2024-001',
    productName: 'Ethiopian Yirgacheffe Coffee',
    productType: 'Coffee Beans',
    manufacturer: 'Ethiopian Coffee Cooperative',
    description: 'Premium organic coffee beans from Yirgacheffe region',
    barcodes: {
      gtin: '12345678901234',
      qrCode: 'https://proofpass.io/verify/COFFEE-ET-2024-001',
    },
    credentials: [
      {
        type: 'FarmOrigin',
        id: 'vc-farm-001',
        issuedAt: '2024-11-01T00:00:00Z',
        issuer: 'did:key:farm123',
      },
      {
        type: 'Processing',
        id: 'vc-proc-001',
        issuedAt: '2024-11-10T00:00:00Z',
        issuer: 'did:key:proc456',
      },
    ],
    blockchain: {
      network: 'stellar-testnet',
      transactionId: 'abc123...',
      timestamp: '2024-12-01T00:00:00Z',
    },
    sustainability: {
      carbonFootprint: 1.2,
      waterUsage: 140,
      recyclable: true,
      certifications: ['Fair Trade', 'Organic', 'Rainforest Alliance'],
    },
    lifecycle: {
      manufacturedDate: '2024-11-10',
      expirationDate: '2025-11-10',
    },
  },
  defaultExpiration: 3 * 365 * 24 * 60 * 60, // 3 years
};

// Export type
export type ProductPassportClaims = z.infer<typeof productPassportSchema>;
