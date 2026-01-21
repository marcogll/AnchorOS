'use client'

/**
 * @description Service selection and appointment booking page for The Boutique
 * @audit BUSINESS RULE: Multi-step booking flow: service → datetime → confirm → client registration
 * @audit SECURITY: Public endpoint with rate limiting recommended for availability checks
 * @audit Validate: All steps must be completed before final booking submission
 * @audit PERFORMANCE: Auto-fetches services, locations, and time slots based on selections
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, User, Check } from 'lucide-react'
import { format, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import DatePicker from '@/components/booking/date-picker'

interface Service {
  id: string
  name: string
  duration_minutes: number
  base_price: number
}

interface Location {
  id: string
  name: string
  timezone: string
}

interface Staff {
  id: string
  display_name: string
  role: string
}

type BookingStep = 'service' | 'datetime' | 'artist' | 'confirm' | 'client'

/**
 * @description Booking flow page guiding customers through service selection, date/time, and confirmation
 * @returns {JSX.Element} Multi-step booking wizard with service cards, date picker, time slots, and confirmation
 * @audit BUSINESS RULE: Time slots filtered by service duration and staff availability
 * @audit BUSINESS RULE: Time slots respect location business hours and existing bookings
 * @audit SECURITY: Public endpoint; no authentication required for browsing
 * @audit Validate: Service, location, date, and time required before proceeding
 * @audit PERFORMANCE: Dynamic time slot loading based on service and date selection
 * @audit AUDIT: Booking attempts logged for analytics and capacity planning
 */
export default function ServiciosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [timeSlots, setTimeSlots] = useState<any[]>([])
  const [selectedTime, setSelectedTime] = useState<string>('')
  const [availableArtists, setAvailableArtists] = useState<Staff[]>([])
  const [selectedArtist, setSelectedArtist] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<BookingStep>('service')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchServices()
    fetchLocations()
  }, [])

  useEffect(() => {
    if (selectedService && selectedLocation && selectedDate) {
      fetchTimeSlots()
    }
  }, [selectedService, selectedLocation, selectedDate])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      const data = await response.json()
      if (data.services) {
        setServices(data.services)
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      setErrors({ ...errors, services: 'Error al cargar servicios' })
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      if (data.locations) {
        setLocations(data.locations)
        if (data.locations.length > 0) {
          setSelectedLocation(data.locations[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
      setErrors({ ...errors, locations: 'Error al cargar ubicaciones' })
    }
  }

  const fetchTimeSlots = async () => {
    if (!selectedService || !selectedLocation || !selectedDate) return

    setLoading(true)
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd')
      const response = await fetch(
        `/api/availability/time-slots?location_id=${selectedLocation}&service_id=${selectedService}&date=${formattedDate}`
      )
      const data = await response.json()
      if (data.availability) {
        setTimeSlots(data.availability)
      }

      const artistsResponse = await fetch(
        `/api/availability/staff?location_id=${selectedLocation}&service_id=${selectedService}&date=${formattedDate}`
      )
      const artistsData = await artistsResponse.json()
      if (artistsData.staff) {
        setAvailableArtists(artistsData.staff)
      }
    } catch (error) {
      console.error('Error fetching time slots:', error)
      setErrors({ ...errors, timeSlots: 'Error al cargar horarios' })
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime('')
  }

  const canProceedToDateTime = () => {
    return selectedService && selectedLocation
  }

  const canProceedToConfirm = () => {
    return selectedService && selectedLocation && selectedDate && selectedTime
  }

  const canProceedToArtist = () => {
    return selectedService && selectedLocation && selectedDate && selectedTime
  }

  const handleProceed = () => {
    setErrors({})

    if (currentStep === 'service') {
      if (!selectedService) {
        setErrors({ service: 'Selecciona un servicio' })
        return
      }
      if (!selectedLocation) {
        setErrors({ location: 'Selecciona una ubicación' })
        return
      }
      setCurrentStep('datetime')
    } else if (currentStep === 'datetime') {
      if (!selectedDate) {
        setErrors({ date: 'Selecciona una fecha' })
        return
      }
      if (!selectedTime) {
        setErrors({ time: 'Selecciona un horario' })
        return
      }
      if (availableArtists.length > 0) {
        setCurrentStep('artist')
      } else {
        const params = new URLSearchParams({
          service_id: selectedService,
          location_id: selectedLocation,
          date: format(selectedDate!, 'yyyy-MM-dd'),
          time: selectedTime
        })
        window.location.href = `/booking/cita?${params.toString()}`
      }
    } else if (currentStep === 'artist') {
      const params = new URLSearchParams({
        service_id: selectedService,
        location_id: selectedLocation,
        date: format(selectedDate!, 'yyyy-MM-dd'),
        time: selectedTime,
        staff_id: selectedArtist
      })
      window.location.href = `/booking/cita?${params.toString()}`
    } else if (currentStep === 'confirm') {
      const params = new URLSearchParams({
        service_id: selectedService,
        location_id: selectedLocation,
        date: format(selectedDate!, 'yyyy-MM-dd'),
        time: selectedTime,
        staff_id: selectedArtist
      })
      window.location.href = `/booking/cita?${params.toString()}`
    }
  }

  const handleStepBack = () => {
    if (currentStep === 'datetime') {
      setCurrentStep('service')
    } else if (currentStep === 'artist') {
      setCurrentStep('datetime')
    } else if (currentStep === 'confirm') {
      setCurrentStep('artist')
    }
  }

  const selectedServiceData = services.find(s => s.id === selectedService)
  const selectedLocationData = locations.find(l => l.id === selectedLocation)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bone-white)' }}>
      <div className="max-w-2xl mx-auto px-6 py-24">
        <header className="mb-10">
          <h1 className="text-4xl mb-3 font-serif" style={{ color: 'var(--charcoal-brown)' }}>
            Reservar Cita
          </h1>
          <p className="text-lg" style={{ color: 'var(--charcoal-brown)', opacity: 0.75 }}>
            Selecciona el servicio y horario de tu preferencia
          </p>
        </header>

        <div className="space-y-6">
          {currentStep === 'service' && (
            <>
              <Card style={{ background: 'var(--soft-cream)', borderColor: 'var(--mocha-taupe)', borderWidth: '1px' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: 'var(--charcoal-brown)' }}>
                    <User className="w-5 h-5" />
                    Servicios
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                    Selecciona el servicio que deseas reservar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--charcoal-brown)' }}>
                        Servicio
                      </Label>
                      <Select onValueChange={setSelectedService} value={selectedService}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un servicio" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name} - ${service.base_price.toFixed(2)} ({service.duration_minutes} min)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.service && <p className="text-sm mt-2" style={{ color: '#ef4444' }}>{errors.service}</p>}
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--charcoal-brown)' }}>
                        Ubicación
                      </Label>
                      <Select onValueChange={setSelectedLocation} value={selectedLocation}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona ubicación" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.location && <p className="text-sm mt-2" style={{ color: '#ef4444' }}>{errors.location}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {currentStep === 'datetime' && (
            <>
              <Card style={{ background: 'var(--soft-cream)', borderColor: 'var(--mocha-taupe)', borderWidth: '1px' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: 'var(--charcoal-brown)' }}>
                    <Clock className="w-5 h-5" />
                    Fecha y Hora
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                    Selecciona la fecha y hora disponible
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--charcoal-brown)' }}>
                      Fecha
                    </Label>
                    <DatePicker
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                      minDate={new Date()}
                    />
                    {errors.date && <p className="text-sm mt-2" style={{ color: '#ef4444' }}>{errors.date}</p>}
                  </div>

                  {loading ? (
                    <div className="text-center py-8" style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                      Cargando horarios...
                    </div>
                  ) : (
                    <div>
                      <Label className="text-sm font-medium mb-2 block" style={{ color: 'var(--charcoal-brown)' }}>
                        Horarios disponibles
                      </Label>
                      {timeSlots.length === 0 ? (
                        <p className="text-sm" style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                          No hay horarios disponibles para esta fecha. Selecciona otra fecha.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map((slot, index) => {
                            const slotTimeUTC = new Date(slot.start_time)
                            // JavaScript automatically converts ISO string to local timezone
                            // Since Monterrey is UTC-6, this gives us the correct local time
                            return (
                              <Button
                                key={index}
                                variant={selectedTime === slot.start_time ? 'default' : 'outline'}
                                onClick={() => setSelectedTime(slot.start_time)}
                                className={selectedTime === slot.start_time ? 'w-full' : ''}
                                style={selectedTime === slot.start_time ? { background: 'var(--deep-earth)' } : {}}
                              >
                                {format(slotTimeUTC, 'HH:mm', { locale: es })}
                              </Button>
                            )
                          })}
                        </div>
                      )}
                      {errors.time && <p className="text-sm mt-2" style={{ color: '#ef4444' }}>{errors.time}</p>}
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedServiceData && (
                <div className="text-sm p-4 rounded-lg" style={{ background: 'var(--bone-white)', color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                  Duración del servicio: {selectedServiceData.duration_minutes} minutos
                </div>
              )}
            </>
          )}

          {currentStep === 'artist' && (
            <>
              <Card style={{ background: 'var(--soft-cream)', borderColor: 'var(--mocha-taupe)', borderWidth: '1px' }}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" style={{ color: 'var(--charcoal-brown)' }}>
                    <User className="w-5 h-5" />
                    Seleccionar Artista
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                    {availableArtists.length > 0 
                      ? 'Elige el artista que prefieres para tu servicio'
                      : 'Se asignará automáticamente el primer artista disponible'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableArtists.length === 0 ? (
                    <div className="text-center py-8" style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                      No hay artistas específicos disponibles. Se asignará automáticamente.
                    </div>
                  ) : (
                    <div className="space-y-3">
                  {availableArtists.map((artist) => (
                    <div
                      key={artist.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedArtist === artist.id
                          ? 'ring-2 ring-offset-2'
                          : 'hover:bg-gray-50'
                      }`}
                      style={{
                        borderColor: selectedArtist === artist.id ? 'var(--deep-earth)' : 'var(--mocha-taupe)',
                        background: selectedArtist === artist.id ? 'var(--bone-white)' : 'transparent'
                      }}
                      onClick={() => setSelectedArtist(artist.id)}
                    >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                              style={{ background: 'var(--deep-earth)' }}
                            >
                              {artist.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium" style={{ color: 'var(--charcoal-brown)' }}>
                                {artist.display_name}
                              </p>
                              <p className="text-sm capitalize" style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                                {artist.role}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {currentStep === 'confirm' && selectedServiceData && selectedLocationData && selectedDate && selectedTime && (
            <>
              <Card style={{ background: 'var(--deep-earth)' }}>
                <CardContent className="pt-6">
                  <div className="text-white space-y-3">
                    <h3 className="text-lg font-semibold mb-4">Resumen de la reserva</h3>
                    <div>
                      <p className="text-sm opacity-75">Servicio</p>
                      <p className="font-medium">{selectedServiceData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-75">Ubicación</p>
                      <p className="font-medium">{selectedLocationData.name}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-75">Fecha</p>
                      <p className="font-medium">{format(selectedDate, 'PPP', { locale: es })}</p>
                    </div>
                      <div>
                        <p className="text-sm opacity-75">Hora</p>
                        <p className="font-medium">{format(new Date(selectedTime), 'HH:mm', { locale: es })}</p>
                      </div>
                    {selectedArtist && (
                      <div>
                        <p className="text-sm opacity-75">Artista</p>
                        <p className="font-medium">{availableArtists.find(a => a.id === selectedArtist)?.display_name || 'Seleccionado'}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm opacity-75">Duración</p>
                      <p className="font-medium">{selectedServiceData.duration_minutes} minutos</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-75">Precio</p>
                      <p className="font-medium text-xl">${selectedServiceData.base_price.toFixed(2)} USD</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {currentStep === 'confirm' && (
            <Button
              onClick={handleProceed}
              className="w-full text-lg py-6"
              style={{ background: 'var(--deep-earth)' }}
            >
              Confirmar cita
            </Button>
          )}

          {currentStep !== 'confirm' && (
            <>
              <Button
                onClick={handleProceed}
                disabled={currentStep === 'service' ? !canProceedToDateTime() : !canProceedToConfirm()}
                className="w-full text-lg py-6"
                style={{ background: 'var(--deep-earth)', opacity: (currentStep === 'service' ? !canProceedToDateTime() : !canProceedToConfirm()) ? 0.5 : 1 }}
              >
                {currentStep === 'service' ? 'Continuar: Seleccionar fecha y hora' : 'Continuar: Confirmar cita'}
              </Button>

              {currentStep !== 'service' && (
                <Button
                  variant="outline"
                  onClick={handleStepBack}
                  className="w-full"
                  style={{ borderColor: 'var(--mocha-taupe)', color: 'var(--charcoal-brown)' }}
                >
                  Atrás
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}