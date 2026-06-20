'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package2, Layers, LayoutGrid, ShieldCheck,
  ArrowRight, ArrowLeft, X, Check, Loader2, Info,
  TrendingUp, BarChart3, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { calculateLiability, estimateCostRange } from '@/lib/epr/liability'
import type { PlasticCategory, PlasticSubcategory } from '@/lib/epr/constants'
import { SUBCATEGORY_LABELS, PLASTIC_SUBCATEGORIES } from '@/lib/epr/constants'
import { saveLiabilities } from '@/lib/actions/buyer'
import { AiEstimator } from '@/components/calculator/ai-estimator'

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'rigid' as PlasticCategory,
    code: 'RIG-2024',
    label: 'Rigid Plastic',
    cat: 'CATEGORY I',
    subtitle: 'Cat I — HDPE, PET, PP Containers & Bottles',
    tableSubtitle: 'Non-compostable rigid structures',
    hsCode: '3901.10.10',
    Icon: Package2,
    targetPct: 30,
    description:
      'Compliance for rigid plastic packaging including bottles, containers, and plastic boxes as per PWM Rules 2016 and subsequent amendments.',
    liquidity: 'HIGH' as const,
    volatilityIndex: '0.14',
  },
  {
    id: 'flexible' as PlasticCategory,
    code: 'FLX-2024',
    label: 'Flexible Packaging',
    cat: 'CATEGORY II',
    subtitle: 'Cat II — Films, Pouches & Wrapping',
    tableSubtitle: 'Single/Multi-layer flexible sheets',
    hsCode: '3920.10.12',
    Icon: Layers,
    targetPct: 20,
    description:
      'EPR obligations for flexible packaging materials, stretch films, and laminated pouches under CPCB regulatory guidelines.',
    liquidity: 'MEDIUM' as const,
    volatilityIndex: '0.22',
  },
  {
    id: 'mlp' as PlasticCategory,
    code: 'MLP-2024',
    label: 'Multi-Layered Plastic',
    cat: 'CATEGORY III',
    subtitle: 'Cat III — Laminated & Composite Packaging',
    tableSubtitle: 'MLP with at least one layer of plastic',
    hsCode: '3923.21.00',
    Icon: LayoutGrid,
    targetPct: 15,
    description:
      'Regulatory compliance for multi-layer plastic packaging with complex material composition and limited recyclability.',
    liquidity: 'EMERGING' as const,
    volatilityIndex: '0.35',
  },
] as const

const LIQUIDITY_COLOR: Record<'HIGH' | 'MEDIUM' | 'EMERGING', string> = {
  HIGH: 'text-primary',
  MEDIUM: 'text-secondary',
  EMERGING: 'text-tertiary',
}

const CAT_CODES: Record<PlasticCategory, string> = {
  rigid: 'P1-RIGID',
  flexible: 'P2-FLEX',
  mlp: 'P3-MLP',
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const intl = new Intl.NumberFormat('en-IN')
const fmtKg = (n: number) => `${intl.format(Math.round(n))} kg`
const fmtRs = (n: number) => `₹${intl.format(Math.round(n))}`

// ─── Shared step dots (mobile only) ──────────────────────────────────────────

function MobileStepDots({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Category' },
    { n: 2, label: 'Weights' },
    { n: 3, label: 'Ledger' },
  ]
  return (
    <div className="md:hidden flex items-center justify-between mb-8 px-2">
      {steps.map(({ n, label }, i) => (
        <div key={n} className="flex items-center flex-col" style={{ flex: i < steps.length - 1 ? 'unset' : undefined }}>
          <div className="flex items-center w-full">
            <div
              className={cn(
                'w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0',
                step > n
                  ? 'border-primary text-primary'
                  : step === n
                  ? 'bg-primary text-white border-primary'
                  : 'border-zinc-200 text-zinc-400',
              )}
            >
              {step > n ? <Check className="h-4 w-4" /> : n}
            </div>
            {i < steps.length - 1 && (
              <div className={cn('h-0.5 flex-grow mx-2', step > n ? 'bg-primary' : 'bg-zinc-200')} style={{ width: '100%' }} />
            )}
          </div>
          <span
            className={cn(
              'font-data text-[11px] mt-1',
              step >= n ? 'text-primary font-bold' : 'text-outline',
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Category Selection ───────────────────────────────────────────────

interface Step1Props {
  selected: Set<PlasticCategory>
  onToggle: (cat: PlasticCategory) => void
  onEstimate: (est: Record<PlasticCategory, number>) => void
  onNext: () => void
  onCancel: () => void
  clock: string
}

function Step1({ selected, onToggle, onEstimate, onNext, onCancel, clock }: Step1Props) {
  const canProceed = selected.size > 0

  return (
    <div className="flex flex-col">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="font-data text-[11px] text-primary uppercase tracking-widest block mb-1">
              Liability Calculator
            </span>
            <h1 className="text-2xl font-['Geist'] font-semibold tracking-tight text-on-surface">
              Asset Category Selection
            </h1>
          </div>
          <span className="font-data text-sm text-on-surface-variant hidden md:inline">
            Step <span className="text-primary font-bold">1</span> / 3
          </span>
          <span className="md:hidden font-data text-[11px] text-primary px-3 py-1 bg-success-emerald-light rounded-full font-semibold">
            STEP 1 / 3
          </span>
        </div>
        <div className="h-1.5 w-full bg-[--color-border-zinc] rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: '33.33%' }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-data text-[11px] text-primary font-bold">Category</span>
          <span className="font-data text-[11px] text-outline">Inventory</span>
          <span className="font-data text-[11px] text-outline">Summary</span>
        </div>
      </div>

      <MobileStepDots step={1} />

      {/* AI estimator — optional, pre-fills categories + weights */}
      <AiEstimator onEstimate={onEstimate} />

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {CATEGORIES.map(({ id, code, label, subtitle, Icon, targetPct, description, liquidity, volatilityIndex }) => {
          const isSelected = selected.has(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              className={cn(
                'relative text-left border rounded-lg p-6 flex flex-col transition-all duration-200 active:scale-[0.98]',
                isSelected
                  ? 'border-primary ring-1 ring-primary bg-primary/[0.02] hover:bg-primary/[0.04]'
                  : 'border-[--color-border-zinc] bg-surface-container-lowest hover:bg-surface-container-low',
              )}
            >
              {/* Icon + badges */}
              <div className="flex justify-between items-start mb-6">
                <div
                  className={cn(
                    'w-12 h-12 rounded flex items-center justify-center transition-colors',
                    isSelected ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-primary',
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'font-data text-[11px] px-2 py-0.5 rounded border',
                      isSelected
                        ? 'bg-primary/[0.06] text-primary border-primary/30'
                        : 'bg-surface-container text-on-surface-variant border-[--color-border-zinc]',
                    )}
                  >
                    {code}
                  </span>
                  <span
                    className={cn(
                      'font-data text-[10px] px-2 py-0.5 rounded border font-semibold',
                      isSelected
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container text-on-surface-variant border-[--color-border-zinc]',
                    )}
                  >
                    {targetPct}% CPCB Target
                  </span>
                </div>
              </div>

              <h3 className="text-[18px] font-['Geist'] font-semibold text-on-surface mb-1 leading-snug">{label}</h3>
              <p className="font-data text-[11px] text-on-surface-variant mb-3">{subtitle}</p>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-6">{description}</p>

              {/* Stats */}
              <div className="mt-auto pt-4 border-t border-[--color-border-zinc]/60">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span className="font-data text-[11px] text-on-surface font-semibold tracking-wider">
                    CPCB VERIFIED SCOPE
                  </span>
                </div>
              </div>

              {/* Selection indicator */}
              <div
                className={cn(
                  'absolute top-4 right-4 transition-all duration-200',
                  isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75',
                )}
              >
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Terminal Status Footer */}
      <div className="-mx-6 -mb-6 px-8 py-4 bg-inverse-surface shadow-xl border-t border-zinc-800">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="font-data text-[11px] text-inverse-on-surface flex items-center gap-3">
              <span>TERMINAL_STATUS: READY</span>
              {clock && (
                <>
                  <span className="hidden md:inline text-zinc-600">|</span>
                  <span className="hidden md:inline">SYSTEM_CLOCK: {clock}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 border border-zinc-700 text-inverse-on-surface text-sm font-semibold rounded hover:bg-zinc-800 transition-all flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="button"
              disabled={!canProceed}
              onClick={onNext}
              className={cn(
                'px-7 py-2 text-sm font-semibold rounded flex items-center gap-2 transition-all',
                canProceed
                  ? 'bg-primary text-on-primary hover:bg-primary-container shadow-lg shadow-primary/20'
                  : 'bg-zinc-700 text-zinc-500 cursor-not-allowed',
              )}
            >
              Next Step
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Weight / Tonnage Entry ──────────────────────────────────────────

interface Step2Props {
  selected: Set<PlasticCategory>
  weights: Record<PlasticCategory, string>
  subcategories: Record<PlasticCategory, PlasticSubcategory>
  onWeightChange: (cat: PlasticCategory, val: string) => void
  onSubcategoryChange: (cat: PlasticCategory, val: PlasticSubcategory) => void
  onNext: () => void
  onBack: () => void
}

function Step2({ selected, weights, subcategories, onWeightChange, onSubcategoryChange, onNext, onBack }: Step2Props) {
  const [isPending, startTransition] = useTransition()

  const selectedCats = CATEGORIES.filter(c => selected.has(c.id))

  // Real-time EPR calculations
  const rows = selectedCats.map(cat => {
    const kg = parseFloat(weights[cat.id]) || 0
    const liabilityKg = calculateLiability(cat.id, kg)
    const costRange = estimateCostRange(cat.id, liabilityKg)
    return { ...cat, kg, liabilityKg, costRange }
  })
  const totalMarketKg = rows.reduce((s, r) => s + r.kg, 0)
  const totalLiabilityKg = rows.reduce((s, r) => s + r.liabilityKg, 0)
  const totalMinCost = rows.reduce((s, r) => s + r.costRange.min, 0)
  const totalMaxCost = rows.reduce((s, r) => s + r.costRange.max, 0)

  const allFilled = selectedCats.every(c => (parseFloat(weights[c.id]) || 0) > 0)

  function handleSubmit() {
    if (!allFilled) {
      toast.error('Enter weight for all selected categories.')
      return
    }
    const items = selectedCats.map(c => ({
      category: c.id,
      subcategory: subcategories[c.id],
      market_kg: parseFloat(weights[c.id]),
    }))
    startTransition(async () => {
      const result = await saveLiabilities(items)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      if (typeof pendo !== 'undefined') {
        pendo.track('liability_calculated', {
          categories_selected: selectedCats.map(c => c.id).join(','),
          category_count: selectedCats.length,
          total_market_kg: totalMarketKg,
          total_liability_kg: totalLiabilityKg,
          estimated_cost_min: totalMinCost,
          estimated_cost_max: totalMaxCost,
        })
      }
      onNext()
    })
  }

  return (
    <div>
      {/* Desktop Progress Header */}
      <div className="hidden md:block mb-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="font-data text-[11px] text-primary uppercase tracking-widest block mb-1">
              Liability Calculator
            </span>
            <h1 className="text-2xl font-['Geist'] font-semibold tracking-tight text-on-surface">
              Compliance Liability Entry
            </h1>
          </div>
          <span className="font-data text-sm text-on-surface-variant">
            Step <span className="text-primary font-bold">2</span> / 3
          </span>
        </div>
        <div className="h-1.5 w-full bg-[--color-border-zinc] rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: '66.66%' }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-data text-[11px] text-primary font-bold">Category</span>
          <span className="font-data text-[11px] text-primary font-bold">Inventory</span>
          <span className="font-data text-[11px] text-outline">Summary</span>
        </div>
      </div>

      {/* Mobile: Page title + step badge */}
      <div className="md:hidden mb-6">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-2xl font-['Geist'] font-semibold tracking-tight text-on-surface">Weight Inputs</h1>
          <span className="font-data text-[11px] text-primary px-3 py-1 bg-success-emerald-light rounded-full font-semibold">
            STEP 2 / 3
          </span>
        </div>
        <p className="text-sm text-on-surface-variant">
          Enter the annual market volume of plastic for each selected category.
        </p>
      </div>

      <MobileStepDots step={2} />

      {/* Desktop: two-column layout */}
      <div className="hidden md:flex gap-6">
        {/* ── Left: table card ── */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Progress card */}
          <div className="bg-surface-container-lowest rounded-lg border border-[--color-border-zinc] p-5 flex items-center justify-between">
            <h2 className="text-[18px] font-['Geist'] font-semibold text-on-surface">Compliance Liability Entry</h2>
            <span className="font-data text-[11px] text-primary px-3 py-1 bg-success-emerald-light rounded-full font-semibold tracking-wide">
              STEP 2 / 3
            </span>
          </div>

          {/* Table card */}
          <div className="bg-surface-container-lowest rounded-lg border border-[--color-border-zinc] overflow-hidden">
            {/* Table header */}
            <div className="px-5 py-3 bg-slate-50 border-b border-[--color-border-zinc] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Package2 className="h-4 w-4 text-primary" />
                <h3 className="text-[15px] font-['Geist'] font-semibold text-on-surface">Weight Tonnage Breakdown</h3>
              </div>
              <span className="font-data text-[11px] text-on-surface-variant">FY 2025–26</span>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[--color-border-zinc]">
                  <th className="px-6 py-3 text-left font-data text-[11px] text-on-surface-variant uppercase tracking-wider">
                    Plastic Category
                  </th>
                  <th className="px-6 py-3 text-left font-data text-[11px] text-on-surface-variant uppercase tracking-wider">
                    Subcategory
                  </th>
                  <th className="px-6 py-3 text-left font-data text-[11px] text-on-surface-variant uppercase tracking-wider">
                    HS Code
                  </th>
                  <th className="px-6 py-3 text-right font-data text-[11px] text-on-surface-variant uppercase tracking-wider">
                    Annual Packaging Volume (kg)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {selectedCats.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-on-surface">{cat.label}</span>
                        <span className="font-data text-[11px] text-on-surface-variant">{cat.tableSubtitle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={subcategories[cat.id]}
                        onChange={e => onSubcategoryChange(cat.id, e.target.value as PlasticSubcategory)}
                        className="w-36 font-data text-sm border border-[--color-border-zinc] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white transition-all"
                      >
                        {PLASTIC_SUBCATEGORIES.map(sub => (
                          <option key={sub} value={sub}>{SUBCATEGORY_LABELS[sub]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 font-data text-sm text-on-surface-variant">{cat.hsCode}</td>
                    <td className="px-6 py-4 text-right">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={weights[cat.id]}
                        onChange={e => onWeightChange(cat.id, e.target.value)}
                        placeholder="0"
                        className="w-36 font-data text-sm text-right border border-[--color-border-zinc] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white transition-all"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Helper text */}
            <div className="px-6 py-3 bg-primary/5 border-t border-[--color-border-zinc] flex items-start gap-2">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-on-surface-variant">
                Rule of thumb: ₹1 Cr FMCG revenue ≈ 0.8–1.2 metric tonnes of plastic packaging.
                All values are subject to CPCB audit verification.
              </p>
            </div>

            {/* Table footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-[--color-border-zinc] flex justify-between items-center">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 border border-[--color-border-zinc] rounded-lg text-sm text-on-surface hover:bg-zinc-100 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Selection
              </button>
              <button
                type="button"
                disabled={!allFilled || isPending}
                onClick={handleSubmit}
                className={cn(
                  'flex items-center gap-2 px-8 py-2 rounded-lg text-sm font-bold transition-all',
                  allFilled && !isPending
                    ? 'bg-primary text-on-primary hover:opacity-90'
                    : 'bg-zinc-200 text-zinc-500 cursor-not-allowed',
                )}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    Save and Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: sidebar ── */}
        <aside className="w-72 xl:w-80 flex flex-col gap-4 shrink-0">
          {/* Liability Projection */}
          <div className="bg-surface-container-lowest rounded-lg border border-[--color-border-zinc] p-5 flex flex-col gap-5">
            <div>
              <h3 className="text-[15px] font-['Geist'] font-semibold text-on-surface mb-4">Liability Projection</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="font-data text-[11px] text-on-surface-variant uppercase tracking-wide">
                    Total Market Volume
                  </span>
                  <span className="font-data text-base font-semibold text-on-surface">
                    {totalMarketKg > 0 ? fmtKg(totalMarketKg) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="font-data text-[11px] text-on-surface-variant uppercase tracking-wide">
                    EPR Liability
                  </span>
                  <span className="font-data text-base font-semibold text-primary">
                    {totalLiabilityKg > 0 ? fmtKg(totalLiabilityKg) : '—'}
                  </span>
                </div>
              </div>
            </div>
            <div className="h-px bg-zinc-100" />
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="font-data text-[11px] text-on-surface-variant">Est. Market Cost Range</span>
                <span className="font-data text-sm font-bold text-on-surface">
                  {totalMinCost > 0 ? `${fmtRs(totalMinCost)}–${fmtRs(totalMaxCost)}` : '—'}
                </span>
              </div>
              {totalLiabilityKg > 0 && (
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-secondary h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (totalLiabilityKg / Math.max(totalMarketKg, 1)) * 100 * 2)}%` }}
                  />
                </div>
              )}
              <p className="font-data text-[11px] text-on-surface-variant italic">
                Based on current market rates per category
              </p>
            </div>
            <div className="bg-[--color-primary-container]/30 p-3 rounded-lg flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-data text-[11px] font-bold text-primary block">CPCB VERIFIED</span>
                <span className="text-[11px] text-on-surface-variant leading-tight">
                  Formula compliant with PWM Rules 2016 amendments.
                </span>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-surface-container-lowest rounded-lg border border-[--color-border-zinc] overflow-hidden">
            <div className="px-4 py-3 border-b border-[--color-border-zinc] bg-slate-50">
              <h4 className="font-data text-[11px] font-bold uppercase text-on-surface-variant tracking-wide">
                Category Distribution
              </h4>
            </div>
            <div className="p-4 space-y-3">
              {rows.map(r => {
                const pct = totalMarketKg > 0 ? (r.kg / totalMarketKg) * 100 : 0
                return (
                  <div key={r.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-data text-[11px] text-on-surface-variant">{r.cat}</span>
                      <span className="font-data text-[11px] text-primary font-semibold">
                        {pct > 0 ? `${pct.toFixed(0)}%` : '—'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {totalMarketKg === 0 && (
                <p className="text-xs text-on-surface-variant text-center py-2">Enter weights to see distribution</p>
              )}
            </div>
          </div>

          {/* Regulatory Tip */}
          <div className="bg-surface-container p-4 rounded-lg border border-[--color-border-zinc]">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-secondary" />
              <span className="text-sm font-semibold text-secondary">Regulatory Tip</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Ensure all tonnage values are derived from audited sales invoices. CPCB requires supporting
              documentation for discrepancies &gt;5%.
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile: stacked input cards */}
      <div className="md:hidden space-y-4">
        {selectedCats.map(cat => {
          const Icon = cat.Icon
          return (
            <div
              key={cat.id}
              className="bg-surface-container-lowest border border-[--color-border-zinc] p-4 rounded-xl flex flex-col gap-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-[18px] font-['Geist'] font-semibold text-on-surface">{cat.label}</h3>
                  <span className="font-data text-[11px] text-on-surface-variant uppercase tracking-wider">{cat.cat}</span>
                </div>
                <Icon className="h-5 w-5 text-on-surface-variant" />
              </div>
              {/* Subcategory dropdown */}
              <div>
                <label className="block font-data text-[11px] text-on-surface-variant mb-1.5">
                  Subcategory
                </label>
                <select
                  value={subcategories[cat.id]}
                  onChange={e => onSubcategoryChange(cat.id, e.target.value as PlasticSubcategory)}
                  className="w-full h-10 bg-surface-container-low border border-[--color-border-zinc] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg px-4 font-data text-sm transition-all"
                >
                  {PLASTIC_SUBCATEGORIES.map(sub => (
                    <option key={sub} value={sub}>{SUBCATEGORY_LABELS[sub]}</option>
                  ))}
                </select>
              </div>
              {/* Floating label input */}
              <div className="relative">
                <label className="absolute left-4 top-2 font-data text-[11px] text-on-surface-variant pointer-events-none">
                  Annual Market Volume (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={weights[cat.id]}
                  onChange={e => onWeightChange(cat.id, e.target.value)}
                  placeholder="0"
                  className="w-full h-16 bg-surface-container-low border border-[--color-border-zinc] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg px-4 pt-5 pb-1 font-data text-lg text-right transition-all"
                />
                <span className="absolute right-4 bottom-3 font-data text-sm text-primary pointer-events-none">kg</span>
              </div>
            </div>
          )
        })}

        {/* Rule of thumb */}
        <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-lg">
          <div className="flex gap-3">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Rule of thumb: ₹1 Cr FMCG revenue ≈ 0.8–1.2 metric tonnes of plastic packaging.
              Values must align with CPCB portal submissions for the current financial year.
            </p>
          </div>
        </div>

        {/* Mobile: estimated liability preview */}
        <div className="sticky bottom-0 -mx-6 -mb-6 bg-surface/90 backdrop-blur-md border-t border-[--color-border-zinc] p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-on-surface-variant">Estimated Liability</span>
            <span className="font-data text-base font-semibold text-primary">
              {totalMinCost > 0 ? `${fmtRs(totalMinCost)} – ${fmtRs(totalMaxCost)}` : '₹ —'}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-2 px-4 h-12 border border-[--color-border-zinc] rounded-xl text-sm font-semibold text-on-surface hover:bg-zinc-100 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!allFilled || isPending}
              onClick={handleSubmit}
              className={cn(
                'flex-1 h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all',
                allFilled && !isPending
                  ? 'bg-primary text-on-primary active:scale-[0.98]'
                  : 'bg-zinc-200 text-zinc-500 cursor-not-allowed',
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Calculate Liability
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3: Compliance Results Ledger ───────────────────────────────────────

interface Step3Props {
  selected: Set<PlasticCategory>
  weights: Record<PlasticCategory, string>
  onBack: () => void
  onGoToExchange: () => void
}

function Step3({ selected, weights, onBack, onGoToExchange }: Step3Props) {
  const selectedCats = CATEGORIES.filter(c => selected.has(c.id))

  const rows = selectedCats.map(cat => {
    const kg = parseFloat(weights[cat.id]) || 0
    const liabilityKg = calculateLiability(cat.id, kg)
    const costRange = estimateCostRange(cat.id, liabilityKg)
    return { ...cat, kg, liabilityKg, costRange }
  })

  const totalMarketKg = rows.reduce((s, r) => s + r.kg, 0)
  const totalLiabilityKg = rows.reduce((s, r) => s + r.liabilityKg, 0)
  const totalMinCost = rows.reduce((s, r) => s + r.costRange.min, 0)
  const totalMaxCost = rows.reduce((s, r) => s + r.costRange.max, 0)
  const platformFee = Math.round(totalMinCost * 0.05)
  const avgRatePerKg =
    totalLiabilityKg > 0
      ? Math.round((totalMinCost + totalMaxCost) / 2 / totalLiabilityKg)
      : 0

  const calcId = useMemo(() => {
    const year = new Date().getFullYear()
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
    return `EPR-${year}-${rand}`
  }, [])

  return (
    <div id="ledger-printable">
      {/* Desktop progress header */}
      <div className="hidden md:block mb-6 print:hidden">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="font-data text-[11px] text-primary uppercase tracking-widest block mb-1">
              Liability Calculator
            </span>
            <h1 className="text-2xl font-['Geist'] font-semibold tracking-tight text-on-surface">
              Compliance Results Ledger
            </h1>
          </div>
          <span className="font-data text-sm text-on-surface-variant">
            Step <span className="text-primary font-bold">3</span> / 3
          </span>
        </div>
        <div className="h-1.5 w-full bg-[--color-border-zinc] rounded-full overflow-hidden">
          <div className="h-full w-full bg-primary rounded-full transition-all duration-500 ease-out" />
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-data text-[11px] text-primary font-bold">Category</span>
          <span className="font-data text-[11px] text-primary font-bold">Inventory</span>
          <span className="font-data text-[11px] text-primary font-bold">Summary</span>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden mb-6 print:hidden">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-2xl font-['Geist'] font-semibold tracking-tight text-on-surface">Results Ledger</h1>
          <span className="font-data text-[11px] text-primary px-3 py-1 bg-success-emerald-light rounded-full font-semibold">
            STEP 3 / 3
          </span>
        </div>
        <p className="text-sm text-on-surface-variant">Final liability assessment based on your inventory inputs.</p>
      </div>

      <MobileStepDots step={3} />

      {/* Bento summary cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Left: total liability (white card, 2-col on lg) */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <p className="font-data text-[11px] text-on-surface-variant uppercase tracking-wider mb-4">
              Final Computed Liability
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-[42px] font-['Geist'] font-bold tracking-tight text-on-surface leading-none">
                {intl.format(Math.round(totalLiabilityKg))}
              </span>
              <span className="font-data text-base text-on-surface-variant">kg</span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3 relative z-10">
            <div className="flex items-center gap-2 px-3 py-1 bg-success-emerald-light text-primary rounded-full border border-primary/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="font-data text-[11px] font-semibold">CPCB VERIFIED LOGIC</span>
            </div>
            <span className="font-data text-[11px] text-on-surface-variant">ID: {calcId}</span>
          </div>
          <TrendingUp className="absolute -right-4 -top-4 h-32 w-32 text-on-surface opacity-[0.03] pointer-events-none" />
        </div>

        {/* Right: estimated cost (dark card) */}
        <div className="bg-inverse-surface rounded-lg p-6 flex flex-col justify-between">
          <div>
            <p className="font-data text-[11px] text-zinc-400 uppercase tracking-wider mb-4">
              Estimated Credit Cost
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-[28px] font-['Geist'] font-bold text-emerald-400 leading-none">
                {fmtRs(totalMinCost)}
              </span>
            </div>
            <span className="font-data text-xs text-zinc-500">to {fmtRs(totalMaxCost)}</span>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between font-data text-[11px]">
              <span className="text-zinc-400">Avg. Market Rate</span>
              <span className="text-white font-bold">{fmtRs(avgRatePerKg)} / kg</span>
            </div>
            <div className="flex justify-between font-data text-[11px]">
              <span className="text-zinc-400">Platform Fee (5%)</span>
              <span className="text-white font-bold">{fmtRs(platformFee)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: 2-col info bento */}
      <div className="md:hidden grid grid-cols-2 gap-3 mb-6">
        <div className="bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg p-4">
          <p className="font-data text-[11px] text-on-surface-variant uppercase tracking-wide mb-1">Plastic Types</p>
          <p className="text-sm font-semibold text-on-surface leading-snug">
            {selectedCats.map(c => c.label).join(', ')}
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg p-4">
          <p className="font-data text-[11px] text-on-surface-variant uppercase tracking-wide mb-1">Period</p>
          <p className="text-sm font-semibold text-on-surface">FY 2025–26</p>
        </div>
      </div>

      {/* Detailed category ledger */}
      <div className="bg-surface-container-lowest border border-[--color-border-zinc] rounded-lg overflow-hidden shadow-sm mb-6">
        <div className="bg-slate-100 border-b border-[--color-border-zinc] px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-4 w-4 text-on-surface-variant" />
            <span className="font-data text-sm font-bold text-on-surface tracking-wide">
              DETAILED CATEGORY LEDGER
            </span>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="hidden md:block px-2 py-0.5 bg-zinc-200 rounded font-data text-[10px] text-on-surface-variant hover:bg-zinc-300 transition-colors"
          >
            PDF_REPORT
          </button>
        </div>

        <div className="overflow-x-auto micro-grid">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[--color-border-zinc]">
                <th className="hidden md:table-cell px-6 py-4 font-data text-[11px] text-on-surface-variant uppercase tracking-wider bg-slate-50/80">
                  Category Code
                </th>
                <th className="px-6 py-4 font-data text-[11px] text-on-surface-variant uppercase tracking-wider bg-slate-50/80">
                  Packaging Material
                </th>
                <th className="hidden md:table-cell px-6 py-4 font-data text-[11px] text-on-surface-variant uppercase tracking-wider bg-slate-50/80 text-right">
                  Market Volume (kg)
                </th>
                <th className="hidden md:table-cell px-6 py-4 font-data text-[11px] text-on-surface-variant uppercase tracking-wider bg-slate-50/80 text-right">
                  Target %
                </th>
                <th className="px-6 py-4 font-data text-[11px] text-on-surface-variant uppercase tracking-wider bg-slate-50/80 text-right">
                  Liability (kg)
                </th>
                <th className="md:hidden px-6 py-4 font-data text-[11px] text-on-surface-variant uppercase tracking-wider bg-slate-50/80 text-right">
                  Est. Cost
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map(row => (
                <tr key={row.id} className="hover:bg-primary/5 transition-colors">
                  <td className="hidden md:table-cell px-6 py-4 font-data text-sm text-on-surface">
                    {CAT_CODES[row.id]}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-on-surface">{row.label}</span>
                      <span className="font-data text-[11px] text-on-surface-variant">{row.tableSubtitle}</span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 font-data text-sm text-right text-on-surface">
                    {intl.format(Math.round(row.kg))}
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 font-data text-sm text-right text-on-surface">
                    {row.targetPct}%
                  </td>
                  <td className="px-6 py-4 font-data text-sm text-right font-semibold text-primary">
                    {intl.format(Math.round(row.liabilityKg))}
                  </td>
                  <td className="md:hidden px-6 py-4 font-data text-sm text-right text-primary">
                    {fmtRs(row.costRange.min)}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 border-t-2 border-[--color-border-zinc]">
                <td className="hidden md:table-cell px-6 py-3 font-data text-[11px] text-on-surface-variant uppercase">
                  Total
                </td>
                <td className="px-6 py-3 font-data text-sm font-bold text-on-surface">Total Deficit</td>
                <td className="hidden md:table-cell px-6 py-3 font-data text-sm text-right text-on-surface">
                  {intl.format(Math.round(totalMarketKg))}
                </td>
                <td className="hidden md:table-cell px-6 py-3" />
                <td className="px-6 py-3 font-data text-sm text-right font-bold text-primary">
                  {intl.format(Math.round(totalLiabilityKg))} kg
                </td>
                <td className="md:hidden px-6 py-3 font-data text-sm text-right font-bold text-primary">
                  {fmtRs(totalMinCost)}+
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Penalty risk callout */}
      <div className="mb-6 p-4 bg-[--color-risk-red]/5 border border-[--color-risk-red]/20 rounded-lg flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-[--color-risk-red] shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-[--color-risk-red] mb-0.5">Penalty Risk</p>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Non-compliance with EPR targets may attract a penalty of up to{' '}
            <span className="font-semibold text-on-surface">₹15,00,000</span> plus{' '}
            <span className="font-semibold text-on-surface">₹10,000/day</span> until targets are resolved.
            Offset your deficit on the exchange to remain compliant.
          </p>
        </div>
      </div>

      {/* Mobile disclaimer */}
      <p className="md:hidden text-[11px] text-on-surface-variant leading-relaxed mb-4 italic">
        Calculations are based on CPCB PWM Rules 2016. Market prices are indicative and subject to exchange
        liquidity at the time of purchase.
      </p>

      {/* Desktop action bar */}
      <div className="hidden md:flex print:!hidden border-t border-[--color-border-zinc] pt-6 items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-sm group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Data Entry
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 border border-[--color-border-zinc] text-on-surface text-sm font-semibold rounded hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            Download Ledger
          </button>
          <button
            type="button"
            onClick={onGoToExchange}
            className="px-8 py-2.5 bg-primary text-on-primary text-sm font-semibold rounded flex items-center gap-2 hover:bg-primary-container transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Go to Exchange to Offset Deficit
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="md:hidden print:!hidden sticky bottom-0 -mx-6 -mb-6 bg-surface/90 backdrop-blur-md border-t border-[--color-border-zinc] p-4 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-4 h-12 border border-[--color-border-zinc] rounded-xl text-sm font-semibold text-on-surface hover:bg-zinc-100 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onGoToExchange}
          className="flex-1 h-12 bg-primary text-on-primary text-sm font-semibold rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
        >
          Proceed to Marketplace
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Wizard shell ─────────────────────────────────────────────────────────────

export function CalculatorWizard() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selected, setSelected] = useState<Set<PlasticCategory>>(new Set())
  const [weights, setWeights] = useState<Record<PlasticCategory, string>>({
    rigid: '',
    flexible: '',
    mlp: '',
  })
  const [subcategories, setSubcategories] = useState<Record<PlasticCategory, PlasticSubcategory>>({
    rigid: 'recycling',
    flexible: 'recycling',
    mlp: 'recycling',
  })
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  function toggleCategory(cat: PlasticCategory) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  function setWeight(cat: PlasticCategory, val: string) {
    setWeights(prev => ({ ...prev, [cat]: val }))
  }

  function setSubcategory(cat: PlasticCategory, val: PlasticSubcategory) {
    setSubcategories(prev => ({ ...prev, [cat]: val }))
  }

  // Applies an AI estimate: selects every category with a positive estimate,
  // pre-fills its market-kg weight, and advances to Step 2.
  function applyEstimate(est: Record<PlasticCategory, number>) {
    const next = new Set<PlasticCategory>()
    const nextWeights: Record<PlasticCategory, string> = { rigid: '', flexible: '', mlp: '' }
    for (const cat of ['rigid', 'flexible', 'mlp'] as PlasticCategory[]) {
      if (est[cat] > 0) {
        next.add(cat)
        nextWeights[cat] = String(Math.round(est[cat]))
      }
    }
    setSelected(next)
    setWeights(nextWeights)
    if (next.size > 0) setStep(2)
  }

  if (step === 1) {
    return (
      <Step1
        selected={selected}
        onToggle={toggleCategory}
        onEstimate={applyEstimate}
        onNext={() => setStep(2)}
        onCancel={() => router.push('/dashboard')}
        clock={clock}
      />
    )
  }

  if (step === 2) {
    return (
      <Step2
        selected={selected}
        weights={weights}
        subcategories={subcategories}
        onWeightChange={setWeight}
        onSubcategoryChange={setSubcategory}
        onNext={() => setStep(3)}
        onBack={() => setStep(1)}
      />
    )
  }

  return (
    <Step3
      selected={selected}
      weights={weights}
      onBack={() => setStep(2)}
      onGoToExchange={() => router.push('/dashboard/exchange')}
    />
  )
}
