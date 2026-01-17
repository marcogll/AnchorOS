import * as React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, MapPin, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface StaffInfo {
  name: string
  role?: string
}

interface BookingCardProps {
  id: string
  customerName: string
  serviceName: string
  startTime: string
  endTime: string
  status: 'confirmed' | 'pending' | 'completed' | 'no_show' | 'cancelled'
  staff: StaffInfo
  location?: string
  onReschedule?: () => void
  onCancel?: () => void
  onMarkNoShow?: () => void
  onViewDetails?: () => void
  className?: string
}

const statusColors: Record<BookingCardProps['status'], { bg: string; text: string }> = {
  confirmed: { bg: 'var(--forest-green-alpha)', text: 'var(--forest-green)' },
  pending: { bg: 'var(--clay-orange-alpha)', text: 'var(--clay-orange)' },
  completed: { bg: 'var(--slate-blue-alpha)', text: 'var(--slate-blue)' },
  no_show: { bg: 'var(--brick-red-alpha)', text: 'var(--brick-red)' },
  cancelled: { bg: 'var(--charcoal-brown-alpha)', text: 'var(--charcoal-brown)' },
}

/**
 * BookingCard component for displaying booking information in the dashboard.
 * @param {string} id - Unique booking identifier
 * @param {string} customerName - Name of the customer
 * @param {string} serviceName - Name of the service booked
 * @param {string} startTime - Start time of the booking
 * @param {string} endTime - End time of the booking
 * @param {string} status - Booking status
 * @param {Object} staff - Staff information with name and optional role
 * @param {string} location - Optional location name
 * @param {Function} onReschedule - Callback for rescheduling
 * @param {Function} onCancel - Callback for cancellation
 * @param {Function} onMarkNoShow - Callback for marking as no-show
 * @param {Function} onViewDetails - Callback for viewing details
 * @param {string} className - Optional additional CSS classes
 */
export function BookingCard({
  id,
  customerName,
  serviceName,
  startTime,
  endTime,
  status,
  staff,
  location,
  onReschedule,
  onCancel,
  onMarkNoShow,
  onViewDetails,
  className
}: BookingCardProps) {
  const statusColor = statusColors[status]
  const canReschedule = ['confirmed', 'pending'].includes(status)
  const canCancel = ['confirmed', 'pending'].includes(status)
  const canMarkNoShow = status === 'confirmed'

  return (
    <Card
      className={cn(
        "p-4 transition-all hover:shadow-md",
        className
      )}
      style={{
        backgroundColor: 'var(--ivory-cream)',
        border: '1px solid var(--mocha-taupe)',
        borderRadius: 'var(--radius-lg)'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4
            className="font-semibold text-base mb-1"
            style={{ color: 'var(--deep-earth)' }}
          >
            {serviceName}
          </h4>
          <div className="flex items-center gap-2 text-sm mb-2">
            <User className="h-4 w-4" style={{ color: 'var(--charcoal-brown)' }} />
            <span style={{ color: 'var(--charcoal-brown)' }}>{customerName}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" style={{ color: 'var(--charcoal-brown)' }} />
              <span style={{ color: 'var(--charcoal-brown)' }}>
                {new Date(startTime).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" style={{ color: 'var(--charcoal-brown)' }} />
              <span style={{ color: 'var(--charcoal-brown)' }}>
                {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                {new Date(endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onViewDetails && (
              <DropdownMenuItem onClick={onViewDetails}>
                Ver Detalles
              </DropdownMenuItem>
            )}
            {canReschedule && onReschedule && (
              <DropdownMenuItem onClick={onReschedule}>
                Reprogramar
              </DropdownMenuItem>
            )}
            {canMarkNoShow && onMarkNoShow && (
              <DropdownMenuItem onClick={onMarkNoShow} style={{ color: 'var(--brick-red)' }}>
                Marcar como No-Show
              </DropdownMenuItem>
            )}
            {canCancel && onCancel && (
              <DropdownMenuItem onClick={onCancel} style={{ color: 'var(--brick-red)' }}>
                Cancelar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            style={{
              backgroundColor: statusColor.bg,
              color: statusColor.text,
              border: 'none',
              fontSize: '12px',
              padding: '4px 8px',
              borderRadius: '4px'
            }}
          >
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
          {location && (
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--charcoal-brown)' }}>
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
            </div>
          )}
        </div>
        <div className="text-xs" style={{ color: 'var(--charcoal-brown)' }}>
          {staff.name}
          {staff.role && (
            <span className="ml-1 opacity-70">({staff.role})</span>
          )}
        </div>
      </div>
    </Card>
  )
}
