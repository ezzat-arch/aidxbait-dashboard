# AidXBait Admin Dashboard – Taskboard (Checkbox Edition)

## 0. Legend

- [x] Completed
- [ ] To-Do / In-Progress
- [-] Blocked / Waiting

## 1. Foundation & Dev-Ops

- [x] Initialise Next.js 14 + App Router workspace (`npx create-next-app --ts`)
- [x] Tailwind CSS & shadcn/ui setup
- [x] ESLint + Prettier + Husky pre-commit hooks
- [x] Supabase project & env vars
  - [x] `SUPABASE_URL` & `SUPABASE_ANON_KEY` in `.env.local`
  - [x] Service-role key in Vercel env settings
- [ ] CI: GitHub Actions → Vercel preview deployments
- [ ] Add Sentry error monitoring (browser & server)
- [ ] Semantic-release + automated changelog
- [ ] Playwright e2e tests on CI
- [ ] Lighthouse CI performance budget gate

## 2. Authentication & RBAC

- [x] Supabase Auth JWT verification middleware
- [x] `withAuth()` higher-order function
- [x] `withPermission()` HOF + permission config
- [x] Role/Permission seeding script
- [ ] PermissionGate component coverage across pages
- [ ] Admin UI to manage Roles & Permissions
- [ ] MFA enforcement toggle per user
- [ ] SSO (Google Workspace) for internal staff

## 3. Exercise Programs (High Priority)

> **Goal:** Full lifecycle management of exercise programs & videos, plus subscription analytics.

### 3.1 Schema

- [x] Create `programs`
- [x] Create `videos`
- [x] Create `program_videos`
- [x] Create `user_programs`
- [x] Create `exercise_program_subscriptions`
- [x] Create CRON job to expire subscriptions

### 3.2 API Routes (`app/api/protected/programs/**`)

- [ ] List & Create programs (`route.ts`)
- [ ] Read / Update / Delete a single program (`[id]/route.ts`)
- [ ] Nested Videos CRUD (`[programId]/videos/**`)
- [ ] Subscriptions CRUD (`/subscriptions/**`)
- [ ] Program analytics endpoint (`/analytics/programs/**`)

### 3.3 Storage & Media

- [ ] Generate presigned upload URLs for video assets
- [ ] Server-side video metadata extraction (duration, size)

### 3.4 Admin UI

- [ ] Programs table with filters & search
- [ ] `ProgramForm` dialog (title/description/thumbnail/price)
- [ ] Drag-and-drop `VideoList` reorder & inline edit
- [ ] Subscriptions tab with cancel/renew actions
- [ ] Charts: completion %, average watch time, active subscriptions

### 3.5 Realtime & Analytics

- [ ] Supabase Realtime listener for live progress updates
- [ ] Edge Function to aggregate daily program stats
- [ ] Dashboard widgets (active learners, expiring soon)

### 3.6 Testing

- [ ] Zod schema unit tests
- [ ] Integration tests for API routes (happy & failure cases)
- [ ] React Testing Library coverage for Program UI components

## 4. Store / Inventory Management

- [x] CRUD endpoints for Products, Categories, Joints, Reviews
- [x] Bulk image upload route (`upload-images/route.ts`)
- [x] React tabs UI (Categories, Joints, Products, Reviews)
- [ ] CSV import/export for products
- [ ] Low-stock alert rule (threshold configurable)
- [ ] Price history tracking table + chart
- [ ] Soft delete & restore flow in UI
- [ ] Unit tests for validation helpers

## 5. Orders & Payments

- [ ] `orders` table schema & FKs
- [ ] Protected endpoints (`/orders/**`)
  - [ ] List/Search with filters (status, date range)
  - [ ] Refund / Cancel actions
- [ ] Payment status webhook handler (Supabase Function)
- [ ] Orders dashboard page
  - [ ] Order detail drawer with timeline
  - [ ] Export invoice PDF
- [ ] Revenue KPI widgets (daily / MTD / YTD)

## 6. Audit Trail & Compliance

- [ ] `audit_logs` table + RLS policies
- [ ] Hook to record after each destructive action
- [ ] API endpoint & UI viewer (filters: actor, action, date)
- [ ] Download logs CSV
- [ ] Data retention job (purge > 1 year)

## 7. Analytics & Reporting (Cross-Feature)

- [ ] Edge Function cron to materialise summary tables
- [ ] Unified analytics dashboard page
  - [ ] Switch between Program, Store, Users, Orders metrics
  - [ ] Export CSV / Print PDF
- [ ] Realtime charts via Supabase Realtime
- [ ] Google Data Studio connector _(future)_

## 8. Quality & Testing

- [ ] Vitest + React Testing Library setup
- [ ] Coverage gate ≥ 90% for business logic
- [ ] Storybook for component catalogue
- [ ] Playwright e2e smoke tests
- [ ] Accessibility audits with `axe-core`

---

_Last updated: 2025-07-04_
