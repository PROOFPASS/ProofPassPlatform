'use client';

import { CheckCircle, XCircle, AlertCircle, Shield, Lock, ExternalLink, Calendar, Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type VerificationResult } from '@/lib/services/verification';
import { formatDateTime } from '@/lib/utils';

interface VerificationResultDisplayProps {
  result: VerificationResult;
}

const templateConfig = {
  identity: {
    label: 'Identidad',
    icon: Shield,
    gradient: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
  },
  education: {
    label: 'Educación',
    icon: Shield,
    gradient: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
  },
  employment: {
    label: 'Empleo',
    icon: Shield,
    gradient: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
  },
  license: {
    label: 'Licencia',
    icon: Shield,
    gradient: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
  },
  age_verification: {
    label: 'Edad',
    icon: Shield,
    gradient: 'from-red-500 to-rose-500',
    bgColor: 'bg-red-50',
  },
};

export function VerificationResultDisplay({ result }: VerificationResultDisplayProps) {
  const { valid, credential, errors, verificationDetails, verifiedAt } = result;

  // Determine overall status
  const getStatusConfig = () => {
    if (!valid) {
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        title: 'Credencial No Válida',
        description: 'Esta credencial no pasó la verificación',
      };
    }

    if (!verificationDetails.notRevoked) {
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        title: 'Credencial Revocada',
        description: 'Esta credencial ha sido revocada por el emisor',
      };
    }

    if (!verificationDetails.notExpired) {
      return {
        icon: AlertCircle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        title: 'Credencial Expirada',
        description: 'Esta credencial ha alcanzado su fecha de expiración',
      };
    }

    return {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      title: 'Credencial Verificada',
      description: 'Esta credencial es válida y ha sido verificada correctamente',
    };
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card className={`border-2 ${statusConfig.borderColor}`}>
        <CardContent className="pt-6">
          <div className={`flex items-start gap-4 p-6 rounded-lg ${statusConfig.bgColor}`}>
            <div className="flex-shrink-0">
              <StatusIcon className={`h-12 w-12 ${statusConfig.color}`} />
            </div>
            <div className="flex-1">
              <h3 className={`text-2xl font-bold ${statusConfig.color} mb-1`}>
                {statusConfig.title}
              </h3>
              <p className="text-muted-foreground">{statusConfig.description}</p>
              {errors.length > 0 && (
                <div className="mt-3 space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600">
                      • {error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Detalles de Verificación
          </CardTitle>
          <CardDescription>
            Verificado el {formatDateTime(verifiedAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VerificationCheck
              label="Firma Criptográfica"
              passed={verificationDetails.signatureValid}
              description="Firma digital válida del emisor"
            />
            <VerificationCheck
              label="Estado de Revocación"
              passed={verificationDetails.notRevoked}
              description="No ha sido revocada"
            />
            <VerificationCheck
              label="Vigencia"
              passed={verificationDetails.notExpired}
              description="Dentro del periodo de validez"
            />
            <VerificationCheck
              label="Emisor Confiable"
              passed={verificationDetails.issuerTrusted}
              description="Emisor verificado en la red"
            />
            {credential?.blockchainTxHash && (
              <VerificationCheck
                label="Blockchain"
                passed={verificationDetails.blockchainVerified}
                description="Anclada en blockchain"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credential Information (only if valid and credential exists) */}
      {credential && (
        <>
          {/* Issuer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Información del Emisor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Organización</p>
                  <p className="font-semibold">{credential.organization.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ID del Emisor</p>
                  <p className="font-mono text-sm">{credential.issuer.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Credential Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Fechas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Emisión</p>
                  <p className="font-semibold">{formatDateTime(credential.createdAt)}</p>
                </div>
                {credential.revokedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Revocación</p>
                    <p className="font-semibold text-red-600">
                      {formatDateTime(credential.revokedAt)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Claims (Public Information Only) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Información Verificada
              </CardTitle>
              <CardDescription>
                Datos públicos contenidos en la credencial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(credential.claims).map(([key, value]) => (
                  <div key={key} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-base mt-1">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Information */}
          {credential.blockchainTxHash && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  Blockchain
                </CardTitle>
                <CardDescription>
                  Esta credencial está anclada en blockchain para inmutabilidad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Red</p>
                    <Badge variant="secondary" className="uppercase">
                      {credential.blockchain}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transaction Hash</p>
                    <p className="font-mono text-xs break-all">{credential.blockchainTxHash}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles Técnicos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">ID de Credencial</p>
                  <p className="font-mono text-sm break-all">{credential.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">VC ID</p>
                  <p className="font-mono text-sm break-all">{credential.vcId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Template ID</p>
                  <p className="font-mono text-sm break-all">{credential.templateId}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

interface VerificationCheckProps {
  label: string;
  passed: boolean;
  description: string;
}

function VerificationCheck({ label, passed, description }: VerificationCheckProps) {
  return (
    <div className={`p-4 rounded-lg border-2 ${passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-start gap-3">
        {passed ? (
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className={`font-semibold ${passed ? 'text-green-900' : 'text-red-900'}`}>
            {label}
          </p>
          <p className={`text-sm ${passed ? 'text-green-700' : 'text-red-700'}`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
