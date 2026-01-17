'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, Clock, DollarSign, TrendingUp, LogOut } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '@/lib/auth/context'

/** @description Admin dashboard component for managing salon operations including bookings, staff, resources, reports, and permissions. */
export default function ApertureDashboard() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'staff' | 'resources' | 'reports' | 'permissions'>('dashboard')
  const [reportType, setReportType] = useState<'sales' | 'payments' | 'payroll'>('sales')
  const [bookings, setBookings] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [resources, setResources] = useState<any[]>([])
  const [reports, setReports] = useState<any>({})
  const [permissions, setPermissions] = useState<any[]>([])
  const [pageLoading, setPageLoading] = useState(false)
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    completedToday: 0,
    upcomingToday: 0
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/booking/login?redirect=/aperture')
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    if (activeTab === 'dashboard') {
      fetchBookings()
      fetchStats()
    } else if (activeTab === 'staff') {
      fetchStaff()
    } else if (activeTab === 'resources') {
      fetchResources()
    } else if (activeTab === 'reports') {
      fetchReports()
    } else if (activeTab === 'permissions') {
      fetchPermissions()
    }
  }, [activeTab, reportType])

  const fetchBookings = async () => {
    setPageLoading(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      const response = await fetch(`/api/aperture/dashboard?start_date=${today}&end_date=${today}`)
      const data = await response.json()
      if (data.success) {
        setBookings(data.bookings)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/aperture/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchStaff = async () => {
    setPageLoading(true)
    try {
      const response = await fetch('/api/aperture/staff')
      const data = await response.json()
      if (data.success) {
        setStaff(data.staff)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const fetchResources = async () => {
    setPageLoading(true)
    try {
      const response = await fetch('/api/aperture/resources')
      const data = await response.json()
      if (data.success) {
        setResources(data.resources)
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const fetchReports = async () => {
    setPageLoading(true)
    try {
      let endpoint = ''
      if (reportType === 'sales') endpoint = '/api/aperture/reports/sales'
      else if (reportType === 'payments') endpoint = '/api/aperture/reports/payments'
      else if (reportType === 'payroll') endpoint = '/api/aperture/reports/payroll'

      if (endpoint) {
        const response = await fetch(endpoint)
        const data = await response.json()
        if (data.success) {
          setReports(data)
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const fetchPermissions = async () => {
    setPageLoading(true)
    try {
      const response = await fetch('/api/aperture/permissions')
      const data = await response.json()
      if (data.success) {
        setPermissions(data.permissions)
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
    } finally {
      setPageLoading(false)
    }
  }

  const togglePermission = async (roleId: string, permId: string) => {
    try {
      await fetch('/api/aperture/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId, permId })
      })
      fetchPermissions() // Refresh
    } catch (error) {
      console.error('Error toggling permission:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_enrollment_key')
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-24">
      <header className="px-8 pb-8 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aperture - Admin</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
      </header>

      <div className="max-w-7xl mx-auto px-8">
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Citas Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.completedToday}</p>
              <p className="text-sm text-gray-600">Completadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Ingresos Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Ingresos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.upcomingToday}</p>
              <p className="text-sm text-gray-600">Por iniciar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Total Mes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              <p className="text-sm text-gray-600">Este mes</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setActiveTab('dashboard')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === 'staff' ? 'default' : 'outline'}
              onClick={() => setActiveTab('staff')}
            >
              <Users className="w-4 h-4 mr-2" />
              Staff
            </Button>
            <Button
              variant={activeTab === 'resources' ? 'default' : 'outline'}
              onClick={() => setActiveTab('resources')}
            >
              <Users className="w-4 h-4 mr-2" />
              Recursos
            </Button>
            <Button
              variant={activeTab === 'reports' ? 'default' : 'outline'}
              onClick={() => setActiveTab('reports')}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Reportes
            </Button>
            <Button
              variant={activeTab === 'permissions' ? 'default' : 'outline'}
              onClick={() => setActiveTab('permissions')}
            >
              <Users className="w-4 h-4 mr-2" />
              Permisos
            </Button>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
              <CardDescription>Resumen de operaciones del día</CardDescription>
            </CardHeader>
            <CardContent>
              {pageLoading ? (
                <div className="text-center py-8">
                  Cargando...
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <p className="text-center text-gray-500">No hay citas para hoy</p>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-semibold">{booking.customer?.first_name} {booking.customer?.last_name}</p>
                            <p className="text-sm text-gray-500">{booking.service?.name}</p>
                            <p className="text-sm text-gray-400">
                              {format(new Date(booking.start_time_utc), 'HH:mm', { locale: es })} - {format(new Date(booking.end_time_utc), 'HH:mm', { locale: es })}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs ${
                              booking.status === 'confirmed'
                                ? 'bg-green-100 text-green-800'
                                : booking.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'staff' && (
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Staff</CardTitle>
              <CardDescription>Administra horarios y disponibilidad del equipo</CardDescription>
            </CardHeader>
            <CardContent>
              {pageLoading ? (
                <p className="text-center">Cargando staff...</p>
              ) : (
                <div className="space-y-4">
                  {staff.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{member.display_name}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Gestionar Horarios
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'resources' && (
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Recursos</CardTitle>
              <CardDescription>Administra estaciones y asignación</CardDescription>
            </CardHeader>
            <CardContent>
              {pageLoading ? (
                <p className="text-center">Cargando recursos...</p>
              ) : (
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{resource.name}</p>
                        <p className="text-sm text-gray-600">{resource.type} - {resource.location_name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        resource.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {resource.is_available ? 'Disponible' : 'Ocupado'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'permissions' && (
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Permisos</CardTitle>
              <CardDescription>Asignar permisos dependiendo del perfil</CardDescription>
            </CardHeader>
            <CardContent>
              {pageLoading ? (
                <p className="text-center">Cargando permisos...</p>
              ) : (
                <div className="space-y-4">
                  {permissions.map((role: any) => (
                    <div key={role.id} className="p-4 border rounded-lg">
                      <h3 className="font-semibold">{role.name}</h3>
                      <div className="mt-2 space-y-2">
                        {role.permissions.map((perm: any) => (
                          <div key={perm.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={perm.enabled}
                              onChange={() => togglePermission(role.id, perm.id)}
                            />
                            <span>{perm.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reportes</CardTitle>
                <CardDescription>Estadísticas y reportes del negocio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 mb-4">
                  <Button
                    variant={reportType === 'sales' ? 'default' : 'outline'}
                    onClick={() => setReportType('sales')}
                  >
                    Ventas
                  </Button>
                  <Button
                    variant={reportType === 'payments' ? 'default' : 'outline'}
                    onClick={() => setReportType('payments')}
                  >
                    Pagos
                  </Button>
                  <Button
                    variant={reportType === 'payroll' ? 'default' : 'outline'}
                    onClick={() => setReportType('payroll')}
                  >
                    Nómina
                  </Button>
                </div>

                {pageLoading ? (
                  <p className="text-center">Cargando reportes...</p>
                ) : (
                  <div>
                    {reportType === 'sales' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-600">Ventas Totales</p>
                            <p className="text-2xl font-bold">${reports.totalSales || 0}</p>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-600">Citas Completadas</p>
                            <p className="text-2xl font-bold">{reports.completedBookings || 0}</p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-600">Promedio por Servicio</p>
                            <p className="text-2xl font-bold">${reports.avgServicePrice || 0}</p>
                          </div>
                        </div>
                        {reports.salesByService && (
                          <div>
                            <h3 className="text-lg font-semibold mb-2">Ventas por Servicio</h3>
                            <div className="space-y-2">
                              {reports.salesByService.map((item: any) => (
                                <div key={item.service} className="flex justify-between p-2 bg-gray-50 rounded">
                                  <span>{item.service}</span>
                                  <span>${item.total}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {reportType === 'payments' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Pagos Recientes</h3>
                        {reports.payments && reports.payments.length > 0 ? (
                          <div className="space-y-2">
                            {reports.payments.map((payment: any) => (
                              <div key={payment.id} className="p-4 border rounded-lg">
                                <div className="flex justify-between">
                                  <span>{payment.customer}</span>
                                  <span>${payment.amount}</span>
                                </div>
                                <p className="text-sm text-gray-600">{payment.date} - {payment.status}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>No hay pagos recientes</p>
                        )}
                      </div>
                    )}

                    {reportType === 'payroll' && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Nómina Semanal</h3>
                        {reports.payroll && reports.payroll.length > 0 ? (
                          <div className="space-y-2">
                            {reports.payroll.map((staff: any) => (
                              <div key={staff.id} className="p-4 border rounded-lg">
                                <div className="flex justify-between">
                                  <span>{staff.name}</span>
                                  <span>${staff.weeklyPay}</span>
                                </div>
                                <p className="text-sm text-gray-600">Horas: {staff.hours}, Comisión: ${staff.commission}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>No hay datos de nómina</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
