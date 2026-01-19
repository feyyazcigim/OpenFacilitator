# OpenFacilitator Rewards Program

## What This Is

A rewards program that pays users $OPEN tokens (Solana SPL) for volume processed through OpenFacilitator. Users register pay-to addresses, prove ownership via wallet signatures, track volume in real-time, and claim tokens when thresholds are met. This is a customer acquisition strategy — no other facilitator pays users to use them.

## Core Value

Users who process volume through OpenFacilitator get rewarded with $OPEN tokens. Hit threshold, get tokens. Own a white-label facilitator, get 2x.

## Requirements

### Validated

<!-- Existing capabilities from codebase -->

- ✓ User authentication via Better Auth (email/password) — existing
- ✓ Multi-tenant facilitator system with subdomain/custom domain routing — existing
- ✓ Transaction logging with facilitator_id, to_address, from_address, amount — existing
- ✓ Free facilitator at pay.openfacilitator.io — existing
- ✓ Dashboard with facilitator management, products, stats — existing
- ✓ Solana wallet generation and SPL token support — existing

### Active

<!-- New scope for rewards program -->

- [ ] Free users can register for rewards tracking without creating a facilitator
- [ ] Users can add pay-to addresses and verify ownership via Solana signature
- [ ] Dashboard shows current volume, threshold progress, estimated rewards
- [ ] Facilitator owners get 2x multiplier automatically applied
- [ ] Admin can create and manage reward campaigns (pool, threshold, dates)
- [ ] Volume calculated from transaction logs for verified addresses
- [ ] Users can claim $OPEN tokens when threshold met and campaign ends
- [ ] SPL token transfer from rewards wallet on claim
- [ ] Claim history with transaction signatures

### Out of Scope

- Leaderboards — deferred to post-launch based on demand
- Email notifications — nice to have, not MVP
- Anti-gaming enforcement — track metrics but don't block anyone for v1
- Mobile app — web dashboard only
- OAuth login — email/password sufficient

## Context

**Existing System:**
- Monorepo with `@openfacilitator/core`, `server`, `sdk`, `dashboard`
- SQLite database via better-sqlite3
- Better Auth for authentication
- Transactions table stores: facilitator_id, to_address, from_address, amount, status
- Dashboard is Next.js 15.5.x + React 19 + Tailwind + shadcn/ui

**Free Facilitator:**
- pay.openfacilitator.io is a dogfooded white-label facilitator
- Free users process payments through this facilitator
- Volume tracked via to_address in transactions table

**Rewards Model:**
- Campaign pool (e.g., 20M $OPEN) distributed proportionally to qualifying users
- Threshold: $1,000/month minimum volume to qualify
- Multiplier: 2x for white-label facilitator owners
- Claims open when campaign period ends (March 2026 for first campaign)

**Timeline:**
- Dashboard/tracking: Launch January/February 2026
- Claims: March 2026
- Rewards wallet needs setup before March

## Constraints

- **Database**: SQLite (existing) — keep schema additions compatible
- **Auth**: Better Auth (existing) — extend for rewards accounts, don't replace
- **UI**: Integrate into existing dashboard as new tab/section
- **Token**: $OPEN on Solana — need SPL token transfer capability
- **Timeline**: Dashboard ASAP, claims by March 2026

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Integrate into existing dashboard | Reduces complexity, leverages existing auth | — Pending |
| SQLite for rewards tables | Consistent with existing infra | — Pending |
| Solana signature verification | Industry standard, users already have Solana wallets | — Pending |
| Proportional distribution | Fair allocation based on contribution | — Pending |
| Soft anti-gaming (track, don't block) | Gaming is acceptable CAC for v1 | — Pending |

---
*Last updated: 2026-01-19 after initialization*
