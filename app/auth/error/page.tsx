import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Authentication error</CardTitle>
            <CardDescription>
              Something went wrong while signing you in. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              render={<Link href="/auth/login" />}
              nativeButton={false}
              className="w-full"
            >
              Back to login
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
