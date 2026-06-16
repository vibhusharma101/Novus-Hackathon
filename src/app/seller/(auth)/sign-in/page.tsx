'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2 } from 'lucide-react'

export default function SellerSignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/seller/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/seller/vault')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-[#006948] text-white">
        <div>
          <div className="mb-12">
            <div className="bg-white rounded-xl p-2 inline-flex">
              <Image src="/logo.jpg" alt="Recyclink" width={48} height={48} className="h-10 w-10 object-contain" />
            </div>
          </div>
          <h1 className="font-['Geist'] text-4xl font-bold leading-tight mb-4">
            Monetise your<br />certified EPR<br />credits.
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            List verified plastic credits and connect directly with brands. Zero brokers, instant settlement.
          </p>
        </div>
        <div className="space-y-4">
          {[
            { label: 'CPCB Verified Listings', desc: 'Only certified recyclers can list credits' },
            { label: 'Direct to Brands',        desc: 'No middlemen — full price goes to you' },
            { label: 'Instant Certificate',     desc: 'Auto-generated on every completed trade' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-white/60 text-xs">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center p-6 min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Image src="/logo.jpg" alt="Recyclink" width={48} height={48} className="h-12 w-12 object-contain" />
          </div>

          <h2 className="font-['Geist'] text-2xl font-semibold text-on-surface mb-1">Seller sign in</h2>
          <p className="text-sm text-on-surface-variant mb-8">Use your seller account credentials.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="vibhu1@gmail.com"
                className="w-full h-10 px-3 rounded-lg border border-[--color-border-zinc] bg-white text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 rounded-lg border border-[--color-border-zinc] bg-white text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
              />
            </div>

            {error && (
              <p className="text-sm text-[--color-risk-red] bg-error-container/30 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary-container transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
