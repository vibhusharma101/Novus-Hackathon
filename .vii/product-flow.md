# EPRx Exchange — Complete Product Flow Specification

_Source: product flow doc provided by user 2026-06-08. Updated 2026-06-11._
_This file is the single source of truth for all screens, copy, and demo logic._

---

## 1. Core System Concept

Two-sided marketplace connecting Indian Brands (Buyers / PIBOs) and Plastic Waste Processors (Sellers / Recyclers). The core loop converts regulatory compliance anxiety into an official provisional certificate via a self-serve transaction interface.

**Success metric (hackathon demo):**
> Seller lists credits in Window A → row appears in Window B with **no refresh** → Buyer checks out → Seller's vault lights up with the order + 48 h escrow timer.

---

## 2. Persona 1 — Buyer (Brand / PIBO) Flow

### Screen B1 — Landing Page (`/`)
- **Headline:** "India's only zero-markup EPR credit exchange"
- **Subheadline:** "Buy directly from CPCB-verified recyclers. No brokers. Instant certificate."
- **Trust Badges:** Escrow Protected · CPCB Verified · Instant Certificate
- **Running ticker:** mock active offsets scrolling ("A brand in Maharashtra just offset 3,200 kg of Rigid credits")
- **Primary CTA:** "Calculate My EPR Liability" → `/sign-up?role=buyer` if not logged in, `/calculator` if logged in
- **Secondary link:** "Are you a recycler? List your credits →" → `/sign-up?role=seller`

### Screen B2 — Buyer Onboarding (`/onboarding/buyer`)
- **Fields:**
  - Brand / Company Name
  - GSTIN (15-char, pattern hint: `27AABCU9603R1ZX`)
  - Contact Name
  - Phone Number
  - Email Address
  - State of Operations (dropdown, all 29 states + 8 UTs)
- **Behavior:** Submit → writes `brands` row → redirect to `/calculator` (no email wall)

### Screen B3 — 3-Step Liability Calculator (`/dashboard/calculator`)
- **Step 1 — Plastic Type Selection:**
  - Toggle cards: Rigid (Cat I) · Flexible (Cat II) · MLP (Cat III)
  - Target percentages shown on each card: 30% / 20% / 15%
  - Multi-select allowed
- **Step 2 — Annual Weight Parameters (per selected category):**
  - Input: "How many kg did you put into the market last year?"
  - Inline guide: "Rule of thumb: ₹1 Cr FMCG revenue ≈ 800–1,200 kg of plastic packaging."
- **Step 3 — Compliance Snapshot Output:**
  - Brief processing loader animation
  - Ledger table: Category | Total Liability | Secured Credits (0 kg) | Active Deficit
  - Bold total: **Total Deficit** + **Estimated Market Cost Range**
    - Rigid: ₹12–14/kg · Flexible: ₹14–17/kg · MLP: ₹16–20/kg
  - Risk callout: "Penalty if unresolved: up to ₹15,00,000 + ₹10,000/day"
  - Primary action: "Go to Exchange to Offset Deficit →"
  - Server action: upsert `liabilities` rows (one per category)

### Screen B4 — Compliance Dashboard (`/dashboard`)
- **Top banner:** User greeting + deadline countdown ("Annual return due June 30 · 24 days remaining")
- **Central widget:** Large circular compliance donut
  - Starts 0% → Warning Red
  - Color progression: Red → Amber → Blue → Green as credits are secured
- **Data block (right of donut):**
  - Total Liability
  - Credits Secured
  - Current Deficit
  - Active Penalty Risk
- **Lower section:**
  - Category progress bars (linear, per Rigid / Flexible / MLP)
  - Recent Orders history (empty state on first visit)

### Screen B5 — Live Exchange / Order Book (`/dashboard/exchange`)
- **Top guard header:** Buyer's remaining deficit by category
- **Filters:**
  - Segmented toggles: All | Rigid | Flexible | MLP
  - State selector dropdown
  - Sort: Price Low→High
- **Real-time data table columns:**
  - `#` | `Recycler Name` (green CPCB badge if verified) | `State` | `Type` | `Available Qty (kg)` | `Price/kg` | `[Buy]`
- **Row interaction:** Clicking `[Buy]` prefills checkout with buyer's exact category deficit matched against that recycler's pool → routes to checkout
- **Realtime:** Supabase Realtime subscription on `listings` table — new rows appear without refresh

### Screen B6 — Secure Checkout (`/dashboard/checkout/[listingId]`)
- **Two-column layout:**
  - Left (Trust Panel):
    - Verified recycler metadata (company name, CPCB reg no, state)
    - "Secure Escrow Protection Shield" explaining the 48 h transfer rules
  - Right (Pricing):
    - Editable quantity box (pre-filled with deficit weight)
    - Fixed unit price (from listing)
    - Pre-filled GSTIN
    - Breakdown: Credits Cost + Platform Verification Fee (5%) = Total Outlay
- **CTA:** "Simulate Bank Transfer — Complete Order →" (mocks payment, creates `orders` row with 48 h expiry)

### Screen B7 — Order Confirmation & Certificate (`/dashboard/orders/[id]/certificate`)
- **State animation:** Compliance donut increments to reflect completed purchase
- **Certificate render:**
  - Reference ID: `EPR-YYYY-CAT-XXXXXX`
  - Layout params, metadata lines, digital signature area
  - Auditing disclaimer
  - Download as PDF (print-to-PDF fallback for hackathon)

---

## 3. Persona 2 — Seller (Recycler / PWP) Flow

### Screen S1 — Seller Onboarding (`/onboarding/seller`)
- **Fields:**
  - Company Name
  - CPCB PWP Registration Number
  - Operating State (dropdown)
  - Annual Capacity (MT)
  - Contact Name
  - WhatsApp Number
  - Document upload (PDF drag-and-drop — CPCB certificate)
- **Behavior on submit:** Simulated multi-step verification loader
  - "Checking format structure..."
  - "Validating document string..."
  - "Confirmed: Terminal-Verified ✓"
  - Then routes to `/seller/vault`
  - Server action: writes `recyclers` row, sets `verified: true` (simulated)

### Screen S2 — Inventory Vault (`/seller/vault`)
- **Top metric block:** 3 tiles (Rigid | Flexible | MLP) each showing:
  - Listed Weight (kg)
  - Sold Volume (kg)
  - `[List Credits]` link
- **Active Listings section:** Table of own listings with status badges
- **Incoming Orders section:** High-priority alert area (realtime subscription on `orders` table)

### Screen S3 — Create Listing (`/seller/listings/new`)
- **Form fields:**
  - Plastic Category (radio: Rigid / Flexible / MLP)
  - Weight Volume to list (kg)
  - Unit Price/kg (₹)
- **Contextual pricing assistant** (inline notification below price field):
  - Dynamic message based on price vs. market floor
  - e.g., "Setting your price at ₹12.40 puts you as the cheapest listing — will sell 3x faster"
- **Live preview strip:** Shows exactly how the listing will appear in the buyer order book
- **Submit:** "Confirm & Publish" → writes `listings` row → realtime broadcast to all buyer windows

### Screen S4 — Incoming Order Handshake (`/seller/orders/[id]`)
- **Alert banner:** 48-hour countdown timer (prominent, red when < 12 h remain)
- **Transaction details:**
  - Ordered volume (kg)
  - Net payout to seller (after platform fee)
  - Buyer's GSTIN (redacted brand name, GSTIN visible with copy button)
- **CPCB Manual Guide (step-by-step):**
  1. Log in to the official CPCB portal dashboard
  2. Navigate to 'Transfer EPR Credits'
  3. Paste the provided Buyer GSTIN string
  4. Execute the credit volume authorization
- **Actions:**
  - Primary: "Accept & Mark as Transferred →" → updates `orders.status = 'transferred'`, triggers certificate creation, releases escrow
  - Secondary: "Decline" → updates `orders.status = 'declined'`

---

## 4. The Live Demo Sequence (90-Second Blueprint)

```
[Window A: Seller View]                     [Window B: Buyer View]
       |                                           |
 1. Opens /seller/listings/new                     |
    Fills: 8,000 kg Rigid @ ₹12.40                |
    Clicks "Confirm & Publish"                     |
       |                                           |
       +----[ Supabase Realtime broadcast ]------->+ 2. Row appears instantly
                                                      in /dashboard/exchange
                                                      (no browser refresh)
                                                      |
                                                   3. Clicks [Buy] on that row
                                                      → Checkout prefilled
                                                      → Clicks "Simulate Transfer"
                                                      |
       +<---[ Realtime orders subscription ]--------+
       |
 4. /seller/vault lights up:
    - New order alert card
    - Buyer GSTIN visible
    - 48 h countdown started
```

**Tech spine:** Supabase Realtime on `listings` + `orders` tables, RLS-filtered so each window only sees its own data.

---

## 5. AI Features (Phase 4)

| Feature | Entry point | What it does |
|---|---|---|
| **Compliance Copilot** | Chat panel on `/dashboard` and `/dashboard/exchange` | Grounded advisor: reads buyer's deficit + live listings, recommends specific buys, deep-links to checkout |
| **CPCB Doc Extraction** | `/onboarding/seller` after upload | Claude reads the uploaded PDF, extracts CPCB reg no + stated capacity, pre-fills the form fields |
| **NL Liability Estimator** | Calculator Step 2 | Buyer types "We are a mid-size FMCG brand, ~₹200 Cr revenue" → `generateObject` returns kg estimates per category |

---

## 6. PR Raising Plan (Stacked Branches)

```
main ← release ← develop ← feature/phase-0-1-foundation
                           ← feature/phase-2-buyer-flow      (stacked on phase-0-1)
                           ← feature/phase-3-seller-flow     (stacked on phase-2)
                           ← feature/phase-4-ai              (stacked on phase-3)
                           ← feature/phase-5-demo            (stacked on phase-4)
```

### PR 1 — Foundation + Logic
- **Branch:** `feature/phase-0-1-foundation` → `develop`
- **Covers:** Vitest harness, 36 unit tests, EPR logic (liability/pricing/matching/orders/certificate), Supabase schema + RLS, db types, Clerk proxy
- **Status:** ✅ open (PR #2 or similar)
- **Merge condition:** All 36 tests passing, no TypeScript errors

### PR 2 — Design System + Landing Page + Buyer Screens
- **Branch:** `feature/phase-2-buyer-flow` → `develop`
- **Covers:** Tailwind v4 design tokens, landing page (terminal aesthetic), buyer onboarding, 3-step calculator, compliance dashboard, exchange order book, checkout, certificate render
- **Status:** 🔄 in progress (current branch)
- **Merge condition:** All buyer screens navigable, Supabase writes working, 0 TS errors

### PR 3 — Seller Flow
- **Branch:** `feature/phase-3-seller-flow` → `develop`
- **Covers:** Seller onboarding + simulated verification, inventory vault, create listing, incoming order handshake with 48 h timer
- **Status:** ⏳ not started
- **Merge condition:** Seller can publish a listing; listing appears in order book

### PR 4 — AI Features
- **Branch:** `feature/phase-4-ai` → `develop`
- **Covers:** Compliance Copilot chat panel, CPCB doc extraction route, NL liability estimator
- **Status:** ⏳ not started
- **Merge condition:** All 3 AI endpoints respond; copilot deep-links to checkout

### PR 5 — End-to-End Demo + E2E Tests
- **Branch:** `feature/phase-5-demo` → `develop`
- **Covers:** Playwright two-context realtime test, auth guard tests, demo data seed script
- **Status:** ⏳ not started
- **Merge condition:** `e2e/realtime-sync.spec.ts` green in CI

### Merge to release / main
- `develop` → `release` after PR 5 passes
- `release` → `main` is the ship commit (tag `v1.0.0-hackathon`)

---

## 7. Screens Still Needing Designs

The following screens have functional specs above but no HTML design reference yet.
When designs arrive, update this list:

- [x] B2 — Buyer Onboarding form (built — `/onboarding/buyer`, design received)
- [ ] B3 — 3-Step Calculator
- [ ] B4 — Compliance Dashboard (donut widget)
- [ ] B5 — Live Exchange / Order Book (authenticated)
- [ ] B6 — Checkout
- [ ] B7 — Certificate
- [ ] S1 — Seller Onboarding
- [ ] S2 — Inventory Vault
- [ ] S3 — Create Listing
- [ ] S4 — Incoming Order Handshake

**Designs received:**
- [x] B1 — Landing Page (desktop HTML — used as ground truth for `src/app/page.tsx`)
- [x] B2 — Buyer Onboarding (HTML — built as `src/app/onboarding/buyer/page.tsx`)
