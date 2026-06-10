'use client'

import { Suspense } from 'react'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

function SignUpInner() {
  const role = useSearchParams().get('role')
  // Buyer → onboarding form. Seller onboarding (S1) is not built yet, so route
  // sellers to the dashboard for now; switch to /onboarding/seller in PR 3.
  const redirectUrl = role === 'buyer' ? '/onboarding/buyer' : '/dashboard'

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
