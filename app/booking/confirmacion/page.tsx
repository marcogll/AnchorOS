'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, Calendar, Clock, MapPin, User, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/** @description Booking confirmation page component displaying appointment details and important information after successful booking. */
export default function ConfirmacionPage() {
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shortId = params.get('short_id')

    if (shortId) {
      fetchBookingDetails(shortId)
    }
  }, [])

  const fetchBookingDetails = async (shortId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/bookings?short_id=${shortId}`)
      const data = await response.json()

      if (data.success && data.bookings && data.bookings[0]) {
        setBookingDetails(data.bookings[0])
        setVerified(true)
      } else {
        alert('No se encontró la reserva con el código proporcionado')
      }
    } catch (error) {
      console.error('Error fetching booking details:', error)
      alert('Error al cargar los detalles de la reserva')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bone-white)] flex items-center justify-center pt-24">
        <div className="text-center">
          <p>Cargando detalles de la reserva...</p>
        </div>
      </div>
    )
  }

  if (!verified) {
    return (
      <div className="min-h-screen bg-[var(--bone-white)] pt-24">
        <div className="max-w-md mx-auto px-8">
          <Card className="border-none" style={{ background: 'var(--soft-cream)' }}>
            <CardContent className="pt-12">
              <p className="text-center mb-4" style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
                Código no válido o reserva no encontrada.
              </p>
              <Button
                onClick={() => window.location.href = '/booking/servicios'}
                className="w-full"
              >
                Volver a Reservar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bone-white)] pt-24">
      <div className="max-w-2xl mx-auto px-8 py-16">
        <header className="mb-12 text-center">
          <CheckCircle2 className="w-20 h-20 mx-auto mb-6" style={{ color: 'var(--deep-earth)' }} />
          <h1 className="text-4xl mb-4" style={{ color: 'var(--charcoal-brown)' }}>
            ¡Reserva Confirmada!
          </h1>
          <p className="text-xl opacity-80" style={{ color: 'var(--charcoal-brown)' }}>
            Tu cita ha sido confirmada exitosamente.
          </p>
        </header>

        <Card className="border-none mb-8" style={{ background: 'var(--soft-cream)' }}>
          <CardContent className="pt-8">
            <h2 className="text-2xl mb-6" style={{ color: 'var(--charcoal-brown)' }}>
              Detalles de la Cita
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Calendar className="w-6 h-6 mt-1" style={{ color: 'var(--mocha-taupe)' }} />
                <div>
                  <p className="font-medium" style={{ color: 'var(--charcoal-brown)' }}>Fecha</p>
                  <p style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
                    {format(new Date(bookingDetails.start_time_utc), 'EEEE, d MMMM yyyy', { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock className="w-6 h-6 mt-1" style={{ color: 'var(--mocha-taupe)' }} />
                <div>
                  <p className="font-medium" style={{ color: 'var(--charcoal-brown)' }}>Hora</p>
                  <p style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
                    {format(new Date(bookingDetails.start_time_utc), 'HH:mm', { locale: es })} - {format(new Date(bookingDetails.end_time_utc), 'HH:mm', { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <User className="w-6 h-6 mt-1" style={{ color: 'var(--mocha-taupe)' }} />
                <div>
                  <p className="font-medium" style={{ color: 'var(--charcoal-brown)' }}>Servicio</p>
                  <p style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
                    {bookingDetails.service?.name}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--charcoal-brown)', opacity: 0.6 }}>
                    Duración: {bookingDetails.service?.duration_minutes} minutos
                  </p>
                </div>
              </div>

              {bookingDetails.staff && (
                <div className="flex items-start gap-4">
                  <User className="w-6 h-6 mt-1" style={{ color: 'var(--mocha-taupe)' }} />
                  <div>
                    <p className="font-medium" style={{ color: 'var(--charcoal-brown)' }}>Estilista</p>
                    <p style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
                      {bookingDetails.staff.display_name}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <MapPin className="w-6 h-6 mt-1" style={{ color: 'var(--mocha-taupe)' }} />
                <div>
                  <p className="font-medium" style={{ color: 'var(--charcoal-brown)' }}>Ubicación</p>
                  <p style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
                    {bookingDetails.location?.name}
                  </p>
                </div>
              </div>

              {bookingDetails.resource && (
                <div className="flex items-start gap-4">
                  <User className="w-6 h-6 mt-1" style={{ color: 'var(--mocha-taupe)' }} />
                  <div>
                    <p className="font-medium" style={{ color: 'var(--charcoal-brown)' }}>Estación</p>
                    <p style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
                      {bookingDetails.resource.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none mb-8" style={{ background: 'var(--soft-cream)' }}>
          <CardContent className="pt-8">
            <h2 className="text-2xl mb-6" style={{ color: 'var(--charcoal-brown)' }}>
              Tu Código de Reserva
            </h2>

            <div className="text-center mb-6">
              <div className="inline-block p-6 rounded-lg" style={{ background: 'var(--charcoal-brown)', color: 'var(--bone-white)' }}>
                <p className="text-5xl font-bold tracking-widest">
                  {bookingDetails.short_id}
                </p>
              </div>
            </div>

            <p className="text-center" style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
              Guarda este código para tu referencia y confirma tu llegada en el kiosko.
            </p>
          </CardContent>
        </Card>

        <Card className="border-none mb-8" style={{ background: 'var(--soft-cream)' }}>
          <CardContent className="pt-8">
            <h2 className="text-2xl mb-6" style={{ color: 'var(--charcoal-brown)' }}>
              Información Importante
            </h2>

            <div className="space-y-4" style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--mocha-taupe)' }} />
                <p className="text-sm">
                  <strong>Llega 10 minutos antes</strong> de tu cita para garantizar el mejor servicio.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--mocha-taupe)' }} />
                <p className="text-sm">
                  <strong>Cancelaciones</strong> deben hacerse con al menos 24 horas de anticipación.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--mocha-taupe)' }} />
                <p className="text-sm">
                  <strong>Kiosko:</strong> Confirma tu llegada al llegar usando el código de 6 caracteres.
                </p>
              </div>

              {bookingDetails.service?.base_price && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--mocha-taupe)' }} />
                  <p className="text-sm">
                    <strong>Pago:</strong> El pago se realiza en el salón al término del servicio.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/booking/servicios'}
            className="flex-1"
          >
            Nueva Reserva
          </Button>

          <Button
            onClick={() => window.location.href = '/'}
            className="flex-1"
          >
            Volver al Inicio
          </Button>
        </div>
      </div>
    </div>
  )
}
