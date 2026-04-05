# Grocery List Feature - Design Spec

## Purpose

Add a grocery list page to the Shared Expenses Tracker. Two users ("you" and "wife") can add items, specify quantities, assign stores/vendors, check off completed items, and filter by store. Standalone feature with no connection to the expense tracker.

## Data Model

### Table: `grocery_stores`

Mirrors the `categories` table pattern.

| Field          | Type   | Notes                    |
|----------------|--------|--------------------------|
| nameDisplay    | string | Original casing          |
| nameNormalized | string | Lowercase for uniqueness |
| color          | string | Hex color for badge      |
| createdAt      | number | ms epoch                 |
| updatedAt      | number | ms epoch                 |

Indexes: `by_nameNormalized`, `by_nameDisplay`

### Table: `grocery_items`

Flat table. Edits overwrite in place (no versioning).

| Field       | Type                              | Notes                     |
|-------------|-----------------------------------|---------------------------|
| name        | string                            | Required                  |
| quantity    | number                            | Integer, min 1, default 1 |
| storeId     | Id<"grocery_stores"> or null      | Optional store assignment |
| addedBy     | "you" or "wife"                   | Who added the item        |
| completed   | boolean                           | Checked off or not        |
| completedBy | "you" or "wife" or null           | Who checked it off        |
| completedAt | number or null                    | ms epoch when checked off |
| createdAt   | number                            | ms epoch                  |
| updatedAt   | number                            | ms epoch                  |

Indexes: `by_completed_createdAt` (completed, createdAt), `by_storeId`

## Convex API Surface

### File: `convex/grocery.ts`

**Queries:**
- `listItems()` - Returns all items joined with store data. Client splits by `completed` status.

**Mutations:**
- `addItem({ name, quantity, storeId?, addedBy })` - Creates a new grocery item. Validates name non-empty, quantity >= 1.
- `editItem(itemId, { name?, quantity?, storeId? })` - Updates item fields in place.
- `toggleItem(itemId, { completedBy })` - Flips `completed`. If completing: sets `completedBy` and `completedAt`. If uncompleting: nullifies both.
- `deleteItem(itemId)` - Hard delete.
- `clearCompleted()` - Bulk hard delete all items where `completed === true`.

### File: `convex/groceryStores.ts`

Mirrors `convex/categories.ts`.

**Queries:**
- `listStores()` - All stores sorted by nameDisplay.

**Mutations:**
- `createStore({ nameDisplay, color })` - Creates store. Validates uniqueness via nameNormalized.
- `editStore(storeId, { nameDisplay?, color? })` - Updates store.
- `deleteStore(storeId)` - Deletes store, sets `storeId = null` on all related grocery items.

## Validation Rules

### Grocery Item
- `name`: required, non-empty string (trimmed)
- `quantity`: required, integer >= 1
- `storeId`: optional, must reference valid store if provided
- `addedBy`: required, "you" or "wife"

### Grocery Store
- Same rules as categories: nameDisplay required, max 30 chars, 3 words max, valid hex color

## Routes & Navigation

### New Routes
- `/grocery` - Main grocery list page
- `/grocery/stores` - Store management page

### Navigation Changes
- Dashboard header: Add "Grocery List" link button next to existing "Categories" link
- Grocery page header: "Back to Dashboard" link + "Stores" management link

## Page: `/grocery`

### Layout
- Same shell as dashboard: `min-h-screen bg-gray-50 p-4 sm:p-8 dark:bg-gray-950`, `max-w-4xl`
- Header row: back link + title + "Stores" link
- Store filter dropdown below header
- Inline add-item form
- Active items list
- Collapsible completed section

### Add Item Form (Inline)
- Text input: item name (required)
- Number input: quantity (default 1)
- Store dropdown: optional, "No store" default, lists all stores
- Person selector: "You" / "Wife" for addedBy
- Submit button

### Active Items List
- Sorted newest-first by createdAt
- Each row:
  - Checkbox (left) to toggle completion
  - Item name + quantity badge (e.g., "Milk x2", only shown when quantity > 1)
  - Store badge (colored, like CategoryBadge)
  - "Added by" indicator
  - Edit button (opens small modal with same fields as add form, prefilled) + Delete button (with confirmation)
- Checking the box: sets completed, moves item to completed section via Convex reactivity

### Completed Section
- Collapsible with count header (e.g., "Done (4)")
- Collapsed by default
- Same row layout but with strikethrough on item name
- Shows who completed the item
- Can be unchecked to move back to active
- "Clear all completed" button for bulk delete

### Filtering
- Store filter dropdown at top (All Stores / specific store)
- Filters both active and completed sections
- Same pattern as CategoryFilterControl

### States
- Loading: skeleton loaders matching layout
- Empty (no items): friendly message with prompt to add first item
- Empty (filter active, no matches): "No items from [Store]" message

## Page: `/grocery/stores`

Mirrors `/settings/categories` exactly:
- Header: back link to `/grocery` + "Stores" title + "New Store" button
- Store list with edit/delete actions
- Create/edit modal (name + color picker)
- Delete confirmation dialog (warns about nullifying storeId on items)

## Components

### New Components
- `GroceryList.tsx` - Main list container (active + completed sections)
- `GroceryItemRow.tsx` - Single item row with checkbox, details, actions
- `GroceryAddForm.tsx` - Inline add-item form
- `GroceryStoreFilterControl.tsx` - Store filter dropdown (mirrors CategoryFilterControl)
- `GroceryStoreBadge.tsx` - Store badge display (mirrors CategoryBadge)
- `GroceryStoreList.tsx` - Store management list (mirrors CategoryList)
- `GroceryStoreForm.tsx` - Store create/edit modal (mirrors CategoryForm)
- `GroceryStoreDeleteDialog.tsx` - Store delete confirmation (mirrors CategoryDeleteDialog)

### Reused Patterns
- AuthContext for passcode gate
- ThemeToggle
- QueryErrorBoundary for error handling
- Skeleton loading pattern
- Modal pattern (fixed overlay, escape key, backdrop click)

## Passcode Gate

Both `/grocery` and `/grocery/stores` follow the same auth pattern:
- Check `isUnlocked` from AuthContext
- Redirect to `/unlock` if not authenticated
- Skip Convex queries when locked (`"skip"`)

## Non-Goals
- No connection to expense tracking
- No item history/versioning
- No item categories (stores serve as the grouping mechanism)
- No price tracking on items
- No recurring/template lists
- No sharing or export
