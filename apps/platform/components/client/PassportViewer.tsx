'use client';

import { useState } from 'react';
import { Shield, Award, Briefcase, GraduationCap, User, ChevronRight, Download, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatDate, downloadFile } from '@/lib/utils';

interface Credential {
  id: string;
  type: 'identity' | 'education' | 'employment' | 'license' | 'age_verification';
  title: string;
  issuer: string;
  issuedDate: string;
  expirationDate?: string;
  status: 'active' | 'revoked' | 'expired';
  claims?: Record<string, any>;
}

export interface PassportViewerProps {
  /** User's name */
  userName: string;
  /** User's DID */
  did: string;
  /** List of credentials */
  credentials: Credential[];
  /** Passport ID */
  passportId: string;
  /** Creation date */
  createdDate: string;
  /** Avatar URL (optional) */
  avatarUrl?: string;
  /** Additional className */
  className?: string;
}

const credentialIcons = {
  identity: Shield,
  education: GraduationCap,
  employment: Briefcase,
  license: Award,
  age_verification: User,
};

const credentialColors = {
  identity: {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50',
    gradient: 'from-blue-600 to-cyan-600',
  },
  education: {
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    lightBg: 'bg-purple-50',
    gradient: 'from-purple-600 to-pink-600',
  },
  employment: {
    bg: 'bg-green-500',
    text: 'text-green-600',
    lightBg: 'bg-green-50',
    gradient: 'from-green-600 to-emerald-600',
  },
  license: {
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    lightBg: 'bg-orange-50',
    gradient: 'from-orange-600 to-amber-600',
  },
  age_verification: {
    bg: 'bg-red-500',
    text: 'text-red-600',
    lightBg: 'bg-red-50',
    gradient: 'from-red-600 to-rose-600',
  },
};

const credentialLabels = {
  identity: 'Identidad',
  education: 'Educación',
  employment: 'Empleo',
  license: 'Licencia Profesional',
  age_verification: 'Verificación de Edad',
};

export function PassportViewer({
  userName,
  did,
  credentials,
  passportId,
  createdDate,
  avatarUrl,
  className,
}: PassportViewerProps) {
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);

  const activeCredentials = credentials.filter(c => c.status === 'active');
  const totalCredentials = credentials.length;

  const handleDownloadPassport = () => {
    const passportData = {
      passportId,
      userName,
      did,
      credentials,
      createdDate,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(passportData, null, 2)], {
      type: 'application/json',
    });
    downloadFile(blob, `passport-${passportId}.json`);
  };

  const handleSharePassport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pasaporte Digital - ${userName}`,
          text: `Mi pasaporte digital con ${activeCredentials.length} credenciales verificables`,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  return (
    <div className={cn('grid gap-6 lg:grid-cols-3', className)}>
      {/* Main Passport Card */}
      <Card className="lg:col-span-2 overflow-hidden">
        {/* Header with Gradient */}
        <div className="relative h-48 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-6 text-white">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>

          {/* Content */}
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="h-20 w-20 rounded-full border-4 border-white/20 bg-white/10 backdrop-blur-sm overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div>
                <h2 className="text-2xl font-bold">{userName}</h2>
                <p className="text-sm text-white/70">Pasaporte Digital</p>
              </div>
            </div>

            <Badge variant="outline" className="border-white/20 text-white">
              ID: {passportId.slice(0, 8)}
            </Badge>
          </div>

          {/* DID */}
          <div className="relative mt-6 rounded-lg bg-black/20 backdrop-blur-sm p-3">
            <div className="text-xs text-white/50 mb-1">Decentralized Identifier (DID)</div>
            <code className="text-xs font-mono text-white/90">{did}</code>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Credenciales Verificables</h3>
              <p className="text-sm text-muted-foreground">
                {activeCredentials.length} de {totalCredentials} activas
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {activeCredentials.length}
            </Badge>
          </div>

          {/* Credentials List */}
          <div className="space-y-3">
            {credentials.map((credential) => {
              const Icon = credentialIcons[credential.type];
              const colors = credentialColors[credential.type];

              return (
                <button
                  key={credential.id}
                  onClick={() => setSelectedCredential(credential)}
                  className={cn(
                    'w-full rounded-lg border p-4 text-left transition-all hover:shadow-md',
                    selectedCredential?.id === credential.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', colors.lightBg)}>
                      <Icon className={cn('h-6 w-6', colors.text)} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">{credential.title}</h4>
                        <Badge
                          variant={credential.status === 'active' ? 'success' : 'destructive'}
                          className="text-xs shrink-0"
                        >
                          {credential.status === 'active' ? 'Activa' : credential.status === 'revoked' ? 'Revocada' : 'Expirada'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{credential.issuer}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Emitida: {formatDate(credential.issuedDate)}
                      </p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </button>
              );
            })}

            {credentials.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay credenciales en este pasaporte</p>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="border-t p-6 gap-3">
          <Button variant="default" className="flex-1" onClick={handleDownloadPassport}>
            <Download className="mr-2 h-4 w-4" />
            Descargar Pasaporte
          </Button>
          <Button variant="outline" onClick={handleSharePassport}>
            <Share2 className="mr-2 h-4 w-4" />
            Compartir
          </Button>
        </CardFooter>
      </Card>

      {/* Selected Credential Detail */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Detalles de Credencial</CardTitle>
          <CardDescription>
            {selectedCredential
              ? 'Información de la credencial seleccionada'
              : 'Selecciona una credencial para ver detalles'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {selectedCredential ? (
            <div className="space-y-4">
              {/* Type Badge */}
              <div className="flex items-center justify-center">
                <Badge
                  className={cn(
                    'px-4 py-2 text-sm font-medium',
                    credentialColors[selectedCredential.type].bg,
                    'text-white'
                  )}
                >
                  {credentialLabels[selectedCredential.type]}
                </Badge>
              </div>

              {/* Claims */}
              {selectedCredential.claims && Object.keys(selectedCredential.claims).length > 0 && (
                <div className="space-y-3 rounded-lg border p-4">
                  <h4 className="font-medium text-sm">Datos Verificados</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedCredential.claims).map(([key, value]) => (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-sm font-medium break-all">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="font-medium text-sm">Metadatos</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID:</span>
                    <br />
                    <code className="text-xs">{selectedCredential.id}</code>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Emisor:</span>
                    <br />
                    <span>{selectedCredential.issuer}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fecha de Emisión:</span>
                    <br />
                    <span>{formatDate(selectedCredential.issuedDate)}</span>
                  </div>
                  {selectedCredential.expirationDate && (
                    <div>
                      <span className="text-muted-foreground">Fecha de Expiración:</span>
                      <br />
                      <span>{formatDate(selectedCredential.expirationDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <a href={`/my-credentials/${selectedCredential.id}`}>
                  Ver Detalles Completos
                </a>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Shield className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-sm text-center">
                Haz clic en una credencial para ver sus detalles
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
