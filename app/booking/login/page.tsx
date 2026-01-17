'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/context'

/** @description Login page component for customer authentication using magic link emails. */
export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)

    try {
      const { error } = await signIn(email)
      if (error) {
        alert('Error al enviar el enlace mágico: ' + error.message)
      } else {
        setEmailSent(true)
      }
    } catch (error) {
      console.error('Auth error:', error)
      alert('Error al enviar el enlace mágico')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bone-white)] pt-24">
      <div className="max-w-md mx-auto px-8 py-16">
        <header className="mb-12 text-center">
          <h1 className="text-4xl mb-4" style={{ color: 'var(--charcoal-brown)' }}>
            Anchor:23
          </h1>
          <p className="text-lg opacity-80" style={{ color: 'var(--charcoal-brown)' }}>
            Accede a tu cuenta
          </p>
        </header>

        <Card className="border-none" style={{ background: 'var(--soft-cream)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--charcoal-brown)' }}>
              {emailSent ? 'Enlace Enviado' : 'Bienvenido'}
            </CardTitle>
            <CardDescription>
              {emailSent
                ? 'Revisa tu email y haz clic en el enlace para acceder'
                : 'Ingresa tu email para recibir un enlace mágico de acceso'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-4">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <p className="text-sm" style={{ color: 'var(--charcoal-brown)' }}>
                  Hemos enviado un enlace mágico a <strong>{email}</strong>
                </p>
                <p className="text-xs opacity-70" style={{ color: 'var(--charcoal-brown)' }}>
                  El enlace expirará en 1 hora. Revisa tu bandeja de entrada y carpeta de spam.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setEmailSent(false)}
                  className="w-full"
                >
                  Enviar otro enlace
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 opacity-50" style={{ color: 'var(--mocha-taupe)' }} />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                      style={{ borderColor: 'var(--mocha-taupe)' }}
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full"
                >
                  {loading ? 'Enviando...' : 'Enviar Enlace Mágico'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm opacity-70 mb-4" style={{ color: 'var(--charcoal-brown)' }}>
            ¿No necesitas cuenta? Reserva como invitado
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/servicios'}
          >
            Reservar sin Cuenta
          </Button>
        </div>
      </div>
    </div>
  )
}
