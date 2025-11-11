'use client';

import { Shield, CheckCircle, XCircle, Clock, TrendingUp, Eye, Award, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { type CredentialStats, type VerificationStats } from '@/lib/services/analytics';

interface StatsCardsProps {
  credentialStats: CredentialStats;
  verificationStats?: VerificationStats;
}

interface StatCardData {
  id: string;
  label: string;
  value: number | string;
  icon: any;
  gradient: string;
  bgColor: string;
  textColor: string;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export function StatsCards({ credentialStats, verificationStats }: StatsCardsProps) {
  // Calculate percentages
  const activePercentage = credentialStats.total > 0
    ? Math.round((credentialStats.active / credentialStats.total) * 100)
    : 0;

  const verificationSuccessRate = verificationStats && verificationStats.totalVerifications > 0
    ? Math.round((verificationStats.successfulVerifications / verificationStats.totalVerifications) * 100)
    : 0;

  const primaryStats: StatCardData[] = [
    {
      id: 'total',
      label: 'Total de Credenciales',
      value: credentialStats.total,
      icon: Shield,
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      description: 'Credenciales emitidas',
    },
    {
      id: 'active',
      label: 'Credenciales Activas',
      value: credentialStats.active,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      description: `${activePercentage}% del total`,
    },
    {
      id: 'revoked',
      label: 'Revocadas',
      value: credentialStats.revoked,
      icon: XCircle,
      gradient: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      description: 'Credenciales revocadas',
    },
    {
      id: 'expired',
      label: 'Expiradas',
      value: credentialStats.expired,
      icon: Clock,
      gradient: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      description: 'Fuera de vigencia',
    },
  ];

  const verificationStatsCards: StatCardData[] = verificationStats ? [
    {
      id: 'total_verifications',
      label: 'Verificaciones Totales',
      value: verificationStats.totalVerifications,
      icon: Eye,
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      description: 'Todas las verificaciones',
    },
    {
      id: 'success_rate',
      label: 'Tasa de Éxito',
      value: `${verificationSuccessRate}%`,
      icon: TrendingUp,
      gradient: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      description: `${verificationStats.successfulVerifications} exitosas`,
      trend: {
        value: verificationStats.verificationsThisMonth,
        label: 'este mes',
        isPositive: true,
      },
    },
  ] : [];

  // Type distribution stats
  const typeStats: StatCardData[] = [
    {
      id: 'identity',
      label: 'Identidad',
      value: credentialStats.byType.identity,
      icon: Shield,
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      id: 'education',
      label: 'Educación',
      value: credentialStats.byType.education,
      icon: Award,
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      id: 'employment',
      label: 'Empleo',
      value: credentialStats.byType.employment,
      icon: BarChart3,
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      id: 'license',
      label: 'Licencias',
      value: credentialStats.byType.license,
      icon: CheckCircle,
      gradient: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      id: 'age_verification',
      label: 'Edad',
      value: credentialStats.byType.age_verification,
      icon: Shield,
      gradient: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Primary Stats */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Resumen General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {primaryStats.map((stat) => (
            <StatCard key={stat.id} stat={stat} />
          ))}
        </div>
      </div>

      {/* Verification Stats */}
      {verificationStatsCards.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Estadísticas de Verificación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verificationStatsCards.map((stat) => (
              <StatCard key={stat.id} stat={stat} />
            ))}
          </div>
        </div>
      )}

      {/* Type Distribution */}
      {credentialStats.total > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Distribución por Tipo</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {typeStats.map((stat) => (
              <MiniStatCard key={stat.id} stat={stat} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  stat: StatCardData;
}

function StatCard({ stat }: StatCardProps) {
  const Icon = stat.icon;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {stat.label}
            </p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-bold">{stat.value}</h3>
              {stat.trend && (
                <div className={`flex items-center gap-1 text-sm ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendingUp className="h-3 w-3" />
                  <span>{stat.trend.value} {stat.trend.label}</span>
                </div>
              )}
            </div>
            {stat.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${stat.bgColor}`}>
            <div className={`bg-gradient-to-br ${stat.gradient} p-2 rounded-md`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStatCard({ stat }: StatCardProps) {
  const Icon = stat.icon;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className={`p-2 rounded-lg ${stat.bgColor}`}>
            <div className={`bg-gradient-to-br ${stat.gradient} p-2 rounded-md`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs font-medium text-muted-foreground">
              {stat.label}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
