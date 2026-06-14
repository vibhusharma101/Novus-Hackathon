'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowRight, CheckCircle2, ChevronDown, Loader2, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  buyerProfileSchema,
  type BuyerProfileInput,
  GSTIN_EXAMPLE,
  INDIAN_STATES,
} from '@/lib/validators/buyer'
import { createBrandProfile } from '@/lib/actions/buyer'

const inputBase =
  'w-full h-10 px-3 rounded-md border bg-white outline-none transition-all focus:ring-1 focus:ring-primary focus:border-primary'
const labelBase = 'block text-xs font-medium text-on-surface-variant mb-1.5'
const errorText = 'mt-1 text-[11px] text-[--color-risk-red]'

export function BuyerOnboardingForm() {
  const router = useRouter()
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BuyerProfileInput>({
    resolver: zodResolver(buyerProfileSchema),
    mode: 'onTouched',
  })

  async function onSubmit(values: BuyerProfileInput) {
    const result = await createBrandProfile(values)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    if (typeof pendo !== 'undefined') {
      pendo.track('buyer_onboarding_completed', {
        company_name: values.company_name,
        state: values.state,
        has_gstin: Boolean(values.gstin),
      })
    }
    // Success — show confirmed state briefly, then advance to the calculator (B3).
    setDone(true)
    router.push('/dashboard/calculator')
  }

  const busy = isSubmitting || done

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Identity */}
      <div className="space-y-4">
        <div>
          <label htmlFor="company_name" className={labelBase}>
            Brand / Company Name
          </label>
          <input
            id="company_name"
            type="text"
            placeholder="Enter legal business name"
            autoComplete="organization"
            className={cn(inputBase, errors.company_name ? 'border-[--color-risk-red]' : 'border-[--color-border-zinc]')}
            {...register('company_name')}
          />
          {errors.company_name && <p className={errorText}>{errors.company_name.message}</p>}
        </div>

        <div>
          <div className="flex justify-between items-end mb-1.5">
            <label htmlFor="gstin" className="text-xs font-medium text-on-surface-variant">
              GSTIN
            </label>
            <span className="font-data text-[11px] text-outline">Format: 15-digit</span>
          </div>
          <input
            id="gstin"
            type="text"
            placeholder={`e.g., ${GSTIN_EXAMPLE}`}
            autoComplete="off"
            className={cn(
              inputBase,
              'font-data uppercase tracking-wide',
              errors.gstin ? 'border-[--color-risk-red]' : 'border-[--color-border-zinc]'
            )}
            {...register('gstin')}
          />
          {errors.gstin ? (
            <p className={errorText}>{errors.gstin.message}</p>
          ) : (
            <p className="mt-1.5 font-data text-[11px] text-outline italic">
              15-digit GST number, e.g., {GSTIN_EXAMPLE}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-[--color-border-zinc]/60" />

      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="contact_name" className={labelBase}>
            Contact Person Name
          </label>
          <input
            id="contact_name"
            type="text"
            placeholder="Full Name"
            autoComplete="name"
            className={cn(inputBase, errors.contact_name ? 'border-[--color-risk-red]' : 'border-[--color-border-zinc]')}
            {...register('contact_name')}
          />
          {errors.contact_name && <p className={errorText}>{errors.contact_name.message}</p>}
        </div>

        <div>
          <label htmlFor="phone" className={labelBase}>
            Phone Number
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline">+91</span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              autoComplete="tel-national"
              className={cn(
                inputBase,
                'pl-12 font-data',
                errors.phone ? 'border-[--color-risk-red]' : 'border-[--color-border-zinc]'
              )}
              {...register('phone')}
            />
          </div>
          {errors.phone && <p className={errorText}>{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="email" className={labelBase}>
            Official Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="name@company.com"
            autoComplete="email"
            className={cn(inputBase, errors.email ? 'border-[--color-risk-red]' : 'border-[--color-border-zinc]')}
            {...register('email')}
          />
          {errors.email && <p className={errorText}>{errors.email.message}</p>}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="state" className={labelBase}>
            Registration State
          </label>
          <div className="relative">
            <select
              id="state"
              defaultValue=""
              className={cn(
                inputBase,
                'appearance-none pr-10',
                errors.state ? 'border-[--color-risk-red]' : 'border-[--color-border-zinc]'
              )}
              {...register('state')}
            >
              <option value="" disabled>
                Select State
              </option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-outline pointer-events-none" />
          </div>
          {errors.state && <p className={errorText}>{errors.state.message}</p>}
        </div>
      </div>

      {/* CTA */}
      <div className="pt-4 space-y-4">
        <button
          type="submit"
          disabled={busy}
          className={cn(
            'w-full h-12 rounded-md flex items-center justify-center gap-2 text-base font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed',
            done
              ? 'bg-[--color-success-emerald-light] text-primary'
              : 'bg-primary text-on-primary hover:bg-primary-container disabled:opacity-80'
          )}
        >
          {done ? (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Account Created
            </>
          ) : isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing…
            </>
          ) : (
            <>
              Create Account &amp; Calculate Liability
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        <div className="flex gap-3 p-4 bg-surface-container-low rounded-md border border-[--color-border-zinc]/60">
          <ShieldCheck className="h-[18px] w-[18px] shrink-0 text-primary" />
          <p className="text-[11px] leading-relaxed text-on-surface-variant">
            Your GSTIN is used exclusively to transfer credits securely on the official CPCB portal.
            We never share your commercial data.
          </p>
        </div>
      </div>
    </form>
  )
}
