'use client'

import { useRouter } from 'next/navigation'
import {
  AlertTriangle, Wallet, ShieldCheck, TrendingDown,
  ClipboardList, ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlasticCategory } from '@/lib/epr/constants'

const intl = new Intl.NumberFormat('en-IN')
const fmtKg = (n: number) => `${intl.format(Math.round(n))} kg`
const fmtMt = (n: number) => `${(n / 1000).toFixed(2)} MT`

type LiabilityRow = { category: PlasticCategory; liability_kg: number }

const CAT_LABELS: Record<PlasticCategory, string> = {
  rigid: 'Rigid Plastic',
  flexible: 'Flexible Packaging',
  mlp: 'Multi-Layered Plastic (MLP)',
}
const CAT_ORDER: PlasticCategory[] = ['rigid', 'flexible', 'mlp']

// ─── Donut chart ──────────────────────────────────────────────────────────────

function ComplianceDonut({ pct }: { pct: number }) {
  const dasharray = `${pct} ${100 - pct}`
  const color =
    pct >= 80 ? '#006948' :
    pct >= 50 ? '#4648d4' :
    pct >= 1  ? '#f59e0b' :
    '#ef4444'

  const statusText =
    pct >= 80 ? 'LARGELY COMPLIANT' :
    pct >= 50 ? 'PARTIALLY COMPLIANT' :
    'NON-COMPLIANT'

  const statusColor =
    pct >= 80 ? 'text-primary' :
    pct >= 50 ? 'text-secondary' :
    'text-[--color-risk-red]'

  return (
    <div className="relative w-36 h-36 md:w-56 md:h-56 mx-auto shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        {/* Track */}
        <path
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="2.8"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        {/* Arc */}
        <path
          fill="none"
          strokeWidth="2.8"
          strokeLinecap="round"
          stroke={color}
          strokeDasharray={dasharray}
          style={{ transition: 'stroke-dasharray 1s ease-out' }}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span
          className="text-[28px] md:text-[42px] font-['Geist'] font-bold leading-none"
          style={{ color }}
        >
          {pct}%
        </span>
        <span className="font-data text-[10px] text-outline uppercase tracking-widest mt-1">Compliant</span>
        <span className={cn('font-data text-xs font-bold mt-1', statusColor)}>
          {statusText}
        </span>
      </div>
    </div>
  )
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export interface ComplianceDashboardProps {
  companyName: string
  liabilities: LiabilityRow[]
  creditsSecured: number
  daysRemaining: number
}

export function ComplianceDashboard({
  companyName,
  liabilities,
  creditsSecured,
  daysRemaining,
}: ComplianceDashboardProps) {
  const router = useRouter()

  const totalLiabilityKg = liabilities.reduce((s, r) => s + r.liability_kg, 0)
  const deficitKg = Math.max(0, totalLiabilityKg - creditsSecured)
  const compliancePct =
    totalLiabilityKg > 0 ? Math.round((creditsSecured / totalLiabilityKg) * 100) : 0

  const liabilityByCategory = Object.fromEntries(
    liabilities.map(r => [r.category, r.liability_kg])
  ) as Partial<Record<PlasticCategory, number>>

  const urgent = daysRemaining <= 30

  return (
    <div className="-m-4 p-4 lg:-m-6 lg:p-6 min-h-full micro-grid">

      {/* ── Welcome banner ── */}
      <div className="mb-6 bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 h-full w-1 bg-[--color-risk-red]" />
        <div className="pl-3">
          <h1 className="text-2xl font-['Geist'] font-semibold text-on-surface mb-0.5">
            Welcome back, {companyName}
          </h1>
          <p className="text-sm text-on-surface-variant">
            EPR Compliance Portal · CPCB Verified
          </p>
        </div>
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg border shrink-0',
            urgent
              ? 'bg-error-container border-[--color-risk-red]/20 text-on-error-container'
              : 'bg-surface-container border-[--color-border-zinc] text-on-surface',
          )}
        >
          <AlertTriangle
            className={cn('h-5 w-5 shrink-0', urgent ? 'text-[--color-risk-red] animate-pulse' : 'text-outline')}
          />
          <div className="font-data text-sm">
            <span className="font-bold">Annual return due June 30</span>
            <span className="mx-2 opacity-50">|</span>
            <span>{daysRemaining} days remaining</span>
          </div>
        </div>
      </div>

      {/* ── Compliance overview grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        {/* Donut + category bars */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg p-4 md:p-8 flex flex-col md:flex-row items-center justify-around gap-6 md:gap-8">
          <ComplianceDonut pct={compliancePct} />

          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-4">
              <h3 className="font-['Geist'] text-[18px] font-semibold text-on-surface border-b border-[--color-border-zinc] pb-2">
                Category Progress
              </h3>
              <div className="space-y-4">
                {CAT_ORDER.map(cat => {
                  const liabilityKg = liabilityByCategory[cat] ?? 0
                  // wire per-category secured kg here when orders land (B7)
                  const pct = 0
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex justify-between font-data text-[11px] uppercase tracking-tight">
                        <span className="text-on-surface-variant">{CAT_LABELS[cat]}</span>
                        <span className="text-on-surface">
                          0 / {intl.format(Math.round(liabilityKg))} kg
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
                {liabilities.length === 0 && (
                  <p className="text-xs text-on-surface-variant italic text-center py-2">
                    Complete the calculator to see your liability breakdown.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/dashboard/exchange')}
              className="w-full py-3 bg-primary text-on-primary rounded-lg font-data text-sm font-bold hover:bg-primary-container transition-colors uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              Open Marketplace
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Liability profile card */}
        <div className="bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg p-6 space-y-6">
          <h3 className="font-['Geist'] text-[18px] font-semibold text-on-surface flex items-center gap-2">
            <Wallet className="h-5 w-5 text-outline" />
            Liability Profile
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 border border-[--color-border-zinc] rounded">
              <span className="text-xs text-on-surface-variant uppercase tracking-wide">Total Liability</span>
              <div className="text-right">
                <span className="block font-data text-base font-semibold text-on-surface">
                  {totalLiabilityKg > 0 ? fmtKg(totalLiabilityKg) : '— kg'}
                </span>
                {totalLiabilityKg > 0 && (
                  <span className="block font-data text-[10px] text-on-surface-variant">[{fmtMt(totalLiabilityKg)}]</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 border border-[--color-border-zinc] rounded">
              <span className="text-xs text-on-surface-variant uppercase tracking-wide">Credits Secured</span>
              <div className="text-right">
                <span className="block font-data text-base font-semibold text-primary">
                  {fmtKg(creditsSecured)}
                </span>
                <span className="block font-data text-[10px] text-on-surface-variant">[{fmtMt(creditsSecured)}]</span>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-error-container/30 border border-[--color-risk-red]/10 rounded">
              <span className="text-xs text-[--color-risk-red] uppercase tracking-wide font-bold flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5" />
                Current Deficit
              </span>
              <div className="text-right">
                <span className="block font-data text-base font-semibold text-[--color-risk-red]">
                  {deficitKg > 0 ? fmtKg(deficitKg) : '— kg'}
                </span>
                {deficitKg > 0 && (
                  <span className="block font-data text-[10px] text-[--color-risk-red]/70">[{fmtMt(deficitKg)}]</span>
                )}
              </div>
            </div>
            <div className="pt-4 border-t border-[--color-border-zinc]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-on-surface-variant uppercase tracking-wide">Active Penalty Risk</span>
                {deficitKg > 0 && (
                  <span className="px-2 py-0.5 bg-[--color-risk-red] text-white text-[10px] font-bold rounded uppercase tracking-widest">
                    HIGH
                  </span>
                )}
              </div>
              <p className="text-xs text-outline leading-relaxed">
                Non-compliance by deadline may result in penalties of ₹15,00,000+ as per CPCB guidelines.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded border border-[--color-border-zinc]">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span className="font-data text-[11px] text-on-surface-variant uppercase tracking-wide">
              CPCB VERIFIED PORTAL
            </span>
          </div>
        </div>
      </div>

      {/* ── Recent transactions ── */}
      <div className="bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[--color-border-zinc] bg-slate-50 flex justify-between items-center">
          <h3 className="font-['Geist'] text-[18px] font-semibold text-on-surface">Recent Transactions</h3>
          <span className="font-data text-[11px] text-outline uppercase tracking-wide">Fiscal Year 2024–25</span>
        </div>
        <div className="min-h-72 flex flex-col items-center justify-center p-6 md:p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 border border-[--color-border-zinc]">
            <ClipboardList className="h-7 w-7 text-outline" />
          </div>
          <h4 className="font-['Geist'] text-[18px] font-semibold text-on-surface mb-2">
            No recent transactions found
          </h4>
          <p className="text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
            Your trade history is currently empty. Visit the Marketplace to secure credits and
            fulfil your EPR obligations before the deadline.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard/exchange')}
            className="px-6 py-2 border border-primary text-primary hover:bg-success-emerald-light rounded-lg font-data text-sm font-bold transition-all active:scale-[0.98]"
          >
            Visit Marketplace
          </button>
        </div>
      </div>

    </div>
  )
}
