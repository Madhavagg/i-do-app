'use client'

import { PasswordValidation } from '@/types/auth'

interface PasswordStrengthProps {
  validation: PasswordValidation
}

export default function PasswordStrength({ validation }: PasswordStrengthProps) {
  const { strength, errors } = validation

  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  }

  const strengthLabels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  }

  const strengthWidth = {
    weak: 'w-1/3',
    medium: 'w-2/3',
    strong: 'w-full',
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${strengthColors[strength]} ${strengthWidth[strength]} transition-all duration-300`}
          />
        </div>
        <span className={`text-xs font-medium ${strength === 'weak' ? 'text-red-600' : strength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
          {strengthLabels[strength]}
        </span>
      </div>
      {errors.length > 0 && (
        <ul className="text-xs text-gray-500 space-y-0.5">
          {errors.map((error) => (
            <li key={error} className="flex items-center gap-1">
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {error}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
