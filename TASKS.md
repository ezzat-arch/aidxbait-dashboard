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
- [x] PermissionGate component coverage across pages
- [ ] Admin UI to manage Roles & Permissions
- [ ] MFA enforcement toggle per user
- [ ] SSO (Google Workspace) for internal staff

## 3. Exercise Programs (High Priority)

> **Goal:** Full lifecycle management of exercise programs & videos, plus subscription analytics.

### 3.1 Schema

- [x] Create `programs`
- [x] Create `videos`
- [x] Create `program_videos` _(deprecated)_
- [x] Create `program_exercises` _(new - replaces program_videos with week ranges, volume, notes)_
- [x] Create `user_programs`
- [x] Create `exercise_program_subscriptions`
- [x] Create CRON job to expire subscriptions

### 3.2 API Routes (`app/api/protected/exercise-programs/**`)

- [x] List & Create programs (`route.ts`)
- [x] Read / Update / Delete a single program (`[id]/route.ts`)
- [x] Nested Videos CRUD (`[programId]/videos/**`) _(deprecated)_
- [x] Program Exercises CRUD (`[programId]/exercises/**`) _(new - with week ranges, volume, bilingual notes)_
- [x] Subscriptions CRUD (`/subscriptions/**`)
- [ ] Program analytics endpoint (`/analytics/programs/**`)

### 3.3 Storage & Media

- [x] Generate presigned upload URLs for video assets
- [x] Server-side video metadata extraction (duration, size)

### 3.4 Admin UI

- [x] Programs table with filters & search
- [x] `ProgramForm` dialog (title/description/thumbnail/price)
- [x] Drag-and-drop `VideoList` reorder & inline edit _(deprecated)_
- [x] Program Exercises modal with week-grouped table view _(new - 2025-12-21)_
  - [x] Exercise form with volume toggle (sets/reps vs hold duration)
  - [x] Bilingual notes support (English/Arabic)
  - [x] Week range configuration (start_week, end_week)
  - [x] Collapsible week groups for organized display
- [x] Subscriptions tab with cancel/renew actions
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

> **Goal:** Complete order management system with payment tracking and analytics.

### 5.1 Schema & API Routes

- [ ] `orders` table schema & FKs
- [ ] Protected endpoints (`/api/protected/store/orders/**`)
  - [ ] List/Search with filters (status, date range)
  - [ ] Refund / Cancel actions
  - [ ] Order details endpoint

### 5.2 Payment Integration

- [ ] Payment status webhook handler (Supabase Function)
- [ ] Refund processing workflow
- [ ] Payment method management

### 5.3 Store Orders Dashboard

- [ ] Orders dashboard page (`/dashboard/store/orders`)
  - [ ] Orders table with filters & search
  - [ ] Order detail drawer with timeline
  - [ ] Export invoice PDF
  - [ ] Bulk order actions (cancel, refund)
- [ ] Revenue KPI widgets (daily / MTD / YTD)
- [ ] Order status tracking and notifications

### 5.4 Integration & Analytics

- [ ] Integration with shipping providers
- [ ] Order analytics and reporting
- [ ] Customer order history tracking

## 6. Users Management

- [x] CRUD endpoints for Users
- [x] Users dashboard page
- [x] User table with filters & search
- [x] User role management
- [ ] User activity analytics
- [ ] User impersonation feature
- [ ] Bulk user operations

## 7. Audit Trail & Compliance

- [ ] `audit_logs` table + RLS policies
- [ ] Hook to record after each destructive action
- [ ] API endpoint & UI viewer (filters: actor, action, date)
- [ ] Download logs CSV
- [ ] Data retention job (purge > 1 year)

## 8. Analytics & Reporting (Cross-Feature)

- [x] Unified analytics dashboard page _(2025-10-24)_
  - [x] Modular question-based architecture
  - [x] Four tabs: Store Products, Exercise Programs, Home Visits (coming soon), Online Consultations (coming soon)
  - [x] Date range filter with URL state persistence
  - [x] Multiple visualization types (table, bar chart, line chart, pie chart, metric)
  - [x] Server-side query execution with service role client
  - [x] Recharts integration for data visualization
  - [x] 6 insightful Store Products questions
  - [x] 7 insightful Exercise Programs questions
  - [x] Developer documentation (@analytics.mdc)
  - [x] SQL migration for analytics RPC function
- [ ] Edge Function cron to materialise summary tables
- [ ] Export CSV / Print PDF functionality
- [ ] Realtime charts via Supabase Realtime
- [ ] Google Data Studio connector _(future)_

## 9. Quality & Testing

- [ ] Vitest + React Testing Library setup
- [ ] Coverage gate ≥ 90% for business logic
- [ ] Storybook for component catalogue
- [ ] Playwright e2e smoke tests
- [ ] Accessibility audits with `axe-core`

---

_Last updated: 2025-12-21_
