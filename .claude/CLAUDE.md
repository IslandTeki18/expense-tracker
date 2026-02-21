# Shared Expenses Tracker

## Purpose

Private web app for two people to track income and expenses for one shared bank account.
No bank API. Manual entry only. Live "remaining working balance" computed from incomes minus expenses.

## Stack

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend**: Convex (real-time database, file storage, server functions)
- **Hosting**: Vercel
- **Auth**: Passcode gate (no real auth system)

## Project Structure

```
app/
  page.tsx              # Gate: redirect to /dashboard or /unlock
  unlock/page.tsx       # Passcode entry
  dashboard/page.tsx    # Main view: balance + transaction list
  transaction/[id]/page.tsx  # Detail + history view
components/
  PasscodeForm.tsx
  BalanceHeader.tsx
  TransactionList.tsx
  TransactionRow.tsx
  TransactionFormModal.tsx
  ReceiptUploader.tsx
  HistoryPanel.tsx
lib/
  money.ts              # Parse/format cents <-> dollars
  validation.ts         # Shared validation rules
convex/
  schema.ts             # Tables: transactions, transaction_versions
  transactions.ts       # Queries + mutations
  passcode.ts           # verifyPasscode function
```

## Data Model

### Enums

- `Person`: `"you"` | `"wife"`
- `TxnType`: `"income"` | `"expense"`

### Table: `transactions`

Container for a logical transaction. Versions change over time.
| Field | Type | Notes |
|------------------|-----------------------------------|--------------------------|
| type | TxnType | |
| activeVersionId | Id<"transaction_versions"> | Points to current version|
| createdAt | number (ms epoch) | |
| createdBy | Person | |
| updatedAt | number (ms epoch) | |

Indexes: `by_createdAt`, `by_type_createdAt` (optional)

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

Indexes: `by_transactionId_createdAt`, `by_transactionId`

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

## Passcode Gate

- `PASSCODE_HASH` env var (bcrypt preferred) or `PASSCODE` env var
- Convex function `verifyPasscode(attempt)` compares server-side
- On success: `localStorage.unlocked=true` + in-memory flag
- App must not render any data until passcode verified
- `app/page.tsx` redirects based on unlock state
- `/dashboard` hard-blocks Convex queries until unlocked
- Optional: client cooldown after 5 failures

## API Surface (Convex Functions)

### Queries

- `getBalance()` -> `{ balanceCents }` (sum incomes - sum expenses, active versions only)
- `listTransactions(limit, cursor?)` -> newest-first by `createdAt`, joined with active version
- `getTransaction(transactionId)` -> container + active version
- `listTransactionHistory(transactionId)` -> all versions for history view

### Mutations

- `createIncome(payload)` -> creates container + version, sets activeVersionId
- `createExpense(payload)` -> creates container + version, sets activeVersionId
- `editIncome(transactionId, payload)` -> new version, update activeVersionId
- `editExpense(transactionId, payload)` -> new version, update activeVersionId
- `replaceReceipt(transactionId, fileId)` -> delete old file, attach new
- `deleteTransaction(transactionId)` -> hard delete container + all versions + all receipt files

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

Client validation mirrors server rules. Server rejects invalid payloads with clear errors.

## UI Behavior

### Dashboard

- `BalanceHeader`: current computed balance
- `TransactionList`: mixed income/expense, newest-first by container `createdAt`
- Each row: type, amount, entryDate, description, spentBy (expense), enteredBy, receipt indicator
- No grouping by day
- Loading and error states required

### Transaction Form Modal

- Shared base with type-specific sections
- Income: amount, date, description (optional), enteredBy
- Expense: amount, date, description, spentBy, enteredBy, receipt upload
- Client validation blocks submit until required fields provided
- Submit wires to create/edit mutations
- List updates via Convex reactivity

### Transaction Detail Page (`/transaction/[id]`)

- Active version data via `getTransaction`
- History list via `listTransactionHistory`
- Edit button opens prefilled modal
- Delete button with confirmation, routes back to dashboard

### Edit Flow

- Creates new version (never overwrites)
- Sets new `activeVersionId`
- Old versions remain viewable in history

### Delete Flow

- Hard delete: container + all versions + all receipt files
- No soft delete, no "deleted" state

## Non-Goals

- No bank sync
- No categories or tags
- No exports or backups
- No multi-user auth or roles
- No historical balance-by-date views
- No prevention of negative balances
- No soft deletes

## Build Sequence

1. Scaffold Next.js + Tailwind + Convex wiring
2. Passcode gate blocking all data
3. Convex schema + read queries (list, balance, detail, history)
4. Dashboard read UI (balance header, transaction list)
5. Create income (form, client validation, mutation)
6. Create expense (extended form, mutation, receipt placeholder)
7. Transaction detail + history (read-only)
8. Edit income/expense (versioning mutations)
9. Receipt upload + replace
10. Hard delete
11. Validation tightening + acceptance pass
12. Deployment + smoke tests

## Testing

### Unit Tests

- `lib/money.ts`: parse `"$1.23"` -> `123`, format `123` -> `"$1.23"`, reject invalid
- `lib/validation.ts`: expense requires description/spentBy, income does not require spentBy

### Backend Tests

- createIncome: creates container + version, sets activeVersionId
- editExpense: new version, activeVersionId updates, old version remains
- deleteTransaction: removes container + versions + receipt files

### Integration Happy Paths

- Unlock -> dashboard loads
- Create income -> balance increases, list shows new entry
- Create expense with receipt -> balance decreases, receipt viewable
- Edit -> history shows prior version, list reflects new
- Replace receipt -> old inaccessible, new displayed
- Delete -> removed from list, balance recomputed

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
- Gate blocks all Convex queries until passcode verified
- Sorting uses container `createdAt`, not `entryDate`
