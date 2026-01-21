'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'

/**
 * @description Authentication guard component that protects routes requiring login
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render when authenticated
 * @returns {JSX.Element} Loading state while auth is determined, or children when authenticated
 * @audit BUSINESS RULE: AuthGuard is a client-side guard for protected routes
 * @audit SECURITY: Prevents rendering protected content until authentication verified
 * @audit Validate: Loading state shown while auth provider determines user session
 * @audit PERFORMANCE: No API calls - relies on AuthProvider's cached session state
 * @audit Note: Actual redirect logic handled by AuthProvider to avoid conflicts
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
