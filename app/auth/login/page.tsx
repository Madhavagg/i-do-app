import LoginForm from '@/components/auth/LoginForm'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
        <p className="text-gray-500 mt-1">Sign in to continue</p>
      </div>
      <LoginForm />
    </div>
  )
}
