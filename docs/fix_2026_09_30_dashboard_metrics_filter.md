# Fix: Dashboard Metrics Now Respect Release Month Filter

**Date**: 2026-09-30  
**Issue**: Dashboard status counts (TOTAL badge) showed all employees instead of filtered results  
**Status**: ✅ FIXED

---

## Problem Description

The dashboard metrics badges (EFFECTED, OVERDEDUCTED, UNDERDEDUCTED, AS EASE, FIRST CSB ONQ, NO DEDUCTION, and **TOTAL**) were displaying counts from the **entire dataset** regardless of the active "Release Month" filter.

### User Impact
When filtering by a specific loan release month (e.g., "August 2026"), the visible table correctly showed only matching rows, but the status count badges at the top showed totals from all months, making it impossible to see accurate statistics for the filtered subset.

**Example**:
- Filter: "August 2026" 
- Visible rows: 122 employees with August loans
- **TOTAL badge**: Incorrectly showed "3,964" (all employees in database)

---

## Root Cause

Two locations in the code were calling `updateDashboardMetrics()` with the **unfiltered** row arrays:

### Location 1: `applyBillingFilters()` function (line ~6449)
```javascript
// OLD CODE (WRONG):
const allBranchRows = (window.currentBranchAllRowsNormal || []).concat(window.currentBranchAllRowsAuto || []);
updateDashboardMetrics(allBranchRows);
```

This passed `allBranchRows` which contains **every employee** before any filters are applied.

### Location 2: `updateFirstBillingRowStatus()` function (line ~6697)
```javascript
// OLD CODE (WRONG):
const allRows = (window.currentBranchAllRowsNormal || []).concat(window.currentBranchAllRowsAuto || []);
if (allRows.length > 0) updateDashboardMetrics(allRows);
```

This also used the complete unfiltered dataset when recalculating status after checkbox changes.

---

## Solution Implemented

### Fix 1: `applyBillingFilters()` - Use Filtered Arrays
**File**: index6.html  
**Line**: ~6542-6543

```javascript
// NEW CODE (CORRECT):
// (2026-09-30) Update metrics to reflect FILTERED rows only (respects release month selection); prev: all branch rows
const filteredMetricsRows = filteredNorm.concat(filteredAuto);
updateDashboardMetrics(filteredMetricsRows);
```

**Change**: Now passes `filteredNorm` + `filteredAuto` which contain only rows that:
- Match the selected branch (if not "ALL")
- Match the selected release month (if not "all")
- Match the active status filter (if applied)
- Match the search query (if entered)

### Fix 2: `updateFirstBillingRowStatus()` - Use Currently Filtered Rows
**File**: index6.html  
**Line**: ~6698-6700

```javascript
// NEW CODE (CORRECT):
// (2026-09-30) Update metrics using FILTERED rows only (respects release month filter); prev: all branch rows
const filteredRows = (window.currentBranchRowsNormal || []).concat(window.currentBranchRowsAuto || []);
if (filteredRows.length > 0) updateDashboardMetrics(filteredRows);
```

**Change**: Now uses `window.currentBranchRowsNormal` and `window.currentBranchRowsAuto` which are populated by `applyBillingFilters()` with the active filter results.

---

## Verification Steps

To verify the fix is working:

1. **Load the billing page** with LCS data
2. **Select a release month filter** (e.g., "August 2026" from the dropdown)
3. **Check the TOTAL badge** - it should now show the count of visible rows only
4. **Verify individual status badges**:
   - EFFECTED count
   - OVERDEDUCTED count
   - UNDERDEDUCTED count
   - AS EASE count
   - FIRST CSB ONQ count
   - NO DEDUCTION count
5. **Toggle checkboxes** in the POS/ONQ columns - metrics should update correctly
6. **Change release month** - metrics should recalculate immediately

### Expected Behavior
- **TOTAL badge** = Sum of all status badge counts
- **All badges** reflect only the currently visible/filtered rows
- Changing filters updates badges in real-time

---

## Technical Details

### Data Flow After Fix

```
[User selects "August 2026" filter]
        ↓
[applyBillingFilters() executes]
        ↓
[Filter logic processes rows]:
  - selectedMonth check
  - status filter check  
  - search query check
        ↓
[filteredNorm, filteredAuto created]
        ↓
[Store in window.currentBranchRowsNormal/Auto]
        ↓
[Pass filtered arrays to updateDashboardMetrics()]
        ↓
[Count status types from FILTERED rows only]
        ↓
[Update dashboard badge elements with accurate counts]
```

### Key Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `window.currentBranchAllRowsNormal` | Global | Complete unfiltered normal billing rows |
| `window.currentBranchAllRowsAuto` | Global | Complete unfiltered autonomous billing rows |
| `window.currentBranchRowsNormal` | Global | **Filtered** normal billing rows (after all filters) |
| `window.currentBranchRowsAuto` | Global | **Filtered** autonomous billing rows (after all filters) |
| `filteredNorm` | Local | Temporarily holds filtered normal rows during filter operation |
| `filteredAuto` | Local | Temporarily holds filtered autonomous rows during filter operation |

---

## Impact Assessment

### Affected Features ✅
- ✅ Dashboard status count badges (all 7 types)
- ✅ TOTAL badge display
- ✅ Release month filtering
- ✅ Status filter cycling
- ✅ Search query filtering
- ✅ Branch selection filtering
- ✅ Real-time checkbox updates

### Unchanged Features ✅
- ✅ Table rendering (already worked correctly)
- ✅ Sorting functionality
- ✅ Infinite scroll
- ✅ Data loading from CSV
- ✅ Export functions

---

## Related Functions

These functions work together for accurate metrics:

1. **`updateDashboardMetrics(rows)`** - Counts status types and updates badge UI
2. **`applyBillingFilters()`** - Filters rows by month/status/search and updates metrics
3. **`updateFirstBillingRowStatus(empNumStr, prefix)`** - Recalculates status after user changes checkboxes
4. **`sortBillingTable(col)`** - Sorts then calls `applyBillingFilters()` which updates metrics
5. **`filterByLoanMonth(monthKey)`** - Sets month filter then calls `applyBillingFilters()`

---

## Testing Checklist

- [x] Release month filter changes TOTAL badge correctly
- [x] Status filter changes TOTAL badge correctly
- [x] Search query changes TOTAL badge correctly
- [x] Branch selection changes TOTAL badge correctly
- [x] Checkbox toggles update metrics correctly
- [x] Sorting preserves correct metric counts
- [x] "All" release month shows complete dataset counts
- [x] Multiple filters combined show accurate intersection counts

---

## Notes for Future Development

### Best Practice
Always use the **filtered arrays** (`window.currentBranchRowsNormal/Auto` or the local `filteredNorm/Auto`) when updating UI elements that should reflect the user's current view.

Use the **all arrays** (`window.currentBranchAllRowsNormal/Auto`) only when you need to:
- Reapply sorting to the complete dataset
- Reset filters to "all"
- Export complete data regardless of filters

### Pattern to Follow
```javascript
// ✅ CORRECT: Use filtered rows for UI updates
const filteredRows = window.currentBranchRowsNormal.concat(window.currentBranchRowsAuto);
updateDashboardMetrics(filteredRows);

// ❌ WRONG: Using all rows ignores active filters
const allRows = window.currentBranchAllRowsNormal.concat(window.currentBranchAllRowsAuto);
updateDashboardMetrics(allRows);
```

---

## Change Log

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-09-30 | 1.0 | Fixed dashboard metrics to respect filters | Kiro |

---

*This fix ensures the dashboard provides accurate, real-time statistics that match exactly what the user sees in the filtered table view.*
