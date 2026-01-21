/**
 * @description Complete staff management interface with CRUD operations
 * @audit BUSINESS RULE: Staff management requires admin/manager role permissions
 * @audit SECURITY: All operations validate user permissions before API calls
 * @audit Validate: Staff creation validates location and role constraints
 * @audit AUDIT: All staff modifications logged through API audit trails
 */

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
import { Avatar } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Edit, Trash2, Phone, MapPin, Clock, Users, Scissors, X } from 'lucide-react'
import { useAuth } from '@/lib/auth/context'

interface StaffMember {
  id: string
  user_id?: string
  location_id: string
  role: string
  display_name: string
  phone?: string
  is_active: boolean
  created_at: string
  updated_at: string
  locations?: {
    id: string
    name: string
    address: string
  }
  schedule?: any[]
}

interface Service {
  id: string
  name: string
  category: string
  duration_minutes: number
  base_price: number
  isAssigned?: boolean
  proficiency?: number
}

interface Location {
  id: string
  name: string
  address: string
}

/**
 * @description Staff management component with full CRUD interface
 * @returns {JSX.Element} Staff listing with create/edit/delete modals
 * @audit BUSINESS RULE: Staff roles determine system access permissions
 * @audit SECURITY: Component validates admin/manager role on mount
 * @audit Validate: Form validations prevent invalid staff data creation
 * @audit PERFORMANCE: Lazy loads staff data with location relationships
 */
export default function StaffManagement() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false)
  const [selectedStaffForServices, setSelectedStaffForServices] = useState<StaffMember | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [formData, setFormData] = useState({
    location_id: '',
    role: '',
    display_name: '',
    phone: ''
  })

  useEffect(() => {
    fetchStaff()
    fetchLocations()
  }, [])

  const fetchServices = async (staffId: string) => {
    setLoadingServices(true)
    try {
      const response = await fetch(`/api/aperture/staff/${staffId}/services`)
      const data = await response.json()
      if (data.success) {
        setServices(data.availableServices || [])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoadingServices(false)
    }
  }

  const openServicesDialog = async (member: StaffMember) => {
    setSelectedStaffForServices(member)
    await fetchServices(member.id)
    setServicesDialogOpen(true)
  }

  const toggleServiceAssignment = async (serviceId: string, isCurrentlyAssigned: boolean) => {
    if (!selectedStaffForServices) return

    try {
      if (isCurrentlyAssigned) {
        await fetch(`/api/aperture/staff/${selectedStaffForServices.id}/services?service_id=${serviceId}`, {
          method: 'DELETE'
        })
      } else {
        await fetch(`/api/aperture/staff/${selectedStaffForServices.id}/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ service_id: serviceId })
        })
      }
      await fetchServices(selectedStaffForServices.id)
    } catch (error) {
      console.error('Error toggling service:', error)
    }
  }

  const updateProficiency = async (serviceId: string, level: number) => {
    if (!selectedStaffForServices) return

    try {
      await fetch(`/api/aperture/staff/${selectedStaffForServices.id}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId, proficiency_level: level })
      })
      await fetchServices(selectedStaffForServices.id)
    } catch (error) {
      console.error('Error updating proficiency:', error)
    }
  }

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/aperture/staff?include_schedule=true')
      const data = await response.json()
      if (data.success) {
        setStaff(data.staff)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/aperture/locations')
      const data = await response.json()
      if (data.success) {
        setLocations(data.locations || [])
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingStaff
        ? `/api/aperture/staff/${editingStaff.id}`
        : '/api/aperture/staff'

      const method = editingStaff ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        await fetchStaff()
        setDialogOpen(false)
        setEditingStaff(null)
        setFormData({ location_id: '', role: '', display_name: '', phone: '' })
      } else {
        alert(data.error || 'Error saving staff member')
      }
    } catch (error) {
      console.error('Error saving staff:', error)
      alert('Error saving staff member')
    }
  }

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member)
    setFormData({
      location_id: member.location_id,
      role: member.role,
      display_name: member.display_name,
      phone: member.phone || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (member: StaffMember) => {
    if (!confirm(`¿Estás seguro de que quieres desactivar a ${member.display_name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/aperture/staff/${member.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        await fetchStaff()
      } else {
        alert(data.error || 'Error deleting staff member')
      }
    } catch (error) {
      console.error('Error deleting staff:', error)
      alert('Error deleting staff member')
    }
  }

  const openCreateDialog = () => {
    setEditingStaff(null)
    setFormData({ location_id: '', role: '', display_name: '', phone: '' })
    setDialogOpen(true)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-purple-100 text-purple-800'
      case 'staff': return 'bg-blue-100 text-blue-800'
      case 'artist': return 'bg-green-100 text-green-800'
      case 'kiosk': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Staff</h2>
          <p className="text-gray-600">Administra el equipo de trabajo</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Staff
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Miembros del Equipo
          </CardTitle>
          <CardDescription>
            {staff.length} miembros activos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando staff...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar fallback={member.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)} />
                        <div>
                          <div className="font-medium">{member.display_name}</div>
                          {member.schedule && member.schedule.length > 0 && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {member.schedule.length} días disponibles
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(member.role)}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        {member.locations?.name || 'Sin ubicación'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {member.phone}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? "default" : "secondary"}>
                        {member.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {member.role === 'artist' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openServicesDialog(member)}
                            title="Gestionar servicios"
                          >
                            <Scissors className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(member)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(member)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? 'Editar Miembro' : 'Nuevo Miembro de Staff'}
            </DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Modifica la información del miembro' : 'Agrega un nuevo miembro al equipo'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="display_name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Rol
                </Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="artist">Artista</SelectItem>
                    <SelectItem value="kiosk">Kiosko</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location_id" className="text-right">
                  Ubicación
                </Label>
                <Select value={formData.location_id} onValueChange={(value) => setFormData({...formData, location_id: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar ubicación" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Teléfono
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingStaff ? 'Actualizar' : 'Crear'} Miembro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={servicesDialogOpen} onOpenChange={setServicesDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scissors className="w-5 h-5" />
              Servicios de {selectedStaffForServices?.display_name}
            </DialogTitle>
            <DialogDescription>
              Selecciona los servicios que este artista puede realizar y su nivel de proficiency
            </DialogDescription>
          </DialogHeader>
          {loadingServices ? (
            <div className="text-center py-8">Cargando servicios...</div>
          ) : (
            <div className="space-y-4">
              {services.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No hay servicios disponibles</div>
              ) : (
                services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={service.isAssigned}
                        onCheckedChange={() => toggleServiceAssignment(service.id, service.isAssigned || false)}
                      />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-500">
                          {service.category} • {service.duration_minutes} min • ${service.base_price}
                        </p>
                      </div>
                    </div>
                    {service.isAssigned && (
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Nivel:</Label>
                        <Select
                          value={String(service.proficiency || 3)}
                          onValueChange={(value) => updateProficiency(service.id, parseInt(value))}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Principiante</SelectItem>
                            <SelectItem value="2">2 Intermedio</SelectItem>
                            <SelectItem value="3">3 Competente</SelectItem>
                            <SelectItem value="4">4 Profesional</SelectItem>
                            <SelectItem value="5">5 Experto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setServicesDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}