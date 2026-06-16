'use client'

import Image from 'next/image'
import { SignIn } from '@clerk/nextjs'
import { ShieldCheck, Zap, Lock } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">

      {/* Brand panel — desktop only */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#006948] text-white">
        <div>
          <div className="mb-12">
            <Image src="/logo.png" alt="Recyclink" width={48} height={48} className="h-12 w-12 object-contain brightness-0 invert" />
          </div>
          <h1 className="font-['Geist'] text-4xl font-bold leading-tight mb-4">
            India&apos;s only<br />zero-markup EPR<br />credit exchange.
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Buy directly from CPCB-verified recyclers. No brokers. Instant certificate.
          </p>
        </div>

        <div className="space-y-4">
          {[
            { icon: Lock,        label: 'Escrow Protected',  desc: '48-hour secure escrow on every trade' },
            { icon: ShieldCheck, label: 'CPCB Verified',     desc: 'Only certified recyclers list credits' },
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
        <div className="mb-8 lg:hidden">
          <Image src="/logo.png" alt="Recyclink" width={48} height={48} className="h-12 w-12 object-contain" />
        </div>
        <SignIn />
      </div>

    </div>
  )
}
