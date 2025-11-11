'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { TrendingUp, Activity } from 'lucide-react';

interface DataPoint {
  date: string;
  count: number;
}

interface ActivityChartProps {
  data: DataPoint[];
  title?: string;
  description?: string;
  color?: string;
  showTrend?: boolean;
}

export function ActivityChart({
  data,
  title = 'Actividad de Verificaciones',
  description = 'Verificaciones realizadas en los últimos 30 días',
  color = 'blue',
  showTrend = true,
}: ActivityChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay datos de actividad disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length;
  const trendPercentage = firstHalfAvg > 0
    ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100)
    : 0;
  const trendIsPositive = trendPercentage >= 0;

  // Calculate max value for scaling
  const maxValue = Math.max(...data.map(d => d.count));
  const minValue = Math.min(...data.map(d => d.count));

  // Color variants
  const colorVariants = {
    blue: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      line: 'bg-blue-500',
    },
    green: {
      gradient: 'from-green-500 to-emerald-500',
      bg: 'bg-green-500/10',
      border: 'border-green-200',
      dot: 'bg-green-500',
      line: 'bg-green-500',
    },
    purple: {
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-500/10',
      border: 'border-purple-200',
      dot: 'bg-purple-500',
      line: 'bg-purple-500',
    },
  };

  const colors = colorVariants[color as keyof typeof colorVariants] || colorVariants.blue;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showTrend && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${trendIsPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <TrendingUp className={`h-4 w-4 ${!trendIsPositive && 'rotate-180'}`} />
              <span className="text-sm font-semibold">
                {trendIsPositive ? '+' : ''}{trendPercentage}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Simple Bar Chart */}
        <div className="space-y-6">
          {/* Chart Area */}
          <div className="relative h-64">
            <div className="absolute inset-0 flex items-end justify-between gap-1">
              {data.map((point, index) => {
                const heightPercentage = maxValue > 0 ? (point.count / maxValue) * 100 : 0;
                const isHighest = point.count === maxValue;
                const isLowest = point.count === minValue && minValue !== maxValue;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap">
                        <p className="font-semibold">{point.count} verificaciones</p>
                        <p className="text-gray-300">{formatDate(point.date)}</p>
                      </div>
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 mx-auto"></div>
                    </div>

                    {/* Bar */}
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 group-hover:opacity-80 ${
                        isHighest
                          ? `bg-gradient-to-t ${colors.gradient}`
                          : isLowest
                          ? colors.bg
                          : colors.line
                      }`}
                      style={{ height: `${heightPercentage}%`, minHeight: point.count > 0 ? '2px' : '0' }}
                    />

                    {/* Dot indicator for hover */}
                    <div className={`w-2 h-2 rounded-full ${colors.dot} opacity-0 group-hover:opacity-100 transition-opacity mt-1`} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-Axis Labels (show first, middle, last) */}
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>{formatDate(data[0].date)}</span>
            {data.length > 2 && (
              <span>{formatDate(data[Math.floor(data.length / 2)].date)}</span>
            )}
            <span>{formatDate(data[data.length - 1].date)}</span>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold">{maxValue}</p>
              <p className="text-xs text-muted-foreground">Máximo</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {Math.round(data.reduce((sum, d) => sum + d.count, 0) / data.length)}
              </p>
              <p className="text-xs text-muted-foreground">Promedio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {data.reduce((sum, d) => sum + d.count, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Activity Timeline Component
interface TimelineItem {
  id: string;
  type: 'credential_issued' | 'credential_revoked' | 'credential_verified' | 'credential_shared' | 'passport_created';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ActivityTimelineProps {
  activities: TimelineItem[];
  limit?: number;
}

export function ActivityTimeline({ activities, limit = 10 }: ActivityTimelineProps) {
  const displayActivities = activities.slice(0, limit);

  const getActivityIcon = (type: TimelineItem['type']) => {
    const icons = {
      credential_issued: '✓',
      credential_revoked: '✗',
      credential_verified: '🔍',
      credential_shared: '📤',
      passport_created: '📋',
    };
    return icons[type] || '•';
  };

  const getActivityColor = (type: TimelineItem['type']) => {
    const colors = {
      credential_issued: 'bg-green-100 text-green-700 border-green-200',
      credential_revoked: 'bg-red-100 text-red-700 border-red-200',
      credential_verified: 'bg-blue-100 text-blue-700 border-blue-200',
      credential_shared: 'bg-purple-100 text-purple-700 border-purple-200',
      passport_created: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (displayActivities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>Historial de acciones con tus credenciales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay actividad reciente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Últimas {displayActivities.length} acciones</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.map((activity, index) => (
            <div key={activity.id} className="flex gap-4">
              {/* Timeline line */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                {index < displayActivities.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 my-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{activity.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {formatDate(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
