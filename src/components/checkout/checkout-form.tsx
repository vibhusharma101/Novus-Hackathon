'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, Lock, ArrowRight, ArrowLeft,
  Info, Clock, Factory, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { placeOrder } from '@/lib/actions/buyer'
import { PLATFORM_FEE_PCT } from '@/lib/epr/constants'
import type { Listing, PublicRecycler } from '@/lib/db/types'
import type { PlasticCategory } from '@/lib/epr/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckoutProps = {
  listing: Listing
  recycler: PublicRecycler | null
  brand: { company_name: string; gstin: string } | null
  defaultQtyKg: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const intlRs  = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const intlKg  = new Intl.NumberFormat('en-IN')
const fmtRs   = (n: number) => `₹${intlRs.format(n)}`
const fmtKg   = (n: number) => intlKg.format(Math.round(n))

const CAT_LABELS: Record<PlasticCategory, string> = {
  rigid:    'Rigid Plastic (Cat I)',
  flexible: 'Flexible Packaging (Cat II)',
  mlp:      'Multi-Layered Plastic (Cat III)',
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ─── CheckoutForm ─────────────────────────────────────────────────────────────

export function CheckoutForm({ listing, recycler, brand, defaultQtyKg }: CheckoutProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [qtyStr, setQtyStr] = useState(fmtKg(defaultQtyKg))
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shakeTerms, setShakeTerms] = useState(false)

  const txId = useMemo(() => {
    const year = new Date().getFullYear()
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
    return `EPR-${year}-${rand}`
  }, [])

  const qty = useMemo(() => {
    const n = parseFloat(qtyStr.replace(/,/g, ''))
    if (!Number.isFinite(n) || n <= 0) return 0
    return Math.min(n, listing.qty_kg)
  }, [qtyStr, listing.qty_kg])

  const creditsCost = qty * listing.price_per_kg
  const platformFee = creditsCost * PLATFORM_FEE_PCT
  const total       = creditsCost + platformFee

  function handleSubmit() {
    if (!agreedToTerms) {
      setShakeTerms(true)
      setTimeout(() => setShakeTerms(false), 500)
      return
    }
    if (qty <= 0) {
      setError('Please enter a valid quantity greater than 0.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await placeOrder({ listingId: listing.id, qty_kg: qty })
      if (result.ok) {
        if (typeof pendo !== 'undefined') {
          pendo.track('order_placed', {
            order_id: result.orderId,
            listing_id: listing.id,
            category: listing.category,
            qty_kg: qty,
            price_per_kg: listing.price_per_kg,
            credits_cost: creditsCost,
            platform_fee: platformFee,
            total: total,
            recycler_name: recyclerName,
            recycler_state: recyclerState,
          })
        }
        router.push(`/dashboard/orders/${result.orderId}/certificate`)
      } else {
        setError(result.error)
      }
    })
  }

  const recyclerName  = recycler?.company_name ?? '—'
  const cpcbReg       = recycler?.cpcb_reg_no  ?? '—'
  const recyclerState = recycler?.state         ?? '—'
  const capacityMt    = recycler?.capacity_mt   ?? 0
  const isVerified    = recycler?.verified      ?? false

  const ctaContent = isPending
    ? <><Spinner /> Processing…</>
    : <><span className="hidden md:inline">Simulate Bank Transfer — </span>Complete Order<ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></>

  const ctaDisabled = isPending || qty <= 0

  return (
    <div className="-m-6 flex flex-col min-h-full micro-grid bg-background">

      {/* ── Mobile-only transactional header ── */}
      <div className="md:hidden sticky top-0 z-30 bg-surface border-b border-[--color-border-zinc] h-14 flex items-center px-4 gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-on-surface-variant" />
        </button>
        <span className="font-['Geist'] font-bold text-primary text-base flex-1 text-center">EPRx</span>
        <div className="flex items-center gap-1 text-[10px] font-data border border-[--color-outline-variant] px-1.5 py-0.5 rounded text-on-surface-variant uppercase tracking-widest">
          <ShieldCheck className="h-3 w-3" />
          Secure
        </div>
      </div>

      <div className="flex-1 px-6 py-6 md:py-8">

        {/* Desktop breadcrumb */}
        <div className="hidden md:flex items-center gap-2 mb-8 font-data text-[11px] text-on-surface-variant uppercase tracking-widest">
          <button type="button" onClick={() => router.back()} className="hover:text-primary transition-colors">
            Market
          </button>
          <span>›</span>
          <span>Listing #{listing.id.slice(0, 8).toUpperCase()}</span>
          <span>›</span>
          <span className="text-primary font-bold">Secure Checkout</span>
        </div>

        {/* Mobile progress */}
        <div className="md:hidden mb-6">
          <div className="flex justify-between items-end mb-2">
            <h1 className="font-['Geist'] text-lg font-semibold text-on-background">Secure Settlement</h1>
            <span className="font-data text-[11px] text-primary font-bold">Step 3 of 3</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── Left: Trust Panel ── */}
          <div className="lg:col-span-5 space-y-5">

            {/* Recycler card — mobile compact */}
            <div className="md:hidden bg-surface-container-lowest border border-[--color-border-zinc] p-4 rounded-xl flex items-start gap-3">
              <div className="w-11 h-11 bg-success-emerald-light rounded-lg flex items-center justify-center shrink-0">
                <Factory className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-['Geist'] font-bold text-on-surface text-base">{recyclerName}</span>
                  {isVerified && (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 border border-primary bg-success-emerald-light rounded text-[10px] font-bold text-primary shrink-0">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      CPCB VERIFIED
                    </div>
                  )}
                </div>
                <p className="font-data text-[11px] text-on-surface-variant">
                  ID: <span className="text-on-surface font-bold">{cpcbReg}</span>
                </p>
              </div>
            </div>

            {/* Mobile escrow info */}
            <div className="md:hidden bg-surface-container-low border border-dashed border-secondary/30 p-4 rounded-xl flex gap-3 items-start">
              <Info className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
              <p className="font-data text-[11px] text-on-surface-variant leading-relaxed">
                Funds held in <span className="text-secondary font-bold">Regulatory Escrow</span> and released within a 48h transfer window post-verification.
              </p>
            </div>

            {/* Recycler card — desktop full */}
            <div className="hidden md:block bg-surface-container-lowest border border-[--color-border-zinc] p-6 rounded-lg">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h2 className="font-['Geist'] text-lg font-semibold text-on-surface">{recyclerName}</h2>
                  <p className="font-data text-[11px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                    Seller Identity Verified
                  </p>
                </div>
                {isVerified && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-success-emerald-light border border-primary rounded text-primary shrink-0">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span className="font-data text-[11px] font-bold">CPCB VERIFIED</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-[--color-border-zinc] pt-5">
                {([
                  ['Registration No.', cpcbReg],
                  ['State Jurisdiction', recyclerState],
                  ['Annual Capacity', capacityMt ? `${fmtKg(capacityMt)} MT/annum` : '—'],
                  ['Category', CAT_LABELS[listing.category]],
                ] as const).map(([label, value]) => (
                  <div key={label}>
                    <p className="font-data text-[10px] text-on-surface-variant uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="font-data text-sm text-on-surface font-medium">{value}</p>
                  </div>
                ))}
              </div>
              {/* Decorative facility strip */}
              <div className="mt-5 h-20 w-full bg-inverse-surface rounded overflow-hidden relative">
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: 'radial-gradient(#68dba9 1px, transparent 1px)', backgroundSize: '12px 12px' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-data text-[10px] text-primary-fixed uppercase tracking-[0.3em] opacity-60">
                    CPCB Certified Facility
                  </span>
                </div>
              </div>
            </div>

            {/* Escrow shield — desktop */}
            <div className="hidden md:block bg-inverse-surface text-white p-6 rounded-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-['Geist'] text-base font-semibold">Secure Escrow Protection</h3>
                </div>
                <p className="font-data text-[12px] leading-relaxed mb-3" style={{ color: '#bccac0' }}>
                  Credits are held in a secure regulatory escrow until the transfer certificate is verified by CPCB. Funds released only after secondary verification.
                </p>
                <div className="flex items-center gap-2 font-data text-[11px] uppercase tracking-widest" style={{ color: '#85f8c4' }}>
                  <Clock className="h-3.5 w-3.5" />
                  <span>48h Transfer Window Active</span>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-10">
                <ShieldCheck className="h-32 w-32" />
              </div>
            </div>
          </div>

          {/* ── Right: Order Form ── */}
          <div className="lg:col-span-7">
            <div className="bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg overflow-hidden shadow-sm">

              {/* Terminal header */}
              <div className="bg-surface-container-low border-b border-[--color-border-zinc] px-5 py-3 flex justify-between items-center">
                <span className="font-data text-[11px] font-bold uppercase tracking-widest text-on-surface">
                  Transaction Terminal
                </span>
                <span className="font-data text-[11px] text-on-surface-variant tabular-nums">{txId}</span>
              </div>

              <div className="p-6 space-y-6">

                {/* Qty + price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="qty-input" className="block font-data text-[11px] text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Purchase Quantity (KG)
                    </label>
                    <div className="relative">
                      <input
                        id="qty-input"
                        type="text"
                        inputMode="decimal"
                        value={qtyStr}
                        onChange={e => setQtyStr(e.target.value)}
                        className="w-full bg-white border border-zinc-300 rounded px-4 py-3 font-data text-base font-semibold text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-colors tabular-nums"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 font-data text-[11px] text-on-surface-variant">KG</span>
                    </div>
                    <p className="mt-1 font-data text-[10px] text-on-surface-variant flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      Max {fmtKg(listing.qty_kg)} kg available
                    </p>
                  </div>

                  <div>
                    <label className="block font-data text-[11px] text-on-surface-variant uppercase tracking-wider mb-1.5">
                      Unit Price
                    </label>
                    <div className="w-full bg-surface-container-low border border-[--color-border-zinc] rounded px-4 py-3 font-data text-base font-semibold text-on-surface-variant flex justify-between items-center cursor-not-allowed">
                      <span className="tabular-nums">{fmtRs(listing.price_per_kg)}</span>
                      <span className="text-sm font-normal">/kg</span>
                    </div>
                  </div>
                </div>

                {/* GSTIN */}
                <div>
                  <label className="block font-data text-[11px] text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Buyer GSTIN
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={brand?.gstin ?? '—'}
                      className="w-full bg-surface-container-low border border-[--color-border-zinc] rounded px-4 py-3 font-data text-sm text-on-surface-variant cursor-not-allowed"
                    />
                    <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                  </div>
                </div>

                {/* Order summary */}
                <div className="bg-surface-container-low border border-[--color-border-zinc] rounded-lg overflow-hidden">
                  <div className="px-5 py-2.5 border-b border-[--color-border-zinc] bg-surface-container">
                    <span className="font-data text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Order Summary
                    </span>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between font-data text-sm">
                      <span className="text-on-surface-variant">Credits Cost</span>
                      <span className="tabular-nums font-semibold">{fmtRs(creditsCost)}</span>
                    </div>
                    <div className="flex justify-between font-data text-sm">
                      <span className="text-on-surface-variant">Platform Fee (5%)</span>
                      <span className="tabular-nums font-semibold">{fmtRs(platformFee)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-[--color-border-zinc]">
                      <span className="font-['Geist'] font-semibold text-on-surface uppercase text-sm">Total Amount</span>
                      <span className="font-data text-lg font-bold text-primary tabular-nums">{fmtRs(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Error banner */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-error-container/30 border border-[--color-risk-red]/20 rounded text-[--color-risk-red] font-data text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Compliance checkbox */}
                <div
                  className={cn(
                    'flex gap-3 p-4 bg-surface-container-low rounded-lg border transition-colors',
                    shakeTerms ? 'border-[--color-risk-red] animate-shake' : 'border-[--color-border-zinc]'
                  )}
                >
                  <input
                    id="terms-desktop"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary border-outline cursor-pointer shrink-0"
                  />
                  <label htmlFor="terms-desktop" className="font-data text-[11px] text-on-surface-variant leading-relaxed cursor-pointer">
                    I confirm I have reviewed the CPCB Compliance Manual and this transaction follows EPR credit transfer guidelines.
                  </label>
                </div>

                {/* Desktop CTA */}
                <button
                  type="button"
                  disabled={ctaDisabled}
                  onClick={handleSubmit}
                  className={cn(
                    "w-full bg-primary text-on-primary py-4 rounded-lg hidden md:flex items-center justify-center gap-2 font-['Geist'] font-semibold text-base transition-all group",
                    ctaDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary-container active:scale-[0.98]'
                  )}
                >
                  {ctaContent}
                </button>
                <p className="hidden md:block text-center font-data text-[10px] text-on-surface-variant px-8">
                  Credits will be locked for 48 hours pending CPCB transfer verification.
                </p>

                {/* Mobile CTA */}
                <button
                  type="button"
                  disabled={ctaDisabled}
                  onClick={handleSubmit}
                  className={cn(
                    "w-full bg-primary text-on-primary py-4 rounded-lg md:hidden flex items-center justify-center gap-2 font-['Geist'] font-semibold text-base transition-all group",
                    ctaDisabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary-container active:scale-[0.98]'
                  )}
                >
                  {ctaContent}
                </button>
              </div>

              {/* Terminal footer — desktop only */}
              <div className="hidden md:flex border-t border-[--color-border-zinc] px-5 py-2 justify-between font-data text-[10px] text-on-surface-variant bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  TERMINAL ACTIVE
                </div>
                <div className="flex items-center gap-4">
                  <span>ENC: AES-256</span>
                  <span>SSL: TLS 1.3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
