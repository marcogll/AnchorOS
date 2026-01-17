'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { Location, Staff, Booking } from '@/lib/db/types'

type ApiStaff = {
  staff_id: string
  staff_name: string
  role: string
  work_hours_start?: string
  work_hours_end?: string
}

type ApiBooking = Omit<Booking, 'status'> & {
  status: string
  service?: any
  customer?: any
  staff?: any
  location?: any
  resource?: any
}

/** @description HQ operations dashboard component for managing bookings, staff availability, and location operations. */
export default function HQDashboard() {
  const [locations, setLocations] = useState<Location[]>([])
  const [staffList, setStaffList] = useState<ApiStaff[]>([])
  const [bookings, setBookings] = useState<ApiBooking[]>([])
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'calendar' | 'bookings' | 'staff'>('calendar')

  useEffect(() => {
    fetchLocations()
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      fetchBookings()
      fetchStaff()
    }
  }, [selectedLocation, selectedDate])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/admin/locations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_enrollment_key') || ''}`
        }
      })
      const data = await response.json()
      if (data.locations) {
        setLocations(data.locations)
        if (data.locations.length > 0) {
          setSelectedLocation(data.locations[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
    }
  }

  const fetchBookings = async () => {
    if (!selectedLocation) return
    
    setLoading(true)
    try {
      const startDate = new Date(selectedDate).toISOString()
      const endDate = new Date(selectedDate)
      endDate.setDate(endDate.getDate() + 1)
      
      const response = await fetch(`/api/bookings?location_id=${selectedLocation}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_enrollment_key') || ''}`
        }
      })
      const data = await response.json()
      if (data.bookings) {
        const filtered = data.bookings.filter((b: any) => {
          const bookingDate = new Date(b.start_time_utc)
          return bookingDate >= new Date(startDate) && bookingDate < new Date(endDate)
        })
        setBookings(filtered as Booking[])
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStaff = async () => {
    if (!selectedLocation) return
    
    try {
      const startTime = new Date(selectedDate + 'T00:00:00.000Z').toISOString()
      const endTime = new Date(selectedDate + 'T23:59:59.999Z').toISOString()
      
      const response = await fetch(`/api/availability/staff?location_id=${selectedLocation}&start_time_utc=${startTime}&end_time_utc=${endTime}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_enrollment_key') || ''}`
        }
      })
      const data = await response.json()
      if (data.staff) {
        setStaffList(data.staff)
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    }
  }

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_enrollment_key') || ''}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        setBookings(bookings.map(b => 
          b.id === bookingId ? { ...b, status: newStatus } : b
        ))
      }
    } catch (error) {
      console.error('Failed to update booking:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { icon: AlertCircle, label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { icon: Clock, label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
      completed: { icon: CheckCircle, label: 'Completed', color: 'bg-green-100 text-green-800' },
      cancelled: { icon: XCircle, label: 'Cancelled', color: 'bg-red-100 text-red-800' },
      no_show: { icon: XCircle, label: 'No Show', color: 'bg-gray-100 text-gray-800' }
    }
    
    const { icon: Icon, label, color } = config[status as keyof typeof config] || config.pending
    
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            HQ Dashboard
          </h1>
          <p className="text-gray-600">
            Operations management and scheduling
          </p>
        </header>

        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Location</Label>
              <Select onValueChange={setSelectedLocation} value={selectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Schedule</CardTitle>
                <CardDescription>
                  {loading ? 'Loading...' : `${bookings.length} bookings for ${format(new Date(selectedDate), 'PPP')}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No bookings for this date
                    </div>
                  ) : (
                    bookings
                      .sort((a, b) => new Date(a.start_time_utc).getTime() - new Date(b.start_time_utc).getTime())
                      .map((booking) => (
                        <div key={booking.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusBadge(booking.status)}
                                <span className="text-sm text-gray-500">
                                  {format(new Date(booking.start_time_utc), 'HH:mm')} - {format(new Date(booking.end_time_utc), 'HH:mm')}
                                </span>
                              </div>
                              <h3 className="font-semibold text-lg">{booking.service?.name || 'Service'}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {booking.customer?.first_name} {booking.customer?.last_name} ({booking.customer?.email})
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {booking.staff?.display_name || 'Staff'}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {booking.resource?.name || 'Not assigned'}
                                </div>
                              </div>
                              {booking.notes && (
                                <p className="text-sm text-gray-500 mt-2 italic">
                                  Note: {booking.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">
                                ${booking.service?.base_price?.toFixed(2) || '0.00'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {booking.service?.duration_minutes || 0} min
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bookings List</CardTitle>
                <CardDescription>
                  All bookings for selected date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No bookings found
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-slate-100 text-slate-800">
                                {booking.short_id}
                              </Badge>
                              {getStatusBadge(booking.status)}
                            </div>
                            <h3 className="font-semibold">{booking.service?.name || 'Service'}</h3>
                            <p className="text-sm text-gray-600">
                              {booking.customer?.first_name} {booking.customer?.last_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              {format(new Date(booking.start_time_utc), 'HH:mm')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.staff?.display_name || 'Staff'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Staff Availability</CardTitle>
                <CardDescription>
                  Available staff for selected date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {staffList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No staff available
                    </div>
                  ) : (
                    staffList.map((staff) => (
                      <div key={staff.staff_id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{staff.staff_name}</h3>
                              <Badge variant="outline">
                                {staff.role}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {staff.work_hours_start || 'N/A'} - {staff.work_hours_end || 'N/A'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-green-100 text-green-800">
                              Available
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
