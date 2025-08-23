import { UpdatePasswordForm } from '@/components/auth/UpdatePasswordForm'

export const dynamic = 'force-dynamic'

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <UpdatePasswordForm />
    </div>
  )
}