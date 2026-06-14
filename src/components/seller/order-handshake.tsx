'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Timer, ShieldCheck, Copy, Check, CheckCheck, XCircle,
  AlertTriangle, Loader2, ArrowLeft, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { respondToOrder } from '@/lib/actions/seller'
import type { PlasticCategory } from '@/lib/epr/constants'

// ─── Types + helpers ──────────────────────────────────────────────────────────

export type OrderHandshakeProps = {
  order: {
    id: string
    category: PlasticCategory
    qtyKg: number
    pricePerKg: number
    creditsCost: number
    platformFee: number
    total: number
    buyerGstin: string | null
    buyerCompanyName: string | null
    status: string
    expiresAt: string
  }
}

const intl = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtRs = (n: number) => `₹${intl.format(n)}`
const fmtKg = (n: number) => `${new Intl.NumberFormat('en-IN').format(Math.round(n))} KG`

const CAT_LABELS: Record<PlasticCategory, string> = {
  rigid: 'Rigid Plastic', flexible: 'Flexible Plastic', mlp: 'Multi-Layered Plastic',
}

const URGENT_MS = 12 * 60 * 60 * 1000

function useCountdown(expiresAt: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now)
  const h = Math.floor(remaining / 3_600_000)
  const m = Math.floor((remaining % 3_600_000) / 60_000)
  const s = Math.floor((remaining % 60_000) / 1000)
  return { remaining, expired: remaining <= 0, urgent: remaining > 0 && remaining < URGENT_MS, h, m, s }
}

const pad = (n: number) => n.toString().padStart(2, '0')

const GUIDE = [
  { t: 'Log in to the CPCB EPR Portal', d: "Navigate to the 'Transfer EPR Credits' section in your official dashboard." },
  { t: 'Enter the buyer’s GSTIN', d: 'Use the buyer GSTIN below to initiate a manual volume transfer.' },
  { t: 'Confirm the transfer here', d: 'Click “Accept & Mark as Transferred” to finalise the trade and release escrow.' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function OrderHandshake({ order }: OrderHandshakeProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(order.status)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { expired, urgent, h, m, s } = useCountdown(order.expiresAt)

  const netPayout = order.creditsCost - order.platformFee
  const isPendingOrder = status === 'pending' && !expired

  function copyGstin() {
    if (!order.buyerGstin) return
    navigator.clipboard?.writeText(order.buyerGstin)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function respond(action: 'accept' | 'decline') {
    setError(null)
    startTransition(async () => {
      const result = await respondToOrder({ orderId: order.id, action })
      if (result.ok) {
        setStatus(result.status)
        if (typeof pendo !== 'undefined') {
          if (action === 'accept') {
            pendo.track('order_accepted', {
              order_id: order.id,
              category: order.category,
              qty_kg: order.qtyKg,
              price_per_kg: order.pricePerKg,
              total: order.total,
              net_payout: netPayout,
              buyer_company_name: order.buyerCompanyName ?? '',
            })
          } else {
            pendo.track('order_declined', {
              order_id: order.id,
              category: order.category,
              qty_kg: order.qtyKg,
              price_per_kg: order.pricePerKg,
              total: order.total,
              buyer_company_name: order.buyerCompanyName ?? '',
            })
          }
        }
        toast.success(action === 'accept' ? 'Order accepted — escrow released.' : 'Order declined.')
        setTimeout(() => router.push('/seller/vault'), 1400)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => router.push('/seller/vault')}
            className="flex items-center gap-1.5 font-data text-[11px] text-on-surface-variant uppercase tracking-wider hover:text-primary transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Incoming Orders
          </button>
          <h1 className="font-['Geist'] text-2xl font-bold text-on-surface">Order Handshake</h1>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-success-emerald-light text-primary border border-primary/30 rounded-full font-data text-[11px] uppercase tracking-wider">
          <ShieldCheck className="h-3.5 w-3.5" />
          CPCB Verified Credit
        </span>
      </div>

      {/* ── Countdown ── */}
      <div className="bg-surface-container-lowest border border-[--color-border-zinc] p-5 lg:p-6 rounded-lg shadow-sm flex items-center justify-between overflow-hidden relative">
        <div className={cn('absolute left-0 top-0 bottom-0 w-1.5', urgent ? 'bg-[--color-risk-red] animate-pulse' : expired ? 'bg-outline' : 'bg-transition-amber')} />
        <div className="flex items-center gap-4 lg:gap-6 pl-3">
          <div className={cn('w-14 h-14 rounded-full flex items-center justify-center shrink-0',
            urgent ? 'bg-error-container text-[--color-risk-red]' : 'bg-surface-container text-transition-amber')}>
            <Timer className="h-7 w-7" />
          </div>
          <div>
            <p className="font-data text-[11px] text-on-surface-variant uppercase tracking-widest">
              {expired ? 'Acceptance Window Closed' : 'Time Remaining to Accept'}
            </p>
            <div className="flex items-baseline gap-2">
              <span className={cn('font-data text-3xl lg:text-4xl font-semibold tabular-nums tracking-tight',
                expired ? 'text-outline' : urgent ? 'text-[--color-risk-red]' : 'text-on-surface')}>
                {expired ? 'EXPIRED' : `${pad(h)}:${pad(m)}:${pad(s)}`}
              </span>
              {urgent && !expired && (
                <span className="bg-[--color-risk-red] text-white px-2 py-0.5 rounded text-[10px] font-bold">URGENT</span>
              )}
            </div>
          </div>
        </div>
        <p className="hidden lg:block text-right text-sm text-on-surface-variant max-w-[260px]">
          Orders not accepted within 48 hours are automatically cancelled by the clearing house.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left: dossier ── */}
        <div className="lg:col-span-7 space-y-6">
          <section className="bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg overflow-hidden">
            <div className="bg-surface-container-low px-6 py-3 border-b border-[--color-border-zinc] flex justify-between items-center">
              <h2 className="font-['Geist'] text-base font-semibold">Transaction Dossier</h2>
              <span className="font-data text-[11px] text-on-surface-variant">#{order.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="p-6">
              <table className="w-full text-left">
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="py-3 text-sm text-on-surface-variant">Ordered Volume</td>
                    <td className="py-3 text-right font-data text-base font-semibold tabular-nums">{fmtKg(order.qtyKg)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm text-on-surface-variant">Category</td>
                    <td className="py-3 text-right font-data text-sm">{CAT_LABELS[order.category]}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm text-on-surface-variant">Unit Price</td>
                    <td className="py-3 text-right font-data text-sm tabular-nums">{fmtRs(order.pricePerKg)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm text-on-surface-variant">Gross Value</td>
                    <td className="py-3 text-right font-data text-sm tabular-nums">{fmtRs(order.creditsCost)}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm text-tertiary">Platform Fee (5%)</td>
                    <td className="py-3 text-right font-data text-sm text-tertiary tabular-nums">− {fmtRs(order.platformFee)}</td>
                  </tr>
                  <tr className="bg-success-emerald-light/30">
                    <td className="py-5 px-4 text-primary font-bold font-['Geist']">Net Payout to You</td>
                    <td className="py-5 px-4 text-right font-data text-xl font-bold text-primary tabular-nums">{fmtRs(netPayout)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-6 p-4 bg-surface-container-low border border-[--color-border-zinc] rounded grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-on-surface-variant mb-1 uppercase font-data">Buyer Entity</p>
                  <p className="font-bold text-on-surface">{order.buyerCompanyName ?? 'Verified Buyer'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-on-surface-variant mb-1 uppercase font-data">Buyer GSTIN</p>
                  <div className="flex items-center gap-2">
                    <code className="font-data text-sm text-secondary tracking-wide">{order.buyerGstin ?? '—'}</code>
                    {order.buyerGstin && (
                      <button
                        type="button"
                        onClick={copyGstin}
                        className="text-on-surface-variant hover:text-primary transition-colors active:scale-95"
                        aria-label="Copy GSTIN"
                      >
                        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Right: CPCB guide + actions ── */}
        <div className="lg:col-span-5">
          <section className="bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg overflow-hidden flex flex-col h-full">
            <div className="bg-surface-container-low px-6 py-3 border-b border-[--color-border-zinc] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <h2 className="font-['Geist'] text-base font-semibold">CPCB Transfer Guide</h2>
            </div>

            <div className="p-6 flex-1 space-y-5">
              {GUIDE.map((step, i) => (
                <div key={i} className="relative pl-10">
                  <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-data text-sm font-bold">
                    {i + 1}
                  </div>
                  {i < GUIDE.length - 1 && <div className="absolute left-4 top-8 bottom-[-20px] w-px bg-zinc-200" />}
                  <h3 className="font-bold text-on-surface text-sm mb-0.5">{step.t}</h3>
                  <p className="text-[13px] text-on-surface-variant leading-snug">{step.d}</p>
                </div>
              ))}

              <div className="flex items-start gap-3 p-4 bg-tertiary-container/10 border border-tertiary-container/30 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-tertiary shrink-0 mt-0.5" />
                <p className="text-[12px] text-tertiary font-medium leading-snug">
                  Falsely marking a transfer may result in account suspension and loss of compliance rating.
                </p>
              </div>
            </div>

            {/* Actions / status */}
            <div className="p-6 bg-surface-container-low border-t border-[--color-border-zinc]">
              {error && (
                <div className="mb-3 flex items-center gap-2 p-3 bg-error-container/30 border border-[--color-risk-red]/20 rounded text-[--color-risk-red] font-data text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {status === 'transferred' ? (
                <StatusBanner tone="ok" icon={<CheckCircle2 className="h-5 w-5" />} title="Credits Transferred" sub="Escrow released. Certificate issued to the buyer." onBack={() => router.push('/seller/vault')} />
              ) : status === 'declined' ? (
                <StatusBanner tone="muted" icon={<XCircle className="h-5 w-5" />} title="Order Declined" sub="This trade request was declined." onBack={() => router.push('/seller/vault')} />
              ) : expired ? (
                <StatusBanner tone="muted" icon={<Timer className="h-5 w-5" />} title="Acceptance Window Closed" sub="This order expired and can no longer be accepted." onBack={() => router.push('/seller/vault')} />
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    disabled={isPending || !isPendingOrder}
                    onClick={() => respond('accept')}
                    className="w-full py-4 bg-primary text-on-primary rounded-lg font-['Geist'] font-semibold flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCheck className="h-5 w-5" />}
                    Accept &amp; Mark as Transferred
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => respond('decline')}
                    className="w-full py-3 bg-surface-container-lowest border border-[--color-risk-red]/40 text-[--color-risk-red] rounded-lg font-medium hover:bg-error-container/20 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Decline Order
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function StatusBanner({
  tone, icon, title, sub, onBack,
}: {
  tone: 'ok' | 'muted'
  icon: React.ReactNode
  title: string
  sub: string
  onBack: () => void
}) {
  return (
    <div className="space-y-3">
      <div className={cn('flex items-center gap-3 p-4 rounded-lg border',
        tone === 'ok' ? 'bg-success-emerald-light/40 border-primary/30 text-primary' : 'bg-surface-container border-[--color-border-zinc] text-on-surface-variant')}>
        {icon}
        <div>
          <p className="font-['Geist'] font-semibold text-sm">{title}</p>
          <p className="text-[12px] opacity-90">{sub}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onBack}
        className="w-full py-3 bg-surface-container-lowest border border-[--color-border-zinc] text-on-surface rounded-lg font-medium hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Vault
      </button>
    </div>
  )
}
