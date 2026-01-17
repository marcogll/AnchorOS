'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, MapPin, User, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/** @description Customer appointments management page component for viewing and managing existing bookings. */
export default function MisCitasPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    setLoading(true)
    try {
      // En una implementación real, esto vendría de la API
      // Por ahora, simulamos algunas citas del cliente
      const mockBookings = [
        {
          id: 'booking-1',
          short_id: 'ABC123',
          status: 'confirmed',
          start_time_utc: '2024-01-20T10:00:00Z',
          end_time_utc: '2024-01-20T11:30:00Z',
          service: { name: 'Corte y Estilismo', duration_minutes: 90, base_price: 2500 },
          staff: { display_name: 'Ana López' },
          location: { name: 'Anchor:23 Saltillo' },
          notes: 'Corte moderno con degradado'
        },
        {
          id: 'booking-2',
          short_id: 'DEF456',
          status: 'pending',
          start_time_utc: '2024-01-25T14:30:00Z',
          end_time_utc: '2024-01-25T15:45:00Z',
          service: { name: 'Manicure de Precisión', duration_minutes: 75, base_price: 1200 },
          staff: { display_name: 'Carlos Martínez' },
          location: { name: 'Anchor:23 Saltillo' },
          notes: null
        },
        {
          id: 'booking-3',
          short_id: 'GHI789',
          status: 'completed',
          start_time_utc: '2024-01-15T09:00:00Z',
          end_time_utc: '2024-01-15T10:30:00Z',
          service: { name: 'Peinado y Maquillaje', duration_minutes: 90, base_price: 3500 },
          staff: { display_name: 'Sofia Ramírez' },
          location: { name: 'Anchor:23 Saltillo' },
          notes: 'Evento especial - boda'
        }
      ]
      setBookings(mockBookings)
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const now = new Date()
    const bookingDate = new Date(booking.start_time_utc)

    switch (filter) {
      case 'upcoming':
        return bookingDate >= now
      case 'past':
        return bookingDate < now
      default:
        return true
    }
  })

  const getStatusBadge = (status: string, startTime: string) => {
    const now = new Date()
    const bookingDate = new Date(startTime)
    const isPast = bookingDate < now

    const statuses = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completada', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
      no_show: { label: 'No Show', color: 'bg-gray-100 text-gray-800' }
    }

    const statusInfo = statuses[status as keyof typeof statuses] || statuses.pending

    // Si es pasado y no completado, mostrar como completado
    if (isPast && status !== 'completed' && status !== 'cancelled') {
      return { label: 'Completada', color: 'bg-blue-100 text-blue-800' }
    }

    return statusInfo
  }

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      return
    }

    try {
      // En una implementación real, esto haría una llamada a la API
      // Por ahora, simulamos la cancelación
      setBookings(bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ))
      alert('Cita cancelada exitosamente')
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Error al cancelar la cita')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bone-white)] pt-24">
      <div className="max-w-4xl mx-auto px-8 py-16">
        <header className="mb-12">
          <h1 className="text-5xl mb-4" style={{ color: 'var(--charcoal-brown)' }}>
            Mis Citas
          </h1>
          <p className="text-xl opacity-80" style={{ color: 'var(--charcoal-brown)' }}>
            Gestiona tus reservas y citas programadas
          </p>
        </header>

        <div className="mb-8 flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setFilter('upcoming')}
          >
            Próximas
          </Button>
          <Button
            variant={filter === 'past' ? 'default' : 'outline'}
            onClick={() => setFilter('past')}
          >
            Pasadas
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>Cargando tus citas...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="border-none" style={{ background: 'var(--soft-cream)' }}>
            <CardContent className="pt-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-6 opacity-50" style={{ color: 'var(--mocha-taupe)' }} />
              <h3 className="text-2xl mb-4" style={{ color: 'var(--charcoal-brown)' }}>
                {filter === 'all' ? 'No tienes citas' : filter === 'upcoming' ? 'No tienes citas próximas' : 'No tienes citas pasadas'}
              </h3>
              <p className="mb-8 opacity-70" style={{ color: 'var(--charcoal-brown)' }}>
                {filter === 'all' ? 'Programa tu primera cita con nosotros' : 'Programa una nueva cita'}
              </p>
              <Button onClick={() => window.location.href = '/servicios'}>
                Reservar Cita
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => {
              const statusInfo = getStatusBadge(booking.status, booking.start_time_utc)
              const bookingDate = new Date(booking.start_time_utc)
              const now = new Date()
              const isUpcoming = bookingDate >= now
              const canCancel = booking.status === 'pending' || booking.status === 'confirmed'

              return (
                <Card key={booking.id} className="border-none" style={{ background: 'var(--soft-cream)' }}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--charcoal-brown)' }}>
                          {booking.service?.name}
                        </h3>
                        <div className="space-y-2 text-sm opacity-80" style={{ color: 'var(--charcoal-brown)' }}>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{format(bookingDate, 'EEEE, d MMMM yyyy', { locale: es })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{format(new Date(booking.start_time_utc), 'HH:mm', { locale: es })} - {format(new Date(booking.end_time_utc), 'HH:mm', { locale: es })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{booking.staff?.display_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{booking.location?.name}</span>
                          </div>
                        </div>
                        {booking.notes && (
                          <div className="mt-3 p-3 rounded-lg" style={{ background: 'var(--bone-white)', color: 'var(--charcoal-brown)' }}>
                            <p className="text-sm italic">"{booking.notes}"</p>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-3">
                          <DollarSign className="w-4 h-4" style={{ color: 'var(--mocha-taupe)' }} />
                          <span className="font-semibold" style={{ color: 'var(--charcoal-brown)' }}>
                            ${booking.service?.base_price?.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs opacity-60 mb-4" style={{ color: 'var(--charcoal-brown)' }}>
                          Código: {booking.short_id}
                        </div>
                        {isUpcoming && canCancel && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelBooking(booking.id)}
                            style={{ borderColor: 'var(--mocha-taupe)', color: 'var(--charcoal-brown)' }}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
