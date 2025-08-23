import { SignUpForm } from '@/components/auth/SignUpForm'

export const dynamic = 'force-dynamic'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SignUpForm />
    </div>
  )
}