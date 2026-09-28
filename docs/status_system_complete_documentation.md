# Status System Complete Documentation - 2026-09-28

## Overview

The billing system uses a comprehensive status calculation system to categorize accounts based on their deduction patterns. This document explains the complete status logic, priority order, and implementation details.

## All Status Types

The system supports **6 distinct status types** that MUST be consistently maintained across:
1. `buildBillingRowData()` - Initial status calculation
2. `updateFirstBillingRowStatus()` - Dynamic status recalculation
3. `STATUS_SORT_CYCLE` - Table header filter cycle

### 1. EFFECTED ✅
- **Condition**: POS matches Monthly Amort within ±₱1.00 tolerance AND no ONQUEUE
- **Meaning**: Perfect match - account is correctly deducted
- **Badge**: Green (#10b981)
- **Formula**: `monthlyAmort - 1.0 ≤ effectivePos ≤ monthlyAmort + 1.0` AND `effectiveOnq === 0`

### 2. OVERDEDUCTED ⚠️
- **Condition**: POS > Monthly Amort + ₱1.00
- **Meaning**: Employee is being deducted too much
- **Badge**: Orange (#f59e0b)
- **Formula**: `effectivePos > monthlyAmort + 1.0`
- **Example**: Amort = ₱5,000, POS = ₱5,500 → OVERDEDUCTED by ₱500

### 3. UNDERDEDUCTED ⚠️
- **Condition**: POS < Monthly Amort - ₱1.00
- **Meaning**: Employee is being deducted too little
- **Badge**: Yellow (#fbbf24)
- **Formula**: `effectivePos < monthlyAmort - 1.0`
- **Example**: Amort = ₱5,000, POS = ₱4,000 → UNDERDEDUCTED by ₱1,000

### 4. AS EASE / FIRST CSB ONQ 🛡️
- **Condition**: Has ONQUEUE + POS matches amort + Net Total < ₱5,000
- **Meaning**: Protected status - low balance account with pending queue
- **Badge**: Purple (#8b5cf6)
- **Formula**: `effectiveOnq > 0` AND `(netPayVal + effectivePos - effectiveOnq) < 5000`
- **Special**: Red deletion tag checkboxes are **DISABLED**
- **Example**: Amort = ₱5,000, POS = ₱5,000, ONQ = ₱1,000, NetPay = ₱3,000 → Net Total = ₱7,000... wait that's ≥ 5,000
- **Correct Example**: Amort = ₱5,000, POS = ₱5,000, ONQ = ₱3,000, NetPay = ₱2,500 → Net Total = ₱4,500 → AS EASE

### 5. FIRST CSB ONQUEUE 🔵
- **Condition**: Has ONQUEUE + POS matches amort + Net Total ≥ ₱5,000
- **Meaning**: Account has pending CSB queue deductions (higher balance)
- **Badge**: Blue (#3b82f6)
- **Formula**: `effectiveOnq > 0` AND `(netPayVal + effectivePos - effectiveOnq) >= 5000`
- **Example**: Amort = ₱5,000, POS = ₱5,000, ONQ = ₱1,000, NetPay = ₱5,000 → Net Total = ₱9,000 → FIRST CSB ONQ

### 6. NO BILLING ⛔
- **Condition**: No POS deductions (effectivePos === 0)
- **Meaning**: No billing deductions found for this account
- **Badge**: Red (#dc3545)
- **Formula**: `effectivePos === 0`

## Critical Priority Order

### Why Priority Matters

**CRITICAL**: The status checks MUST be performed in this exact order:

```
1. NO BILLING (effectivePos === 0)
2. OVERDEDUCTED (effectivePos > monthlyAmort + 1.0)
3. UNDERDEDUCTED (effectivePos < monthlyAmort - 1.0)
4. AS EASE / FIRST CSB ONQ (effectiveOnq > 0 AND netTotal < 5000)
5. FIRST CSB ONQUEUE (effectiveOnq > 0 AND netTotal >= 5000)
6. EFFECTED (default when POS matches amort)
```

### Why This Order?

An account can have ONQUEUE deductions **AND** still be overdeducted or underdeducted simultaneously. The ONQUEUE status doesn't negate deduction errors.

**Example Scenario**:
- Monthly Amort: ₱5,000
- POS Deductions: ₱7,000 (OVERDEDUCTED by ₱2,000!)
- ONQ Deductions: ₱1,000

**Wrong Order** (checking ONQ first):
```javascript
if (effectiveOnq > 0) {
    return 'FIRST CSB ONQUEUE';  // ❌ WRONG - misses the overdeduction!
}
```
Result: Shows "FIRST CSB ONQ" - hides the ₱2,000 overdeduction error

**Correct Order** (checking OVERDED first):
```javascript
if (effectivePos > monthlyAmort + 1.0) {
    return 'OVERDEDUCTED';  // ✅ CORRECT - catches the error first!
}
```
Result: Shows "OVERDEDUCTED" - alerts user to the ₱2,000 error

## Implementation Locations

### Location 1: buildBillingRowData() - Initial Calculation
**File**: `index6.html` (lines ~4910-4950)

```javascript
// Calculate net total for AS EASE check
const netTotal = netPayVal + effectivePos - effectiveOnq;

if (effectivePos === 0) {
    statusMode = 'NO BILLING';
} else if (effectivePos > (monthlyAmort + 1.0)) {
    statusMode = 'OVERDEDUCTED';
} else if (effectivePos < (monthlyAmort - 1.0)) {
    statusMode = 'UNDERDEDUCTED';
} else if (effectiveOnq > 0) {
    if (netTotal < 5000) {
        statusMode = 'AS EASE / FIRST CSB ONQ';
    } else {
        statusMode = 'FIRST CSB ONQUEUE';
    }
} else {
    statusMode = 'EFFECTED';
}
```

**When Called**: During initial table render when branch is selected

### Location 2: updateFirstBillingRowStatus() - Dynamic Recalculation
**File**: `index6.html` (lines ~6345-6395)

```javascript
const formulaVal = effNetPay + effPos - effOnq;

if (effPos === 0) {
    newStatus = 'NO BILLING';
} else if (effPos > ((rowData.monthlyAmort || 0) + 1.0)) {
    newStatus = 'OVERDEDUCTED';
} else if (effPos < ((rowData.monthlyAmort || 0) - 1.0)) {
    newStatus = 'UNDERDEDUCTED';
} else if (effOnq > 0) {
    if (formulaVal < 5000) {
        newStatus = 'AS EASE / FIRST CSB ONQ';
    } else {
        newStatus = 'FIRST CSB ONQUEUE';
    }
} else {
    newStatus = 'EFFECTED';
}
```

**When Called**: When user checks/unchecks POS or ONQ loan checkboxes

### Location 3: STATUS_SORT_CYCLE - Table Header Filter
**File**: `index6.html` (lines ~6025-6050)

```javascript
const STATUS_SORT_CYCLE = [
    { key: 'EFFECTED', label: 'EFFECTED' },
    { key: 'OVERDEDUCTED', label: 'OVERDED' },
    { key: 'UNDERDEDUCTED', label: 'UNDERDED' },
    { key: 'AS EASE / FIRST CSB ONQ', label: 'AS EASE' },
    { key: 'FIRST CSB ONQUEUE', label: 'ONQUEUE' },
    { key: 'NO BILLING', label: 'NO BILLING' }
];
```

**When Used**: When user clicks STATUS column header to filter/sort

## Status Badge Rendering

### Badge Colors & Styles

| Status | Color | Background | Border | Text |
|--------|-------|------------|--------|------|
| EFFECTED | #10b981 (green) | rgba(16,185,129,0.22) | #10b981 | EFFECTED |
| OVERDEDUCTED | #f59e0b (orange) | rgba(245,158,11,0.22) | #f59e0b | OVER-DEDUCTED |
| UNDERDEDUCTED | #fbbf24 (yellow) | rgba(251,191,36,0.22) | #fbbf24 | UNDER-DEDUCTED |
| AS EASE / FIRST CSB ONQ | #8b5cf6 (purple) | rgba(139,92,246,0.22) | #8b5cf6 | AS EASE / ONQ |
| FIRST CSB ONQUEUE | #3b82f6 (blue) | rgba(13,110,253,0.22) | #0d6efd | FIRST CSB ONQ |
| NO BILLING | #dc3545 (red) | rgba(220,53,69,0.22) | #dc3545 | NO BILLING |

### Badge HTML Template

```html
<span class="badge font-weight-bold" 
      style="width: 100% !important; 
             height: 18px !important; 
             background: rgba(139,92,246,0.22); 
             color: #8b5cf6; 
             border: 1px solid #8b5cf6; 
             border-radius: 4px; 
             font-size: 0.48rem; 
             display: inline-flex; 
             align-items: center; 
             justify-content: center; 
             padding: 1px 4px; 
             white-space: nowrap;">
    AS EASE / ONQ
</span>
```

## AS EASE Protection Feature

### Red Deletion Tag Checkboxes

When status is `AS EASE / FIRST CSB ONQ`, the red deletion tag checkboxes in sub-deduction rows are **automatically disabled**:

```html
<input 
    type="checkbox" 
    class="checkbox-red-tag"
    ${statusMode === 'AS EASE / FIRST CSB ONQ' ? 'disabled' : ''}
    style="${statusMode === 'AS EASE / FIRST CSB ONQ' ? 'opacity: 0.3; cursor: not-allowed;' : ''}"
    title="${statusMode === 'AS EASE / FIRST CSB ONQ' ? 'Cannot tag AS EASE items for deletion' : 'Tag sub-deduction for deletion'}">
```

**Why?**: Protects low-balance vulnerable accounts (net total < ₱5,000) from accidental deletion

## Testing Status Calculations

### Test Case 1: EFFECTED
- Monthly Amort: ₱5,000.00
- POS: ₱5,000.00
- ONQ: ₱0.00
- **Expected**: EFFECTED ✅

### Test Case 2: OVERDEDUCTED
- Monthly Amort: ₱5,000.00
- POS: ₱6,500.00
- ONQ: ₱0.00
- **Expected**: OVERDEDUCTED ⚠️

### Test Case 3: UNDERDEDUCTED
- Monthly Amort: ₱5,000.00
- POS: ₱3,500.00
- ONQ: ₱0.00
- **Expected**: UNDERDEDUCTED ⚠️

### Test Case 4: AS EASE
- Monthly Amort: ₱5,000.00
- POS: ₱5,000.00
- ONQ: ₱2,000.00
- NetPay: ₱1,500.00
- Net Total: ₱4,500.00
- **Expected**: AS EASE / FIRST CSB ONQ 🛡️
- **Verify**: Red checkboxes disabled

### Test Case 5: FIRST CSB ONQ
- Monthly Amort: ₱5,000.00
- POS: ₱5,000.00
- ONQ: ₱1,000.00
- NetPay: ₱6,000.00
- Net Total: ₱10,000.00
- **Expected**: FIRST CSB ONQUEUE 🔵

### Test Case 6: OVERDED with ONQ (Priority Test)
- Monthly Amort: ₱5,000.00
- POS: ₱7,000.00 (OVERDED!)
- ONQ: ₱1,000.00
- **Expected**: OVERDEDUCTED ⚠️ (NOT "FIRST CSB ONQ")
- **Why**: OVERDED checked before ONQ

### Test Case 7: NO BILLING
- Monthly Amort: ₱5,000.00
- POS: ₱0.00
- **Expected**: NO BILLING ⛔

## Troubleshooting

### Issue: Not Seeing AS EASE Status

**Check**:
1. Does account have ONQUEUE deductions? (`effectiveOnq > 0`)
2. Is net total < ₱5,000? (`netPayVal + effectivePos - effectiveOnq < 5000`)
3. Is POS within ±₱1.00 of amort?
4. Check browser console for status calculation logs

**Debug**:
```javascript
console.log('NetPay:', netPayVal);
console.log('POS:', effectivePos);
console.log('ONQ:', effectiveOnq);
console.log('Net Total:', netPayVal + effectivePos - effectiveOnq);
console.log('Status:', statusMode);
```

### Issue: Wrong Status Showing

**Check**:
1. Verify priority order in both `buildBillingRowData()` and `updateFirstBillingRowStatus()`
2. Ensure OVERDED/UNDERDED checked **before** ONQ
3. Verify `STATUS_SORT_CYCLE` matches exact status strings
4. Check ±₱1.00 tolerance calculations

### Issue: Status Filter Not Working

**Check**:
1. `STATUS_SORT_CYCLE` array has all 6 statuses
2. Status strings match exactly (case-sensitive)
3. Table header onclick calls `sortBillingTable('status')`
4. `currentStatusSortIdx` cycles through array correctly

## Maintenance Notes

### When Adding New Status Types

1. Add to `buildBillingRowData()` status calculation
2. Add to `updateFirstBillingRowStatus()` recalculation
3. Add to `STATUS_SORT_CYCLE` array
4. Add badge rendering in `generateBranchRowHtml()`
5. Add to sort ranking in `sortBillingTable()`
6. Add to search filter in `applyBillingFilters()`
7. Update dashboard metrics in `updateDashboardMetrics()`
8. Update this documentation!

### Key Variables to Match

```javascript
// Must match across all locations:
'EFFECTED'
'OVERDEDUCTED'
'UNDERDEDUCTED'
'AS EASE / FIRST CSB ONQ'
'FIRST CSB ONQUEUE'
'NO BILLING'
```

**CRITICAL**: Status strings are case-sensitive and must match exactly!

## Related Documentation

- `docs/status_calculation_fix.md` - Priority order fix details
- `docs/as_ease_status_feature.md` - AS EASE implementation
- `docs/infinite_scroll_complete_fix.md` - Table rendering
- `docs/complete_fix_summary.md` - Overall system summary

## Status: ✅ COMPLETE

All 6 status types are implemented, tested, and documented. The system correctly prioritizes OVERDED/UNDERDED before ONQ checks, and AS EASE protection is working as designed.
