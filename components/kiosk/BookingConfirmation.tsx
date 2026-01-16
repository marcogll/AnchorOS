'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface BookingConfirmationProps {
  apiKey: string
  onConfirm: (booking: any) => void
  onCancel: () => void
}

export function BookingConfirmation({ apiKey, onConfirm, onCancel }: BookingConfirmationProps) {
  const [shortId, setShortId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<any>(null)
  const [confirming, setConfirming] = useState(false)

  const handleSearch = async () => {
    if (!shortId || shortId.length !== 6) {
      setError('Ingresa el código de 6 caracteres de tu cita')
      return
    }

    setLoading(true)
    setError(null)
    setBooking(null)

    try {
      const response = await fetch(`/api/kiosk/bookings?short_id=${shortId}`, {
        headers: {
          'x-kiosk-api-key': apiKey
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'No se encontró la cita')
      }

      if (!data.bookings || data.bookings.length === 0) {
        setError('No se encontró ninguna cita con ese código')
        return
      }

      const foundBooking = data.bookings[0]
      
      if (foundBooking.status !== 'pending') {
        setError(`La cita ya está ${foundBooking.status === 'confirmed' ? 'confirmada' : foundBooking.status}`)
        setBooking(foundBooking)
        return
      }

      setBooking(foundBooking)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar la cita')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!booking) return

    setConfirming(true)
    setError(null)

    try {
      const response = await fetch(`/api/kiosk/bookings/${shortId}/confirm`, {
        method: 'POST',
        headers: {
          'x-kiosk-api-key': apiKey
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al confirmar la cita')
      }

      onConfirm(data.booking)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al confirmar la cita')
    } finally {
      setConfirming(false)
    }
  }

  const formatDateTime = (dateTime: string, timezone: string) => {
    const date = new Date(dateTime)
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: timezone || 'America/Monterrey'
    }).format(date)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Confirmar Cita</CardTitle>
        <CardDescription>
          Ingresa el código de tu cita para confirmar tu llegada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!booking ? (
          <>
            <div className="space-y-2">
              <label htmlFor="shortId" className="text-sm font-medium">
                Código de Cita (6 caracteres)
              </label>
              <div className="flex gap-2">
                <Input
                  id="shortId"
                  placeholder="Ej: ABC123"
                  value={shortId}
                  onChange={(e) => setShortId(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest uppercase"
                  disabled={loading}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <Button variant="outline" onClick={onCancel} className="w-full">
              Cancelar
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold text-lg mb-3">Detalles de la Cita</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Código:</span>
                  <span className="font-mono font-bold">{booking.short_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servicio:</span>
                  <span>{booking.service?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duración:</span>
                  <span>{booking.service?.duration_minutes} minutos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Artista:</span>
                  <span>{booking.staff?.display_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Espacio:</span>
                  <span>{booking.resource?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha:</span>
                  <span>{formatDateTime(booking.start_time_utc, 'America/Monterrey')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <span className={`font-semibold ${
                    booking.status === 'confirmed' ? 'text-green-600' : 
                    booking.status === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                  }`}>
                    {booking.status === 'confirmed' ? 'Confirmada' :
                     booking.status === 'pending' ? 'Pendiente' :
                     booking.status}
                  </span>
                </div>
              </div>
            </div>

            {booking.status === 'pending' && (
              <>
                <Button 
                  onClick={handleConfirm} 
                  disabled={confirming}
                  className="w-full"
                  size="lg"
                >
                  {confirming ? 'Confirmando...' : 'Confirmar Llegada'}
                </Button>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={() => {
                setBooking(null)
                setShortId('')
                setError(null)
              }}
              className="w-full"
            >
              Buscar otra cita
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
