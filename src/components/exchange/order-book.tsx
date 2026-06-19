'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
  ShieldCheck, ArrowUpDown, ChevronLeft, ChevronRight,
  SlidersHorizontal, X, SearchX, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { Listing, PublicRecycler } from '@/lib/db/types'
import type { PlasticCategory } from '@/lib/epr/constants'
import { INDIAN_STATES } from '@/lib/validators/buyer'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ListingWithRecycler = Listing & { recycler: PublicRecycler }

export type DeficitRow = {
  category: PlasticCategory
  liability_kg: number
}

const intl = new Intl.NumberFormat('en-IN')
const fmtKg = (n: number) => `${intl.format(Math.round(n))} kg`
const fmtRs = (n: number) => `₹${intl.format(Math.round(n))}`

const CAT_LABELS: Record<PlasticCategory, { label: string; cat: string }> = {
  rigid:    { label: 'Rigid',    cat: 'Cat I'   },
  flexible: { label: 'Flexible', cat: 'Cat II'  },
  mlp:      { label: 'MLP',      cat: 'Cat III' },
}
const CAT_ORDER: PlasticCategory[] = ['rigid', 'flexible', 'mlp']

const CAT_COLORS: Record<PlasticCategory, { bg: string; text: string; border: string }> = {
  rigid:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300' },
  flexible: { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-300'   },
  mlp:      { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-300'    },
}

const fmtMt = (kg: number) => `${(kg / 1000).toFixed(2)} MT`

// ─── Deficit cards ────────────────────────────────────────────────────────────

function DeficitCards({ liabilities }: { liabilities: DeficitRow[] }) {
  const byCategory = Object.fromEntries(
    liabilities.map(r => [r.category, r.liability_kg])
  ) as Partial<Record<PlasticCategory, number>>

  return (
    <div className="px-6 py-5 border-b border-[--color-border-zinc] bg-background">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-['Geist'] font-semibold text-on-surface">
          Target Fulfillment Deficit
        </h1>
        <div className="flex items-center gap-2 font-data text-[11px] text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          LIVE MARKET DATA
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CAT_ORDER.map(cat => {
          const liabilityKg = byCategory[cat] ?? 0
          const securedKg = 0
          const securedPct = liabilityKg > 0 ? Math.round((securedKg / liabilityKg) * 100) : 0
          const remainingPct = 100 - securedPct
          return (
            <div
              key={cat}
              className="bg-surface-container-lowest border border-[--color-border-zinc] p-4 rounded-lg hover:border-primary transition-colors shadow-sm"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-data text-[10px] text-on-surface-variant uppercase tracking-widest">
                  Category: {CAT_LABELS[cat].cat}
                </span>
                <span className="font-['Geist'] text-[18px] font-semibold text-primary">
                  {CAT_LABELS[cat].label}
                </span>
              </div>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="font-data text-base font-semibold text-on-surface">
                    {liabilityKg > 0 ? fmtKg(liabilityKg) : '—'}
                  </p>
                  <p className="text-xs text-on-surface-variant">Remaining Deficit</p>
                </div>
                {liabilityKg > 0 && (
                  <span className="font-data text-[11px] text-[--color-risk-red] bg-error-container/20 px-2 py-0.5 rounded">
                    {remainingPct}% REMAINING
                  </span>
                )}
              </div>
              <div className="h-1 w-full bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-1000"
                  style={{ width: `${securedPct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── CPCB badge ───────────────────────────────────────────────────────────────

function CpcbBadge() {
  return (
    <div className="flex items-center gap-1 border border-primary/20 bg-success-emerald-light/30 px-1.5 py-0.5 rounded shrink-0">
      <ShieldCheck className="h-3 w-3 text-primary" strokeWidth={2.5} />
      <span className="font-data text-[9px] text-primary font-bold tracking-tighter">CPCB VERIFIED</span>
    </div>
  )
}

// ─── Category token badge ─────────────────────────────────────────────────────

function TokenBadge({ category }: { category: PlasticCategory }) {
  const c = CAT_COLORS[category]
  const abbr = category === 'rigid' ? 'RIG' : category === 'flexible' ? 'FLX' : 'MLP'
  return (
    <div className={cn('relative flex items-center justify-center w-10 h-10 rounded-lg border-2 shrink-0', c.bg, c.border)}>
      <span className={cn('font-data text-[9px] font-bold tracking-widest', c.text)}>{abbr}</span>
      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-px border border-white">
        <ShieldCheck className={cn('h-3 w-3', c.text)} strokeWidth={2.5} />
      </div>
    </div>
  )
}

// ─── Main order book ──────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export function OrderBook({
  initialListings,
  liabilities,
}: {
  initialListings: ListingWithRecycler[]
  liabilities: DeficitRow[]
}) {
  const router = useRouter()
  const { getToken } = useAuth()

  const [listings, setListings] = useState<ListingWithRecycler[]>(initialListings)
  const [catFilter, setCatFilter] = useState<PlasticCategory | 'all'>('all')
  const [creditFilter, setCreditFilter] = useState<'all' | 'recycling' | 'eol'>('all')
  const [stateFilter, setStateFilter] = useState('all')
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'qty_desc' | 'latest'>('price_asc')
  const [page, setPage] = useState(1)
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false)
  const [liveFlash, setLiveFlash] = useState(false)
  const channelRef = useRef<ReturnType<ReturnType<typeof getSupabaseBrowserClient>['channel']> | null>(null)

  // ── Realtime subscription ──
  useEffect(() => {
    let mounted = true

    async function subscribe() {
      const token = await getToken()
      const sb = getSupabaseBrowserClient(token)

      // Remove any stale channel before creating a new one.
      // React StrictMode double-invokes effects; .unsubscribe() alone leaves the
      // channel registered on the singleton client, so a second .on() call after
      // .subscribe() throws. removeChannel() fully destroys it.
      if (channelRef.current) {
        await sb.removeChannel(channelRef.current)
        channelRef.current = null
      }

      channelRef.current = sb
        .channel('exchange-listings')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'listings' },
          async (payload) => {
            if (!mounted) return
            const row = payload.new as Listing
            if (row.status !== 'active') return

            // Fetch recycler data for the new listing
            const { data: recycler } = await sb
              .from('recyclers')
              .select('id, company_name, state, cpcb_reg_no, capacity_mt, verified')
              .eq('id', row.recycler_id)
              .single()

            if (!mounted) return
            setListings(prev => [...prev, { ...row, recycler: (recycler as PublicRecycler) ?? { id: row.recycler_id, company_name: 'Unknown', state: '—', cpcb_reg_no: '—', verified: false, capacity_mt: 0 } }])
            setLiveFlash(true)
            setTimeout(() => setLiveFlash(false), 2000)
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'listings' },
          (payload) => {
            if (!mounted) return
            const updated = payload.new as Listing
            if (updated.status !== 'active') {
              setListings(prev => prev.filter(l => l.id !== updated.id))
            } else {
              setListings(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l))
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'listings' },
          (payload) => {
            if (!mounted) return
            const deleted = payload.old as { id: string }
            setListings(prev => prev.filter(l => l.id !== deleted.id))
          }
        )
        .subscribe()
    }

    subscribe()
    return () => {
      mounted = false
      if (channelRef.current) {
        getSupabaseBrowserClient(null).removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Compute unique states for filter dropdown ──
  const availableStates = useMemo(() => {
    const states = new Set(listings.map(l => l.recycler?.state).filter(Boolean))
    return Array.from(states).sort()
  }, [listings])

  // ── Filter + sort ──
  const filtered = useMemo(() => {
    let result = listings
      .filter(l => catFilter === 'all' || l.category === catFilter)
      .filter(l => creditFilter === 'all' || (l.credit_type ?? 'recycling') === creditFilter)
      .filter(l => stateFilter === 'all' || l.recycler?.state === stateFilter)

    switch (sortBy) {
      case 'price_asc':  result = result.sort((a, b) => a.price_per_kg - b.price_per_kg); break
      case 'price_desc': result = result.sort((a, b) => b.price_per_kg - a.price_per_kg); break
      case 'qty_desc':   result = result.sort((a, b) => b.qty_kg - a.qty_kg); break
      case 'latest':     result = result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break
    }
    return result
  }, [listings, catFilter, stateFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function clearFilters() {
    setCatFilter('all')
    setCreditFilter('all')
    setStateFilter('all')
    setSortBy('price_asc')
    setPage(1)
  }

  const hasFilters = catFilter !== 'all' || creditFilter !== 'all' || stateFilter !== 'all' || sortBy !== 'price_asc'

  function handleBuy(listingId: string) {
    router.push(`/dashboard/checkout/${listingId}`)
  }

  // ── Best value: cheapest listing per category ──
  const bestValueIds = useMemo(() => {
    const mins = new Map<PlasticCategory, { id: string; price: number }>()
    for (const l of listings) {
      const cur = mins.get(l.category)
      if (!cur || l.price_per_kg < cur.price) mins.set(l.category, { id: l.id, price: l.price_per_kg })
    }
    return new Set(Array.from(mins.values()).map(v => v.id))
  }, [listings])

  return (
    <div className="-m-6 flex flex-col min-h-full bg-background">

      {/* ── Deficit summary ── */}
      <DeficitCards liabilities={liabilities} />

      {/* ── Filter bar ── */}
      <div className="sticky top-0 z-20 bg-surface-container-lowest border-b border-[--color-border-zinc] px-6 py-2">
        {/* Desktop filter row */}
        <div className="hidden md:flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
              {(['all', 'rigid', 'flexible', 'mlp'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setCatFilter(cat); setPage(1) }}
                  className={cn(
                    'px-4 py-1.5 rounded font-data text-sm transition-colors capitalize',
                    catFilter === cat
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  )}
                >
                  {cat === 'all' ? 'All' : CAT_LABELS[cat].label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
              {([['all', 'All Credits'], ['recycling', 'Recycling'], ['eol', 'End-of-Life']] as const).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setCreditFilter(type); setPage(1) }}
                  className={cn(
                    'px-3 py-1.5 rounded font-data text-sm transition-colors',
                    creditFilter === type
                      ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="font-data text-[11px] text-on-surface-variant">State:</label>
              <select
                value={stateFilter}
                onChange={e => { setStateFilter(e.target.value); setPage(1) }}
                className="bg-surface-container-lowest border border-[--color-border-zinc] rounded font-data text-sm px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="all">All States</option>
                {availableStates.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-3.5 w-3.5 text-on-surface-variant" />
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(1) }}
                className="bg-surface-container-lowest border border-[--color-border-zinc] rounded font-data text-sm px-3 py-1.5 focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="qty_desc">Qty: Large → Small</option>
                <option value="latest">Latest Listings</option>
              </select>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-primary font-data text-sm hover:underline"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile filter chips */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
          {(['all', 'rigid', 'flexible', 'mlp'] as const).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => { setCatFilter(cat); setPage(1) }}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full font-data text-sm transition-colors capitalize',
                catFilter === cat
                  ? 'bg-primary-container text-on-primary-container font-semibold'
                  : 'border border-[--color-border-zinc] text-on-surface-variant hover:bg-surface-container-low'
              )}
            >
              {cat === 'all' ? 'All' : CAT_LABELS[cat].label}
            </button>
          ))}
          <div className="h-5 w-px bg-[--color-border-zinc] shrink-0 mx-1" />
          {([['all', 'All Credits'], ['recycling', 'Recycling'], ['eol', 'EoL']] as const).map(([type, label]) => (
            <button
              key={type}
              type="button"
              onClick={() => { setCreditFilter(type); setPage(1) }}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full font-data text-sm transition-colors',
                creditFilter === type
                  ? 'bg-primary-container text-on-primary-container font-semibold'
                  : 'border border-[--color-border-zinc] text-on-surface-variant hover:bg-surface-container-low'
              )}
            >
              {label}
            </button>
          ))}
          <div className="h-5 w-px bg-[--color-border-zinc] shrink-0 mx-1" />
          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="shrink-0 flex items-center gap-1.5 border border-[--color-border-zinc] text-on-surface-variant px-3 py-1.5 rounded-full font-data text-sm hover:bg-surface-container-low"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
          </button>
        </div>
      </div>

      {/* ── Table (desktop) + Cards (mobile) ── */}
      <div className="flex-1 px-6 py-4 overflow-x-auto">
        {paginated.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest border border-dashed border-[--color-border-zinc] rounded-lg text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-[--color-border-zinc]">
              <SearchX className="h-7 w-7 text-outline" />
            </div>
            <h3 className="font-['Geist'] text-[18px] font-semibold text-on-surface mb-2">
              No matching listings found
            </h3>
            <p className="text-sm text-on-surface-variant max-w-sm mb-6">
              {hasFilters
                ? 'Adjust your filters or try a different category.'
                : 'No active listings in the marketplace yet. Check back soon.'}
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-6 py-2 border border-primary text-primary hover:bg-success-emerald-light rounded-lg font-data text-sm font-bold transition-all"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-low border-b border-[--color-border-zinc]">
                  <tr>
                    <th className="px-4 py-3 font-data text-[11px] text-on-surface-variant uppercase tracking-wider w-16">#</th>
                    <th className="px-4 py-3 font-data text-[11px] text-on-surface-variant uppercase tracking-wider w-16">Token</th>
                    <th className="px-4 py-3 font-data text-[11px] text-on-surface-variant uppercase tracking-wider">Recycler Name</th>
                    <th className="px-4 py-3 font-data text-[11px] text-on-surface-variant uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 font-data text-[11px] text-on-surface-variant uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 font-data text-[11px] text-on-surface-variant uppercase tracking-wider">Credit</th>
                    <th className="px-4 py-3 font-data text-[11px] text-on-surface-variant uppercase tracking-wider text-right">Qty (kg / MT)</th>
                    <th className="px-4 py-3 font-data text-[11px] text-on-surface-variant uppercase tracking-wider text-right">Price / kg</th>
                    <th className="px-4 py-3 font-data text-[11px] text-on-surface-variant uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {paginated.map((listing, i) => {
                    const globalIdx = (page - 1) * PAGE_SIZE + i + 1
                    const isBest = bestValueIds.has(listing.id)
                    return (
                      <tr
                        key={listing.id}
                        className={cn(
                          'hover:bg-surface-container transition-colors',
                          isBest && 'bg-success-emerald-light/10',
                          liveFlash && i === 0 && 'animate-pulse'
                        )}
                      >
                        <td className="px-4 py-3 font-data text-[11px] text-on-surface-variant">
                          #{globalIdx.toString().padStart(4, '0')}
                        </td>
                        <td className="px-4 py-3">
                          <TokenBadge category={listing.category} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-on-surface">
                              {listing.recycler?.company_name ?? '—'}
                            </span>
                            {listing.recycler?.verified && <CpcbBadge />}
                            {isBest && (
                              <span className="font-data text-[9px] bg-primary text-on-primary px-1.5 py-0.5 rounded font-bold uppercase">
                                Best Value
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-on-surface">{listing.recycler?.state ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-data text-[11px] capitalize">
                            {CAT_LABELS[listing.category].label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('px-2 py-0.5 rounded font-data text-[10px] font-bold border',
                            (listing.credit_type ?? 'recycling') === 'eol'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-success-emerald-light text-primary border-primary/20'
                          )}>
                            {(listing.credit_type ?? 'recycling') === 'eol' ? 'EoL' : 'Recycling'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className="font-data text-sm text-on-surface">{intl.format(Math.round(listing.qty_kg))} kg</span>
                          <span className="block font-data text-[10px] text-on-surface-variant">{fmtMt(listing.qty_kg)}</span>
                        </td>
                        <td className="px-4 py-3 font-data text-sm text-right font-bold text-primary tabular-nums">
                          {fmtRs(listing.price_per_kg)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleBuy(listing.id)}
                            className="bg-primary text-on-primary px-5 py-1.5 rounded font-data text-sm font-semibold hover:bg-primary-container transition-colors active:scale-95"
                          >
                            Buy
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Pagination footer */}
              <div className="bg-surface-container-low border-t border-[--color-border-zinc] px-4 py-3 flex items-center justify-between">
                <span className="font-data text-[11px] text-on-surface-variant">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} listings
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={cn(
                        'font-data text-[11px] px-2 py-0.5 rounded transition-colors',
                        page === p ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container-high'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-1 rounded text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {paginated.map((listing, i) => {
                const isBest = bestValueIds.has(listing.id)
                return (
                  <article
                    key={listing.id}
                    className={cn(
                      'bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm',
                      isBest ? 'border-2 border-primary' : 'border border-[--color-border-zinc]'
                    )}
                  >
                    {isBest && (
                      <div className="bg-primary text-on-primary font-data text-[9px] px-2 py-0.5 text-right font-bold uppercase">
                        Best Value
                      </div>
                    )}
                    <div className="p-3 border-b border-[--color-border-zinc] flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <TokenBadge category={listing.category} />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-['Geist'] text-[18px] font-semibold text-on-surface">
                              {listing.recycler?.company_name ?? '—'}
                            </h3>
                            {listing.recycler?.verified && <CpcbBadge />}
                          </div>
                          <p className="font-data text-[11px] text-on-surface-variant">
                            ID: {listing.recycler?.cpcb_reg_no ?? '—'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-data text-[10px] text-on-surface-variant uppercase">Type</span>
                        <span className="block text-sm font-semibold text-secondary">
                          {CAT_LABELS[listing.category].cat} {CAT_LABELS[listing.category].label}
                        </span>
                      </div>
                    </div>
                    <div className={cn('p-3 grid grid-cols-2 gap-4', isBest ? 'bg-primary/5' : 'bg-surface-container-low/30')}>
                      <div>
                        <span className="block font-data text-[10px] text-on-surface-variant uppercase mb-1">
                          Available Qty
                        </span>
                        <span className="font-data text-base font-semibold text-on-surface">
                          {intl.format(Math.round(listing.qty_kg))} <span className="text-xs font-normal">kg</span>
                        </span>
                        <span className="block font-data text-[10px] text-on-surface-variant">{fmtMt(listing.qty_kg)}</span>
                      </div>
                      <div>
                        <span className="block font-data text-[10px] text-on-surface-variant uppercase mb-1">
                          Unit Price
                        </span>
                        <span className="font-data text-base font-semibold text-primary">
                          {fmtRs(listing.price_per_kg)} <span className="text-xs font-normal">/kg</span>
                        </span>
                      </div>
                    </div>
                    <div className="p-3 flex gap-2">
                      <button
                        type="button"
                        className="flex-1 bg-surface-container-high text-on-surface py-2.5 rounded-lg text-sm font-semibold active:scale-95 transition-transform"
                      >
                        Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBuy(listing.id)}
                        className="flex-[2] bg-primary text-on-primary py-2.5 rounded-lg text-sm font-bold shadow-md active:scale-95 transition-transform"
                      >
                        Buy Now
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Mobile bottom sheet ── */}
      {mobileSheetOpen && (
        <>
          <div
            className="fixed inset-0 bg-on-background/40 z-50 md:hidden"
            onClick={() => setMobileSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden bg-surface-container-lowest rounded-t-2xl border-t border-[--color-border-zinc] pb-safe">
            <div className="w-12 h-1 bg-[--color-border-zinc] rounded-full mx-auto my-3" />
            <div className="px-6 pb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-['Geist'] font-bold">Filter Market</h2>
                <button type="button" onClick={() => setMobileSheetOpen(false)}>
                  <X className="h-5 w-5 text-on-surface-variant" />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block font-data text-[11px] text-on-surface-variant uppercase mb-2">
                    State of Origin
                  </label>
                  <select
                    value={stateFilter}
                    onChange={e => { setStateFilter(e.target.value); setPage(1) }}
                    className="w-full bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg p-3 font-data text-sm"
                  >
                    <option value="all">All States</option>
                    {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-data text-[11px] text-on-surface-variant uppercase mb-2">
                    Sort By
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      ['price_asc', 'Price: Low → High'],
                      ['price_desc', 'Price: High → Low'],
                      ['qty_desc', 'Quantity: High'],
                      ['latest', 'Recent First'],
                    ] as const).map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSortBy(val)}
                        className={cn(
                          'p-3 rounded-lg text-sm font-semibold text-left border transition-colors',
                          sortBy === val
                            ? 'border-2 border-primary bg-primary/5 text-primary'
                            : 'border-[--color-border-zinc] text-on-surface'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSheetOpen(false)}
                  className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Live flash indicator (top-right) */}
      {liveFlash && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-primary text-on-primary px-4 py-2 rounded-full shadow-lg font-data text-sm animate-bounce">
          <Zap className="h-4 w-4" />
          New listing live!
        </div>
      )}
    </div>
  )
}
