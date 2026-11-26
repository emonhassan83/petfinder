# PetFinder – Product & Delivery Plan

Status: **Phase 1 (audit + planning) – awaiting approval.** No application code has been changed.

## 0. Decisions log

| # | Decision | Date |
|---|----------|------|
| 1 | `client/` renamed to `portal/` (portal + admin dashboard). Mobile is a **new Expo/React Native app** in `app/` (users only). | 2026-11-26 |
| 2 | Chat uses **self-hosted Socket.IO**; server moves from Vercel serverless to a persistent host (Railway/Render/VPS). | 2026-11-26 |
| 3 | Add `SHELTER` and `OWNER` roles plus a `ShelterProfile` model; existing roles kept. | 2026-11-26 |
| 4 | Plan file lives at `docs/plan.md`. | 2026-11-26 |

| 5 | Design direction (teal/coral/cream, Fraunces + Inter) approved; Phase 2 runs milestone by milestone. | 2026-11-26 |

Phase log:
- Phase 1 – done.
- Phase 2a (design system) – done, awaiting approval: new MUI theme tokens (`portal/src/lib/theme/theme.ts`), Tailwind/CSS variables, Inter + Fraunces fonts, hard-coded purples replaced, white navbar. `tsc` and `next build` pass.
- Phase 2b (portal public/user) – done, awaiting approval: restyled pet card with favorite heart, hero search wired to `/pets?searchTerm=`, user dashboard pages Saved Pets / Messages / Notifications (mock data in `portal/src/mock/portal.ts`, favorites in localStorage via `portal/src/hooks/useFavorites.ts`). Not done in 2b: map toggle + radius filter, report-listing, reviews, restyled pet detail/apply flow (only inherits new theme). `tsc` and `next build` pass.
- Phase 2c (shelter/owner dashboard) – done, awaiting approval: `portal/src/app/(withDashboardLayout)/dashboard/shelter/` with Overview (KPIs, chart, verification banner), Listings (status, pause/publish, plan-limit meter, add-listing with photo/video picker), Applications (approve/reject; approving auto-rejects other pending for same pet), Team, Billing (plan cards, monthly/yearly), Messages (reuses user chat). OWNER and SHELTER roles both route to `/dashboard/shelter` (middleware, drawer, login redirect). All mock data in `portal/src/mock/shelter.ts`; nothing persists. Role separation (owner has no Team) is not enforced in UI yet. `tsc` and `next build` pass.
- Phase 2d (admin dashboard) – done, awaiting approval: new pages under `dashboard/admin/`: verification queue, reports queue, subscriptions + transactions, lookups (species/breeds/locations), CMS (FAQs + static pages), audit logs; shared `components/Shared/ReasonDialog.tsx` (required note for reject/dismiss/hide). SUPER_ADMIN now reuses the admin dashboard (role `super_admin`, middleware, drawer, login redirect). Mock data in `portal/src/mock/admin.ts`; nothing persists. Not done: platform settings page, dispute monitoring, super-admin-only screens (plan CRUD, role promotion), existing admin pages (users/pets/adoptions/blogs) only inherit the new theme. `tsc` and `next build` pass.
- Phase 2e (mobile app) – done, awaiting approval: new Expo SDK 58 / React Native 0.88 project in `app/` (React Navigation: bottom tabs Discover, Favorites, Messages, Applications, Profile + stack for Pet detail and Chat). Mock data in `app/src/data/mock.ts`; favorites persisted with AsyncStorage, applications/chat are in-memory. Verified with `tsc --noEmit` and `expo export --platform android` (bundle builds); not run on a device/emulator. Not done: sign-in/social auth, push notifications, location permission + nearby search, report flow (button shows a placeholder), app icons/splash (Expo defaults). Dev: `cd app && npm install && npx expo start`.
- Phase 2 complete pending your sign-off. Phases 3–5 – not started.
- Dev note: `npm install` in `portal/` needs `--legacy-peer-deps` (`@mui/material-nextjs` peer range excludes Next 16).

## 1. Existing codebase audit

Repo: `portal/` (Next.js 16, React 18, MUI 5, Tailwind 3, Redux Toolkit/RTK Query, Zod 4) and `server/` (Express 4, Prisma 5, PostgreSQL, Zod 4, JWT, Nodemailer). (originally `client/`, renamed to `portal/`; `app/` is the Expo mobile app added in Phase 2e.)

### Existing vs new

| Capability | Status |
|---|---|
| Register/login, JWT + refresh cookie, change/forgot/reset password | Exists |
| Profile view/edit | Exists |
| Pet CRUD (admin only), list with search/filter/pagination | Exists (single image, free-text species/breed/location) |
| Adoption request create/list/update/status | Exists (admin-managed) |
| Blogs + comments | Exists |
| Donations | Partial (record only, no payment) |
| Admin dashboard (meta charts, users, pets, adoptions, blogs) | Exists (revenue figure is fake) |
| Social login | New |
| Shelter/owner accounts + verification | New |
| Multi-photo/video listings | New |
| Favorites | New |
| Chat (Socket.IO) | New |
| Notifications (in-app, email, push) | New |
| Reports/moderation | New |
| Reviews | New |
| Subscriptions (Stripe) | New |
| Lookups: categories, breeds, locations | New |
| CMS (FAQ/policies/static) | New |
| Audit logs | New |
| Geo/location discovery | New |
| Lost & found, success stories, featured listings, AI matching | New (post-MVP, see §3) |
| Mobile app | New |
| Tests | New (none today) |

### Existing issues to fix (carried into roadmap)

Server:
- Public pet/adoption listings `include: user`, leaking password hash and contact data.
- Zod, JWT and Prisma errors all return 500; `notFound` handler unreachable (registered after error handler); wrong password surfaces as 500.
- `userId` taken from request body in blog/comment create; blog/comment update/delete open to any role; no pet ownership check on update/delete.
- No helmet, rate limiting, logging; refresh cookie lacks `sameSite`/`maxAge`/`secure`; refresh/reset tokens not revocable.
- No duplicate-application, pet-availability or single-approval checks on adoption.
- Donate schema requires `currency`, which has no column; `GET /donate` is public and exposes donor emails.
- `meta.service` revenue is `adoptionCount * 180` (fake). `changeUserRole/Status` data shape needs verification.
- No indexes, no `onDelete` rules, enum typo `AnimelSleep`, query/params never validated, no `.env.example`.

Client:
- Access token in localStorage + non-httpOnly cookie; middleware decodes but doesn't verify the JWT.
- SUPER_ADMIN has no pages/menu; `/dashboard` is a stub.
- `publishBlog` PATCH URL has no id; interceptor retries refresh on HTTP 500; theme typo `"##1F345D"`; `eslint-config-next` 14 vs `next` 16; `@hookform/resolvers` v3 vs Zod 4 compatibility to verify.
- Images uploaded from the browser to imgbb with a public key; no video.
- `docs/` partially copied from another project ("Medico").

## 2. Role & permission matrix

Roles: GUEST, USER (adopter), OWNER (individual rehomer), SHELTER (org owner), SHELTER_MEMBER (staff), ADMIN, SUPER_ADMIN.

| Capability | Guest | User | Owner | Shelter | Shelter member | Admin | Super admin |
|---|---|---|---|---|---|---|---|
| Browse/search pets, blogs, FAQ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| Favorite pets, apply, track applications | – | ✔ | ✔ | – | – | – | – |
| Chat | – | ✔ | ✔ | ✔ | ✔ | view (disputes) | view |
| Report listing/user | – | ✔ | ✔ | ✔ | ✔ | – | – |
| Review shelter/adopter (after completed adoption) | – | ✔ | ✔ | ✔ | – | moderate | moderate |
| Create/edit/pause own listings | – | – | ✔ (plan limits) | ✔ | ✔ (permitted) | any | any |
| Manage applications for own listings | – | – | ✔ | ✔ | ✔ | monitor | monitor |
| Manage org members | – | – | – | ✔ | – | ✔ | ✔ |
| Manage own subscription | – | – | ✔ | ✔ | – | ✔ (all) | ✔ |
| Verify/reject shelters | – | – | – | – | – | ✔ | ✔ |
| Moderate reports, listings, users | – | – | – | – | – | ✔ | ✔ |
| Manage lookups, CMS, settings | – | – | – | – | – | ✔ | ✔ |
| Promote admins, manage plans | – | – | – | – | – | – | ✔ |
| View audit logs | – | – | – | – | – | read | ✔ |

## 3. Feature breakdown

### MVP
- **Users:** register/login, Google social login, profile, pet browse/search/filters (species, breed, age, gender, size, location radius), pet detail with gallery/video, favorites, adoption application + status tracking, chat, in-app + email notifications, report listing/user, adoption history + reviews, location-based discovery.
- **Owners/Shelters:** registration, profile + document submission, verification state, listing lifecycle (draft/published/paused/adopted), multi-photo/video upload, application inbox (accept/reject/status), chat with applicants, org members, analytics dashboard.
- **Admin:** RBAC, analytics/reports, manage users/shelters/owners, verify/reject shelters, manage listings and reports, monitor applications/disputes, subscriptions/payments/transactions, lookups (categories, breeds, locations), settings, CMS (FAQ/policies/static), audit logs.
- **Subscriptions:** see §7.

### Recommended additions

| Feature | Business value | Complexity | Release |
|---|---|---|---|
| Verified-shelter badge | High (trust) | Low | MVP |
| Featured/promoted listings | High (revenue) | Low–Med | MVP (plan feature) |
| Email + push notifications | High | Med | Email MVP, push with mobile |
| Adoption compatibility questionnaire | High | Med | v1.1 |
| Success stories | Med (SEO/trust) | Low | v1.1 |
| Lost & found pets | Med–High (traffic) | Med | v1.2 |
| AI-powered pet matching | High | High | v2 (needs questionnaire + behavior data) |
| Recommendation + analytics system | Med | Med–High | v2 |

## 4. User journeys

1. **Adopter:** discover (filters/map/location) → pet detail → favorite → submit application → chat → status updates (notified) → adoption completed → review.
2. **Shelter:** register → submit documents → admin verification (pending → verified/rejected, notified) → choose plan → create listing (photos/videos) → publish → receive applications → chat → accept/reject → mark adopted → analytics.
3. **Owner:** same as shelter without org members; free-plan listing cap.
4. **Subscription:** plans page → Stripe Checkout → webhook activates entitlements → manage via Customer Portal → renewal/failed payment/cancel handled by webhooks.
5. **Moderation:** user reports → admin queue → action (dismiss/warn/hide listing/suspend) → audit log entry → reporter/target notified.
6. **Admin onboarding:** super admin promotes admin → audit trail.

## 5. Database / model changes (Prisma)

Modify:
- `UserRole` += `OWNER`, `SHELTER`, `SHELTER_MEMBER`; add `emailVerified`, `authProvider`, `providerId`, `lastLoginAt`.
- `Pet`: add `status` (DRAFT/PUBLISHED/PAUSED/PENDING/ADOPTED/REMOVED), `speciesId`, `breedId`, `locationId`, `lat`, `lng`, `shelterId?`, `featuredUntil?`; keep legacy strings during migration, backfill, then drop.
- `AdoptionRequest`: unique(userId, petId), status += WITHDRAWN/COMPLETED, `decisionNote`.
- `Donation`: `currency`, `status`, `paymentIntentId`.
- Fix `AnimelSleep` → `AnimalSleep`; add indexes and explicit `onDelete`.

New: `ShelterProfile` (org name, docs, verificationStatus PENDING/VERIFIED/REJECTED, verifiedAt/By), `ShelterMember`, `PetMedia` (IMAGE/VIDEO, url, order), `Favorite` (unique user+pet), `Conversation`/`ConversationParticipant`/`Message`, `Notification` + `PushToken`, `Report`, `Review`, `Plan`, `Subscription`, `Payment`/`Transaction`, `StripeEvent` (idempotency), `Species`, `Breed`, `Location`, `Faq`, `Page`, `Setting`, `AuditLog`; later `LostFoundReport`, `SuccessStory`, `CompatibilityAnswer`.

Geo: `lat/lng` with Haversine in SQL initially; PostGIS only if scale demands.

## 6. API endpoint requirements (`/api/v1`)

Existing modules retained. New/changed (all with Zod validation of body, query and params):

- **auth:** `POST /auth/social/google`, `POST /auth/verify-email`, `POST /auth/logout`; refresh-token rotation.
- **shelters:** `POST /shelters`, `GET/PUT /shelters/me`, `POST /shelters/me/documents`, `GET/POST/DELETE /shelters/me/members`; admin `GET /shelters`, `PATCH /shelters/:id/verification`.
- **pets:** ownership-scoped create/update/delete; `PATCH /pets/:id/status`; `POST/DELETE /pets/:id/media`; `GET /pets?lat&lng&radius`; featured listings.
- **favorites:** `GET /favorites`, `PUT/DELETE /favorites/:petId`.
- **adoptions:** duplicate/availability guards; status changes by listing owner; withdraw; dispute flag.
- **chat:** REST `GET /conversations`, `GET /conversations/:id/messages`, `POST /conversations`; Socket.IO events `message:send`, `message:new`, `typing`, `read`.
- **notifications:** `GET /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/push-token`.
- **reports:** `POST /reports`; admin `GET/PATCH /reports/:id`.
- **reviews:** `POST /reviews` (only after completed adoption), `GET /shelters/:id/reviews`.
- **subscriptions:** `GET /plans`, `POST /subscriptions/checkout-session`, `POST /subscriptions/portal-session`, `GET /subscriptions/me`, `POST /webhooks/stripe` (raw body); admin `GET /admin/subscriptions`, `GET /admin/transactions`, plan CRUD (super admin).
- **lookups/cms/settings:** CRUD for species, breeds, locations, FAQs, pages, settings (admin).
- **audit-logs:** `GET /admin/audit-logs`.
- **meta:** real revenue and funnel analytics for admin and shelter dashboards.
- Later: lost-found, success-stories, matching.

## 7. Stripe subscription architecture

- **Plans:** Free / Pro / Premium for owners and shelters; monthly and yearly Prices; plan table stores Stripe `priceId` and limits (active listings, media per listing, featured slots, team members, analytics access).
- **Checkout:** server creates a Checkout Session (`mode: subscription`) with `client_reference_id` and metadata; the success redirect only reads state and is never trusted.
- **Customer Portal:** server creates portal sessions for upgrade/downgrade/cancel/payment method.
- **Webhook** (`POST /webhooks/stripe`, `express.raw`, mounted before `express.json`, signature verified): `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`. Event ids stored in `StripeEvent` for idempotency.
- **Entitlements:** derived from `Subscription.status` and `currentPeriodEnd`; `requireFeature/withinLimit` middleware on listing create/publish/media upload.
- **Failure/expiry:** `past_due` grace period with email; on cancel/expiry, listings above the Free limit are auto-paused (not deleted).
- **Admin:** list/filter subscriptions and transactions, manual plan override with audit log.
- Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`.

## 8. UI/UX proposal (requires approval before any frontend code)

**Direction:** warm, trustworthy, rescue-friendly: soft rounded shapes, real pet photography, clear trust signals (verified badges).

**Palette (proposed):**
- Primary teal-green `#1F8A70`; accent coral `#FF7A59` (CTAs, favorites); sunshine `#FFC857` (highlights/badges).
- Neutrals: ink `#1B2A2F`, slate `#5B6B70`, cream `#FFF8F0` (page bg), white cards.
- Status: success `#2E9E6B`, warning `#E8A317`, danger `#D64545`, info `#2F7DD1`.
- Replaces current purple `#6504B5` (confirm or keep).

**Typography:** headings Fraunces or Poppins; body/UI Inter; tabular numerals in tables.

**Portal (public + shelter/owner):** photo-first card grid, sticky filter bar with map toggle, large gallery with sticky Apply/Chat panel, verified badge, shelter dashboard with left nav and KPI cards.
**Admin dashboard:** dense, neutral, data-first; collapsible sidebar, data grids with saved filters, moderation queues, charts, audit log viewer.
**Mobile app (Expo):** bottom tabs (Discover, Favorites, Chat, Applications, Profile), optional swipe discovery, location permission flow, large touch targets, push notifications.

**References:** Petfinder.com and Adopt-a-Pet (search/filter structure), Rover (trust + messaging), Airbnb (card grid, map/list, gallery), Tinder (optional mobile discovery mode only), Stripe Dashboard / Linear (admin clarity).

**Key screens:** Home, Search + map, Pet detail, Apply flow, My applications, Favorites, Chat, Notifications, Shelter onboarding/verification, Listing editor, Applicant inbox, Plans/billing, Admin overview, Verification queue, Reports queue, Subscriptions/transactions, CMS, Audit logs, Settings.

## 9. Development phases & dependencies

| Phase | Scope | Depends on | Approval gate |
|---|---|---|---|
| 1 | Audit + this plan | – | **Current** |
| 2 | Frontend: 2a design system → 2b portal public/user → 2c shelter dashboard → 2d admin → 2e mobile app (contract-first/mock data) | Phase 1 + design approval | After each sub-milestone |
| 3 | Backend: 3a hardening + fixes (§1) and migrations → 3b shelters/pets/media/favorites → 3c applications/chat/notifications/reports/reviews → 3d Stripe → 3e admin/CMS/audit | Phase 2 contracts | After each sub-milestone |
| 4 | API integration of portal, admin and mobile; auth/token hardening | Phases 2, 3 | After completion |
| 5 | Unit, integration, E2E, security, regression testing | Phase 4 | Final |

Note: the data-leak fixes in §1 are scheduled for Phase 3a; they can be pulled forward as a hotfix on request.

## 10. Security, validation & edge cases

- Validate body, query and params with Zod; central error mapping (Zod→400, JWT→401, Prisma P2002→409, P2025→404).
- Never return password hashes; explicit `select` on all user includes.
- Derive `userId` from the token only; ownership/organization checks on every mutating route (IDOR).
- helmet, rate limiting (auth, chat, reports), env-based CORS allow-list, httpOnly + sameSite + secure cookies, refresh-token rotation/revocation, email verification.
- Uploads via presigned or server-side upload with type/size limits; no public third-party keys in the client.
- Stripe: signature verification, idempotent events, never trust the client success redirect.
- Edge cases: duplicate applications; two approvals for one pet (auto-reject others on adoption); listing paused/deleted with open applications; shelter rejected after listings exist; plan downgrade over limit; payment failure grace; deleted/blocked user's chat and reviews; report abuse; timezone and currency handling.
- Chat: auth on socket handshake, room membership checks, message length limits, block/report in chat, retention policy.

## 11. Testing strategy

Focus on critical, security-sensitive and high-risk areas first; routine regression only on request.
- **Unit:** entitlement/limit logic, token helpers, adoption state machine, geo distance.
- **Integration (Jest + Supertest, test DB):** auth/RBAC matrix, ownership/IDOR, adoption rules, Stripe webhook with fixture events, report/verification flows.
- **E2E (Playwright):** register → apply → status; shelter onboarding → verification → listing → subscription; admin moderation.
- **Mobile:** smoke tests for critical flows (Maestro/Detox).
- **Security:** `npm audit`, authorization checks across roles, rate-limit and upload tests.

## 12. Risks, recommendations & future work

- **No mobile baseline:** greenfield Expo app; budget for push setup and store release.
- **Hosting change:** Socket.IO requires leaving Vercel serverless for the API (cost/ops).
- **Data migration:** converting free-text species/breed/location to lookups needs a backfill script.
- **Tech debt:** security fixes in §1 should precede new features; `docs/` copied from "Medico" should be rewritten.
- **Stripe complexity:** plan-limit enforcement and proration are the main risk areas.
- **Moderation load:** verification and reports need admin staffing.
- **Future:** AI matching, compatibility questionnaire, lost & found, success stories, recommendation engine, multi-language, shelter CRM/exports, adoption-fee payments via Stripe Connect.

## 13. Open questions for approval

1. Approve MVP vs later scope split (§3).
2. Approve phase order (frontend before backend) and sub-milestones, or switch to backend-first to avoid mock data.
3. Approve moving the API off Vercel; preferred host?
4. Confirm Stripe plan names/prices and free-plan limits (placeholder: Free = 3 listings).
5. Confirm palette/typography direction (§8) or request alternatives; mockups will be shown before any frontend code.
