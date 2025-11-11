'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import { organizationsService } from '@/lib/services/organizations';
import type { CreateOrganizationDto } from '@/types/api';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateOrganizationDto>({
    name: '',
    email: '',
    country: 'AR',
    billing_email: '',
    billing_contact: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.country) {
      setError('Los campos marcados con * son obligatorios');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const newOrg = await organizationsService.createOrganization(formData);
      alert('Organización creada exitosamente');
      router.push(`/organizations/${newOrg.id}`);
    } catch (err: any) {
      setError(err.message || 'Error al crear organización');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nueva Organización</h1>
            <p className="mt-1 text-sm text-gray-600">
              Completa los datos para crear una nueva organización
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
          <h2 className="text-lg font-medium text-gray-900">Información Básica</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nombre de la Organización *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary"
                placeholder="Acme Corporation"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email de Contacto *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary"
                placeholder="contact@acme.com"
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                País *
              </label>
              <select
                id="country"
                name="country"
                required
                value={formData.country}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary"
              >
                <option value="AR">Argentina</option>
                <option value="US">Estados Unidos</option>
                <option value="MX">México</option>
                <option value="ES">España</option>
                <option value="CL">Chile</option>
                <option value="CO">Colombia</option>
                <option value="PE">Perú</option>
                <option value="BR">Brasil</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Información de Facturación</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="billing_email" className="block text-sm font-medium text-gray-700">
                Email de Facturación
              </label>
              <input
                type="email"
                id="billing_email"
                name="billing_email"
                value={formData.billing_email || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary"
                placeholder="billing@acme.com"
              />
            </div>

            <div>
              <label htmlFor="billing_contact" className="block text-sm font-medium text-gray-700">
                Contacto de Facturación
              </label>
              <input
                type="text"
                id="billing_contact"
                name="billing_contact"
                value={formData.billing_contact || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:ring-primary"
                placeholder="John Doe"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/organizations"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Organización'}
          </button>
        </div>
      </form>
    </div>
  );
}
