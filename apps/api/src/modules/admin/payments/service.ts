/**
 * Admin - Payments Service
 * Manual payment registration and tracking
 */

import { query } from '../../../config/database';

export interface Payment {
  id: string;
  organization_id: string;
  amount: number;
  currency: string;
  payment_date: Date;
  payment_method: string;
  reference_number?: string;
  period_start?: Date;
  period_end?: Date;
  status: 'pending' | 'confirmed' | 'rejected';
  notes?: string;
  proof_url?: string;
  recorded_by?: string;
  confirmed_by?: string;
  confirmed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePaymentDTO {
  organization_id: string;
  amount: number;
  currency?: string;
  payment_date: Date;
  payment_method: string;
  reference_number?: string;
  period_start?: Date;
  period_end?: Date;
  notes?: string;
  proof_url?: string;
  auto_extend_subscription?: boolean;
}

/**
 * Register a new payment
 */
export async function createPayment(
  data: CreatePaymentDTO,
  recordedBy: string
): Promise<Payment> {
  const result = await query(`
    INSERT INTO payments (
      organization_id,
      amount,
      currency,
      payment_date,
      payment_method,
      reference_number,
      period_start,
      period_end,
      status,
      notes,
      proof_url,
      recorded_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmed', $9, $10, $11)
    RETURNING *
  `, [
    data.organization_id,
    data.amount,
    data.currency || 'USD',
    data.payment_date,
    data.payment_method,
    data.reference_number,
    data.period_start,
    data.period_end,
    data.notes,
    data.proof_url,
    recordedBy
  ]);

  const payment = result.rows[0];

  // If auto_extend_subscription is true, update organization subscription_end
  if (data.auto_extend_subscription && data.period_end) {
    await query(`
      UPDATE organizations
      SET subscription_end = $1, updated_at = NOW()
      WHERE id = $2
    `, [data.period_end, data.organization_id]);
  }

  return payment;
}

/**
 * List payments with filters
 */
export async function listPayments(filters?: {
  organization_id?: string;
  status?: string;
  payment_method?: string;
  from_date?: Date;
  to_date?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ payments: Payment[]; total: number }> {
  let queryStr = `
    SELECT
      p.*,
      o.name as organization_name,
      o.email as organization_email,
      u.name as recorded_by_name
    FROM payments p
    JOIN organizations o ON p.organization_id = o.id
    LEFT JOIN users u ON p.recorded_by = u.id
  `;

  const params: any[] = [];
  const conditions: string[] = [];

  if (filters?.organization_id) {
    conditions.push(`p.organization_id = $${params.length + 1}`);
    params.push(filters.organization_id);
  }

  if (filters?.status) {
    conditions.push(`p.status = $${params.length + 1}`);
    params.push(filters.status);
  }

  if (filters?.payment_method) {
    conditions.push(`p.payment_method = $${params.length + 1}`);
    params.push(filters.payment_method);
  }

  if (filters?.from_date) {
    conditions.push(`p.payment_date >= $${params.length + 1}`);
    params.push(filters.from_date);
  }

  if (filters?.to_date) {
    conditions.push(`p.payment_date <= $${params.length + 1}`);
    params.push(filters.to_date);
  }

  if (conditions.length > 0) {
    queryStr += ' WHERE ' + conditions.join(' AND ');
  }

  // Get total count
  const countQuery = await query(
    `SELECT COUNT(*) as total FROM payments p
     ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}`,
    params
  );
  const total = parseInt(countQuery.rows[0].total);

  queryStr += ' ORDER BY p.payment_date DESC, p.created_at DESC';

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
    payments: result.rows,
    total
  };
}

/**
 * Get payment by ID
 */
export async function getPayment(paymentId: string): Promise<Payment | null> {
  const result = await query(`
    SELECT
      p.*,
      o.name as organization_name,
      o.email as organization_email,
      u.name as recorded_by_name,
      uc.name as confirmed_by_name
    FROM payments p
    JOIN organizations o ON p.organization_id = o.id
    LEFT JOIN users u ON p.recorded_by = u.id
    LEFT JOIN users uc ON p.confirmed_by = uc.id
    WHERE p.id = $1
  `, [paymentId]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: 'pending' | 'confirmed' | 'rejected',
  confirmedBy?: string
): Promise<Payment> {
  const result = await query(`
    UPDATE payments
    SET
      status = $1,
      confirmed_by = $2,
      confirmed_at = CASE WHEN $1 = 'confirmed' THEN NOW() ELSE confirmed_at END,
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
  `, [status, confirmedBy, paymentId]);

  if (result.rows.length === 0) {
    throw new Error('Payment not found');
  }

  return result.rows[0];
}

/**
 * Get payment statistics
 */
export async function getPaymentStats(filters?: {
  organization_id?: string;
  from_date?: Date;
  to_date?: Date;
}): Promise<{
  total_amount: number;
  payment_count: number;
  by_method: Array<{ payment_method: string; total: number; count: number }>;
  by_status: Array<{ status: string; total: number; count: number }>;
}> {
  const params: any[] = [];
  const conditions: string[] = [];

  if (filters?.organization_id) {
    conditions.push(`organization_id = $${params.length + 1}`);
    params.push(filters.organization_id);
  }

  if (filters?.from_date) {
    conditions.push(`payment_date >= $${params.length + 1}`);
    params.push(filters.from_date);
  }

  if (filters?.to_date) {
    conditions.push(`payment_date <= $${params.length + 1}`);
    params.push(filters.to_date);
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

  // Total stats
  const totalResult = await query(`
    SELECT
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(*) as payment_count
    FROM payments
    ${whereClause}
  `, params);

  // By method
  const byMethodResult = await query(`
    SELECT
      payment_method,
      SUM(amount) as total,
      COUNT(*) as count
    FROM payments
    ${whereClause}
    GROUP BY payment_method
    ORDER BY total DESC
  `, params);

  // By status
  const byStatusResult = await query(`
    SELECT
      status,
      SUM(amount) as total,
      COUNT(*) as count
    FROM payments
    ${whereClause}
    GROUP BY status
  `, params);

  return {
    total_amount: parseFloat(totalResult.rows[0].total_amount),
    payment_count: parseInt(totalResult.rows[0].payment_count),
    by_method: byMethodResult.rows,
    by_status: byStatusResult.rows
  };
}

/**
 * Get pending payments (awaiting confirmation)
 */
export async function getPendingPayments(): Promise<Payment[]> {
  const result = await query(`
    SELECT
      p.*,
      o.name as organization_name,
      o.email as organization_email
    FROM payments p
    JOIN organizations o ON p.organization_id = o.id
    WHERE p.status = 'pending'
    ORDER BY p.created_at ASC
  `);

  return result.rows;
}
