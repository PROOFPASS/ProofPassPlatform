'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, QrCode, Shield, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VerificationResultDisplay } from '@/components/client/VerificationResult';
import { verificationService, type VerificationResult } from '@/lib/services/verification';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(() => {
    // Check for credential parameter in URL
    const credentialParam = searchParams.get('credential');
    const credParam = searchParams.get('cred');
    const idParam = searchParams.get('id');

    const urlCredential = credentialParam || credParam || idParam;

    if (urlCredential) {
      setInput(urlCredential);
      // Auto-verify if credential is in URL
      handleVerify(urlCredential);
    }
  }, [searchParams]);

  const handleVerify = async (inputValue?: string) => {
    const valueToVerify = inputValue || input;

    if (!valueToVerify.trim()) {
      alert('Por favor ingresa un ID de credencial o URL');
      return;
    }

    setVerifying(true);
    setResult(null);

    try {
      // Try to extract credential ID from various formats
      const credentialId = verificationService.extractCredentialId(valueToVerify);

      if (credentialId) {
        // Verify by extracted ID
        const verificationResult = await verificationService.verifyById(credentialId);
        setResult(verificationResult);
      } else {
        // Try to verify as-is (might be a URL)
        const verificationResult = await verificationService.verifyByUrl(valueToVerify);
        setResult(verificationResult);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setResult({
        valid: false,
        credential: null,
        errors: ['Error al verificar la credencial. Por favor intenta nuevamente.'],
        verificationDetails: {
          signatureValid: false,
          notRevoked: false,
          notExpired: false,
          issuerTrusted: false,
          blockchainVerified: false,
        },
        verifiedAt: new Date().toISOString(),
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Verificador de Credenciales
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Verifica la autenticidad de credenciales verificables en segundos
          </p>
        </div>

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle>Verificar Credencial</CardTitle>
            <CardDescription>
              Ingresa el ID de la credencial, URL de verificación, o escanea el código QR
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input Field */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Ingresa ID de credencial o URL de verificación..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 rounded-md border border-input bg-background text-base"
                  disabled={verifying}
                />
              </div>
              <Button
                onClick={() => handleVerify()}
                disabled={verifying || !input.trim()}
                size="lg"
              >
                {verifying ? 'Verificando...' : 'Verificar'}
              </Button>
            </div>

            {/* QR Scanner Button (Future) */}
            <div className="flex items-center justify-center pt-4 border-t">
              <Button variant="outline" disabled className="gap-2">
                <QrCode className="h-4 w-4" />
                Escanear Código QR
                <span className="text-xs text-muted-foreground">(Próximamente)</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Verification Result */}
        {result && <VerificationResultDisplay result={result} />}

        {/* Info Card (shown when no result) */}
        {!result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Cómo Verificar una Credencial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Obtén el ID o URL</h4>
                    <p className="text-sm text-muted-foreground">
                      Solicita al titular de la credencial que comparta el ID único o URL de verificación.
                      También puedes escanear el código QR de la credencial.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Ingresa los datos</h4>
                    <p className="text-sm text-muted-foreground">
                      Pega el ID de la credencial o URL en el campo de búsqueda arriba.
                      El sistema acepta múltiples formatos de entrada.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Revisa los resultados</h4>
                    <p className="text-sm text-muted-foreground">
                      Obtendrás información detallada sobre la validez de la credencial, incluyendo
                      verificación de firma, estado de revocación, fecha de expiración y más.
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    Formatos de entrada aceptados:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• ID directo: <code className="bg-blue-100 px-2 py-0.5 rounded">a1b2c3d4-e5f6-...</code></li>
                    <li>• URL con parámetro: <code className="bg-blue-100 px-2 py-0.5 rounded">https://...?credential=id</code></li>
                    <li>• URL de verificación: <code className="bg-blue-100 px-2 py-0.5 rounded">https://.../verify/id</code></li>
                    <li>• Deep link: <code className="bg-blue-100 px-2 py-0.5 rounded">proofpass://verify/id</code></li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trust & Security Info */}
        <Card>
          <CardHeader>
            <CardTitle>Seguridad y Confianza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="inline-flex p-3 bg-green-100 rounded-full mb-3">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Criptografía Verificable</h4>
                <p className="text-sm text-muted-foreground">
                  Todas las credenciales están firmadas criptográficamente por el emisor
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex p-3 bg-blue-100 rounded-full mb-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Blockchain Inmutable</h4>
                <p className="text-sm text-muted-foreground">
                  Las credenciales pueden estar ancladas en blockchain para máxima seguridad
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex p-3 bg-purple-100 rounded-full mb-3">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Verificación en Tiempo Real</h4>
                <p className="text-sm text-muted-foreground">
                  Verificación instantánea del estado actual de la credencial
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-8 border-t">
          <p>ProofPass - Plataforma de Credenciales Verificables</p>
          <p className="mt-2">
            Powered by W3C Verifiable Credentials Standard
          </p>
        </div>
      </div>
    </div>
  );
}
