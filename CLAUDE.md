# Shared Expenses Tracker

## Purpose

Private web app for two people (Landon and Emma) to track income and expenses for one shared bank account, plus a shared grocery list and spending analytics.
No bank API. Manual entry only. Live "remaining working balance" computed from incomes minus expenses.

## Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4
- **Backend**: Convex (real-time database, file storage, server functions)
- **Hosting**: Vercel
- **Auth**: Passcode gate (no real auth system)
- **Charts**: CSS-only bars / conic-gradient donut (no chart library)
- **Icons**: `lucide-react`
- **Theming**: `next-themes` (dark by default, light toggle in Settings)
- **Design source**: Claude Design project "Expense Tracker" (mobile frames); tokens and `gt-*` / `m-*` kit classes are ported into `app/globals.css`. Font: Space Mono via `next/font`.
- **Passcode hashing**: `bcryptjs`
- **Testing**: Vitest + `convex-test`

Pinned versions: `next@16.1.6`, `react@19.2.3`, `convex@^1.32.0`, `tailwindcss@^4`, `vitest@^4`.

### Scripts

| Script | Command | Notes |
|--------------|------------------------------|----------------------------------|
| `dev` | `next dev` | |
| `build` | `convex codegen && next build`| Codegen before Next build |
| `start` | `next start` | |
| `lint` | `eslint` | ESLint 9 + Prettier integration |
| `test` | `vitest run` | |
| `test:watch` | `vitest` | |

## Project Structure

```
app/
  page.tsx                       # Gate: redirect to /dashboard or /unlock
  layout.tsx                     # Root layout: font, Convex, Auth, Actor, Theme providers
  globals.css                    # Tailwind + design tokens + ported kit classes
  error.tsx / global-error.tsx / not-found.tsx
  unlock/page.tsx                # PIN keypad (4-digit, 5 fails -> 30s lockout)
  dashboard/page.tsx             # Home: balance hero + analytics + recent
  transactions/page.tsx          # Ledger: chip filters, date/amount sort, month groups, FAB
  transaction/[id]/page.tsx      # Detail: hero, details, receipt, version history, edit/delete
  grocery/page.tsx               # Grocery list: store chips, completed section, FAB
  settings/page.tsx              # Categories + Stores (segmented) + theme + lock
components/
  AppShell.tsx                   # Passcode gate + bottom tab bar; exports AppBar
  ui.tsx                         # Primitives: Segmented, Chip, Badge, PersonChip, PersonPick,
                                 #   ActorSwitch, Field, Modal (bottom sheet), ConfirmDialog,
                                 #   ColorPicker, Empty
  AuthContext.tsx                # { isUnlocked, isLoading, unlock, lock } via localStorage
  ActorContext.tsx               # "Acting as" person (defaults enteredBy/spentBy/addedBy)
  ConvexClientProvider.tsx
  ThemeProvider.tsx
  BalanceHero.tsx                # Working balance + sparkline + totals
  Analytics.tsx                  # 1M/3M/6M/ALL range, stats, monthly bars, donut, top categories
  TxnRow.tsx                     # Transaction list row
  TransactionFormModal.tsx       # Create/edit income + expense (type switch when creating)
  ReceiptUploader.tsx            # Receipt slot: tap to upload / replace, image preview
  GroceryItemModal.tsx           # Add/edit grocery item
  EntityFormModal.tsx            # Create/edit/delete category or store
  QueryErrorBoundary.tsx
lib/
  types.ts              # Person, TxnType enums
  money.ts              # formatCents, parseMoneyToCents (cents <-> dollars)
  validation.ts         # validateIncome, validateExpense
  dates.ts              # validateDateRange, getMonthBuckets (analytics)
  categories.ts         # name/color validation + normalization helpers
  display.ts            # PEOPLE, fmtDate, fmtDateTime, monthLabel, todayISO, daysAgoISO
  __tests__/            # money.test.ts, validation.test.ts
convex/
  schema.ts             # Tables (see Data Model)
  transactions.ts       # Transaction queries + mutations + receipt upload
  categories.ts         # Category queries + mutations
  grocery.ts            # Grocery item queries + mutations
  groceryStores.ts      # Grocery store queries + mutations
  dashboard.ts          # getDashboardAnalytics
  passcode.ts           # verifyPasscode action
  __tests__/            # transactions.test.ts
```

Old routes `/settings/categories` and `/grocery/stores` redirect to `/settings` (see `next.config.ts`).

## Data Model

### Enums

- `Person`: `"landon"` | `"emma"`
- `TxnType`: `"income"` | `"expense"`

### Named-color entity pattern

`categories` and `grocery_stores` share an identical shape: a user-named, color-coded
entity used as an optional foreign key. Both store a display name plus a normalized name
for duplicate detection. See Categories / Grocery sections for the shared validation rules.

### Table: `categories`

| Field | Type | Notes |
|----------------|----------------|----------------------------------|
| nameDisplay | string | As typed |
| nameNormalized | string | Lowercased/trimmed, dedup key |
| color | string | Hex color |
| createdAt | number (ms) | |
| updatedAt | number (ms) | |

Indexes: `by_nameNormalized`, `by_nameDisplay`

### Table: `transactions`

Container for a logical transaction. Versions change over time.
| Field | Type | Notes |
|------------------|--------------------------------------|---------------------------|
| type | TxnType | |
| activeVersionId | Id<"transaction_versions"> \| null | Points to current version |
| categoryId | Id<"categories"> \| null (optional) | Expense categorization |
| createdAt | number (ms epoch) | |
| createdBy | Person | |
| updatedAt | number (ms epoch) | |

Indexes: `by_createdAt`

### Table: `transaction_versions`

Immutable version records. One is "active" via `transactions.activeVersionId`.
| Field | Type | Notes |
|---------------------|---------------------------------------|--------------------------------|
| transactionId | Id<"transactions"> | |
| type | TxnType | Redundant for querying |
| amountCents | number (int) | Always positive |
| entryDate | string \| null | ISO date `YYYY-MM-DD` or null |
| description | string \| null | Required for expense |
| spentBy | Person \| null | Required for expense |
| enteredBy | Person | Required for all |
| receiptFileId | Id<"\_storage"> \| null | Expense only |
| createdAt | number (ms epoch) | |
| supersedesVersionId | Id<"transaction_versions"> \| null | Optional link to prior version |

Indexes: `by_transactionId`, `by_transactionId_createdAt`

### Table: `grocery_stores`

Same shape as `categories` (nameDisplay, nameNormalized, color, createdAt, updatedAt).
Indexes: `by_nameNormalized`, `by_nameDisplay`

### Table: `grocery_items`

| Field | Type | Notes |
|-------------|----------------------------------|-----------------------------------|
| name | string | Required |
| quantity | number (int) | >= 1 |
| storeId | Id<"grocery_stores"> \| null | Optional store assignment |
| addedBy | Person | |
| completed | boolean | |
| completedBy | Person \| null | Set when toggled complete |
| completedAt | number (ms) \| null | Set when toggled complete |
| createdAt | number (ms epoch) | |
| updatedAt | number (ms epoch) | |

Indexes: `by_completed_createdAt`, `by_storeId`

### Receipt Storage

- Convex file storage (`_storage`)
- `receiptFileId` stored on the version
- On replace: delete old file, store new, update active version
- No receipt history

## Money Rules

- Store all amounts in **cents (integer)**. No floats anywhere.
- Display as dollars with exactly 2 decimals.
- Balance = sum(all income active versions) - sum(all expense active versions)
- Negative balances allowed.
- `lib/money.ts` handles all parse/format operations.

## Categories

- Optional categorization for expenses via `transactions.categoryId`.
- Shared named-color entity: display name + normalized name + hex color.
- Validation (`lib/categories.ts`): name 1-30 chars, 1-3 words; hex color format; duplicates rejected by normalized name.
- Deleting a category **unlinks** it from all transactions (sets `categoryId` to null). It does not delete transactions.
- Managed at `/settings` (Categories tab, `EntityFormModal`). Surfaced in transaction rows (`TxnRow`), ledger chip filters, and `Analytics`.

## Grocery List

- Two tables: `grocery_stores` (named-color entity, same rules as categories) and `grocery_items`.
- Items have a name, integer quantity (>= 1), optional store, and completion state.
- Completion tracks the actor and timestamp (`completedBy`, `completedAt`); toggling off clears them.
- `/grocery`: list with store chips, completed section, FAB that opens `GroceryItemModal`.
- Stores are managed at `/settings` (Grocery Stores tab, `EntityFormModal`).
- Deleting a store **unlinks** it from all items (sets `storeId` to null).
- `clearCompleted` bulk-deletes all completed items.

## Analytics

- `getDashboardAnalytics({ startDate?, endDate })` returns: `totalIncome`, `totalExpenses`, `transactionCount`, `pieChartData`, `monthlyBarChartData`, `topCategories`. Omitting `startDate` means "all time" (starts at the earliest dated active version).
- UI ranges: 1M / 3M / 6M / ALL (`Analytics.tsx`), persisted in localStorage.
- Pie chart aggregates expenses by category; slices below a 3% threshold collapse into "Other".
- Monthly bar chart includes every month in the range (`lib/dates.ts` `getMonthBuckets`), showing income vs. expense.
- Rendered by `Analytics` (stat tiles, CSS monthly bars, conic-gradient donut, top categories).

## Passcode Gate

- `PASSCODE_HASH` env var (bcrypt preferred) or `PASSCODE` env var
- Convex action `verifyPasscode({ attempt })` compares server-side -> `{ success }`
- On success: `localStorage.unlocked=true` via `AuthContext` (`useAuth()`)
- UI: 4-digit PIN keypad (keyboard digits work too); 5 failed attempts triggers a 30s cooldown with live timer
- App must not render any data until passcode verified
- `app/page.tsx` redirects based on unlock state
- Gated routes wrap their screen in `AppShell`, which redirects to `/unlock` when locked and only mounts children once unlocked, so screens can query Convex unconditionally

## API Surface (Convex Functions)

### transactions.ts

Queries:
- `getBalance()` -> `{ balanceCents, totalIncome, totalExpenses, count, series }` (active versions only; `series` = running balance sampled to <=24 points for the sparkline)
- `listTransactions({ page?, pageSize?, sortField?, sortDirection?, categoryFilter?, typeFilter?, startDate?, endDate? })` -> `{ transactions, totalCount, totalPages, page, pageSize }` (newest-first default, joined with active version; sort by date/amount/category; default 25/page)
- `getTransaction(transactionId)` -> container + active version
- `listTransactionHistory(transactionId)` -> all versions, newest first
- `getReceiptUrl(storageId)` -> signed URL

Mutations:
- `createIncome(payload)` -> creates container + version, sets activeVersionId
- `createExpense(payload)` -> creates container + version, sets activeVersionId
- `editIncome(transactionId, payload)` -> new version, update activeVersionId
- `editExpense(transactionId, payload)` -> new version, update activeVersionId
- `generateUploadUrl()` -> upload URL for receipt
- `replaceReceipt(transactionId, newReceiptFileId)` -> delete old file, attach new
- `deleteTransaction(transactionId)` -> hard delete container + all versions + all receipt files

### categories.ts

- `listCategories()` -> categories (sorted by display name)
- `createCategory({ nameDisplay, color })`
- `updateCategory(categoryId, { nameDisplay?, color? })`
- `deleteCategory(categoryId)` -> unlinks from all transactions

### grocery.ts

- `listItems()` -> items enriched with `store`
- `addItem({ name, quantity, storeId?, addedBy })`
- `editItem(itemId, { name?, quantity?, storeId? })`
- `toggleItem(itemId, completedBy)`
- `deleteItem(itemId)`
- `clearCompleted()` -> `{ deleted }`

### groceryStores.ts

- `listStores()` -> stores (sorted by display name)
- `createStore({ nameDisplay, color })`
- `updateStore(storeId, { nameDisplay?, color? })`
- `deleteStore(storeId)` -> unlinks from all items

### dashboard.ts

- `getDashboardAnalytics({ startDate, endDate })` (see Analytics)

### passcode.ts

- `verifyPasscode({ attempt })` -> `{ success }` (bcrypt action)

## Validation Rules (server is source of truth)

### Income

- `amountCents` > 0, required
- `entryDate` required
- `enteredBy` required

### Expense

- `amountCents` > 0, required
- `entryDate` required
- `description` required
- `spentBy` required
- `enteredBy` required

### Category / Grocery Store

- `nameDisplay` 1-30 chars, 1-3 words
- `color` valid hex
- No duplicate by normalized name

### Grocery Item

- `name` required
- `quantity` integer >= 1

Client validation mirrors server rules. Server rejects invalid payloads with clear errors.

## UI Behavior

Mobile-first: content column max 560px (760px on >=768px), fixed bottom tab bar (Home / Ledger / Grocery / Settings), FAB for primary add actions, forms open as bottom sheets (centered cards on >=640px).

### Home (`/dashboard`)

- `AppBar` with `ActorSwitch` (acting-as person, persisted in localStorage)
- `BalanceHero`: working balance, sparkline, total in / out / entries
- `Analytics` with 1M/3M/6M/ALL segmented range
- Recent 4 transactions + "SEE ALL" link to `/transactions`
- FAB opens `TransactionFormModal`

### Ledger (`/transactions`)

- Chips: All / Income / Expenses / each category / Uncategorized
- Sort toggle (date <-> amount) in the app bar; date sort groups rows by entry month
- 50 rows per page with a small pager; FAB to add

### Transaction Form Modal

- Bottom sheet; type segmented (expense/income) when creating, fixed when editing
- Income: amount, date, description (optional), entered by
- Expense: amount, date, description, spent by, entered by, category chips, receipt slot
- Defaults spentBy/enteredBy to the current actor; client validation mirrors server

### Transaction Detail (`/transaction/[id]`)

- Hero (type pill, signed amount, description, date, version count)
- Details card, receipt slot (tap to upload/replace, image preview + open link), version history timeline
- Edit (pencil) opens prefilled modal; delete (trash) opens `ConfirmDialog`, routes back to `/transactions`

### Grocery (`/grocery`)

- Store chips (All / each store / No store), active list, completed section with CLEAR (confirm)
- Check toggles completion as the current actor; tapping the item text opens the edit modal; trash deletes
- FAB opens `GroceryItemModal`

### Settings (`/settings`)

- Segmented Categories / Grocery Stores list; tapping a row opens `EntityFormModal` (edit + delete); "+ NEW" creates
- Theme toggle (sun/moon) in the app bar; "Lock app" row

### Edit Flow

- Creates new version (never overwrites)
- Sets new `activeVersionId`
- Old versions remain viewable in history

### Delete Flow

- Hard delete: container + all versions + all receipt files
- No soft delete, no "deleted" state

## Non-Goals

- No bank sync
- No exports or backups
- No multi-user auth or roles
- No historical balance-by-date views
- No prevention of negative balances
- No soft deletes

## Testing

### Unit Tests (Vitest)

- `lib/money.ts`: parse `"$1.23"` -> `123`, format `123` -> `"$1.23"`, reject invalid
- `lib/validation.ts`: expense requires description/spentBy, income does not require spentBy

### Backend Tests (`convex-test`)

- `convex/__tests__/transactions.test.ts`
- createIncome: creates container + version, sets activeVersionId
- editExpense: new version, activeVersionId updates, old version remains
- deleteTransaction: removes container + versions + receipt files

### Integration Happy Paths

- Unlock -> dashboard loads
- Create income -> balance increases, list shows new entry
- Create expense with receipt + category -> balance decreases, receipt viewable, category badge shown
- Edit -> history shows prior version, list reflects new
- Replace receipt -> old inaccessible, new displayed
- Delete -> removed from list, balance recomputed
- Add grocery item -> appears in list; toggle complete -> moves to completed; clear completed -> removed

## Environment Variables

- `CONVEX_DEPLOYMENT` / Convex URL keys
- `PASSCODE_HASH` (preferred) or `PASSCODE`

## Key Invariants

- Balance computed from active versions only
- `listTransactions` uses `activeVersionId` only
- Edit creates version then sets `activeVersionId` in same mutation
- Receipt replace deletes old file before attaching new
- Deletion removes everything (container, all versions, all receipt files)
- All money operations use integer cents end-to-end
- Gate blocks all Convex queries until passcode verified (`AppShell` does not mount screens until unlocked)
- Sorting defaults to container `createdAt`, not `entryDate`
- Named-color entities (categories, grocery stores) dedup by normalized name
- Deleting a category/store unlinks its foreign key (nulls it); it never cascades to transactions or items
- Grocery completion records both actor (`completedBy`) and timestamp (`completedAt`)
```
