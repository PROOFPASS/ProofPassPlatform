'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Share2, Plus, Settings, AlertCircle } from 'lucide-react';
import { PassportViewer } from '@/components/client/PassportViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { passportsService, type Passport } from '@/lib/services/passports';
import { downloadFile } from '@/lib/utils';

interface MappedCredential {
  id: string;
  type: 'identity' | 'education' | 'employment' | 'license' | 'age_verification';
  title: string;
  issuer: string;
  issuedDate: string;
  expirationDate?: string;
  status: 'active' | 'revoked' | 'expired';
  claims: Record<string, any>;
}

export default function PassportPage() {
  const router = useRouter();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    loadPassport();
  }, []);

  const loadPassport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await passportsService.getMyPassport();
      setPassport(data);
    } catch (err: any) {
      console.error('Error loading passport:', err);
      setError(err.message || 'Error al cargar el pasaporte');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!passport) return;

    try {
      setDownloading(true);
      const blob = await passportsService.downloadAsJson(passport.id);
      downloadFile(blob, `passport-${passport.id}.json`);
    } catch (err) {
      console.error('Error downloading passport:', err);
      alert('Error al descargar el pasaporte');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!passport) return;

    try {
      setSharing(true);
      const url = passportsService.getShareUrl(passport.id);

      if (navigator.share) {
        await navigator.share({
          title: `Pasaporte Digital de ${passport.user.name}`,
          text: 'Verifica mi pasaporte digital con credenciales verificables',
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert('URL del pasaporte copiada al portapapeles');
      }
    } catch (err) {
      console.error('Error sharing passport:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleAddCredential = () => {
    router.push('/my-credentials');
  };

  const handleManageCredentials = () => {
    router.push('/my-credentials');
  };

  const mapTemplateIdToType = (templateId: string): 'identity' | 'education' | 'employment' | 'license' | 'age_verification' => {
    if (templateId.includes('identity')) return 'identity';
    if (templateId.includes('education')) return 'education';
    if (templateId.includes('employment')) return 'employment';
    if (templateId.includes('license')) return 'license';
    if (templateId.includes('age')) return 'age_verification';
    return 'identity';
  };

  const getCredentialTitle = (templateId: string): string => {
    const typeLabels = {
      identity: 'Verificación de Identidad',
      education: 'Credencial Educativa',
      employment: 'Certificación de Empleo',
      license: 'Licencia Profesional',
      age_verification: 'Verificación de Edad',
    };
    return typeLabels[mapTemplateIdToType(templateId)] || 'Credencial Verificable';
  };

  const mapCredentials = (passport: Passport): MappedCredential[] => {
    return passport.attestations.map(att => ({
      id: att.id,
      type: mapTemplateIdToType(att.templateId),
      title: getCredentialTitle(att.templateId),
      issuer: att.organization.name,
      issuedDate: att.createdAt,
      expirationDate: undefined, // Add if available in your data
      status: att.status.toLowerCase() as 'active' | 'revoked' | 'expired',
      claims: att.claims,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Cargando pasaporte digital...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !passport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error al cargar el pasaporte</h2>
              <p className="text-muted-foreground mb-6">{error || 'No se pudo cargar tu pasaporte digital'}</p>
              <Button onClick={loadPassport}>Reintentar</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const mappedCredentials = mapCredentials(passport);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mi Pasaporte Digital
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Tu colección de credenciales verificables en un solo lugar
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare} disabled={sharing}>
              <Share2 className="mr-2 h-4 w-4" />
              {sharing ? 'Compartiendo...' : 'Compartir'}
            </Button>
            <Button variant="outline" onClick={handleDownload} disabled={downloading}>
              <Download className="mr-2 h-4 w-4" />
              {downloading ? 'Descargando...' : 'Descargar'}
            </Button>
            <Button onClick={handleManageCredentials}>
              <Settings className="mr-2 h-4 w-4" />
              Gestionar
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Acerca de tu Pasaporte Digital</CardTitle>
            <CardDescription>
              Tu pasaporte digital es una colección portable de todas tus credenciales verificables.
              Puedes compartirlo con terceros para verificar tu identidad, educación, empleo y más.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-muted-foreground mb-1">DID</p>
                <p className="font-mono text-xs break-all">{passport.did}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-muted-foreground mb-1">Credenciales Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {mappedCredentials.filter(c => c.status === 'active').length}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-muted-foreground mb-1">Total de Credenciales</p>
                <p className="text-2xl font-bold text-purple-600">
                  {mappedCredentials.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Passport Viewer */}
        {mappedCredentials.length > 0 ? (
          <PassportViewer
            userName={passport.user.name}
            did={passport.did}
            credentials={mappedCredentials}
            passportId={passport.id}
            createdDate={passport.createdAt}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground mb-6">
                <p className="text-lg mb-2">Tu pasaporte está vacío</p>
                <p className="text-sm">
                  Comienza agregando credenciales verificables a tu pasaporte digital
                </p>
              </div>
              <Button onClick={handleAddCredential} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Agregar Primera Credencial
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle>Consejos para usar tu Pasaporte Digital</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Mantén tus credenciales actualizadas</h4>
                  <p className="text-sm text-muted-foreground">
                    Revisa regularmente el estado de tus credenciales y renueva las que estén próximas a expirar.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Comparte selectivamente</h4>
                  <p className="text-sm text-muted-foreground">
                    Puedes compartir credenciales individuales o tu pasaporte completo según la situación.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Seguridad blockchain</h4>
                  <p className="text-sm text-muted-foreground">
                    Tus credenciales están ancladas en blockchain para máxima seguridad y verificabilidad.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Descarga y backup</h4>
                  <p className="text-sm text-muted-foreground">
                    Descarga regularmente una copia JSON de tu pasaporte como respaldo.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
