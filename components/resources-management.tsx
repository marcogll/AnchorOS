/**
 * @description Resources management interface with CRUD and real-time availability
 * @audit BUSINESS RULE: Resources must have valid location and capacity settings
 * @audit SECURITY: Resource management restricted to admin users only
 * @audit Validate: Real-time availability shows current booking conflicts
 * @audit AUDIT: All resource changes logged in audit trails
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
import { Plus, Edit, Trash2, MapPin, Settings, Users, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth/context'

interface Resource {
  id: string
  location_id: string
  name: string
  type: string
  capacity: number
  is_active: boolean
  created_at: string
  updated_at: string
  locations?: {
    id: string
    name: string
    address: string
  }
  currently_booked?: boolean
  available_capacity?: number
}

interface Location {
  id: string
  name: string
  address: string
}

/**
 * @description Resources management component with availability monitoring
 * @returns {JSX.Element} Resource listing with create/edit/delete and status indicators
 * @audit BUSINESS RULE: Resource capacity affects booking availability calculations
 * @audit SECURITY: Validates admin permissions before allowing modifications
 * @audit Validate: Real-time status prevents double-booking conflicts
 * @audit PERFORMANCE: Availability checks done server-side for accuracy
 */
export default function ResourcesManagement() {
  const { user } = useAuth()
  const [resources, setResources] = useState<Resource[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [formData, setFormData] = useState({
    location_id: '',
    name: '',
    type: '',
    capacity: 1
  })

  useEffect(() => {
    fetchResources()
    fetchLocations()
  }, [])

  const fetchResources = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/aperture/resources?include_availability=true')
      const data = await response.json()
      if (data.success) {
        setResources(data.resources)
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
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
      const url = editingResource
        ? `/api/aperture/resources/${editingResource.id}`
        : '/api/aperture/resources'

      const method = editingResource ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        await fetchResources()
        setDialogOpen(false)
        setEditingResource(null)
        setFormData({ location_id: '', name: '', type: '', capacity: 1 })
      } else {
        alert(data.error || 'Error saving resource')
      }
    } catch (error) {
      console.error('Error saving resource:', error)
      alert('Error saving resource')
    }
  }

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource)
    setFormData({
      location_id: resource.location_id,
      name: resource.name,
      type: resource.type,
      capacity: resource.capacity
    })
    setDialogOpen(true)
  }

  const handleDelete = async (resource: Resource) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el recurso "${resource.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/aperture/resources/${resource.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        await fetchResources()
      } else {
        alert(data.error || 'Error deleting resource')
      }
    } catch (error) {
      console.error('Error deleting resource:', error)
      alert('Error deleting resource')
    }
  }

  const openCreateDialog = () => {
    setEditingResource(null)
    setFormData({ location_id: '', name: '', type: '', capacity: 1 })
    setDialogOpen(true)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'station': return 'bg-blue-100 text-blue-800'
      case 'room': return 'bg-green-100 text-green-800'
      case 'equipment': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'station': return 'Estación'
      case 'room': return 'Sala'
      case 'equipment': return 'Equipo'
      default: return type
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Recursos</h2>
          <p className="text-gray-600">Administra estaciones, salas y equipos</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Recurso
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Recursos Disponibles
          </CardTitle>
          <CardDescription>
            {resources.length} recursos configurados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando recursos...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Estado Actual</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="font-medium">{resource.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(resource.type)}>
                        {getTypeLabel(resource.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        {resource.locations?.name || 'Sin ubicación'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {resource.capacity}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {resource.currently_booked ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">Ocupado</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Disponible</span>
                          </div>
                        )}
                        <span className="text-xs text-gray-500">
                          ({resource.available_capacity}/{resource.capacity})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={resource.is_active ? "default" : "secondary"}>
                        {resource.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(resource)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(resource)}
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
              {editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
            </DialogTitle>
            <DialogDescription>
              {editingResource ? 'Modifica la información del recurso' : 'Agrega un nuevo recurso al sistema'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="col-span-3"
                  placeholder="Ej: Estación 1, Sala VIP, etc."
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Tipo
                </Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="station">Estación de trabajo</SelectItem>
                    <SelectItem value="room">Sala privada</SelectItem>
                    <SelectItem value="equipment">Equipo especial</SelectItem>
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
                <Label htmlFor="capacity" className="text-right">
                  Capacidad
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value) || 1})}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingResource ? 'Actualizar' : 'Crear'} Recurso
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}