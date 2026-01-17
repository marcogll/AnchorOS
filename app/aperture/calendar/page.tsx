'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth/context'
import CalendarView from '@/components/calendar-view'

/**
 * @description Calendar page for managing appointments and scheduling
 */
export default function CalendarPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

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
          <h1 className="text-2xl font-bold text-gray-900">Aperture - Calendario</h1>
          <p className="text-gray-600">Gestión de citas y horarios</p>
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
        <CalendarView />
      </div>
    </div>
  )
}