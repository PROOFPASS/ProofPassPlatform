/**
 * Admin - Organizations Service
 * Manage customer organizations
 */

import { query } from '../../../config/database';

export interface Organization {
  id: string;
  name: string;
  email: string;
  domain?: string;
  plan_id: string;
  status: 'active' | 'suspended' | 'cancelled';
  billing_email?: string;
  billing_contact?: string;
  billing_address?: string;
  tax_id?: string;
  country?: string;
  payment_method?: string;
  payment_notes?: string;
  subscription_start?: Date;
  subscription_end?: Date;
  custom_request_limit?: number;
  custom_blockchain_limit?: number;
  notes?: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrganizationDTO {
  name: string;
  email: string;
  plan_id?: string;
  billing_email?: string;
  billing_contact?: string;
  country?: string;
  subscription_start?: Date;
  subscription_end?: Date;
}

export interface UpdateOrganizationDTO {
  name?: string;
  billing_email?: string;
  billing_contact?: string;
  billing_address?: string;
  tax_id?: string;
  country?: string;
  payment_method?: string;
  payment_notes?: string;
  notes?: string;
}

/**
 * Create a new organization
 */
export async function createOrganization(data: CreateOrganizationDTO): Promise<Organization> {
  // Get free plan ID if not specified
  let planId = data.plan_id;
  if (!planId) {
    const freePlan = await query('SELECT id FROM plans WHERE slug = $1', ['free']);
    planId = freePlan.rows[0].id;
  }

  const result = await query(`
    INSERT INTO organizations (
      name,
      email,
      plan_id,
      billing_email,
      billing_contact,
      country,
      subscription_start,
      subscription_end,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active')
    RETURNING *
  `, [
    data.name,
    data.email,
    planId,
    data.billing_email || data.email,
    data.billing_contact,
    data.country,
    data.subscription_start || new Date(),
    data.subscription_end
  ]);

  return result.rows[0];
}

/**
 * List organizations with filters
 */
export async function listOrganizations(filters?: {
  status?: string;
  plan?: string;
  limit?: number;
  offset?: number;
}): Promise<{ organizations: Organization[]; total: number }> {
  let queryStr = `
    SELECT
      o.*,
      p.name as plan_name,
      p.slug as plan_slug,
      COUNT(DISTINCT u.id) as user_count,
      COUNT(DISTINCT ak.id) as api_key_count
    FROM organizations o
    JOIN plans p ON o.plan_id = p.id
    LEFT JOIN users u ON o.id = u.organization_id
    LEFT JOIN api_keys ak ON o.id = ak.organization_id AND ak.is_active = true
  `;

  const params: any[] = [];
  const conditions: string[] = [];

  if (filters?.status) {
    conditions.push(`o.status = $${params.length + 1}`);
    params.push(filters.status);
  }

  if (filters?.plan) {
    conditions.push(`p.slug = $${params.length + 1}`);
    params.push(filters.plan);
  }

  if (conditions.length > 0) {
    queryStr += ' WHERE ' + conditions.join(' AND ');
  }

  queryStr += ' GROUP BY o.id, p.name, p.slug ORDER BY o.created_at DESC';

  // Get total count
  const countQuery = await query(
    `SELECT COUNT(*) as total FROM organizations o
     JOIN plans p ON o.plan_id = p.id
     ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}`,
    params
  );
  const total = parseInt(countQuery.rows[0].total);

  // Apply pagination
  if (filters?.limit) {
    queryStr += ` LIMIT $${params.length + 1}`;
    params.push(filters.limit);
  }

  if (filters?.offset) {
    queryStr += ` OFFSET $${params.length + 1}`;
    params.push(filters.offset);
  }

  const result = await query(queryStr, params);

  return {
    organizations: result.rows,
    total
  };
}

/**
 * Get organization by ID
 */
export async function getOrganization(orgId: string): Promise<Organization | null> {
  const result = await query(`
    SELECT
      o.*,
      p.name as plan_name,
      p.slug as plan_slug,
      p.price_monthly,
      p.requests_per_day,
      p.blockchain_ops_per_month
    FROM organizations o
    JOIN plans p ON o.plan_id = p.id
    WHERE o.id = $1
  `, [orgId]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Update organization
 */
export async function updateOrganization(
  orgId: string,
  data: UpdateOrganizationDTO
): Promise<Organization> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  fields.push(`updated_at = NOW()`);
  values.push(orgId);

  const result = await query(`
    UPDATE organizations
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, values);

  if (result.rows.length === 0) {
    throw new Error('Organization not found');
  }

  return result.rows[0];
}

/**
 * Update organization plan
 */
export async function updateOrganizationPlan(
  orgId: string,
  newPlanId: string,
  subscriptionEnd?: Date
): Promise<Organization> {
  const result = await query(`
    UPDATE organizations
    SET
      plan_id = $1,
      subscription_end = $2,
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `, [newPlanId, subscriptionEnd, orgId]);

  if (result.rows.length === 0) {
    throw new Error('Organization not found');
  }

  return result.rows[0];
}

/**
 * Update organization status
 */
export async function updateOrganizationStatus(
  orgId: string,
  status: 'active' | 'suspended' | 'cancelled'
): Promise<Organization> {
  const result = await query(`
    UPDATE organizations
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
  `, [status, orgId]);

  if (result.rows.length === 0) {
    throw new Error('Organization not found');
  }

  return result.rows[0];
}

/**
 * Get organization usage statistics
 */
export async function getOrganizationUsage(orgId: string): Promise<{
  today: any;
  month: any;
  history: any[];
}> {
  // Usage today
  const todayResult = await query(`
    SELECT * FROM usage_aggregates
    WHERE organization_id = $1 AND date = CURRENT_DATE
  `, [orgId]);

  // Usage this month
  const monthResult = await query(`
    SELECT
      SUM(total_requests) as total_requests,
      SUM(blockchain_ops) as blockchain_ops,
      SUM(attestations_created) as attestations_created,
      SUM(total_credits_used) as total_credits_used,
      AVG(requests_2xx::float / NULLIF(total_requests, 0) * 100) as success_rate
    FROM usage_aggregates
    WHERE organization_id = $1
      AND date >= DATE_TRUNC('month', CURRENT_DATE)
  `, [orgId]);

  // History last 30 days
  const historyResult = await query(`
    SELECT
      date,
      total_requests,
      blockchain_ops,
      attestations_created,
      total_credits_used,
      requests_2xx,
      requests_4xx,
      requests_5xx
    FROM usage_aggregates
    WHERE organization_id = $1
      AND date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY date DESC
  `, [orgId]);

  return {
    today: todayResult.rows[0] || {
      total_requests: 0,
      blockchain_ops: 0,
      attestations_created: 0,
      total_credits_used: 0
    },
    month: monthResult.rows[0] || {
      total_requests: 0,
      blockchain_ops: 0,
      attestations_created: 0,
      total_credits_used: 0,
      success_rate: 0
    },
    history: historyResult.rows
  };
}

/**
 * Delete organization (soft delete by setting status to cancelled)
 */
export async function deleteOrganization(orgId: string): Promise<void> {
  await query(`
    UPDATE organizations
    SET status = 'cancelled', updated_at = NOW()
    WHERE id = $1
  `, [orgId]);
}
