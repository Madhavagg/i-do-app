'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import PasswordInput from './PasswordInput'
import AuthError from './AuthError'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }

    if (!password) {
      setError('Please enter your password.')
      return
    }

    setIsLoading(true)

    const result = await signIn(email, password)

    if (result.success) {
      router.push('/')
      router.refresh()
    } else {
      setError(result.error || 'Failed to sign in.')
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
          placeholder="Enter your password"
          autoComplete="current-password"
        />
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
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-blue-500 hover:text-blue-600 font-medium">
          Sign up
        </Link>
      </p>
    </form>
  )
}
