'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'

/**
 * AuthGuard component that shows loading state while authentication is being determined
 * Redirect logic is now handled by AuthProvider to avoid conflicts
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth()

  // Show loading while auth state is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
