'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Key, Copy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiKeysService } from '@/lib/services/api-keys';
import { organizationsService } from '@/lib/services/organizations';
import type { CreateApiKeyDto, Environment } from '@/types/api';

export default function GenerateApiKeyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState<CreateApiKeyDto>({
    organization_id: '',
    environment: 'development',
    name: '',
  });

  // Success state - stores the plain API key shown only once
  const [generatedKey, setGeneratedKey] = useState<{
    id: string;
    plain_key: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const data = await organizationsService.getOrganizations({
        limit: 100,
        status: 'active'
      });
      setOrganizations(data.organizations);
    } catch (err) {
      console.error('Error loading organizations:', err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.organization_id || !formData.environment) {
      setError('Organización y entorno son obligatorios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiKeysService.createApiKey(formData);
      setGeneratedKey({
        id: result.api_key.id,
        plain_key: result.plain_key,
      });
    } catch (err: any) {
      setError(err.message || 'Error al generar API key');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCopyKey = async () => {
    if (!generatedKey) return;

    try {
      await navigator.clipboard.writeText(generatedKey.plain_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      alert('Error al copiar al portapapeles');
    }
  };

  const handleContinue = () => {
    router.push(`/api-keys/${generatedKey?.id}`);
  };

  // If key was generated, show success screen
  if (generatedKey) {
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

          <div className="mt-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API Key Generada Exitosamente</h1>
              <p className="mt-1 text-sm text-gray-600">
                Guarda esta clave de forma segura. No podrás verla de nuevo.
              </p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="rounded-lg bg-yellow-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Importante: Guarda esta clave ahora
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Esta es la única vez que verás la clave completa</li>
                  <li>No podemos recuperarla si la pierdes</li>
                  <li>Deberás generar una nueva clave si la olvidas</li>
                  <li>Guárdala en un lugar seguro como un gestor de contraseñas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* API Key Display */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Tu API Key</h2>

          <div className="mt-4">
            <div className="relative">
              <div className="flex items-center gap-2 rounded-lg border-2 border-primary bg-gray-50 p-4">
                <code className="flex-1 font-mono text-sm text-gray-900 break-all">
                  {generatedKey.plain_key}
                </code>
                <button
                  onClick={handleCopyKey}
                  className="flex-shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="inline h-4 w-4 mr-2" />
                      Copiada
                    </>
                  ) : (
                    <>
                      <Copy className="inline h-4 w-4 mr-2" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-500">
              Usa esta clave en el header de tus requests: <code className="font-mono bg-gray-100 px-2 py-1 rounded">X-API-Key: {generatedKey.plain_key}</code>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/api-keys"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Volver a la lista
          </Link>
          <button
            onClick={handleContinue}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            Ver detalles de la key
          </button>
        </div>
      </div>
    );
  }

  // Otherwise, show the form
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

        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Key className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Generar Nueva API Key</h1>
            <p className="mt-1 text-sm text-gray-600">
              Crea una nueva clave de API para una organización
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Información de la API Key</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="organization_id" className="block text-sm font-medium text-gray-700">
                Organización *
              </label>
              <select
                id="organization_id"
                name="organization_id"
                required
                value={formData.organization_id}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary"
              >
                <option value="">Seleccionar organización</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.plan_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="environment" className="block text-sm font-medium text-gray-700">
                Entorno *
              </label>
              <select
                id="environment"
                name="environment"
                required
                value={formData.environment}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary"
              >
                <option value="development">Desarrollo</option>
                <option value="testing">Testing</option>
                <option value="production">Producción</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                El entorno determina qué recursos puede acceder la clave
              </p>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre (opcional)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary"
                placeholder="Mi API Key de Producción"
              />
              <p className="mt-1 text-sm text-gray-500">
                Un nombre descriptivo para identificar esta clave
              </p>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="rounded-lg bg-blue-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Información de Seguridad
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc space-y-1 pl-5">
                  <li>La clave completa se mostrará <strong>solo una vez</strong> después de generarla</li>
                  <li>No podremos recuperar la clave si la pierdes</li>
                  <li>Puedes revocar la clave en cualquier momento desde su página de detalles</li>
                  <li>Las claves tienen límites de uso según el plan de la organización</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/api-keys"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Generando...' : 'Generar API Key'}
          </button>
        </div>
      </form>
    </div>
  );
}
