'use client'

import { useEffect, useRef } from 'react'

const TICKS = [
  { label: 'RIGID', price: '₹12.80', change: '+0.30', up: true },
  { label: 'FLEXIBLE', price: '₹15.40', change: '+0.60', up: true },
  { label: 'MLP', price: '₹17.20', change: '-0.20', up: false },
  { label: 'RIGID (MH)', price: '₹13.10', change: '+0.45', up: true },
  { label: 'FLEXIBLE (DL)', price: '₹16.00', change: '+0.80', up: true },
  { label: 'MLP (KA)', price: '₹18.50', change: '+1.10', up: true },
  { label: 'RIGID (GJ)', price: '₹12.60', change: '-0.10', up: false },
  { label: 'FLEXIBLE (TN)', price: '₹15.90', change: '+0.50', up: true },
]

export function MarqueeTicker() {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const clone = track.cloneNode(true) as HTMLDivElement
    clone.setAttribute('aria-hidden', 'true')
    track.parentElement?.appendChild(clone)
  }, [])

  return (
    <div className="overflow-hidden border-y border-outline-variant bg-surface-container-lowest py-2.5 select-none">
      <div className="flex w-max animate-[marquee_28s_linear_infinite]" ref={trackRef}>
        {TICKS.map((t) => (
          <span key={t.label} className="mx-6 flex items-center gap-2 whitespace-nowrap">
            <span className="text-xs font-semibold tracking-widest text-on-surface-variant uppercase">
              {t.label}
            </span>
            <span className="font-data text-sm font-medium text-on-surface">{t.price}/kg</span>
            <span
              className={`font-data text-xs font-medium ${t.up ? 'text-primary' : 'text-[--color-risk-red]'}`}
            >
              {t.change}
            </span>
            <span className="text-outline-variant">·</span>
          </span>
        ))}
      </div>
    </div>
  )
}
