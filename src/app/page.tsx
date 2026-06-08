import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MarqueeTicker } from '@/components/landing/marquee-ticker'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Nav />
      <main className="flex-1">
        <HeroSection />
        <MarqueeTicker />
        <TrustBadges />
        <HowItWorks />
        <CalculatorPreview />
        <OrderBookPreview />
        <FraudShield />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  )
}

/* ── Navigation ─────────────────────────────────────────── */
function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface-container-lowest/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center">
            <span className="text-on-primary font-bold text-xs">E</span>
          </div>
          <span className="font-semibold text-on-surface tracking-tight">EPRx Exchange</span>
          <span className="hidden sm:inline-block ml-2 rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-semibold tracking-wider text-on-surface-variant uppercase">
            Beta
          </span>
        </div>
        <nav className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ size: 'sm' }))}
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  )
}

/* ── Hero ───────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section className="micro-grid relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        <div className="max-w-3xl">
          {/* eyebrow */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-medium text-on-surface-variant">
              India's only zero-markup EPR credit exchange
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
            Trade EPR credits.
            <br />
            <span className="text-primary">Stay compliant.</span>
          </h1>
          <p className="mt-6 text-lg text-on-surface-variant max-w-xl leading-relaxed">
            Connect directly with CPCB-verified plastic waste processors. Calculate your
            liability, buy credits, and receive your provisional compliance certificate — in minutes.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/sign-up?role=buyer" className={cn(buttonVariants({ size: 'lg' }))}>
              I'm a Brand
              <ArrowRight />
            </Link>
            <Link
              href="/sign-up?role=seller"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
            >
              I'm a Recycler / PWP
            </Link>
          </div>

          {/* micro trust row */}
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-on-surface-variant">
            <TrustPill icon="shield" text="CPCB-licensed sellers only" />
            <TrustPill icon="percent" text="5% platform fee — zero broker markup" />
            <TrustPill icon="clock" text="Certificate in &lt; 5 min" />
          </div>
        </div>
      </div>

      {/* decorative gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-surface-container/60 to-transparent"
      />
    </section>
  )
}

function TrustPill({ icon, text }: { icon: string; text: string }) {
  const icons: Record<string, string> = {
    shield: '🛡',
    percent: '%',
    clock: '⏱',
  }
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-primary font-semibold">{icons[icon]}</span>
      {text}
    </span>
  )
}

function ArrowRight() {
  return (
    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

/* ── Trust Badges ───────────────────────────────────────── */
function TrustBadges() {
  const badges = [
    {
      icon: '✓',
      title: 'CPCB-Verified Sellers',
      desc: 'Every recycler carries a live CPCB registration number, verified at onboarding before any listing goes live.',
    },
    {
      icon: '₹',
      title: 'Zero Broker Markup',
      desc: 'Prices set by recyclers, visible to all buyers. Our only revenue is the transparent 5% platform fee shown at checkout.',
    },
    {
      icon: '📄',
      title: 'Provisional Certificate',
      desc: 'Successful transfer triggers a machine-readable certificate with a unique reference ID — ready for your CPCB filing.',
    },
    {
      icon: '⚡',
      title: 'Real-Time Order Book',
      desc: 'New listings appear instantly across all buyer windows. No refresh needed — powered by Supabase Realtime.',
    },
  ]

  return (
    <section className="border-b border-outline-variant bg-surface-container-lowest py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <h2 className="text-center text-xs font-semibold tracking-widest text-on-surface-variant uppercase mb-10">
          Built for compliance, designed for trust
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {badges.map((b) => (
            <div key={b.title} className="tonal-layer-1 rounded-lg p-5">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-lg text-primary font-bold">
                {b.icon}
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-on-surface">{b.title}</h3>
              <p className="text-xs leading-relaxed text-on-surface-variant">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── How it works ───────────────────────────────────────── */
function HowItWorks() {
  const buyerSteps = [
    { n: '01', label: 'Calculate liability', sub: '3-step wizard — paste your annual plastic volumes' },
    { n: '02', label: 'Browse live listings', sub: 'Filter by category, price, and state' },
    { n: '03', label: 'Checkout & pay', sub: 'Credits cost + 5% fee, reviewed before confirm' },
    { n: '04', label: 'Download certificate', sub: 'Provisional CPCB certificate issued instantly' },
  ]

  return (
    <section className="py-16 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex items-baseline gap-3">
          <h2 className="text-2xl font-bold text-on-surface">How it works</h2>
          <span className="text-sm text-on-surface-variant">— for Brands</span>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {buyerSteps.map((s) => (
            <li key={s.n} className="flex flex-col gap-2">
              <span className="font-data text-3xl font-bold text-primary/30">{s.n}</span>
              <span className="text-sm font-semibold text-on-surface">{s.label}</span>
              <span className="text-xs text-on-surface-variant">{s.sub}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/* ── Calculator Preview ─────────────────────────────────── */
function CalculatorPreview() {
  return (
    <section className="border-y border-outline-variant bg-surface-container py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* copy */}
          <div>
            <span className="mb-3 inline-block text-xs font-semibold tracking-widest text-primary uppercase">
              AI-Powered
            </span>
            <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">
              Know your EPR liability in 60 seconds
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">
              Enter your annual plastic packaging volumes by category. Our calculator applies
              CPCB target percentages (Rigid 30 %, Flexible 20 %, MLP 15 %) and gives you an
              instant cost-range estimate — or describe your business in plain English and let AI
              fill the numbers.
            </p>
            <Link
              href="/sign-up?role=buyer"
              className={cn(buttonVariants({ size: 'sm', className: 'mt-6' }))}
            >
              Try the calculator
            </Link>
          </div>

          {/* mock calculator card */}
          <div className="tonal-layer-1 rounded-lg overflow-hidden">
            {/* step tabs */}
            <div className="flex border-b border-outline-variant bg-surface-container-lowest">
              {['Category', 'Volumes', 'Snapshot'].map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    'flex-1 py-3 text-center text-xs font-medium',
                    i === 1
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-on-surface-variant'
                  )}
                >
                  {i + 1}. {s}
                </div>
              ))}
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-on-surface-variant">
                Enter annual plastic volumes (in metric tonnes)
              </p>
              {[
                { cat: 'Rigid Plastic', target: '30%', eg: '120 MT', cost: '₹12–14/kg' },
                { cat: 'Flexible Plastic', target: '20%', eg: '80 MT', cost: '₹14–17/kg' },
                { cat: 'Multi-Layer Plastic', target: '15%', eg: '40 MT', cost: '₹16–20/kg' },
              ].map((row) => (
                <div key={row.cat} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-on-surface">{row.cat}</div>
                    <div className="text-[10px] text-on-surface-variant">Target: {row.target}</div>
                  </div>
                  <div className="font-data text-sm text-on-surface-variant">{row.eg}</div>
                  <div className="font-data text-xs text-primary whitespace-nowrap">{row.cost}</div>
                </div>
              ))}

              <div className="hairline-divider pt-3">
                <div className="flex justify-between text-xs">
                  <span className="text-on-surface-variant">Estimated total range</span>
                  <span className="font-data font-semibold text-on-surface">₹3.6L – ₹4.8L</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Order Book Preview ─────────────────────────────────── */
const MOCK_LISTINGS = [
  { id: 'LST-001', recycler: 'GreenCycle Pvt Ltd', state: 'MH', cat: 'Rigid', qty: '500 kg', price: '₹12.80', verified: true },
  { id: 'LST-002', recycler: 'EcoWaste Solutions', state: 'DL', cat: 'Flexible', qty: '1,200 kg', price: '₹15.40', verified: true },
  { id: 'LST-003', recycler: 'PurePlastics Co', state: 'GJ', cat: 'MLP', qty: '800 kg', price: '₹17.20', verified: true },
  { id: 'LST-004', recycler: 'RecycleTech India', state: 'KA', cat: 'Rigid', qty: '2,000 kg', price: '₹13.10', verified: false },
]

function OrderBookPreview() {
  return (
    <section className="py-16 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <h2 className="text-2xl font-bold text-on-surface">Live order book</h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              New listings appear in real-time — no refresh required
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Live
          </span>
        </div>

        <div className="tonal-layer-1 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-container">
              <tr>
                {['Recycler', 'State', 'Category', 'Qty available', 'Price / kg', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_LISTINGS.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-lowest/50'}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-on-surface">{row.recycler}</div>
                    <div className="font-data text-[10px] text-on-surface-variant">{row.id}</div>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">{row.state}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        row.cat === 'Rigid'
                          ? 'bg-primary/10 text-primary'
                          : row.cat === 'Flexible'
                          ? 'bg-secondary/10 text-secondary'
                          : 'bg-[--color-transition-amber]/10 text-[--color-transition-amber]'
                      )}
                    >
                      {row.cat}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-data text-on-surface">{row.qty}</td>
                  <td className="px-4 py-3 font-data font-semibold text-on-surface">{row.price}</td>
                  <td className="px-4 py-3">
                    {row.verified ? (
                      <span className="flex items-center gap-1 text-primary text-xs font-medium">
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                          <path d="M6 0L7.5 4.5H12L8.25 7.27L9.75 12L6 9.27L2.25 12L3.75 7.27L0 4.5H4.5L6 0Z" />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs text-on-surface-variant">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href="/sign-up?role=buyer"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Buy →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 bg-surface-container text-xs text-on-surface-variant text-center">
            Sign in to see all active listings and place orders
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Fraud Shield ───────────────────────────────────────── */
function FraudShield() {
  const points = [
    'Every seller verified against CPCB national recycler registry before activation',
    'Row-Level Security on all data — buyers cannot see other buyers\' orders',
    'Orders expire after 48 hours — no stale or ghost transactions',
    'Provisional certificates carry a unique EPR-YYYY-CAT-XXXXXX reference ID',
  ]

  return (
    <section className="border-y border-outline-variant bg-surface-container-lowest py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-on-surface bg-on-surface text-surface-container-lowest">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-on-surface-variant uppercase mb-1">
                CPCB Compliant
              </p>
              <h2 className="text-2xl font-bold text-on-surface">Security-first by design</h2>
            </div>
          </div>

          <ul className="space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-on-surface-variant">
                <svg
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/* ── CTA Banner ─────────────────────────────────────────── */
function CtaBanner() {
  return (
    <section className="bg-primary py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-bold text-on-primary sm:text-3xl">
          Ready to meet your EPR obligations?
        </h2>
        <p className="mt-3 text-sm text-on-primary/80 max-w-lg mx-auto">
          Join brands and recyclers already trading on EPRx Exchange. Free to sign up — pay only when you buy.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/sign-up?role=buyer"
            className="inline-flex items-center rounded-md bg-on-primary px-5 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-on-primary/90 transition-colors"
          >
            Start as a Brand
          </Link>
          <Link
            href="/sign-up?role=seller"
            className="inline-flex items-center rounded-md border border-on-primary/40 px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-on-primary/10 transition-colors"
          >
            List credits as a Recycler
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── Footer ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-outline-variant bg-surface-container-lowest py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="text-on-primary font-bold text-[10px]">E</span>
              </div>
              <span className="font-semibold text-on-surface text-sm">EPRx Exchange</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              India's only zero-markup EPR credit marketplace. CPCB-compliant. Self-serve.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-xs text-on-surface-variant">
            <Link href="/sign-up?role=buyer" className="hover:text-on-surface transition-colors">For Brands</Link>
            <Link href="/sign-up?role=seller" className="hover:text-on-surface transition-colors">For Recyclers</Link>
            <Link href="/sign-in" className="hover:text-on-surface transition-colors">Sign in</Link>
            <span className="text-on-surface-variant/50">Privacy Policy</span>
          </div>
        </div>

        <div className="mt-8 hairline-divider pt-6 flex flex-col gap-1 text-[10px] text-on-surface-variant/60 sm:flex-row sm:justify-between">
          <span>© 2026 EPRx Exchange. For demonstration purposes only.</span>
          <span>Built for hackathon — not a licensed financial product</span>
        </div>
      </div>
    </footer>
  )
}
