'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck, Boxes, Layers, Recycle, PlusCircle,
  Radio, Inbox, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { Listing, Order } from '@/lib/db/types'
import type { PlasticCategory } from '@/lib/epr/constants'

// ─── Types + helpers ──────────────────────────────────────────────────────────

export type SellerVaultProps = {
  recyclerId: string
  companyName: string
  cpcbRegNo: string
  verified: boolean
  initialListings: Listing[]
  initialOrders: Order[]
}

const intl = new Intl.NumberFormat('en-IN')
const fmtKg = (n: number) => `${intl.format(Math.round(n))}`
const fmtMT = (kg: number) => (kg / 1000).toFixed(2)
const fmtRs = (n: number) => `₹${intl.format(Math.round(n))}`
const fmtRate = (n: number) => `₹${n.toFixed(2)}`

const CAT_ORDER: PlasticCategory[] = ['rigid', 'flexible', 'mlp']
const CAT_META: Record<PlasticCategory, { label: string; icon: typeof Boxes; tint: string }> = {
  rigid:    { label: 'Rigid Plastic',    icon: Boxes,   tint: 'text-primary' },
  flexible: { label: 'Flexible Plastic', icon: Recycle, tint: 'text-transition-amber' },
  mlp:      { label: 'MLP',              icon: Layers,  tint: 'text-secondary' },
}

const STATUS_BADGE: Record<Listing['status'], { label: string; cls: string }> = {
  active:  { label: 'Active',  cls: 'bg-success-emerald-light text-primary border border-primary/20' },
  partial: { label: 'Partial', cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
  sold:    { label: 'Sold',    cls: 'bg-zinc-100 text-zinc-500 border border-zinc-200' },
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SellerVault({
  recyclerId,
  companyName,
  cpcbRegNo,
  verified,
  initialListings,
  initialOrders,
}: SellerVaultProps) {
  const router = useRouter()

  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [flashId, setFlashId] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']> | null>(null)

  // ── Realtime: own orders (anon key — events arrive when RLS allows) ──
  useEffect(() => {
    let mounted = true
    const sb = getSupabaseBrowserClient(null)

    const channel = sb
      .channel(`seller-orders-${recyclerId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `recycler_id=eq.${recyclerId}` },
        (payload) => {
          if (!mounted) return
          const row = payload.new as Order
          setOrders(prev => (prev.some(o => o.id === row.id) ? prev : [row, ...prev]))
          setFlashId(row.id)
          setTimeout(() => setFlashId(null), 2500)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `recycler_id=eq.${recyclerId}` },
        (payload) => {
          if (!mounted) return
          const row = payload.new as Order
          setOrders(prev => prev.map(o => (o.id === row.id ? { ...o, ...row } : o)))
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      mounted = false
      sb.removeChannel(channel)
    }
  }, [recyclerId])

  // ── Derived data ──
  const incoming = useMemo(() => orders.filter(o => o.status === 'pending'), [orders])

  const metrics = useMemo(() => {
    const out = {} as Record<PlasticCategory, { listedKg: number; soldKg: number }>
    for (const cat of CAT_ORDER) out[cat] = { listedKg: 0, soldKg: 0 }
    for (const l of initialListings) out[l.category].listedKg += Number(l.qty_kg)
    for (const o of orders) {
      if (o.status === 'transferred') out[o.category].soldKg += Number(o.qty_kg)
    }
    return out
  }, [initialListings, orders])

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto">

      {/* ── Header ── */}
      <div className="flex justify-between items-end">
        <div>
          <p className="font-data text-[11px] text-outline uppercase tracking-wider">
            {companyName}
          </p>
          <h1 className="font-['Geist'] text-2xl font-semibold text-on-surface mt-0.5">
            Inventory Vault
          </h1>
        </div>
        {verified && (
          <span className="inline-flex items-center gap-1 bg-success-emerald-light text-primary px-2.5 py-1 rounded text-[10px] font-bold border border-primary/20">
            <ShieldCheck className="h-3 w-3" />
            CPCB VERIFIED
          </span>
        )}
      </div>

      {/* ── Metric tiles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CAT_ORDER.map(cat => {
          const { label, icon: Icon, tint } = CAT_META[cat]
          const { listedKg, soldKg } = metrics[cat]
          const pct = listedKg > 0 ? Math.min(100, Math.round((soldKg / listedKg) * 100)) : 0
          return (
            <div key={cat} className="bg-surface-container-lowest border border-[--color-border-zinc] p-5 rounded-lg">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-['Geist'] text-base font-semibold text-on-surface flex items-center gap-2">
                  <Icon className={cn('h-5 w-5', tint)} />
                  {label}
                </h3>
                <span className="font-data text-[10px] text-outline uppercase">{cat.toUpperCase()}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="font-data text-[11px] text-outline uppercase">Listed Total</span>
                  <span className="font-data text-base font-semibold text-on-surface">
                    {fmtKg(listedKg)} <span className="text-[10px] text-outline">kg</span>
                  </span>
                </div>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-1000', pct > 0 ? 'bg-primary' : 'bg-zinc-200')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-data text-[11px] text-outline uppercase">Sold / Transferred</span>
                  <span className={cn('font-data text-sm font-semibold', soldKg > 0 ? 'text-primary' : 'text-outline')}>
                    {fmtKg(soldKg)} <span className="text-[10px] text-outline">kg</span>
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Main grid: listings + incoming orders ── */}
      <div className="flex flex-col xl:grid xl:grid-cols-12 gap-6">

        {/* Incoming orders — first on mobile, right column on desktop */}
        <aside className="order-first xl:order-last xl:col-span-4 space-y-4">
          <div className="bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-[--color-border-zinc] flex items-center justify-between">
              <h2 className="font-['Geist'] text-base font-semibold flex items-center gap-2">
                <span className={cn('w-2 h-2 rounded-full', incoming.length > 0 ? 'bg-risk-red animate-pulse' : 'bg-outline')} />
                Incoming Orders
              </h2>
              <span className="flex items-center gap-1 bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full text-[10px] font-bold">
                <Radio className="h-2.5 w-2.5" />
                LIVE
              </span>
            </div>

            <div className="p-4 space-y-3 max-h-[640px] overflow-y-auto">
              {incoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <Inbox className="h-8 w-8 text-outline mb-3" />
                  <p className="text-sm text-on-surface-variant">No pending orders</p>
                  <p className="font-data text-[11px] text-outline mt-1">New trade requests appear here live.</p>
                </div>
              ) : (
                incoming.map(order => (
                  <div
                    key={order.id}
                    className={cn(
                      'border rounded-lg p-4 space-y-3 bg-surface-container-lowest transition-all',
                      flashId === order.id
                        ? 'border-primary ring-2 ring-primary/30 animate-pulse'
                        : 'border-[--color-border-zinc] hover:border-primary',
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p className="font-data text-sm font-medium text-on-surface truncate">
                          {order.buyer_company_name ?? 'Verified Buyer'}
                        </p>
                        <p className="font-data text-[10px] text-outline uppercase truncate">
                          GSTIN: {order.buyer_gstin ?? '—'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-data text-base font-semibold text-primary">{fmtRs(order.total)}</p>
                        <p className="font-data text-[10px] text-outline uppercase">Total Value</p>
                      </div>
                    </div>

                    <div className="bg-surface-container-low p-2 rounded flex justify-between items-center border border-[--color-border-zinc]">
                      <span className="text-sm text-on-surface">
                        {fmtMT(order.qty_kg)} MT {CAT_META[order.category].label}
                      </span>
                      <span className="font-data text-[11px] text-on-surface-variant">@ {fmtRate(order.price_per_kg)}/kg</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push(`/seller/orders/${order.id}`)}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-2 rounded font-data text-sm font-semibold hover:bg-primary-container active:scale-95 transition-all"
                    >
                      Review &amp; Respond
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Active listings */}
        <section className="xl:col-span-8 bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[--color-border-zinc] flex justify-between items-center bg-surface-container-low/40">
            <h2 className="font-['Geist'] text-base font-semibold">Active Inventory Vault</h2>
            <button
              type="button"
              onClick={() => router.push('/seller/listings/new')}
              className="hidden sm:flex items-center gap-1.5 text-primary font-data text-sm font-semibold hover:underline"
            >
              <PlusCircle className="h-4 w-4" />
              New Listing
            </button>
          </div>

          {initialListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6">
              <Boxes className="h-10 w-10 text-outline mb-4" />
              <h3 className="font-['Geist'] text-lg font-semibold text-on-surface mb-1">No listings yet</h3>
              <p className="text-sm text-on-surface-variant max-w-xs mb-6">
                List your recycled credits to start receiving orders from compliance buyers.
              </p>
              <button
                type="button"
                onClick={() => router.push('/seller/listings/new')}
                className="flex items-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-lg font-data text-sm font-semibold hover:bg-primary-container transition-colors"
              >
                <PlusCircle className="h-4 w-4" />
                Create First Listing
              </button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-low border-b border-[--color-border-zinc]">
                    <tr>
                      <th className="px-5 py-3 font-data text-[10px] text-outline uppercase tracking-wider">Listing ID</th>
                      <th className="px-5 py-3 font-data text-[10px] text-outline uppercase tracking-wider">Category</th>
                      <th className="px-5 py-3 font-data text-[10px] text-outline uppercase tracking-wider text-right">Qty (MT)</th>
                      <th className="px-5 py-3 font-data text-[10px] text-outline uppercase tracking-wider text-right">Price / kg</th>
                      <th className="px-5 py-3 font-data text-[10px] text-outline uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {initialListings.map(l => {
                      const badge = STATUS_BADGE[l.status]
                      const muted = l.status === 'sold'
                      return (
                        <tr key={l.id} className={cn('hover:bg-surface-container-low/40 transition-colors', muted && 'opacity-60')}>
                          <td className="px-5 py-4 font-data text-sm">#{l.id.slice(0, 8).toUpperCase()}</td>
                          <td className="px-5 py-4 text-sm">{CAT_META[l.category].label}</td>
                          <td className="px-5 py-4 font-data text-sm text-right tabular-nums">{fmtMT(l.qty_kg)}</td>
                          <td className="px-5 py-4 font-data text-sm text-right tabular-nums">{fmtRate(l.price_per_kg)}</td>
                          <td className="px-5 py-4">
                            <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', badge.cls)}>
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-zinc-100">
                {initialListings.map(l => {
                  const badge = STATUS_BADGE[l.status]
                  return (
                    <div key={l.id} className={cn('p-4 space-y-3', l.status === 'sold' && 'opacity-60')}>
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-bold text-on-surface">{CAT_META[l.category].label}</h4>
                          <p className="font-data text-[10px] text-outline uppercase">#{l.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase', badge.cls)}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-[--color-border-zinc]/50 pt-3">
                        <div className="flex flex-col">
                          <span className="font-data text-[10px] text-outline uppercase">Available</span>
                          <span className="font-data text-sm">{fmtMT(l.qty_kg)} MT</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-data text-[10px] text-outline uppercase">Unit Price</span>
                          <span className="font-data text-sm">{fmtRate(l.price_per_kg)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
