'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceAssignment } from './ResourceAssignment'
import { Clock, User, Mail, Phone, CheckCircle } from 'lucide-react'

interface WalkInFlowProps {
  apiKey: string
  onComplete: (booking: any) => void
  onCancel: () => void
}

/**
 * WalkInFlow component that manages the walk-in booking process in steps.
 */
export function WalkInFlow({ apiKey, onComplete, onCancel }: WalkInFlowProps) {
  const [step, setStep] = useState<'services' | 'customer' | 'confirm' | 'success'>('services')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [services, setServices] = useState<any[]>([])
  const [selectedService, setSelectedService] = useState<any>(null)
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [availableResources, setAvailableResources] = useState<any[] | null>(null)
  const [createdBooking, setCreatedBooking] = useState<any>(null)

  const loadServices = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/services', {
        headers: {
          'x-kiosk-api-key': apiKey
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar servicios')
      }

      setServices(data.services || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar servicios')
    } finally {
      setLoading(false)
    }
  }

  const checkAvailability = async (service: any) => {
    setLoading(true)
    setError(null)

    try {
      const now = new Date()
      const endTime = new Date(now)
      endTime.setMinutes(endTime.getMinutes() + service.duration_minutes)

      const response = await fetch(
        `/api/kiosk/resources/available?start_time=${now.toISOString()}&end_time=${endTime.toISOString()}&service_id=${service.id}`,
        {
          headers: {
            'x-kiosk-api-key': apiKey
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al verificar disponibilidad')
      }

      if (data.resources.length === 0) {
        setError('No hay espacios disponibles ahora mismo')
        return
      }

      setSelectedService(service)
      setAvailableResources(data.resources)
      setStep('customer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar disponibilidad')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerSubmit = async () => {
    if (!customerData.name || !customerData.email) {
      setError('Nombre y email son requeridos')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerData.email)) {
      setError('Email inválido')
      return
    }

    setStep('confirm')
  }

  const handleConfirmBooking = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/kiosk/walkin', {
        method: 'POST',
        headers: {
          'x-kiosk-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_email: customerData.email,
          customer_phone: customerData.phone,
          customer_name: customerData.name,
          service_id: selectedService.id,
          notes: 'Walk-in desde kiosko'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear reserva')
      }

      setCreatedBooking(data.booking)
      setStep('success')
      onComplete(data.booking)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear reserva')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount)
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Monterrey'
    }).format(date)
  }

  if (step === 'services') {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Reserva Inmediata (Walk-in)</CardTitle>
          <CardDescription>
            Selecciona el servicio que deseas recibir ahora
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {services.length === 0 && !loading && (
            <Button onClick={loadServices} className="w-full">
              Cargar Servicios
            </Button>
          )}

          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              Cargando servicios...
            </div>
          )}

          {services.length > 0 && (
            <div className="grid gap-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => checkAvailability(service)}
                  disabled={loading}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatCurrency(service.base_price)}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {service.duration_minutes} min
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <Button variant="outline" onClick={onCancel} className="w-full">
            Cancelar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === 'customer') {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Tus Datos</CardTitle>
          <CardDescription>
            Ingresa tu información para crear la reserva
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedService && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="font-semibold">{selectedService.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(selectedService.base_price)} • {selectedService.duration_minutes} min
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Nombre completo
              </label>
              <Input
                id="name"
                placeholder="Ej: María García"
                value={customerData.name}
                onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Ej: maria@email.com"
                value={customerData.email}
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Teléfono (opcional)
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="Ej: 8112345678"
                value={customerData.phone}
                onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep('services')}
              className="flex-1"
              disabled={loading}
            >
              Atrás
            </Button>
            <Button
              onClick={handleCustomerSubmit}
              className="flex-1"
              disabled={loading}
            >
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'confirm') {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Confirmar Reserva</CardTitle>
          <CardDescription>
            Revisa los detalles antes de confirmar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="font-semibold mb-2">Servicio</h3>
              <p className="text-lg">{selectedService.name}</p>
              <p className="text-muted-foreground">
                {formatCurrency(selectedService.base_price)} • {selectedService.duration_minutes} minutos
              </p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="font-semibold mb-2">Cliente</h3>
              <p className="font-medium">{customerData.name}</p>
              <p className="text-sm text-muted-foreground">{customerData.email}</p>
              {customerData.phone && (
                <p className="text-sm text-muted-foreground">{customerData.phone}</p>
              )}
            </div>

            {availableResources && (
              <ResourceAssignment
                resources={availableResources}
                start_time={new Date().toISOString()}
                end_time={new Date(Date.now() + selectedService.duration_minutes * 60000).toISOString()}
              />
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setStep('customer')}
              className="flex-1"
              disabled={loading}
            >
              Atrás
            </Button>
            <Button
              onClick={handleConfirmBooking}
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Creando reserva...' : 'Confirmar Reserva'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (step === 'success' && createdBooking) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            ¡Reserva Creada con Éxito!
          </CardTitle>
          <CardDescription>
            Tu código de reserva es: <span className="font-mono font-bold">{createdBooking.short_id}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="font-semibold mb-3">Detalles de la Reserva</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Código:</span>
                <span className="font-mono font-bold">{createdBooking.short_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Servicio:</span>
                <span>{createdBooking.service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Artista:</span>
                <span>{createdBooking.staff_name || createdBooking.staff?.display_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Espacio:</span>
                <span>{createdBooking.resource_name || createdBooking.resource?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hora:</span>
                <span>{formatDateTime(createdBooking.start_time_utc)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado:</span>
                <span className="text-green-600 font-semibold">Confirmada</span>
              </div>
            </div>
          </div>

          <Button onClick={onCancel} className="w-full">
            Volver al Inicio
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}
