'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  ArrowRight, ChevronDown, Loader2, UploadCloud,
  CheckCircle2, RefreshCw, ScanLine,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  sellerProfileSchema,
  type SellerProfileInput,
  CPCB_REG_EXAMPLE,
  INDIAN_STATES,
} from '@/lib/validators/seller'
import { createRecyclerProfile } from '@/lib/actions/seller'

const inputBase =
  'w-full h-10 px-3 rounded-md border bg-white outline-none transition-all focus:ring-1 focus:ring-primary focus:border-primary'
const labelBase = 'block font-data text-[11px] uppercase tracking-wide text-on-surface-variant mb-1.5'
const errorText = 'mt-1 text-[11px] text-[--color-risk-red]'

type VerifyStep = 0 | 1 | 2 | 3

export function SellerOnboardingForm() {
  const router = useRouter()
  const [verifyStep, setVerifyStep] = useState<VerifyStep | null>(null)
  const [docName, setDocName] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SellerProfileInput>({
    resolver: zodResolver(sellerProfileSchema),
    mode: 'onTouched',
  })

  // Plays the simulated CPCB verification sequence, then routes to the vault.
  function runVerification() {
    setVerifyStep(1)
    setTimeout(() => setVerifyStep(2), 1100)
    setTimeout(() => setVerifyStep(3), 2400)
    setTimeout(() => router.push('/seller/vault'), 3600)
  }

  async function onSubmit(values: SellerProfileInput) {
    const result = await createRecyclerProfile(values)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    if (typeof pendo !== 'undefined') {
      pendo.track('seller_onboarding_completed', {
        company_name: values.company_name,
        state: values.state,
        capacity_mt: values.capacity_mt,
        has_document_uploaded: Boolean(docName),
      })
    }
    runVerification()
  }

  const busy = isSubmitting || verifyStep !== null

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Company Name */}
          <div className="md:col-span-2">
            <label htmlFor="company_name" className={labelBase}>Company Name</label>
            <input
              id="company_name"
              type="text"
              placeholder="Legal entity name"
              autoComplete="organization"
              className={cn(inputBase, errors.company_name ? 'border-[--color-risk-red]' : 'border-[--color-border-zinc]')}
              {...register('company_name')}
            />
            {errors.company_name && <p className={errorText}>{errors.company_name.message}</p>}
          </div>

          {/* CPCB Reg No */}
          <div>
            <label htmlFor="cpcb_reg_no" className={labelBase}>CPCB PWP Registration No.</label>
            <input
              id="cpcb_reg_no"
              type="text"
              placeholder={`e.g. ${CPCB_REG_EXAMPLE}`}
              autoComplete="off"
              className={cn(inputBase, 'font-data uppercase tracking-wide', errors.cpcb_reg_no ? 'border-[--color-risk-red]' : 'border-[--color-border-zinc]')}
              {...register('cpcb_reg_no')}
            />
            {errors.cpcb_reg_no && <p className={errorText}>{errors.cpcb_reg_no.message}</p>}
          </div>

          {/* Operating State */}
          <div>
            <label htmlFor="state" className={labelBase}>Operating State</label>
            <div className="relative">
              <select
                id="state"
                defaultValue=""
                className={cn(inputBase, 'appearance-none pr-10', errors.state ? 'border-[--color-risk-red]' : 'border-[--color-border-zinc]')}
                {...register('state')}
              >
                <option value="" disabled>Select State</option>
                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
            </div>
            {errors.state && <p className={errorText}>{errors.state.message}</p>}
          </div>

          {/* Capacity */}
          <div>
            <label htmlFor="capacity_mt" className={labelBase}>Annual Capacity (MT)</label>
            <div className="relative">
              <input
                id="capacity_mt"
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                className={cn(inputBase, 'font-data pr-12', errors.capacity_mt ? 'border-[--color-risk-red]' : 'border-[--color-border-zinc]')}
                {...register('capacity_mt', { valueAsNumber: true })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-data text-[11px] text-on-surface-variant">MT</span>
            </div>
            {errors.capacity_mt && <p className={errorText}>{errors.capacity_mt.message}</p>}
          </div>

          {/* Contact Name */}
          <div>
            <label htmlFor="contact_name" className={labelBase}>Contact Name</label>
            <input
              id="contact_name"
              type="text"
              placeholder="Full name"
              autoComplete="name"
              className={cn(inputBase, errors.contact_name ? 'border-[--color-risk-red]' : 'border-[--color-border-zinc]')}
              {...register('contact_name')}
            />
            {errors.contact_name && <p className={errorText}>{errors.contact_name.message}</p>}
          </div>

          {/* WhatsApp */}
          <div className="md:col-span-2">
            <label htmlFor="whatsapp" className={labelBase}>WhatsApp Number</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline">+91</span>
              <input
                id="whatsapp"
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                autoComplete="tel-national"
                className={cn(inputBase, 'pl-12 font-data', errors.whatsapp ? 'border-[--color-risk-red]' : 'border-[--color-border-zinc]')}
                {...register('whatsapp')}
              />
            </div>
            {errors.whatsapp && <p className={errorText}>{errors.whatsapp.message}</p>}
          </div>

          {/* Document upload (visual — not persisted; verification is simulated) */}
          <div className="md:col-span-2">
            <label htmlFor="doc" className={labelBase}>Registration Document (PDF)</label>
            <label
              htmlFor="doc"
              className="border-2 border-dashed border-[--color-border-zinc] rounded-lg p-7 flex flex-col items-center justify-center bg-surface-container-low hover:bg-white hover:border-primary transition-all cursor-pointer group text-center"
            >
              <UploadCloud className="h-6 w-6 text-outline group-hover:text-primary mb-2 transition-colors" />
              {docName ? (
                <p className="text-sm text-on-surface font-medium">{docName}</p>
              ) : (
                <>
                  <p className="text-sm text-on-surface">Drag &amp; drop registration certificate</p>
                  <p className="text-[11px] text-on-surface-variant mt-1">PDF · max 10MB</p>
                </>
              )}
              <input
                id="doc"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => setDocName(e.target.files?.[0]?.name ?? null)}
              />
            </label>
          </div>
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={busy}
          className="w-full h-12 rounded-md flex items-center justify-center gap-2 text-base font-semibold bg-primary text-on-primary hover:bg-primary-container transition-all active:scale-[0.98] disabled:opacity-80 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</>
          ) : (
            <>Complete Registration &amp; Verify <ArrowRight className="h-5 w-5" /></>
          )}
        </button>
      </form>

      {/* ── Verification overlay ── */}
      {verifyStep !== null && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/85 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-surface-container-lowest border border-[--color-border-zinc] rounded-xl overflow-hidden shadow-2xl">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
              <h3 className="font-['Geist'] text-lg font-semibold text-on-surface mb-1">Terminal Verification</h3>
              <p className="font-data text-[11px] text-on-surface-variant mb-6 uppercase tracking-wide">
                Secure Channel · Encrypted
              </p>

              <div className="w-full space-y-3 text-left font-data text-sm">
                <VerifyRow
                  icon={<RefreshCw className="h-4 w-4" />}
                  label="Checking format structure…"
                  active={verifyStep >= 1}
                  done={verifyStep > 1}
                />
                <VerifyRow
                  icon={<ScanLine className="h-4 w-4" />}
                  label="Validating document string…"
                  active={verifyStep >= 2}
                  done={verifyStep > 2}
                />
                <VerifyRow
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Confirmed: Terminal-Verified ✓"
                  active={verifyStep >= 3}
                  done={verifyStep >= 3}
                  final
                />
              </div>
            </div>
            <div className="bg-surface-container-low border-t border-[--color-border-zinc] p-3 text-center">
              <span className="font-data text-[10px] text-on-surface-variant uppercase tracking-[0.2em]">
                Authenticating with Central Registry…
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function VerifyRow({
  icon, label, active, done, final = false,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  done: boolean
  final?: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 transition-all duration-300',
        active ? (final || done ? 'text-primary opacity-100' : 'text-on-surface opacity-100') : 'text-on-surface-variant opacity-30',
        final && active && 'font-bold',
      )}
    >
      <span className={cn('shrink-0', active && !done && !final && 'animate-spin')}>{icon}</span>
      <span>{label}</span>
    </div>
  )
}
