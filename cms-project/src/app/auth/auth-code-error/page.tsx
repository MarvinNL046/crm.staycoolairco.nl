import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Authenticatie Fout</CardTitle>
          <CardDescription className="text-center">
            Er is een fout opgetreden tijdens het inloggen. Dit kan verschillende oorzaken hebben:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>De link is verlopen of al gebruikt</li>
            <li>Je account is nog niet geverifieerd</li>
            <li>Er is een technisch probleem opgetreden</li>
            <li>De sessie is verlopen</li>
          </ul>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Link href="/auth/login" className="w-full">
            <Button className="w-full">Opnieuw proberen</Button>
          </Link>
          <Link href="/auth/reset-password" className="w-full">
            <Button variant="outline" className="w-full">Wachtwoord vergeten?</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}