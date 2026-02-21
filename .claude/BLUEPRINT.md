# Shared Expenses Tracker — Blueprint

## 1) Repo and baseline setup

1. Create Next.js (App Router) + TypeScript + Tailwind project.
2. Add Convex (`npx convex dev`) and wire the Convex Next.js client provider.
3. Create `lib/money.ts` (parse/format cents) and `lib/validation.ts` (shared validation).
4. Add env vars:
   - Convex envs per CLI
   - `PASSCODE_HASH` (preferred) or `PASSCODE`
5. Add a minimal layout shell: `app/layout.tsx` with a single root container.

## 2) Passcode gate (must block all data)

1. Build `/unlock` page with `PasscodeForm`.
2. Add Convex function `verifyPasscode(attempt)` that compares server-side to `PASSCODE_HASH`.
3. On success, set `localStorage.unlocked=true` and keep an in-memory flag.
4. Implement a gate wrapper:
   - `app/page.tsx` routes to `/dashboard` if unlocked else `/unlock`.
   - `/dashboard` page hard-blocks rendering Convex queries until unlocked flag is true.
5. Optional brute-force friction: client cooldown timer after N failures (client-only).

## 3) Convex schema and core functions

1. Implement schema tables:
   - `transactions`
   - `transaction_versions`
2. Implement mutations:
   - `createIncome`
   - `createExpense`
   - `editIncome`
   - `editExpense`
   - `deleteTransaction`
3. Implement queries:
   - `getBalance`
   - `listTransactions` (join container + active version)
   - `getTransaction`
   - `listTransactionHistory`
4. Enforce all required fields per type in Convex mutations (server is source of validation truth).

## 4) Dashboard UI (read-only first)

1. Build `/dashboard` with:
   - `BalanceHeader` using `getBalance`
   - `TransactionList` using `listTransactions`
2. Transaction row shows: type, amount, entryDate, description, spentBy (expense), enteredBy, receipt indicator.
3. Loading and error states for both balance and list.

## 5) Create flows (income/expense)

1. Add “Add Income” / “Add Expense” buttons.
2. Build a shared `TransactionFormModal` with type-specific sections.
3. Implement client validation mirroring server rules:
   - amount > 0
   - entryDate required
   - enteredBy required
   - expense: description + spentBy required
4. Wire form submit to `createIncome` / `createExpense`.
5. Ensure list updates immediately via Convex reactivity.

## 6) Edit + history view

1. Create `/transaction/[id]`:
   - Show active version (via `getTransaction`)
   - Show history list (via `listTransactionHistory`)
2. Add “Edit” action that opens modal prefilled with active version data.
3. Wire submit to `editIncome` / `editExpense`:
   - mutation creates new version
   - sets `activeVersionId`
   - old versions remain
4. History panel shows versions newest-first (or oldest-first; pick one and stay consistent).

## 7) Receipt upload + replacement (expense only)

1. Implement `ReceiptUploader` in expense form.
2. Use Convex file storage:
   - Upload file
   - Store returned `_storage` id as `receiptFileId` on the new version (create/edit) or via `replaceReceipt`
3. Replace behavior:
   - delete old file id (best effort)
   - attach new file id
   - no receipt history
4. Receipt viewing:
   - show a “View receipt” link/button when `receiptFileId` present.

## 8) Delete behavior (hard delete)

1. Add delete button on transaction detail page (and optionally list row overflow menu).
2. `deleteTransaction`:
   - delete all versions for transaction
   - delete container
   - delete any referenced receipt files (active version required; if other versions have file ids, delete them too)
3. UI confirms delete, then routes back to dashboard.

## 9) Polish and guardrails

1. Consistent date handling:
   - store `entryDate` as `YYYY-MM-DD` string or null (but form enforces required).
2. Strict money parsing:
   - only allow valid currency input -> cents integer
3. Empty states:
   - no transactions yet
4. Minimal responsive layout.

## 10) Tests

1. Frontend unit tests:
   - money parse/format
   - validation rules
2. Backend unit tests:
   - create/edit/delete invariants
   - active version correctness
3. Integration happy paths (manual or automated):
   - unlock -> list/balance load
   - create income/expense updates balance
   - edit creates version history
   - replace receipt invalidates old
   - delete removes everything

## 11) Deployment

1. Deploy Convex.
2. Deploy Next.js to Vercel with env vars.
3. Verify gate blocks all queries pre-unlock.

---

# Iteration 1: Chunks (buildable milestones)

1. Scaffold + Convex wiring
2. Passcode gate that blocks data
3. Schema + list/balance read model
4. Dashboard read UI
5. Create income/expense
6. Transaction detail + history
7. Edit income/expense (versioning)
8. Receipt upload + replace
9. Hard delete
10. Tests + deploy

---

# Iteration 2: Smaller steps (right-sized implementation sequence)

## Chunk 1 — Scaffold + Convex wiring

1. Create Next.js app + Tailwind.
2. Add Convex; run dev deployment.
3. Add Convex provider at root layout.
4. Add `lib/money.ts` with parse/format stubs + tests.
5. Add `lib/validation.ts` with rule stubs + tests.

## Chunk 2 — Passcode gate

1. Create `/unlock` page UI with local state + error state.
2. Add Convex `verifyPasscode` returning boolean (env compare).
3. Store unlocked flag in localStorage and read it on app start.
4. Implement route guard:
   - `app/page.tsx` redirects to correct route
   - `/dashboard` component returns null (or gate screen) until unlocked
5. Add client cooldown after 5 failures (simple timestamp check).

## Chunk 3 — Schema + read queries

1. Implement Convex schema for `transactions` and `transaction_versions`.
2. Add `listTransactions(limit, cursor)` returning containers joined with active version fields.
3. Add `getBalance()` summing active versions by type.
4. Add `getTransaction(id)` for detail view.
5. Add `listTransactionHistory(id)`.

## Chunk 4 — Dashboard read UI

1. Build `/dashboard` skeleton page.
2. Add `BalanceHeader` wired to `getBalance`.
3. Add `TransactionList` wired to `listTransactions`.
4. Add `TransactionRow` rendering required fields.
5. Add loading + error states.

## Chunk 5 — Create income

1. Build `TransactionFormModal` for income only.
2. Add client validation for income.
3. Implement `createIncome` mutation (container + version + activeVersionId).
4. Wire submit; ensure list refreshes automatically.
5. Add basic toasts/inline errors on failure.

## Chunk 6 — Create expense (no receipt yet)

1. Extend modal for expense fields (description/spentBy required).
2. Implement `createExpense` mutation.
3. Wire submit and verify balance decreases.
4. Add receipt indicator column placeholder (always off for now).

## Chunk 7 — Transaction detail + history (read-only)

1. Add `/transaction/[id]` route.
2. Render active version data via `getTransaction`.
3. Render history list via `listTransactionHistory`.
4. Link from each list row to detail page.

## Chunk 8 — Edit income/expense (versioning)

1. Add “Edit” button on detail page.
2. Prefill modal with active version fields.
3. Implement `editIncome` mutation (new version + set active).
4. Implement `editExpense` mutation (new version + set active).
5. Ensure history list shows previous versions.

## Chunk 9 — Receipt upload + replace

1. Add receipt upload UI to expense modal.
2. Implement file upload flow with Convex storage.
3. Store `receiptFileId` on version create/edit.
4. Implement `replaceReceipt(transactionId, newFileId)` (delete old, set new on a new version or update active version—pick one and stay consistent; simplest: create a new version with new `receiptFileId`, and delete old file).
5. Add receipt viewer link on detail page.

## Chunk 10 — Hard delete

1. Add delete button with confirmation on detail page.
2. Implement `deleteTransaction` mutation:
   - delete versions
   - delete container
   - delete any receipt files referenced by any version
3. After delete, route back to dashboard.

## Chunk 11 — Tighten validation + acceptance pass

1. Ensure server validation rejects invalid payloads with clear errors.
2. Ensure client blocks submit until required fields provided.
3. Confirm newest-first sorting uses container `createdAt` only.
4. Confirm balance uses active versions only.
5. Verify replace receipt makes old receipt inaccessible.

## Chunk 12 — Deployment + smoke tests

1. Configure env vars in Vercel.
2. Deploy and smoke test all acceptance criteria.

---

# Final check against acceptance criteria

- Gate blocks all data until unlocked: enforced by routing + hard-blocking queries pre-unlock.
- Add/edit/delete both types: covered by create/edit/delete chunks.
- Balance = incomes − expenses using active versions only: enforced in `getBalance` and edit mutations.
- Mixed newest-first list: `transactions.createdAt` index.
- Receipt upload and overwrite: storage + delete old file.
- Edit history preserved; deletion removes everything: versions immutable; `deleteTransaction` wipes all.
- Cents-accurate: integer cents everywhere + money util tests.
