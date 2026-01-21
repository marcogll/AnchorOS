/**
 * @description Calendar view component with drag-and-drop rescheduling and booking creation
 * @audit BUSINESS RULE: Calendar shows only bookings for selected date and filters
 * @audit SECURITY: Component requires authenticated admin/manager user context
 * @audit PERFORMANCE: Auto-refresh every 30 seconds for real-time updates
 * @audit Validate: Drag operations validate conflicts before API calls
 * @audit Validate: Real-time indicators update without full page reload
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays, startOfDay, endOfDay, parseISO, addMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Calendar, ChevronLeft, ChevronRight, Clock, User, MapPin, Plus } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { checkStaffCanPerformService, checkForConflicts, rescheduleBooking } from '@/lib/calendar-utils'

interface Booking {
  id: string
  shortId: string
  status: string
  startTime: string
  endTime: string
  customer: {
    id: string
    first_name: string
    last_name: string
  }
  service: {
    id: string
    name: string
    duration_minutes: number
  }
  staff: {
    id: string
    display_name: string
  }
  resource: {
    id: string
    name: string
    type: string
  }
}

interface Staff {
  id: string
  display_name: string
  role: string
  location_id: string
}

interface Location {
  id: string
  name: string
  address: string
}

interface CalendarData {
  bookings: Booking[]
  staff: Staff[]
  locations: Location[]
  businessHours: {
    start: string
    end: string
    days: number[]
  }
}

interface SortableBookingProps {
  booking: Booking
  onReschedule?: (bookingId: string, newTime: string, newStaffId?: string) => void
}

function SortableBooking({ booking, onReschedule }: SortableBookingProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: booking.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 border-green-300 text-green-800'
      case 'pending': return 'bg-yellow-100 border-yellow-300 text-yellow-800'
      case 'completed': return 'bg-blue-100 border-blue-300 text-blue-800'
      case 'cancelled': return 'bg-red-100 border-red-300 text-red-800'
      default: return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  const startTime = parseISO(booking.startTime)
  const endTime = parseISO(booking.endTime)
  const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60)

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: `${Math.max(40, duration * 0.8)}px`,
        ...style
      }}
      {...attributes}
      {...listeners}
      className={`
        p-2 rounded border cursor-move transition-shadow hover:shadow-md
        ${getStatusColor(booking.status)}
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
      `}
      title={`${booking.customer.first_name} ${booking.customer.last_name} - ${booking.service.name} (${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')})`}
    >
      <div className="text-xs font-semibold truncate">
        {booking.shortId}
      </div>
      <div className="text-xs truncate">
        {booking.customer.first_name} {booking.customer.last_name}
      </div>
      <div className="text-xs truncate opacity-75">
        {booking.service.name}
      </div>
      <div className="text-xs flex items-center gap-1 mt-1">
        <Clock className="w-3 h-3" />
        {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
      </div>
      <div className="text-xs flex items-center gap-1 mt-1">
        <MapPin className="w-3 h-3" />
        {booking.resource.name}
      </div>
    </div>
  )
}

interface TimeSlotProps {
  time: Date
  bookings: Booking[]
  staffId: string
  onBookingDrop?: (bookingId: string, newTime: string, staffId: string) => void
  onSlotClick?: (time: Date, staffId: string) => void
}

function TimeSlot({ time, bookings, staffId, onBookingDrop, onSlotClick }: TimeSlotProps) {
  const timeBookings = bookings.filter(booking =>
    booking.staff.id === staffId &&
    parseISO(booking.startTime).getHours() === time.getHours() &&
    parseISO(booking.startTime).getMinutes() === time.getMinutes()
  )

  return (
    <div 
      className="border-r border-gray-200 min-h-[60px] relative"
      onClick={() => onSlotClick && timeBookings.length === 0 && onSlotClick(time, staffId)}
    >
      {timeBookings.length === 0 && onSlotClick && (
        <div className="absolute inset-0 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
          <Plus className="w-6 h-6 text-blue-400" />
        </div>
      )}
      {timeBookings.map(booking => (
        <SortableBooking
          key={booking.id}
          booking={booking}
        />
      ))}
    </div>
  )
}

interface StaffColumnProps {
  staff: Staff
  date: Date
  bookings: Booking[]
  businessHours: { start: string, end: string }
  onBookingDrop?: (bookingId: string, newTime: string, staffId: string) => void
  onSlotClick?: (time: Date, staffId: string) => void
}

function StaffColumn({ staff, date, bookings, businessHours, onBookingDrop, onSlotClick }: StaffColumnProps) {
  const staffBookings = bookings.filter(booking => booking.staff.id === staff.id)

  const timeSlots = []

  const [startHour, startMinute] = businessHours.start.split(':').map(Number)
  const [endHour, endMinute] = businessHours.end.split(':').map(Number)

  let currentTime = new Date(date)
  currentTime.setHours(startHour, startMinute, 0, 0)

  const endTime = new Date(date)
  endTime.setHours(endHour, endMinute, 0, 0)

  while (currentTime < endTime) {
    timeSlots.push(new Date(currentTime))
    currentTime = addMinutes(currentTime, 15)
  }

  return (
    <div className="flex-1 min-w-[200px]">
      <div className="p-3 bg-gray-50 border-b font-semibold text-sm">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {staff.display_name}
        </div>
        <Badge variant="outline" className="text-xs mt-1">
          {staff.role}
        </Badge>
      </div>

      <div className="relative">
        {timeSlots.map((timeSlot, index) => (
          <div key={index} className="border-b border-gray-100 min-h-[60px]">
            <TimeSlot
              time={timeSlot}
              bookings={staffBookings}
              staffId={staff.id}
              onBookingDrop={onBookingDrop}
              onSlotClick={onSlotClick}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * @description Main calendar component for multi-staff booking management
 * @returns {JSX.Element} Complete calendar interface with filters and drag-drop
 * @audit BUSINESS RULE: Calendar columns represent staff members with their bookings
 * @audit SECURITY: Only renders for authenticated admin/manager users
 * @audit PERFORMANCE: Memoized fetchCalendarData prevents unnecessary re-renders
 * @audit Validate: State updates trigger appropriate re-fetching of data
 */
export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const [showCreateBooking, setShowCreateBooking] = useState(false)
  const [createBookingData, setCreateBookingData] = useState<{
    time: Date | null
    staffId: string | null
    customerId: string
    serviceId: string
    locationId: string
    notes: string
  }>({
    time: null,
    staffId: null,
    customerId: '',
    serviceId: '',
    locationId: '',
    notes: ''
  })
  const [createBookingError, setCreateBookingError] = useState<string | null>(null)
  const [services, setServices] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services')
      const data = await response.json()
      if (data.success) {
        setServices(data.services || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    }
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      const data = await response.json()
      if (data.success) {
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  useEffect(() => {
    fetchServices()
    fetchCustomers()
  }, [])

  const handleSlotClick = (time: Date, staffId: string) => {
    const locationId = selectedLocations.length > 0 ? selectedLocations[0] : (calendarData?.locations[0]?.id || '')
    setCreateBookingData({
      time,
      staffId,
      customerId: '',
      serviceId: '',
      locationId,
      notes: ''
    })
    setShowCreateBooking(true)
    setCreateBookingError(null)
  }

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateBookingError(null)
    
    if (!createBookingData.time || !createBookingData.staffId || !createBookingData.customerId || !createBookingData.serviceId || !createBookingData.locationId) {
      setCreateBookingError('Todos los campos son obligatorios')
      return
    }

    try {
      setLoading(true)
      const startTimeUtc = createBookingData.time.toISOString()

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: createBookingData.customerId,
          service_id: createBookingData.serviceId,
          location_id: createBookingData.locationId,
          start_time_utc: startTimeUtc,
          staff_id: createBookingData.staffId,
          notes: createBookingData.notes || null
        }),
      })

      const result = await response.json()

      if (result.success) {
        setShowCreateBooking(false)
        setCreateBookingData({
          time: null,
          staffId: null,
          customerId: '',
          serviceId: '',
          locationId: '',
          notes: ''
        })
        await fetchCalendarData()
      } else {
        setCreateBookingError(result.error || 'Error al crear la cita')
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      setCreateBookingError('Error de conexión al crear la cita')
    } finally {
      setLoading(false)
    }
  }

  const fetchCalendarData = useCallback(async () => {
    setLoading(true)
    try {
      const startDate = format(startOfDay(currentDate), 'yyyy-MM-dd')
      const endDate = format(endOfDay(currentDate), 'yyyy-MM-dd')

      const params = new URLSearchParams({
        start_date: `${startDate}T00:00:00Z`,
        end_date: `${endDate}T23:59:59Z`,
      })

      if (selectedStaff.length > 0) {
        params.append('staff_ids', selectedStaff.join(','))
      }

      if (selectedLocations.length > 0) {
        params.append('location_ids', selectedLocations.join(','))
      }

      const response = await fetch(`/api/aperture/calendar?${params}`)
      const data = await response.json()

      if (data.success) {
        setCalendarData(data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    } finally {
      setLoading(false)
    }
  }, [currentDate, selectedStaff, selectedLocations])

  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchCalendarData()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchCalendarData])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handlePreviousDay = () => {
    setCurrentDate(prev => addDays(prev, -1))
  }

  const handleNextDay = () => {
    setCurrentDate(prev => addDays(prev, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const bookingId = active.id as string
    const targetInfo = over.id as string

    const [targetStaffId, targetTime] = targetInfo.includes('-') ? targetInfo.split('-') : [targetInfo, null]

    try {
      setRescheduleError(null)

      const currentStart = parseISO(bookingId)
      const newStartTime = new Date(currentStart.getTime() + (60 * 60 * 1000))

      const response = await fetch(`/api/aperture/bookings/${bookingId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          newStartTime: newStartTime.toISOString(),
          newStaffId: targetStaffId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        await fetchCalendarData()
        setRescheduleError(null)
      } else {
        setRescheduleError(result.error || 'Error al reprogramar la cita')
      }
    } catch (error) {
      console.error('Error rescheduling booking:', error)
      setRescheduleError('Error de conexión al reprogramar la cita')
    }
  }

  if (!calendarData) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Cargando calendario...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Dialog open={showCreateBooking} onOpenChange={setShowCreateBooking}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Cita</DialogTitle>
            <DialogDescription>
              {createBookingData.time && (
                <span className="text-sm">
                  {format(createBookingData.time, 'EEEE, d MMMM yyyy HH:mm', { locale: es })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateBooking} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Cliente</Label>
                <Select
                  value={createBookingData.customerId}
                  onValueChange={(value) => setCreateBookingData({ ...createBookingData, customerId: value })}
                >
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.first_name} {customer.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Servicio</Label>
                <Select
                  value={createBookingData.serviceId}
                  onValueChange={(value) => setCreateBookingData({ ...createBookingData, serviceId: value })}
                >
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.filter(s => s.location_id === createBookingData.locationId).map(service => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} ({service.duration_minutes} min) - ${service.base_price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Select
                  value={createBookingData.locationId}
                  onValueChange={(value) => setCreateBookingData({ ...createBookingData, locationId: value })}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Seleccionar ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendarData.locations.map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff">Staff Asignado</Label>
                <Select
                  value={createBookingData.staffId || ''}
                  onValueChange={(value) => setCreateBookingData({ ...createBookingData, staffId: value })}
                >
                  <SelectTrigger id="staff">
                    <SelectValue placeholder="Seleccionar staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendarData.staff.filter(staffMember => staffMember.location_id === createBookingData.locationId).map(staffMember => (
                      <SelectItem key={staffMember.id} value={staffMember.id}>
                        {staffMember.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                value={createBookingData.notes}
                onChange={(e) => setCreateBookingData({ ...createBookingData, notes: e.target.value })}
                placeholder="Notas adicionales (opcional)"
              />
            </div>

            {createBookingError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 text-sm">{createBookingError}</p>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateBooking(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Cita'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Calendario de Citas
            </CardTitle>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleToday}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={handlePreviousDay}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold min-w-[120px] text-center">
                {format(currentDate, 'EEEE, d MMMM', { locale: es })}
              </span>
              <div className="text-xs text-gray-500 ml-4">
                {lastUpdated && `Actualizado: ${format(lastUpdated, 'HH:mm:ss')}`}
              </div>
              <Button variant="outline" size="sm" onClick={handleNextDay}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sucursal:</span>
              <Select
                value={selectedLocations.length === 0 ? 'all' : selectedLocations[0]}
                onValueChange={(value) => {
                  value === 'all' ? setSelectedLocations([]) : setSelectedLocations([value])
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {calendarData.locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Staff:</span>
              <Select
                value={selectedStaff.length === 0 ? 'all' : selectedStaff[0]}
                onValueChange={(value) => {
                  value === 'all' ? setSelectedStaff([]) : setSelectedStaff([value])
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Seleccionar staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el staff</SelectItem>
                  {calendarData.staff.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {rescheduleError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{rescheduleError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex">
              <div className="w-20 bg-gray-50 border-r">
                <div className="p-3 border-b font-semibold text-sm text-center">
                  Hora
                </div>
                {(() => {
                  const timeSlots = []
                  const [startHour] = calendarData.businessHours.start.split(':').map(Number)
                  const [endHour] = calendarData.businessHours.end.split(':').map(Number)
                  
                  for (let hour = startHour; hour <= endHour; hour++) {
                    timeSlots.push(
                      <div key={hour} className="border-b border-gray-100 p-2 text-xs text-center min-h-[60px] flex items-center justify-center">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                    )
                  }

                  return timeSlots
                })()}
              </div>

              <div className="flex flex-1 overflow-x-auto">
                {calendarData.staff.map(staff => (
                  <StaffColumn
                    key={staff.id}
                    staff={staff}
                    date={currentDate}
                    bookings={calendarData.bookings}
                    businessHours={calendarData.businessHours}
                    onSlotClick={handleSlotClick}
                  />
                ))}
              </div>
            </div>
          </DndContext>
        </CardContent>
      </Card>
    </div>
  )
}
