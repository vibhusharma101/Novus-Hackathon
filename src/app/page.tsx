import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 text-center px-4">
      <h1 className="text-4xl font-bold tracking-tight">Novus</h1>
      <p className="text-muted-foreground max-w-md">
        {/* Replace with real tagline once product spec is ready */}
        Your app description goes here.
      </p>
      <div className="flex gap-3">
        <Link href="/sign-up" className={cn(buttonVariants())}>
          Get started
        </Link>
        <Link href="/sign-in" className={cn(buttonVariants({ variant: 'outline' }))}>
          Sign in
        </Link>
      </div>
    </main>
  )
}
