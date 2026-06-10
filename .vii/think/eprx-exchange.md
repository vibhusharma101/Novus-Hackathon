# Brief: EPRx Exchange

_Captured 2026-06-08. Source: product flow doc pasted by user. `/vii-office-hours` intentionally skipped — the flow doc fully answers problem/user/scope._

## Problem
Indian brands (PIBOs) face EPR regulatory compliance anxiety and must offset plastic-packaging liability by buying credits, today via opaque brokers.

## Product
A two-sided marketplace connecting Brands (buyers) and Plastic Waste Processors (recyclers/sellers). Self-serve transaction that converts compliance anxiety into a provisional compliance certificate.

## Success metric (hackathon)
The 90-second live demo (doc §4) lands: Seller lists credits in Window A → row appears in Window B's order book with **no refresh** → Buyer checks out → Seller's vault lights up with the order + 48h escrow timer.

## Riskiest assumption
Realtime cross-window sync (Supabase Realtime over RLS-filtered Postgres changes) works reliably and fast enough to demo live.

## Personas & flows
- **Buyer:** landing → Clerk auth → onboarding form → 3-step liability calculator → dashboard (compliance donut) → live exchange order book → checkout (5% fee) → provisional certificate.
- **Seller:** Clerk auth → onboarding + verification → inventory vault → create listing → incoming order handshake (48h escrow, CPCB transfer guide) → accept/decline.

## Decisions locked
- **Auth:** Clerk for both personas; security is first-class (full RLS, `/vii-cso` full pass before ship).
- **AI features (all three):** (1) Compliance Copilot — grounded buying advisor; (2) CPCB doc extraction on seller onboarding; (3) NL liability estimator in calculator.
- **TDD:** test-first on pure logic; build-then-smoke on UI; Playwright two-context e2e for the realtime spine.
