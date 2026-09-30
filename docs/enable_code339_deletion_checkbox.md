# Enable Code 339 Deletion Checkbox for User Control

**Date:** 2026-09-30  
**Issue:** Red deletion checkbox on POS sub-row with code 339 was disabled  
**Solution:** Enable checkbox but keep it auto-checked  
**Files Modified:** `index6.html`

## Problem

User wanted to be able to check/uncheck the red deletion checkbox on POS sub-rows with code 339, especially when Net Total is above ₱5,000.

**Previous Behavior:**
- Code 339 POS sub-row deletion checkbox: **DISABLED** and checked
- User could not uncheck even if needed
- Tooltip: "Auto-tagged: Code 339 for deletion"

## Solution

Changed the deletion checkbox to be **ENABLED but auto-checked** for code 339 loans.

**New Behavior:**
- Code 339 POS sub-row deletion checkbox: **ENABLED** and auto-checked ✅
- User can uncheck if needed
- Tooltip: "Code 339: Auto-checked for deletion (can uncheck)"

## Code Changes

### File: `index6.html` (Line ~5891)

**Before:**
```html
<input type="checkbox" id="tag-sub-row-${prefix}-${rowKey}-${lIdx}"
    class="checkbox-red-tag"
    ${isSubTagged ? 'checked' : ''}
    ${statusMode === 'AS EASE / FIRST CSB ONQ' || isCode339 ? 'disabled' : ''}
    onchange="toggleSubRowTag('${prefix}', '${rowKey}', ${lIdx}, this.checked)"
    style="${statusMode === 'AS EASE / FIRST CSB ONQ' || isCode339 ? 'opacity: 0.3; cursor: not-allowed;' : ''}; transform: scale(0.85);"
    title="${statusMode === 'AS EASE / FIRST CSB ONQ' ? 'Cannot tag AS EASE items for deletion' : (isCode339 ? 'Auto-tagged: Code 339 for deletion' : 'Tag sub-deduction for deletion')}">
```

**After:**
```html
<!-- (2026-09-30) Auto-check code 339 for deletion but keep enabled; prev: disabled -->
<input type="checkbox" id="tag-sub-row-${prefix}-${rowKey}-${lIdx}"
    class="checkbox-red-tag"
    ${isSubTagged ? 'checked' : ''}
    ${statusMode === 'AS EASE / FIRST CSB ONQ' ? 'disabled' : ''}
    onchange="toggleSubRowTag('${prefix}', '${rowKey}', ${lIdx}, this.checked)"
    style="${statusMode === 'AS EASE / FIRST CSB ONQ' ? 'opacity: 0.3; cursor: not-allowed;' : ''}; transform: scale(0.85);"
    title="${statusMode === 'AS EASE / FIRST CSB ONQ' ? 'Cannot tag AS EASE items for deletion' : (isCode339 ? 'Code 339: Auto-checked for deletion (can uncheck)' : 'Tag sub-deduction for deletion')}">
```

## Key Changes

1. **Removed `|| isCode339` from disabled condition**
   - Now only disabled for AS EASE status
   - Code 339 remains enabled

2. **Removed `|| isCode339` from style condition**
   - No opacity reduction for code 339
   - Normal cursor (not 'not-allowed')

3. **Updated tooltip**
   - New: "Code 339: Auto-checked for deletion (can uncheck)"
   - Indicates it's auto-checked but editable

## Checkbox States Summary

| Condition | Checkbox State | User Can Toggle? | Tooltip |
|-----------|---------------|------------------|---------|
| **AS EASE status** | Disabled, unchecked | ❌ No | "Cannot tag AS EASE items for deletion" |
| **Code 339** | **Enabled, auto-checked** | ✅ **Yes** | "Code 339: Auto-checked for deletion (can uncheck)" |
| **Other status** | Enabled, unchecked | ✅ Yes | "Tag sub-deduction for deletion" |

## Use Cases

### Use Case 1: Code 339 with Net Total >= ₱5,000
**Scenario:** Employee has code 339 POS loan (₱8,275.67), Net Total = ₱13,457.47

**Result:**
- Red deletion checkbox: **ENABLED** ✅
- Red deletion checkbox: **Auto-checked** ✅
- User can uncheck if they don't want to delete this loan
- Red tint remains on sub-row

### Use Case 2: User Wants to Keep Code 339 Loan
**Scenario:** Code 339 detected but user wants to keep this loan

**Actions:**
1. User sees red deletion checkbox auto-checked
2. User unchecks the deletion checkbox
3. Red tint may remain (controlled by localStorage)
4. Loan will not be marked for deletion export

### Use Case 3: AS EASE Status Protection
**Scenario:** Employee has AS EASE status (Net Total < ₱5,000)

**Result:**
- Red deletion checkbox: **DISABLED** ❌
- Cannot delete AS EASE items (business rule)
- Opacity 0.3, cursor not-allowed
- Tooltip: "Cannot tag AS EASE items for deletion"

## Why This Change?

1. **User Control:** Users should have final say on deletions
2. **Net Total Threshold:** When Net Total >= ₱5,000, user may want flexibility
3. **Auto-suggestion:** Checkbox starts checked as a suggestion, not forced
4. **Consistency:** Aligns with main TAG checkbox (always enabled)

## Business Logic Preserved

**Still Protected:**
- AS EASE status items cannot be tagged for deletion (checkbox disabled)
- Code 339 is still **auto-detected** and **auto-checked**
- Red tint visual indicator remains
- User gets helpful tooltip explaining auto-check

**New Flexibility:**
- User can uncheck code 339 deletion tag if needed
- Better control when Net Total is above ₱5,000
- User can override auto-suggestion

## Testing Checklist

- [x] Code 339 deletion checkbox renders enabled
- [x] Code 339 deletion checkbox renders checked
- [x] User can uncheck code 339 deletion checkbox
- [x] User can re-check code 339 deletion checkbox
- [x] AS EASE deletion checkboxes remain disabled
- [x] Tooltip shows correct message for code 339
- [x] No opacity reduction for code 339 checkboxes
- [x] Cursor shows pointer (not not-allowed) for code 339
- [x] toggleSubRowTag function works correctly

## Files Modified

1. `index6.html`:
   - Line ~5891: Removed `isCode339` from disabled condition
   - Line ~5894: Removed `isCode339` from style opacity/cursor condition
   - Line ~5895: Updated tooltip for code 339

## Related Documentation

- `docs/required_changes_dashboard_onq.md` - Updated
- `docs/final_implementation_summary_2026_09_30.md` - Updated

## Notes

- Red deletion checkboxes on ONQ and PLI sub-rows unchanged (disabled only for AS EASE)
- Main row TAG checkbox (green) remains always enabled
- Code 339 auto-detection still works (ONQ auto-check, status calculation)
- Red tint background on code 339 sub-rows remains
