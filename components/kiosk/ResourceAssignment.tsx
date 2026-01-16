'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin } from 'lucide-react'

interface ResourceAssignmentProps {
  resources: Array<{
    resource_id: string
    resource_name: string
    resource_type: string
    capacity: number
    priority: number
  }>
  start_time: string
  end_time: string
}

export function ResourceAssignment({ resources, start_time, end_time }: ResourceAssignmentProps) {
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Monterrey'
    }).format(date)
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-green-100 text-green-700 border-green-300'
      case 2:
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 3:
        return 'bg-gray-100 text-gray-700 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return 'Alta'
      case 2:
        return 'Media'
      case 3:
        return 'Baja'
      default:
        return 'Normal'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'station':
        return 'Estación'
      case 'room':
        return 'Sala'
      case 'equipment':
        return 'Equipo'
      default:
        return type
    }
  }

  const getRecommendedResource = () => {
    return resources.length > 0 ? resources[0] : null
  }

  const recommended = getRecommendedResource()

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Espacios Disponibles</CardTitle>
        <CardDescription>
          {formatDateTime(start_time)} - {new Date(end_time).toLocaleTimeString('es-MX', { timeZone: 'America/Monterrey' })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {resources.length === 0 ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-center">
            <p className="text-red-700">No hay espacios disponibles para este horario</p>
          </div>
        ) : (
          <>
            {recommended && (
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-md">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge className="mb-2 bg-green-600">
                      Recomendado
                    </Badge>
                    <h3 className="font-semibold text-lg">{recommended.resource_name}</h3>
                  </div>
                  <Badge className={getPriorityColor(recommended.priority)}>
                    {getPriorityLabel(recommended.priority)}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{getTypeLabel(recommended.resource_type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Capacidad: {recommended.capacity} persona(s)</span>
                  </div>
                </div>
              </div>
            )}

            {resources.length > 1 && (
              <>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Otros espacios disponibles:
                </h4>
                <div className="space-y-2">
                  {resources.slice(1).map((resource, index) => (
                    <div 
                      key={resource.resource_id}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-md flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{resource.resource_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {getTypeLabel(resource.resource_type)} • Capacidad: {resource.capacity}
                        </p>
                      </div>
                      <Badge className={getPriorityColor(resource.priority)}>
                        {getPriorityLabel(resource.priority)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
              <p className="font-medium text-blue-900 mb-1">
                Prioridad de asignación:
              </p>
              <ul className="space-y-1 text-blue-800">
                <li>1. Estaciones (prioridad alta)</li>
                <li>2. Salas (prioridad media)</li>
                <li>3. Equipo (prioridad baja)</li>
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
