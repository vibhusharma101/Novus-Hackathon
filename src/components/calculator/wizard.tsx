'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package2, Layers, LayoutGrid, ShieldCheck, ArrowRight, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlasticCategory } from '@/lib/epr/constants'

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORIES = [
  {
    id: 'rigid' as PlasticCategory,
    code: 'RIG-2024',
    label: 'Rigid Plastic',
    subtitle: 'Cat I — HDPE, PET, PP Containers & Bottles',
    Icon: Package2,
    targetPct: 30,
    description:
      'Compliance for rigid plastic packaging including bottles, containers, and rigid films as per PWM Rules 2016 and subsequent amendments.',
    liquidity: 'HIGH' as const,
    volatilityIndex: '0.14',
  },
  {
    id: 'flexible' as PlasticCategory,
    code: 'FLX-2024',
    label: 'Flexible Plastic',
    subtitle: 'Cat II — Films, Pouches & Wrapping',
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
    label: 'Multi-Layer Plastic',
    subtitle: 'Cat III — Laminated & Composite Packaging',
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

// ─── Step 1: Category Selection ───────────────────────────────────────────────

interface Step1Props {
  selected: Set<PlasticCategory>
  onToggle: (cat: PlasticCategory) => void
  onNext: () => void
  onCancel: () => void
  clock: string
}

function Step1({ selected, onToggle, onNext, onCancel, clock }: Step1Props) {
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
          <span className="font-data text-sm text-on-surface-variant">
            Step <span className="text-primary font-bold">1</span> / 3
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-[--color-border-zinc] rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: '33.33%' }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-data text-[11px] text-primary font-bold">Category</span>
          <span className="font-data text-[11px] text-outline">Inventory</span>
          <span className="font-data text-[11px] text-outline">Summary</span>
        </div>
      </div>

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
                  ? 'border-primary ring-1 ring-primary bg-[#006948]/[0.02] hover:bg-[#006948]/[0.04]'
                  : 'border-[--color-border-zinc] bg-surface-container-lowest hover:bg-surface-container-low',
              )}
            >
              {/* Icon + badges row */}
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
                      'font-data text-[11px] px-2 py-0.5 rounded border font-semibold',
                      isSelected
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container text-on-surface-variant border-[--color-border-zinc]',
                    )}
                  >
                    {targetPct}%
                  </span>
                </div>
              </div>

              {/* Label + subtitle + description */}
              <h3 className="text-[18px] font-['Geist'] font-semibold text-on-surface mb-1 leading-snug">
                {label}
              </h3>
              <p className="font-data text-[11px] text-on-surface-variant mb-3">{subtitle}</p>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-6">{description}</p>

              {/* Stats block */}
              <div className="mt-auto pt-4 border-t border-[--color-border-zinc]/60">
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span className="font-data text-[11px] text-on-surface font-semibold tracking-wider">
                    CPCB VERIFIED SCOPE
                  </span>
                </div>
                <ul className="space-y-1">
                  <li className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">Market Liquidity</span>
                    <span className={cn('font-data text-[11px] font-semibold', LIQUIDITY_COLOR[liquidity])}>
                      {liquidity}
                    </span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-xs text-on-surface-variant">Volatility Index</span>
                    <span className="font-data text-[11px] text-secondary">{volatilityIndex}</span>
                  </li>
                </ul>
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

      {/* Terminal Status Footer — bleeds to layout edges via negative margin */}
      <div className="-mx-6 -mb-6 px-8 py-4 bg-inverse-surface shadow-xl border-t border-zinc-800">
        <div className="flex justify-between items-center max-w-6xl">
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

// ─── Wizard shell (manages step + shared state) ───────────────────────────────

export function CalculatorWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<Set<PlasticCategory>>(new Set())
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

  if (step === 1) {
    return (
      <Step1
        selected={selected}
        onToggle={toggleCategory}
        onNext={() => setStep(2)}
        onCancel={() => router.push('/dashboard')}
        clock={clock}
      />
    )
  }

  // Step 2 and 3 wired in when designs arrive
  return null
}
