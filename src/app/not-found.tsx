import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link href="/" className={buttonVariants({ variant: 'outline' })}>
        Go home
      </Link>
    </div>
  )
}
