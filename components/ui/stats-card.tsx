import * as React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"

interface StatsCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

/**
 * StatsCard component for displaying key metrics in the dashboard.
 * @param {React.ReactNode} icon - Icon component to display
 * @param {string} title - Title of the metric
 * @param {string|number} value - Value to display
 * @param {Object} trend - Optional trend information with value and isPositive flag
 * @param {string} className - Optional additional CSS classes
 */
export function StatsCard({ icon, title, value, trend, className }: StatsCardProps) {
  return (
    <Card
      className={cn(
        "p-6 transition-all hover:shadow-lg",
        className
      )}
      style={{
        backgroundColor: 'var(--ivory-cream)',
        border: '1px solid var(--mocha-taupe)',
        borderRadius: 'var(--radius-lg)'
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--charcoal-brown)', opacity: 0.8 }}
          >
            {title}
          </span>
          <span
            className="text-3xl font-bold"
            style={{ color: 'var(--deep-earth)' }}
          >
            {value}
          </span>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              {trend.value === 0 ? (
                <Minus className="h-3 w-3" style={{ color: 'var(--charcoal-brown)' }} />
              ) : trend.isPositive ? (
                <ArrowUp className="h-3 w-3" style={{ color: 'var(--forest-green)' }} />
              ) : (
                <ArrowDown className="h-3 w-3" style={{ color: 'var(--brick-red)' }} />
              )}
              <span
                className={cn(
                  "font-medium",
                  trend.value === 0 && "text-gray-500",
                  trend.isPositive && trend.value > 0 && "text-green-600",
                  !trend.isPositive && trend.value > 0 && "text-red-600"
                )}
              >
                {trend.value}%
              </span>
            </div>
          )}
        </div>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-lg"
          style={{ backgroundColor: 'var(--sand-beige)' }}
        >
          {icon}
        </div>
      </div>
    </Card>
  )
}
