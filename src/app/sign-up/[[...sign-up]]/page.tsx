'use client'

import { Suspense } from 'react'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { ShieldCheck, Zap, Lock } from 'lucide-react'

function SignUpInner() {
  const role = useSearchParams().get('role')
  const redirectUrl =
    role === 'seller' ? '/onboarding/seller' :
    role === 'buyer'  ? '/onboarding/buyer'  :
    '/dashboard'

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">

      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#006948] text-white">
        <div>
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-full border-2 border-white/60 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-white" />
            </div>
            <span className="font-['Geist'] text-xl font-bold tracking-tight">Recylink</span>
          </div>
          <h1 className="font-['Geist'] text-4xl font-bold leading-tight mb-4">
            Join India&apos;s EPR<br />compliance network.
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Brands offset their plastic liability. Recyclers monetise verified credits. Zero brokers.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: Lock,        label: 'Escrow Protected',    desc: '48-hour secure escrow on every trade' },
            { icon: ShieldCheck, label: 'CPCB Verified',       desc: 'Only certified recyclers list credits' },
            { icon: Zap,         label: 'Instant Certificate', desc: 'Download proof of compliance immediately' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-white/60 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auth panel */}
      <div className="flex flex-col items-center justify-center p-6 min-h-screen lg:min-h-0">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-7 h-7 rounded-full border-2 border-[#006948] flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-[#006948]" />
          </div>
          <span className="font-['Geist'] text-lg font-bold text-[#006948]">Recylink</span>
        </div>
        <SignUp signInUrl="/sign-in" forceRedirectUrl={redirectUrl} />
      </div>

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
