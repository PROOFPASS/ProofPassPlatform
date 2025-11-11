'use client';

import { useEffect, useState } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import { AttestationCard } from '@/components/client/AttestationCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { attestationsService, type Attestation } from '@/lib/services/attestations';

export default function MyCredentialsPage() {
  const [credentials, setCredentials] = useState<Attestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'revoked' | 'expired'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCredentials();
  }, [filter]);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const response = await attestationsService.list({
        status: filter === 'all' ? undefined : filter.toUpperCase() as any,
        limit: 100,
      });

      // Map API response to component props
      const mappedCredentials = response.attestations.map(att => ({
        ...att,
        type: mapTemplateIdToType(att.templateId),
        title: generateTitle(att),
        issuerName: att.organization.name,
        issuedDate: att.createdAt,
        status: att.status.toLowerCase() as 'active' | 'revoked' | 'expired',
      }));

      setCredentials(mappedCredentials as any);
    } catch (error) {
      console.error('Error loading credentials:', error);
      // Show error toast or fallback UI
    } finally {
      setLoading(false);
    }
  };

  const mapTemplateIdToType = (templateId: string): 'identity' | 'education' | 'employment' | 'license' | 'age_verification' => {
    // Map template IDs to types
    if (templateId.includes('identity')) return 'identity';
    if (templateId.includes('education')) return 'education';
    if (templateId.includes('employment')) return 'employment';
    if (templateId.includes('license')) return 'license';
    if (templateId.includes('age')) return 'age_verification';
    return 'identity'; // default
  };

  const generateTitle = (att: Attestation): string => {
    const typeLabels = {
      identity: 'Verificación de Identidad',
      education: 'Credencial Educativa',
      employment: 'Certificación de Empleo',
      license: 'Licencia Profesional',
      age_verification: 'Verificación de Edad',
    };
    return typeLabels[mapTemplateIdToType(att.templateId)] || 'Credencial Verificable';
  };

  const filteredCredentials = credentials.filter(cred => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        (cred as any).title.toLowerCase().includes(searchLower) ||
        (cred as any).issuerName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const stats = {
    total: credentials.length,
    active: credentials.filter(c => c.status === 'ACTIVE').length,
    revoked: credentials.filter(c => c.status === 'REVOKED').length,
    expired: credentials.filter(c => c.status === 'EXPIRED').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mis Credenciales
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Gestiona todas tus credenciales verificables en un solo lugar
            </p>
          </div>
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Nueva Credencial
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Activas</CardDescription>
              <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Revocadas</CardDescription>
              <CardTitle className="text-3xl text-red-600">{stats.revoked}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Expiradas</CardDescription>
              <CardTitle className="text-3xl text-yellow-600">{stats.expired}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar credenciales..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background"
                />
              </div>

              {/* Filter buttons */}
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Todas
                </Button>
                <Button
                  variant={filter === 'active' ? 'default' : 'outline'}
                  onClick={() => setFilter('active')}
                >
                  Activas
                </Button>
                <Button
                  variant={filter === 'revoked' ? 'default' : 'outline'}
                  onClick={() => setFilter('revoked')}
                >
                  Revocadas
                </Button>
                <Button
                  variant={filter === 'expired' ? 'default' : 'outline'}
                  onClick={() => setFilter('expired')}
                >
                  Expiradas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credentials Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Cargando credenciales...</p>
          </div>
        ) : filteredCredentials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCredentials.map((cred: any) => (
              <AttestationCard
                key={cred.id}
                id={cred.id}
                title={cred.title}
                template={cred.type}
                status={cred.status}
                issuerName={cred.issuerName}
                issuedDate={cred.issuedDate}
                blockchain={cred.blockchain}
                txHash={cred.blockchainTxHash}
                claims={cred.claims}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-muted-foreground">
                <p className="text-lg mb-2">No se encontraron credenciales</p>
                <p className="text-sm">
                  {search
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Comienza creando tu primera credencial verificable'}
                </p>
              </div>
              <Button className="mt-6" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Crear Primera Credencial
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
