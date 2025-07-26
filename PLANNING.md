# AidXBait Admin Dashboard – Product & Technical Planning

## 1. Purpose & Vision

The Admin Dashboard is the **central back-office** tool that empowers AidXBait's operations team to manage every aspect of the platform. It provides:

• **Full CRUD** control for super-users over all business entities (users, therapists, products, categories, orders, reviews, etc.).
• **Role-based workflows** that expose only the actions and data relevant to each staff role (e.g., Inventory Manager, Support Agent, Content Editor).
• **Operational insights** through real-time metrics and dashboards to ensure service quality and inventory health.

The vision is a **single pane of glass** for non-technical staff to run the day-to-day business of AidXBait efficiently and securely.

## 2. Functional Scope (Current State)

### ✅ **Implemented Features**

1. **User Management**
   • CRUD operations for users with role-based permissions.
   • Users dashboard with table, filters & search functionality.
   • User role management and permission gates.

2. **Store Management**
   • Complete CRUD for **Products**, **Categories**, **Joints/Conditions**.
   • Reviews management system.
   • Bulk image upload to Supabase Storage.
   • React tabs UI for all store entities.

3. **Exercise Programs & Videos**
   • Full lifecycle management of exercise programs and video content.
   • Program-video relationship management.
   • Subscription system with automated expiration.
   • Rich admin UI with drag-and-drop video ordering.

4. **RBAC & Permissions**
   • Granular permission matrix with comprehensive role definitions.
   • UI gates that hide/disable unauthorized actions.
   • API route protection with `withAuth()` and `withPermission()` HOFs.

5. **Authentication & Security**
   • Supabase Auth integration with JWT verification.
   • Server-side client usage in all API routes.
   • Middleware-based route protection.

### 🚧 **In Progress / Next Priority**

6. **Store Orders Management**
   • Order tracking, payment status, and shipment management.
   • Refund and cancellation workflows.
   • Revenue analytics and KPI dashboards.

7. **Analytics & Reporting**
   • Cross-feature analytics dashboard.
   • Real-time metrics and charts.
   • Export capabilities (CSV, PDF).

8. **Audit Trail & Compliance**
   • Immutable log of critical actions for compliance.
   • UI viewer with filtering capabilities.

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

## 6. Data Model (current)

• **User** (role, permissions, profile).
• **Product** (id, name, category_id, joint_id, price, stock, images, soft_deleted).
• **Category** (id, name, icon).
• **Joint** (id, name, description).
• **Program** (id, title, description, joint_id, price, thumbnail_url, soft_deleted).
• **Video** (id, title, duration, url, program_id, soft_deleted).
• **ProgramSubscription** (id, user_id, program_id, status, expires_at).
• **Review** (id, product_id, user_id, rating, comment, soft_deleted).
• **Permission** (code, description) & **Role** (name, permission_codes[]).

_All tables have `soft_deleted`, `created_at`, `updated_at` where applicable._

## 7. Roadmap (next 3 sprints)

1. **Sprint 1 – Store Orders System** _(Current Priority)_
   • Implement `orders` table schema and relationships.
   • Build Orders dashboard page (`/dashboard/store/orders`).
   • Create order management API endpoints with full CRUD operations.
   • Add payment integration and refund workflows.

2. **Sprint 2 – Analytics & Reporting**
   • Cross-feature analytics dashboard with KPI widgets.
   • Real-time charts using Supabase Realtime subscriptions.
   • Export capabilities for orders, users, and program analytics.
   • Revenue tracking and forecasting tools.

3. **Sprint 3 – Advanced Features & Audit Trail**
   • Comprehensive audit logging system.
   • Advanced bulk operations for all entities.
   • User activity monitoring and impersonation features.
   • Performance optimizations and caching strategies.

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

_Last updated: 2025-01-21_
