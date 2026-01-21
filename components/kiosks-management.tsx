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
import { Plus, Edit, Trash2, Smartphone, MapPin, Key, Wifi } from 'lucide-react'

interface Kiosk {
  id: string
  device_name: string
  display_name: string
  api_key: string
  ip_address?: string
  is_active: boolean
  created_at: string
  location?: {
    id: string
    name: string
    address: string
  }
}

interface Location {
  id: string
  name: string
  address: string
}

export default function KiosksManagement() {
  const [kiosks, setKiosks] = useState<Kiosk[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingKiosk, setEditingKiosk] = useState<Kiosk | null>(null)
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    device_name: '',
    display_name: '',
    location_id: '',
    ip_address: ''
  })

  useEffect(() => {
    fetchKiosks()
    fetchLocations()
  }, [])

  const fetchKiosks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/aperture/kiosks')
      const data = await response.json()
      if (data.success) {
        setKiosks(data.kiosks)
      }
    } catch (error) {
      console.error('Error fetching kiosks:', error)
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
      const url = editingKiosk
        ? `/api/aperture/kiosks/${editingKiosk.id}`
        : '/api/aperture/kiosks'

      const method = editingKiosk ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        await fetchKiosks()
        setDialogOpen(false)
        setEditingKiosk(null)
        setFormData({ device_name: '', display_name: '', location_id: '', ip_address: '' })
      } else {
        alert(data.error || 'Error saving kiosk')
      }
    } catch (error) {
      console.error('Error saving kiosk:', error)
      alert('Error saving kiosk')
    }
  }

  const handleEdit = (kiosk: Kiosk) => {
    setEditingKiosk(kiosk)
    setFormData({
      device_name: kiosk.device_name,
      display_name: kiosk.display_name,
      location_id: kiosk.location?.id || '',
      ip_address: kiosk.ip_address || ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (kiosk: Kiosk) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el kiosko "${kiosk.device_name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/aperture/kiosks/${kiosk.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        await fetchKiosks()
      } else {
        alert(data.error || 'Error deleting kiosk')
      }
    } catch (error) {
      console.error('Error deleting kiosk:', error)
      alert('Error deleting kiosk')
    }
  }

  const toggleKioskStatus = async (kiosk: Kiosk) => {
    try {
      const response = await fetch(`/api/aperture/kiosks/${kiosk.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...kiosk,
          is_active: !kiosk.is_active
        })
      })

      const data = await response.json()

      if (data.success) {
        await fetchKiosks()
      } else {
        alert(data.error || 'Error updating kiosk status')
      }
    } catch (error) {
      console.error('Error toggling kiosk status:', error)
    }
  }

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey)
    setShowApiKey(apiKey)
    setTimeout(() => setShowApiKey(null), 2000)
  }

  const openCreateDialog = () => {
    setEditingKiosk(null)
    setFormData({ device_name: '', display_name: '', location_id: '', ip_address: '' })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Kioskos</h2>
          <p className="text-gray-600">Administra los dispositivos kiosko para check-in</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Kiosko
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Dispositivos Kiosko
          </CardTitle>
          <CardDescription>
            {kiosks.length} dispositivos registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando kioskos...</div>
          ) : kiosks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay kioskos registrados. Agrega uno para comenzar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kiosks.map((kiosk) => (
                  <TableRow key={kiosk.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">{kiosk.device_name}</div>
                          {kiosk.display_name !== kiosk.device_name && (
                            <div className="text-sm text-gray-500">{kiosk.display_name}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        {kiosk.location?.name || 'Sin ubicación'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {kiosk.ip_address ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Wifi className="w-3 h-3" />
                          {kiosk.ip_address}
                        </div>
                      ) : (
                        <span className="text-gray-400">Sin IP</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => copyApiKey(kiosk.api_key)}
                        className="flex items-center gap-1 text-sm font-mono bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                        title="Click para copiar"
                      >
                        <Key className="w-3 h-3" />
                        {showApiKey === kiosk.api_key ? 'Copiado!' : `${kiosk.api_key.slice(0, 8)}...`}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={kiosk.is_active ? 'default' : 'secondary'}
                        className={kiosk.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                      >
                        {kiosk.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleKioskStatus(kiosk)}
                        >
                          {kiosk.is_active ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(kiosk)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(kiosk)}
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
              {editingKiosk ? 'Editar Kiosko' : 'Nuevo Kiosko'}
            </DialogTitle>
            <DialogDescription>
              {editingKiosk ? 'Modifica la información del kiosko' : 'Agrega un nuevo dispositivo kiosko'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="device_name" className="text-right">
                  Nombre *
                </Label>
                <Input
                  id="device_name"
                  value={formData.device_name}
                  onChange={(e) => setFormData({...formData, device_name: e.target.value})}
                  className="col-span-3"
                  placeholder="Ej. Kiosko Principal"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="display_name" className="text-right">
                  Display
                </Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                  className="col-span-3"
                  placeholder="Nombre a mostrar"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location_id" className="text-right">
                  Ubicación *
                </Label>
                <Select
                  value={formData.location_id}
                  onValueChange={(value) => setFormData({...formData, location_id: value})}
                >
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
                <Label htmlFor="ip_address" className="text-right">
                  IP
                </Label>
                <Input
                  id="ip_address"
                  value={formData.ip_address}
                  onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                  className="col-span-3"
                  placeholder="192.168.1.100"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingKiosk ? 'Actualizar' : 'Crear'} Kiosko
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
