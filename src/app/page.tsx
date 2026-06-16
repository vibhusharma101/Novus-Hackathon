import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <TopNav />
      <main>
        <HeroSection />
        <MarqueeTicker />
        <CalculatorSection />
        <LiveOrderBook />
        <FraudShield />
      </main>
      <SiteFooter />
    </div>
  )
}

/* ── Top Navigation ──────────────────────────────────────── */
function TopNav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
      <div className="flex justify-between items-center px-4 md:px-8 h-16 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-8">
          <Image src="/logo.jpg" alt="Recyclink" width={40} height={40} className="h-10 w-10 object-contain" />
          <div className="hidden md:flex gap-6">
            {[
              { label: 'Marketplace', active: true },
              { label: 'Calculator', active: false },
              { label: 'Compliance', active: false },
              { label: 'Vault', active: false },
            ].map(({ label, active }) => (
              <Link
                key={label}
                href="/sign-in"
                className={cn(
                  'text-sm font-medium transition-colors pb-1',
                  active
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-primary'
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <Link
            href="/sign-in"
            className="text-sm px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Login
          </Link>
          <Link
            href="/sign-up"
            className="text-sm px-6 py-2 bg-primary text-on-primary font-bold hover:opacity-90 transition-opacity"
          >
            Start Trading
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ── Hero ────────────────────────────────────────────────── */
function HeroSection() {
  const cards = [
    {
      icon: '✓',
      iconColor: 'text-primary',
      bg: 'bg-primary/5',
      label: '100% Verified',
      sub: 'Every credit audited against PWM rules 2016/2022.',
      offset: '',
    },
    {
      icon: '₹',
      iconColor: 'text-[--tertiary]',
      bg: 'bg-[--tertiary]/5',
      label: 'Instant Settlement',
      sub: 'Funds held in Escrow until CPCB certificate upload.',
      offset: 'mt-8',
    },
    {
      icon: '↗',
      iconColor: 'text-secondary',
      bg: 'bg-secondary/5',
      label: 'Market Data',
      sub: 'Real-time floor prices for Category I, II, III & IV.',
      offset: '-mt-4',
    },
    {
      icon: '◈',
      iconColor: 'text-on-surface',
      bg: 'bg-surface-container',
      label: 'Zero Markup',
      sub: "We don't buy or sell credits. We are the exchange.",
      offset: 'mt-4',
    },
  ]

  return (
    <section className="pt-24 md:pt-32 pb-16 px-4 md:px-8 max-w-[1440px] mx-auto blueprint-grid min-h-[600px] md:min-h-[716px] flex flex-col justify-center">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* left copy */}
        <div className="lg:col-span-7">
          <span className="font-['JetBrains_Mono'] text-[11px] font-bold tracking-[0.05em] text-primary border border-primary px-2 py-1 mb-6 inline-block uppercase">
            TERMINAL ACCESS V2.4.0
          </span>
          <h1 className="font-['Geist'] text-[36px] sm:text-[48px] lg:text-[64px] leading-tight font-semibold mb-6 text-on-surface">
            India's only{' '}
            <span className="text-primary">zero-markup</span>{' '}
            EPR credit exchange
          </h1>
          <p className="text-base text-on-surface-variant mb-10 max-w-xl leading-relaxed">
            Direct institutional access to verified plastic recycling credits. Bypass broker
            networks, eliminate opaque pricing, and secure your compliance roadmap with
            institutional-grade auditing.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/sign-up?role=buyer"
              className="bg-primary text-on-primary px-8 py-4 font-['JetBrains_Mono'] text-[11px] font-bold tracking-[0.05em] uppercase flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              VIEW LIVE ORDER BOOK →
            </Link>
            <Link
              href="/sign-up?role=seller"
              className="border border-outline text-on-surface px-8 py-4 font-['JetBrains_Mono'] text-[11px] font-bold tracking-[0.05em] uppercase hover:bg-surface-container transition-colors"
            >
              REQUEST ACCESS
            </Link>
          </div>
        </div>

        {/* right cards */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3 md:gap-4">
          {cards.map((c) => (
            <div
              key={c.label}
              className={cn(
                'bg-surface-container-lowest p-4 md:p-6 border border-outline-variant hover:scale-[0.98] transition-transform',
                'lg:' + (c.offset || 'mt-0')
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center mb-4 text-xl font-bold',
                  c.bg,
                  c.iconColor
                )}
              >
                {c.icon}
              </div>
              <h3 className="font-['Geist'] text-[20px] font-semibold leading-7 mb-2">{c.label}</h3>
              <p className="text-sm text-on-surface-variant">{c.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Marquee Ticker ─────────────────────────────────────── */
const TICKER_ITEMS = [
  'Brand in MH offset 3,200 kg of Rigid (Cat I)',
  'Recycler RJ-04 listed 12,500 kg Cat II @ ₹24.50',
  'New Transaction: 450 MT MLP (Cat III) verified in TN',
  'Floor Price Alert: Cat I dropped 2.4% in DL/NCR',
  'Compliance Update: 84% of Q3 liabilities settled via Terminal',
]

function MarqueeTicker() {
  return (
    <div className="bg-inverse-surface py-4 overflow-hidden border-y border-outline [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div className="flex w-max animate-[marquee_40s_linear_infinite]">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
          <span
            key={i}
            aria-hidden={i >= TICKER_ITEMS.length}
            className="font-['JetBrains_Mono'] text-[13px] font-medium text-inverse-primary px-6 whitespace-nowrap"
          >
            • {item}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Calculator Section ──────────────────────────────────── */
function CalculatorSection() {
  const categories = [
    { code: 'CAT I', label: 'Rigid', active: true },
    { code: 'CAT II', label: 'Flexible', active: false },
    { code: 'CAT III', label: 'MLP', active: false },
    { code: 'CAT IV', label: 'Compostable', active: false },
  ]

  return (
    <section className="py-16 md:py-24 px-4 md:px-8 max-w-[1440px] mx-auto">
      <div className="mb-8 md:mb-12">
        <h2 className="font-['Geist'] text-[24px] font-semibold leading-8 tracking-tight">
          EPR Liability Estimator
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Calculate your obligation based on Plastic Waste Management Rules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-outline-variant border border-outline-variant">
        {/* Left: Inputs */}
        <div className="bg-surface p-6 md:p-12">
          <div className="mb-10">
            <h3 className="font-['JetBrains_Mono'] text-[11px] font-bold tracking-[0.05em] text-primary uppercase mb-6">
              STEP 1: CATEGORY SELECTION
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.code}
                  className={cn(
                    'border p-4 text-left hover:scale-[0.98] transition-transform',
                    cat.active
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant hover:border-primary'
                  )}
                >
                  <div
                    className={cn(
                      'font-[\'JetBrains_Mono\'] text-[13px] font-medium mb-1',
                      cat.active ? 'text-primary' : 'text-on-surface-variant'
                    )}
                  >
                    {cat.code}
                  </div>
                  <div className="font-['Geist'] text-[20px] font-semibold">{cat.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-['JetBrains_Mono'] text-[11px] font-bold tracking-[0.05em] text-primary uppercase mb-6">
              STEP 2: VOLUME INPUT
            </h3>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm text-on-surface-variant">
                  Annual Plastic Procurement (MT)
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  className="mt-2 block w-full border border-outline-variant bg-surface font-['JetBrains_Mono'] p-4 text-[13px] focus:border-primary focus:outline-none focus:ring-0"
                  readOnly
                />
              </label>
              <label className="block">
                <span className="text-sm text-on-surface-variant">
                  Exemptions / Pre-consumer Waste (MT)
                </span>
                <input
                  type="number"
                  placeholder="0.00"
                  className="mt-2 block w-full border border-outline-variant bg-surface font-['JetBrains_Mono'] p-4 text-[13px] focus:border-primary focus:outline-none focus:ring-0"
                  readOnly
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="bg-surface-container-low p-6 md:p-12 flex flex-col">
          <h3 className="font-['JetBrains_Mono'] text-[11px] font-bold tracking-[0.05em] text-primary uppercase mb-8">
            REAL-TIME LIABILITY REPORT
          </h3>
          <div className="flex-grow space-y-6">
            <div className="flex justify-between border-b border-outline-variant pb-4">
              <span className="text-sm">Total EPR Obligation</span>
              <span className="font-['JetBrains_Mono'] text-[20px] font-semibold">452.50 MT</span>
            </div>
            <div className="flex justify-between border-b border-outline-variant pb-4">
              <span className="text-sm">Estimated Market Value</span>
              <span className="font-['JetBrains_Mono'] text-[20px] font-semibold text-primary">
                ₹1,10,86,250
              </span>
            </div>

            <div className="mt-10">
              <div className="font-['JetBrains_Mono'] text-[10px] font-bold tracking-[0.05em] text-on-surface-variant uppercase mb-4">
                Liability Distribution
              </div>
              <div className="h-2 w-full bg-outline-variant flex">
                <div className="h-full bg-primary w-[70%]" />
                <div className="h-full bg-secondary w-[20%]" />
                <div className="h-full bg-[--tertiary] w-[10%]" />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                {[
                  { color: 'bg-primary', label: '70% Fixed' },
                  { color: 'bg-secondary', label: '20% MLP' },
                  { color: 'bg-[--tertiary]', label: '10% Flex' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-[11px]">
                    <span className={cn('inline-block w-2 h-2', item.color)} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-4">
            <Link
              href="/sign-up?role=buyer"
              className="block w-full bg-primary text-on-primary py-4 text-center font-['JetBrains_Mono'] text-[11px] font-bold tracking-[0.05em] uppercase hover:opacity-90 transition-opacity"
            >
              GO TO EXCHANGE
            </Link>
            <button className="block w-full border border-outline text-on-surface py-4 font-['JetBrains_Mono'] text-[11px] font-bold tracking-[0.05em] uppercase hover:bg-surface-container-high transition-colors">
              DOWNLOAD PDF REPORT
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Live Order Book ─────────────────────────────────────── */
const MOCK_ORDERS = [
  { name: 'GreenTech Solutions', verified: true, state: 'Maharashtra', type: 'Category I (Rigid)', qty: '245,000 KG', price: '₹22.50' },
  { name: 'EcoPolymer India', verified: false, state: 'Gujarat', type: 'Category III (MLP)', qty: '1,200,000 KG', price: '₹18.75' },
  { name: 'Resin Works', verified: true, state: 'Tamil Nadu', type: 'Category II (Flex)', qty: '42,500 KG', price: '₹25.10' },
  { name: 'Bharat Recyclers', verified: false, state: 'Haryana', type: 'Category I (Rigid)', qty: '880,000 KG', price: '₹21.90' },
]

function LiveOrderBook() {
  return (
    <section className="py-16 md:py-24 px-4 md:px-8 max-w-[1440px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4 md:gap-6">
        <div>
          <h2 className="font-['Geist'] text-[24px] font-semibold leading-8 tracking-tight flex items-center gap-3">
            Live Order Book
            <span className="inline-flex h-2 w-2 rounded-full bg-error animate-pulse" />
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Institutional credit availability updated every 12 seconds.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select className="bg-surface border border-outline-variant text-sm py-2 px-4 w-full sm:min-w-[160px] focus:outline-none focus:border-primary text-on-surface">
            <option>All States</option>
            <option>Maharashtra</option>
            <option>Tamil Nadu</option>
            <option>Gujarat</option>
          </select>
          <select className="bg-surface border border-outline-variant text-sm py-2 px-4 w-full sm:min-w-[160px] focus:outline-none focus:border-primary text-on-surface">
            <option>All Categories</option>
            <option>Cat I: Rigid</option>
            <option>Cat II: Flexible</option>
            <option>Cat III: MLP</option>
          </select>
        </div>
      </div>

      <div className="border border-outline-variant overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-high border-b border-outline-variant">
            <tr>
              {['RECYCLER NAME', 'STATE', 'PLASTIC TYPE', 'AVAILABLE QTY', 'UNIT PRICE', 'ACTION'].map((h) => (
                <th
                  key={h}
                  className="p-4 border-r border-outline-variant last:border-r-0 font-['JetBrains_Mono'] text-[11px] font-bold tracking-[0.05em] text-on-surface-variant"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_ORDERS.map((row, i) => (
              <tr
                key={row.name}
                className={cn(
                  'border-b border-outline-variant group hover:bg-surface-container-low transition-colors',
                  i % 2 !== 0 && 'bg-surface-container-lowest/50'
                )}
              >
                <td className="p-4 border-r border-outline-variant font-['JetBrains_Mono'] text-[13px]">
                  {row.name}
                  {row.verified && (
                    <span className="bg-primary/10 text-primary px-1.5 py-0.5 text-[10px] ml-2 font-bold">
                      VERIFIED
                    </span>
                  )}
                </td>
                <td className="p-4 border-r border-outline-variant font-['JetBrains_Mono'] text-[13px]">{row.state}</td>
                <td className="p-4 border-r border-outline-variant font-['JetBrains_Mono'] text-[13px]">{row.type}</td>
                <td className="p-4 border-r border-outline-variant font-['JetBrains_Mono'] text-[13px]">{row.qty}</td>
                <td className="p-4 border-r border-outline-variant font-['JetBrains_Mono'] text-[13px] font-bold">{row.price}</td>
                <td className="p-4">
                  <Link
                    href="/sign-up?role=buyer"
                    aria-label={`Buy ${row.type} credits from ${row.name}`}
                    className="bg-primary text-on-primary px-4 py-1.5 font-['JetBrains_Mono'] text-[11px] font-bold tracking-[0.05em] uppercase group-hover:opacity-90 transition-opacity inline-block"
                  >
                    BUY
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ── Fraud Shield ────────────────────────────────────────── */
function FraudShield() {
  const cards = [
    {
      icon: '⚖',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      title: 'Institutional Escrow',
      desc: 'Funds are only released to recyclers once the CPCB portal generates a verified certificate matching the order quantity and category. Your capital is never at risk.',
    },
    {
      icon: '⇄',
      iconBg: 'bg-secondary/10',
      iconColor: 'text-secondary',
      title: 'Split-Order Optimization',
      desc: 'Our engine automatically splits large buy orders across multiple verified recyclers to ensure 100% fulfillment at the lowest possible volume-weighted average price.',
    },
    {
      icon: '✓',
      iconBg: 'bg-[--tertiary]/10',
      iconColor: 'text-[--tertiary]',
      title: 'Compliance Badges',
      desc: "Continuous monitoring of recycler CPCB licenses, GST filings, and physical plant capacities. We only list 'Terminal-Verified' entities.",
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-surface-container">
      <div className="px-4 md:px-8 max-w-[1440px] mx-auto">
        <div className="mb-16 text-center max-w-2xl mx-auto">
          <h2 className="font-['Geist'] text-[32px] font-semibold leading-10 mb-4">
            The Fraud Shield
          </h2>
          <p className="text-base text-on-surface-variant">
            Our institutional architecture eliminates compliance risks before they enter your
            balance sheet.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((c) => (
            <div key={c.title} className="bg-surface p-8 border border-outline-variant">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center mb-6 text-2xl font-bold',
                  c.iconBg,
                  c.iconColor
                )}
              >
                {c.icon}
              </div>
              <h3 className="font-['Geist'] text-[20px] font-semibold mb-4">{c.title}</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Footer ──────────────────────────────────────────────── */
function SiteFooter() {
  const footerLinks = {
    TERMINAL: ['Marketplace', 'Order Book', 'Yield Terminal', 'API Access'],
    COMPLIANCE: ['Fraud Shield', 'Framework Doc', 'CPCB Connect', 'KYC Verification'],
    LEGAL: ['Terms of Service', 'Privacy Policy', 'Escrow Terms', 'Audit Rights'],
  }

  return (
    <footer className="bg-inverse-surface text-surface py-12 md:py-20 px-4 md:px-8 border-t border-outline">
      <div className="max-w-[1440px] mx-auto">
        {/* CTA Banner */}
        <div className="bg-primary/10 border border-primary/20 p-6 md:p-12 flex flex-col md:flex-row justify-between items-center mb-12 md:mb-20 gap-6 md:gap-8">
          <div>
            <h2 className="font-['Geist'] text-[32px] font-semibold leading-10 text-primary mb-2">
              Stop paying broker margins.
            </h2>
            <p className="text-base text-surface-variant">
              Join 1,200+ brands trading directly on Recyclink.
            </p>
          </div>
          <Link
            href="/sign-up"
            className="bg-primary text-on-primary px-10 py-5 font-['JetBrains_Mono'] text-[11px] font-bold tracking-[0.05em] uppercase hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            OPEN A TRADING ACCOUNT
          </Link>
        </div>

        {/* Links grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
          <div className="space-y-6">
            <Image src="/logo.jpg" alt="Recyclink" width={40} height={40} className="h-10 w-10 object-contain brightness-0 invert" />
            <p className="text-sm text-surface-variant max-w-[240px] leading-relaxed">
              India's premier institutional terminal for environmental responsibility credit
              management.
            </p>
          </div>
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="font-['JetBrains_Mono'] text-[11px] font-bold tracking-[0.05em] text-inverse-primary uppercase mb-6">
                {section}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="/sign-in"
                      className="font-['JetBrains_Mono'] text-[13px] text-surface-variant hover:text-inverse-primary transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-outline/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-['JetBrains_Mono'] text-[13px] text-surface-variant">
            © 2026 Recyclink India. SECURE TERMINAL v2.4.0
          </div>
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-2 font-['JetBrains_Mono'] text-[13px] text-primary">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              System Status: Operational
            </span>
            <span className="font-['JetBrains_Mono'] text-[13px] text-surface-variant">
              UTC +5:30
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
