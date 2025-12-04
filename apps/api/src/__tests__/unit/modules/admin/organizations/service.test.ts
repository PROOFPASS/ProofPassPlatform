/**
 * Unit Tests: Admin Organizations Service
 */

import {
  createOrganization,
  listOrganizations,
  getOrganization,
  updateOrganization,
  updateOrganizationPlan,
  updateOrganizationStatus,
} from '../../../../../modules/admin/organizations/service';
import { query } from '../../../../../config/database';

jest.mock('../../../../../config/database', () => ({
  query: jest.fn(),
}));

// Helper functions for mocking
const mockQuery = query as jest.MockedFunction<typeof query>;

function resetMocks() {
  mockQuery.mockReset();
}

function mockDBResponse(rows: any[] = [], rowCount: number | null = null) {
  mockQuery.mockResolvedValueOnce({
    rows,
    rowCount: rowCount !== null ? rowCount : rows.length,
  } as any);
}

function createMockOrganization(overrides: Partial<any> = {}) {
  return {
    id: 'org-123',
    name: 'Test Organization',
    email: 'test@org.com',
    plan_id: 'plan-free',
    status: 'active',
    billing_email: 'billing@org.com',
    subscription_end: new Date('2024-12-31'),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('Organizations Service', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('createOrganization', () => {
    it('should create organization with free plan by default', async () => {
      const freePlanId = 'plan-free-123';

      // First query: get free plan
      mockDBResponse([{ id: freePlanId }]);

      // Second query: insert organization
      mockDBResponse([createMockOrganization({ id: 'org-123', plan_id: freePlanId })]);

      const result = await createOrganization({
        name: 'Test Org',
        email: 'test@org.com',
      });

      expect(result.id).toBe('org-123');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id FROM plans WHERE slug'),
        ['free']
      );
    });

    it('should create organization with specified plan', async () => {
      const proPlanId = 'plan-pro-123';

      mockDBResponse([createMockOrganization({ id: 'org-123', plan_id: proPlanId })]);

      const result = await createOrganization({
        name: 'Test Org',
        email: 'test@org.com',
        plan_id: proPlanId,
      });

      expect(result.plan_id).toBe(proPlanId);
    });
  });

  describe('listOrganizations', () => {
    it('should return organizations with pagination', async () => {
      // Count query
      mockDBResponse([{ total: '5' }]);

      // List query
      mockDBResponse([
        createMockOrganization({ id: 'org-1' }),
        createMockOrganization({ id: 'org-2' }),
      ]);

      const result = await listOrganizations({ limit: 10, offset: 0 });

      expect(result.organizations).toHaveLength(2);
      expect(result.total).toBe(5);
    });

    it('should filter by status', async () => {
      mockDBResponse([{ total: '1' }]);
      mockDBResponse([createMockOrganization({ status: 'suspended' })]);

      await listOrganizations({ status: 'suspended' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE o.status'),
        expect.arrayContaining(['suspended'])
      );
    });

    it('should filter by plan', async () => {
      mockDBResponse([{ total: '1' }]);
      mockDBResponse([createMockOrganization()]);

      await listOrganizations({ plan: 'pro' });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE p.slug'),
        expect.arrayContaining(['pro'])
      );
    });
  });

  describe('getOrganization', () => {
    it('should return organization by ID', async () => {
      const org = createMockOrganization({ id: 'org-123' });
      mockDBResponse([org]);

      const result = await getOrganization('org-123');

      expect(result).toEqual(org);
    });

    it('should return null if not found', async () => {
      mockDBResponse([]);

      const result = await getOrganization('org-nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateOrganization', () => {
    it('should update organization fields', async () => {
      const updated = createMockOrganization({ name: 'Updated Name' });
      mockDBResponse([updated]);

      const result = await updateOrganization('org-123', {
        name: 'Updated Name',
        billing_email: 'new@email.com',
      });

      expect(result.name).toBe('Updated Name');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE organizations'),
        expect.any(Array)
      );
    });

    it('should throw if no fields to update', async () => {
      await expect(updateOrganization('org-123', {})).rejects.toThrow('No fields to update');
    });

    it('should throw if organization not found', async () => {
      mockDBResponse([]);

      await expect(updateOrganization('org-123', { name: 'New' })).rejects.toThrow(
        'Organization not found'
      );
    });
  });

  describe('updateOrganizationPlan', () => {
    it('should update plan and subscription end', async () => {
      const newEnd = new Date('2025-12-31');
      mockDBResponse([createMockOrganization({ subscription_end: newEnd })]);

      const result = await updateOrganizationPlan('org-123', 'plan-pro', newEnd);

      expect(result.subscription_end).toEqual(newEnd);
    });

    it('should throw if organization not found', async () => {
      mockDBResponse([]);

      await expect(updateOrganizationPlan('org-123', 'plan-pro')).rejects.toThrow(
        'Organization not found'
      );
    });
  });

  describe('updateOrganizationStatus', () => {
    it('should update status to suspended', async () => {
      mockDBResponse([createMockOrganization({ status: 'suspended' })]);

      const result = await updateOrganizationStatus('org-123', 'suspended');

      expect(result.status).toBe('suspended');
    });

    it('should update status to active', async () => {
      mockDBResponse([createMockOrganization({ status: 'active' })]);

      const result = await updateOrganizationStatus('org-123', 'active');

      expect(result.status).toBe('active');
    });
  });
});
