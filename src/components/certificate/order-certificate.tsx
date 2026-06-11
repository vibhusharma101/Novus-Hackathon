'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, Copy, Download, LayoutDashboard,
  ShieldCheck, Gavel, Lock, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlasticCategory } from '@/lib/epr/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CertificateProps = {
  order: {
    id: string
    category: PlasticCategory
    qty_kg: number
    created_at: string
    status: string
  }
  recycler: { company_name: string; cpcb_reg_no: string; state: string } | null
  brand: { company_name: string; gstin: string; state: string } | null
  referenceId: string
  compliance: {
    targetKg: number
    acquiredKg: number
    pct: number
    deltaPct: number
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const intlKg = new Intl.NumberFormat('en-IN')
const fmtKg  = (n: number) => `${intlKg.format(Math.round(n))} KG`

const CAT_LABELS: Record<PlasticCategory, string> = {
  rigid:    'Category I: Rigid Plastic',
  flexible: 'Category II: Flexible Packaging',
  mlp:      'Category III: Multi-Layered Plastic',
}

function fmtExecutionDate(iso: string): string {
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  return `${date} | ${time} IST`
}

// Short pseudo-hash for the "audit hash" display line (cosmetic, deterministic)
function shortHash(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const hex = h.toString(16).padStart(8, '0')
  return `${hex.slice(0, 4)}…${hex.slice(4)}-${seed.slice(0, 4)}`
}

// ─── Compliance donut ─────────────────────────────────────────────────────────

function ComplianceDonut({ pct, size, stroke }: { pct: number; size: number; stroke: number }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const targetOffset = circumference * (1 - Math.min(pct, 100) / 100)

  // Animate from empty → target on mount
  const [offset, setOffset] = useState(circumference)
  useEffect(() => {
    const t = requestAnimationFrame(() => setOffset(targetOffset))
    return () => cancelAnimationFrame(t)
  }, [targetOffset, circumference])

  return (
    <svg width={size} height={size} className="-rotate-90" viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="transparent" stroke="#e2e8f0" strokeWidth={stroke}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="transparent" stroke="#006948" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
    </svg>
  )
}

// ─── Certificate ──────────────────────────────────────────────────────────────

export function OrderCertificate({
  order,
  recycler,
  brand,
  referenceId,
  compliance,
}: CertificateProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const txnId = `EPRX-${order.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12)}`

  function copyTxn() {
    navigator.clipboard?.writeText(txnId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const purchaserName  = brand?.company_name ?? 'Your Company'
  const purchaserReg   = brand?.gstin ? `GSTIN: ${brand.gstin}` : '—'
  const sellerName     = recycler?.company_name ?? '—'
  const sellerReg      = recycler?.cpcb_reg_no ? `Reg No: ${recycler.cpcb_reg_no}` : '—'

  return (
    <div className="-m-6 min-h-full micro-grid bg-background">
      <div className="px-6 py-8 lg:py-12 max-w-[1440px] mx-auto">

        {/* ── Success header ── */}
        <div className="flex flex-col items-center text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-16 h-16 bg-success-emerald-light rounded-full flex items-center justify-center mb-5 border-2 border-primary">
            <CheckCircle2 className="h-9 w-9 text-primary" strokeWidth={2} />
          </div>
          <h1 className="font-['Geist'] text-3xl md:text-4xl font-bold text-on-surface mb-3 tracking-tight">
            Order Placed Successfully
          </h1>
          <button
            type="button"
            onClick={copyTxn}
            className="bg-surface-container-low border border-[--color-outline-variant] px-4 py-2 rounded-lg flex items-center gap-2 hover:border-primary transition-colors group"
          >
            <span className="font-data text-[10px] text-on-surface-variant uppercase tracking-widest">TXN ID:</span>
            <span className={cn('font-data text-sm font-bold', copied ? 'text-secondary' : 'text-primary')}>
              {copied ? 'COPIED TO CLIPBOARD' : txnId}
            </span>
            <Copy className="h-3.5 w-3.5 text-on-surface-variant group-hover:text-primary transition-colors" />
          </button>
        </div>

        {/* ── Bento grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* ── Left: Compliance impact + actions ── */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Compliance impact card */}
            <section className="bg-surface-container-lowest border border-[--color-border-zinc] rounded-xl p-8 flex flex-col items-center relative overflow-hidden">
              <span className="absolute top-4 left-4 font-data text-[10px] text-outline uppercase tracking-tight">
                Metric // Compliance
              </span>
              <h2 className="font-['Geist'] text-lg font-semibold text-on-surface mb-6 mt-2">
                Compliance Impact
              </h2>

              <div className="relative w-56 h-56 flex items-center justify-center">
                <ComplianceDonut pct={compliance.pct} size={224} stroke={22} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-['Geist'] text-4xl font-bold text-primary leading-none">
                    {compliance.pct}%
                  </span>
                  <span className="font-data text-[11px] text-on-surface-variant uppercase mt-1">
                    {compliance.deltaPct > 0 ? `+${compliance.deltaPct}% Δ` : 'Compliant'}
                  </span>
                </div>
              </div>

              <div className="mt-6 w-full grid grid-cols-2 gap-4 border-t border-[--color-outline-variant] pt-5">
                <div>
                  <p className="font-data text-[11px] text-on-surface-variant mb-1 uppercase">Target Volume</p>
                  <p className="font-data text-base font-semibold text-on-surface">{fmtKg(compliance.targetKg)}</p>
                </div>
                <div className="text-right">
                  <p className="font-data text-[11px] text-on-surface-variant mb-1 uppercase">Acquired Total</p>
                  <p className="font-data text-base font-semibold text-primary">{fmtKg(compliance.acquiredKg)}</p>
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full bg-primary py-4 rounded-xl text-on-primary font-['Geist'] font-semibold flex items-center justify-center gap-3 hover:bg-primary-container transition-all active:scale-[0.98]"
              >
                <Download className="h-5 w-5" />
                Download PDF Certificate
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="w-full border border-primary text-primary py-4 rounded-xl font-['Geist'] font-semibold flex items-center justify-center gap-3 hover:bg-success-emerald-light transition-all active:scale-[0.98]"
              >
                <LayoutDashboard className="h-5 w-5" />
                Return to Dashboard
              </button>
            </div>
          </div>

          {/* ── Right: Provisional certificate ── */}
          <div className="lg:col-span-7">
            <section
              id="cert-printable"
              className="bg-white border-2 border-zinc-900 rounded-lg shadow-xl p-6 md:p-10 relative overflow-hidden"
            >
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                <ShieldCheck className="h-[400px] w-[400px]" strokeWidth={1} />
              </div>

              <div className="relative z-10">
                {/* Cert header */}
                <div className="flex justify-between items-start mb-8 md:mb-10">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-7 w-7 text-zinc-900" />
                      <h3 className="font-['Geist'] text-xl md:text-2xl font-extrabold uppercase tracking-tight text-zinc-900">
                        EPRx Certificate
                      </h3>
                    </div>
                    <p className="font-data text-[10px] text-zinc-500 uppercase tracking-widest">
                      Credit Acquisition Document
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end shrink-0">
                    <div className="px-2 py-1 border border-zinc-900 inline-block font-data text-[10px] font-bold bg-zinc-900 text-white mb-2 uppercase tracking-wider">
                      Provisional
                    </div>
                    <p className="font-data text-[11px] text-zinc-500">ID: {referenceId}</p>
                  </div>
                </div>

                {/* Cert body */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 md:gap-y-8 gap-x-10 border-t border-zinc-100 pt-8 md:pt-10">
                  <div>
                    <label className="font-data text-[10px] text-zinc-400 uppercase block mb-1">Purchaser Entity</label>
                    <p className="font-['Geist'] text-base font-bold text-zinc-900">{purchaserName}</p>
                    <p className="font-data text-[11px] text-zinc-500 mt-0.5">{purchaserReg}</p>
                  </div>
                  <div>
                    <label className="font-data text-[10px] text-zinc-400 uppercase block mb-1">Seller Entity</label>
                    <p className="font-['Geist'] text-base font-bold text-zinc-900">{sellerName}</p>
                    <p className="font-data text-[11px] text-zinc-500 mt-0.5">{sellerReg}</p>
                  </div>
                  <div>
                    <label className="font-data text-[10px] text-zinc-400 uppercase block mb-1">Waste Category</label>
                    <p className="font-data text-base text-zinc-900">{CAT_LABELS[order.category]}</p>
                  </div>
                  <div>
                    <label className="font-data text-[10px] text-zinc-400 uppercase block mb-1">Volume Verified</label>
                    <p className="font-['Geist'] text-3xl md:text-4xl font-bold text-primary tracking-tight">
                      {intlKg.format(Math.round(order.qty_kg))}
                      <span className="text-base font-semibold ml-1">KG</span>
                    </p>
                  </div>
                  <div>
                    <label className="font-data text-[10px] text-zinc-400 uppercase block mb-1">Execution Date</label>
                    <p className="font-data text-sm text-zinc-900">{fmtExecutionDate(order.created_at)}</p>
                  </div>
                </div>

                {/* Footer legal + signature */}
                <div className="mt-10 md:mt-14 pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                  <p className="max-w-md font-data text-[11px] text-zinc-500 italic leading-relaxed">
                    This document serves as an official provisional proof of EPR credit acquisition under the
                    Plastic Waste Management Rules 2016. The final certificate will be synchronized with the
                    CPCB Central Portal within 24 hours of seller transfer and audit clearance.
                  </p>
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="w-32 h-14 border-b border-zinc-300 flex items-center justify-center">
                      <span className="font-['Geist'] text-2xl text-zinc-700 italic" style={{ fontFamily: 'cursive' }}>
                        EPRx
                      </span>
                    </div>
                    <span className="font-data text-[10px] text-zinc-400 uppercase tracking-widest">
                      Digital Auth. Signature
                    </span>
                  </div>
                </div>

                {/* Audit badge */}
                <div className="mt-8 flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded">
                  <div className="bg-zinc-900 text-white p-2 rounded shrink-0">
                    <Gavel className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-data text-[11px] font-bold text-zinc-900">CPCB AUDIT READY</p>
                    <p className="font-data text-[11px] text-zinc-500 truncate">Hash: {shortHash(order.id)}</p>
                  </div>
                  <Lock className="ml-auto h-4 w-4 text-zinc-400 shrink-0" />
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                </div>
              </div>
            </section>

            {/* Provisional notice (screen only) */}
            <div className="mt-4 flex items-center gap-2 px-2 print:hidden">
              <FileText className="h-3.5 w-3.5 text-on-surface-variant" />
              <p className="font-data text-[11px] text-on-surface-variant">
                Order status: <span className="font-bold uppercase">{order.status}</span> — final certificate issues once the seller confirms the credit transfer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
