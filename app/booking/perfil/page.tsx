'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Calendar, Clock, MapPin, User, Mail, Phone } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '@/lib/auth/context'

/** @description Customer profile management page component for viewing and editing personal information and booking history. */
export default function PerfilPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [pageLoading, setPageLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/booking/login')
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
    loadCustomerProfile()
    loadCustomerBookings()
  }, [])

  const loadCustomerProfile = async () => {
    try {
      // En una implementación real, esto vendría de autenticación
      // Por ahora, simulamos datos del cliente
      const mockCustomer = {
        id: 'customer-123',
        first_name: 'María',
        last_name: 'García',
        email: 'maria.garcia@email.com',
        phone: '+52 844 123 4567',
        tier: 'gold',
        created_at: '2024-01-15'
      }
      setCustomer(mockCustomer)
      setFormData({
        first_name: mockCustomer.first_name,
        last_name: mockCustomer.last_name,
        email: mockCustomer.email,
        phone: mockCustomer.phone || ''
      })
    } catch (error) {
      console.error('Error loading customer profile:', error)
    }
  }

  const loadCustomerBookings = async () => {
    try {
      // En una implementación real, esto vendría de la API
      // Por ahora, simulamos algunas citas
      const mockBookings = [
        {
          id: 'booking-1',
          short_id: 'ABC123',
          status: 'confirmed',
          start_time_utc: '2024-01-20T10:00:00Z',
          service: { name: 'Corte y Estilismo', duration_minutes: 60, base_price: 2500 },
          staff: { display_name: 'Ana López' },
          location: { name: 'Anchor:23 Saltillo' }
        },
        {
          id: 'booking-2',
          short_id: 'DEF456',
          status: 'pending',
          start_time_utc: '2024-01-25T14:30:00Z',
          service: { name: 'Manicure de Precisión', duration_minutes: 45, base_price: 1200 },
          staff: { display_name: 'Carlos Martínez' },
          location: { name: 'Anchor:23 Saltillo' }
        }
      ]
      setBookings(mockBookings)
    } catch (error) {
      console.error('Error loading customer bookings:', error)
    }
  }

  const handleSaveProfile = async () => {
    setPageLoading(true)
    try {
      // En una implementación real, esto actualizaría el perfil del cliente
      setCustomer({
        ...customer,
        ...formData
      })
      setIsEditing(false)
      alert('Perfil actualizado exitosamente')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error al actualizar el perfil')
    } finally {
      setPageLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const getTierBadge = (tier: string) => {
    const tiers = {
      free: { label: 'Free', color: 'bg-gray-100 text-gray-800' },
      gold: { label: 'Gold', color: 'bg-yellow-100 text-yellow-800' },
      black: { label: 'Black', color: 'bg-gray-900 text-white' },
      vip: { label: 'VIP', color: 'bg-purple-100 text-purple-800' }
    }
    return tiers[tier as keyof typeof tiers] || tiers.free
  }

  const getStatusBadge = (status: string) => {
    const statuses = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmada', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completada', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' },
      no_show: { label: 'No Show', color: 'bg-gray-100 text-gray-800' }
    }
    return statuses[status as keyof typeof statuses] || statuses.pending
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-[var(--bone-white)] pt-24 flex items-center justify-center">
        <div className="text-center">
          <p>Cargando perfil...</p>
        </div>
      </div>
    )
  }

  const tierInfo = getTierBadge(customer.tier)

  return (
    <div className="min-h-screen bg-[var(--bone-white)] pt-24">
      <div className="max-w-4xl mx-auto px-8 py-16">
        <header className="mb-12">
          <h1 className="text-5xl mb-4" style={{ color: 'var(--charcoal-brown)' }}>
            Mi Perfil
          </h1>
          <p className="text-xl opacity-80" style={{ color: 'var(--charcoal-brown)' }}>
            Gestiona tu información y citas
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="border-none" style={{ background: 'var(--soft-cream)' }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between" style={{ color: 'var(--charcoal-brown)' }}>
                Información Personal
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    Editar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="first_name">Nombre</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Apellido</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                   <div className="flex gap-2">
                     <Button onClick={handleSaveProfile} disabled={pageLoading}>
                       {pageLoading ? 'Guardando...' : 'Guardar'}
                     </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5" style={{ color: 'var(--mocha-taupe)' }} />
                    <span style={{ color: 'var(--charcoal-brown)' }}>
                      {customer.first_name} {customer.last_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5" style={{ color: 'var(--mocha-taupe)' }} />
                    <span style={{ color: 'var(--charcoal-brown)' }}>{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5" style={{ color: 'var(--mocha-taupe)' }} />
                      <span style={{ color: 'var(--charcoal-brown)' }}>{customer.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${tierInfo.color}`}>
                      {tierInfo.label} Tier
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none" style={{ background: 'var(--soft-cream)' }}>
            <CardHeader>
              <CardTitle style={{ color: 'var(--charcoal-brown)' }}>
                Resumen de Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: 'var(--charcoal-brown)' }}>
                    {bookings.length}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: 'var(--charcoal-brown)' }}>
                    Citas totales
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: 'var(--charcoal-brown)' }}>
                    {bookings.filter(b => b.status === 'completed').length}
                  </div>
                  <div className="text-sm opacity-70" style={{ color: 'var(--charcoal-brown)' }}>
                    Completadas
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-3xl font-bold" style={{ color: 'var(--charcoal-brown)' }}>
                    Miembro desde {format(new Date(customer.created_at), 'MMM yyyy', { locale: es })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none" style={{ background: 'var(--soft-cream)' }}>
          <CardHeader>
            <CardTitle style={{ color: 'var(--charcoal-brown)' }}>
              Mis Últimas Citas
            </CardTitle>
            <CardDescription>
              Historial de tus reservas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <p style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                  No tienes citas programadas
                </p>
                <Button className="mt-4" onClick={() => window.location.href = '/servicios'}>
                  Reservar Cita
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg" style={{ borderColor: 'var(--mocha-taupe)' }}>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--charcoal-brown)' }}>
                          {booking.service?.name}
                        </p>
                        <p className="text-sm opacity-70" style={{ color: 'var(--charcoal-brown)' }}>
                          {booking.staff?.display_name} • {booking.location?.name}
                        </p>
                        <p className="text-sm opacity-70" style={{ color: 'var(--charcoal-brown)' }}>
                          {format(new Date(booking.start_time_utc), 'PPP HH:mm', { locale: es })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status).color}`}>
                        {getStatusBadge(booking.status).label}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold" style={{ color: 'var(--charcoal-brown)' }}>
                        ${booking.service?.base_price?.toLocaleString()}
                      </p>
                      <p className="text-xs opacity-70" style={{ color: 'var(--charcoal-brown)' }}>
                        Código: {booking.short_id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
