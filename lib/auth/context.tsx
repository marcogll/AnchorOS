'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string) => Promise<{ error: any }>
  signInWithPassword: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * @description Authentication provider managing Supabase auth state and redirects
 * @param {Object} props - React children to render within auth context
 * @returns {JSX.Element} AuthContext provider with authentication state
 * @audit SECURITY: Handles session persistence and automatic refresh
 * @audit SECURITY: Implements bidirectional redirects (login ↔ protected routes)
 * @audit Validate: Session state synchronized with Supabase auth changes
 * @audit Validate: Protected routes redirect to login when unauthenticated
 * @audit PERFORMANCE: Auth state changes trigger immediate UI updates
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          // If there's an auth error, clear any stale session data
          setSession(null)
          setUser(null)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err)
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Handle authentication redirects
  useEffect(() => {
    if (loading) return

    const isLoginPage = pathname === '/aperture/login'
    const isProtectedRoute = pathname?.startsWith('/aperture') && !isLoginPage

    if (user) {
      // User is authenticated
      if (isLoginPage) {
        // Redirect from login page to dashboard
        console.log('AuthProvider: Redirecting authenticated user from login to /aperture')
        window.location.replace('/aperture') // Use replace to avoid back button issues
      }
    } else {
      // User is not authenticated
      if (isProtectedRoute) {
        // Redirect to login for protected routes
        console.log('AuthProvider: Redirecting unauthenticated user to /aperture/login - Path:', pathname)
        window.location.replace('/aperture/login') // Use replace to avoid back button issues
      }
    }
  }, [user, loading, pathname])

  const signIn = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/booking`,
      },
    })
    return { error }
  }

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    // Don't manually update state here - the onAuthStateChange listener will handle it
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
    setUser(null)
    setSession(null)
    setLoading(false)
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signInWithPassword,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth hook that returns current authentication context.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
