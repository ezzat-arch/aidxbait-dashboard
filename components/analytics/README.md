# Analytics Dashboard Components

This directory contains the modular analytics dashboard system for the AidXBait admin panel.

## Quick Start

To add a new analytics question, see the comprehensive guide in `.cursor/rules/analytics.mdc`.

## Directory Structure

```
analytics/
├── README.md                        # This file
├── analytics-header.tsx             # Client Component for UI (tabs, filter)
├── question-card.tsx                # Generic Server Component that renders any question
├── date-range-filter.tsx            # Client Component for date filtering
├── chart-renderers/                 # Recharts visualization components
│   ├── bar-chart-renderer.tsx
│   ├── line-chart-renderer.tsx
│   ├── pie-chart-renderer.tsx
│   └── metric-renderer.tsx
└── tabs/                            # Tab-specific question configurations
    ├── store-questions.ts           # Store Products analytics questions
    ├── store-tab.tsx                # Store tab renderer (async Server Component)
    ├── programs-questions.ts        # Exercise Programs analytics questions
    └── programs-tab.tsx             # Programs tab renderer (async Server Component)
```

## Architecture Principles

### Modularity

New questions require **only** SQL + config—no architectural changes.

### Server/Client Component Split

- **Main page** (`app/dashboard/analytics/page.tsx`) - Server Component that receives searchParams
- **Analytics Header** (`analytics-header.tsx`) - Client Component for interactive UI (tabs, date filter)
- **Tab Components** (`*-tab.tsx`) - Async Server Components for data fetching
- **Chart Renderers** - Client Components for Recharts visualization

This split allows URL-based state while keeping async Server Components for secure data access.

### Security

- All queries execute **server-side** in Server Components
- Uses **service role** to bypass RLS (page is permission-gated)
- SQL never exposed to browser

### Performance

- Server-side rendering
- Suspense boundaries for streaming
- Minimal client JavaScript (only for charts and interactive UI)

## Adding a Question: 30-Second Version

1. **Write SQL** (test in Supabase SQL Editor)
2. **Add config** to appropriate `*-questions.ts` file:
   ```typescript
   {
     id: "unique-id",
     title: "Question Title",
     type: "bar_chart", // or "table", "line_chart", "pie_chart", "metric"
     query: () => `SELECT name, value FROM ...`,
     chartConfig: { dataKey: "value", nameKey: "name" }
   }
   ```
3. **Done!** Tab automatically renders the new question.

Full walkthrough: `.cursor/rules/analytics.mdc`

## Date Range Filter

The date range filter uses a two-click selection system:

1. **Click first date** → Sets start date (visual feedback shown)
2. **Click second date** → Sets end date, auto-swaps if needed, closes popover
3. **Click "X"** → Clears temp selection

**Presets available:**

- Last 7 days
- Last 30 days
- Last 3 months
- Last year (365 days back)

**Features:**

- Dates auto-swap if clicked in reverse order
- Clicking same date twice creates single-day range
- Future dates are disabled
- Current range highlighted in calendar
- Helper text guides user through selection

## Database Setup

Run this migration to enable analytics queries:

```sql
-- See: supabase-migrations/analytics-rpc-function.sql
CREATE FUNCTION execute_analytics_query(query_text TEXT) ...
```

## Visualization Types

| Type         | Use Case               | Required Columns        |
| ------------ | ---------------------- | ----------------------- |
| `table`      | Raw data display       | Any columns             |
| `bar_chart`  | Category comparison    | `name`, `value`         |
| `line_chart` | Time series trends     | `name`, `value`         |
| `pie_chart`  | Proportional breakdown | `name`, `value`         |
| `metric`     | Single KPI             | Any (specify in config) |

## Common Patterns

### Date-filtered Query

```typescript
query: (dateRange: DateRange) => {
	const where =
		dateRange.from && dateRange.to
			? `AND created_at >= '${formatDateForSQL(dateRange.from)}'`
			: "";
	return `SELECT ... WHERE 1=1 ${where}`;
};
```

### Time-series Aggregation

```typescript
query: () => `
  SELECT 
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as name,
    COUNT(*) as value
  FROM table
  GROUP BY DATE_TRUNC('month', created_at)
  ORDER BY DATE_TRUNC('month', created_at) ASC
`;
```

### Join with Aggregation

```typescript
query: () => `
  SELECT 
    category.name as name,
    AVG(product.rating) as value
  FROM categories category
  JOIN products product ON category.id = product.category_id
  WHERE product.soft_deleted = false
  GROUP BY category.name
`;
```

## Troubleshooting

**"No data available"**

- Check query in Supabase SQL Editor
- Verify column names match `chartConfig`
- Ensure data exists where `soft_deleted = false`

**"Analytics query execution failed"**

- Run the SQL migration: `supabase-migrations/analytics-rpc-function.sql`

**Charts don't update with date filter**

- Ensure query function uses `dateRange` parameter
- Check date columns exist in WHERE clause

## Related Files

- **Types**: `types/analytics-types.ts`
- **Client**: `lib/supabase/analytics-client.ts`
- **Page**: `app/dashboard/analytics/page.tsx`
- **Docs**: `.cursor/rules/analytics.mdc`
