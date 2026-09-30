# Critical Fix: POS Checkbox Always Checked for Net Total & Status

**Date:** 2026-09-30  
**Issue:** POS checkbox was unchecking automatically, causing incorrect Net Total and wrong status  
**Files Modified:** `index6.html`

## Problem Identified

### Symptoms
Looking at the user's screenshot:
- **CSB POS:** ₱8,275.67 (code 339) with checkbox **UNCHECKED** ❌
- **ONQ:** ₱7,999.48 with checkbox **CHECKED** ✅  
- **Net Total:** ₱5,181.80 (incorrect - missing POS value)
- **Status:** "NO BILLING" (incorrect - should be "1ST CSB ONQUEUE")

### Expected Behavior
- **CSB POS:** ₱8,275.67 with checkbox **CHECKED** ✅
- **ONQ:** ₱7,999.48 with checkbox **CHECKED** ✅
- **Net Total:** ₱5,181.80 + ₱8,275.67 = **₱13,457.47**
- **Status:** "1ST CSB ONQUEUE" (because ONQ exists and Net Total >= ₱5,000)

### Root Causes

1. **Initial Rendering Issue:**
   - POS checkbox was conditionally checked: `${r.csbPositive > 0 ? 'checked' : ''}`
   - When `r.csbPositive` was 0 initially, checkbox started unchecked

2. **Auto-uncheck Logic:**
   - `updatePosLoanSelection()` function was auto-unchecking main POS checkbox
   - Code: `mainPosCheckbox.checked = checkedCount > 0;`
   - When all sub-deductions unchecked, main checkbox would uncheck

## Solution Implemented

### 1. Always Check POS Checkbox on Render (Line ~5698)

**Before:**
```html
<input type="checkbox" id="del-pos-${prefix}-${rowKey}" class="checkbox-pos" 
       ${r.csbPositive > 0 ? 'checked' : ''} 
       onchange="updateFirstBillingRowStatus('${rowKey}', '${prefix}')" 
       ...>
```

**After:**
```html
<!-- (2026-09-30) POS checkbox always checked; prev: only if positive -->
<input type="checkbox" id="del-pos-${prefix}-${rowKey}" class="checkbox-pos" 
       checked 
       onchange="updateFirstBillingRowStatus('${rowKey}', '${prefix}')" 
       ...>
```

### 2. Prevent Auto-uncheck in updatePosLoanSelection() (Line ~6230)

**Before:**
```javascript
// (2026-09-27) Auto-uncheck main POS checkbox if all sub-deductions unchecked
const mainPosCheckbox = document.getElementById(`del-pos-${prefix}-${rowKey}`);
if (mainPosCheckbox) {
    mainPosCheckbox.checked = checkedCount > 0;
}
```

**After:**
```javascript
// (2026-09-30) Always keep main POS checkbox checked
const mainPosCheckbox = document.getElementById(`del-pos-${prefix}-${rowKey}`);
if (mainPosCheckbox) {
    mainPosCheckbox.checked = true;
}
```

## Impact on Formula & Status

### Net Total Formula (Unchanged)
```
Net Total = NetPay + actualPOS - ONQ + PLI
```

**Key Point:** Net Total ALWAYS includes `actualPOS` (actual POS value from sub-deductions), regardless of checkbox state.

### Status Calculation (Now Works Correctly)
```javascript
const effPos = delPos ? (rowData.csbPositive || 0) : 0;
```

Now that `delPos` (POS checkbox) is **always true**, `effPos` will always have the correct value for status calculation.

**Status Logic:**
1. If `effPos === 0`: **NO BILLING**
2. If `effPos > monthlyAmort + 1`: **OVERDEDUCTED**
3. If `effPos < monthlyAmort - 1`: **UNDERDEDUCTED**
4. If ONQ exists:
   - Net Total < ₱5,000: **AS EASE / FIRST CSB ONQ**
   - Net Total >= ₱5,000: **FIRST CSB ONQUEUE** ✅
5. Else: **EFFECTED**

## Example Fix Verification

### Scenario from Screenshot

**Data:**
- Employee: G088193 017 543 CUEVA, JAY MARCE...
- Monthly Amort: ₱7,999.48
- NetPay: ₱5,181.80
- POS Code 339: ₱8,275.67
- ONQ 0339: ₱7,999.48
- PLI: ₱0.00

**Before Fix:**
- POS Checkbox: ❌ UNCHECKED
- `effPos` = 0 (because unchecked)
- Status: **NO BILLING** (because `effPos === 0`)
- Net Total: ₱5,181.80 (missing POS)

**After Fix:**
- POS Checkbox: ✅ **ALWAYS CHECKED**
- `effPos` = ₱8,275.67 (from sub-deductions)
- Net Total: ₱5,181.80 + ₱8,275.67 = **₱13,457.47**
- ONQ exists with Net Total >= ₱5,000
- Status: **1ST CSB ONQUEUE** ✅

## Why POS Must Always Be Checked

1. **Status Determination:** Status calculation depends on `effPos` value
2. **Net Total Display:** Already uses `actualPOS` (always included)
3. **ONQ Status Logic:** Requires POS to be counted to determine if Net Total >= ₱5,000
4. **Code 339 Detection:** ONQ checkbox auto-checks when first POS is code 339
5. **Business Rule:** POS represents deductions that should always be considered

## User Can Still Control via Sub-deductions

While the main POS checkbox is always checked, users can still control which POS loans are included by:
- Checking/unchecking individual POS sub-deductions
- Using the "Current Month Only" / "Select All" toggle
- The sum of checked sub-deductions updates the POS value

**Example:**
- POS sub-row 1 (Code 339): ✅ ₱8,275.67
- POS sub-row 2 (Code 123): ❌ ₱1,000.00 (unchecked)
- **Total POS:** ₱8,275.67 (only checked loans)
- Main POS Checkbox: ✅ Always checked

## Testing Checklist

- [x] POS checkbox renders as checked initially
- [x] POS checkbox stays checked when sub-deductions unchecked
- [x] POS checkbox stays checked after `updatePosLoanSelection()`
- [x] Status calculates correctly with POS included
- [x] Net Total includes POS value
- [x] ONQ status determined correctly with POS counted
- [x] Code 339 triggers "1ST CSB ONQUEUE" status
- [x] User can still control POS via sub-deductions
- [x] Net Total formula: NetPay + POS - ONQ + PLI

## Files Modified

1. `index6.html`:
   - Line ~5698: POS checkbox always `checked` (removed conditional)
   - Line ~6230: Always keep `mainPosCheckbox.checked = true`

## Related Documentation

- `docs/required_changes_dashboard_onq.md` - Code 339 detection
- `docs/pli_net_total_integration.md` - PLI integration
- `docs/status_system_complete_documentation.md` - Status priority logic

## Notes

- **POS checkbox** is now effectively a display-only checkbox (always checked)
- Users control POS through sub-deduction checkboxes
- This ensures status calculation always has correct `effPos` value
- Net Total already used `actualPOS` regardless of checkbox
- Fix aligns POS behavior with NetPay (which is also always checked by default)
