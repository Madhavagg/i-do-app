import SignupForm from '@/components/auth/SignupForm'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">I do</h1>
        <h2 className="text-xl font-semibold text-gray-700">Create your account</h2>
        <p className="text-gray-500 mt-1">Start organizing your tasks today</p>
      </div>
      <SignupForm />
    </div>
  )
}
