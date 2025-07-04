# AidXBait Admin Dashboard – Product & Technical Planning

## 1. Purpose & Vision

The Admin Dashboard is the **central back-office** tool that empowers AidXBait's operations team to manage every aspect of the platform. It provides:

• **Full CRUD** control for super-users over all business entities (users, therapists, products, categories, orders, reviews, etc.).
• **Role-based workflows** that expose only the actions and data relevant to each staff role (e.g., Inventory Manager, Support Agent, Content Editor).
• **Operational insights** through real-time metrics and dashboards to ensure service quality and inventory health.

The vision is a **single pane of glass** for non-technical staff to run the day-to-day business of AidXBait efficiently and securely.

## 2. Functional Scope (MVP)

1. User Management
   • List, search & filter patients, therapists, and doctors.
   • Impersonate or reset user access when required.
2. Store Management
   • CRUD for **Products**, **Categories**, **Joints/Conditions** (taxonomy for filtering).
   • Bulk CSV/Excel import & image uploads to Supabase Storage.
3. Order & Payment Tracking
   • View order details, payment status, and shipment tracking.
   • Refund or cancel orders with proper permissions.
4. Content & Program Library
   • Manage exercise programs, video assets, and documentation.
   • Version control & publication scheduling.
5. RBAC & Permissions
   • Granular permission matrix with **superuser**, **admin**, **editor**, **viewer** roles.
   • UI gates hide or disable unauthorized actions.
6. Analytics Dashboard
   • Key KPIs: active users, completed sessions, best-selling products, revenue.
   • Export data (CSV, PDF) for offline reporting.
7. Audit Trail
   • Immutable log of critical actions (delete, refund, role change) for compliance.

## 3. Target Platforms

• **Web** – evergreen browsers (Chrome, Edge, Safari, Firefox) on desktop & tablet.
• Optimised for **1920×1080** but responsive down to **1024×768**.

## 4. Tech-Stack

| Layer         | Technology                                                       |
| ------------- | ---------------------------------------------------------------- |
| Frontend      | **Next.js 14** (App Router) + **React 18** + **TypeScript**      |
| Styling       | **Tailwind CSS** (w/ `shadcn/ui` components)                     |
| UI Primitives | CustomButton + extracted reusable components in `components/ui/` |
| State         | React Context Providers (lightweight) & optional **Zustand**     |
| Auth          | **Supabase Auth** (JWT) – server-side verification in API routes |
| Backend BaaS  | **Supabase** – Postgres, Storage, Realtime                       |
| Authorization | Custom RBAC layer (`lib/auth/api-auth.ts`)                       |
| Forms & UI    | `react-hook-form` + `zod` validation                             |
| CI/CD         | GitHub Actions → **Vercel** deployment                           |

## 5. Architectural Notes

• File-system routed API under `app/api/protected/**` follows **PostgREST** patterns.
• All data access occurs **server-side** via `lib/supabase/server.ts`; never expose service keys client-side.
• Route handlers are wrapped with `withAuth()` and `withPermission()` HOFs to enforce RBAC at the edge.
• Front-end consumes data exclusively through these API endpoints via `fetch()` – **no direct DB queries in components**.
• Reusable UI primitives reside in `components/ui/`; domain-specific widgets (e.g., `store/ProductsTab`) live under `components/store/`.
• Global providers mounted in `app/layout.tsx` manage auth state and toast notifications.
• Strict type definitions live in `types/` and are shared across front & back.
• Unit tests co-located with code (`*.test.ts`) and run in CI.

## 6. Data Model (draft)

• **User** (role, permissions, profile).
• **Product** (id, name, category_id, joint_id, price, stock, images, soft_deleted).
• **Category** (id, name, icon).
• **Joint** (id, name, description).
• **Order** (id, user_id, total, status, payment_id, created_at).
• **Review** (id, product_id, user_id, rating, comment, soft_deleted).
• **Permission** (code, description) & **Role** (name, permission_codes[]).
• **AuditLog** (id, actor_id, action, target_table, target_id, meta, created_at).

_All tables have `soft_deleted`, `created_at`, `updated_at` where applicable._

## 7. Roadmap (next 3 sprints)

1. **Sprint 1 – Core CRUD & RBAC**
   • Implement Users, Products, Categories, Joints, Reviews endpoints & UI.
   • Integrate Supabase Auth and permission gates.
2. **Sprint 2 – Orders & Analytics**
   • Orders dashboard, refund flow, revenue charts.
   • First version of KPI widgets using Supabase Realtime subscriptions.
3. **Sprint 3 – Bulk Ops & Audit Trail**
   • CSV import/export, bulk image uploader with progress feedback.
   • Persistent AuditLog with UI viewer & filters.

## 8. Risks & Mitigations

• **Permission leakage** – exhaustive unit tests & integration tests on `withPermission()` HOF.
• **Data inconsistency** – enforce foreign-key constraints & soft deletion filters in every query.
• **Supabase rate limits** – batch requests & leverage caching where possible.
• **Large image uploads** – use signed URLs & resumable uploads; validate MIME & size server-side.
• **Sensitive data exposure** – strict env separation, server-side rendering of secrets, HTTPS enforced.

## 9. Definition of Done

• 100% feature parity with mobile app back-office needs for MVP scope.
• CI passes: lint, type-check, unit tests ≥ 90% coverage on business logic.
• Zero **critical** Sentry errors in staging for ≥ 1 week.
• Lighthouse ≥ 90 performance & accessibility scores.
• All endpoints documented in Swagger & linked from README.

---

_Last updated: 2025-07-04_
