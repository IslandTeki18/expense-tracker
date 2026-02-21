# Shared Expenses Tracker — TODO Checklist

## 0) Project setup

- [x] Create repo
- [x] Initialize Next.js (App Router) + TypeScript
- [x] Install TailwindCSS and verify styles render
- [x] Add linting + formatting
  - [x] ESLint configured
  - [x] Prettier configured
- [x] Create basic folder structure
  - [x] `app/`
  - [x] `components/`
  - [x] `lib/`
  - [x] `convex/`
- [x] Add env files (local + deployment)
  - [x] `.env.local` created (not committed)
  - [x] `.env.example` created (committed)

## 1) Convex setup

- [x] Install Convex and initialize project
  - [x] `npx convex dev` runs successfully
  - [x] Convex dashboard reachable
- [x] Wire Convex client into Next.js
  - [x] Provider added in `app/layout.tsx`
  - [x] Basic test query renders in a page (temporary)
- [x] Define env vars
  - [x] Convex deployment URL/keys configured locally
  - [x] Convex deployment URL/keys configured in Vercel (later)

## 2) Core utilities (money + validation)

### money.ts

- [ ] Create `lib/money.ts`
- [ ] Implement `formatCents(cents: number): string`
  - [ ] Always 2 decimals
  - [ ] Handles negative cents
- [ ] Implement `parseMoneyToCents(input: string): number`
  - [ ] Accepts `1`, `1.2`, `1.23`, `$1.23`, `1.23`
  - [ ] Rejects invalid strings (letters, multiple decimals, empty)
  - [ ] Prevents NaN/Infinity
- [ ] Unit tests for `money.ts`
  - [ ] `"$1.23" -> 123`
  - [ ] `"1.23" -> 123`
  - [ ] `"1" -> 100`
  - [ ] `"0.01" -> 1`
  - [ ] `format 123 -> "$1.23"`
  - [ ] `format -123 -> "-$1.23"` (or `"$-1.23"`; pick one)
  - [ ] invalid input rejected

### validation.ts

- [ ] Create `lib/validation.ts`
- [ ] Define shared types for form payloads
  - [ ] `Person = "you" | "wife"`
  - [ ] `TxnType = "income" | "expense"`
- [ ] Implement validation helpers
  - [ ] `validateIncome(payload)` returns field errors
  - [ ] `validateExpense(payload)` returns field errors
- [ ] Rules enforced (client-side)
  - [ ] `amountCents` required and `> 0`
  - [ ] `entryDate` required (ISO `YYYY-MM-DD`)
  - [ ] `enteredBy` required for both
  - [ ] Expense: `description` required
  - [ ] Expense: `spentBy` required
- [ ] Unit tests for `validation.ts`

## 3) Passcode gate (must block all data)

### Env + hashing

- [ ] Decide passcode model
  - [ ] Preferred: `PASSCODE_HASH` in env
- [ ] Generate hash for passcode (document how)
- [ ] Add env vars
  - [ ] `PASSCODE_HASH` in `.env.local`
  - [ ] Add placeholder in `.env.example`

### Convex passcode function

- [ ] Add Convex function `verifyPasscode(attempt: string): boolean`
  - [ ] Compares attempt server-side against env hash
  - [ ] Rejects empty attempts
  - [ ] Returns boolean only (no data leakage)

### Unlock UI

- [ ] Create `/unlock` page
  - [ ] Passcode input
  - [ ] Submit button
  - [ ] Error message on failure
  - [ ] Loading state while verifying
- [ ] Persist unlocked state
  - [ ] Store `localStorage.unlocked = "true"` on success
  - [ ] Store timestamp of unlock (optional)
  - [ ] In-memory flag to avoid flicker
- [ ] Enforce lock
  - [ ] `/` routes to `/unlock` when locked, else `/dashboard`
  - [ ] `/dashboard` hard-blocks rendering Convex queries until unlocked
- [ ] Optional brute-force friction
  - [ ] Cooldown after N failures (client timer)
  - [ ] Disable submit during cooldown

## 4) Convex data model

### schema.ts

- [ ] Create `convex/schema.ts`
- [ ] Add table: `transactions`
  - [ ] Fields:
    - [ ] `type: "income" | "expense"`
    - [ ] `activeVersionId: Id<"transaction_versions">`
    - [ ] `createdAt: number`
    - [ ] `createdBy?: "you" | "wife"` (optional)
    - [ ] `updatedAt: number`
  - [ ] Indexes:
    - [ ] `by_createdAt`
    - [ ] `by_type_createdAt` (optional)
- [ ] Add table: `transaction_versions`
  - [ ] Fields:
    - [ ] `transactionId: Id<"transactions">`
    - [ ] `type: "income" | "expense"`
    - [ ] `amountCents: number`
    - [ ] `entryDate: string | null`
    - [ ] `description: string | null`
    - [ ] `spentBy: "you" | "wife" | null`
    - [ ] `enteredBy: "you" | "wife"`
    - [ ] `receiptFileId: Id<"_storage"> | null`
    - [ ] `createdAt: number`
    - [ ] `supersedesVersionId: Id<"transaction_versions"> | null`
  - [ ] Indexes:
    - [ ] `by_transactionId`
    - [ ] `by_transactionId_createdAt`
- [ ] Ensure schema compiles + Convex deploy succeeds

## 5) Convex queries

- [ ] `getBalance()`
  - [ ] Computes `balanceCents = sum(income active versions) - sum(expense active versions)`
  - [ ] Uses ONLY active versions
  - [ ] Returns `{ balanceCents }`
- [ ] `listTransactions({ limit, cursor? })`
  - [ ] Newest-first by `transactions.createdAt`
  - [ ] Joins active version fields for UI
  - [ ] Returns:
    - [ ] transaction id
    - [ ] type
    - [ ] createdAt
    - [ ] activeVersion fields needed for list (amountCents, entryDate, description, spentBy, enteredBy, receiptFileId, version createdAt)
  - [ ] Supports pagination cursor (optional; still implement if easy)
- [ ] `getTransaction({ transactionId })`
  - [ ] Returns container + active version data
- [ ] `listTransactionHistory({ transactionId })`
  - [ ] Returns all versions (choose newest-first and stick to it)
  - [ ] Includes `supersedesVersionId` for linkage (optional)

## 6) Convex mutations (create)

### Shared validation (server-side)

- [ ] Implement defensive validation helpers in Convex
  - [ ] Reject invalid cents (<= 0)
  - [ ] Reject missing required fields
  - [ ] Validate `entryDate` is `YYYY-MM-DD`
  - [ ] Validate enums

### createIncome

- [ ] `createIncome(payload)`
  - [ ] Validate: amountCents, entryDate, enteredBy required
  - [ ] Create `transactions` container
  - [ ] Create first `transaction_versions` row
  - [ ] Set `transactions.activeVersionId`
  - [ ] Set createdAt/updatedAt server timestamps

### createExpense

- [ ] `createExpense(payload)`
  - [ ] Validate: amountCents, entryDate, description, spentBy, enteredBy required
  - [ ] Create container + first version
  - [ ] Set activeVersionId
  - [ ] receiptFileId optional (may be null for now)

## 7) Dashboard UI (read-only)

- [ ] Create `/dashboard` page shell
- [ ] Add `BalanceHeader`
  - [ ] Uses `getBalance`
  - [ ] Formats cents -> dollars
  - [ ] Handles loading / error states
- [ ] Add `TransactionList`
  - [ ] Uses `listTransactions`
  - [ ] Newest-first rendering
  - [ ] Empty state when no transactions
- [ ] Add `TransactionRow`
  - [ ] Displays:
    - [ ] Type label (Income/Expense)
    - [ ] Amount formatted
    - [ ] Entry date (or blank indicator)
    - [ ] Description
    - [ ] SpentBy (expense only)
    - [ ] EnteredBy
    - [ ] Receipt indicator (if receiptFileId)
- [ ] Add “Add Income” and “Add Expense” buttons (no action yet)

## 8) Create income UI

- [ ] Build `TransactionFormModal` (income mode)
  - [ ] Fields:
    - [ ] Amount input (string UI)
    - [ ] Entry date picker (required; default blank)
    - [ ] Description optional
    - [ ] EnteredBy select (You/Wife)
  - [ ] Client validation using `validation.ts`
  - [ ] Disable submit while mutation in-flight
  - [ ] Show inline errors + mutation error
- [ ] Wire submit to `createIncome`
- [ ] Verify:
  - [ ] Transaction appears at top of list
  - [ ] Balance increases immediately

## 9) Create expense UI (no receipt yet)

- [ ] Extend `TransactionFormModal` (expense mode)
  - [ ] Fields:
    - [ ] Amount (required)
    - [ ] Entry date (required)
    - [ ] Description (required)
    - [ ] SpentBy (required)
    - [ ] EnteredBy (required)
- [ ] Wire submit to `createExpense`
- [ ] Verify:
  - [ ] Transaction appears at top
  - [ ] Balance decreases immediately
  - [ ] Negative balances allowed (no blocking)

## 10) Transaction detail + history UI (read-only first)

- [ ] Create route `/transaction/[id]`
- [ ] Fetch and render active transaction
  - [ ] `getTransaction`
- [ ] Render history panel
  - [ ] `listTransactionHistory`
  - [ ] Show version timestamp + fields snapshot
- [ ] Add navigation:
  - [ ] Clicking a list row goes to detail page

## 11) Edit flows (versioning)

### Edit UI

- [ ] Add “Edit” button on detail page
- [ ] Reuse `TransactionFormModal` prefilled from active version
- [ ] Prevent editing type (income stays income, expense stays expense)

### Server mutations

- [ ] `editIncome(transactionId, payload)`
  - [ ] Validate payload for income
  - [ ] Load transaction + current active version
  - [ ] Create new version with `supersedesVersionId = oldActiveVersionId`
  - [ ] Update `transactions.activeVersionId = newVersionId`
  - [ ] Update `transactions.updatedAt`
- [ ] `editExpense(transactionId, payload)`
  - [ ] Same pattern, expense validation rules

### Verify edit behavior

- [ ] List reflects new active values
- [ ] History shows old version(s)
- [ ] Balance recomputes correctly based on active versions only

## 12) Receipts (upload + view + replace)

### Upload plumbing

- [ ] Implement receipt upload UI in expense form
- [ ] Use Convex file storage pattern for uploads
  - [ ] Generate upload URL if required (actions)
  - [ ] Upload file from client
  - [ ] Receive `storageId` (receiptFileId)
- [ ] Store receiptFileId on version creation/edit
  - [ ] For createExpense: attach to first version if provided
  - [ ] For editExpense: attach to new version if provided

### View receipt

- [ ] In list row, show receipt indicator if `receiptFileId`
- [ ] On detail page, show “View receipt” when present
  - [ ] Use Convex file URL retrieval pattern (as needed)

### Replace receipt (overwrite, no history)

- [ ] Implement `replaceReceipt(transactionId, newReceiptFileId)`
  - [ ] Delete old receipt file id (best effort)
  - [ ] Create a new version that supersedes active version (recommended for consistency)
    - [ ] Copy all fields from active version
    - [ ] Set `receiptFileId = newReceiptFileId`
    - [ ] Set `supersedesVersionId = oldActiveVersionId`
    - [ ] Update `activeVersionId`
- [ ] Ensure old receipt is no longer accessible
  - [ ] Delete succeeds or old link breaks

## 13) Delete (hard delete everything)

### UI

- [ ] Add “Delete” button on detail page
- [ ] Add confirmation dialog
- [ ] Disable button while deleting
- [ ] On success, return to dashboard

### Server mutation

- [ ] Implement `deleteTransaction(transactionId)`
  - [ ] Load all versions for transaction
  - [ ] Collect all `receiptFileId`s present across versions
  - [ ] Delete storage files (best effort, but attempt all)
  - [ ] Delete version rows
  - [ ] Delete transaction container row

### Verify

- [ ] Transaction disappears from list
- [ ] Balance recomputes correctly
- [ ] Detail route no longer loads

## 14) Error handling + UX hardening

- [ ] Global error boundary pages (Next.js)
- [ ] Consistent loading states for:
  - [ ] Balance
  - [ ] List
  - [ ] Detail + history
- [ ] Toast or inline error strategy chosen and applied consistently
- [ ] Form UX:
  - [ ] Inline field errors
  - [ ] Keep modal open on failure
  - [ ] Reset form on success
- [ ] Ensure app never fetches data while locked
  - [ ] Confirm no queries are invoked pre-unlock

## 15) Testing plan execution

### Frontend unit tests

- [ ] money parsing/formatting tests complete
- [ ] validation tests complete

### Backend unit tests (Convex)

- [ ] createIncome creates container + version + sets activeVersionId
- [ ] createExpense creates container + version + sets activeVersionId
- [ ] editExpense creates new version and updates activeVersionId
- [ ] history retrieval returns all versions
- [ ] deleteTransaction removes container + versions + receipts

### Integration / manual scripts (happy path)

- [ ] Unlock -> dashboard loads
- [ ] Add income -> balance increases -> appears at top
- [ ] Add expense -> balance decreases -> appears at top
- [ ] Edit expense -> list updates -> history shows prior
- [ ] Upload receipt -> view receipt works
- [ ] Replace receipt -> old receipt inaccessible -> new receipt works
- [ ] Delete -> removed everywhere -> balance correct

### Edge cases

- [ ] Negative balance allowed after expense
- [ ] Blank date prevented by validation
- [ ] Concurrent adds do not crash
- [ ] Network failure shows retryable errors

## 16) Deployment (Vercel + Convex)

- [ ] Create Vercel project
- [ ] Add env vars in Vercel
  - [ ] Convex deployment values
  - [ ] `PASSCODE_HASH`
- [ ] Deploy Convex production deployment
- [ ] Deploy Next.js to Vercel
- [ ] Smoke test in production:
  - [ ] Locked state reveals no data
  - [ ] Unlock works
  - [ ] Core CRUD works
  - [ ] Receipts work

## 17) Acceptance criteria verification

- [ ] Passcode gate blocks all data until unlocked
- [ ] Two people can add/edit/delete incomes and expenses
- [ ] Balance updates immediately and is computed as incomes − expenses (active versions only)
- [ ] Transaction list is mixed and newest-first by createdAt
- [ ] Expense supports receipt upload and overwrite replacement
- [ ] Edit history exists for edits; deletions remove everything
- [ ] Money handling uses cents end-to-end, formatted with 2 decimals
