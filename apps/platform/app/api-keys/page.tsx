'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Key, Plus, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { apiKeysService } from '@/lib/services/api-keys';
import type { ApiKey, ApiKeyStatus, Environment } from '@/types/api';

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApiKeyStatus | ''>('');
  const [environmentFilter, setEnvironmentFilter] = useState<Environment | ''>('');

  // Stats
  const [stats, setStats] = useState({
    totalKeys: 0,
    activeKeys: 0,
    revokedKeys: 0,
  });

  useEffect(() => {
    loadApiKeys();
  }, [statusFilter, environmentFilter]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {};
      if (statusFilter) filters.status = statusFilter;
      if (environmentFilter) filters.environment = environmentFilter;

      const data = await apiKeysService.getApiKeys(filters);
      setApiKeys(data.api_keys);
      setTotal(data.total);

      // Calculate stats
      const active = data.api_keys.filter(k => k.status === 'active');
      const revoked = data.api_keys.filter(k => k.status === 'revoked');

      setStats({
        totalKeys: data.api_keys.length,
        activeKeys: active.length,
        revokedKeys: revoked.length,
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar API keys');
    } finally {
      setLoading(false);
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

  const getEnvironmentColor = (environment: Environment) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona las claves de API de las organizaciones
          </p>
        </div>
        <Link
          href="/api-keys/generate"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Generar API Key
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Keys</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{stats.totalKeys}</p>
            </div>
            <Key className="h-8 w-8 text-gray-600" />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Keys Activas</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{stats.activeKeys}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Keys Revocadas</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{stats.revokedKeys}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label htmlFor="status" className="text-sm font-medium text-gray-700">
              Filtrar por Estado:
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApiKeyStatus | '')}
              className="ml-2 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary"
            >
              <option value="">Todos</option>
              <option value="active">Activa</option>
              <option value="revoked">Revocada</option>
              <option value="expired">Expirada</option>
            </select>
          </div>

          <div>
            <label htmlFor="environment" className="text-sm font-medium text-gray-700">
              Filtrar por Entorno:
            </label>
            <select
              id="environment"
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value as Environment | '')}
              className="ml-2 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary"
            >
              <option value="">Todos</option>
              <option value="production">Producción</option>
              <option value="development">Desarrollo</option>
              <option value="testing">Testing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Organización
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                API Key
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Entorno
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Último Uso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                  Cargando API keys...
                </td>
              </tr>
            ) : apiKeys.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Key className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    No se encontraron API keys
                  </p>
                  <Link
                    href="/api-keys/generate"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Generar primera API key
                  </Link>
                </td>
              </tr>
            ) : (
              apiKeys.map((apiKey) => (
                <tr key={apiKey.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{apiKey.organization_name}</div>
                    <div className="text-sm text-gray-500">{apiKey.name || 'Sin nombre'}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="font-mono text-sm text-gray-900">
                      {maskApiKey(apiKey.key_prefix)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getEnvironmentColor(apiKey.environment)}`}>
                      {apiKey.environment}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(apiKey.status)}`}>
                      {apiKey.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {apiKey.last_used_at
                      ? new Date(apiKey.last_used_at).toLocaleDateString()
                      : 'Nunca usado'
                    }
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <Link
                      href={`/api-keys/${apiKey.id}`}
                      className="text-primary hover:text-primary/90"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Footer */}
        {!loading && apiKeys.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{apiKeys.length}</span> de{' '}
              <span className="font-medium">{total}</span> API keys
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
