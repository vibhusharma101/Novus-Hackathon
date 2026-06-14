'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Boxes, Layers, Recycle, CheckCircle2, TrendingUp, TrendingDown,
  LineChart, ShieldCheck, MapPin, Package, Rocket, Loader2, AlertTriangle, Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createListing } from '@/lib/actions/seller'
import { PLATFORM_FEE_PCT } from '@/lib/epr/constants'
import { LISTING_MIN_KG, LISTING_MAX_KG } from '@/lib/validators/listing'
import type { PlasticCategory } from '@/lib/epr/constants'
import type { MarketStat } from '@/app/seller/listings/new/page'

// ─── Meta ─────────────────────────────────────────────────────────────────────

const intl = new Intl.NumberFormat('en-IN')
const fmtRs = (n: number) => `₹${intl.format(Math.round(n))}`
const fmtRate = (n: number) => `₹${n.toFixed(2)}`

const CATS: { id: PlasticCategory; label: string; cat: string; icon: typeof Boxes; desc: string }[] = [
  { id: 'rigid',    label: 'Rigid Plastic',    cat: 'Category I',   icon: Boxes,   desc: 'HDPE, PP, and other rigid plastic packaging.' },
  { id: 'flexible', label: 'Flexible Plastic', cat: 'Category II',  icon: Recycle, desc: 'LDPE, LLDPE, and single-layer flexible packaging.' },
  { id: 'mlp',      label: 'MLP',              cat: 'Category III', icon: Layers,  desc: 'Multi-layered plastics with a non-plastic layer.' },
]

export type CreateListingFormProps = {
  companyName: string
  state: string
  verified: boolean
  marketStats: Record<PlasticCategory, MarketStat>
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateListingForm({ companyName, state, verified, marketStats }: CreateListingFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [category, setCategory] = useState<PlasticCategory>('rigid')
  const [qtyMt, setQtyMt] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)

  // AI pricing copilot
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTip, setAiTip] = useState<{ reasoning: string; sell_speed: 'fast' | 'moderate' | 'slow' } | null>(null)

  async function suggestPrice() {
    if (aiLoading) return
    setAiLoading(true)
    setAiTip(null)
    try {
      const res = await fetch('/api/suggest-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, qty_kg: qtyKg }),
      })
      if (!res.ok) throw new Error('failed')
      const data = (await res.json()) as { suggested_price_per_kg: number; sell_speed: 'fast' | 'moderate' | 'slow'; reasoning: string }
      setPrice(String(data.suggested_price_per_kg))
      setAiTip({ reasoning: data.reasoning, sell_speed: data.sell_speed })
      if (typeof pendo !== 'undefined') {
        pendo.track('ai_price_suggested', {
          category: category,
          qty_kg: qtyKg,
          suggested_price_per_kg: data.suggested_price_per_kg,
          sell_speed: data.sell_speed,
          reasoning: data.reasoning?.substring(0, 200),
        })
      }
    } catch {
      setError('Could not get an AI price suggestion. Please set a price manually.')
    } finally {
      setAiLoading(false)
    }
  }

  const qtyKg = useMemo(() => {
    const n = parseFloat(qtyMt)
    return Number.isFinite(n) && n > 0 ? n * 1000 : 0
  }, [qtyMt])

  const priceNum = useMemo(() => {
    const n = parseFloat(price)
    return Number.isFinite(n) && n > 0 ? n : 0
  }, [price])

  const gross = qtyKg * priceNum
  const fee = gross * PLATFORM_FEE_PCT
  const net = gross - fee

  const stat = marketStats[category]

  // ── Pricing assistant verdict ──
  const verdict = useMemo(() => {
    if (priceNum <= 0) {
      return { tone: 'neutral' as const, tag: 'AWAITING PRICE', msg: 'Enter a unit price to see how your listing ranks against the live market.' }
    }
    if (priceNum <= stat.floor) {
      return {
        tone: 'best' as const,
        tag: 'CHEAPEST',
        msg: `Setting your price at ${fmtRate(priceNum)}/kg positions your inventory as the most competitive listing in your state region. Projected time-to-sell: Under 4 hours.`,
      }
    }
    if (priceNum <= stat.avg) {
      return {
        tone: 'good' as const,
        tag: 'COMPETITIVE',
        msg: `Setting your price at ${fmtRate(priceNum)}/kg positions you competitively below the ${fmtRate(stat.avg)}/kg market average. Projected time-to-sell: Under 12 hours.`,
      }
    }
    return {
      tone: 'high' as const,
      tag: 'ABOVE MARKET',
      msg: `Above the ${fmtRate(stat.avg)}/kg average — consider pricing closer to ${fmtRate(stat.floor)}/kg for faster fulfilment.`,
    }
  }, [priceNum, stat, category])

  const deltaPct = stat.avg > 0 && priceNum > 0 ? ((priceNum - stat.avg) / stat.avg) * 100 : 0

  function handlePublish() {
    setError(null)
    if (qtyKg < LISTING_MIN_KG || qtyKg > LISTING_MAX_KG) {
      setError('Quantity must be between 5 MT and 500 MT.')
      return
    }
    if (priceNum <= 0) {
      setError('Enter a unit price greater than 0.')
      return
    }
    startTransition(async () => {
      const result = await createListing({ category, qty_kg: qtyKg, price_per_kg: priceNum })
      if (result.ok) {
        if (typeof pendo !== 'undefined') {
          pendo.track('listing_published', {
            category: category,
            qty_kg: qtyKg,
            price_per_kg: priceNum,
            gross_value: gross,
            net_payout: net,
            used_ai_pricing: aiTip !== null,
          })
        }
        toast.success('Listing published to the live market.')
        router.push('/seller/vault')
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="max-w-5xl mx-auto pb-40 lg:pb-28">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-2 font-data text-[11px] text-on-surface-variant uppercase tracking-wider mb-2">
          <span>Inventory</span>
          <span>›</span>
          <span className="text-primary font-bold">New Listing</span>
        </div>
        <h1 className="font-['Geist'] text-2xl lg:text-3xl font-bold text-on-surface">Create New Listing</h1>
        <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
          Publish verified plastic credits to the live market. Pricing is benchmarked against current
          listings and CPCB cost guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: form ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Category */}
          <div className="bg-surface-container-lowest border border-[--color-border-zinc] p-6 rounded-lg">
            <h3 className="font-['Geist'] text-base font-semibold mb-5 flex items-center gap-2">
              <span className="text-primary">01.</span> Select Plastic Category
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CATS.map(({ id, label, cat, icon: Icon, desc }) => {
                const selected = category === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCategory(id)}
                    className={cn(
                      'relative h-full text-left border rounded-lg p-4 transition-all',
                      selected
                        ? 'border-primary bg-primary-container/5 ring-1 ring-primary'
                        : 'border-[--color-border-zinc] hover:border-primary',
                    )}
                  >
                    <Icon className={cn('h-6 w-6 mb-3', selected ? 'text-primary' : 'text-on-surface-variant')} />
                    <div className="font-['Geist'] text-sm font-bold mb-0.5">{cat}</div>
                    <div className="font-data text-[10px] text-on-surface-variant uppercase mb-2">{label}</div>
                    <p className="text-[11px] text-on-surface-variant leading-snug">{desc}</p>
                    {selected && (
                      <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Volume & Pricing */}
          <div className="bg-surface-container-lowest border border-[--color-border-zinc] p-6 rounded-lg">
            <h3 className="font-['Geist'] text-base font-semibold mb-5 flex items-center gap-2">
              <span className="text-primary">02.</span> Volume &amp; Pricing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="qty" className="font-data text-[11px] text-on-surface-variant uppercase flex justify-between">
                  Available Quantity <span className="text-primary font-bold">Metric Tons</span>
                </label>
                <div className="relative">
                  <input
                    id="qty"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={qtyMt}
                    onChange={e => setQtyMt(e.target.value)}
                    className="w-full bg-surface-container-low border border-[--color-border-zinc] rounded py-3 px-4 font-data text-base focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all tabular-nums"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-data text-[11px] text-on-surface-variant pointer-events-none">MT</span>
                </div>
                <p className="text-[11px] text-on-surface-variant">Min: 5 MT · Max: 500 MT</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="price" className="font-data text-[11px] text-on-surface-variant uppercase flex justify-between">
                  Unit Price <span className="text-primary font-bold">Per Kilogram</span>
                </label>
                <div className="relative">
                  <input
                    id="price"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder={stat.avg.toFixed(2)}
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full bg-surface-container-low border border-[--color-border-zinc] rounded py-3 px-4 font-data text-base focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all tabular-nums"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-data text-[11px] text-on-surface-variant pointer-events-none">₹/kg</span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Market average: {fmtRate(stat.avg)}/kg
                  {stat.count === 0 && <span className="italic"> (CPCB guidance — no active listings yet)</span>}
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-5 flex items-center gap-2 p-3 bg-error-container/30 border border-[--color-risk-red]/20 rounded text-[--color-risk-red] font-data text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: market insights ── */}
        <aside className="space-y-6">
          <div className="bg-surface-container-lowest border border-[--color-border-zinc] p-6 rounded-lg lg:sticky lg:top-4">
            <h4 className="font-['Geist'] text-sm uppercase tracking-wider mb-5 text-on-surface-variant border-b border-[--color-border-zinc] pb-2 flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Market Insights
            </h4>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-end mb-1.5">
                  <span className="font-data text-[11px] text-on-surface-variant">Live Market Floor</span>
                  <span className="font-data text-base font-semibold text-primary">
                    {fmtRate(stat.floor)}<span className="text-[11px] text-on-surface-variant font-normal">/kg</span>
                  </span>
                </div>
                <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500',
                      verdict.tone === 'high' ? 'bg-transition-amber' : 'bg-primary')}
                    style={{ width: stat.avg > 0 && priceNum > 0 ? `${Math.min(100, (priceNum / (stat.avg * 1.5)) * 100)}%` : '0%' }}
                  />
                </div>
              </div>

              {/* AI pricing copilot */}
              <div>
                <button
                  type="button"
                  onClick={suggestPrice}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center gap-2 border border-secondary/40 text-secondary bg-secondary/[0.04] py-2 rounded-md font-data text-sm font-semibold hover:bg-secondary/[0.08] transition-colors disabled:opacity-50 active:scale-[0.98]"
                >
                  {aiLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing market…</>
                    : <><Sparkles className="h-4 w-4" /> Suggest a price with AI</>}
                </button>
                {aiTip && (
                  <div className="mt-2 rounded-md bg-secondary/[0.04] border border-secondary/20 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-secondary" />
                      <span className="font-data text-[10px] uppercase tracking-wide text-secondary font-bold">AI suggestion</span>
                      <span className={cn('ml-auto font-data text-[9px] uppercase px-1.5 py-0.5 rounded-full font-bold',
                        aiTip.sell_speed === 'fast' ? 'bg-primary text-on-primary' :
                        aiTip.sell_speed === 'moderate' ? 'bg-secondary text-on-secondary' :
                        'bg-transition-amber text-white')}>
                        {aiTip.sell_speed} sell
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">{aiTip.reasoning}</p>
                  </div>
                )}
              </div>

              {/* Verdict */}
              <div
                className={cn('p-4 rounded-lg border',
                  verdict.tone === 'best' ? 'bg-success-emerald-light/40 border-primary/30' :
                  verdict.tone === 'good' ? 'bg-success-emerald-light/20 border-primary/20' :
                  verdict.tone === 'high' ? 'bg-amber-50 border-amber-200' :
                  'bg-surface-container-low border-[--color-border-zinc]',
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('font-data text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full flex items-center gap-1',
                    verdict.tone === 'high' ? 'bg-transition-amber text-white' :
                    verdict.tone === 'neutral' ? 'bg-zinc-200 text-on-surface-variant' :
                    'bg-primary text-on-primary')}>
                    {verdict.tone === 'high' ? <TrendingUp className="h-3 w-3" /> : verdict.tone !== 'neutral' ? <TrendingDown className="h-3 w-3" /> : null}
                    {verdict.tag}
                  </span>
                  {priceNum > 0 && (
                    <span className={cn('font-data text-sm font-semibold', deltaPct <= 0 ? 'text-primary' : 'text-transition-amber')}>
                      {deltaPct > 0 ? '+' : ''}{deltaPct.toFixed(1)}%
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">{verdict.msg}</p>
              </div>

              {/* Payout */}
              <div className="bg-surface-container-low border border-[--color-border-zinc] p-4 rounded space-y-2.5">
                <div className="flex justify-between font-data text-[11px]">
                  <span className="text-on-surface-variant">Total Listing Value</span>
                  <span className="font-semibold tabular-nums">{fmtRs(gross)}</span>
                </div>
                <div className="flex justify-between font-data text-[11px]">
                  <span className="text-on-surface-variant">Platform Fee (5%)</span>
                  <span className="tabular-nums">−{fmtRs(fee)}</span>
                </div>
                <div className="border-t border-[--color-border-zinc] pt-2.5 flex justify-between font-data text-sm">
                  <span className="font-bold">Net Payout</span>
                  <span className="text-primary font-bold tabular-nums">{fmtRs(net)}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Bottom strip: buyer preview + publish ──
          Sits above the layout's mobile bottom-nav (h-16) on small screens; at
          the viewport bottom on desktop where there is no mobile nav. ── */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 lg:left-64 bg-surface-container-lowest border-t border-[--color-border-zinc] z-30">
        <div className="max-w-5xl mx-auto px-4 lg:px-8 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">

          {/* Buyer view preview */}
          <div className="hidden md:flex flex-col gap-1 min-w-0">
            <span className="font-data text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Buyer View Preview</span>
            <div className="flex items-center gap-3 bg-surface-container-low border border-[--color-border-zinc] p-2.5 rounded-lg max-w-lg">
              <div className="h-10 w-10 bg-primary-container/10 border border-primary/20 rounded flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-3 mb-1">
                  <span className="font-['Geist'] text-xs font-bold uppercase truncate">
                    {CATS.find(c => c.id === category)?.cat} {CATS.find(c => c.id === category)?.label}
                  </span>
                  <span className="font-data text-xs text-primary font-bold shrink-0">{priceNum > 0 ? `${fmtRate(priceNum)}/kg` : '—'}</span>
                </div>
                <div className="flex items-center gap-3 font-data text-[10px] text-on-surface-variant">
                  <span className="flex items-center gap-1"><Boxes className="h-3 w-3" />{qtyKg > 0 ? `${(qtyKg / 1000).toFixed(2)} MT` : '— MT'}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{state}</span>
                  {verified && <span className="flex items-center gap-1 text-primary font-bold"><ShieldCheck className="h-3 w-3" />CPCB</span>}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            disabled={isPending}
            onClick={handlePublish}
            className="w-full md:w-auto px-8 py-3.5 bg-primary text-on-primary font-['Geist'] font-semibold text-sm rounded-lg hover:bg-primary-container transition-all flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
          >
            {isPending ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Publishing…</>
            ) : (
              <>Confirm &amp; Publish to Market <Rocket className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
