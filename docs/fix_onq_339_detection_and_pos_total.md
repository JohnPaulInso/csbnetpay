# Critical Fix: ONQ 339 Detection & Net Total Always Includes ALL POS

**Date:** 2026-09-30  
**Issue:** ONQ with code 0339 not auto-checking, Net Total not including all POS values  
**Files Modified:** `index6.html`

## Problems Identified

Looking at the user's screenshot:

**Data:**
- ONQ 0339: ₱7,999.48 (exists but checkbox **UNCHECKED**)
- POS 339: ₱8,275.67
- Net Total: ₱13,457.47
- Status: **"NO BILLING"** ❌ (should be "1ST CSB ONQUEUE")

**Root Causes:**

### Problem 1: ONQ Not Auto-checking
- System was only checking if first **POS** loan is code 339
- Did NOT check if first **ONQ** loan is code 339/0339
- In this case, first ONQ is code 0339, so it should auto-check

### Problem 2: Net Total Not Including ALL POS
- `actualPOS` was using `rowData.csbPositive` (sum of ONLY checked POS sub-deductions)
- Should use sum of ALL POS loans regardless of checkbox state
- User requirement: **"include all items on positive as the calculation of net total"**

## Solutions Implemented

### Solution 1: Check Both POS AND ONQ for Code 339

Added detection for first ONQ loan being code 339/0339:

```javascript
// (2026-09-30) Check if first POS loan is code 339
const firstPosIs339 = posObj.loans && posObj.loans.length > 0 && 
                      (posObj.loans[0].code === '339' || posObj.loans[0].code === '0339');

// (2026-09-30) Also check if first ONQ loan is code 339/0339
const firstOnqIs339 = onqObj.loans && onqObj.loans.length > 0 && 
                      (onqObj.loans[0].code === '339' || onqObj.loans[0].code === '0339');
```

Auto-check ONQ checkbox when either condition is true:

```html
<!-- (2026-09-30) Auto-check ONQ if first POS or first ONQ is code 339 -->
<input type="checkbox" id="del-onq-${prefix}-${rowKey}" 
       ${r.firstPosIs339 || r.firstOnqIs339 || r.firstOnqAmt > 0 ? 'checked' : ''} 
       ...>
```

### Solution 2: Net Total Always Includes ALL POS Values

Calculate sum of ALL POS loans (not just checked ones):

```javascript
// (2026-09-30) FORMULA: NetPay + POS - ONQ + PLI
// Net Total ALWAYS includes ALL POS values (sum of all posLoans, not just checked ones)
const allPosTotal = rowData.posLoans ? rowData.posLoans.reduce((sum, loan) => sum + (loan.dedamt || 0), 0) : 0;
const actualPOS = allPosTotal || rowData.csbPositive || 0;
const formulaVal = effNetPay + actualPOS - effOnq + effPli;
```

**Logic:**
1. Calculate `allPosTotal` = sum of ALL loans in `rowData.posLoans`
2. Use `allPosTotal` as `actualPOS` (fallback to `csbPositive` if no loans)
3. Net Total always shows full POS amount regardless of sub-deduction checkboxes

## Expected Results After Fix

### Scenario from Screenshot

**Data:**
- Employee: G088193 CUEVA, JAY MARCE...
- Monthly Amort: ₱7,999.48
- NetPay: ₱5,181.80
- POS 339: ₱8,275.67 (ALL POS loans)
- ONQ 0339: ₱7,999.48
- PLI: ₱0.00

**Calculations:**
- All POS Total: ₱8,275.67 (sum of ALL POS loans)
- Net Total: ₱5,181.80 + ₱8,275.67 - ₱0 + ₱0 = **₱13,457.47** ✅

**After Fix:**
- ✅ ONQ checkbox: **AUTO-CHECKED** (first ONQ is code 0339)
- ✅ ONQ value: ₱7,999.48 (now included in calculation)
- ✅ Net Total: ₱13,457.47 (includes ALL POS: ₱8,275.67)
- ✅ Status: **"1ST CSB ONQUEUE"** (ONQ exists + Net Total >= ₱5,000)
- ✅ Main row TAG: Auto-checked (green tint)

## Code Changes

### File: `index6.html`

#### 1. Add firstOnqIs339 Detection (Line ~5008)

```javascript
const firstOnqIs339 = onqObj.loans && onqObj.loans.length > 0 && 
                      (onqObj.loans[0].code === '339' || onqObj.loans[0].code === '0339');
```

#### 2. Update shouldAutoTag Logic (Line ~5029)

```javascript
const shouldAutoTag = (firstPosIs339 || firstOnqIs339) && netTotal >= 5000;
```

#### 3. Fix Initial netTotal in buildBillingRowData (Line ~4976)

**CRITICAL FIX for first load:**
```javascript
// (2026-09-30) Net Total uses ALL POS loans, not just effective/checked ones
const allPosTotal = (posObj.loans || []).reduce((s, l) => s + (l.dedamt || 0), 0);
const netTotal = netPayVal + allPosTotal - effectiveOnq;
const netTotalForStatus = netPayVal + effectivePos - onqAmtForStatus;
```

**Key difference:**
- `netTotal` uses `allPosTotal` (sum of ALL POS loans) for display
- `netTotalForStatus` uses `effectivePos` (sum of checked POS) for status logic

#### 4. Add firstOnqIs339 to Return Object (Line ~5057)

```javascript
return {
    // ... other properties
    hasCode339,
    firstPosIs339,
    firstOnqIs339,  // NEW
    shouldAutoTag
};
```

#### 5. Update ONQ Checkbox Rendering (Line ~5709)

```html
${r.firstPosIs339 || r.firstOnqIs339 || r.firstOnqAmt > 0 ? 'checked' : ''}
```

#### 6. Calculate ALL POS Total in updateFirstBillingRowStatus (Line ~6693)

```javascript
const allPosTotal = rowData.posLoans ? rowData.posLoans.reduce((sum, loan) => sum + (loan.dedamt || 0), 0) : 0;
const actualPOS = allPosTotal || rowData.csbPositive || 0;
```

## Status Logic Flow

With these fixes, the status will now correctly determine:

1. **Check POS:** `effPos = csbPositive` (for status calculation only)
2. **Check ONQ Exists:** `hasOnq = firstOnqAmt > 0 OR firstOnqIs339 OR firstPosIs339`
3. **Calculate Net Total:** `NetPay + allPosTotal - ONQ + PLI` (includes ALL POS)
4. **Determine Status:**
   - If `effPos === 0`: **NO BILLING**
   - If `effPos > monthlyAmort + 1`: **OVERDEDUCTED**
   - If `effPos < monthlyAmort - 1`: **UNDERDEDUCTED**
   - If ONQ exists:
     - Net Total < ₱5,000: **AS EASE / FIRST CSB ONQ**
     - Net Total >= ₱5,000: **1ST CSB ONQUEUE** ✅
   - Else: **EFFECTED**

## Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| **ONQ Auto-check** | Only if first POS is 339 | If first POS **OR** first ONQ is 339/0339 ✅ |
| **Net Total POS** | Sum of checked POS only | **Sum of ALL POS loans** ✅ |
| **Status Accuracy** | Wrong if ONQ not detected | Correct with ONQ 339 detection ✅ |
| **User Control** | Sub-deduction checkboxes affected Net Total | Sub-deductions for status only, not Net Total ✅ |

## User Requirements Met

✅ **"it detected that on the onqueue transactions, the first one is 339 or 0339"**
- Now checks both POS AND ONQ for code 339/0339

✅ **"the value is above 5000"**
- Net Total correctly calculated with ALL POS included

✅ **"the net total must always include all of the pos rows"**
- Uses `allPosTotal` = sum of ALL loans in `posLoans` array

✅ **"whether if i check the total or not, as long as this is on positive"**
- Net Total ALWAYS includes ALL POS, regardless of checkbox states

✅ **"include all items on positive as the calculation of net total"**
- ALL POS loans summed for Net Total display

## Testing Checklist

- [ ] ONQ 0339 auto-checks ONQ checkbox
- [ ] ONQ 339 auto-checks ONQ checkbox
- [ ] POS 339 auto-checks ONQ checkbox (existing)
- [ ] Net Total includes ALL POS values
- [ ] Net Total correct when some POS sub-deductions unchecked
- [ ] Status shows "1ST CSB ONQUEUE" when ONQ 339/0339 detected
- [ ] Status correct when Net Total >= ₱5,000
- [ ] Main row TAG auto-checks when code 339 + Net Total >= ₱5,000
- [ ] POS checkbox state doesn't affect Net Total display
- [ ] Sub-deduction checkboxes only affect status, not Net Total

## Files Modified

1. `index6.html`:
   - Line ~4976: **CRITICAL** - Fixed initial `netTotal` calculation to use ALL POS loans
   - Line ~5008: Added `firstOnqIs339` detection
   - Line ~5029: Updated `shouldAutoTag` to include `firstOnqIs339`
   - Line ~5057: Added `firstOnqIs339` to return object
   - Line ~5709: Updated ONQ checkbox to check for `firstOnqIs339`
   - Line ~6693: Calculate `allPosTotal` from ALL POS loans (dynamic updates)

## Notes

- **POS Checkbox:** Still always checked (for status calculation consistency)
- **Sub-deduction Checkboxes:** Now only affect status calculation, not Net Total
- **NET Total Formula:** `NetPay + allPosTotal - ONQ + PLI`
- **Status Formula:** Uses `effPos` (respects POS checkbox for consistency)
- **Code 339/0339:** Both variations detected in both POS and ONQ
