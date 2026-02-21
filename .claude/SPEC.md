# Shared Expenses Tracker — Specification

## 1) Goal

A private web app for two people to manually track income and expenses for one shared bank account when no bank API exists. The app shows a live “remaining working balance” computed from incomes minus expenses and provides a transaction log with receipt images. Hosted on Vercel. React + TypeScript + Tailwind. Convex backend.

## 2) Users and access

- Intended users: 2 (you + wife).
- No real authentication system.
- Protection: passcode gate screen.
- Single fixed passcode stored as an environment variable (not editable in-app).
- App must not reveal data until passcode is entered.

## 3) Money model and rules

### 3.1 Source of truth

- Running balance model.
- Balance = sum(all incomes) − sum(all expenses).
- No date-based historical balance views; dates are informational only.
- Negative balances are allowed.

### 3.2 Precision

- Store money in cents (integer) to avoid floating point issues.
- UI displays dollars with exactly 2 decimals.

## 4) Core features

### 4.1 Dashboard / header

- Show current balance (computed).
- Optional summary counts (total incomes, total expenses) allowed, but keep minimal.

### 4.2 Transaction list (single combined list)

- Mixed list of income and expense transactions.
- Sorted newest-first by `createdAt` (not entry date).
- Each row shows:
  - Type: Income or Expense
  - Amount (formatted)
  - Date (user-entered date; may be blank if allowed by UI decision)
  - Short description
  - Who spent (for expenses) and entered-by (for all records)
  - Receipt indicator (for expenses with image)
- No grouping by day.

### 4.3 Create income

**Fields**

- Amount (required)
- Date (user must choose; default is blank until chosen)
- Description (optional but recommended)
- Entered by (required: You/Wife)

**Behavior**

- Adds income transaction to list.
- Immediately affects computed balance.

### 4.4 Create expense

**Fields**

- Amount (required)
- Date (user must choose; default is blank until chosen)
- Description (required)
- Who spent (required: You/Wife)
- Entered by (required: You/Wife; can be different from who spent)
- Receipt image (optional upload; if provided, store file and link)

**Behavior**

- Adds expense transaction to list.
- Immediately affects computed balance.
- Negative resulting balance is permitted.

### 4.5 Edit and history (versioning)

- Both incomes and expenses can be edited.
- When edited:
  - Do not overwrite.
  - Create a new “version” record and mark it as the active version.
  - Old versions remain stored and viewable in an entry history view.
- Receipt replacement:
  - Overwrite behavior.
  - When replacing a receipt image, the previous file is deleted/invalidated and no longer accessible.
  - No receipt history.

### 4.6 Delete behavior

- Deletion is permanent and removes the entry entirely, including any versions/history for that entry.
- No “deleted but visible in history” state.

### 4.7 No categories

- Expenses have no category/tags beyond free-text description.

### 4.8 No exports / backups

- No manual export.
- No automatic backups beyond whatever Convex/Vercel provide.

## 5) Data model (Convex)

Use cents-based integer fields. Use Convex generated `_id` for primary keys. Use server timestamps for `createdAt` / `updatedAt`.

### 5.1 Enums

- `Person`: `"you"` | `"wife"`
- `TxnType`: `"income"` | `"expense"`

### 5.2 Tables

#### A) `transactions`

Represents the logical transaction “container” whose versions can change over time.

**Fields**

- `type`: `TxnType`
- `activeVersionId`: `Id<"transaction_versions">`
- `createdAt`: `number` (ms epoch)
- `createdBy`: `Person` (who created the container; optional but useful)
- `updatedAt`: `number` (ms epoch)

**Indexes**

- `by_createdAt` (for newest-first list)
- `by_type_createdAt` (optional)

#### B) `transaction_versions`

Immutable versions. One is “active” via `transactions.activeVersionId`.

**Fields**

- `transactionId`: `Id<"transactions">`
- `type`: `TxnType` (redundant for querying)
- `amountCents`: `number` (int)
- `entryDate`: `string | null` (ISO date string like `2026-02-20` or null)
- `description`: `string | null` (income optional; expense required by validation)
- `spentBy`: `Person | null` (expense required, income null)
- `enteredBy`: `Person` (required for both)
- `receiptFileId`: `Id<"_storage"> | null` (expense optional)
- `createdAt`: `number` (ms epoch)
- `supersedesVersionId`: `Id<"transaction_versions"> | null` (optional link)

**Indexes**

- `by_transactionId_createdAt`
- `by_transactionId` (for history retrieval)

#### C) `app_config` (single row, optional)

**Fields**

- `key`: `"passcodeHashV1"` (or just store passcode as env; if hashing, store hash)
- `value`: `string`

**Note**

- Since passcode is fixed env var, this table is optional; simplest is no config row and only validate against env.

### 5.3 Receipt storage

- Use Convex file storage (`_storage`).
- Store `receiptFileId` on the active version.
- On receipt replace:
  - delete old file (Convex storage delete)
  - store new and update active version

## 6) API surface (Convex functions)

### 6.1 Queries

- `getBalance()`:
  - returns computed `balanceCents = sumIncomeCents − sumExpenseCents` (server-side)
- `listTransactions(limit, cursor?)`:
  - returns newest-first list of logical transactions joined with active version fields needed for list UI
- `getTransaction(transactionId)`:
  - returns container + active version
- `listTransactionHistory(transactionId)`:
  - returns all versions (newest-first or oldest-first) for history view

### 6.2 Mutations

- `createIncome(payload)`
- `createExpense(payload)`
- `editIncome(transactionId, payload)` -> creates new version, sets `activeVersionId`
- `editExpense(transactionId, payload)` -> creates new version, sets `activeVersionId`
- `replaceReceipt(transactionId, file)` -> overwrites existing receipt (delete old file, attach new)
- `deleteTransaction(transactionId)` -> hard delete container + all versions + receipt file for active version (and any other version files, if present)

### 6.3 Actions (if needed)

- If file upload flow requires actions, use actions for generating upload URLs; otherwise use standard Convex file storage patterns.

## 7) Passcode gate

### 7.1 Validation approach

**Simplest**

- Store `PASSCODE` in Vercel env.
- On app load, show passcode screen.
- On submit, compare against env via a Convex query/mutation that checks a hashed value server-side (preferred), or compare client-side only if you accept weaker protection.

**Preferred (still simple)**

- `PASSCODE_HASH` stored in env (e.g., bcrypt).
- `verifyPasscode(passcodeAttempt)` -> returns boolean.
- If valid, client stores a session flag in memory + localStorage (e.g., `unlocked=true`).
- No user accounts, no JWT, no roles.

### 7.2 Locking

- If passcode invalid: show error, keep locked.
- Optional: simple rate limit (cooldown after N failures) to reduce brute force.

## 8) UI pages / components

### 8.1 Passcode page

- Single input + submit.
- Error state.
- On success, route to main app.

### 8.2 Main page

- Balance header.
- “Add Income” and “Add Expense” buttons.
- Transactions list.

### 8.3 Add/Edit modal (or separate page)

- Shared form base + type-specific fields.
- Validation rules:
  - amount required, must be > 0
  - expense description required
  - entryDate required (since default is blank, form must not submit without date)
  - spentBy required for expense
  - enteredBy required for all
  - receipt upload field for expense

### 8.4 Transaction detail / history view

- Shows active version fields.
- Shows version list (history):
  - version `createdAt`
  - changes summary optional (diff can be minimal)
  - show prior values
- Since deletion wipes history, history exists only for edits.

## 9) Error handling strategy

### Client-side

- Form validation before submit with clear inline errors.
- Network states:
  - Loading indicators for list/balance
  - Disabled submit button while mutation in-flight
  - Toast or inline error for failed mutations

### Server-side (Convex)

- Validate payloads defensively.
- Enforce required fields per type:
  - income: `amountCents`, `entryDate`, `enteredBy` required
  - expense: `amountCents`, `entryDate`, `description`, `spentBy`, `enteredBy` required
- Handle receipt replacement atomically:
  - If new upload succeeds but DB update fails, delete new file.
  - If DB update succeeds but old file delete fails, log and continue (best effort).

### Consistency

- Balance is computed from stored versions; only active versions count.
- Ensure `listTransactions` uses `activeVersionId` only.
- On edit, create version then set `activeVersionId` in same mutation.

## 10) Non-goals (explicit)

- No bank sync.
- No categories.
- No exports/backups.
- No multi-user auth.
- No historical balance-by-date view.
- No prevention of negative balances.
- No soft deletes.

## 11) Project architecture (frontend)

- React + TypeScript + Tailwind.
- Keep it simple: Vite or Next.js (Next.js recommended since Vercel).
- Convex client integration.

**Suggested structure (Next.js App Router example)**

- `app/`
  - `page.tsx` (gate or redirect)
  - `unlock/page.tsx`
  - `dashboard/page.tsx`
- `components/`
  - `PasscodeForm.tsx`
  - `BalanceHeader.tsx`
  - `TransactionList.tsx`
  - `TransactionRow.tsx`
  - `TransactionFormModal.tsx`
  - `ReceiptUploader.tsx`
  - `HistoryPanel.tsx`
- `lib/`
  - `money.ts` (cents formatting/parsing)
  - `validation.ts`
- `convex/`
  - `schema.ts`
  - `transactions.ts` (queries/mutations)
  - `passcode.ts` (verify)

## 12) Testing plan

### 12.1 Unit tests (frontend)

- `money.ts`:
  - parse `"$1.23"` -> `123`
  - format `123` -> `"$1.23"`
  - reject invalid inputs
- `validation.ts`:
  - expense requires description/spentBy
  - income does not require spentBy
  - entryDate required

### 12.2 Unit tests (backend)

- `createIncome` creates:
  - `transactions` row
  - version row
  - `activeVersionId` set
- `editExpense`:
  - creates new version
  - `activeVersionId` updates
  - old version remains retrievable
- `deleteTransaction`:
  - removes container + versions
  - removes receipt file if present

### 12.3 Integration tests (happy paths)

- Unlock -> dashboard loads.
- Add income -> balance increases -> list shows new txn top.
- Add expense with receipt -> balance decreases -> receipt view works.
- Edit expense amount -> history shows prior version; list reflects new.
- Replace receipt -> old receipt no longer accessible; new receipt displayed.
- Delete transaction -> removed from list; balance recomputed.

### 12.4 Edge cases

- Allow negative balance after expense.
- Concurrent entries: ensure no crashes; last-write-wins only applies to list ordering by `createdAt`.
- Offline / Convex error: user sees retryable error.

## 13) Deployment

- Vercel deployment.
- Environment variables:
  - `CONVEX_DEPLOYMENT` / Convex URL keys as required
  - `PASSCODE_HASH` (or `PASSCODE` if accepting weaker protection)
- No custom domain required; use Vercel default URL.

## 14) Acceptance criteria

- Passcode gate blocks all data until unlocked.
- You and wife can add/edit/delete incomes and expenses.
- Balance updates immediately and is computed as incomes − expenses (active versions only).
- Transaction list mixed incomes/expenses, newest-first.
- Expense supports receipt image upload; replacing overwrites the previous receipt.
- Edit history exists for edits; deletions remove everything.
- Cents-accurate money handling end-to-end.
