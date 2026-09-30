# Dashboard Changes: Auto-detect Code 339 for ONQ Status and Auto-tagging

**Date:** 2026-09-30  
**Task:** Auto-detect code 339/0339 POS loans and trigger ONQ checkbox, status, and auto-tagging for deletion  
**Files Modified:** `index6.html`

## Overview

Implemented automatic detection of code 339/0339 POS loans to:
1. Auto-check ONQ checkbox when first POS loan is code 339
2. Update status to "1ST CSB ONQUEUE" when ONQ exists
3. Auto-tag main row (green tint) when code 339 detected AND Net Total >= ₱5,000
4. Auto-tag POS sub-row (red tint) for code 339 loans for export/deletion
5. Fix Net Total formula to ALWAYS include POS regardless of checkbox state

## User Requirements

### Status Logic
- When first POS loan is code 339 or 0339:
  - Auto-check ONQ checkbox
  - Status should be "1ST CSB ONQUEUE" (blue badge)
  
### Auto-tagging Rules
- **Main Row TAG** (green tint, last column):
  - Auto-check when: code 339 detected AND Net Total >= ₱5,000
  - Purpose: Mark for special processing
  
- **POS Sub-row TAG** (red tint, last column):
  - Auto-check when: code 339 or 0339 detected
  - Purpose: Mark for deletion/export
  - Disabled state with tooltip showing "Auto-tagged: Code 339 for deletion"

### Net Total Formula
- **ALWAYS** calculated as: `NetPay + POS - ONQ`
- POS checkbox only affects status calculation, NOT Net Total display
- Net Total must include actual POS value regardless of checkbox state

## Implementation Details

### 1. Detection in `buildBillingRowData()` (lines ~5000-5050)

Added code 339 detection flags:

```javascript
const code339Loans = (posObj.loans || []).filter(l => l.code === '339' || l.code === '0339');
const hasCode339 = code339Loans.length > 0;
// (2026-09-30) Check if first POS loan is code 339 for ONQ auto-check
const firstPosIs339 = posObj.loans && posObj.loans.length > 0 && 
                      (posObj.loans[0].code === '339' || posObj.loans[0].code === '0339');

// (2026-09-30) Auto-tag for deletion if code 339 AND net total >= 5000
const shouldAutoTag = firstPosIs339 && netTotal >= 5000;

return {
    // ... other properties
    hasCode339,
    firstPosIs339,
    shouldAutoTag
};
```

### 2. Main Row TAG Auto-check in `generateBranchRowHtml()` (line ~5620)

Auto-tag main row when `shouldAutoTag === true`:

```javascript
// (2026-09-30) Auto-tag main row if code 339 AND net total >= 5000
const isTagged = r.shouldAutoTag || (()=>{ 
    try{ 
        const t=JSON.parse(localStorage.getItem('billing_tags')||'{}'); 
        return !!t[`${prefix}-${rowKey}`] || !!t[rowKey] || 
               !!t[`${prefix}-${r.empNumStr}`] || !!t[r.empNumStr]; 
    } catch(e) {
        return false;
    } 
})();
```

Main row gets green tint when tagged:
```html
<tr id="billing-row-${prefix}-${rowKey}" 
    style="transition: background 0.2s ease; 
           ${isTagged ? 'background: rgba(52,211,153,0.08);' : ''};">
```

### 3. ONQ Checkbox Auto-check (line ~5709)

Auto-check ONQ checkbox when first POS is code 339:

```javascript
<!-- (2026-09-30) Auto-check ONQ if first POS is code 339 -->
<input type="checkbox" 
       id="del-onq-${prefix}-${rowKey}" 
       class="checkbox-onq" 
       ${r.firstPosIs339 || r.firstOnqAmt > 0 ? 'checked' : ''} 
       onchange="updateFirstBillingRowStatus('${rowKey}', '${prefix}')" 
       title="Include/Exclude OnQueue from Net Total">
```

### 4. POS Sub-row Auto-tagging (lines ~5847-5917)

Added code 339 detection and auto-tagging for POS sub-rows:

```javascript
// (2026-09-30) Auto-tag POS sub-row for deletion if code 339
const isCode339 = loan.code === '339' || loan.code === '0339';
const subRowKey = `${prefix}-${rowKey}-sub-${lIdx}`;
const isSubTagged = isCode339 || (()=>{ 
    try{ 
        const t=JSON.parse(localStorage.getItem('billing_sub_tags')||'{}'); 
        return !!t[subRowKey]; 
    } catch(e) {
        return false;
    } 
})();
```

Sub-row gets red tint when code 339:
```html
<tr id="pos-sub-row-${prefix}-${rowKey}-${lIdx}" 
    style="display: none; 
           background: ${isSubTagged ? 'rgba(239,68,68,0.12)' : 'rgba(251,191,36,0.04)'};">
```

Red deletion tag checkbox:
```html
<!-- (2026-09-30) Auto-tag code 339 POS loans for deletion -->
<input type="checkbox" 
       id="tag-sub-row-${prefix}-${rowKey}-${lIdx}"
       class="checkbox-red-tag"
       ${isSubTagged ? 'checked' : ''}
       ${statusMode === 'AS EASE / FIRST CSB ONQ' || isCode339 ? 'disabled' : ''}
       title="${isCode339 ? 'Auto-tagged: Code 339 for deletion' : 'Tag sub-deduction for deletion'}">
```

### 5. Net Total Formula Fix in `updateFirstBillingRowStatus()` (lines ~6680-6690)

Changed Net Total to ALWAYS include actual POS value:

```javascript
const effNetPay = delNetpay ? (rowData.netPayVal || 0) : 0;
const effPos = delPos ? (rowData.csbPositive || 0) : 0;  // Only for status calc
const effOnq = delOnq ? (rowData.firstOnqAmt || 0) : 0;

// (2026-09-30) FORMULA: NetPay + POS - ONQ ALWAYS includes actual POS
// Net Total display always uses actual POS value, regardless of checkbox state
const actualPOS = rowData.csbPositive || 0;
const formulaVal = effNetPay + actualPOS - effOnq;
```

**Key Change:**
- Net Total formula uses `actualPOS` (always the full value)
- Status calculation still uses `effPos` (respects checkbox)
- POS checkbox only affects status determination, not Net Total display

## Status Priority Logic

Status calculation order (matches existing logic):

1. **NO BILLING**: `effPos === 0`
2. **OVERDEDUCTED**: `effPos > (monthlyAmort + 1.0)`
3. **UNDERDEDUCTED**: `effPos < (monthlyAmort - 1.0)`
4. **ONQ STATUSES**: If ONQ loans exist or `effOnq > 0`:
   - **AS EASE / FIRST CSB ONQ**: `netTotalWithOnq < 5000`
   - **FIRST CSB ONQUEUE**: `netTotalWithOnq >= 5000`
5. **EFFECTED**: Default if none of above

## Visual Indicators

### Main Row
- **Green tint**: `rgba(52,211,153,0.08)` when `shouldAutoTag === true`
- **Green TAG checkbox**: Auto-checked when code 339 AND Net Total >= ₱5,000

### POS Sub-row with Code 339
- **Red tint**: `rgba(239,68,68,0.12)` when code 339 detected
- **Red TAG checkbox**: Auto-checked (but can be unchecked by user)
- **Enabled**: User can check/uncheck the deletion tag
- **Tooltip**: "Code 339: Auto-checked for deletion (can uncheck)"

### ONQ Checkbox
- Auto-checked when `firstPosIs339 === true`
- Triggers "1ST CSB ONQUEUE" status

## Example Scenario

**Employee:** AA26068WRQW4  
**POS Loan:** Code 339, Amount: ₱8,275.67, EFF: 04/2026, TERM: 03/2031

**Result:**
1. ✅ ONQ checkbox auto-checked (first POS is code 339)
2. ✅ Status: "1ST CSB ONQUEUE" (blue badge)
3. ✅ Net Total: Includes full ₱8,275.67 regardless of POS checkbox
4. ✅ Main row TAG: Auto-checked (code 339 + Net Total >= ₱5,000)
5. ✅ Main row: Green tint background
6. ✅ POS sub-row: Red tint background
7. ✅ POS sub-row TAG: Auto-checked but **ENABLED** (user can uncheck if needed)

## Testing Checklist

- [ ] Code 339 POS loan auto-checks ONQ checkbox
- [ ] Status shows "1ST CSB ONQUEUE" when code 339 detected
- [ ] Main row TAG auto-checks when code 339 AND Net Total >= ₱5,000
- [ ] Main row has green tint when auto-tagged
- [ ] POS sub-row has red tint for code 339
- [ ] POS sub-row TAG auto-checks for code 339 (but remains enabled)
- [ ] User can uncheck POS sub-row TAG for code 339 if needed
- [ ] Net Total always includes POS regardless of checkbox state
- [ ] POS checkbox still affects status calculation
- [ ] Code 0339 (with leading zero) also triggers detection

## Files Modified

1. `index6.html`:
   - Line ~5008: Added `firstPosIs339` detection
   - Line ~5028: Added `shouldAutoTag` calculation
   - Line ~5045: Added flags to return object
   - Line ~5620: Auto-tag main row when `shouldAutoTag`
   - Line ~5709: Auto-check ONQ when `firstPosIs339`
   - Line ~5847: Detect code 339 in POS sub-rows
   - Line ~5854: Auto-tag POS sub-row for code 339
   - Line ~5917: Red deletion checkbox enabled for code 339 (auto-checked but user can toggle)
   - Line ~6688: Fix Net Total to always include actual POS

## Notes

- AS EASE status items cannot be tagged for deletion (disabled checkbox)
- Code 339 auto-tagging overrides manual tag states
- localStorage still used for manual tag persistence
- Red tint indicates items marked for deletion/export
- Green tint indicates main rows requiring special processing
