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

- [x] `TransactionTable`

Columns:

- [x] Date
- [x] Amount
- [x] Category
- [x] Transaction type context

Row Rendering:

- [x] Expense with category badge
- [x] Uncategorized expense badge ("Other")
- [x] Income badge ("Income")
- [x] Amount color styling

Date Display:

- [x] Exact calendar date
- [x] No relative time

---

## Sorting UI

Create component:

- [x] `TransactionSortHeader`

Features:

- [x] Sort by date
- [x] Sort by amount
- [x] Sort by category
- [x] Display active sort direction

Behavior:

- [x] Default sort: date descending
- [x] Reset sort on page load
- [x] Do not persist preferences

---

## Category Column

Create:

- [x] `CategoryBadge`

Behavior:

- [x] Colored badge
- [x] Category name display
- [x] Gray badge for uncategorized
- [x] Green badge for income

---

## Category Filtering

Create:

- [x] `CategoryFilterControl`

Features:

- [x] Filter by category
- [x] Click badge to filter
- [x] Include uncategorized filter

Compatibility:

- [x] Works with sorting
- [x] Works with pagination

---

## Pagination

Implement:

- [x] Pagination control

Rules:

- [x] Page size 25
- [x] Full dataset sorting preserved
- [x] Filters applied before pagination

---

# 6. Category Management UI

Route:

- [x] `/settings/categories`

Create components:

- [x] `CategoryForm`
- [x] `CategoryList`
- [x] `CategoryDeleteDialog`

Features:

- [x] Create category
- [x] Edit category
- [x] Delete category

Form Fields:

- [x] Name
- [x] Color picker

Validation:

- [x] Name required
- [x] Max 30 characters
- [x] Max 3 words
- [x] Duplicate detection

Delete Behavior:

- [x] Confirmation dialog
- [x] Hard delete
- [x] Transactions uncategorized automatically

---

# 7. Expense Form Integration

Modify existing expense form.

Add:

- [x] Category dropdown
- [x] Category color indicator

Dropdown Behavior:

- [x] Alphabetical ordering
- [x] Explicit "Uncategorized" option

Quick Create:

- [x] Inline category creation
- [x] Auto refresh category list

Edit Behavior:

- [x] Allow removing category
- [x] Reset to uncategorized

Income Form:

- [x] No category support

---

# 8. Dashboard Page

Route:

- [x] `/dashboard`

Page Components:

- [x] `DashboardSummaryCards`
- [x] `CategoryPieChart`
- [x] `MonthlyIncomeExpenseChart`
- [x] `TopCategoriesList`
- [x] `DateRangePicker`

---

## Date Range Picker

Behavior:

- [x] Custom range selection
- [x] Persist last selection in local storage
- [x] Default to current month

UI:

- [x] Visible range display

Example:

- [x] `Jan 1 – Jan 31, 2026`

---

## Dashboard Summary Cards

Display:

- [x] Total income
- [x] Total expenses
- [x] Transaction count

---

## Category Pie Chart

Library:

- [x] Chart.js
- [x] react-chartjs-2

Rules:

- [x] Expenses only
- [x] Category colors used
- [x] "Other" bucket for small categories
- [x] Tooltip with currency
- [x] Percentage labels
- [x] Legend highlight on click

---

## Monthly Stacked Bar Chart

Display:

- [x] Monthly aggregated bars
- [x] Income + expense stacked
- [x] Tooltip currency formatting

Rules:

- [x] Static render
- [x] Responsive
- [x] Resize aware

---

## Top Categories List

Display:

- [x] Ranked by spending
- [x] Uses selected date range

---

## Dashboard Loading & Empty States

Loading:

- [x] Skeleton UI

Empty Range:

- [x] Render charts with zero values
- [x] Do not hide charts

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