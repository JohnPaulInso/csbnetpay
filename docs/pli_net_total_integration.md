# PLI Integration: Net Total Formula & Tag Checkbox Logic

**Date:** 2026-09-30  
**Task:** Enable PLI selection to increase Net Total and disable TAG checkbox when Net Total < ₱5,000  
**Files Modified:** `index6.html`

## Overview

Implemented PLI (Personal Loan Insurance) integration into the Net Total formula with conditional TAG checkbox behavior:

1. **PLI adds to Net Total** when PLI checkbox is checked
2. **Main row TAG checkbox disabled** when Net Total < ₱5,000
3. **Dynamic updates** when PLI sub-deductions are selected
4. **Formula:** `Net Total = NetPay + POS - ONQ + PLI`

## User Requirements

### PLI Integration
- When Net Total < ₱5,000, user can select PLI sub-deductions
- PLI amount gets ADDED to Net Total (not subtracted like ONQ)
- **Example:** ₱5,181.80 + ₱10,824.76 (PLI) = ₱16,006.56

### TAG Checkbox Rules
- **Main row TAG checkbox** (green, last column): ALWAYS enabled regardless of Net Total
- User can check/uncheck to tag rows for export at any Net Total value
- Red deletion tags on sub-rows: Disabled only for AS EASE status or Code 339 auto-tagging

## Implementation Details

### 1. Updated Net Total Formula in `updateFirstBillingRowStatus()` (lines ~6680-6695)

Added PLI to the formula:

```javascript
const delNetpay = (document.getElementById(`del-netpay-${prefix}-${rowKey}`))?.checked ?? true;
const delPos = (document.getElementById(`del-pos-${prefix}-${rowKey}`))?.checked ?? true;
const delOnq = (document.getElementById(`del-onq-${prefix}-${rowKey}`))?.checked ?? true;
const delPli = (document.getElementById(`del-pli-${prefix}-${rowKey}`))?.checked ?? false;

const effNetPay = delNetpay ? (rowData.netPayVal || 0) : 0;
const effPos = delPos ? (rowData.csbPositive || 0) : 0;
const effOnq = delOnq ? (rowData.firstOnqAmt || 0) : 0;
const effPli = delPli ? (rowData.pliAmt || 0) : 0;

// (2026-09-30) FORMULA: NetPay + POS - ONQ + PLI
// Net Total always uses actual POS, PLI is added when checked
const actualPOS = rowData.csbPositive || 0;
const formulaVal = effNetPay + actualPOS - effOnq + effPli;
```

**Key Points:**
- `actualPOS` always uses full POS value (not affected by checkbox)
- `effPli` is added only when PLI checkbox is checked
- ONQ is subtracted (negative impact)
- PLI is added (positive impact)

### 2. TAG Checkbox Always Enabled (REMOVED Net Total Restriction)

**Previous behavior (removed):** TAG checkbox was disabled when Net Total < ₱5,000

**Current behavior:** TAG checkbox is ALWAYS enabled regardless of Net Total value

The main row TAG checkbox can be checked/unchecked at any time to mark rows for export, regardless of whether Net Total is above or below ₱5,000.

### 3. TAG Checkbox Rendering in `generateBranchRowHtml()` (line ~5769)

TAG checkbox always enabled:

```html
<input type="checkbox" id="tag-row-${prefix}-${rowKey}"
    ${isTagged ? 'checked' : ''}
    onchange="toggleBillingTag('${rowKey}', this.checked, '${prefix}')"
    style="cursor: pointer; 
           transform: scale(0.9); 
           accent-color: #34d399; 
           margin: 0 auto; 
           display: block;"
    title="Tag row for export">
```

No disabled state based on Net Total - user can always check/uncheck.

### 4. Red Deletion Tags (Sub-rows)

Red deletion tag checkboxes on POS/ONQ/PLI sub-rows are disabled only for:
- **AS EASE status**: Cannot tag AS EASE items for deletion (business rule)
- **Code 339**: Auto-tagged for deletion, checkbox disabled

These red deletion tags are **NOT affected by Net Total** - they remain enabled regardless of Net Total value (unless AS EASE or Code 339).

### 5. PLI Selection Flow

The existing `updatePliLoanSelection()` function already:
- Calculates sum of checked PLI loans
- Updates `rowData.pliAmt` 
- Auto-checks main PLI checkbox when any sub-deduction is checked
- Calls `updateFirstBillingRowStatus()` which now includes PLI in formula

**No changes needed** to `updatePliLoanSelection()` - it already works correctly!

## Formula Breakdown

### Components
- **NetPay**: Base salary/income (positive)
- **POS (Positive)**: Deductions that increase net (positive, ALWAYS included)
- **ONQ (OnQueue)**: First CSB onqueue deduction (negative, subtracted)
- **PLI**: Personal Loan Insurance (positive, ADDED when checked)

### Formula
```
Net Total = NetPay + POS - ONQ + PLI
```

### Example Calculation

**Initial State:**
- NetPay: ₱15,000
- POS: ₱10,824.76
- ONQ: ₱20,642.96
- PLI: ₱0 (unchecked)
- **Net Total:** 15,000 + 10,824.76 - 20,642.96 + 0 = **₱5,181.80**

**After Checking PLI (₱10,824.76):**
- NetPay: ₱15,000
- POS: ₱10,824.76
- ONQ: ₱20,642.96
- PLI: ₱10,824.76 (checked)
- **Net Total:** 15,000 + 10,824.76 - 20,642.96 + 10,824.76 = **₱16,006.56**

**Result:**
- ✅ Net Total increased from ₱5,181.80 to ₱16,006.56
- ✅ TAG checkbox enabled (Net Total >= ₱5,000)
- ✅ User can now tag row for export

## User Workflow

### Scenario: Using PLI to Increase Net Total

1. User sees Net Total: ₱5,181.80 (red, below ₱5,000 threshold)
2. Main row TAG checkbox is **enabled** (can be checked at any time)
3. User clicks PLI dropdown button to expand sub-deductions
4. User checks PLI loan: ₱10,824.76
5. Net Total updates to: ₱16,006.56 (green, above threshold)
6. User can check TAG checkbox to mark for export

### Visual States

**Net Total < ₱5,000:**
```
Net Total: ₱5,181.80 (RED TEXT)
TAG Checkbox: [☐] ENABLED, full color
Tooltip: "Tag row for export"
```

**Net Total >= ₱5,000 (after adding PLI):**
```
Net Total: ₱16,006.56 (GREEN TEXT)
TAG Checkbox: [☐] ENABLED, full color
Tooltip: "Tag row for export"
```

**Key Point:** TAG checkbox is always enabled regardless of Net Total value.

## Checkbox Behavior Summary

| Checkbox | Initial State | Affects Formula | Affects Status | Notes |
|----------|--------------|-----------------|----------------|-------|
| NetPay | ✅ Checked | Yes | Yes | Base income |
| POS | ✅ Checked | **ALWAYS** included | Yes | Always in formula regardless of checkbox |
| ONQ | Auto-check if code 339 | Yes (subtracted) | Yes | Negative impact |
| PLI | ❌ Unchecked | Yes (added when checked) | No | Positive impact, user must select |
| TAG (main row) | ❌ Unchecked | No | No | Always enabled, export marker |
| Red deletion tags | Based on status/code | No | No | Disabled for AS EASE or Code 339 only |

## Status vs Net Total

**Important distinction:**
- **Net Total**: Display calculation, ALWAYS includes actual POS + optional PLI
- **Status**: Determined by checkbox states (POS checkbox affects status)
- POS checkbox only controls status, not Net Total display
- PLI checkbox controls both (adds to Net Total when checked)

## Testing Checklist

- [ ] PLI unchecked: Net Total excludes PLI amount
- [ ] PLI checked: Net Total includes PLI amount
- [ ] Main row TAG checkbox: ALWAYS enabled regardless of Net Total
- [ ] User can check/uncheck TAG at any Net Total value
- [ ] Net Total color: RED when < ₱5,000, GREEN when >= ₱5,000
- [ ] Checking PLI increases Net Total correctly
- [ ] Unchecking PLI decreases Net Total correctly
- [ ] Multiple PLI loans can be selected and sum correctly
- [ ] Formula: NetPay + POS - ONQ + PLI calculates correctly
- [ ] Red deletion tags: Disabled only for AS EASE or Code 339
- [ ] Red deletion tags: Enabled for all other statuses regardless of Net Total

## Files Modified

1. `index6.html`:
   - Line ~6685: Added `delPli` checkbox state
   - Line ~6690: Added `effPli` calculation
   - Line ~6693: Updated formula to include `+ effPli`
   - Line ~5655: Removed `canTag` flag (no longer needed)
   - Line ~5769: TAG checkbox always enabled (removed disabled state)
   - Line ~6748: Removed TAG checkbox disable logic (always enabled now)

## Notes

- PLI is ADDITIVE (positive impact on Net Total)
- ONQ is SUBTRACTIVE (negative impact on Net Total)
- POS is ALWAYS included regardless of checkbox state
- **Main row TAG checkbox is ALWAYS enabled** regardless of Net Total value
- User can tag/untag rows for export at any Net Total
- Red deletion tags on sub-rows: Disabled only for AS EASE status or Code 339
- Net Total < ₱5,000 shows RED text, >= ₱5,000 shows GREEN text
- Auto-tagging from code 339 still works (when Net Total >= ₱5,000)
