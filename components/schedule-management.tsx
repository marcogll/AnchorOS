'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Clock, Coffee, Calendar } from 'lucide-react'

interface StaffSchedule {
  id: string
  staff_id: string
  date: string
  start_time: string
  end_time: string
  is_available: boolean
  reason?: string
}

interface Staff {
  id: string
  display_name: string
  role: string
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
]

const TIME_SLOTS = Array.from({ length: 24 * 2 }, (_, i) => {
  const hour = Math.floor(i / 2)
  const minute = (i % 2) * 30
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
})

export default function ScheduleManagement() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [schedule, setSchedule] = useState<StaffSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<StaffSchedule | null>(null)
  const [formData, setFormData] = useState({
    date: '',
    start_time: '09:00',
    end_time: '17:00',
    is_available: true,
    reason: ''
  })

  useEffect(() => {
    fetchStaff()
  }, [])

  useEffect(() => {
    if (selectedStaff) {
      fetchSchedule()
    }
  }, [selectedStaff])

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/aperture/staff')
      const data = await response.json()
      if (data.success) {
        setStaff(data.staff)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  const fetchSchedule = async () => {
    if (!selectedStaff) return

    setLoading(true)
    try {
      const today = new Date()
      const startDate = today.toISOString().split('T')[0]
      const endDate = new Date(today.setDate(today.getDate() + 30)).toISOString().split('T')[0]

      const response = await fetch(
        `/api/aperture/staff/schedule?staff_id=${selectedStaff}&start_date=${startDate}&end_date=${endDate}`
      )
      const data = await response.json()

      if (data.success) {
        setSchedule(data.availability || [])
      }
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateWeeklySchedule = async () => {
    if (!selectedStaff) return

    const weeklyData = DAYS_OF_WEEK.map((day, index) => {
      const date = new Date()
      date.setDate(date.getDate() + ((index + 7 - date.getDay()) % 7))
      const dateStr = date.toISOString().split('T')[0]

      const isWeekend = day.key === 'saturday' || day.key === 'sunday'
      const startTime = isWeekend ? '10:00' : '09:00'
      const endTime = isWeekend ? '15:00' : '17:00'

      return {
        staff_id: selectedStaff,
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        is_available: !isWeekend,
        reason: isWeekend ? 'Fin de semana' : undefined
      }
    })

    try {
      for (const day of weeklyData) {
        await fetch('/api/aperture/staff/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(day)
        })
      }
      await fetchSchedule()
      alert('Horario semanal generado exitosamente')
    } catch (error) {
      console.error('Error generating weekly schedule:', error)
      alert('Error al generar el horario')
    }
  }

  const addBreakToSchedule = async (scheduleId: string, breakStart: string, breakEnd: string) => {
    try {
      await fetch('/api/aperture/staff/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: selectedStaff,
          date: schedule.find(s => s.id === scheduleId)?.date,
          start_time: breakStart,
          end_time: breakEnd,
          is_available: false,
          reason: 'Break de 30 min'
        })
      })
      await fetchSchedule()
    } catch (error) {
      console.error('Error adding break:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await fetch('/api/aperture/staff/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff_id: selectedStaff,
          ...formData
        })
      })

      await fetchSchedule()
      setDialogOpen(false)
      setEditingSchedule(null)
      setFormData({ date: '', start_time: '09:00', end_time: '17:00', is_available: true, reason: '' })
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Error al guardar el horario')
    }
  }

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('¿Eliminar este horario?')) return

    try {
      await fetch(`/api/aperture/staff/schedule?id=${scheduleId}`, {
        method: 'DELETE'
      })
      await fetchSchedule()
    } catch (error) {
      console.error('Error deleting schedule:', error)
    }
  }

  const calculateWorkingHours = (schedules: StaffSchedule[]) => {
    return schedules.reduce((total, s) => {
      if (!s.is_available) return total
      const start = parseInt(s.start_time.split(':')[0]) * 60 + parseInt(s.start_time.split(':')[1])
      const end = parseInt(s.end_time.split(':')[0]) * 60 + parseInt(s.end_time.split(':')[1])
      return total + (end - start)
    }, 0)
  }

  const getScheduleForDate = (date: string) => {
    return schedule.filter(s => s.date === date && s.is_available)
  }

  const getBreaksForDate = (date: string) => {
    return schedule.filter(s => s.date === date && !s.is_available && s.reason === 'Break de 30 min')
  }

  const selectedStaffData = staff.find(s => s.id === selectedStaff)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Horarios</h2>
          <p className="text-gray-600">Administra horarios y breaks del staff</p>
        </div>
        <div className="flex gap-2">
          {selectedStaff && (
            <>
              <Button variant="outline" onClick={generateWeeklySchedule}>
                <Calendar className="w-4 h-4 mr-2" />
                Generar Semana
              </Button>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Día
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Staff</CardTitle>
          <CardDescription>Selecciona un miembro del equipo para ver y gestionar su horario</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Seleccionar staff" />
            </SelectTrigger>
            <SelectContent>
              {staff.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.display_name} ({member.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedStaff && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Horario de {selectedStaffData?.display_name}
            </CardTitle>
            <CardDescription>
              Total horas programadas: {(calculateWorkingHours(schedule) / 60).toFixed(1)}h
              {' • '}Los breaks de 30min se agregan automáticamente cada 8hrs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando horario...</div>
            ) : (
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => {
                  const date = new Date()
                  const currentDayOfWeek = date.getDay()
                  const targetDayOfWeek = DAYS_OF_WEEK.findIndex(d => d.key === day.key)
                  const daysUntil = (targetDayOfWeek - currentDayOfWeek + 7) % 7
                  date.setDate(date.getDate() + daysUntil)
                  const dateStr = date.toISOString().split('T')[0]

                  const daySchedules = getScheduleForDate(dateStr)
                  const dayBreaks = getBreaksForDate(dateStr)

                  const totalMinutes = daySchedules.reduce((total, s) => {
                    const start = parseInt(s.start_time.split(':')[0]) * 60 + parseInt(s.start_time.split(':')[1])
                    const end = parseInt(s.end_time.split(':')[0]) * 60 + parseInt(s.end_time.split(':')[1])
                    return total + (end - start)
                  }, 0)

                  const shouldHaveBreak = totalMinutes >= 480

                  return (
                    <div key={day.key} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{day.label}</span>
                          <span className="text-sm text-gray-500">{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {shouldHaveBreak && dayBreaks.length === 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Coffee className="w-3 h-3 mr-1" />
                              Break pendiente
                            </Badge>
                          )}
                          {dayBreaks.length > 0 && (
                            <Badge className="bg-green-100 text-green-800">
                              <Coffee className="w-3 h-3 mr-1" />
                              Break incluido
                            </Badge>
                          )}
                          <Badge variant={daySchedules.length > 0 ? 'default' : 'secondary'}>
                            {(totalMinutes / 60).toFixed(1)}h
                          </Badge>
                        </div>
                      </div>

                      {daySchedules.length > 0 ? (
                        <div className="space-y-2 ml-4">
                          {daySchedules.map((s) => (
                            <div key={s.id} className="flex items-center justify-between text-sm">
                              <span>{s.start_time} - {s.end_time}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(s.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          {dayBreaks.map((b) => (
                            <div key={b.id} className="flex items-center justify-between text-sm text-gray-500 ml-4 border-l-2 border-yellow-300 pl-2">
                              <span>{b.start_time} - {b.end_time} (Break)</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(b.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 ml-4">Sin horario programado</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Agregar Día de Trabajo</DialogTitle>
            <DialogDescription>
              Define el horario de trabajo para este día
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Fecha
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start_time" className="text-right">
                  Inicio
                </Label>
                <Select
                  value={formData.start_time}
                  onValueChange={(value) => setFormData({...formData, start_time: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end_time" className="text-right">
                  Fin
                </Label>
                <Select
                  value={formData.end_time}
                  onValueChange={(value) => setFormData({...formData, end_time: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">
                  Notas
                </Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="col-span-3"
                  placeholder="Opcional"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Guardar Horario</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
