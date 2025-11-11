'use client';

import Link from 'next/link';
import { Shield, Calendar, Building, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, formatDate, getRelativeTime } from '@/lib/utils';

export interface AttestationCardProps {
  /** Attestation ID */
  id: string;
  /** Title of the attestation */
  title: string;
  /** Description */
  description?: string;
  /** Template type */
  template: 'identity' | 'education' | 'employment' | 'license' | 'age_verification';
  /** Status */
  status: 'active' | 'revoked' | 'expired';
  /** Issuer organization name */
  issuerName: string;
  /** Issue date */
  issuedDate: string;
  /** Expiration date (optional) */
  expirationDate?: string;
  /** Blockchain where it's registered */
  blockchain?: 'optimism' | 'arbitrum' | 'stellar';
  /** Transaction hash (if registered on blockchain) */
  txHash?: string;
  /** Claims data preview */
  claims?: Record<string, any>;
  /** Click handler for viewing full details */
  onView?: () => void;
  /** Additional className */
  className?: string;
}

const templateConfig = {
  identity: {
    label: 'Identidad',
    icon: Shield,
    gradient: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/20',
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  education: {
    label: 'Educación',
    icon: Building,
    gradient: 'from-purple-500/20 to-pink-500/20',
    border: 'border-purple-500/20',
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  employment: {
    label: 'Empleo',
    icon: Building,
    gradient: 'from-green-500/20 to-emerald-500/20',
    border: 'border-green-500/20',
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  license: {
    label: 'Licencia',
    icon: Shield,
    gradient: 'from-orange-500/20 to-amber-500/20',
    border: 'border-orange-500/20',
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  age_verification: {
    label: 'Verificación de Edad',
    icon: CheckCircle2,
    gradient: 'from-red-500/20 to-rose-500/20',
    border: 'border-red-500/20',
    iconColor: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

const blockchainLabels = {
  optimism: 'Optimism',
  arbitrum: 'Arbitrum',
  stellar: 'Stellar',
};

const statusConfig = {
  active: {
    label: 'Activa',
    variant: 'success' as const,
    icon: CheckCircle2,
  },
  revoked: {
    label: 'Revocada',
    variant: 'destructive' as const,
    icon: XCircle,
  },
  expired: {
    label: 'Expirada',
    variant: 'warning' as const,
    icon: Clock,
  },
};

export function AttestationCard({
  id,
  title,
  description,
  template,
  status,
  issuerName,
  issuedDate,
  expirationDate,
  blockchain,
  txHash,
  claims,
  onView,
  className,
}: AttestationCardProps) {
  const config = templateConfig[template];
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const TemplateIcon = config.icon;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]',
        className
      )}
    >
      {/* Gradient Background */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-70',
        config.gradient
      )} />

      {/* Content */}
      <div className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            {/* Icon */}
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg',
              config.bgColor
            )}>
              <TemplateIcon className={cn('h-6 w-6', config.iconColor)} />
            </div>

            {/* Status Badge */}
            <Badge variant={statusInfo.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </div>

          <div className="mt-4 space-y-1">
            <CardTitle className="text-xl line-clamp-1">{title}</CardTitle>
            {description && (
              <CardDescription className="line-clamp-2">{description}</CardDescription>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-4">
          {/* Claims Preview */}
          {claims && Object.keys(claims).length > 0 && (
            <div className="space-y-2 rounded-lg border border-border/50 bg-background/50 p-3">
              {Object.entries(claims).slice(0, 3).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-2 text-sm">
                  <span className="font-medium capitalize text-muted-foreground">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="truncate text-right">{String(value)}</span>
                </div>
              ))}
              {Object.keys(claims).length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{Object.keys(claims).length - 3} más
                </div>
              )}
            </div>
          )}

          {/* Info Grid */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Emisor:</span>
              <span className="font-medium">{issuerName}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Emitida:</span>
              <span className="font-medium">
                {getRelativeTime(issuedDate)}
              </span>
            </div>

            {expirationDate && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Expira:</span>
                <span className="font-medium">
                  {formatDate(expirationDate)}
                </span>
              </div>
            )}

            {blockchain && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Blockchain:</span>
                <Badge variant="outline" className="text-xs">
                  {blockchainLabels[blockchain]}
                </Badge>
              </div>
            )}
          </div>

          {/* Transaction Hash */}
          {txHash && (
            <div className="rounded-md bg-muted/50 p-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">TX Hash:</span>
                <code className="text-xs font-mono">
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </code>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            variant="outline"
            className="w-full group/button"
            onClick={onView}
            asChild={!onView}
          >
            {onView ? (
              <>
                Ver Detalles
                <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
              </>
            ) : (
              <Link href={`/my-credentials/${id}`}>
                Ver Detalles
                <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover/button:translate-x-1" />
              </Link>
            )}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
