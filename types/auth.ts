export interface AuthResult {
  success: boolean
  error?: string
  requiresConfirmation?: boolean
}

export interface PasswordValidation {
  isValid: boolean
  strength: 'weak' | 'medium' | 'strong'
  errors: string[]
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('At least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('One number')
  }

  let strength: 'weak' | 'medium' | 'strong' = 'weak'
  const passedChecks = 4 - errors.length

  if (passedChecks >= 4) {
    strength = 'strong'
  } else if (passedChecks >= 2) {
    strength = 'medium'
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors,
  }
}

export function mapAuthError(error: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password. Please try again.',
    'Email not confirmed': 'Please confirm your email before logging in.',
    'User already registered': 'This email is already registered. Try logging in instead.',
    'Password should be at least 6 characters': 'Password must be at least 8 characters.',
    'Email rate limit exceeded': 'Too many attempts. Please wait a moment and try again.',
    'For security purposes, you can only request this once every 60 seconds': 'Please wait before requesting another email.',
  }

  return errorMap[error] || error || 'Something went wrong. Please try again.'
}
