'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatsCards } from '@/components/client/StatsCards';
import { ActivityChart, ActivityTimeline } from '@/components/client/ActivityChart';
import { analyticsService, type CredentialAnalyticsDashboard } from '@/lib/services/analytics';

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<CredentialAnalyticsDashboard | null>(null);
  const [verificationTrend, setVerificationTrend] = useState<Array<{ date: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

      // Load all analytics data
      const [dashboardData, trendData] = await Promise.all([
        analyticsService.getCredentialDashboard(),
        analyticsService.getVerificationTrend(days),
      ]);

      setDashboard(dashboardData);
      setVerificationTrend(trendData);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Cargando estadísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error al cargar estadísticas</h2>
              <p className="text-muted-foreground mb-6">{error || 'No se pudieron cargar las estadísticas'}</p>
              <Button onClick={loadAnalytics}>Reintentar</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard de Analíticas
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Estadísticas y uso de tus credenciales verificables
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="flex gap-2">
            <Button
              variant={timeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('7d')}
            >
              7 días
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('30d')}
            >
              30 días
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('90d')}
            >
              90 días
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards
          credentialStats={dashboard.credentialStats}
          verificationStats={dashboard.verificationStats}
        />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Verification Trend Chart */}
          <div className="lg:col-span-2">
            <ActivityChart
              data={verificationTrend}
              title="Tendencia de Verificaciones"
              description={`Verificaciones realizadas en los últimos ${timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : '90'} días`}
              color="blue"
              showTrend={true}
            />
          </div>

          {/* Popular Credentials */}
          {dashboard.popularCredentials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Credenciales Más Verificadas
                </CardTitle>
                <CardDescription>
                  Top {dashboard.popularCredentials.length} credenciales con más verificaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard.popularCredentials.map((cred, index) => {
                    const maxVerifications = dashboard.popularCredentials[0].verificationCount;
                    const percentage = maxVerifications > 0
                      ? (cred.verificationCount / maxVerifications) * 100
                      : 0;

                    const typeColors = {
                      identity: 'bg-blue-500',
                      education: 'bg-purple-500',
                      employment: 'bg-green-500',
                      license: 'bg-orange-500',
                      age_verification: 'bg-red-500',
                    };

                    const color = typeColors[cred.type as keyof typeof typeColors] || 'bg-gray-500';

                    return (
                      <div key={cred.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">#{index + 1}</span>
                            <span className="text-muted-foreground truncate max-w-xs">
                              {cred.title}
                            </span>
                          </div>
                          <span className="font-bold">{cred.verificationCount}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${color} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity Timeline */}
          <ActivityTimeline activities={dashboard.recentActivity} limit={10} />
        </div>

        {/* Insights Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Perspectivas
            </CardTitle>
            <CardDescription>
              Información útil sobre tus credenciales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                  ✓
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Credenciales Activas</h4>
                  <p className="text-sm text-muted-foreground">
                    Tienes {dashboard.credentialStats.active} credenciales activas y verificables.
                    {dashboard.credentialStats.expired > 0 && ` ${dashboard.credentialStats.expired} han expirado.`}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Actividad de Verificación</h4>
                  <p className="text-sm text-muted-foreground">
                    {dashboard.verificationStats.totalVerifications > 0
                      ? `Tus credenciales han sido verificadas ${dashboard.verificationStats.totalVerifications} veces, con una tasa de éxito del ${Math.round((dashboard.verificationStats.successfulVerifications / dashboard.verificationStats.totalVerifications) * 100)}%.`
                      : 'Aún no se han realizado verificaciones de tus credenciales.'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Tipo Más Común</h4>
                  <p className="text-sm text-muted-foreground">
                    {getMostCommonType(dashboard.credentialStats.byType)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Acerca de estas estadísticas</h4>
                <p className="text-sm text-blue-800">
                  Las estadísticas se actualizan en tiempo real y muestran el uso de tus credenciales
                  verificables. Los datos de verificación se registran de forma anónima y segura.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to get the most common credential type
function getMostCommonType(byType: {
  identity: number;
  education: number;
  employment: number;
  license: number;
  age_verification: number;
}): string {
  const types = [
    { name: 'Identidad', count: byType.identity },
    { name: 'Educación', count: byType.education },
    { name: 'Empleo', count: byType.employment },
    { name: 'Licencias', count: byType.license },
    { name: 'Verificación de Edad', count: byType.age_verification },
  ];

  const mostCommon = types.reduce((max, type) => (type.count > max.count ? type : max), types[0]);

  if (mostCommon.count === 0) {
    return 'No tienes credenciales todavía.';
  }

  return `${mostCommon.name} es tu tipo de credencial más común con ${mostCommon.count} ${mostCommon.count === 1 ? 'credencial' : 'credenciales'}.`;
}
