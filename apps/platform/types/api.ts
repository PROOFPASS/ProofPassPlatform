// API Types for ProofPass Platform

export type OrganizationStatus = 'active' | 'suspended' | 'cancelled';
export type PlanSlug = 'free' | 'pro' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  email: string;
  billing_email?: string;
  billing_contact?: string;
  billing_address?: string;
  tax_id?: string;
  country: string;
  payment_method?: string;
  payment_notes?: string;
  notes?: string;
  plan_id: string;
  plan_name: string;
  plan_slug: PlanSlug;
  status: OrganizationStatus;
  subscription_start: string;
  subscription_end: string;
  requests_per_day: number;
  blockchain_ops_per_month: number;
  api_key_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationListItem {
  id: string;
  name: string;
  email: string;
  plan_name: string;
  plan_slug: PlanSlug;
  status: OrganizationStatus;
  api_key_count: number;
  created_at: string;
}

export interface OrganizationsListResponse {
  organizations: OrganizationListItem[];
  total: number;
}

export interface CreateOrganizationDto {
  name: string;
  email: string;
  plan_id?: string;
  billing_email?: string;
  billing_contact?: string;
  country: string;
  subscription_start?: string;
  subscription_end?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  billing_email?: string;
  billing_address?: string;
  tax_id?: string;
  country?: string;
  payment_method?: string;
  payment_notes?: string;
  notes?: string;
}

export interface ChangePlanDto {
  plan_id: string;
  subscription_end: string;
}

export interface ChangeStatusDto {
  status: OrganizationStatus;
}

export interface OrganizationUsage {
  today: {
    total_requests: number;
    blockchain_ops: number;
    attestations_created: number;
    total_credits_used: number;
  };
  this_month: {
    total_requests: number;
    blockchain_ops: number;
    attestations_created: number;
    total_credits_used: number;
  };
  daily_usage: Array<{
    date: string;
    total_requests: number;
    blockchain_ops: number;
  }>;
}

// Plans
export interface Plan {
  id: string;
  name: string;
  slug: PlanSlug;
  price: number;
  currency: string;
  billing_period: string;
  requests_per_day: number;
  blockchain_ops_per_month: number;
  storage_gb: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

// Payments
export type PaymentStatus = 'pending' | 'confirmed' | 'failed';
export type PaymentMethod = 'Transferencia' | 'Efectivo' | 'Crypto';

export interface Payment {
  id: string;
  organization_id: string;
  organization_name: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
  status: PaymentStatus;
  paid_at?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentDto {
  organization_id: string;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
  paid_at?: string;
}

// API Keys
export type APIKeyEnvironment = 'live' | 'test';
export type APIKeyStatus = 'active' | 'inactive';

export interface APIKey {
  id: string;
  organization_id: string;
  organization_name: string;
  name: string;
  prefix: string;
  environment: APIKeyEnvironment;
  status: APIKeyStatus;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface GenerateAPIKeyDto {
  organization_id: string;
  name: string;
  environment: APIKeyEnvironment;
  expires_at?: string;
}

export interface APIKeyWithSecret extends APIKey {
  key: string; // Full API key, only shown once
}

// Generic API Response
export interface APIResponse<T> {
  data: T;
  message?: string;
}

export interface APIError {
  error: string;
  message: string;
  statusCode: number;
}

// Filters
export interface OrganizationFilters {
  status?: OrganizationStatus;
  plan?: PlanSlug;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  organization_id?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export interface APIKeyFilters {
  organization_id?: string;
  environment?: APIKeyEnvironment;
  status?: APIKeyStatus;
  limit?: number;
  offset?: number;
}
