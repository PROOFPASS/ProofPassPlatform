'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users, Key, DollarSign, Activity, Clock } from 'lucide-react';
import { analyticsService } from '@/lib/services/analytics';
import type {
  AnalyticsOverview,
  UsageByDay,
  RevenueByMonth,
  OrganizationsByPlan,
  RecentActivity,
} from '@/lib/services/analytics';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [usageByDay, setUsageByDay] = useState<UsageByDay[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<RevenueByMonth[]>([]);
  const [organizationsByPlan, setOrganizationsByPlan] = useState<OrganizationsByPlan[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewData, usageData, revenueData, plansData, activityData] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getUsageByDay(30),
        analyticsService.getRevenueByMonth(6),
        analyticsService.getOrganizationsByPlan(),
        analyticsService.getRecentActivity(10),
      ]);

      setOverview(overviewData);
      setUsageByDay(usageData);
      setRevenueByMonth(revenueData);
      setOrganizationsByPlan(plansData);
      setRecentActivity(activityData);
    } catch (err: any) {
      setError(err.message || 'Error al cargar analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'organization_created':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'payment_received':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'api_key_generated':
        return <Key className="h-5 w-5 text-purple-600" />;
      case 'api_key_revoked':
        return <Key className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityColor = (type: RecentActivity['type']) => {
    switch (type) {
      case 'organization_created':
        return 'bg-blue-100';
      case 'payment_received':
        return 'bg-green-100';
      case 'api_key_generated':
        return 'bg-purple-100';
      case 'api_key_revoked':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getPlanColor = (slug: string) => {
    switch (slug) {
      case 'free':
        return 'bg-gray-500';
      case 'pro':
        return 'bg-blue-500';
      case 'enterprise':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
          <p className="mt-4 text-sm text-gray-600">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Métricas y estadísticas de la plataforma
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Organizaciones</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatNumber(overview?.total_organizations || 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue Total</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatCurrency(overview?.total_revenue || 0)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">API Requests</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatNumber(overview?.total_api_requests || 0)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">API Keys Activas</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {formatNumber(overview?.active_api_keys || 0)}
              </p>
            </div>
            <Key className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* API Usage Chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Uso de API (últimos 30 días)</h2>
          </div>
          <div className="space-y-2">
            {usageByDay.slice(-10).map((day, index) => {
              const maxRequests = Math.max(...usageByDay.map(d => d.requests));
              const percentage = maxRequests > 0 ? (day.requests / maxRequests) * 100 : 0;

              return (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-20">
                    {new Date(day.date).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-8 bg-gray-200 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-purple-500 flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 15 && (
                        <span className="text-xs font-medium text-white">
                          {formatNumber(day.requests)}
                        </span>
                      )}
                    </div>
                  </div>
                  {percentage <= 15 && (
                    <span className="text-xs font-medium text-gray-900 w-16 text-right">
                      {formatNumber(day.requests)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Revenue (últimos 6 meses)</h2>
          </div>
          <div className="space-y-2">
            {revenueByMonth.map((month, index) => {
              const maxRevenue = Math.max(...revenueByMonth.map(m => m.revenue));
              const percentage = maxRevenue > 0 ? (month.revenue / maxRevenue) * 100 : 0;

              return (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-20">
                    {month.month}
                  </span>
                  <div className="flex-1 h-8 bg-gray-200 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-green-500 flex items-center justify-end pr-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    >
                      {percentage > 20 && (
                        <span className="text-xs font-medium text-white">
                          {formatCurrency(month.revenue)}
                        </span>
                      )}
                    </div>
                  </div>
                  {percentage <= 20 && (
                    <span className="text-xs font-medium text-gray-900 w-24 text-right">
                      {formatCurrency(month.revenue)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Organizations by Plan and Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Organizations by Plan */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Distribución por Plan</h2>
          </div>
          <div className="space-y-4">
            {organizationsByPlan.map((plan, index) => {
              const total = organizationsByPlan.reduce((sum, p) => sum + p.count, 0);
              const percentage = total > 0 ? (plan.count / total) * 100 : 0;

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${getPlanColor(plan.plan_slug)}`}></div>
                      <span className="text-sm font-medium text-gray-900">{plan.plan_name}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {plan.count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getPlanColor(plan.plan_slug)} transition-all`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Actividad Reciente</h2>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`flex-shrink-0 p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.timestamp).toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
