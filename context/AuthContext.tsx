'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { AuthResult, mapAuthError } from '@/types/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<AuthResult>
  updatePassword: (newPassword: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    // Skip auth initialization if Supabase client is not available (build time)
    if (!supabase) {
      setIsLoading(false)
      return
    }

    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
        setUser(session?.user ?? null)
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const signUp = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Authentication not configured.' }
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        return { success: false, error: mapAuthError(error.message) }
      }

      return { success: true, requiresConfirmation: true }
    } catch {
      return { success: false, error: 'Something went wrong. Please try again.' }
    }
  }

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Authentication not configured.' }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: mapAuthError(error.message) }
      }

      return { success: true }
    } catch {
      return { success: false, error: 'Something went wrong. Please try again.' }
    }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Authentication not configured.' }
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (error) {
        return { success: false, error: mapAuthError(error.message) }
      }

      return { success: true }
    } catch {
      return { success: false, error: 'Something went wrong. Please try again.' }
    }
  }

  const updatePassword = async (newPassword: string): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Authentication not configured.' }
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return { success: false, error: mapAuthError(error.message) }
      }

      return { success: true }
    } catch {
      return { success: false, error: 'Something went wrong. Please try again.' }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
