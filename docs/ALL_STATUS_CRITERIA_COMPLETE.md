# Complete Status Criteria Documentation - index6.html

**Date:** 2026-09-30  
**File:** `index6.html`  
**Purpose:** Comprehensive list of all billing statuses and their exact criteria

## Overview

The billing system has **6 distinct statuses** that are calculated based on POS deductions, ONQ (OnQueue) loans, monthly amortization, and Net Total values. The status calculation follows a strict **priority order** to ensure accurate classification.

## Key Variables Used

### Display Values (for Net Total)
| Variable | Description | Calculation |
|----------|-------------|-------------|
| **csbPositive** | POS amount for display | Sum of POS loans matching current month filter |
| **netTotal** | Net Total for display | `NetPay + csbPositive - effectiveOnq` |

### Status Calculation Values
| Variable | Description | Calculation |
|----------|-------------|-------------|
| **effectivePos** | POS for status logic | Sum of checked/filtered POS loans |
| **effectiveOnq** | ONQ for status logic | ONQ amount if "Select All" mode, else 0 |
| **monthlyAmort** | Expected monthly payment | From LCS data |
| **netTotalForStatus** | Net Total for status | `NetPay + effectivePos - onqAmtForStatus` |

### Detection Flags
| Flag | Description |
|------|-------------|
| **firstPosIs339** | First POS loan has code 339 or 0339 |
| **firstOnqIs339** | First ONQ loan has code 339 or 0339 |
| **hasOnq** | ONQ loans exist OR effectiveOnq > 0 |

## Status Priority Order

The system checks conditions in this exact order (first match wins):

```
1. Check: firstOnqIs339 AND hasOnq
   ├─ Yes → Check netTotal
   │   ├─ < ₱5,000 → AS EASE / FIRST CSB ONQ
   │   └─ >= ₱5,000 → FIRST CSB ONQUEUE
   │
2. Check: effectivePos === 0
   └─ Yes → NO BILLING
   │
3. Check: effectivePos > (monthlyAmort + 1.0)
   └─ Yes → OVERDEDUCTED
   │
4. Check: effectivePos < (monthlyAmort - 1.0)
   └─ Yes → UNDERDEDUCTED
   │
5. Check: hasOnq
   ├─ Yes → Check netTotalForStatus
   │   ├─ < ₱5,000 → AS EASE / FIRST CSB ONQ
   │   └─ >= ₱5,000 → FIRST CSB ONQUEUE
   │
6. Default → EFFECTED
```

---

## Status 1: FIRST CSB ONQUEUE

**Badge Color:** Blue (#3b82f6)  
**Badge Text:** "1ST CSB ONQ"  
**Priority:** 1 (Highest when code 339 detected)

### Criteria

**Path 1: Code 339 ONQ Detected**
```
✅ firstOnqIs339 === true (first ONQ loan is code 339/0339)
AND
✅ hasOnq === true (ONQ loans actually exist)
AND
✅ netTotal >= ₱5,000
```

**Path 2: Regular ONQ**
```
✅ effectivePos > 0 (has POS deductions)
AND
✅ effectivePos within tolerance: (monthlyAmort - 1.0) <= effectivePos <= (monthlyAmort + 1.0)
AND
✅ hasOnq === true (ONQ loans exist)
AND
✅ netTotalForStatus >= ₱5,000
```

### Example Scenarios

**Scenario A: Code 339 ONQ**
- First ONQ loan: Code 0339, ₱7,999.48
- NetPay: ₱5,181.80
- POS: ₱8,275.67
- Net Total: ₱5,181.80 + ₱8,275.67 - ₱7,999.48 = ₱5,457.99 (>= ₱5,000)
- **Status: FIRST CSB ONQUEUE** ✅

**Scenario B: Regular ONQ**
- Monthly Amort: ₱10,000
- effectivePos: ₱10,000 (matches amort)
- ONQ exists: ₱5,000
- netTotalForStatus: ₱15,000 - ₱5,000 = ₱10,000 (>= ₱5,000)
- **Status: FIRST CSB ONQUEUE** ✅

### Notes
- Takes priority over OVERDEDUCTED/UNDERDEDUCTED when code 339 ONQ detected
- Only triggers if ONQ loans actually exist (not just code 339 in POS)
- Net Total must be >= ₱5,000 to distinguish from AS EASE

---

## Status 2: AS EASE / FIRST CSB ONQ

**Badge Color:** Purple (#8b5cf6)  
**Badge Text:** "AS EASE/ONQ"  
**Priority:** 1 (Highest when code 339 detected) or 5

### Criteria

**Path 1: Code 339 ONQ with Low Net Total**
```
✅ firstOnqIs339 === true (first ONQ loan is code 339/0339)
AND
✅ hasOnq === true (ONQ loans actually exist)
AND
✅ netTotal < ₱5,000
```

**Path 2: Regular ONQ with Low Net Total**
```
✅ effectivePos > 0 (has POS deductions)
AND
✅ effectivePos within tolerance: (monthlyAmort - 1.0) <= effectivePos <= (monthlyAmort + 1.0)
AND
✅ hasOnq === true (ONQ loans exist)
AND
✅ netTotalForStatus < ₱5,000
```

### Example Scenarios

**Scenario A: Code 339 ONQ, Low Balance**
- First ONQ: Code 0339, ₱8,000
- NetPay: ₱1,000
- POS: ₱2,000
- Net Total: ₱1,000 + ₱2,000 - ₱8,000 = -₱5,000 (< ₱5,000)
- **Status: AS EASE / FIRST CSB ONQ** ✅

**Scenario B: Regular ONQ, Low Balance**
- Monthly Amort: ₱5,000
- effectivePos: ₱5,000
- ONQ: ₱8,000
- netTotalForStatus: ₱2,000 (< ₱5,000)
- **Status: AS EASE / FIRST CSB ONQ** ✅

### Notes
- **Protected status** - cannot tag for deletion (red deletion checkboxes disabled)
- Indicates low balance account with ONQ
- Takes priority over OVERDEDUCTED/UNDERDEDUCTED when code 339 detected

---

## Status 3: NO BILLING

**Badge Color:** Red (#dc3545)  
**Badge Text:** "NO BILLING"  
**Priority:** 2

### Criteria

```
✅ effectivePos === 0 (no POS deductions for current month)
AND
❌ NOT (firstOnqIs339 AND hasOnq) (code 339 ONQ takes priority)
```

### Example Scenarios

**Scenario A: No POS Deductions**
- Monthly Amort: ₱10,000
- effectivePos: ₱0 (no POS loans for September)
- ONQ: ₱0
- **Status: NO BILLING** ✅

**Scenario B: POS Exists but Not for Current Month**
- POS Loan 1: EFF 02/2026 (February) - ₱8,215.56
- POS Loan 2: EFF 09/2026 (September) - ₱0 (unchecked)
- effectivePos: ₱0
- **Status: NO BILLING** ✅

**Scenario C: Code 339 in POS but No ONQ**
- First POS: Code 339, but unchecked
- effectivePos: ₱0
- ONQ: None
- **Status: NO BILLING** ✅

### Notes
- Most common status when filtering by month and no deductions match
- Not an error - just means no billing for selected period
- **Does NOT trigger** if code 339 ONQ exists (ONQ takes priority)

---

## Status 4: OVERDEDUCTED

**Badge Color:** Orange (#f59e0b)  
**Badge Text:** "EFF/OVERDED"  
**Priority:** 3

### Criteria

```
✅ effectivePos > (monthlyAmort + 1.0)
AND
❌ NOT (firstOnqIs339 AND hasOnq) (code 339 ONQ takes priority)
```

**Tolerance:** ₱1.00 (must exceed by more than ₱1.00)

### Example Scenarios

**Scenario A: Clear Overdeduction**
- Monthly Amort: ₱10,000
- effectivePos: ₱12,500
- Difference: +₱2,500 (> ₱1.00 tolerance)
- **Status: OVERDEDUCTED** ✅
- **Diff Column:** +₱2,500 (orange)

**Scenario B: Just Over Tolerance**
- Monthly Amort: ₱7,999.48
- effectivePos: ₱8,275.67
- Difference: +₱276.19 (> ₱1.00 tolerance)
- **Status: OVERDEDUCTED** ✅
- **Diff Column:** +₱276.19 (orange)

**Scenario C: Within Tolerance (NOT OVERDED)**
- Monthly Amort: ₱10,000
- effectivePos: ₱10,000.50
- Difference: +₱0.50 (< ₱1.00 tolerance)
- **Status: EFFECTED** (not OVERDEDUCTED)

### Notes
- Indicates employee was deducted more than expected
- Shows difference in DIFF column with orange color
- Checked **BEFORE** ONQ status unless code 339 ONQ detected
- Tolerance of ±₱1.00 accounts for rounding

---

## Status 5: UNDERDEDUCTED

**Badge Color:** Yellow (#facc15)  
**Badge Text:** "EFF/UNDERDED"  
**Priority:** 4

### Criteria

```
✅ effectivePos < (monthlyAmort - 1.0)
AND
✅ effectivePos > 0 (not zero)
AND
❌ NOT (firstOnqIs339 AND hasOnq) (code 339 ONQ takes priority)
```

**Tolerance:** ₱1.00 (must be short by more than ₱1.00)

### Example Scenarios

**Scenario A: Significant Underdeduction**
- Monthly Amort: ₱10,515.21
- effectivePos: ₱2,299.65
- Difference: -₱8,215.56 (> ₱1.00 tolerance)
- **Status: UNDERDEDUCTED** ✅
- **Diff Column:** -₱8,215.56 (yellow)

**Scenario B: Just Under Tolerance**
- Monthly Amort: ₱5,000
- effectivePos: ₱4,997
- Difference: -₱3.00 (> ₱1.00 tolerance)
- **Status: UNDERDEDUCTED** ✅
- **Diff Column:** -₱3.00 (yellow)

**Scenario C: Within Tolerance (NOT UNDERDED)**
- Monthly Amort: ₱10,000
- effectivePos: ₱9,999.80
- Difference: -₱0.20 (< ₱1.00 tolerance)
- **Status: EFFECTED** (not UNDERDEDUCTED)

### Notes
- Indicates employee was deducted less than expected
- Shows difference in DIFF column with yellow color
- Checked **BEFORE** ONQ status unless code 339 ONQ detected
- Tolerance of ±₱1.00 accounts for rounding

---

## Status 6: EFFECTED

**Badge Color:** Green (#28a745)  
**Badge Text:** "EFFECTED"  
**Priority:** 6 (Default/Lowest)

### Criteria

```
✅ effectivePos > 0 (has POS deductions)
AND
✅ effectivePos within tolerance: (monthlyAmort - 1.0) <= effectivePos <= (monthlyAmort + 1.0)
AND
❌ NOT hasOnq (no ONQ loans)
```

**Tolerance:** ±₱1.00 from monthly amortization

### Example Scenarios

**Scenario A: Perfect Match**
- Monthly Amort: ₱10,000
- effectivePos: ₱10,000
- Difference: ₱0
- **Status: EFFECTED** ✅

**Scenario B: Within Positive Tolerance**
- Monthly Amort: ₱7,999.48
- effectivePos: ₱8,000.00
- Difference: +₱0.52 (< ₱1.00)
- **Status: EFFECTED** ✅

**Scenario C: Within Negative Tolerance**
- Monthly Amort: ₱5,000
- effectivePos: ₱4,999.50
- Difference: -₱0.50 (< ₱1.00)
- **Status: EFFECTED** ✅

### Notes
- Default "correct" status
- Indicates billing was processed correctly
- Most common status for accounts with no issues
- DIFF column shows "-" (no significant difference)

---

## Special Cases & Edge Cases

### Case 1: Code 339 in POS but Not First
```
POS Loan 1: Code 1234, ₱5,000
POS Loan 2: Code 339, ₱3,000
→ firstPosIs339 = false
→ Normal status logic applies
```

### Case 2: Code 339 in Second ONQ
```
ONQ Loan 1: Code 1010, ₱8,000 (first)
ONQ Loan 2: Code 0339, ₱7,999.48 (second)
→ firstOnqIs339 = false
→ Does NOT trigger "1ST CSB ONQ" status
→ Normal status logic applies
```

### Case 3: Code 339 POS but No ONQ
```
POS: Code 339, ₱2,299.65
ONQ: None (₱0.00, no loans)
→ Does NOT trigger ONQ status
→ Checks UNDERDEDUCTED/OVERDEDUCTED logic
→ Result: UNDERDEDUCTED (if POS < Amort - 1)
```

### Case 4: Multiple Accounts Per Employee
```
Account 1: Amort ₱9,904.63, Release 08/07/2026
Account 2: Amort ₱6,898.94, Release 02/15/2026
→ Displays stacked in same row
→ Status based on TOTAL effective POS vs TOTAL amort
```

### Case 5: POS Loan from Different Month
```
Current Filter: September (09/2026)
POS Loan: EFF 02/2026 (February), ₱8,215.56
→ NOT included in effectivePos
→ May result in NO BILLING or UNDERDEDUCTED
```

---

## Month Filter Impact

### "Current Month Only" Mode
- **effectivePos:** Only POS loans where EFF matches current month
- **csbPositive:** Only POS loans where EFF matches current month
- **Effect:** Strict monthly filtering

**Example:**
```
Filter: September 2026
POS Loan 1: EFF 02/2026, ₱8,215.56 → EXCLUDED
POS Loan 2: EFF 09/2026, ₱2,299.65 → INCLUDED
effectivePos = ₱2,299.65
```

### "Select All (All Deductions)" Mode
- **effectivePos:** ALL POS loans regardless of EFF
- **csbPositive:** ALL POS loans regardless of EFF
- **Effect:** Includes all historical deductions

**Example:**
```
Mode: Select All
POS Loan 1: EFF 02/2026, ₱8,215.56 → INCLUDED
POS Loan 2: EFF 09/2026, ₱2,299.65 → INCLUDED
effectivePos = ₱10,515.21
```

---

## Status Badges Visual Reference

```css
NO BILLING:
  background: rgba(220,53,69,0.22)
  color: #dc3545
  border: 1px solid #dc3545

AS EASE/ONQ:
  background: rgba(139,92,246,0.22)
  color: #8b5cf6
  border: 1px solid #8b5cf6

1ST CSB ONQ:
  background: rgba(13,110,253,0.22)
  color: #3b82f6
  border: 1px solid #3b82f6

EFF/OVERDED:
  background: rgba(245,158,11,0.22)
  color: #f59e0b
  border: 1px solid #f59e0b

EFF/UNDERDED:
  background: rgba(234,179,8,0.22)
  color: #facc15
  border: 1px solid #facc15

EFFECTED:
  background: rgba(40,167,69,0.22)
  color: #28a745
  border: 1px solid #28a745
```

**Badge Size:** 72px × 19px  
**Font Size:** 0.54rem  
**Border Radius:** 4px

---

## Status Sorting

The STATUS column header cycles through these filter options:

```javascript
STATUS_SORT_CYCLE = [
  'All Statuses',
  'NO BILLING',
  'AS EASE / FIRST CSB ONQ',
  'FIRST CSB ONQUEUE',
  'OVERDEDUCTED',
  'UNDERDEDUCTED',
  'EFFECTED'
]
```

Click STATUS header to cycle through filters.

---

## Critical Implementation Notes

1. **Priority is Critical:** Status checks must happen in exact order
2. **Tolerance Matters:** ±₱1.00 tolerance prevents rounding issues
3. **Code 339 Detection:** Only first loan position matters
4. **ONQ Must Exist:** Code 339 in POS doesn't trigger ONQ status without actual ONQ
5. **Month Filter:** "Current Month Only" strictly filters by EFF date
6. **Net Total Display:** Always uses actual POS regardless of status calculation

---

## Testing Scenarios

### Test 1: Basic EFFECTED
- Amort: ₱10,000
- POS: ₱10,000
- ONQ: None
- **Expected: EFFECTED** ✅

### Test 2: Clear UNDERDEDUCTED
- Amort: ₱10,515.21
- POS: ₱2,299.65
- ONQ: None
- **Expected: UNDERDEDUCTED** ✅

### Test 3: Code 339 ONQ High Balance
- First ONQ: Code 0339, ₱7,999.48
- Net Total: ₱13,457.47
- **Expected: FIRST CSB ONQUEUE** ✅

### Test 4: Code 339 ONQ Low Balance
- First ONQ: Code 0339, ₱8,000
- Net Total: ₱3,000
- **Expected: AS EASE / FIRST CSB ONQ** ✅

### Test 5: Second ONQ is 339
- First ONQ: Code 1010
- Second ONQ: Code 0339
- **Expected: NOT "1ST CSB ONQ"** ✅

### Test 6: POS 339, No ONQ
- POS: Code 339, ₱2,299.65
- Amort: ₱10,515.21
- ONQ: None
- **Expected: UNDERDEDUCTED** ✅

---

## Related Functions

| Function | Purpose |
|----------|---------|
| `buildBillingRowData()` | Initial status calculation |
| `updateFirstBillingRowStatus()` | Dynamic status update on checkbox change |
| `isCurrentBillingMonthEff()` | Check if EFF matches current month |
| `isDedModeAll()` | Check if "Select All" mode enabled |

---

## Changelog

**2026-09-30:**
- Added code 339 ONQ detection (first loan only)
- Fixed priority: ONQ 339 checked before effectivePos === 0
- Fixed: POS 339 doesn't trigger ONQ status without actual ONQ
- Fixed: Month filter now properly filters csbPositive
- Fixed: Second ONQ 339 doesn't trigger status (only first matters)

**2026-09-28:**
- Changed priority: Check OVERDED/UNDERDED before ONQ
- Added AS EASE status for ONQ with Net Total < ₱5,000

**2026-07-13:**
- Implemented effectivePos for current month filtering
- Added tolerance logic (±₱1.00)

---

**End of Documentation**
