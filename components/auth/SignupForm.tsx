'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { validatePassword } from '@/types/auth'
import PasswordInput from './PasswordInput'
import PasswordStrength from './PasswordStrength'
import AuthError from './AuthError'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const passwordValidation = validatePassword(password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (!passwordValidation.isValid) {
      setError('Please choose a stronger password.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsLoading(true)

    const result = await signUp(email, password)

    if (result.success) {
      router.push(`/auth/confirm?email=${encodeURIComponent(email)}`)
    } else {
      setError(result.error || 'Failed to create account.')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <AuthError message={error} />}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <PasswordInput
          id="password"
          value={password}
          onChange={setPassword}
          placeholder="Create a password"
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
          placeholder="Confirm your password"
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
            Creating account...
          </span>
        ) : (
          'Create Account'
        )}
      </button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-blue-500 hover:text-blue-600 font-medium">
          Sign in
        </Link>
      </p>
    </form>
  )
}
