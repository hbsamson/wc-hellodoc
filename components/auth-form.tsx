'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { updateCurrentUserIdentity } from '@/app/actions/users'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle } from 'lucide-react'

interface AuthFormProps {
  mode: 'sign-in' | 'sign-up'
  userType?: 'patient' | 'doctor'
}

export function AuthForm({ mode, userType = 'patient' }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [givenName, setGivenName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (mode === 'sign-up') {
        const name = [givenName, lastName]
          .map((part) => part.trim())
          .filter(Boolean)
          .join(' ')

        const { data: signUpData, error: signUpError } =
          await authClient.signUp.email({
            email,
            password,
            name: name || email.split('@')[0],
          })

        if (signUpError) {
          throw new Error(signUpError.message || signUpError.statusText || 'Sign up failed')
        }

        // Use the user ID from the sign-up response directly to avoid
        // a race condition where the server-side session isn't ready yet.
        const userId = signUpData?.user?.id
        if (userId) {
          try {
            const { error: updateError } = await updateCurrentUserIdentity({
              givenName,
              lastName,
              userType,
            })
            if (updateError) {
              console.error('Failed to update user identity:', updateError)
            }
          } catch (updateErr) {
            // Non-blocking — the core account was created successfully
            console.error('Failed to update user identity:', updateErr)
          }
        }

        const onboardingPath =
          userType === 'doctor'
            ? '/doctor-profile?onboarding=1'
            : '/patient-profile?onboarding=1'

        router.push(onboardingPath)
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
        })

        if (signInError) {
          throw new Error(signInError.message || signInError.statusText || 'Sign in failed')
        }

        router.push('/dashboard')
      }

      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An error occurred. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {mode === 'sign-up' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="givenName">Given Name</Label>
            <Input
              id="givenName"
              type="text"
              placeholder="John"
              value={givenName}
              onChange={(e) => setGivenName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        {mode === 'sign-up' && (
          <p className="text-xs text-muted-foreground">
            At least 8 characters recommended
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Spinner className="w-4 h-4 mr-2" />}
        {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
      </Button>

      <p className="text-xs text-muted-foreground text-center pt-2">
        {mode === 'sign-in'
          ? 'By signing in, you agree to our Terms of Service and Privacy Policy'
          : 'By creating an account, you agree to our Terms of Service and Privacy Policy'}
      </p>
    </form>
  )
}
