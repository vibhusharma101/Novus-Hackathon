'use client'

import { useState } from 'react'
import { Sparkles, Loader2, ArrowRight, AlertTriangle, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlasticCategory } from '@/lib/epr/constants'

const EXAMPLES = [
  'We sell ~50,000 units/year of shampoo in 200ml rigid PET bottles, plus refill sachets in flexible film.',
  'A snack brand shipping 2 million chip packets a year in multi-layered foil packaging.',
]

type EstimateResponse = {
  rigid_kg: number
  flexible_kg: number
  mlp_kg: number
  rationale: string
}

export function AiEstimator({
  onEstimate,
}: {
  onEstimate: (est: Record<PlasticCategory, number>) => void
}) {
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState<string | null>(null)

  async function run() {
    const text = desc.trim()
    if (text.length < 3 || loading) return
    setLoading(true)
    setError(null)
    setApplied(null)
    try {
      const res = await fetch('/api/estimate-liability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text }),
      })
      if (!res.ok) throw new Error('failed')
      const data = (await res.json()) as EstimateResponse
      onEstimate({ rigid: data.rigid_kg, flexible: data.flexible_kg, mlp: data.mlp_kg })
      setApplied(data.rationale)
    } catch {
      setError('Could not estimate from that description. Try adding product types and volumes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-8 rounded-lg border border-secondary/30 bg-secondary/[0.03] overflow-hidden">
      <div className="px-5 py-3 border-b border-secondary/20 bg-secondary/[0.04] flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-secondary" />
        <span className="font-['Geist'] text-sm font-semibold text-on-surface">Estimate with AI</span>
        <span className="font-data text-[10px] text-on-surface-variant uppercase tracking-wide ml-auto">Optional</span>
      </div>

      <div className="p-5">
        <p className="text-sm text-on-surface-variant mb-3">
          Describe your business and packaging in plain English — the AI estimates your annual plastic volumes
          and pre-fills the calculator. You can adjust everything afterward.
        </p>

        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="e.g. We sell 50,000 units of shampoo a year in rigid PET bottles, plus refill sachets in flexible film…"
          className="w-full rounded-md border border-[--color-border-zinc] bg-surface-container-lowest px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-secondary focus:border-secondary resize-none"
        />

        <div className="flex flex-wrap gap-2 mt-2">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setDesc(ex)}
              className="text-[11px] text-on-surface-variant border border-[--color-border-zinc] rounded-full px-2.5 py-1 hover:border-secondary hover:text-secondary transition-colors"
            >
              Example {i + 1}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-[--color-risk-red] text-[13px]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {applied && (
          <div className="mt-3 flex items-start gap-2 rounded-md bg-success-emerald-light/40 border border-primary/20 px-3 py-2 text-[13px] text-on-surface">
            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span><span className="font-semibold text-primary">Pre-filled below.</span> {applied}</span>
          </div>
        )}

        <button
          type="button"
          onClick={run}
          disabled={loading || desc.trim().length < 3}
          className={cn(
            'mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md font-data text-sm font-semibold transition-all active:scale-[0.98]',
            'bg-secondary text-on-secondary hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Estimating…</>
          ) : (
            <>Estimate &amp; pre-fill <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </div>
  )
}
