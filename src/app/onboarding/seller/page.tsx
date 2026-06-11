import Link from 'next/link'
import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Lock, ShieldCheck } from 'lucide-react'
import { SellerOnboardingForm } from '@/components/onboarding/seller-form'

export const metadata: Metadata = {
  title: 'Seller Registration | EPRx Exchange',
  description: 'Register your recycling facility to list EPR credits on the exchange.',
}

export default async function SellerOnboardingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <main className="flex-grow flex items-center justify-center py-16 px-4 md:px-8 micro-grid">
        <div className="max-w-[640px] w-full flex flex-col items-center">
          {/* Brand anchor */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
              <span className="font-['Geist'] text-2xl font-semibold tracking-tight text-primary">
                EPRx Exchange
              </span>
            </div>
            <h1 className="font-['Geist'] text-2xl font-semibold tracking-tight text-on-surface mb-2">
              Seller Registration
            </h1>
            <p className="text-sm text-on-surface-variant">
              Register your recycling facility to list EPR credits on the exchange.
            </p>
          </div>

          {/* Form card */}
          <div className="w-full bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]">
            <div className="px-8 pt-8 pb-2 flex justify-between items-center">
              <span className="font-data text-[11px] text-on-surface-variant uppercase tracking-wider">
                Environmental Asset Management Entry
              </span>
              <span className="bg-surface-container px-3 py-1 rounded font-data text-[10px] text-on-surface-variant border border-[--color-border-zinc]">
                STATUS: UNVERIFIED
              </span>
            </div>
            <div className="px-8 pb-8 pt-4">
              <SellerOnboardingForm />
            </div>
            <div className="h-1 bg-primary" />
          </div>

          {/* Footer microcopy */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-outline">
              Already registered?{' '}
              <Link href="/sign-in" className="text-primary font-semibold hover:underline">
                Login to Terminal
              </Link>
            </p>
            <div className="flex items-center justify-center gap-6">
              <span className="font-data text-[11px] font-semibold tracking-wider text-outline uppercase">
                CPCB Verified Portal
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
            © 2026 EPRx Exchange India. SECURE TERMINAL v2.4.0
          </span>
          <div className="flex gap-6">
            <Link href="/" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              Environmental Standards
            </Link>
            <Link href="/" className="text-xs text-on-surface-variant hover:text-primary transition-colors">
              Privacy Protocol
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
