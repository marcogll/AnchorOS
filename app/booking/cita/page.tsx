'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Calendar, Clock, MapPin, Mail, Phone, Search, User } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import MockPaymentForm from '@/components/booking/mock-payment-form'

export default function CitaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [step, setStep] = useState<'search' | 'details' | 'payment' | 'success'>('search')
  const [searchValue, setSearchValue] = useState('')
  const [searchType, setSearchType] = useState<'email' | 'phone'>('email')
  const [customer, setCustomer] = useState<any>(null)
  const [searchingCustomer, setSearchingCustomer] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    notas: ''
  })
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const [pageLoading, setPageLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [depositAmount, setDepositAmount] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const service_id = searchParams.get('service_id')
    const location_id = searchParams.get('location_id')
    const date = searchParams.get('date')
    const time = searchParams.get('time')
    const customer_id = searchParams.get('customer_id')
    const staff_id = searchParams.get('staff_id')

    if (service_id && location_id && date && time) {
      fetchBookingDetails(service_id, location_id, date, time, staff_id)
    }

    if (customer_id) {
      fetchCustomerById(customer_id)
    }
  }, [searchParams])

  const fetchCustomerById = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers?email=${customerId}`)
      const data = await response.json()
      
      if (data.exists && data.customer) {
        setCustomer(data.customer)
        setFormData(prev => ({
          ...prev,
          nombre: `${data.customer.first_name} ${data.customer.last_name}`,
          email: data.customer.email,
          telefono: data.customer.phone || ''
        }))
        setStep('details')
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
    }
  }

  const fetchBookingDetails = async (serviceId: string, locationId: string, date: string, time: string, staffId?: string | null) => {
    try {
      const response = await fetch(`/api/availability/time-slots?location_id=${locationId}&service_id=${serviceId}&date=${date}`)
      const data = await response.json()

      if (data.availability?.services) {
        const service = data.availability.services[0]
        const deposit = Math.min(service.base_price * 0.5, 200)
        setDepositAmount(deposit)
      }

      setBookingDetails({
        service_id: serviceId,
        location_id: locationId,
        date: date,
        time: time,
        startTime: `${date}T${time}`,
        staff_id: staffId || null
      })
    } catch (error) {
      console.error('Error fetching booking details:', error)
      setErrors({ fetch: 'Error al cargar los detalles de la reserva' })
    }
  }

  const handleSearchCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearchingCustomer(true)
    setErrors({})

    if (!searchValue.trim()) {
      setErrors({ search: 'Ingresa un email o teléfono' })
      setSearchingCustomer(false)
      return
    }

    try {
      const response = await fetch(`/api/customers?${searchType}=${encodeURIComponent(searchValue)}`)
      const data = await response.json()

      if (data.exists && data.customer) {
        setCustomer(data.customer)
        setFormData(prev => ({
          ...prev,
          nombre: `${data.customer.first_name} ${data.customer.last_name}`,
          email: data.customer.email,
          telefono: data.customer.phone || ''
        }))
        setStep('details')
      } else {
        const params = new URLSearchParams({
          ...Object.fromEntries(searchParams.entries()),
          [searchType]: searchValue
        })
        router.push(`/booking/registro?${params.toString()}`)
      }
    } catch (error) {
      console.error('Error searching customer:', error)
      setErrors({ search: 'Error al buscar cliente' })
    } finally {
      setSearchingCustomer(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setPageLoading(true)

    const validationErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      validationErrors.nombre = 'Nombre requerido'
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      validationErrors.email = 'Email inválido'
    }

    if (!formData.telefono.trim()) {
      validationErrors.telefono = 'Teléfono requerido'
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      setPageLoading(false)
      return
    }

    setShowPayment(true)
    setPageLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleMockPayment = async (paymentMethod: any) => {
    setPageLoading(true)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_id: customer?.id,
          customer_email: formData.email,
          customer_phone: formData.telefono,
          customer_first_name: formData.nombre.split(' ')[0] || formData.nombre,
          customer_last_name: formData.nombre.split(' ').slice(1).join(' '),
          service_id: bookingDetails.service_id,
          location_id: bookingDetails.location_id,
          start_time_utc: bookingDetails.startTime,
          notes: formData.notas,
          staff_id: bookingDetails.staff_id,
          payment_method_id: 'mock_' + paymentMethod.cardNumber.slice(-4),
          deposit_amount: depositAmount
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSubmitted(true)
      } else {
        setErrors({ submit: data.error || 'Error al crear la reserva' })
        setPageLoading(false)
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      setErrors({ submit: 'Error al crear la reserva' })
      setPageLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bone-white)' }}>
        <div className="max-w-md w-full px-6">
          <Card style={{ background: 'var(--soft-cream)', borderColor: 'var(--mocha-taupe)', borderWidth: '1px' }}>
            <CardContent className="pt-12 text-center">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-6" style={{ color: 'var(--deep-earth)' }} />
              <h1 className="text-3xl font-bold mb-4 font-serif" style={{ color: 'var(--charcoal-brown)' }}>
                ¡Reserva Confirmada!
              </h1>
              <p className="text-lg mb-6" style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
                Hemos enviado un correo de confirmación con los detalles de tu cita.
              </p>
              <div className="space-y-2 text-sm text-left mb-8 p-4 rounded-lg" style={{ background: 'var(--bone-white)', color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                <p>Fecha: {format(new Date(bookingDetails.date), 'PPP', { locale: es })}</p>
                <p>Hora: {bookingDetails.time}</p>
                <p>Depósito pagado: ${depositAmount.toFixed(2)} USD</p>
              </div>
              <Button
                onClick={() => window.location.href = '/'}
                className="w-full"
                style={{ background: 'var(--deep-earth)' }}
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bone-white)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--charcoal-brown)' }}>Cargando detalles de la reserva...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bone-white)' }}>
      <div className="max-w-4xl mx-auto px-6 py-24">
        <header className="mb-8">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/booking/servicios'}
            style={{ borderColor: 'var(--mocha-taupe)', color: 'var(--charcoal-brown)' }}
          >
            ← Volver
          </Button>
        </header>

        {step === 'search' && (
          <div className="max-w-md mx-auto">
            <Card style={{ background: 'var(--soft-cream)', borderColor: 'var(--mocha-taupe)', borderWidth: '1px' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--charcoal-brown)' }}>
                  Buscar Cliente
                </CardTitle>
                <CardDescription>
                  Ingresa tu email o teléfono para continuar con la reserva
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearchCustomer} className="space-y-6">
                  <div>
                    <Label htmlFor="searchType">Buscar por</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        variant={searchType === 'email' ? 'default' : 'outline'}
                        onClick={() => setSearchType('email')}
                        style={searchType === 'email' ? { background: 'var(--deep-earth)' } : { borderColor: 'var(--mocha-taupe)', color: 'var(--charcoal-brown)' }}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                      <Button
                        type="button"
                        variant={searchType === 'phone' ? 'default' : 'outline'}
                        onClick={() => setSearchType('phone')}
                        style={searchType === 'phone' ? { background: 'var(--deep-earth)' } : { borderColor: 'var(--mocha-taupe)', color: 'var(--charcoal-brown)' }}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Teléfono
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="searchValue">{searchType === 'email' ? 'Email' : 'Teléfono'}</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 opacity-50" style={{ color: 'var(--mocha-taupe)' }} />
                      <Input
                        id="searchValue"
                        type={searchType === 'email' ? 'email' : 'tel'}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-10"
                        style={{ borderColor: errors.search ? '#ef4444' : 'var(--mocha-taupe)' }}
                        placeholder={searchType === 'email' ? 'tu@email.com' : '+52 844 123 4567'}
                      />
                    </div>
                    {errors.search && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.search}</p>}
                  </div>

                  <Button
                    type="submit"
                    disabled={searchingCustomer || !searchValue.trim()}
                    className="w-full"
                    style={{ background: 'var(--deep-earth)' }}
                  >
                    {searchingCustomer ? 'Buscando...' : 'Buscar Cliente'}
                  </Button>

                  {customer && (
                    <div className="p-4 rounded-lg" style={{ background: 'var(--bone-white)', color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                      <p className="font-medium mb-1">Cliente encontrado:</p>
                      <p className="text-sm">{customer.first_name} {customer.last_name}</p>
                      <p className="text-sm">{customer.email}</p>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'details' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card style={{ background: 'var(--soft-cream)', borderColor: 'var(--mocha-taupe)', borderWidth: '1px' }}>
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
                          {format(parseISO(bookingDetails.time), 'HH:mm', { locale: es })}
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

                    {customer && (
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 mt-1" style={{ color: 'var(--mocha-taupe)' }} />
                        <div>
                          <p className="font-medium" style={{ color: 'var(--charcoal-brown)' }}>Cliente</p>
                          <p style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}>
                            {customer.first_name} {customer.last_name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {showPayment && (
                <Card style={{ background: 'var(--soft-cream)', borderColor: 'var(--mocha-taupe)', borderWidth: '1px' }}>
                  <CardHeader>
                    <CardTitle style={{ color: 'var(--charcoal-brown)' }}>
                      Pago del Depósito
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4" style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                      Se requiere un depósito del 50% del servicio (máximo $200) para confirmar tu reserva.
                    </p>
                    <MockPaymentForm
                      amount={depositAmount}
                      onSubmit={handleMockPayment}
                      disabled={pageLoading}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            <Card style={{ background: 'var(--soft-cream)', borderColor: 'var(--mocha-taupe)', borderWidth: '1px' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--charcoal-brown)' }}>
                  Tus Datos
                </CardTitle>
                <CardDescription style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                  {customer ? 'Verifica y confirma tus datos' : 'Ingresa tus datos personales para completar la reserva'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {showPayment ? (
                  <div className="text-center py-8" style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                    Datos completados. Por favor completa el pago para confirmar.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="nombre">Nombre Completo *</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Ej. María García"
                        className="w-full"
                        style={{ borderColor: errors.nombre ? '#ef4444' : 'var(--mocha-taupe)' }}
                      />
                      {errors.nombre && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.nombre}</p>}
                    </div>

                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                        className="w-full"
                        style={{ borderColor: errors.email ? '#ef4444' : 'var(--mocha-taupe)' }}
                      />
                      {errors.email && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.email}</p>}
                    </div>

                    <div>
                      <Label htmlFor="telefono">Teléfono *</Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="+52 844 123 4567"
                        className="w-full"
                        style={{ borderColor: errors.telefono ? '#ef4444' : 'var(--mocha-taupe)' }}
                      />
                      {errors.telefono && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{errors.telefono}</p>}
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

                    {errors.submit && (
                      <div className="p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#ef4444' }}>
                        {errors.submit}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={pageLoading}
                      className="w-full"
                      style={{ background: 'var(--deep-earth)' }}
                    >
                      {pageLoading ? 'Procesando...' : 'Continuar al Pago'}
                    </Button>

                    <div className="text-sm" style={{ color: 'var(--charcoal-brown)', opacity: 0.6 }}>
                      * Al confirmar tu reserva, recibirás un correo de confirmación con los detalles.
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
