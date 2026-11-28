# PetFinder – Product & Delivery Plan

Status (2026-11-28): **Phases 2f, 3 (B3a–B3f), 4 (I4) and 5 (T5) done – awaiting sign-off.** Portal and app run on the real API (local Docker Postgres). Open: O1 Next upgrade, O3/O4/O8 sign-offs, Cloudinary/Stripe keys, first device run of the app. See the task tracker (§0.1).

## 0. Decisions log

| # | Decision | Date |
|---|----------|------|
| 1 | `client/` renamed to `portal/` (portal + admin dashboard). Mobile is a **new Expo/React Native app** in `app/` (users only). | 2026-11-26 |
| 2 | Chat uses **self-hosted Socket.IO**; server moves from Vercel serverless to a persistent host (Railway/Render/VPS). | 2026-11-26 |
| 3 | Add `SHELTER` and `OWNER` roles plus a `ShelterProfile` model; existing roles kept. | 2026-11-26 |
| 4 | Plan file lives at `docs/plan.md`. | 2026-11-26 |
| 5 | Design direction (teal/coral/cream, Fraunces + Inter) approved; Phase 2 runs milestone by milestone. | 2026-11-26 |
| 7 | Phase 3 runs **staged parallel**: B3a + the full Prisma schema first, then B3b–B3f as parallel module agents, then I4, then T5. Dev DB is a **local Docker Postgres** (`petfinder-pg`, port 5499; `server/.env` points at it, the Supabase URL is kept in `server/.env.supabase.bak`). Media storage: **Cloudinary** (signed server-side upload). Google login and Stripe are built against env placeholders (test mode); real keys added later. | 2026-11-28 |
| 6 | Approved: full Pawvelle-inspired refresh (§8.1) on top of the Pawfect palette for portal and app; meet-and-greet visits ship in **v1.1** (free, no deposit); success stories require **admin approval**; supplies/partner shop **dropped**. Phase 2f runs step by step. | 2026-11-27 |

## 0.1 Task tracker

Legend: ✅ done · 🔄 in progress · ⬜ to do · ⏸ blocked/needs decision. Update the row when a task changes state; details go in the Phase log below.

**Summary (2026-11-28)**

| Group | Done | Not done |
|---|---|---|
| Phases 1–2e + polish/redesign/restructure | 11 | 0 (all awaiting sign-off, O4) |
| Phase 2f (P1–P8, A1–A5) | 13 | 0 (awaiting sign-off, O8) |
| Later phases (B3a–B3f, I4, T5) | 8 | 0 (awaiting sign-off) |
| Open items (O1–O8) | 3 (O5, O6, O7) | 5 (O1, O2, O3, O4, O8) |
| Gaps left from earlier milestones (G1–G16) | 1 (G4) | 15 (several now unblocked by the API) |

**Phases 1–2e (completed milestones)**

| ID | Milestone | Status | Notes |
|---|---|---|---|
| M1 | Phase 1: audit + plan | ✅ | |
| M2 | 2a design system | ✅ | |
| M3 | 2b portal public/user pages | ✅ | gaps G1–G3 |
| M4 | 2c shelter/owner dashboard | ✅ | gap G4 |
| M5 | 2d admin dashboard | ✅ | gaps G5–G8 |
| M6 | 2e mobile app (Expo) | ✅ | gaps G9–G13 |
| M7 | Phase 2 polish: light/dark mode + motion | ✅ | |
| M8 | Phase 2 redesign (Pawfect palette) | ✅ | |
| M9 | Portal restructure (petfinder.com IA) | ✅ | |
| M10 | Theme switch fix (`allowedDevOrigins`) | ✅ | |
| M11 | Pawvelle review → §8.1 plan | ✅ | visual audit unfinished (O3) |

**Phase 2f – Pawvelle-inspired refresh (§8.1)**

| ID | Task | Area | Status | Notes |
|---|---|---|---|---|
| P1 | Design tokens: fonts, neutrals, radii, dark mode | portal | ✅ | 2026-11-27 |
| P2 | Shared components (Marquee, CircleText, ArchImage, Timeline, QuickViewDrawer, BeforeAfter, Lightbox) | portal | ✅ | 2026-11-27 |
| P3 | Home page rebuild + navbar phone fix | portal | ✅ | 2026-11-27 |
| P4 | `/pets`: colour chips, quick view, editorial header | portal | ✅ | 2026-11-27 |
| P5 | Pet detail: swatch gallery, fee breakdown, cost calculator, "Book a visit", `#apply` anchor | portal | ✅ | 2026-11-27 |
| P6 | New pages `/stories`, `/stories/[id]`, `/pricing` | portal | ✅ | 2026-11-27 |
| P7 | Shelter "Visits" + "Stories" pages; admin story moderation | portal | ✅ | 2026-11-27 |
| P8 | Footer top row; dark-mode pass on touched pages | portal | ✅ | 2026-11-27 |
| A1 | Fonts Fraunces/Manrope + cream/sand neutrals | app | ✅ | 2026-11-27; not run on a device |
| A2 | Pet detail: photo swatches, colour chips, fee sheet, "Book a visit" sheet | app | ✅ | 2026-11-27; not run on a device |
| A3 | Visits list in Applications tab | app | ✅ | 2026-11-27; not run on a device |
| A4 | Success stories teaser + masonry screen | app | ✅ | 2026-11-27; not run on a device |
| A5 | Cost calculator modal | app | ✅ | 2026-11-27; not run on a device |

**Later phases**

| ID | Task | Status | Notes |
|---|---|---|---|
| B3a | Backend hardening + §1 fixes + migrations | ✅ | 2026-11-28; full schema for all of Phase 3, see Phase 3a log |
| B3b | Shelters, pets, media, favorites APIs | ✅ | 2026-11-28; see Phase 3b log; Cloudinary not tested live |
| B3c | Applications, chat, notifications, reports, reviews | ✅ | 2026-11-28; see Phase 3c log; sockets not tested live |
| B3d | Stripe subscriptions | ✅ | 2026-11-28; see Phase 3d log; not run against real Stripe (no keys) |
| B3e | Admin, CMS, audit logs | ✅ | 2026-11-28; see Phase 3e log |
| B3f | Visits, fees, success stories APIs (§8.1) | ✅ | 2026-11-28; see Phase 3f log |
| I4 | API integration (portal, admin, app) + token hardening | ✅ | 2026-11-28; portal built + screenshot-checked; app not run on a device |
| T5 | Testing (critical/security first) | ✅ | 2026-11-28; server 40/40, portal 9/9; see Phase 5 log |

**Open items**

| ID | Item | Status | Notes |
|---|---|---|---|
| O1 | Upgrade Next.js (16.4.3 security advisory stops `next build` intermittently) | ⏸ | needs your go-ahead |
| O2 | Switch icons to Tabler (`@tabler/icons-react`) | ⬜ | deferred from P2 |
| O3 | Finish Pawvelle visual audit (demo blocked by Cloudflare) | ⏸ | needs screenshots or demo host |
| O4 | Phase 2 sign-off (2a–2e, polish, redesign) | ⏸ | waiting on you |
| O5 | **Security:** `portal/src/middleware.ts` lets any logged-in user open any `/dashboard/*` page (`commonPrivateRoutes` has `"/dashboard"` checked with `startsWith`, so role rules never run) | ✅ | fixed in I4 (exact match + JWT verification), confirmed by screenshot 2026-11-28 |
| O6 | Dashboard app bar shows "Hello, !" (name not read from the token) | ✅ | fixed in I4 |
| O7 | Chart.js axis/legend text is low-contrast in dark mode (dashboard charts) | ✅ | fixed in I4 (`useChartColors`) |
| O8 | Phase 2f sign-off (P1–P8, A1–A5) | ⏸ | waiting on you |

**Gaps left from earlier milestones (not done)**

| ID | Item | From | Status | Notes |
|---|---|---|---|---|
| G1 | Map toggle + location-radius filter on `/pets` | 2b | ⬜ | needs geo API (B3b) |
| G2 | Working report-listing flow (dialog is preview-only) | 2b | ⬜ | needs reports API (B3c) |
| G3 | Reviews (write/read after completed adoption) | 2b | ⬜ | needs reviews API (B3c) |
| G4 | Owner vs shelter separation in UI (owner has no Team page) | 2c | ✅ | fixed in I4 |
| G5 | Admin platform settings page | 2d | ⬜ | |
| G6 | Admin dispute monitoring | 2d | ⬜ | |
| G7 | Super-admin screens (plan CRUD, role promotion) | 2d | ⬜ | |
| G8 | Restyle legacy admin pages (users, pets, adoptions, blogs) | 2d | ⬜ | only inherit the theme |
| G9 | App sign-in + social auth | 2e | ⬜ | with I4 |
| G10 | App push notifications | 2e | ⬜ | needs B3c |
| G11 | App location permission + nearby search | 2e | ⬜ | |
| G12 | App report flow (button is a placeholder) | 2e | ⬜ | |
| G13 | App icons + splash screen (Expo defaults) | 2e | ⬜ | |
| G14 | Run the app on a device/emulator (never done) | 2e/2f | ⬜ | verification only |
| G15 | Open the portal "Book a visit" dialog in a screenshot | P5 | ⬜ | logic type-checked only |
| G16 | Replace hard-coded greys in the app (`#5F6170`, `#DADCE3`) | A1–A5 | ⬜ | |

Phase log:
- Phase 1 – done.
- Phase 2a (design system) – done, awaiting approval: new MUI theme tokens (`portal/src/lib/theme/theme.ts`), Tailwind/CSS variables, Inter + Fraunces fonts, hard-coded purples replaced, white navbar. `tsc` and `next build` pass.
- Phase 2b (portal public/user) – done, awaiting approval: restyled pet card with favorite heart, hero search wired to `/pets?searchTerm=`, user dashboard pages Saved Pets / Messages / Notifications (mock data in `portal/src/mock/portal.ts`, favorites in localStorage via `portal/src/hooks/useFavorites.ts`). Not done in 2b: map toggle + radius filter, report-listing, reviews, restyled pet detail/apply flow (only inherits new theme). `tsc` and `next build` pass.
- Phase 2c (shelter/owner dashboard) – done, awaiting approval: `portal/src/app/(withDashboardLayout)/dashboard/shelter/` with Overview (KPIs, chart, verification banner), Listings (status, pause/publish, plan-limit meter, add-listing with photo/video picker), Applications (approve/reject; approving auto-rejects other pending for same pet), Team, Billing (plan cards, monthly/yearly), Messages (reuses user chat). OWNER and SHELTER roles both route to `/dashboard/shelter` (middleware, drawer, login redirect). All mock data in `portal/src/mock/shelter.ts`; nothing persists. Role separation (owner has no Team) is not enforced in UI yet. `tsc` and `next build` pass.
- Phase 2d (admin dashboard) – done, awaiting approval: new pages under `dashboard/admin/`: verification queue, reports queue, subscriptions + transactions, lookups (species/breeds/locations), CMS (FAQs + static pages), audit logs; shared `components/Shared/ReasonDialog.tsx` (required note for reject/dismiss/hide). SUPER_ADMIN now reuses the admin dashboard (role `super_admin`, middleware, drawer, login redirect). Mock data in `portal/src/mock/admin.ts`; nothing persists. Not done: platform settings page, dispute monitoring, super-admin-only screens (plan CRUD, role promotion), existing admin pages (users/pets/adoptions/blogs) only inherit the new theme. `tsc` and `next build` pass.
- Phase 2e (mobile app) – done, awaiting approval: new Expo SDK 58 / React Native 0.88 project in `app/` (React Navigation: bottom tabs Discover, Favorites, Messages, Applications, Profile + stack for Pet detail and Chat). Mock data in `app/src/data/mock.ts`; favorites persisted with AsyncStorage, applications/chat are in-memory. Verified with `tsc --noEmit` and `expo export --platform android` (bundle builds); not run on a device/emulator. Not done: sign-in/social auth, push notifications, location permission + nearby search, report flow (button shows a placeholder), app icons/splash (Expo defaults). Dev: `cd app && npm install && npx expo start`.
- Phase 2 polish (portal) – light/dark mode and motion: theme switched to MUI CSS-variables (`experimental_extendTheme` + `Experimental_CssVarsProvider`, `defaultMode="system"`, choice saved in localStorage; `lib/providers/ColorSchemeScript.tsx` prevents a light flash). Toggle `components/UI/ThemeToggle.tsx` in public navbar and dashboard app bar. `globals.css` `--pf-*` variables have dark overrides under `[data-mui-color-scheme="dark"]`; Tailwind brand colours read those variables. Hard-coded hex colours in components replaced with palette keys/variables (banner overlays keep white text). Motion: hero fade-up, scroll reveal on home sections (`components/UI/Reveal.tsx`), card lift + image zoom, button lift, animated nav underline, heart pop; all disabled under `prefers-reduced-motion`. Rule going forward: use palette keys (`background.paper`, `text.primary`, `primary.light`) or `var(--pf-*)`, never hex. Chart.js colours and dashboard pages not individually reviewed in dark mode. `tsc` and `next build` pass; not checked in a browser.
- Phase 2 redesign (from two Dribbble references the user supplied) – portal follows the "Pawfect Match" web shot: teal #148F98 / orange #E8793A / rust #9A3A12 / peach #FDEEE4 on white, Raleway headings + Nunito body; new navbar (`components/Shared/Logo.tsx`, Login/Signup link), hero with pet in a morphing blob + floating search card (location → `searchTerm`, species, breed; `/pets` now reads `species`/`breed` from the URL), Featured Pets carousel (arrows, dots, API with preview fallback), "Things to know when adopting" section, peach header on `/pets`. Preview pet photos are Unsplash URLs in `portal/src/mock/pets.ts` (preview cards link to `/pets`). Other home sections (Our Approach, Our Solution, Learn About Us, Donate), inner pages and dashboards only inherit the new palette. Mobile follows the coral "Pet adoption app" shot: coral #F7907C on white/#F7F8FA; first-run onboarding (pet type, gender, size, location; saved in AsyncStorage key `petfinder:prefs`, reopen via "More preferences"), home "Pets waiting for you" with location search, filter badge, overlapping pet cards, featured shelters; pet detail with parallax photo, sheet, share/heart, "Published by", needs tiles, "Adopt {name}" CTA; pill tab bar. Mobile has no dark mode. Verified: portal `tsc` + `next build` + headless-Edge screenshots of home (desktop); app `tsc` + Android export. Not run on a device.
- Phase 2 portal restructure (petfinder.com information architecture, Pawfect theme kept) – nav: Home, Find a pet, Shelters & Rescues, Resources, Donate, About + sun/moon pill switch (navbar heart removed; Saved pets stays in the mobile drawer) (`components/UI/ThemeToggle.tsx`, also in mobile drawer and auth pages). Home: hero search → category tiles → "Pets available for adoption nearby" carousel (+ "Meet more pets" tile) → "Planning to adopt?" cards → "Things to know" → dog/cat articles → shelter/owner CTA. New: `/shelters` directory (search, verified filter, rating) and `/shelters/[id]` profile (contact, pets, reviews); pet detail rebuilt (gallery, About facts, characteristics, health/good-with, "Meet {name}", sticky inquiry card with Apply/Message/Save/Share/Report dialog, shelter card, related pets; supports `preview-*` ids); `/pets` with header search, species chips, sort, skeletons, filter card, preview fallback when API is offline; Resources, About, Donate (gift picker, impact, sponsor a pet) rewritten; login/register use `components/Shared/AuthAside.tsx`; 404 restyled; footer with newsletter + 4 link columns. Shared: `components/Shared/PageHeader.tsx`, `LinkBox.tsx` (use it instead of `component={Link}` in server components – MUI is client-only), `Logo.tsx`; preview data (pets, shelters, articles) in `portal/src/mock/pets.ts`. Removed old home sections (OurApproach, OurSolution, LearnAboutUs, DonateSection) and old blog/about/donate components; old About copy named a real organisation and real people, replaced with generic content. Known: MUI `Tabs variant="scrollable"` crashes under React 19 here (null offsetHeight) – avoid. Newsletter, donation, report and message buttons are preview-only (toasts/links). Verified: `tsc`, `next build`, headless-Edge screenshots of home (light + dark), /pets, pet detail, /shelters, /login.
- Theme switch fix – `ThemeToggle` now reads the <html> `data-mui-color-scheme` attribute (MutationObserver) instead of trusting the context alone, and falls back to setting the attribute + `mui-mode` in localStorage if the provider does not react (seen after a stale dev hot-reload: page dark, switch showing light, clicks ignored). `:root` declares `color-scheme: light dark` and the layout sets a `darkreader-lock` meta so browser auto-dark/Dark Reader do not repaint light mode (Chromium's forced dark still applies when the OS prefers light; nothing in CSS can stop that). Verified toggling both ways under system light and dark. Actual root cause of the "switch does nothing" report: the dev site was opened via `127.0.0.1`/network IP, and Next 16 dev blocks its scripts for non-`localhost` hosts, so the page never hydrated (dark from the init script, switch stuck on light, no Login button). Fixed with `allowedDevOrigins` in `portal/next.config.js` (127.0.0.1 + the machine's IPv4 addresses, dev only); verified hydration and toggling on localhost, 127.0.0.1 and the LAN IP.
- Phase 2 complete pending your sign-off. Phases 3–5 – not started.
- Pawvelle review (2026-11-27) – planning only, no code changed. Reference: Pawvelle "Luxury Pet Boutique & Pet Grooming" theme (ThemeForest item 65503743, author ModelTheme). The live demo is behind a Cloudflare bot check and could not be rendered headless, so the review uses the item page, the theme docs and the sibling Pawvelle HTML template page (same design: Fraunces + Manrope, Tabler icons). Exact hex colours and section order were **not** extracted; to finish the visual audit, open the preview in a browser and share screenshots or the demo host. Result: §8.1 design refresh, new features in §3, models in §5, endpoints in §6, Phase 2f/3f in §9. Questions answered (decision #6).
- Phase 2f portal step 1 (tokens) – done, awaiting approval: fonts Fraunces (headings, `--font-heading`, normal + italic, `opsz` axis) + Manrope (body, `--font-body`, was `--font-inter`) in `portal/src/app/layout.tsx`; `theme.ts` gets warm ink `#1E1B18`, slate `#6A625B`, cream page bg `#FAF6F0`, sand `#EADFD2` (also divider), new dark values (bg `#171412`, paper `#211D1A`, text `#F1E9DE`), exported `radius` (card 24, input 14, pill buttons/chips), headings weight 600 with tighter tracking, buttons now use the body font. `globals.css` mirrors these as `--pf-*` (new `--pf-sand`, `--pf-radius-card`, `--pf-radius-input`; footer now ink instead of dark teal). Tailwind: `sand`, `soft` colours, `font-heading`/`font-body`, `rounded-card`/`rounded-input`. Components that set `var(--font-heading)` inline pick up Fraunces automatically. Verified: `tsc`, `next build`, headless-Edge home screenshots light + dark.
- Phase 2f portal step 2 (shared components) – done, awaiting approval. New in `portal/src/components/UI/` (not yet used on any page; steps 3–7 wire them in): `Marquee` (items, duration, reverse; italic Fraunces phrases with paw separators, pauses on hover, duplicate row `aria-hidden`), `CircleText` (rotating SVG text ring with static centre slot, screen-reader text), `ArchImage` (next/image in a rounded-top mask, ratio prop, zoom-in reveal), `Timeline` (numbered steps, horizontal md+/vertical xs with connector line), `BeforeAfter` (clip-path compare driven by an invisible range input, so keyboard works; focus ring via `:has`), `Lightbox` (fullscreen Dialog, arrow keys, counter, caption), `QuickViewDrawer` (right drawer: photo, `FavoriteButton`, fact tiles incl. fee, traits, "View details" / "Meet {name}" → `/pets/{id}#apply`). Keyframes `pf-marquee`, `pf-spin`, `pf-arch-reveal` added to `globals.css` (covered by the existing reduced-motion rule). Icons are still MUI; the Tabler switch is deferred to avoid a new dependency mid-milestone. Verified: `tsc`, `next build`, headless-Edge screenshots of a temporary preview page (light, dark, 390 px mobile, drawer open, lightbox open), then the page was deleted. To do in step 5: add `id="apply"` to the pet-detail inquiry card so the drawer's "Meet" link lands there.
- Build note: Next 16.4.3 sometimes aborts `next build` at the very end with `SecurityFatalError` (a security-advisory upgrade prompt) after compile, TypeScript and page generation have all succeeded; rerunning passes. Upgrading Next is not done yet (needs your go-ahead). After deleting a route, rebuild before `tsc`, because `.next/types` keeps stale references.
- Phase 2f portal step 3 (home) – done, awaiting approval. New order in `(withCommonLayout)/page.tsx`: Hero → Marquee (trust phrases) → CategoryTiles → PetAdoptSection → HowItWorks → ReadyForHome → AdoptionResources ("Planning to adopt") → SuccessStories → Testimonials → PlanningAdopt ("Things to know") → Articles → ShelterCta. Existing sections were kept, not removed.
  - Hero (`HeroSection.tsx`, now a client component): audience switch "I want to adopt" / "I'm rehoming a pet" (radiogroup) swaps headline (italic accent word), copy, CTAs, photo and ring text; arched photo + rotating `CircleText` CTA badge + floating "Verified shelters" chip; soft sand blob; the existing search card sits below. Old peach band and morphing-blob photo removed. Rehome CTAs go to `/register` and `/pricing`.
  - Carousel: cards use `--pf-radius-card`; a "Quick view" button (shown on hover/focus with a mouse, always shown on touch) opens `QuickViewDrawer`.
  - New sections in `components/UI/HomePage/`: `HowItWorks` (Timeline, anchor `#how-it-works` used by the hero), `ReadyForHome` (wide lifestyle photo with 4 pulsing hotspots: vet-checked, vaccinated, behaviour assessed, microchipped; click/hover tooltips). This replaces the planned "pet hotspots", because pets named in hotspots would not match the people/pets in the photo. Also `SuccessStories` (soft band, featured `BeforeAfter` story + 2 cards, "Read more stories" → `/stories`) and `Testimonials` (3 quote cards, middle one inverted).
  - Shared `components/Shared/SectionHeading.tsx` (overline, Fraunces title with `<em>` accent, subtitle). Mock data in new `portal/src/mock/stories.ts` (stories, testimonials, hotspots, lifestyle + rehome photos; Unsplash photos checked by eye, one with a brand logo rejected). `pf-ping` keyframe added.
  - Navbar at phone width: Login button is icon-only below `sm` (`AuthButton.tsx`, aria-label kept); the theme switch is hidden below `sm` in the bar (it is already in the mobile drawer); toolbar gap reduced. Before this, "Login/Signup" overflowed at 360–390 px (also on pre-existing pages).
  - Links that 404 until step 6: `/pricing`, `/stories`. `#apply` target arrives in step 5.
  - Verified: `tsc`, `next build`, headless-Edge screenshots (desktop light + dark full page, 390 px home via iframe, 560 px navbar).
- Screenshot note: headless Edge on Windows will not go below a 492 px viewport, so `--window-size=390,…` crops a 492 px layout. For true phone widths, load the page in an iframe of the target width (client-only parts such as `AuthButton` and entrance animations may not have finished in that capture), or use 560 px to check `xs` layouts uncropped.
- Phase 2f portal step 4 (`/pets`) – done. The shared `components/Shared/PageHeader.tsx` is now the editorial header for all 6 inner pages that use it (cream instead of the peach band, uppercase breadcrumb, large Fraunces title with an italic accent `highlight`, optional `ArchImage` instead of the blob photo; props unchanged). `/pets` header shows an arched pet photo. Filter card: the colour dropdown is replaced by 8 round coat-colour swatches (`colorOptions`, `matchesColor` exported from `FilterSidebar.tsx`; keyword match, so "Black & white" matches Black and White). Preview (offline) filtering now applies colour too; the API still receives `color` as before. `PetCard` takes an optional `onQuickView` (Quick view button like the home carousel; other `PetCard` users on pet detail/shelter pages are unchanged until they pass it), shows coat colour, and has a taller 4:3.4 photo; `/pets` owns one `QuickViewDrawer`. Verified: `tsc`, `next build`, screenshots light/dark/560 px + About header.
- Phase 2f portal step 5 (pet detail `/pets/[petId]`) – done. Peach top band removed (cream page, uppercase breadcrumb, larger Fraunces name). `PetGallery`: 16:11 main photo opens the `Lightbox` (expand icon), round 64 px photo "swatches" with an orange selection ring. New sections: "What the fee covers" (`components/PetFees.tsx`, price-list style with dotted leaders; lines from `getFeeBreakdown` in new `portal/src/lib/petCosts.ts`, which splits the listed fee into vaccinations / microchip / spay-neuter / vet check + "shelter care donation" and always sums to the fee) and "Plan your first year" (`components/CostCalculator.tsx`: size, food tier, vet care, insurance and grooming toggles → `estimateFirstYear`, BDT constants in `petCosts.ts`, monthly figure, live region). Sticky card: `id="apply"` (quick-view "Meet" link lands here) and a "Book a visit" button (`components/BookVisit.tsx`): dialog with a 14-day date strip (Fridays closed in preview), deterministic mock time slots, optional 300-char note; it stores a REQUESTED visit through new `portal/src/hooks/useVisits.ts` (localStorage `petfinder:visits`, one active visit per pet, the same rule planned for the API), after which the card shows "Visit requested" with Cancel. Verified: `tsc`, `next build`, screenshots light (Yuri) + dark (Mochi). The booking dialog was not opened in a screenshot (needs a click); its logic is type-checked only.
- Phase 2f app steps A1–A5 – done by a parallel agent, checked here with `tsc --noEmit` and `expo export --platform android` (Hermes bundle builds). Not run on a device or emulator. New deps: `@expo-google-fonts/fraunces` ^0.4.1, `@expo-google-fonts/manrope` ^0.4.3, `expo-font` ~58.0.12 (adds its plugin to `app.json`). New: `src/components/Text.tsx` (Text/TextInput wrappers mapping `fontWeight` to the right Manrope family, because Android needs one family per weight; an explicit `fontFamily` wins), `BottomSheet.tsx` (+ `Pill`, `PrimaryButton`), `VisitSheet.tsx`, `CostSheet.tsx`, `src/utils/cost.ts`, `src/screens/StoriesScreen.tsx`. `theme.ts`: `fonts` token, cream `#FAF6F0`, sand `#EADFD2`, ink `#1E1B18` (`line` = sand). Mock pets gain `photos` (3 each, reusing other pets' photos), `color`, `fees`; plus `stories`, `visitSlots`, `initialVisits`. `AppState`: in-memory `visits`, `bookVisit`, `cancelVisit`. Pet detail: 56 px photo swatches, colour chips, fees section with total, "Book a visit" sheet (14-day strip + slot chips → confirmation with "View my visits"), "First-year cost" modal. Applications tab: "Applications | Visits" segmented control (upcoming/past, cancel via alert; `tab: "visits"` route param). Discover: "Happy tails" row → Stories masonry screen → full-screen story modal. Known: some hard-coded greys (`#5F6170`, `#DADCE3`) remain; visit date/time stored as strings; story body beyond the excerpt is filler.
- Phase 2f portal step 6 (new pages) – done. `/stories` (client): editorial header noting admin review, species filter chips (radiogroup), CSS-columns masonry with varying photo ratios, zoom button → `Lightbox`, cards link to the story. `/stories/[storyId]` (server, `generateStaticParams` + `generateMetadata`): `BeforeAfter` when a story has both photos, otherwise a hero photo; italic lead paragraph; "Adopted through {shelter}" card with "Find your own match"; 3 more stories. `/pricing` (client): monthly/yearly switch, 3 plan cards from `mockPlans` (`mock/shelter.ts`, shared with shelter Billing, USD) in a price-list style with dotted leaders, "Most popular" Pro, FAQ accordion; CTAs → `/register` until Stripe (3d). `mock/stories.ts`: 6 stories (3 added), `storyBody()` generic paragraphs when `body` is absent, `findStory()`; the home teaser now shows only 2 side cards. The P3 links to `/pricing` and `/stories` resolve now. Verified: `tsc`, `next build`, screenshots `/stories`, `/stories/s1` (dark), `/pricing`.
- Phase 2f portal step 7 (dashboards) – done. Shelter/owner: `dashboard/shelter/visits` (visit requests with Upcoming/Past chips; Confirm/Decline for REQUESTED, Completed/No-show for CONFIRMED; weekly availability editor with per-day open switch, slot-time chips and visitors-per-slot; "today" is fixed at 2026-11-27 for preview data) and `dashboard/shelter/stories` (submit form: pet from listings, title ≥8, story ≥40/2000, optional rescue-day photo + required "now" photo with local preview via object URLs, consent reminder → PENDING; list with status chips and moderator notes). Admin: `dashboard/admin/stories` moderation queue (status filter chips; "Approve & publish"; "Request changes" / "Unpublish" use the shared `ReasonDialog`, whose note is shown to the shelter). Drawer (`utils/drawerItems.ts`): shelter "Visits", "Success Stories"; admin "Success Stories". Mock data: `mockWeeklySlots`, `slotTimes`, `weekDays`, `mockShelterVisits` in `mock/shelter.ts`; `storySubmissions` (DRAFT/PENDING/PUBLISHED/REJECTED) in `mock/stories.ts`. Nothing persists. Verified: `tsc`, `next build`, screenshots as SHELTER (visits light, stories dark) and ADMIN (stories).
- Found while testing (not changed): middleware role bypass (O5) and the "Hello, !" app bar (O6), see tracker.
- Dashboard screenshots: a scratchpad script (`cdp-shot.mjs`) drives headless Edge over the DevTools protocol, sets an unsigned preview `accessToken` cookie + localStorage for a role, and captures pages (Node 24 built-in WebSocket/fetch, no deps). Usage: `node cdp-shot.mjs ROLE outDir name:path:WxH[:dark]` with the portal running on :3100.
- Phase 2f portal step 8 (footer + dark pass) – done. Footer top row: editorial "New pets and tips, *every week*" headline, the existing newsletter form, and "Coming soon" App Store / Google Play badges (non-clickable placeholders until the Expo app ships). Footer links: "Success stories" → `/stories` (replaces a duplicate `/blogs` link), "Plans & pricing" → `/pricing` (was the shelter billing page); column headings use Fraunces. Dashboard sidebar now uses the shared `Logo` (the old image logo + "Pet Finder" text was dim in dark mode; `assets.images.logo` is no longer referenced anywhere). Dark pass by screenshot: home, `/pets`, pet detail, `/stories`, story page, `/pricing`, `/shelters`, About header, footer, shelter overview/visits/stories, admin stories. No new dark-mode defects in touched pages; Chart.js text contrast logged as O7.
- **Phase 2f status: portal P1–P8 and app A1–A5 done (2026-11-27), awaiting sign-off (O8).** Next decisions for you: O1 (Next upgrade), O5 (middleware role bypass fix), then Phase 3 backend (B3a first).
- Screenshot note: the public layout wraps pages in `min-h-screen`, so a tall headless window pushes the footer below the capture. Use the DevTools script's `light-bottom`/`dark-bottom` or `-full` modes, which keep a 900 px viewport.
- Screenshot helper (outside the repo, in the session scratchpad): builds, starts on :3100, captures `name:path:WxH[:dark]` specs, stops the server. Recreate it if the scratchpad is cleared.
- Dev note: `npm install` in `portal/` needs `--legacy-peer-deps` (`@mui/material-nextjs` peer range excludes Next 16).
- **Phase 3a (backend foundation) – done 2026-11-28.** Server only; portal/app untouched.
  - **Schema** (`server/prisma/schema.prisma`, one migration `20261128000000_phase3_foundation` on top of the 13 existing ones): every Phase 3 model from §5 + §8.1. `UserRole` += OWNER, SHELTER, SHELTER_MEMBER. User += `emailVerified`, `authProvider` (CREDENTIALS/GOOGLE), `providerId`, `lastLoginAt`, `passwordChangedAt`, `stripeCustomerId`; `password` nullable (Google accounts), `contactNumber`/`address` default `""`. Pet += `status` (default PUBLISHED), `speciesId`/`breedId`/`locationId`, `lat`/`lng`, `shelterId`, `featuredUntil`, `colors[]`, `views` (legacy `species`/`breed`/`location`/`color` strings kept). AdoptionRequest: unique(userId, petId), status += WITHDRAWN/COMPLETED, `decisionNote`, `decidedAt/ById`, `isDisputed/disputeReason/disputedAt`. Donation += `currency` (USD), `status`, `paymentIntentId`. Enum `AnimelSleep` renamed in place to `AnimalSleep`. New: ShelterProfile (type SHELTER/OWNER, verification) + ShelterDocument, ShelterMember (MANAGER/EDITOR/VIEWER), PetMedia, Favorite, PetFee, Conversation/ConversationParticipant/Message, Notification, PushToken, Report (polymorphic `targetType`+`targetId`), Review, Plan, Subscription, Payment (= admin "transactions"), StripeEvent, Species, Breed, Location, Faq, Page, Setting, AuditLog, RefreshToken, ShelterAvailability (weekly template), VisitSlot, Visit, SuccessStory + SuccessStoryMedia. Indexes and explicit `onDelete` on every relation (Restrict for ownership/billing, Cascade for children, SetNull for optional refs; `Visit.slot` is NO ACTION so pet deletes can cascade). Money is Int minor units (except legacy `Donation.amount` Float); currency codes uppercase.
  - **Data-safe migration** (tested on a DB with legacy rows, then from scratch): enum renamed not recreated; duplicate (userId, petId) applications deleted before the unique index (keeps APPROVED, then PENDING, then newest); existing users `emailVerified=true`; legacy donations `SUCCEEDED`; pets with an approved application → `PENDING`; `colors` from `color`; Species/Breed/Location backfilled from the free-text columns (slug match) and `speciesId/breedId/locationId` set. `migrate diff` shows no drift.
  - **Seed** (`prisma/seed.ts`, `npx prisma db seed`, idempotent): 4 species, 17 breeds, 8 Bangladesh locations (lat/lng), Free/Pro/Premium plans matching `mockPlans` (cents: 0/1900/4900 monthly, 0/19000/49000 yearly; listings 3/25/100, media 5/12/20, featured 0/2/10, members 1/5/20, analytics on Pro+), `cost.estimates` Setting (from `petCosts.ts`), 2 FAQs, 3 pages, super admin + admin + verified sample shelter "Happy Paws Shelter" (slug `happy-paws`, weekly availability, 2 published pets with media and fees). Emails/passwords from `SEED_*` env; dev defaults `superadmin123` / `admin123` / `shelter123` (required in production).
  - **§1 fixes:** no password hashes in any response (`shared/selects.ts`: `publicUserSelect`, `userSafeSelect`); central error mapping in `globalErrorHandler` (ApiError, Zod 400 with `errors[]`, JWT 401, Prisma P2002 409 / P2025 404 / P2003+P2023+validation 400, Multer, bad JSON); `notFound` now before the error handler; login wrong password/unknown email → 401 (no enumeration), forgot-password always 200; blog/comment `userId` from token only; ownership checks on blog/comment/pet update/delete; comment controller read `:petId` instead of `:commentId` (fixed); pet create never set `userId` (fixed); `PATCH /adoption-requests/:id/status` never changed status (fixed); adoption guards (pet must be PUBLISHED, not own listing, one application per pet – WITHDRAWN is reopened, single approval with the pet row locked `FOR UPDATE`, approving auto-rejects other PENDING and sets pet PENDING, COMPLETED → pet ADOPTED); status decisions open to the listing owner (assertPetOwner) as well as admins; donate `currency` column + `amount` coerced to number, `GET /donate` admin-only; meta revenue from PAID `Payment` rows (`totalRevenue` USD + `revenueByCurrency`), fake `* 180` removed; `validateRequest` validates and replaces `body`, `query` and `params`; role change: only SUPER_ADMIN grants/revokes admin roles, audit-logged, sessions revoked; public `GET /pets` shows PUBLISHED + PENDING only, drafts visible to managers via `optionalAuth`; public `GET /blog` shows PUBLISHED only (admins see all); authors cannot self-publish.
  - **Hardening:** helmet, morgan (dev/combined), express-rate-limit (300/15 min per IP on `/api`, 20/15 min on login/register/refresh/forgot/reset/google/verify), CORS allow-list from `CORS_ORIGINS`, `trust proxy` from `TRUST_PROXY`, 1 MB body limit. Refresh cookie httpOnly + SameSite (lax dev / none prod) + Secure in prod + maxAge. Refresh rotation and revocation via `RefreshToken` (hashed; reuse after a 10 s grace revokes the family); `POST /auth/logout`; password change/reset sets `passwordChangedAt` (older access/reset tokens rejected) and revokes sessions; `auth` reloads role/status from the DB on every request. Also added `POST /auth/social/google` (ID token via google-auth-library; 503 until `GOOGLE_CLIENT_ID` is set), `POST /auth/verify-email/request` + `POST /auth/verify-email`, optional `role` (USER/OWNER/SHELTER) on register, verification email sent after register (fire-and-forget). Mobile can send `refreshToken` in the body to refresh/logout.
  - **Routing:** canonical base `/api/v1`; `/api` kept as an alias because `portal/.env` still points at `/api` (I4: switch the portal to `/api/v1`, then drop the alias). `GET /api/v1/health`. Stripe raw body mounted before `express.json` at `/api/v1/webhooks/stripe` (+ alias).
  - **Shared helpers** (`server/src/shared/`): `roles.ts` (`ROLES.ALL/ADMINS/LISTERS/ADOPTERS`, `isAdminRole`), `selects.ts`, `validation.ts` (`zId`, `idParams(...)`, `paginationQuery(sortable)`, `zBoolQuery`), `ownership.ts` (`assertPetOwner(userId, role, petId, opts?)`, `assertShelterAccess(userId, role, shelterId, opts?)`, `getActingShelter(userId)`, `assertSelfOrAdmin(...)`, `getPetManagerIds(petId)`), `audit.ts` (`recordAudit(input, tx?)`), `notify.ts` (`notify(userId, payload, tx?)`, `notifyMany`, `notifySafe`, `registerNotificationChannel` = extension point for socket/email/push), `entitlements.ts` (`getEntitlements(userId)`, `getUsage(ent)`, `assertWithinLimit(userId, feature, opts?)`, `isSubscriptionEntitled`), `logger.ts`. Middlewares: `auth(...roles)` + `optionalAuth`, `validateRequest`, `rateLimiter.ts` (`createRateLimiter`, `authLimiter`). `req.user` = `{ id, userId, email, role }` (typed globally in `interfaces/express.d.ts`). Socket.IO in `src/socket/index.ts` (`initSocket` from `server.ts`, handshake auth with the access token, room `user:<id>`, `registerSocketHandler`, `emitToUser`, `getIO`).
  - **Module skeletons** (empty routers, all registered in `app/routes/index.ts`): shelter `/shelters`, media `/media`, favorite `/favorites` (B3b); conversation `/conversations`, notification `/notifications`, report `/reports`, review `/reviews` + `shelterReviewRoutes` on `/shelters` (B3c); plan `/plans`, subscription `/subscriptions` + `adminBillingRoutes` on `/admin`, webhook `/webhooks` (B3d); lookup `/lookups`, cms `/cms`, setting `/settings`, auditLog `/admin/audit-logs`, admin `/admin` (B3e); visit `/visits` + `petVisitSlotRoutes` on `/pets` + `shelterVisitSlotRoutes` on `/shelters`, petFee on `/pets`, successStory `/success-stories` (B3f). Routers that share a prefix must put `auth()` on each route, never `router.use(auth())`.
  - **New deps:** helmet, express-rate-limit, morgan, socket.io, cloudinary, multer, stripe, google-auth-library (+ @types/morgan, @types/multer). Scripts: `typecheck`, `db:migrate`, `db:deploy`, `db:seed`; `prisma.seed` uses `ts-node --transpile-only`. `tsconfig.json` now `include: ["src/**/*"]` so `prisma/seed.ts` stays out of the build.
  - **New env** (all in `server/.env.example`, read in `src/config/index.ts`): `CORS_ORIGINS`, `TRUST_PROXY`, `COOKIE_SAMESITE`, `COOKIE_DOMAIN`, `EMAIL_VERIFY_LINK`, `EMAIL_VERIFY_TOKEN_EXPIRES_IN`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `AUTH_RATE_LIMIT_MAX`, `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET/FOLDER`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_SUCCESS_URL`, `STRIPE_CANCEL_URL`, `STRIPE_PORTAL_RETURN_URL`, `SUBSCRIPTION_GRACE_DAYS`, `GOOGLE_CLIENT_ID`, `SEED_SUPER_ADMIN_EMAIL/PASSWORD`, `SEED_ADMIN_EMAIL/PASSWORD`, `SEED_SHELTER_EMAIL/PASSWORD`. `EXPIRES_IN` example is `1d` (portal's refresh interceptor only retries on 500 – shorten to 15m in I4).
  - **Local tooling note:** Windows Application Control blocks Prisma's native `schema-engine-windows.exe`, so `prisma migrate *` cannot run on this machine (`prisma generate`, `db seed` and the query engine work). Migrations run in a helper container `petfinder-prisma-cli` (node:20, Prisma 5.11 CLI, mounts `server/prisma`, DB at `172.17.0.4:5432` inside Docker): `MSYS_NO_PATHCONV=1 docker exec petfinder-prisma-cli npx prisma migrate deploy` (or `migrate reset --force --skip-seed`); new migrations via `prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url postgresql://petfinder:petfinder@172.17.0.4:5432/petfinder_shadow --script` (`migrate dev` refuses non-interactive shells). Run `npx prisma generate` on the host afterwards. Port 5000 is used by another app on this machine; the smoke test ran with `PORT=5055`.
  - **Verified:** `tsc --noEmit` clean; migration applied on legacy data (backfill checked) and from scratch; no schema drift; seed runs twice; smoke test: login (cookie flags), wrong password 401, `GET /pets` (no password, `/api` alias), bad uuid / limit>100 → 400, unknown route 404, no/bad token 401, `GET /donate` 401 guest / 200 admin, register 201 + duplicate 409, apply 201 + duplicate 409, USER editing a pet 403, shelter approves → pet PENDING, re-approve 409, refresh rotation + reuse detection + logout, admin granting ADMIN 403, blog `userId` spoof ignored. DB left reset + seeded.
  - **Known issues / not done:** socket handshake not exercised by a real client; no test suite (T5); email delivery not tested (SMTP placeholder); shelter-scoped pet creation with plan limits, pet status/media/geo endpoints (B3b); withdraw/dispute endpoints (B3c); Stripe flows and donation payments (B3d; donations stay PENDING); shelter/owner analytics in meta (B3e); legacy free-text pet columns still present (drop after I4 moves the portal to lookup ids); `docs/AUTHENTICATION.md` etc. not updated (they were copied from another project).

- Phase 3b (shelters, pets, media, favorites) – done 2026-11-28. Dev DB has test rows `fav1@petfinder.test` / `own1@petfinder.test` (password `testpass123`).
  - `/shelters`: `POST /` (OWNER/SHELTER → PENDING, admins notified), `GET/PUT /me` (includes `access` and owner-only `plan {limits, usage}`), `POST /me/documents` (multipart `file`, pdf/jpeg/png/webp ≤ 8 MB, max 10), `DELETE /me/documents/:docId`, `GET/POST/PATCH/DELETE /me/members` (SHELTER; member limit; target must already have an account; USER ↔ SHELTER_MEMBER role switch). Public `GET /` (verified only for guests; search, type, location, minRating, sort) and `GET /:idOrSlug?petLimit`. Admin `GET /?status` and `PATCH /:id/verification {status, note}` (reject pauses published pets; audited, notifies).
  - `/pets`: create opened to listers (DRAFT default; publish checks plan limit; lookup ids or legacy text; `colors[]`, `lat/lng`). `PATCH /:id/status` lifecycle (ADOPTED/REMOVED terminal for non-admins; PENDING only via adoption). `GET /` adds `speciesId/breedId/locationId/shelterId`, `colors=black,white`, `featured`, geo `lat&lng&radius` (km, Haversine, `distanceKm`), featured first. `GET /mine` (alias `/my-pets`) with views and application counts. `GET /:id` adds `favorited` and counts views.
  - Media: `POST /media/upload` (single image → `{url, publicId,…}` for logos/avatars/story photos); `POST /pets/:id/media` (image ≤ 8 MB, mp4/webm ≤ 50 MB; magic-byte check; media limit), `PATCH /pets/:id/media/order {ids}`, `PATCH /pets/:id/media/:mediaId/cover`, `DELETE /pets/:id/media/:mediaId`. Without `CLOUDINARY_*` all uploads return 503.
  - `/favorites` (USER/OWNER): `GET /`, `GET /ids`, `PUT/DELETE /:petId` (idempotent).
  - Gaps: Cloudinary not tested live; shelter documents are public URLs (not signed delivery); expired featured boosts still sort first (`isFeatured` tells them apart); geo search paginates in memory; favorites handlers are inline in the routes file (should move to controller/service); no member invite flow; rejecting a shelter leaves pending adoptions alone.
- Phase 3c (applications, chat, notifications, reports, reviews) – done 2026-11-28. Wiring: two side-effect imports in `server.ts` (`./socket/chat`, `./app/modules/notification/notification.channels`).
  - `/adoption-requests`: `GET /inbox` (listers: own pets, own shelter, or MANAGER/EDITOR member), `PATCH /:id/withdraw` (applicant; PENDING/APPROVED; approved → pet back to PUBLISHED), `PATCH /:id/dispute {reason}` (applicant or pet manager; flags related conversations, notifies admins), admin `GET /disputes`, `PATCH /:id/dispute/resolve {note}`.
  - `/conversations`: `GET /` (counterparts, pet, lastMessage, unreadCount, isFlagged; admins `?flagged=true`), `GET /:id`, `POST / {petId, message?, userId?}` (one thread per pet + pair; adopter talks to the shelter owner or the pet creator), `GET /:id/messages?limit&cursor` (newest first, `nextCursor`), `POST /:id/messages {body}` (REST fallback, 30/min), `PATCH /:id/read`. Admins read flagged threads only, never send.
  - Socket (`src/socket/chat.ts`): client `message:send` (ack), `typing`, `read`; server `message:new`, `typing`, `read`, `notification:new` to room `user:<id>`. Membership re-checked per event; 10 msgs/10 s per socket; body 1–2000 chars.
  - `/notifications`: `GET /?unread` (meta.unread), `PATCH /:id/read`, `PATCH /read-all`, `POST /push-token {token, platform}`, `DELETE /push-token {token}`. Channels: socket, email (skipped without SMTP env; not for MESSAGE/LISTING), Expo push via `fetch` (drops `DeviceNotRegistered` tokens).
  - `/reports`: `POST /` (10/h; no self-report; duplicate open → 409), admin `GET /`, `PATCH /:id {status, action?, note}` with actions WARN / HIDE_LISTING / SUSPEND_USER / HIDE_REVIEW (audited, notifies).
  - Reviews: `POST /reviews {adoptionRequestId, rating, comment?}` after a COMPLETED adoption (adopter → shelter/owner, manager → adopter); public `GET /shelters/:shelterId/reviews`; admin `GET /reviews`, `PATCH /reviews/:id/hide {reason}`, `/unhide`; shelter rating recalculated.
  - Gaps: sockets and Expo push not exercised live (no client/token); rate limits in memory (single instance); no block-in-chat, message edit/delete, attachments or retention; shelter staff other than the owner can't join threads; no read endpoint for reviews of adopters; HIDE_LISTING leaves open applications untouched.
- Phase 3f (visits, pet fees, success stories) – done 2026-11-28. `server.ts` starts `startVisitReminders()` (every 10 min, one in-app reminder per CONFIRMED visit within 24 h, via `reminderSentAt`).
  - Slots: generated on read from weekly `ShelterAvailability` in the shelter timezone (Intl, 60-min slots, day capacity), merged with stored `VisitSlot` rows; a generated slot is stored only when booked. Shelter-wide slots (`petId` null) share one capacity across the shelter's pets.
  - `GET /pets/:petId/visit-slots?from&to` (public, PUBLISHED pets, default 14 days, max 31; `id` null = not yet stored, book by `startsAt`). `POST /visits {petId, slotId?|startsAt?, note?}` (USER/OWNER). `GET /visits/me`, `GET /visits/shelter?when=upcoming|past|all`. `PATCH /visits/:id {action: cancel|confirm|decline|complete|no_show, reason?}`. `GET/PUT /shelters/me/availability {days[{weekday 0=Mon, isOpen, times[], capacity}]}`, `GET/POST/DELETE /shelters/me/visit-slots`.
  - Guards (smoke-tested): two concurrent bookings on capacity 1 → one 201, one 409; past → 400; one active visit per user per pet → 409; own listing → 403; other user's PATCH → 403; complete/no-show before start → 400; status updates are compare-and-set.
  - Fees: `GET /pets/:petId/fees` → `{currency, total, fees[]}`; `PUT` (owner/admin) replaces the list (≤ 20, minor units, BDT).
  - Stories: public `GET /success-stories?species&shelterId&searchTerm`, `GET /:id`; listers `GET /mine`, `POST` (PENDING, or DRAFT with `draft`; consent required; https URLs; pet must belong to the shelter), `PUT /:id` (author, DRAFT/REJECTED only → PENDING); admin `GET /admin?status`, `PATCH /:id/status {status: PUBLISHED|REJECTED, moderationNote}` (note required for reject/unpublish; audited; notifies).
  - Gaps: OWNER listings without a shelter profile can't take visits; visit notices go through the B3c channels (socket, email when SMTP is set, push), there are no visit-specific email templates; past `startsAt` returns "That time is not available"; `petFee.routes.ts` has its controller inline.
- Phase 3d (Stripe subscriptions + donation payments) – done 2026-11-28. Stripe client in `modules/subscription/stripe.client.ts`; without `STRIPE_SECRET_KEY` (or a value containing "placeholder") Stripe endpoints return 503 and the server still boots.
  - `/plans`: public `GET /` (prices in cents, limits, `purchasable`); admin `GET /admin?includeArchived`; SUPER_ADMIN `POST /`, `PATCH /:id`, `DELETE /:id` (archive; Free can't be archived). Audited.
  - `/subscriptions`: `POST /checkout-session {planId, interval}` (OWNER/SHELTER account holder; 409 if a live Stripe subscription exists – changes go through the portal), `POST /portal-session`, `GET /me` (plan, limits, usage, subscription, `paymentsEnabled`, last 12 payments). The success page must poll `/me`, never trust the redirect.
  - Admin: `GET /admin/subscriptions`, `GET /admin/transactions` (Payment rows), `PATCH /admin/subscriptions/:id/override {planId, note} | {clear: true, note}`, `POST /admin/subscriptions/override {userId, planId, note}`. Audited, notifies.
  - Donations: `POST /donate/checkout-session {amount (major units), currency, donorName, donorEmail, message?}` (guests allowed) → PENDING donation + Checkout URL. Legacy `POST /donate` still records without payment (retire after I4).
  - Webhook `POST /webhooks/stripe`: signature-verified on the raw body; idempotent via `StripeEvent` inserted first in the same transaction (4 concurrent duplicates → 1 processed); handles `checkout.session.completed/expired/async_payment_*`, `customer.subscription.created/updated/deleted`, `invoice.paid`, `invoice.payment_failed`, `payment_intent.succeeded/payment_failed`. After every sync/override `enforcePlanLimits` pauses the newest PUBLISHED listings above the limit (never deletes) and un-features extras.
  - Local test with the Stripe CLI: create Pro/Premium test prices → `PATCH /plans/:id` with `stripePriceMonthlyId/YearlyId` → set `STRIPE_SECRET_KEY=sk_test_…` → `stripe listen --forward-to localhost:<PORT>/api/v1/webhooks/stripe` and put the `whsec_…` in `STRIPE_WEBHOOK_SECRET` → checkout with card 4242 4242 4242 4242; `stripe trigger invoice.payment_failed`; `stripe events resend evt_…` should be a duplicate.
  - Gaps: no job when a PAST_DUE grace period ends (listings pause only when Stripe sends the update; entitlements already stop at the grace date); refunds/disputes not handled; price ids not looked up in Stripe; an override on a Stripe subscription is lost if Stripe cancels it; failed webhook events are only logged (Stripe retries); `StripeEvent.payload` stores full events (may include emails).
- Phase 3 integration (coordinator, 2026-11-28): Stripe webhook exempted from the API rate limiter (`app.ts`); `DONATION_SUCCESS_URL` / `DONATION_CANCEL_URL` moved into `config.stripe` and `.env.example`; portal `redux/tagTypes.ts` now lists tags for every domain. Whole-server check: `tsc` clean; cross-module smoke test (28 checks: public lists, fees, visit slots, admin RBAC 403, shelter/subscription/inbox/visits/notifications/conversations/meta, 401 without token, 503 for Stripe without keys, 404, no password in `/pets`) all pass on port 5070. Leftover cleanup for later: favorites and pet-fee handlers are inline in their routes files.
- Phase 5 / T5 (critical and security tests) – done 2026-11-28. Re-run by the coordinator: server 9 suites / 40 tests pass, portal 9 tests pass, server `tsc` clean. No bugs found in the covered areas.
  - Run: `cd server && npm test` (Jest + Supertest, `--runInBand`); `cd portal && npm run test:security` (Node built-in runner, no deps).
  - Test DB: `petfinder_test` in the same Docker Postgres. `tests/setup/env.ts` forces that DB (throws otherwise), blanks SMTP/Cloudinary/Google, sets `STRIPE_SECRET_KEY=sk_test_dummy`, raises rate limits. After a new migration: `MSYS_NO_PATHCONV=1 docker exec -e DATABASE_URL=postgresql://petfinder:petfinder@<petfinder-pg IP>:5432/petfinder_test petfinder-prisma-cli npx prisma migrate deploy` (IP via `docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' petfinder-pg`).
  - Covered (`server/tests/`): auth (wrong password, refresh rotation + reuse → family revoked, logout, token before password change, blocked user), RBAC (admin endpoints, admin-role grants, self role change, last super admin), IDOR (pets, blogs, comments, visits, withdraw, conversations, notifications, VIEWER member), no password hash in 6 response families, adoption rules, visit double-booking (concurrent) + past slot + one active visit, Free listing limit, Stripe webhook (signature, process once, replay, same invoice new event), validation errors without stack in production. Portal `tests/jwt-verify.test.mjs`: same `jose` options as the middleware (valid, tampered, expired, wrong secret, `alg:none`, HS512, purpose tokens, missing claims, empty secret).
  - Not covered: rate limits, uploads, sockets, push, Google login, password reset, email verification, reports, reminders, plan downgrade, donation and subscription/checkout webhook events, the Next middleware itself and its redirect rules (it imports `next/server`, so the test repeats its `jose` calls).
  - Observation: reusing a rotated refresh token within the 10 s grace window still returns an access token (by design, for parallel tabs); outside it the token family is revoked.
- Backend follow-ups after I4 – done 2026-11-28 (`tsc` clean, each endpoint curled). `GET /shelters/:idOrSlug/reviews` accepts slugs; `POST /pets` breed and colours optional (no breed → `breedId` null, legacy text `""`); `PUT /pets/:id` `breedId: null` clears the breed; `POST /user/register` returns `accessToken` + `refreshToken` and sets the refresh cookie (same session as login); `GET /favorites` items use the `GET /pets` card shape (+ `favoritedAt`); new `DELETE /success-stories/:id` (author, DRAFT/REJECTED only, audited); favorites and pet-fee handlers moved to controller/validation files; `GET /visits/shelter` accepts `sortBy=startsAt|createdAt`; `EXPIRES_IN=15m` in `.env.example` and local `.env` (restart the dev server to apply). `GET /conversations` and `GET /visits/me` already honoured `page`/`limit` (no change; the earlier report was wrong).
- I4 portal public + user + auth hardening – done 2026-11-28.
  - Auth: O5 fixed – `/dashboard` and `/dashboard/profile` match exactly; every other `/dashboard/*` path is role-checked (USER → user, OWNER/SHELTER/SHELTER_MEMBER → shelter, ADMIN/SUPER_ADMIN → admin). Middleware verifies the JWT with `jose` (HS256, server-only `JWT_SECRET` in `portal/.env.local`, fails closed if missing; rejects tampered, expired, wrong-secret, `alg:none` and email-verification `purpose` tokens). axios: `withCredentials`, refresh on 401 only, single in-flight refresh, proactive refresh under 60 s left; errors now reject (callers use `.unwrap()`). Login retries the refresh cookie once, `redirect` accepts relative paths only; logout calls `POST /auth/logout`. Register has USER/OWNER/SHELTER. O6 fixed (name from `/user/profile`). Deleted `setAccessToken.ts`, `deleteCookies.ts`, `hooks/useVisits.ts`.
  - Full httpOnly token storage would need: API-set httpOnly access cookie on a shared parent domain (or a Next proxy route for login/refresh), the API reading it, CSRF protection on writes, and the socket handshake using the cookie.
  - Public pages on the API: home carousel + stories, `/pets` (lookups, filters, `colors`, sorts, pagination; offline preview only when no HTTP response), pet detail (media incl. video, fees, cost calculator from `cost.estimates`, favorites, apply (adopters only), message → `POST /conversations`, report, book a visit + cancel, related pets), `/shelters` + `/shelters/[id]` + reviews, `/stories`, `/pricing` (`/plans`; OWNER/SHELTER → checkout), `/donate` (checkout; monthly toggle removed – no recurring donations). imgbb removed; `utils/imageUploader.ts` uses `POST /media/upload`.
  - User dashboard: saved pets, messages (`components/Chat/ChatInbox` – props `{initialConversationId?, emptyHint?}`; Socket.IO `message:send` with REST fallback), notifications + app-bar bell, applications (withdraw), new My Visits page.
  - New API files: `lookupApi`, `favoriteApi`, `conversationApi`, `notificationApi`, `visitApi`, `shelterPublicApi`, `planApi`, `userReportApi`; helpers `lib/apiData.ts`, `lib/socket.ts`, `hooks/useAuthUser.ts`, `NotificationBell`. New deps: `jose`, `socket.io-client`.
  - Still on mock data (out of scope): blogs page, home Articles, Testimonials, donate imagery.
  - Coordinator check: `tsc` and `next build` pass (build needed one rerun, O1). Screenshots with real logins against the dev API: `/pets`, pet detail (fees, calculator, shelter card), `/pricing` dark, shelter overview, admin dashboard light + dark; an ADMIN opening `/dashboard/shelter` is redirected to `/dashboard/admin` (O5 confirmed); greeting shows the name (O6 confirmed). Screenshot script now logs in for a real token (`node cdp-shot.mjs email/password outDir specs…`, or `guest`).
  - Known: dark-mode chart text looked slightly stretched in one headless capture (canvas sizing on first paint; check in a real browser); test pets and the admin profile photo use a "450 x 420" placeholder image from the seed/test data.
  - API follow-ups (public agent): `EXPIRES_IN` should be short (e.g. 15m) – local `.env` has 7d; login/refresh also return `refreshToken` in the JSON body for web clients (needed by the app; consider returning it only to mobile clients); `GET /shelters/:id/reviews` rejects slugs; conversations always need a `petId`; `VisitStatus` has no DECLINED (decline → CANCELLED); `cost.estimates` is in major units.
- I4 portal dashboards (shelter/owner + admin) – done 2026-11-28; no mock data left on these pages. Verified: `tsc`, curl of every GET, smoke of pet create/update/fees/status/publish/delete, availability PUT, ADMIN role-change 403. Not browser-tested yet.
  - New API slices (`injectEndpoints`, prefixed names): `listingApi`, `shelterDashboardApi`, `inboxApi`, `billingApi`, `storyDashApi`, `adminApi`, `adminBillingApi`, `lookupAdminApi`, `cmsAdminApi`; `metaApi`/`userApi` extended. Helpers: `utils/dashboardHelpers.ts` (`runMutation`, `money`, dates), `components/Dashboard/Common/{Thumb,QueryState}.tsx`, `LineChart.tsx`, `useChartColors.ts`, `shelter/listings/components/ListingEditor.tsx` (Details / Photos & video / Adoption costs tabs).
  - Shelter: Overview (verification banner, create-profile form on 404, documents, KPIs + chart when the plan has analytics), Listings (limit meter, lifecycle actions, editor with lookups, media, fees in major units → minor), Applications (inbox, approve/reject/complete, dispute), Visits (actions + weekly availability; one visitors-per-slot value for all days), Stories (mine, submit/draft/resubmit), Team (hidden for OWNER – G4 fixed), Billing (plans, usage, payments, checkout/portal; polls `/subscriptions/me` after `?status=success`; 503 → "payments not configured" banner).
  - Admin: charts from `/meta/admin` (theme-aware colours – O7 fixed), Manage Users (server paging; admin-role options only for SUPER_ADMIN), Manage Pets / Add Pet / Manage Blogs on the new endpoints, Adoption Requests + Disputes tab, Shelter Verification, Reports (actions per target type), Stories moderation, Lookups, CMS, Audit Logs, Subscriptions (subscriptions, transactions, override; Plans CRUD tab for SUPER_ADMIN).
  - Mock exports now unused by dashboards: all of `mock/admin.ts`; `mock/shelter.ts` except `mockPlans` (still used by `/pricing` until the public agent switches it); `storySubmissions` types in `mock/stories.ts`.
  - API follow-ups: `POST /pets` requires a breed (editor sends `breed: "Mixed"`) and ≥ 1 colour; `PUT /pets/:id` can't clear `breedId`; `GET /visits/shelter` sorts only by `createdAt`; no delete for draft stories; monthly revenue is in major units and skips empty months. Not built: shelter profile edit UI (only onboarding). Unverified: Cloudinary/Stripe flows, visit confirm/complete and shelter verify/reject on real data, ListingEditor refetch after create.
- I4 mobile app – done 2026-11-28. The app runs on the real API; `src/data/mock.ts` deleted (types in `src/api/types.ts`; `utils/cost.ts` constants are only the calculator fallback). Verified: `tsc`, `expo export --platform android`, and a Node script mirroring the client against the dev API (auth + rotation, profile, conversation, Socket.IO handshake + live `message:new`, messages cursor, report, visit book/cancel, apply/withdraw, push-token, notifications, logout → revoked refresh 401). **Not run on a device/emulator.**
  - Client: `src/api/{client,api,types,socket}.ts`, `hooks/useAsync.ts`, `components/Async.tsx`, `ActionSheets.tsx`, `utils/date.ts`, `navigation.ts`. Base URL `EXPO_PUBLIC_API_URL` (`app/.env.example`; Android emulator `http://10.0.2.2:5080/api/v1`, iOS sim/web `http://localhost:5080/api/v1`, device `http://<LAN-IP>:5080/api/v1`).
  - Auth: `AuthScreen` (login; register USER/OWNER then auto-login). Tokens in `expo-secure-store` (web dev falls back to AsyncStorage); refresh token sent in the body (server already supports it), single in-flight refresh on 401, retry once; rejected refresh signs out. Guests browse; favorite/apply/book/message/report prompt sign-in.
  - Screens: Discover (`/pets` with prefs, `colors`, debounced search, load more; `/shelters`; `/success-stories`), Stories, Pet detail (media swatches, fees, cost modal from `cost.estimates`, visit slots + booking in shelter timezone, adopt sheet → `POST /adoption-requests`, report, message), Favorites (optimistic hearts), Applications (+ withdraw) and Visits (+ cancel), Messages/Chat (REST send, Socket.IO receive, inverted cursor list, mark read), Profile (`/user/profile`, notifications, logout).
  - New deps: `expo-secure-store` ~58.0.3 (plugin in `app.json`), `socket.io-client` ^4.8.4.
  - Not done: push registration (`expo-notifications` not installed; `registerPushToken()` ready in `api.ts`, TODO in `ProfileScreen.tsx`); nearby search (`expo-location` not installed); story mapping untested (no stories in dev DB); Hermes `Intl` timezone formatting and socket reconnect after token refresh untested; release Android builds may need cleartext for plain-HTTP URLs.
  - API follow-ups found: `GET /conversations` and `GET /visits/me` reportedly ignore `limit` (default 10); `GET /favorites` items lack `colors`/`media`/`description`; `POST /user/register` returns no tokens; pets without media have `image: ""`. (Error `stack` is only included when `NODE_ENV=development`, which is intended.)
- Phase 3e (admin, lookups, CMS, settings, audit logs, analytics) – done 2026-11-28. All mutations audited.
  - `/lookups/species|breeds|locations`: public GET returns active rows (admin + `?includeInactive=true` for all). Admin POST/PATCH/DELETE; slug from name; duplicates → 409; delete in use → 409.
  - `/cms/faqs?category`, `/cms/pages/:slug` (published only). Admin `/cms/admin/faqs` (CRUD + `PUT /order {ids}`) and `/cms/admin/pages` (CRUD, paginated).
  - `/settings/public` (whitelisted keys, today `cost.estimates`); admin `GET /settings`, `PUT /settings/:key {value}`. To add a key: `SETTING_SCHEMAS` (+ `PUBLIC_SETTING_KEYS`) in `modules/setting/setting.constant.ts`.
  - `/admin/audit-logs`: ADMIN/SUPER_ADMIN read; filters actor/role/action/entity/date/search; paginated.
  - `/admin/users` (list, `/:id`, `PATCH /:id/role {role}`, `PATCH /:id/status {status: ACTIVE|BLOCKED}`, `DELETE /:id` soft). Rules: no self role/status change; granting/revoking ADMIN or SUPER_ADMIN and acting on admin accounts is SUPER_ADMIN only; the last super admin cannot be demoted/blocked/deleted; role change, block and delete revoke sessions and notify. Legacy `/user/:id/change-role`, `/user/:id/status`, `/user/soft-deleted/:id` delegate to the same rules.
  - `/meta` adds `analytics` (admins) / `listingAnalytics` (listers). `GET /meta/admin`: users by role, pets by status, adoption funnel, 12-month users/requests/revenue (PAID payments, per currency). `GET /meta/listings`: overview always; monthly + top pets only when the plan has analytics (otherwise `analyticsEnabled:false`).
  - Gaps: no views history (totals only); revenue per currency, no FX; lookup/FAQ lists not paginated; a super admin can promote others to super admin (allowed by plan).

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
| Meet-and-greet visit booking (calendar of shelter slots; from Pawvelle's grooming booking calendar; free, no deposit) | High (conversion, fewer no-shows) | Med | v1.1 |
| Transparent fee breakdown + first-year cost calculator (from Pawvelle's pricing menu and hamper calculator) | Med (trust, fewer returns) | Low | MVP |
| Success-stories lookbook (masonry + filters + lightbox, before/after slider; admin-approved before publishing) | Med (SEO/trust) | Low–Med | v1.1 (moves up from "success stories") |

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

New for §8.1 features (if approved): `VisitSlot` (shelterId, petId?, startsAt, endsAt, capacity, timezone), `Visit` (slotId, userId, petId, status REQUESTED/CONFIRMED/CANCELLED/COMPLETED/NO_SHOW, note; unique userId+slotId), `PetFee` (petId, label, amount, currency; e.g. adoption fee, vaccination, microchip), `SuccessStory` (petId?, shelterId, title, body, beforeImage, afterImage, status DRAFT/PENDING/PUBLISHED, publishedAt) + `SuccessStoryMedia`; `Pet` += `colors` (string array, for colour filter chips).

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
- **visits (§8.1):** `GET /pets/:id/visit-slots?from&to`, `POST /visits`, `GET /visits/me`, `PATCH /visits/:id` (cancel by adopter; confirm/complete/no-show by listing owner); shelter `GET/POST/DELETE /shelters/me/visit-slots`. Guards: slot capacity in a transaction, no booking in the past or on non-published pets, one active visit per user per pet; reminders via notifications (email 24 h before).
- **fees:** `GET /pets/:id/fees` (public), `PUT /pets/:id/fees` (owner); cost calculator runs client-side from fees + static per-species estimates held in `Setting`.
- **success-stories:** `GET /success-stories?species&shelterId&page`, `GET /success-stories/:id`, `POST/PUT /success-stories` (shelter/owner, goes to PENDING), admin `PATCH /success-stories/:id/status`.
- Later: lost-found, matching.

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

### 8.1 Pawvelle-inspired "boutique" refresh (approved 2026-11-27, decision #6)

**What Pawvelle is:** a luxury pet-boutique and grooming-salon theme. It has two homepages (boutique, grooming spa), a product hero with colour swatches, shoppable lifestyle photos, bestseller cards with quick add, a grooming menu with transparent pricing, a booking calendar, a masonry lookbook with filters and lightbox, a hamper price calculator, and multi-row footers. Its look is described as "elegant, high-contrast", with CSS3 animations, Fraunces headings, Manrope body text and Tabler line icons. Its widget kit also includes a marquee text hero, circle (rotating) text, SVG blobs, a before/after slider, a timeline, a team grid, testimonials and pricing tables.

**Rule:** we borrow patterns and mood only. No Pawvelle code, images, copy, icons or layout clones (it is a paid theme). Use our own photos, which are Unsplash placeholders for now.

**Pattern mapping (Pawvelle → PetFinder):**

| Pawvelle pattern | PetFinder use | Where |
|---|---|---|
| Boutique / grooming twin homepages | One home with an audience switch ("Adopt" / "Rehome or list pets") that swaps the hero and CTAs | Portal home |
| Product hero with colour swatches | Pet-detail hero: large photo with thumbnail "swatches" (photos/video) and coat-colour chips; colour chips added as a `/pets` filter | Portal pet detail, `/pets`, app pet detail |
| Shoppable lifestyle photos | "Meet them at home" lifestyle photo with hotspots that open pet mini-cards | Portal home |
| Bestseller cards + quick add | Pet cards with quick actions on hover (save, quick view drawer, apply) | Portal `/pets`, home carousel |
| Grooming menu + transparent pricing | Fee breakdown on pet detail and a clear Plans page (Free/Pro/Premium) styled as a menu list | Portal pet detail, `/pricing`, shelter billing |
| Booking calendar | Meet-and-greet visit booking (date strip + time slots) | Portal pet detail, app pet detail, shelter dashboard "Visits" |
| Masonry lookbook + filters + lightbox | Success-stories page (masonry, species filter, lightbox), before/after slider | Portal `/stories`, home teaser |
| Hamper price calculator | First-year cost calculator (species, size, food, vet, insurance) | Portal pet detail + Resources |
| Timeline widget | "How adoption works" 4-step timeline | Portal home, About |
| Marquee + circle text | Slow marquee of trust phrases ("Verified shelters · Vet-checked · Free to browse"); rotating circle-text badge on hero CTA | Portal home |
| Team + testimonials | Shelter team on shelter profile; adopter testimonials carousel | Portal `/shelters/[id]`, home |
| Multi-row footer | Keep current 4-column footer; add a top row with newsletter and app-store badges | Portal footer |

**Visual system (delta on current Pawfect tokens; uses palette keys/`--pf-*` variables only):**
- Typography: headings **Fraunces** (variable, optical size; italic for emphasis words), body/UI **Manrope**. Replaces Raleway + Nunito. Load via `next/font/google` (portal) and `@expo-google-fonts/fraunces` + `@expo-google-fonts/manrope` (app).
- Palette: keep teal `#148F98` as primary and orange `#E8793A` as CTA accent. Add a luxury neutral base: ink `#1E1B18` (text, dark sections), cream `#FAF6F0` (page bg), sand `#EADFD2` (cards/dividers), and peach `#FDEEE4` for highlights. Dark mode: ink background, sand text, teal and orange lightened one step. *These hex values are our proposal; Pawvelle's real colours were not extracted.*
- Shape: large radii (24 px cards, pill buttons), arched image masks on heroes (rounded top only), one soft SVG blob per section at most, thin 1 px sand dividers, no heavy shadows (use a border plus a soft hover shadow).
- Imagery: warm, natural-light photos with consistent crop ratios (4:5 cards, 16:9 heroes). Pets fill the frame.
- Icons: Tabler icons (MIT): `@tabler/icons-react` in portal, `@tabler/icons-react-native` in app, replacing ad-hoc MUI icons over time.
- Motion: keep current Reveal and hover lift. Add the marquee, circle-text rotate and image-mask reveal. All off under `prefers-reduced-motion`.
- Avoid: `Tabs variant="scrollable"` (React 19 crash, see Phase log).

**Portal steps (Phase 2f):**
1. Tokens: fonts, neutrals, radii and dark-mode values in `portal/src/lib/theme/theme.ts` + `globals.css`; `tsc` + build + screenshots.
2. Shared components: `Marquee`, `CircleText`, `ArchImage`, `Timeline`, `QuickViewDrawer`, `BeforeAfter`, `Lightbox` in `components/UI/`.
3. Home: audience switch hero (arch photo + circle-text CTA) → marquee → category tiles → pets carousel with quick actions → lifestyle hotspot photo → adoption timeline → success-stories teaser → testimonials → shelter CTA. Keep the existing search card.
4. `/pets`: colour chips in the filter card, quick-view drawer, editorial header.
5. Pet detail: swatch gallery, fee breakdown, cost calculator, "Book a visit" panel next to Apply in the sticky card.
6. New pages: `/stories` (masonry lookbook), `/stories/[id]`, `/pricing` (menu-style plans).
7. Shelter dashboard: "Visits" page (weekly slot editor, upcoming visits list, confirm/no-show) and a "Stories" submit form. Admin: success-story moderation added to the existing queues pattern (`ReasonDialog`).
8. Footer top row; dark-mode check of all touched pages.

All of it uses mock data first (`portal/src/mock/`), as in earlier milestones.

**Mobile app steps (Phase 2f, coral app theme kept):**
1. Swap fonts to Fraunces/Manrope; add cream/sand neutrals to `app/src/theme.ts` (coral `#F7907C` stays primary).
2. Pet detail: thumbnail swatches under the parallax photo, colour chips, fee sheet, "Book a visit" bottom sheet (date strip + slot chips) next to "Adopt {name}".
3. New "Visits" list (upcoming/past) in the Applications tab as a segmented control.
4. Success stories: horizontal teaser on home, full masonry list screen (two-column staggered grid).
5. Cost calculator as a modal from pet detail.
Dark mode for the app stays out of scope unless requested.

**Backend steps (Phase 3f, after 3c):** see §5 (models) and §6 (`visits`, `fees`, `success-stories`). Steps: migrations → slot/visit service with a capacity transaction and timezone stored per shelter → notifications (confirm, cancel, 24 h reminder) → success-story CRUD + moderation + audit log → `colors` filter on `GET /pets` → integration tests for double-booking, past-slot, IDOR on visit updates.

## 9. Development phases & dependencies

| Phase | Scope | Depends on | Approval gate |
|---|---|---|---|
| 1 | Audit + this plan | – | **Current** |
| 2 | Frontend: 2a design system → 2b portal public/user → 2c shelter dashboard → 2d admin → 2e mobile app (contract-first/mock data) | Phase 1 + design approval | After each sub-milestone |
| 2f | Pawvelle-inspired refresh (§8.1): portal steps 1–8, then app steps 1–5, mock data | Approval of §8.1 + questions 6–9 | After portal, then after app |
| 3 | Backend: 3a hardening + fixes (§1) and migrations → 3b shelters/pets/media/favorites → 3c applications/chat/notifications/reports/reviews → 3d Stripe → 3e admin/CMS/audit → 3f visits/fees/success stories (§8.1) | Phase 2 contracts | After each sub-milestone |
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
6–9. Answered 2026-11-27, see decision #6.
