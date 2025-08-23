import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const dynamic = 'force-dynamic'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <ResetPasswordForm />
    </div>
  )
}