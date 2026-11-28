# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Petfinder is a monorepo with independent npm projects (no root `package.json`; install and run each separately). Delivery plan and phase status live in `docs/plan.md`; `app/` is an Expo (React Native) mobile app using mock data (`cd app && npm install && npx expo start`). `portal/` needs `npm install --legacy-peer-deps`.

- `server/` — Express + TypeScript + Prisma (PostgreSQL) REST API, mounted at `/api/v1`, default port 5000.
- `portal/` — Next.js (App Router) + MUI + Tailwind + Redux Toolkit/RTK Query.

## Commands

Server (`cd server`):
- `npm run dev` — ts-node-dev with respawn (`src/server.ts`)
- `npm run build` — `tsc` to `dist/`; `npm start` runs `dist/server.js`
- `npx tsc --noEmit` — type check
- `npx prisma migrate dev --name <name>` / `npx prisma generate` / `npx prisma studio` — schema in `server/prisma/schema.prisma` (`postinstall` runs `prisma generate`)
- `npm test` — Jest + Supertest critical/security suite in `server/tests/` against the separate `petfinder_test` DB (setup in `docs/plan.md`, Phase 5 log). Portal: `npm run test:security`.
- Local dev (this machine): API on port 5080 (5000 is taken), DB is Docker Postgres `petfinder-pg` on 5499; `prisma migrate` runs through the `petfinder-prisma-cli` container (see `docs/plan.md`, Phase 3a log).

Client (`cd client`):
- `npm run dev`, `npm run build`, `npm start`, `npm run lint` (`next lint`)

Env: server needs `server/.env` (`DATABASE_URL`, `JWT_SECRET`, `EXPIRES_IN`, `REFRESH_TOKEN_SECRET`, `REFRESH_TOKEN_EXPIRES_IN`, `RESET_PASS_TOKEN*`, SMTP settings; full template in README.md). Client reads `NEXT_PUBLIC_BACKEND_API_URL` (base URL including `/api/v1`).

## Architecture

**Server** — layered modules under `server/src/app/modules/<domain>/` (`AdoptionRequest`, `auth`, `blog`, `comment`, `donate`, `Meta`, `pet`, `user`), each with `*.routes.ts` → `*.controller.ts` → `*.service.ts` (+ `*.validation.ts` Zod schemas, `*.constant.ts`). Rules: routes only wire `auth(...roles)` and `validateRequest(schema)`; controllers are wrapped in `shared/catchAsync` and reply via `shared/sendResponse`; all business logic and Prisma access lives in services (`shared/prisma.ts` is the shared client). Errors go through `errors/` + `middlewares/globalErrorHandler`. Routers are aggregated in `app/routes/`. Env parsing is in `src/config/index.ts`; filtering/pagination helpers in `helpers/` and `shared/pick.ts`. Roles: `USER`, `ADMIN`, `SUPER_ADMIN`. `server/vercel.json` exists for Vercel deployment.

**Portal** — route groups in `portal/src/app/`: `(withCommonLayout)` for public pages (pets, blogs, home) and `(withDashboardLayout)` for authenticated dashboards, plus `login`/`register`. `src/middleware.ts` enforces auth via the `accessToken` cookie and restricts `/dashboard/user|admin|super-admin` by the role decoded from the JWT. Data access is split: public/SSR pages call `fetch(process.env.NEXT_PUBLIC_BACKEND_API_URL…)` directly, while dashboard features use RTK Query endpoints in `src/redux/api/*` (base config in `baseApi.ts`, cache tags in `tagTypes.ts`); auth helpers live in `src/services/` and axios setup in `src/helpers/axios/`.

## Docs caveat

`docs/` holds extended docs (ARCHITECTURE, API_GUIDELINES, AUTHENTICATION, DEPLOYMENT, etc.), but several (`CODING_RULES.md`, `AI_SYSTEM_PROMPT.md`, `TESTING_WORKFLOW.md`) were copied from another project called "Medico" and reference doctors, appointments, Ant Design, and `npm run lint:check` that do not exist here. Trust the code and README over those; the generic layering rules (Zod validation, thin controllers, bcrypt, IDOR checks) do apply.
