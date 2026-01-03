import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">I do</h1>
        <h2 className="text-xl font-semibold text-gray-700">Reset your password</h2>
        <p className="text-gray-500 mt-1">Enter your email to receive a reset link</p>
      </div>
      <ForgotPasswordForm />
    </div>
  )
}
