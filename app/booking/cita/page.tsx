'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Calendar, Clock, MapPin, CreditCard } from 'lucide-react'
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '@/lib/auth/context'

/** @description Booking confirmation and payment page component for completing appointment reservations. */
export default function CitaPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    notas: ''
  })
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const [pageLoading, setPageLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState<any>(null)
  const [showPayment, setShowPayment] = useState(false)
  const stripe = useStripe()
  const elements = useElements()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/booking/login?redirect=/booking/cita' + window.location.search)
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bone-white)] pt-24 flex items-center justify-center">
        <div className="text-center">
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const service_id = params.get('service_id')
    const location_id = params.get('location_id')
    const date = params.get('date')
    const time = params.get('time')

    if (service_id && location_id && date && time) {
      fetchBookingDetails(service_id, location_id, date, time)
    }
  }, [])

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || ''
      }))
    }
  }, [user])

  const fetchBookingDetails = async (serviceId: string, locationId: string, date: string, time: string) => {
    try {
      const response = await fetch(`/api/availability/time-slots?location_id=${locationId}&service_id=${serviceId}&date=${date}`)
      const data = await response.json()
      
      setBookingDetails({
        service_id: serviceId,
        location_id: locationId,
        date: date,
        time: time,
        startTime: `${date}T${time}`
      })
    } catch (error) {
      console.error('Error fetching booking details:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPageLoading(true)

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_email: formData.email,
          customer_phone: formData.telefono,
          customer_first_name: formData.nombre.split(' ')[0] || formData.nombre,
          customer_last_name: formData.nombre.split(' ').slice(1).join(' '),
          service_id: bookingDetails.service_id,
          location_id: bookingDetails.location_id,
          start_time_utc: bookingDetails.startTime,
          notes: formData.notas
        })
      })

      const data = await response.json()

      if (response.ok) {
        setPaymentIntent(data)
        setShowPayment(true)
      } else {
        alert('Error al preparar el pago: ' + (data.error || 'Error desconocido'))
      }
    } catch (error) {
      console.error('Error creating payment intent:', error)
      alert('Error al preparar el pago')
    } finally {
      setPageLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePayment = async () => {
    if (!stripe || !elements) return

    setPageLoading(true)

    const { error } = await stripe.confirmCardPayment(paymentIntent.clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      }
    })

    if (error) {
      alert('Error en el pago: ' + error.message)
      setPageLoading(false)
    } else {
      // Payment succeeded, create booking
      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            customer_email: formData.email,
            customer_phone: formData.telefono,
            customer_first_name: formData.nombre.split(' ')[0] || formData.nombre,
            customer_last_name: formData.nombre.split(' ').slice(1).join(' '),
            service_id: bookingDetails.service_id,
            location_id: bookingDetails.location_id,
            start_time_utc: bookingDetails.startTime,
            notes: formData.notas,
            payment_intent_id: paymentIntent.id
          })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setSubmitted(true)
        } else {
          alert('Error al crear la reserva: ' + (data.error || 'Error desconocido'))
        }
      } catch (error) {
        console.error('Error creating booking:', error)
        alert('Error al crear la reserva')
      } finally {
        setPageLoading(false)
      }
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--bone-white)] pt-24 flex items-center justify-center">
        <div className="max-w-md w-full px-8">
          <Card className="border-none" style={{ background: 'var(--soft-cream)' }}>
            <CardContent className="pt-12 text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-6" style={{ color: 'var(--deep-earth)' }} />
              <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--charcoal-brown)' }}>
                ¡Reserva Confirmada!
              </h1>
              <p className="text-lg mb-6" style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
                Hemos enviado un correo de confirmación con los detalles de tu cita.
              </p>
              <div className="space-y-2 text-sm" style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                <p>Fecha: {format(new Date(bookingDetails.date), 'PPP', { locale: es })}</p>
                <p>Hora: {bookingDetails.time}</p>
                <p>Puedes agregar esta cita a tu calendario.</p>
              </div>
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Volver al Inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen bg-[var(--bone-white)] pt-24 flex items-center justify-center">
        <div className="text-center">
          <p>Cargando detalles de la reserva...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bone-white)] pt-24">
      <div className="max-w-4xl mx-auto px-8 py-16">
        <header className="mb-12">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/booking/servicios'}
          >
            ← Volver
          </Button>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="border-none" style={{ background: 'var(--soft-cream)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--charcoal-brown)' }}>
                Resumen de la Cita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-1" style={{ color: 'var(--mocha-taupe)' }} />
                  <div>
                    <p className="font-medium" style={{ color: 'var(--charcoal-brown)' }}>Fecha</p>
                    <p style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
                      {format(new Date(bookingDetails.date), 'PPP', { locale: es })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 mt-1" style={{ color: 'var(--mocha-taupe)' }} />
                  <div>
                    <p className="font-medium" style={{ color: 'var(--charcoal-brown)' }}>Hora</p>
                    <p style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
                      {bookingDetails.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1" style={{ color: 'var(--mocha-taupe)' }} />
                  <div>
                    <p className="font-medium" style={{ color: 'var(--charcoal-brown)' }}>Ubicación</p>
                    <p style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
                      Anchor:23 - Saltillo
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none" style={{ background: 'var(--soft-cream)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--charcoal-brown)' }}>
                Tus Datos
              </CardTitle>
              <CardDescription>
                Ingresa tus datos personales para completar la reserva
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej. María García"
                    className="w-full"
                    style={{ borderColor: 'var(--mocha-taupe)' }}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="tu@email.com"
                    className="w-full"
                    style={{ borderColor: 'var(--mocha-taupe)' }}
                  />
                </div>

                <div>
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                    placeholder="+52 844 123 4567"
                    className="w-full"
                    style={{ borderColor: 'var(--mocha-taupe)' }}
                  />
                </div>

                <div>
                  <Label htmlFor="notas">Notas (opcional)</Label>
                  <textarea
                    id="notas"
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Alguna observación o preferencia..."
                    className="w-full px-4 py-3 border rounded-lg resize-none"
                    style={{ borderColor: 'var(--mocha-taupe)' }}
                  />
                </div>

                {showPayment ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg" style={{ background: 'var(--bone-white)' }}>
                      <Label>Información de Pago</Label>
                      <p className="text-sm opacity-70 mb-4">
                        Depósito requerido: ${(paymentIntent.amount / 100).toFixed(2)} USD
                        (50% del servicio o $200 máximo)
                      </p>
                      <div className="border rounded-lg p-4" style={{ borderColor: 'var(--mocha-taupe)' }}>
                        <CardElement
                          options={{
                            style: {
                              base: {
                                fontSize: '16px',
                                color: 'var(--charcoal-brown)',
                                '::placeholder': {
                                  color: 'var(--mocha-taupe)',
                                },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handlePayment}
                      disabled={!stripe || pageLoading}
                      className="w-full"
                    >
                      {pageLoading ? 'Procesando Pago...' : 'Pagar y Confirmar Reserva'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="submit"
                    disabled={pageLoading}
                  >
                    {pageLoading ? 'Procesando...' : 'Continuar al Pago'}
                  </Button>
                )}
              </form>

              <div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--bone-white)' }}>
                <p className="text-sm" style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                  * Al confirmar tu reserva, recibirás un correo de confirmación
                  con los detalles. Se requiere un depósito para confirmar.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
