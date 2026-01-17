'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/ui/stats-card'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { Avatar } from '@/components/ui/avatar'
import { Calendar, Users, Clock, DollarSign, TrendingUp, LogOut, Trophy } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '@/lib/auth/context'
import CalendarView from '@/components/calendar-view'
import StaffManagement from '@/components/staff-management'
import ResourcesManagement from '@/components/resources-management'

/**
 * @description Admin dashboard component for managing salon operations including bookings, staff, resources, reports, and permissions.
 */
export default function ApertureDashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'staff' | 'resources' | 'reports' | 'permissions'>('dashboard')
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
  const [customers, setCustomers] = useState({
    total: 0,
    newToday: 0,
    newMonth: 0
  })
  const [topPerformers, setTopPerformers] = useState<any[]>([])
  const [activityFeed, setActivityFeed] = useState<any[]>([])

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchBookings()
      fetchStats()
      fetchDashboardData()
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

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/aperture/dashboard?include_customers=true&include_top_performers=true&include_activity=true')
      const data = await response.json()
      if (data.success) {
        if (data.customers) {
          setCustomers(data.customers)
        }
        if (data.topPerformers) {
          setTopPerformers(data.topPerformers)
        }
        if (data.activityFeed) {
          setActivityFeed(data.activityFeed)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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
      fetchPermissions()
    } catch (error) {
      console.error('Error toggling permission:', error)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/aperture/login')
  }

  if (!user) {
    return null
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
          <StatsCard
            icon={<Calendar className="h-6 w-6" style={{ color: 'var(--deep-earth)' }} />}
            title="Citas Hoy"
            value={stats.completedToday}
          />

          <StatsCard
            icon={<DollarSign className="h-6 w-6" style={{ color: 'var(--deep-earth)' }} />}
            title="Ingresos Hoy"
            value={`$${stats.totalRevenue.toLocaleString()}`}
          />

          <StatsCard
            icon={<Clock className="h-6 w-6" style={{ color: 'var(--deep-earth)' }} />}
            title="Pendientes"
            value={stats.upcomingToday}
          />

          <StatsCard
            icon={<TrendingUp className="h-6 w-6" style={{ color: 'var(--deep-earth)' }} />}
            title="Total Mes"
            value={stats.totalBookings}
          />
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
              variant={activeTab === 'calendar' ? 'default' : 'outline'}
              onClick={() => setActiveTab('calendar')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Calendario
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

        {activeTab === 'calendar' && (
          <CalendarView />
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Staff con mejor rendimiento este mes</CardDescription>
              </CardHeader>
              <CardContent>
                {pageLoading || topPerformers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Cargando performers...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Staff</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Citas</TableHead>
                        <TableHead className="text-right">Horas</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPerformers.map((performer, index) => (
                        <TableRow key={performer.staffId}>
                          <TableCell className="font-medium">
                            {index < 3 && (
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4" style={{
                                  color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'
                                }} />
                              </div>
                            )}
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar fallback={performer.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)} />
                              <span className="font-medium">{performer.displayName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded text-xs font-medium" style={{
                              backgroundColor: 'var(--sand-beige)',
                              color: 'var(--charcoal-brown)'
                            }}>
                              {performer.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{performer.totalBookings}</TableCell>
                          <TableCell className="text-right">{performer.totalHours.toFixed(1)}h</TableCell>
                          <TableCell className="text-right font-semibold" style={{ color: 'var(--forest-green)' }}>
                            ${performer.totalRevenue.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Últimas acciones en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                {pageLoading || activityFeed.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Cargando actividad...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityFeed.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg" style={{
                        backgroundColor: 'var(--sand-beige)'
                      }}>
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{
                          backgroundColor: 'var(--mocha-taupe)',
                          color: 'var(--charcoal-brown)'
                        }}>
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-sm" style={{ color: 'var(--deep-earth)' }}>
                              {activity.action === 'completed' && 'Cita completada'}
                              {activity.action === 'confirmed' && 'Cita confirmada'}
                              {activity.action === 'cancelled' && 'Cita cancelada'}
                              {activity.action === 'created' && 'Nueva cita'}
                            </p>
                            <span className="text-xs" style={{ color: 'var(--charcoal-brown)', opacity: 0.6 }}>
                              {format(new Date(activity.timestamp), 'HH:mm', { locale: es })}
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--charcoal-brown)' }}>
                            <span className="font-medium">{activity.customerName}</span> - {activity.serviceName}
                          </p>
                          {activity.staffName && (
                            <p className="text-xs mt-1" style={{ color: 'var(--charcoal-brown)', opacity: 0.7 }}>
                              Staff: {activity.staffName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'staff' && (
          <StaffManagement />
        )}

        {activeTab === 'resources' && (
          <ResourcesManagement />
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
                        <h3 className="text-lg font-semibold mb-2">Pagos Recientes</h3>
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
                        <h3 className="text-lg font-semibold mb-2">Nómina Semanal</h3>
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
