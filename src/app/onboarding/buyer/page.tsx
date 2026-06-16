import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Lock } from 'lucide-react'
import { BuyerOnboardingForm } from '@/components/onboarding/buyer-form'

export const metadata: Metadata = {
  title: 'Buyer Registration | Recyclink',
  description: 'Complete your profile to access the compliance marketplace.',
}

export default async function BuyerOnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <main className="flex-grow flex items-center justify-center py-16 px-4 md:px-8 micro-grid">
        <div className="max-w-[560px] w-full flex flex-col items-center">
          {/* Brand anchor */}
          <div className="mb-10 text-center">
            <div className="mb-4">
              <Image src="/logo.png" alt="Recyclink" width={56} height={56} className="h-14 w-14 object-contain mx-auto" />
            </div>
            <h1 className="font-['Geist'] text-2xl font-semibold tracking-tight text-on-surface mb-2">
              Buyer Registration
            </h1>
            <p className="text-sm text-on-surface-variant">
              Complete your profile to access the compliance marketplace.
            </p>
          </div>

          {/* Form card */}
          <div className="w-full bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg p-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
            <BuyerOnboardingForm />
          </div>

          {/* Footer microcopy */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-outline">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-primary font-semibold hover:underline">
                Login to Terminal
              </Link>
            </p>
            <div className="flex items-center justify-center gap-6">
              <span className="font-data text-[11px] font-semibold tracking-wider text-outline uppercase">
                CPCB Aligned
              </span>
              <div className="h-4 w-px bg-[--color-border-zinc]" />
              <div className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <span className="font-data text-[11px] text-outline uppercase tracking-wider">
                  256-bit SSL Secure
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-8 mt-auto border-t border-[--color-border-zinc] bg-white">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-data text-[11px] text-outline">
            © 2026 Recyclink India. SECURE TERMINAL v2.4.0
          </span>
          <div className="flex gap-6">
            <Link href="/" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              Compliance Framework
            </Link>
            <Link href="/" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
