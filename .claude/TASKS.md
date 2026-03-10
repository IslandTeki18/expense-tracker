# TODO — Transaction Sorting, Categories, and Analytics Dashboard

## 1. Project Setup

- [x] Review existing transaction schema and confirm required fields exist
- [x] Confirm `entryDate` exists and is consistently used
- [x] Confirm transaction type field (`income | expense`) exists
- [x] Verify receipt image handling remains unaffected
- [x] Ensure Convex schema migration capability is ready
- [x] Prepare feature branch for development

---

# 2. Database Schema Changes

## Categories Table

- [x] Create `categories` table in Convex

Fields:

- [x] `_id`
- [x] `nameDisplay`
- [x] `nameNormalized`
- [x] `color`
- [x] `createdAt`
- [x] `updatedAt`

Indexes:

- [x] Unique index on `nameNormalized`
- [x] Optional alphabetical index on `nameDisplay`

Validation Rules:

- [x] Name max length: 30 characters
- [x] Name max words: 3
- [x] Trim leading/trailing whitespace
- [x] Collapse internal duplicate spaces
- [x] Normalize lowercase for uniqueness
- [x] Case-insensitive uniqueness enforcement

---

## Transactions Table Changes

- [x] Add `categoryId?: Id<"categories"> | null`
- [x] Ensure `entryDate` is standardized
- [x] Ensure transaction type field exists

Rules:

- [x] Income must not allow categoryId
- [x] Expense may have null category
- [x] No denormalized category data stored on transactions

---

# 3. Shared Utility Functions

Create shared helpers.

Category Utilities:

- [x] Category name normalization helper
- [x] Word count validation helper
- [x] Duplicate space collapse helper
- [x] Case-insensitive uniqueness checker

Sorting Utilities:

- [x] Derived category sort label generator
- [x] Category sort fallback for uncategorized
- [x] Category sort handling for income rows

Date Utilities:

- [x] Date range validation helper
- [x] Date bucket helper for monthly grouping

Chart Utilities:

- [x] Chart color mapping from category color
- [x] Currency formatting helper

---

# 4. Convex Backend

## categories.ts

### Queries

- [x] `listCategories`

Behavior:

- [x] Return alphabetical list
- [x] Include color + display name

### Mutations

Create Category:

- [x] `createCategory`
- [x] Validate name
- [x] Validate color
- [x] Normalize name
- [x] Enforce uniqueness

Update Category:

- [x] `updateCategory`
- [x] Allow rename
- [x] Allow color change
- [x] Prevent duplicates

Delete Category:

- [x] `deleteCategory`

Behavior:

- [x] Find referencing transactions
- [x] Set `categoryId` to null
- [x] Hard delete category
- [x] Execute in single mutation

Error Handling:

- [x] Duplicate name rejection
- [x] Invalid color rejection
- [x] Missing category rejection
- [x] Already-deleted category handling

---

## transactions.ts

Extend transaction list query.

Create:

- [x] `listTransactions`

Inputs:

- [x] page
- [x] pageSize
- [x] sortField
- [x] sortDirection
- [x] categoryFilter

Sorting Support:

- [x] date
- [x] amount
- [x] category

Rules:

- [x] date uses `entryDate`
- [x] amount uses raw value
- [x] category uses derived sort label

Filtering:

- [x] filter by categoryId
- [x] filter uncategorized

Pagination:

- [x] page size 25
- [x] pagination after filters
- [x] pagination after sorting

Join Logic:

- [x] join categories
- [x] resolve category name
- [x] resolve category color

Fallbacks:

- [x] invalid sort defaults to date desc
- [x] invalid page defaults to page 1

---

## dashboard.ts

Create dashboard aggregation query.

Create:

- [x] `getDashboardAnalytics`

Inputs:

- [x] startDate
- [x] endDate

Validation:

- [x] start required
- [x] end required
- [x] start <= end

Output:

- [x] totalIncome
- [x] totalExpenses
- [x] transactionCount
- [x] pieChartData
- [x] monthlyBarChartData
- [x] topCategories

Aggregation Tasks:

- [x] Filter by date range
- [x] Exclude invalid/missing dates
- [x] Compute totals
- [x] Compute category spending
- [x] Group uncategorized under "Other"
- [x] Fold small categories under threshold
- [x] Generate monthly buckets
- [x] Include income and expense data

Live Updates:

- [x] Ensure Convex reactivity

---

# 5. Transaction List UI

## Table

Create component:

- [ ] `TransactionTable`

Columns:

- [ ] Date
- [ ] Amount
- [ ] Category
- [ ] Transaction type context

Row Rendering:

- [ ] Expense with category badge
- [ ] Uncategorized expense badge ("Other")
- [ ] Income badge ("Income")
- [ ] Amount color styling

Date Display:

- [ ] Exact calendar date
- [ ] No relative time

---

## Sorting UI

Create component:

- [ ] `TransactionSortHeader`

Features:

- [ ] Sort by date
- [ ] Sort by amount
- [ ] Sort by category
- [ ] Display active sort direction

Behavior:

- [ ] Default sort: date descending
- [ ] Reset sort on page load
- [ ] Do not persist preferences

---

## Category Column

Create:

- [ ] `CategoryBadge`

Behavior:

- [ ] Colored badge
- [ ] Category name display
- [ ] Gray badge for uncategorized
- [ ] Green badge for income

---

## Category Filtering

Create:

- [ ] `CategoryFilterControl`

Features:

- [ ] Filter by category
- [ ] Click badge to filter
- [ ] Include uncategorized filter

Compatibility:

- [ ] Works with sorting
- [ ] Works with pagination

---

## Pagination

Implement:

- [ ] Pagination control

Rules:

- [ ] Page size 25
- [ ] Full dataset sorting preserved
- [ ] Filters applied before pagination

---

# 6. Category Management UI

Route:

- [ ] `/settings/categories`

Create components:

- [ ] `CategoryForm`
- [ ] `CategoryList`
- [ ] `CategoryDeleteDialog`

Features:

- [ ] Create category
- [ ] Edit category
- [ ] Delete category

Form Fields:

- [ ] Name
- [ ] Color picker

Validation:

- [ ] Name required
- [ ] Max 30 characters
- [ ] Max 3 words
- [ ] Duplicate detection

Delete Behavior:

- [ ] Confirmation dialog
- [ ] Hard delete
- [ ] Transactions uncategorized automatically

---

# 7. Expense Form Integration

Modify existing expense form.

Add:

- [ ] Category dropdown
- [ ] Category color indicator

Dropdown Behavior:

- [ ] Alphabetical ordering
- [ ] Explicit "Uncategorized" option

Quick Create:

- [ ] Inline category creation
- [ ] Auto refresh category list

Edit Behavior:

- [ ] Allow removing category
- [ ] Reset to uncategorized

Income Form:

- [ ] No category support

---

# 8. Dashboard Page

Route:

- [ ] `/dashboard`

Page Components:

- [ ] `DashboardSummaryCards`
- [ ] `CategoryPieChart`
- [ ] `MonthlyIncomeExpenseChart`
- [ ] `TopCategoriesList`
- [ ] `DateRangePicker`

---

## Date Range Picker

Behavior:

- [ ] Custom range selection
- [ ] Persist last selection in local storage
- [ ] Default to current month

UI:

- [ ] Visible range display

Example:

- [ ] `Jan 1 – Jan 31, 2026`

---

## Dashboard Summary Cards

Display:

- [ ] Total income
- [ ] Total expenses
- [ ] Transaction count

---

## Category Pie Chart

Library:

- [ ] Chart.js
- [ ] react-chartjs-2

Rules:

- [ ] Expenses only
- [ ] Category colors used
- [ ] "Other" bucket for small categories
- [ ] Tooltip with currency
- [ ] Percentage labels
- [ ] Legend highlight on click

---

## Monthly Stacked Bar Chart

Display:

- [ ] Monthly aggregated bars
- [ ] Income + expense stacked
- [ ] Tooltip currency formatting

Rules:

- [ ] Static render
- [ ] Responsive
- [ ] Resize aware

---

## Top Categories List

Display:

- [ ] Ranked by spending
- [ ] Uses selected date range

---

## Dashboard Loading & Empty States

Loading:

- [ ] Skeleton UI

Empty Range:

- [ ] Render charts with zero values
- [ ] Do not hide charts

---

# 9. Error Handling

Category Errors:

- [ ] Duplicate name
- [ ] Too many words
- [ ] Name too long
- [ ] Invalid color

Transaction Errors:

- [ ] Assigning category to income
- [ ] Invalid category reference

Dashboard Errors:

- [ ] Invalid date range
- [ ] Dashboard query failure
- [ ] Missing categories

Transaction List Errors:

- [ ] Invalid sort field
- [ ] Invalid sort direction
- [ ] Invalid page
- [ ] Invalid category filter

Fallbacks:

- [ ] Default sort fallback
- [ ] Graceful empty states

---

# 10. Performance Tasks

- [ ] Implement server-side pagination
- [ ] Implement single dashboard analytics query
- [ ] Avoid client-side analytics computation
- [ ] Ensure Convex reactive updates
- [ ] Add client-side caching by date range

---

# 11. Migration Handling

- [ ] Leave existing transactions uncategorized
- [ ] Display uncategorized as "Other"
- [ ] Allow manual editing later
- [ ] No migration scripts required

---

# 12. Security and Integrity

Backend enforcement:

- [ ] Category uniqueness
- [ ] Category assignment only for expenses
- [ ] Valid date range input
- [ ] Deletion uncategorizes transactions
- [ ] No orphaned category references

Do not rely on frontend validation.