'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ConfirmMessage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <div className="bg-white rounded-lg shadow-md p-6 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h1>

      <p className="text-gray-600 mb-4">
        We&apos;ve sent a confirmation link to{' '}
        {email ? (
          <span className="font-medium text-gray-900">{email}</span>
        ) : (
          'your email address'
        )}
        .
      </p>

      <p className="text-sm text-gray-500 mb-6">
        Click the link in the email to confirm your account and start using the app.
      </p>

      <div className="space-y-3">
        <p className="text-xs text-gray-400">
          Didn&apos;t receive the email? Check your spam folder or try signing up again.
        </p>

        <Link
          href="/auth/login"
          className="inline-block text-blue-500 hover:text-blue-600 font-medium text-sm"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}

export default function ConfirmContent() {
  return (
    <Suspense fallback={
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    }>
      <ConfirmMessage />
    </Suspense>
  )
}
