'use client';

import { QRCodeDisplay } from '@/components/client/QRCodeDisplay';
import { AttestationCard } from '@/components/client/AttestationCard';
import { PassportViewer } from '@/components/client/PassportViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock data for demonstration
const mockCredentials = [
  {
    id: 'cred-001-identity',
    type: 'identity' as const,
    title: 'Verificación de Identidad KYC',
    issuer: 'Gobierno Nacional de Argentina',
    issuedDate: '2024-01-15T00:00:00Z',
    status: 'active' as const,
    claims: {
      firstName: 'Juan',
      lastName: 'Pérez',
      dateOfBirth: '1990-05-20',
      nationality: 'Argentina',
      documentNumber: 'DNI 12345678',
    },
  },
  {
    id: 'cred-002-education',
    type: 'education' as const,
    title: 'Título Universitario en Ingeniería',
    issuer: 'Universidad de Buenos Aires',
    issuedDate: '2023-12-10T00:00:00Z',
    expirationDate: '2028-12-10T00:00:00Z',
    status: 'active' as const,
    claims: {
      degree: 'Ingeniería en Sistemas',
      university: 'Universidad de Buenos Aires',
      graduationDate: '2023-12-10',
      gpa: '9.2/10',
    },
  },
  {
    id: 'cred-003-employment',
    type: 'employment' as const,
    title: 'Certificación de Empleo',
    issuer: 'Tech Corp S.A.',
    issuedDate: '2024-02-01T00:00:00Z',
    status: 'active' as const,
    claims: {
      position: 'Senior Software Engineer',
      company: 'Tech Corp S.A.',
      startDate: '2022-03-01',
      employmentType: 'Full-time',
    },
  },
  {
    id: 'cred-004-license',
    type: 'license' as const,
    title: 'Licencia Profesional de Conducir',
    issuer: 'Municipalidad de Buenos Aires',
    issuedDate: '2023-06-15T00:00:00Z',
    expirationDate: '2028-06-15T00:00:00Z',
    status: 'active' as const,
    claims: {
      licenseNumber: 'BA-123456',
      category: 'B1',
      restrictions: 'Ninguna',
    },
  },
];

export default function ComponentsShowcase() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <Badge className="text-lg px-6 py-2">Showcase de Componentes Premium</Badge>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ProofPass Platform UX
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experiencia de usuario excepcional para credenciales verificables y pasaportes digitales
          </p>
        </div>

        {/* QR Code Display Showcase */}
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">1. QR Code Display Component</CardTitle>
              <CardDescription className="text-lg">
                Visualización premium de códigos QR con capacidades de descarga, compartir y zoom.
                Incluye animación de scanning, badges de estado y gradientes por tipo de credencial.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <QRCodeDisplay
                  url="https://api.proofpass.com/credentials/cred-001-identity/verify"
                  title="Verificación de Identidad KYC"
                  description="Credencial de identidad verificada por el Gobierno Nacional"
                  credentialId="cred-001-identity"
                  issuedDate="2024-01-15T00:00:00Z"
                  expirationDate="2029-01-15T00:00:00Z"
                  status="active"
                  template="identity"
                  size={240}
                />

                <QRCodeDisplay
                  url="https://api.proofpass.com/credentials/cred-002-education/verify"
                  title="Título Universitario en Ingeniería"
                  description="Verificación académica de Universidad de Buenos Aires"
                  credentialId="cred-002-education"
                  issuedDate="2023-12-10T00:00:00Z"
                  expirationDate="2028-12-10T00:00:00Z"
                  status="active"
                  template="education"
                  size={240}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Attestation Cards Showcase */}
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">2. Attestation Cards Component</CardTitle>
              <CardDescription className="text-lg">
                Tarjetas interactivas para mostrar attestations con hover effects, gradientes temáticos,
                preview de claims y badges de estado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AttestationCard
                  id="cred-001-identity"
                  title="Verificación de Identidad KYC"
                  description="Credencial de identidad oficial verificada por autoridades gubernamentales"
                  template="identity"
                  status="active"
                  issuerName="Gobierno Nacional de Argentina"
                  issuedDate="2024-01-15T00:00:00Z"
                  blockchain="optimism"
                  txHash="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
                  claims={{
                    firstName: 'Juan',
                    lastName: 'Pérez',
                    dateOfBirth: '1990-05-20',
                    nationality: 'Argentina',
                  }}
                />

                <AttestationCard
                  id="cred-002-education"
                  title="Título Universitario en Ingeniería"
                  description="Título universitario oficial en Ingeniería en Sistemas"
                  template="education"
                  status="active"
                  issuerName="Universidad de Buenos Aires"
                  issuedDate="2023-12-10T00:00:00Z"
                  expirationDate="2028-12-10T00:00:00Z"
                  blockchain="arbitrum"
                  txHash="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
                  claims={{
                    degree: 'Ingeniería en Sistemas',
                    university: 'Universidad de Buenos Aires',
                    graduationDate: '2023-12-10',
                    gpa: '9.2/10',
                  }}
                />

                <AttestationCard
                  id="cred-003-employment"
                  title="Certificación de Empleo"
                  description="Certificación oficial de empleo actual"
                  template="employment"
                  status="active"
                  issuerName="Tech Corp S.A."
                  issuedDate="2024-02-01T00:00:00Z"
                  blockchain="stellar"
                  claims={{
                    position: 'Senior Software Engineer',
                    company: 'Tech Corp S.A.',
                    startDate: '2022-03-01',
                  }}
                />

                <AttestationCard
                  id="cred-004-license"
                  title="Licencia Profesional de Conducir"
                  description="Licencia de conducir categoría B1"
                  template="license"
                  status="active"
                  issuerName="Municipalidad de Buenos Aires"
                  issuedDate="2023-06-15T00:00:00Z"
                  expirationDate="2028-06-15T00:00:00Z"
                  claims={{
                    licenseNumber: 'BA-123456',
                    category: 'B1',
                  }}
                />

                <AttestationCard
                  id="cred-005-age"
                  title="Verificación de Mayoría de Edad"
                  description="Prueba de mayoría de edad sin revelar fecha exacta"
                  template="age_verification"
                  status="active"
                  issuerName="Sistema Nacional de Identidad"
                  issuedDate="2024-03-01T00:00:00Z"
                  claims={{
                    over18: 'true',
                    over21: 'true',
                  }}
                />

                <AttestationCard
                  id="cred-006-expired"
                  title="Certificación Expirada"
                  description="Ejemplo de credencial expirada"
                  template="license"
                  status="expired"
                  issuerName="Autoridad Emisora"
                  issuedDate="2020-01-01T00:00:00Z"
                  expirationDate="2023-01-01T00:00:00Z"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Passport Viewer Showcase */}
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">3. Digital Passport Viewer Component</CardTitle>
              <CardDescription className="text-lg">
                Visualizador completo de pasaporte digital tipo wallet con lista de credenciales,
                panel de detalles interactivo, descarga y compartir.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PassportViewer
                userName="Juan Pérez"
                did="did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
                credentials={mockCredentials}
                passportId="passport-12345"
                createdDate="2024-01-15T00:00:00Z"
              />
            </CardContent>
          </Card>
        </section>

        {/* Feature Highlights */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Características Destacadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="text-4xl">🎨</div>
                  <h3 className="font-semibold text-lg">Diseño Premium</h3>
                  <p className="text-sm text-muted-foreground">
                    Gradientes temáticos, animaciones suaves y efectos hover elegantes
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-4xl">📱</div>
                  <h3 className="font-semibold text-lg">Responsive</h3>
                  <p className="text-sm text-muted-foreground">
                    Adaptado perfectamente para desktop, tablet y mobile
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-4xl">⚡</div>
                  <h3 className="font-semibold text-lg">Performance</h3>
                  <p className="text-sm text-muted-foreground">
                    Optimizado con React 19 y Next.js 15 para máxima velocidad
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-4xl">🔒</div>
                  <h3 className="font-semibold text-lg">Seguridad</h3>
                  <p className="text-sm text-muted-foreground">
                    Integración con blockchain y verificación criptográfica
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center text-muted-foreground py-8 border-t">
          <p>ProofPass Platform - Credenciales Verificables con Diseño Excepcional</p>
          <p className="text-sm mt-2">
            Powered by Next.js 15, React 19, Tailwind CSS, shadcn/ui
          </p>
        </div>
      </div>
    </div>
  );
}
