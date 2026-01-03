'use client'

interface AuthErrorProps {
  message: string
}

export default function AuthError({ message }: AuthErrorProps) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
  )
}
