'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export function SignUpForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [emailExists, setEmailExists] = useState<{
    exists: boolean
    suggestions?: Array<{action: string, text: string, url: string}>
  } | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })

  const checkEmailExists = async (email: string) => {
    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        const data = await response.json()
        setEmailExists(data)
        return data.exists
      }
      return false
    } catch (error) {
      console.error('Email check failed:', error)
      return false
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setEmailExists(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Wachtwoorden komen niet overeen')
      setLoading(false)
      return
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens lang zijn')
      setLoading(false)
      return
    }

    // Check if email already exists
    const emailAlreadyExists = await checkEmailExists(formData.email)
    if (emailAlreadyExists) {
      setLoading(false)
      return // The email exists warning will be shown via emailExists state
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/crm`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('Er is iets misgegaan. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/crm`,
        },
      })

      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('Er is iets misgegaan. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Controleer je e-mail</CardTitle>
          <CardDescription className="text-center">
            We hebben een bevestigingslink gestuurd naar <strong>{formData.email}</strong>.
            Klik op de link in de e-mail om je account te activeren.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link href="/auth/login">
            <Button variant="outline">Terug naar inloggen</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Account aanmaken</CardTitle>
        <CardDescription>
          Vul je gegevens in om een account aan te maken
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {emailExists?.exists && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <div className="ml-2">
                <AlertDescription className="mb-3">
                  Dit e-mailadres is al geregistreerd. Wat wil je doen?
                </AlertDescription>
                <div className="flex flex-col gap-2">
                  {emailExists.suggestions?.map((suggestion, index) => (
                    <Link key={index} href={suggestion.url}>
                      <Button variant="outline" size="sm" className="w-full">
                        {suggestion.text}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">E-mailadres</Label>
            <Input
              id="email"
              type="email"
              placeholder="jouw@email.nl"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value })
                // Clear email exists warning when user types a new email
                if (emailExists?.exists) {
                  setEmailExists(null)
                }
              }}
              required
              disabled={loading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Wachtwoord</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
              placeholder="Minimaal 6 tekens"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Account aanmaken...
              </>
            ) : (
              'Account aanmaken'
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Of</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignUp}
          disabled={loading}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Registreren met Google
        </Button>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-center w-full text-muted-foreground">
          Heb je al een account?{' '}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Log hier in
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}