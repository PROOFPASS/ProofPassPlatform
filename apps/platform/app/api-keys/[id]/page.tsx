'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Key, Building2, Calendar, Activity, TrendingUp } from 'lucide-react';
import { apiKeysService } from '@/lib/services/api-keys';
import type { ApiKey, ApiKeyStatus } from '@/types/api';

export default function ApiKeyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [usage, setUsage] = useState<{
    total_requests: number;
    requests_today: number;
    last_used_at: string | null;
    usage_by_day: Array<{ date: string; count: number }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadApiKey();
      loadUsage();
    }
  }, [id]);

  const loadApiKey = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiKeysService.getApiKey(id);
      setApiKey(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar API key');
    } finally {
      setLoading(false);
    }
  };

  const loadUsage = async () => {
    try {
      const data = await apiKeysService.getApiKeyUsage(id);
      setUsage(data);
    } catch (err: any) {
      console.error('Error loading usage:', err);
    }
  };

  const handleRevoke = async () => {
    if (!apiKey || !confirm('¿Confirmar revocación de esta API key? Esta acción no se puede deshacer.')) return;

    try {
      await apiKeysService.revokeApiKey(id);
      await loadApiKey();
      alert('API key revocada exitosamente');
    } catch (err: any) {
      alert('Error al revocar API key: ' + err.message);
    }
  };

  const handleActivate = async () => {
    if (!apiKey || !confirm('¿Confirmar activación de esta API key?')) return;

    try {
      await apiKeysService.activateApiKey(id);
      await loadApiKey();
      alert('API key activada exitosamente');
    } catch (err: any) {
      alert('Error al activar API key: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!apiKey || !confirm('¿Eliminar esta API key permanentemente? Esta acción no se puede deshacer.')) return;

    try {
      await apiKeysService.deleteApiKey(id);
      alert('API key eliminada exitosamente');
      router.push('/api-keys');
    } catch (err: any) {
      alert('Error al eliminar API key: ' + err.message);
    }
  };

  const getStatusColor = (status: ApiKeyStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'revoked':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnvironmentColor = (environment: string) => {
    switch (environment) {
      case 'production':
        return 'bg-blue-100 text-blue-800';
      case 'development':
        return 'bg-purple-100 text-purple-800';
      case 'testing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length < 12) return '••••••••••••';
    return `${key.substring(0, 8)}••••••••${key.substring(key.length - 4)}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
          <p className="mt-4 text-sm text-gray-600">Cargando API key...</p>
        </div>
      </div>
    );
  }

  if (error || !apiKey) {
    return (
      <div className="space-y-4">
        <Link
          href="/api-keys"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a API keys
        </Link>
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error || 'API key no encontrada'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/api-keys"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a API keys
        </Link>

        <div className="mt-4 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Key className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {apiKey.name || 'API Key'}
              </h1>
              <p className="mt-1 font-mono text-sm text-gray-600">
                {maskApiKey(apiKey.key_prefix)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(apiKey.status)}`}>
              {apiKey.status}
            </span>
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getEnvironmentColor(apiKey.environment)}`}>
              {apiKey.environment}
            </span>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Requests</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {usage?.total_requests.toLocaleString() || 0}
              </p>
            </div>
            <Activity className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Requests Hoy</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {usage?.requests_today.toLocaleString() || 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Último Uso</p>
              <p className="mt-2 text-sm font-semibold text-gray-900">
                {usage?.last_used_at
                  ? new Date(usage.last_used_at).toLocaleDateString()
                  : 'Nunca usado'
                }
              </p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* API Key Info */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Información de la API Key</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Organización</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                <Building2 className="h-4 w-4" />
                {apiKey.organization_name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">ID de la API Key</dt>
              <dd className="mt-1 font-mono text-sm text-gray-900">{apiKey.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Prefijo de la Key</dt>
              <dd className="mt-1 font-mono text-sm text-gray-900">{apiKey.key_prefix}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Entorno</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getEnvironmentColor(apiKey.environment)}`}>
                  {apiKey.environment}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Dates */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Fechas</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha de Creación</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                <Calendar className="h-4 w-4" />
                {new Date(apiKey.created_at).toLocaleString()}
              </dd>
            </div>
            {apiKey.last_used_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Último Uso</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(apiKey.last_used_at).toLocaleString()}
                </dd>
              </div>
            )}
            {apiKey.expires_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Expiración</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(apiKey.expires_at).toLocaleString()}
                </dd>
              </div>
            )}
            {apiKey.revoked_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Revocación</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(apiKey.revoked_at).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Usage by Day */}
      {usage && usage.usage_by_day && usage.usage_by_day.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Uso en los últimos días</h2>
          <div className="mt-4">
            <div className="space-y-2">
              {usage.usage_by_day.slice(0, 10).map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min((day.count / Math.max(...usage.usage_by_day.map(d => d.count))) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-16 text-right">
                      {day.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-medium text-gray-900">Acciones</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {apiKey.status === 'active' && (
            <button
              onClick={handleRevoke}
              className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
            >
              Revocar API Key
            </button>
          )}

          {apiKey.status === 'revoked' && (
            <button
              onClick={handleActivate}
              className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
            >
              Reactivar API Key
            </button>
          )}

          <Link
            href={`/organizations/${apiKey.organization_id}`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Ver Organización
          </Link>

          <button
            onClick={handleDelete}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-gray-50"
          >
            Eliminar API Key
          </button>
        </div>
      </div>
    </div>
  );
}
