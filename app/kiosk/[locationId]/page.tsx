'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookingConfirmation } from '@/components/kiosk/BookingConfirmation'
import { WalkInFlow } from '@/components/kiosk/WalkInFlow'
import { Calendar, UserPlus, MapPin, Clock } from 'lucide-react'

export default function KioskPage({ params }: { params: { locationId: string } }) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [location, setLocation] = useState<any>(null)
  const [currentView, setCurrentView] = useState<'home' | 'confirm' | 'walkin'>('home')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const authenticateKiosk = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/kiosk/authenticate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            api_key: process.env.NEXT_PUBLIC_KIOSK_API_KEY || 'demo-api-key-64-characters-long-enough'
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Authentication failed')
        }

        setApiKey(data.kiosk.device_name)
        setLocation(data.kiosk.location)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de autenticación del kiosko')
      } finally {
        setLoading(false)
      }
    }

    authenticateKiosk()
  }, [])

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: location?.timezone || 'America/Monterrey'
    }).format(date)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Iniciando kiosko...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error de Conexión</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
              {error}
            </div>
            <Button onClick={() => window.location.reload()} className="w-full">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (currentView === 'confirm') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <BookingConfirmation
          apiKey={apiKey || ''}
          onConfirm={(booking) => {
            setCurrentView('home')
          }}
          onCancel={() => setCurrentView('home')}
        />
      </div>
    )
  }

  if (currentView === 'walkin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <WalkInFlow
          apiKey={apiKey || ''}
          onComplete={(booking) => {
            setCurrentView('home')
          }}
          onCancel={() => setCurrentView('home')}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {location?.name || 'Kiosko'}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>Kiosko Principal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{formatDateTime(currentTime)}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">ID del Kiosko</p>
              <p className="font-mono text-lg">{apiKey || 'N/A'}</p>
            </div>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-400"
            onClick={() => setCurrentView('confirm')}
          >
            <CardHeader>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Confirmar Cita</CardTitle>
              <CardDescription>
                Confirma tu llegada ingresando el código de tu cita
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                Confirmar Cita
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-pink-400"
            onClick={() => setCurrentView('walkin')}
          >
            <CardHeader>
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="w-8 h-8 text-pink-600" />
              </div>
              <CardTitle className="text-2xl">Reserva Inmediata</CardTitle>
              <CardDescription>
                Crea una reserva sin cita previa (Walk-in)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" variant="outline">
                Crear Reserva
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Instrucciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Confirmar Cita
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Selecciona "Confirmar Cita"</li>
                  <li>Ingresa el código de 6 caracteres de tu reserva</li>
                  <li>Verifica los detalles de tu cita</li>
                  <li>Confirma tu llegada</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-pink-600" />
                  Reserva Inmediata
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Selecciona "Reserva Inmediata"</li>
                  <li>Elige el servicio que deseas</li>
                  <li>Ingresa tus datos personales</li>
                  <li>Confirma la reserva</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>SalonOS Kiosk v1.0</p>
          <p className="mt-1">Necesitas ayuda? Contacta al personal del salón</p>
        </footer>
      </div>
    </div>
  )
}
