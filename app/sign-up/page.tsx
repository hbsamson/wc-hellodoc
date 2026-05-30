import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { AuthForm } from '@/components/auth-form'
import Link from 'next/link'

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ userType?: string }>
}) {
  const [{ userType }, session] = await Promise.all([
    searchParams,
    auth.api.getSession({ headers: await headers() }),
  ])
  const signUpUserType = userType === 'doctor' ? 'doctor' : 'patient'

  if (session?.user) {
    redirect(
      signUpUserType === 'doctor'
        ? '/doctor-profile?onboarding=1'
        : '/patient-profile?onboarding=1',
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">H</span>
            </div>
            <span className="text-2xl font-bold text-primary">HelloDoc</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">
            {signUpUserType === 'doctor'
              ? 'Create Doctor Account'
              : 'Create Account'}
          </h1>
          <p className="text-muted-foreground">
            {signUpUserType === 'doctor'
              ? 'Join HelloDoc and start accepting patient consultations.'
              : 'Join HelloDoc and connect with healthcare professionals.'}
          </p>
        </div>

        {/* Auth Form */}
        <AuthForm mode="sign-up" userType={signUpUserType} />

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
