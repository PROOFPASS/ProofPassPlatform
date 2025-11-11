'use client';

import { useState, useRef } from 'react';
import QRCode from 'qrcode.react';
import { Download, Copy, Check, Maximize2, Share2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, copyToClipboard, downloadFile } from '@/lib/utils';

export interface QRCodeDisplayProps {
  /** The credential/verification URL to encode in QR */
  url: string;
  /** Title of the credential */
  title: string;
  /** Description of the credential */
  description?: string;
  /** Credential ID */
  credentialId: string;
  /** Issue date */
  issuedDate: string;
  /** Expiration date (optional) */
  expirationDate?: string;
  /** Credential status */
  status: 'active' | 'revoked' | 'expired';
  /** Template type */
  template: 'identity' | 'education' | 'employment' | 'license' | 'age_verification';
  /** Size of QR code in pixels */
  size?: number;
  /** Additional className */
  className?: string;
}

const templateColors = {
  identity: 'from-blue-500 to-cyan-500',
  education: 'from-purple-500 to-pink-500',
  employment: 'from-green-500 to-emerald-500',
  license: 'from-orange-500 to-amber-500',
  age_verification: 'from-red-500 to-rose-500',
};

const templateLabels = {
  identity: 'Identidad',
  education: 'Educación',
  employment: 'Empleo',
  license: 'Licencia',
  age_verification: 'Verificación de Edad',
};

export function QRCodeDisplay({
  url,
  title,
  description,
  credentialId,
  issuedDate,
  expirationDate,
  status,
  template,
  size = 280,
  className,
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        downloadFile(blob, `${credentialId}-qr.png`);
      }
    });
  };

  const handleDownloadCredential = () => {
    // This would download the full VC JSON
    const vcData = JSON.stringify({
      credentialId,
      title,
      url,
      issuedDate,
      expirationDate,
      template,
      status,
    }, null, 2);

    const blob = new Blob([vcData], { type: 'application/json' });
    downloadFile(blob, `${credentialId}-credential.json`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description || 'Credencial Verificable',
          url: url,
        });
      } catch (err) {
        // User cancelled or error
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to copy URL
      handleCopyUrl();
    }
  };

  const statusColors = {
    active: 'success',
    revoked: 'destructive',
    expired: 'warning',
  } as const;

  const statusLabels = {
    active: 'Activa',
    revoked: 'Revocada',
    expired: 'Expirada',
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Gradient Header */}
      <div className={cn('h-2 bg-gradient-to-r', templateColors[template])} />

      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-2xl">{title}</CardTitle>
            {description && (
              <CardDescription className="text-base">{description}</CardDescription>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={statusColors[status]}>
              {statusLabels[status]}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {templateLabels[template]}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* QR Code Container with Premium Styling */}
        <div className="relative">
          <div
            ref={qrRef}
            className={cn(
              'mx-auto w-fit rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-200 transition-all duration-300',
              isEnlarged && 'scale-125'
            )}
          >
            <div className="relative">
              <QRCode
                value={url}
                size={size}
                level="H"
                includeMargin={false}
                renderAs="canvas"
                imageSettings={{
                  src: '/logo-qr.png', // Optional: Add logo in center
                  excavate: true,
                  width: size * 0.2,
                  height: size * 0.2,
                }}
              />

              {/* Scanning animation overlay (when active) */}
              {status === 'active' && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent animate-scan" />
                </div>
              )}
            </div>
          </div>

          {/* Enlarge button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm hover:bg-white"
            onClick={() => setIsEnlarged(!isEnlarged)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Credential Info */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ID de Credencial</span>
            <span className="font-mono text-xs">{credentialId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fecha de Emisión</span>
            <span>{new Date(issuedDate).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
          {expirationDate && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fecha de Expiración</span>
              <span>{new Date(expirationDate).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
          )}
        </div>

        {/* Verification URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">URL de Verificación</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyUrl}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          variant="default"
          className="flex-1"
          onClick={handleDownloadQR}
        >
          <Download className="mr-2 h-4 w-4" />
          Descargar QR
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleDownloadCredential}
        >
          <Download className="mr-2 h-4 w-4" />
          Descargar Credencial
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>

      <style jsx global>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(200%);
          }
        }

        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
      `}</style>
    </Card>
  );
}
