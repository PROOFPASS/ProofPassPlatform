'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Share2, AlertCircle, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { QRCodeDisplay } from '@/components/client/QRCodeDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { attestationsService, type Attestation } from '@/lib/services/attestations';
import { formatDate, formatDateTime, getRelativeTime, downloadFile } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  type: 'issued' | 'verified' | 'revoked' | 'expired';
  title: string;
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

export default function CredentialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [credential, setCredential] = useState<Attestation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    loadCredential();
  }, [params.id]);

  const loadCredential = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await attestationsService.getById(params.id as string);
      setCredential(data);
    } catch (err: any) {
      console.error('Error loading credential:', err);
      setError(err.message || 'Error al cargar la credencial');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJSON = async () => {
    if (!credential) return;
    try {
      const blob = await attestationsService.downloadAsJson(credential.id);
      downloadFile(blob, `credential-${credential.id}.json`);
    } catch (err) {
      console.error('Error downloading credential:', err);
      alert('Error al descargar la credencial');
    }
  };

  const handleShare = async () => {
    if (!credential) return;
    const url = attestationsService.getVerificationUrl(credential.id, 'plain');

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Credencial: ${getCredentialTitle(credential)}`,
          text: `Verifica mi credencial verificable`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert('URL copiada al portapapeles');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const handleRevoke = async () => {
    if (!credential) return;

    const confirmed = confirm('¿Estás seguro de que deseas revocar esta credencial? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    try {
      setRevoking(true);
      await attestationsService.revoke(credential.id);
      await loadCredential(); // Reload to show updated status
      alert('Credencial revocada exitosamente');
    } catch (err) {
      console.error('Error revoking credential:', err);
      alert('Error al revocar la credencial');
    } finally {
      setRevoking(false);
    }
  };

  const mapTemplateIdToType = (templateId: string): 'identity' | 'education' | 'employment' | 'license' | 'age_verification' => {
    if (templateId.includes('identity')) return 'identity';
    if (templateId.includes('education')) return 'education';
    if (templateId.includes('employment')) return 'employment';
    if (templateId.includes('license')) return 'license';
    if (templateId.includes('age')) return 'age_verification';
    return 'identity';
  };

  const getCredentialTitle = (cred: Attestation): string => {
    const typeLabels = {
      identity: 'Verificación de Identidad',
      education: 'Credencial Educativa',
      employment: 'Certificación de Empleo',
      license: 'Licencia Profesional',
      age_verification: 'Verificación de Edad',
    };
    return typeLabels[mapTemplateIdToType(cred.templateId)] || 'Credencial Verificable';
  };

  const generateTimeline = (cred: Attestation): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    // Issued event
    events.push({
      id: 'issued',
      type: 'issued',
      title: 'Credencial Emitida',
      description: `Emitida por ${cred.organization.name}`,
      timestamp: cred.createdAt,
      icon: CheckCircle,
      color: 'text-green-600',
    });

    // Blockchain event (if available)
    if (cred.blockchainTxHash) {
      events.push({
        id: 'blockchain',
        type: 'verified',
        title: 'Anclada en Blockchain',
        description: `Registrada en ${cred.blockchain?.toUpperCase() || 'blockchain'}`,
        timestamp: cred.createdAt,
        icon: ExternalLink,
        color: 'text-blue-600',
      });
    }

    // Revoked event (if revoked)
    if (cred.status === 'REVOKED' && cred.revokedAt) {
      events.push({
        id: 'revoked',
        type: 'revoked',
        title: 'Credencial Revocada',
        description: 'La credencial ha sido revocada',
        timestamp: cred.revokedAt,
        icon: XCircle,
        color: 'text-red-600',
      });
    }

    // Expired event (if expired)
    if (cred.status === 'EXPIRED') {
      events.push({
        id: 'expired',
        type: 'expired',
        title: 'Credencial Expirada',
        description: 'La credencial ha alcanzado su fecha de expiración',
        timestamp: new Date().toISOString(),
        icon: Clock,
        color: 'text-yellow-600',
      });
    }

    return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Cargando credencial...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !credential) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error al cargar la credencial</h2>
              <p className="text-muted-foreground mb-6">{error || 'No se pudo encontrar la credencial'}</p>
              <Button onClick={() => router.push('/my-credentials')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Mis Credenciales
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const template = mapTemplateIdToType(credential.templateId);
  const title = getCredentialTitle(credential);
  const verificationUrl = attestationsService.getVerificationUrl(credential.id, 'vc-http-api');
  const timeline = generateTimeline(credential);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/my-credentials')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Emitida {getRelativeTime(credential.createdAt)} por {credential.organization.name}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartir
            </Button>
            <Button variant="outline" onClick={handleDownloadJSON}>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
            {credential.status === 'ACTIVE' && (
              <Button variant="destructive" onClick={handleRevoke} disabled={revoking}>
                <XCircle className="mr-2 h-4 w-4" />
                {revoking ? 'Revocando...' : 'Revocar'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - QR Code */}
          <div className="lg:col-span-1">
            <QRCodeDisplay
              url={verificationUrl}
              title={title}
              description={`Credencial verificable emitida por ${credential.organization.name}`}
              credentialId={credential.id}
              issuedDate={credential.createdAt}
              status={credential.status.toLowerCase() as 'active' | 'revoked' | 'expired'}
              template={template}
              size={280}
            />
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Estado
                  <Badge
                    variant={
                      credential.status === 'ACTIVE'
                        ? 'success'
                        : credential.status === 'REVOKED'
                        ? 'destructive'
                        : 'warning'
                    }
                  >
                    {credential.status === 'ACTIVE' && <CheckCircle className="mr-1 h-3 w-3" />}
                    {credential.status === 'REVOKED' && <XCircle className="mr-1 h-3 w-3" />}
                    {credential.status === 'EXPIRED' && <Clock className="mr-1 h-3 w-3" />}
                    {credential.status === 'ACTIVE' ? 'Activa' : credential.status === 'REVOKED' ? 'Revocada' : 'Expirada'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID de Credencial</p>
                  <p className="font-mono text-sm break-all">{credential.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">VC ID</p>
                  <p className="font-mono text-sm break-all">{credential.vcId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de Emisión</p>
                  <p className="text-sm">{formatDateTime(credential.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Emisor</p>
                  <p className="text-sm">{credential.organization.name}</p>
                </div>
                {credential.blockchain && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">Blockchain</p>
                      <p className="text-sm uppercase">{credential.blockchain}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">TX Hash</p>
                      <p className="font-mono text-xs break-all">{credential.blockchainTxHash}</p>
                    </div>
                  </>
                )}
                {credential.revokedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de Revocación</p>
                    <p className="text-sm">{formatDateTime(credential.revokedAt)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Claims Card */}
            <Card>
              <CardHeader>
                <CardTitle>Claims Verificables</CardTitle>
                <CardDescription>Todos los datos contenidos en esta credencial</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
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

            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline de Eventos</CardTitle>
                <CardDescription>Historial completo de la credencial</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative space-y-6">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500" />

                  {timeline.map((event, index) => {
                    const Icon = event.icon;
                    return (
                      <div key={event.id} className="relative flex gap-4">
                        {/* Icon */}
                        <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-current ${event.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold">{event.title}</h4>
                              <p className="text-sm text-muted-foreground">{event.description}</p>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {getRelativeTime(event.timestamp)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDateTime(event.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
