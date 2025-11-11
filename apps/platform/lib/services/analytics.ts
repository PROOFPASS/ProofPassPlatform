import apiClient from '../api-client';

export interface AnalyticsOverview {
  total_organizations: number;
  total_revenue: number;
  total_api_requests: number;
  active_api_keys: number;
}

export interface UsageByDay {
  date: string;
  requests: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
}

export interface OrganizationsByPlan {
  plan_name: string;
  plan_slug: string;
  count: number;
}

export interface RecentActivity {
  id: string;
  type: 'organization_created' | 'payment_received' | 'api_key_generated' | 'api_key_revoked';
  description: string;
  timestamp: string;
  metadata?: any;
}

// Client-side credential analytics
export interface CredentialStats {
  total: number;
  active: number;
  revoked: number;
  expired: number;
  byType: {
    identity: number;
    education: number;
    employment: number;
    license: number;
    age_verification: number;
  };
}

export interface VerificationStats {
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  verificationsThisMonth: number;
  verificationsThisWeek: number;
  verificationsByDay: Array<{
    date: string;
    count: number;
  }>;
}

export interface ActivityTimeline {
  id: string;
  type: 'credential_issued' | 'credential_revoked' | 'credential_verified' | 'credential_shared' | 'passport_created';
  title: string;
  description: string;
  timestamp: string;
  credentialId?: string;
  metadata?: Record<string, any>;
}

export interface CredentialAnalyticsDashboard {
  credentialStats: CredentialStats;
  verificationStats: VerificationStats;
  recentActivity: ActivityTimeline[];
  popularCredentials: Array<{
    id: string;
    title: string;
    type: string;
    verificationCount: number;
  }>;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export const analyticsService = {
  // Admin Analytics
  // Get overview stats
  async getOverview(): Promise<AnalyticsOverview> {
    const response = await apiClient.get('/admin/analytics/overview');
    return response.data;
  },

  // Get API usage by day
  async getUsageByDay(days: number = 30): Promise<UsageByDay[]> {
    const response = await apiClient.get('/admin/analytics/usage-by-day', {
      params: { days }
    });
    return response.data;
  },

  // Get revenue by month
  async getRevenueByMonth(months: number = 12): Promise<RevenueByMonth[]> {
    const response = await apiClient.get('/admin/analytics/revenue-by-month', {
      params: { months }
    });
    return response.data;
  },

  // Get organizations distribution by plan
  async getOrganizationsByPlan(): Promise<OrganizationsByPlan[]> {
    const response = await apiClient.get('/admin/analytics/organizations-by-plan');
    return response.data;
  },

  // Get recent activity feed
  async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
    const response = await apiClient.get('/admin/analytics/recent-activity', {
      params: { limit }
    });
    return response.data;
  },

  // Client Credential Analytics
  /**
   * Get complete credential analytics dashboard data
   */
  async getCredentialDashboard(params?: DateRangeParams): Promise<CredentialAnalyticsDashboard> {
    try {
      const response = await apiClient.get('/client/analytics/dashboard', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching credential analytics:', error);
      // Return empty dashboard on error
      return {
        credentialStats: {
          total: 0,
          active: 0,
          revoked: 0,
          expired: 0,
          byType: {
            identity: 0,
            education: 0,
            employment: 0,
            license: 0,
            age_verification: 0,
          },
        },
        verificationStats: {
          totalVerifications: 0,
          successfulVerifications: 0,
          failedVerifications: 0,
          verificationsThisMonth: 0,
          verificationsThisWeek: 0,
          verificationsByDay: [],
        },
        recentActivity: [],
        popularCredentials: [],
      };
    }
  },

  /**
   * Get credential statistics
   */
  async getCredentialStats(): Promise<CredentialStats> {
    try {
      const response = await apiClient.get('/client/analytics/credentials/stats');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching credential stats:', error);
      return {
        total: 0,
        active: 0,
        revoked: 0,
        expired: 0,
        byType: {
          identity: 0,
          education: 0,
          employment: 0,
          license: 0,
          age_verification: 0,
        },
      };
    }
  },

  /**
   * Get verification statistics
   */
  async getVerificationStats(params?: DateRangeParams): Promise<VerificationStats> {
    try {
      const response = await apiClient.get('/client/analytics/verifications/stats', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching verification stats:', error);
      return {
        totalVerifications: 0,
        successfulVerifications: 0,
        failedVerifications: 0,
        verificationsThisMonth: 0,
        verificationsThisWeek: 0,
        verificationsByDay: [],
      };
    }
  },

  /**
   * Get credential activity timeline
   */
  async getCredentialActivity(limit: number = 10): Promise<ActivityTimeline[]> {
    try {
      const response = await apiClient.get('/client/analytics/activity/recent', {
        params: { limit },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching credential activity:', error);
      return [];
    }
  },

  /**
   * Get popular credentials by verification count
   */
  async getPopularCredentials(limit: number = 5): Promise<Array<{
    id: string;
    title: string;
    type: string;
    verificationCount: number;
  }>> {
    try {
      const response = await apiClient.get('/client/analytics/credentials/popular', {
        params: { limit },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching popular credentials:', error);
      return [];
    }
  },

  /**
   * Get verification trend data for charts
   */
  async getVerificationTrend(days: number = 30): Promise<Array<{
    date: string;
    count: number;
  }>> {
    try {
      const response = await apiClient.get('/client/analytics/verifications/trend', {
        params: { days },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching verification trend:', error);
      return [];
    }
  },

  /**
   * Calculate local stats from attestations (client-side fallback)
   */
  calculateLocalStats(attestations: any[]): CredentialStats {
    const stats: CredentialStats = {
      total: attestations.length,
      active: 0,
      revoked: 0,
      expired: 0,
      byType: {
        identity: 0,
        education: 0,
        employment: 0,
        license: 0,
        age_verification: 0,
      },
    };

    attestations.forEach(att => {
      // Count by status
      const status = att.status.toLowerCase();
      if (status === 'active') stats.active++;
      else if (status === 'revoked') stats.revoked++;
      else if (status === 'expired') stats.expired++;

      // Count by type
      const templateId = att.templateId.toLowerCase();
      if (templateId.includes('identity')) stats.byType.identity++;
      else if (templateId.includes('education')) stats.byType.education++;
      else if (templateId.includes('employment')) stats.byType.employment++;
      else if (templateId.includes('license')) stats.byType.license++;
      else if (templateId.includes('age')) stats.byType.age_verification++;
    });

    return stats;
  },

  /**
   * Format activity timeline for display
   */
  formatActivity(activity: ActivityTimeline): {
    icon: string;
    color: string;
    bgColor: string;
  } {
    const activityConfig = {
      credential_issued: {
        icon: 'CheckCircle',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
      },
      credential_revoked: {
        icon: 'XCircle',
        color: 'text-red-600',
        bgColor: 'bg-red-100',
      },
      credential_verified: {
        icon: 'Shield',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
      },
      credential_shared: {
        icon: 'Share2',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
      },
      passport_created: {
        icon: 'FileText',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
      },
    };

    return activityConfig[activity.type] || {
      icon: 'Circle',
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    };
  },
};
