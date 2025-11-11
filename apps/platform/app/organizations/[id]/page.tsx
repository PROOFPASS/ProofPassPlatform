'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Mail, CreditCard, Key, Calendar, Activity } from 'lucide-react';
import { organizationsService } from '@/lib/services/organizations';
import type { Organization } from '@/types/api';

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadOrganization();
    }
  }, [id]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await organizationsService.getOrganization(id);
      setOrganization(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar organización');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'suspended' | 'cancelled') => {
    if (!organization || !confirm(`¿Confirmar cambio de estado a "${newStatus}"?`)) return;

    try {
      await organizationsService.changeStatus(id, { status: newStatus });
      await loadOrganization();
      alert('Estado actualizado exitosamente');
    } catch (err: any) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
          <p className="mt-4 text-sm text-gray-600">Cargando organización...</p>
        </div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="space-y-4">
        <Link
          href="/organizations"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a organizaciones
        </Link>
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error || 'Organización no encontrada'}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/organizations"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a organizaciones
        </Link>

        <div className="mt-4 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
              <p className="mt-1 text-sm text-gray-600">{organization.email}</p>
            </div>
          </div>

          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(organization.status)}`}>
            {organization.status}
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Plan Actual</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{organization.plan_name}</p>
            </div>
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">API Keys</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{organization.api_key_count}</p>
            </div>
            <Key className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Requests/Día</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{organization.requests_per_day.toLocaleString()}</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ops Blockchain/Mes</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{organization.blockchain_ops_per_month.toLocaleString()}</p>
            </div>
            <Calendar className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info General */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Información General</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email de Facturación</dt>
              <dd className="mt-1 text-sm text-gray-900">{organization.billing_email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Contacto de Facturación</dt>
              <dd className="mt-1 text-sm text-gray-900">{organization.billing_contact || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">País</dt>
              <dd className="mt-1 text-sm text-gray-900">{organization.country}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Método de Pago</dt>
              <dd className="mt-1 text-sm text-gray-900">{organization.payment_method || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* Suscripción */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Suscripción</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha de Inicio</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(organization.subscription_start).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fecha de Vencimiento</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(organization.subscription_end).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Creado</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(organization.created_at).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Última Actualización</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(organization.updated_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-medium text-gray-900">Acciones</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => router.push(`/organizations/${id}/edit`)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Editar Información
          </button>

          {organization.status === 'active' && (
            <button
              onClick={() => handleStatusChange('suspended')}
              className="rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 transition-colors hover:bg-yellow-100"
            >
              Suspender
            </button>
          )}

          {organization.status === 'suspended' && (
            <button
              onClick={() => handleStatusChange('active')}
              className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
            >
              Activar
            </button>
          )}

          <button
            onClick={() => router.push(`/api-keys?organization=${id}`)}
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            Ver API Keys
          </button>
        </div>
      </div>
    </div>
  );
}
