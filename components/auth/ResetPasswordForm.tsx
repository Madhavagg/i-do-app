'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { validatePassword } from '@/types/auth'
import PasswordInput from './PasswordInput'
import PasswordStrength from './PasswordStrength'
import AuthError from './AuthError'

export default function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { session, isLoading: authLoading, updatePassword } = useAuth()
  const router = useRouter()

  const passwordValidation = validatePassword(password)

  // Wait for auth to initialize and check for recovery session
  useEffect(() => {
    if (!authLoading) {
      // Check if we have hash fragments (tokens from Supabase)
      const hash = window.location.hash

      if (hash && hash.includes('access_token')) {
        // Hash fragment exists - Supabase client will parse it
        // Give it a moment to process
        const timer = setTimeout(() => {
          setIsReady(true)
        }, 500)
        return () => clearTimeout(timer)
      } else if (session) {
        // Already have a session (possibly recovery session)
        setIsReady(true)
      } else {
        // No hash and no session - invalid access
        setError('Invalid or expired password reset link. Please request a new one.')
        setIsReady(true)
      }
    }
  }, [authLoading, session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!passwordValidation.isValid) {
      setError('Please choose a stronger password.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)

    const result = await updatePassword(password)

    if (result.success) {
      setIsSuccess(true)
    } else {
      setError(result.error || 'Failed to reset password.')
      setIsLoading(false)
    }
  }

  // Show loading while auth is initializing
  if (authLoading || !isReady) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-gray-600">Verifying reset link...</p>
      </div>
    )
  }

  // Show success message
  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">Password updated!</h2>

        <p className="text-gray-600 mb-6">
          Your password has been successfully changed.
        </p>

        <button
          onClick={() => {
            router.push('/')
            router.refresh()
          }}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Continue to App
        </button>
      </div>
    )
  }

  // Show error if no valid session
  if (error && !session) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Expired</h2>

        <p className="text-gray-600 mb-6">
          {error}
        </p>

        <Link
          href="/auth/forgot-password"
          className="inline-block w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-center"
        >
          Request New Link
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <AuthError message={error} />}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          New Password
        </label>
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          placeholder="Create a new password"
          autoComplete="new-password"
        />
        {password && <PasswordStrength validation={passwordValidation} />}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <PasswordInput
          id="confirmPassword"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Confirm your new password"
          autoComplete="new-password"
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Resetting password...
          </span>
        ) : (
          'Reset Password'
        )}
      </button>
    </form>
  )
}
