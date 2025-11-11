'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Building2, Calendar, FileText } from 'lucide-react';
import { paymentsService } from '@/lib/services/payments';
import type { Payment, PaymentStatus } from '@/types/api';

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPayment();
    }
  }, [id]);

  const loadPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await paymentsService.getPayment(id);
      setPayment(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar pago');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: PaymentStatus) => {
    if (!payment || !confirm(`¿Confirmar cambio de estado a "${newStatus}"?`)) return;

    try {
      await paymentsService.updatePaymentStatus(id, newStatus);
      await loadPayment();
      alert('Estado actualizado exitosamente');
    } catch (err: any) {
      alert('Error al actualizar estado: ' + err.message);
    }
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
          <p className="mt-4 text-sm text-gray-600">Cargando pago...</p>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="space-y-4">
        <Link
          href="/payments"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a pagos
        </Link>
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error || 'Pago no encontrado'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/payments"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a pagos
        </Link>

        <div className="mt-4 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {formatAmount(payment.amount, payment.currency)}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Pago ID: {payment.id.substring(0, 8)}...
              </p>
            </div>
          </div>

          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(payment.status)}`}>
            {payment.status}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Info */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Información del Pago</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Organización</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                <Building2 className="h-4 w-4" />
                {payment.organization_name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Método de Pago</dt>
              <dd className="mt-1 text-sm text-gray-900">{payment.payment_method}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Referencia</dt>
              <dd className="mt-1 text-sm text-gray-900">{payment.reference || 'Sin referencia'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Moneda</dt>
              <dd className="mt-1 text-sm text-gray-900">{payment.currency}</dd>
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
                {new Date(payment.created_at).toLocaleString()}
              </dd>
            </div>
            {payment.paid_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Pago</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(payment.paid_at).toLocaleString()}
                </dd>
              </div>
            )}
            {payment.confirmed_at && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Confirmación</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(payment.confirmed_at).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Notes */}
      {payment.notes && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="flex items-center gap-2 text-lg font-medium text-gray-900">
            <FileText className="h-5 w-5" />
            Notas
          </h2>
          <p className="mt-4 text-sm text-gray-700">{payment.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-medium text-gray-900">Acciones</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {payment.status === 'pending' && (
            <>
              <button
                onClick={() => handleStatusChange('confirmed')}
                className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
              >
                Confirmar Pago
              </button>
              <button
                onClick={() => handleStatusChange('failed')}
                className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                Marcar como Fallido
              </button>
            </>
          )}

          <Link
            href={`/organizations/${payment.organization_id}`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Ver Organización
          </Link>
        </div>
      </div>
    </div>
  );
}
