'use client'

import { Suspense } from 'react'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

function SignUpInner() {
  const role = useSearchParams().get('role')
  // Route each persona to its onboarding form after sign-up.
  const redirectUrl =
    role === 'seller' ? '/onboarding/seller' :
    role === 'buyer'  ? '/onboarding/buyer'  :
    '/dashboard'

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <SignUp signInUrl="/sign-in" forceRedirectUrl={redirectUrl} />
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpInner />
    </Suspense>
  )
}
