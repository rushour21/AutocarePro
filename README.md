# AutoHub — Garage Management (Next.js)

Admin, Technician and Customer portals in the AutoHub neumorphic design (warm ivory surfaces, coral accents).

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck && npm run lint && npm run build
```

## Demo accounts (sign in at /login)

| Role | Email | Password |
| --- | --- | --- |
| Garage Admin (Rahul Sharma) | admin@autohub.com | admin123 |
| Technician (Amit Gupta) | amit@autohub.com | tech123 |
| Customer (Rahul Mehta) | rahul.mehta@example.com | customer123 |

## Routes

- **Public:** `/` landing, `/login`
- **Private share link `/track/[token]`** (no sign-in; token only, job numbers never resolve): overview (becomes “Your Vehicle is Ready!” when done), `live`, `details`, `inspection`, `photos`, `estimate` (approve / request changes), `timeline`, `invoice`, `report`, `feedback`
- **Admin `/admin`:** dashboard + Workshop Live View, `jobs` (board / list / calendar), `jobs/[id]`, `jobs/[id]/inspection`, `jobs/new`, `calendar`, `customers`, `vehicles`, `estimates` (+`[id]`), `inventory`, `team`, `reports`, `settings` (+ workshop, notifications, integrations, subscription, security)
- **Technician `/employee`:** dashboard, `jobs`, `jobs/[id]` (+ `inspection`, `checklist`), `inspections`, `parts-request`, `calendar`, `messages`, `team`, `profile`
- **Customer `/customer`:** dashboard, `vehicles`, `bookings` (+`new`), `estimates` (+`[id]`), `invoices`, `history`, `notifications`, `profile` (+ payment, security), `share` (copy / open / renew links), `support`, `jobs/[id]` (+ `details`)

## Architecture

- `lib/store.ts` — single persisted store (localStorage); every screen reads it, so a change in one portal shows up in the others.
- `lib/access.ts` — role-scoped selectors (admins: all; technicians: assigned jobs; customers: own vehicles/jobs/estimates/invoices) and token lookup.
- `lib/actions.ts` — all mutations. `middleware.ts` + `AppShell` guard each portal.
- `components/ui` — shared components; `components/features/WorkshopLiveView` — interactive SVG floor plan (2D) and isometric preview (3D) driven by bay + job data.
- Bays are configurable in Settings → Workshop.

## Share link

Customers copy a link from **Share Link** in the customer sidebar (or the admin job page). Anyone holding the link sees that one job:
progress, photos, inspection, estimate, invoice, report — and may approve the estimate or leave feedback. Staff phone numbers, internal notes and
other customers never appear (`lib/track.ts` builds the customer-safe view). “New link” revokes the old one immediately.
Demo jobs: BMW in repair (J1004) and a completed BMW (J0987) for the Ready / Report / Invoice / Feedback screens.

## Demo-build limits

Mock data and sign-in live in the browser (no backend), so a share link only reflects data in the browser that created it; with a real API it works from any device. The “Live from Workshop” image is a still photo, and Time-lapse is not implemented. The cookie used by `middleware.ts` is unsigned and must be replaced by a real signed session. The 3D workshop is an isometric *preview* of the same data, not a true 3D scene. Landing-page statistics (4.9/5, 10K+, 5+ years) are placeholders copied from the design.
