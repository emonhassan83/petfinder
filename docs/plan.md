# PetFinder – Product & Delivery Plan

Status: **Phase 2f (Pawvelle-inspired refresh, §8.1) done – portal P1–P8 and app A1–A5 – awaiting sign-off.** See the task tracker (§0.1) for open items. Backend (Phase 3) not started.

## 0. Decisions log

| # | Decision | Date |
|---|----------|------|
| 1 | `client/` renamed to `portal/` (portal + admin dashboard). Mobile is a **new Expo/React Native app** in `app/` (users only). | 2026-11-26 |
| 2 | Chat uses **self-hosted Socket.IO**; server moves from Vercel serverless to a persistent host (Railway/Render/VPS). | 2026-11-26 |
| 3 | Add `SHELTER` and `OWNER` roles plus a `ShelterProfile` model; existing roles kept. | 2026-11-26 |
| 4 | Plan file lives at `docs/plan.md`. | 2026-11-26 |
| 5 | Design direction (teal/coral/cream, Fraunces + Inter) approved; Phase 2 runs milestone by milestone. | 2026-11-26 |
| 6 | Approved: full Pawvelle-inspired refresh (§8.1) on top of the Pawfect palette for portal and app; meet-and-greet visits ship in **v1.1** (free, no deposit); success stories require **admin approval**; supplies/partner shop **dropped**. Phase 2f runs step by step. | 2026-11-27 |

## 0.1 Task tracker

Legend: ✅ done · 🔄 in progress · ⬜ to do · ⏸ blocked/needs decision. Update the row when a task changes state; details go in the Phase log below.

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
| B3a | Backend hardening + §1 fixes + migrations | ⬜ | |
| B3b | Shelters, pets, media, favorites APIs | ⬜ | |
| B3c | Applications, chat, notifications, reports, reviews | ⬜ | |
| B3d | Stripe subscriptions | ⬜ | |
| B3e | Admin, CMS, audit logs | ⬜ | |
| B3f | Visits, fees, success stories APIs (§8.1) | ⬜ | v1.1, after B3c |
| I4 | API integration (portal, admin, app) + token hardening | ⬜ | |
| T5 | Testing (critical/security first) | ⬜ | |

**Open items**

| ID | Item | Status | Notes |
|---|---|---|---|
| O1 | Upgrade Next.js (16.4.3 security advisory stops `next build` intermittently) | ⏸ | needs your go-ahead |
| O2 | Switch icons to Tabler (`@tabler/icons-react`) | ⬜ | deferred from P2 |
| O3 | Finish Pawvelle visual audit (demo blocked by Cloudflare) | ⏸ | needs screenshots or demo host |
| O4 | Phase 2 sign-off (2a–2e, polish, redesign) | ⏸ | waiting on you |
| O5 | **Security:** `portal/src/middleware.ts` lets any logged-in user open any `/dashboard/*` page (`commonPrivateRoutes` has `"/dashboard"` checked with `startsWith`, so role rules never run) | ⏸ | pre-existing; fix = exact match for `/dashboard` and `/dashboard/profile`; needs your go-ahead (I4 adds token verification) |
| O6 | Dashboard app bar shows "Hello, !" (name not read from the token) | ⬜ | pre-existing |
| O7 | Chart.js axis/legend text is low-contrast in dark mode (dashboard charts) | ⬜ | pre-existing |
| O8 | Phase 2f sign-off (P1–P8, A1–A5) | ⏸ | waiting on you |

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
