'use client';

import { useSession } from 'next-auth/react';
import { Building2, CreditCard, Key, TrendingUp } from 'lucide-react';
import QuickStartWidget from '@/components/onboarding/QuickStartWidget';

export default function DashboardPage() {
  const { data: session } = useSession();

  const stats = [
    {
      name: 'Total Organizations',
      value: '0',
      icon: Building2,
      change: '+0%',
      changeType: 'positive',
    },
    {
      name: 'Active API Keys',
      value: '0',
      icon: Key,
      change: '+0%',
      changeType: 'positive',
    },
    {
      name: 'Total Revenue',
      value: '$0',
      icon: CreditCard,
      change: '+0%',
      changeType: 'positive',
    },
    {
      name: 'API Usage',
      value: '0',
      icon: TrendingUp,
      change: '+0%',
      changeType: 'positive',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session?.user?.name || 'Admin'}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's an overview of your ProofPass platform
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="overflow-hidden rounded-lg bg-white p-6 shadow"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'positive'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <QuickStartWidget />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900">
              Recent Activity
            </h2>
            <div className="mt-4">
              <p className="text-sm text-gray-500">
                No recent activity to display
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900">
              Quick Actions
            </h2>
            <div className="mt-4 space-y-2">
              <button className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                Create Organization
              </button>
              <button className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                Generate API Key
              </button>
              <button className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                Record Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
