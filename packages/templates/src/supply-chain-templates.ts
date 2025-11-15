/**
 * Supply Chain Credential Templates
 *
 * Templates for tracking products through the supply chain
 */

import { z } from 'zod';
import type { AttestationTemplate } from './index';

/**
 * Farm/Origin Template
 * For agricultural product origin tracking
 */
export const farmOriginSchema = z.object({
  farmName: z.string().min(1, 'Farm name is required'),
  location: z.object({
    country: z.string().length(2, 'Must be ISO 3166-1 alpha-2 country code'),
    region: z.string(),
    coordinates: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }).optional(),
  }),
  productType: z.string().min(1, 'Product type is required'),
  harvestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  quantity: z.number().positive(),
  unit: z.enum(['kg', 'lbs', 'tons', 'units', 'liters']),
  organicCertified: z.boolean().optional(),
  certifications: z.array(z.string()).optional(),
  batchNumber: z.string().optional(),
});

export const farmOriginTemplate: AttestationTemplate = {
  id: 'farm-origin',
  name: 'Farm Origin',
  description: 'Agricultural product origin and harvest information',
  category: 'SupplyChain',
  schema: farmOriginSchema,
  example: {
    farmName: 'Yirgacheffe Coffee Farm',
    location: {
      country: 'ET',
      region: 'Gedeo Zone, Ethiopia',
      coordinates: {
        latitude: 6.1636,
        longitude: 38.2050,
      },
    },
    productType: 'Coffee Beans',
    harvestDate: '2024-11-01',
    quantity: 1000,
    unit: 'kg',
    organicCertified: true,
    certifications: ['Fair Trade', 'Organic'],
  },
  defaultExpiration: 2 * 365 * 24 * 60 * 60, // 2 years
};

/**
 * Processing Template
 * For product processing and manufacturing
 */
export const processingSchema = z.object({
  facilityName: z.string().min(1, 'Facility name is required'),
  facilityId: z.string().optional(),
  location: z.object({
    country: z.string().length(2),
    city: z.string(),
    address: z.string().optional(),
  }),
  processType: z.string().min(1, 'Process type is required'),
  processDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  inputBatchNumber: z.string().optional(),
  outputBatchNumber: z.string().min(1, 'Output batch number is required'),
  quantity: z.number().positive(),
  unit: z.enum(['kg', 'lbs', 'tons', 'units', 'liters']),
  qualityChecks: z.array(z.object({
    parameter: z.string(),
    value: z.string(),
    passedAt: z.string(),
  })).optional(),
  certifications: z.array(z.string()).optional(),
});

export const processingTemplate: AttestationTemplate = {
  id: 'processing',
  name: 'Processing',
  description: 'Product processing and quality control',
  category: 'SupplyChain',
  schema: processingSchema,
  example: {
    facilityName: 'Ethiopia Coffee Processing Co.',
    location: {
      country: 'ET',
      city: 'Addis Ababa',
    },
    processType: 'Washing and Drying',
    processDate: '2024-11-10',
    inputBatchNumber: 'FARM-2024-001',
    outputBatchNumber: 'PROC-2024-001',
    quantity: 950,
    unit: 'kg',
    qualityChecks: [
      {
        parameter: 'Moisture Content',
        value: '11.5%',
        passedAt: '2024-11-10T14:30:00Z',
      },
    ],
  },
  defaultExpiration: 2 * 365 * 24 * 60 * 60,
};

/**
 * Transport/Shipping Template
 * For logistics and transportation tracking
 */
export const transportSchema = z.object({
  carrier: z.string().min(1, 'Carrier is required'),
  transportMode: z.enum(['air', 'sea', 'road', 'rail']),
  origin: z.object({
    country: z.string().length(2),
    city: z.string(),
    facility: z.string().optional(),
  }),
  destination: z.object({
    country: z.string().length(2),
    city: z.string(),
    facility: z.string().optional(),
  }),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  trackingNumber: z.string().min(1, 'Tracking number is required'),
  batchNumber: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.enum(['kg', 'lbs', 'tons', 'units', 'containers']),
  temperatureControlled: z.boolean().optional(),
  temperatureRange: z.object({
    min: z.number(),
    max: z.number(),
    unit: z.enum(['C', 'F']),
  }).optional(),
  customsCleared: z.boolean().optional(),
});

export const transportTemplate: AttestationTemplate = {
  id: 'transport',
  name: 'Transport',
  description: 'Logistics and shipping information',
  category: 'SupplyChain',
  schema: transportSchema,
  example: {
    carrier: 'Global Shipping Co.',
    transportMode: 'sea',
    origin: {
      country: 'ET',
      city: 'Djibouti',
      facility: 'Port of Djibouti',
    },
    destination: {
      country: 'US',
      city: 'Seattle',
      facility: 'Seattle Port',
    },
    departureDate: '2024-11-15',
    arrivalDate: '2024-12-05',
    trackingNumber: 'SHIP-2024-12345',
    batchNumber: 'PROC-2024-001',
    quantity: 20,
    unit: 'containers',
    temperatureControlled: true,
    customsCleared: true,
  },
  defaultExpiration: 2 * 365 * 24 * 60 * 60,
};

/**
 * Retail/Distribution Template
 * For final distribution and retail tracking
 */
export const retailSchema = z.object({
  retailer: z.string().min(1, 'Retailer is required'),
  storeName: z.string().optional(),
  location: z.object({
    country: z.string().length(2),
    city: z.string(),
    address: z.string().optional(),
  }),
  receivedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  batchNumber: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.enum(['kg', 'lbs', 'units', 'packages']),
  price: z.object({
    amount: z.number().positive(),
    currency: z.string().length(3), // ISO 4217
  }).optional(),
  qualityInspection: z.object({
    inspectedAt: z.string(),
    passed: z.boolean(),
    notes: z.string().optional(),
  }).optional(),
  shelfLife: z.object({
    expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }).optional(),
});

export const retailTemplate: AttestationTemplate = {
  id: 'retail',
  name: 'Retail Distribution',
  description: 'Final distribution and retail information',
  category: 'SupplyChain',
  schema: retailSchema,
  example: {
    retailer: 'Premium Coffee Roasters',
    storeName: 'Downtown Seattle Store',
    location: {
      country: 'US',
      city: 'Seattle',
      address: '123 Pike St',
    },
    receivedDate: '2024-12-06',
    batchNumber: 'PROC-2024-001',
    quantity: 100,
    unit: 'kg',
    price: {
      amount: 25.99,
      currency: 'USD',
    },
    qualityInspection: {
      inspectedAt: '2024-12-06T10:00:00Z',
      passed: true,
    },
  },
  defaultExpiration: 365 * 24 * 60 * 60, // 1 year
};

// Export all supply chain templates
export const supplyChainTemplates = {
  'farm-origin': farmOriginTemplate,
  'processing': processingTemplate,
  'transport': transportTemplate,
  'retail': retailTemplate,
};

// Export types
export type FarmOriginClaims = z.infer<typeof farmOriginSchema>;
export type ProcessingClaims = z.infer<typeof processingSchema>;
export type TransportClaims = z.infer<typeof transportSchema>;
export type RetailClaims = z.infer<typeof retailSchema>;
