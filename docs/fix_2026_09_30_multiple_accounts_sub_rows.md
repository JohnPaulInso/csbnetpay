# Fix: Multiple LCS Accounts Per Employee - Sub-Row Display

**Date**: 2026-09-30  
**Issue**: Employees with 2+ loan accounts shown as separate rows instead of grouped with expandable sub-rows  
**Status**: ✅ FIXED

---

## Problem Description

When a single employee (same ID) had multiple loan accounts with different:
- Monthly amortizations
- Release dates  
- Maturity dates

The system created **separate table rows** for each account, treating them as distinct employees. This made it difficult to:
- See that accounts belonged to the same person
- Track total deductions for one employee
- Compare different loans side-by-side

### Example Before Fix:
```
Row 1: ID 6114199 | Amort: ₱4,338.47 | Release: 08/29/2026
Row 2: ID 6114199 | Amort: ₱4,007.89 | Release: 07/01/2026
Row 3: ID 6114199 | Amort: ₱4,336.47 | Release: 09/15/2026
```
**Problem**: Same person appears 3 times, totals are unclear

---

## Solution Implemented

### New Behavior: Grouped Main Row + Expandable Sub-Rows

Employees with multiple accounts now show:
1. **Main row** - Combined totals from all accounts
2. **Chevron button** (▼) in Monthly Amort column
3. **Sub-rows** (hidden by default) showing individual account details

### Example After Fix:
```
Main: ID 6114199 | Amort: ₱12,682.83 ▼ | Release: 08/29/2026 [combined]
  ↳ ACCT 2 | Amort: ₱4,007.89 | Release: 07/01/2026
  ↳ ACCT 3 | Amort: ₱4,336.47 | Release: 09/15/2026
```
**Solution**: One main row, click chevron to expand details

---

## Technical Implementation

### 1. Modified Billing Row Generation ✅

**File**: index6.html  
**Function**: `renderFirstBillingBranchTable()`  
**Lines**: ~5494-5540

#### Before (Creates Separate Rows):
```javascript
autoMatches.forEach((acc, accIdx) => {
    const rowKey = autoMatches.length > 1 ? `${empNumStr}-${accIdx}` : empNumStr;
    const rData = buildBillingRowData(empNumStr, acc, ...);
    rowsToRenderAuto.push(rData);
});
```

**Problem**: Each account became a separate billing row with unique `rowKey` like "6114199-0", "6114199-1", etc.

#### After (Groups Under One Row):
```javascript
if (autoMatches.length > 0) {
    const primaryAcc = autoMatches[0];
    const rowKey = empNumStr;
    const rData = buildBillingRowData(empNumStr, primaryAcc, ...);
    
    // (2026-09-30) Store all LCS accounts for this employee; prev: single account
    if (autoMatches.length > 1) {
        rData.lcsAccounts = autoMatches;
        rData.hasMultipleAccounts = true;
        // Calculate combined monthly amort from all accounts
        rData.monthlyAmort = autoMatches.reduce((sum, acc) => sum + (acc.amortization || 0), 0);
    }
    
    rowsToRenderAuto.push(rData);
}
```

**Solution**:
- Uses first account as primary (row display data)
- Stores all accounts in `rData.lcsAccounts` array
- Sets `rData.hasMultipleAccounts = true` flag
- **Calculates combined amort**: Sum of all account amortizations

---

### 2. Added Chevron Button in Main Row ✅

**File**: index6.html  
**Function**: `generateBranchRowHtml()`  
**Column**: Monthly Amort

#### Code Added:
```javascript
<td data-label="Monthly Amort" ...>
    <div style="display: flex; align-items: center; gap: 2px;">
        <span style="color: #dc3545;">${formatPHP(r.monthlyAmort)}</span>
        ${r.hasMultipleAccounts ? `
            <button onclick="toggleLcsAccountDetails('${rowKey}', '${prefix}')" style="...">
                <i id="lcs-chevron-${prefix}-${rowKey}" class="bi bi-chevron-down"></i>
            </button>
        ` : ''}
    </div>
</td>
```

**Visual**: 
- Shows combined amort (e.g., ₱12,682.83)
- Red chevron (▼) appears if multiple accounts exist
- Click to expand/collapse sub-rows

---

### 3. Generated Sub-Rows for Additional Accounts ✅

**File**: index6.html  
**Function**: `generateBranchRowHtml()`  
**Location**: End of function, after PLI sub-rows

#### Code Added:
```javascript
${r.hasMultipleAccounts && r.lcsAccounts ? r.lcsAccounts.slice(1).map((acc, accIdx) => {
    const realIdx = accIdx + 1;
    const termFmt = formatLoanDate(acc.maturityDate);
    const releaseFmt = formatLoanDate(acc.transactionDate);
    return `
    <tr id="lcs-sub-row-${prefix}-${rowKey}-${realIdx}" style="display: none; background: rgba(220,53,69,0.04); border-left: 2px solid rgba(220,53,69,0.25);">
        <td style="padding-left: 10px;">
            <span style="color: rgba(220,53,69,0.5);">↳</span>
        </td>
        <td>
            <span class="badge" style="background: rgba(220,53,69,0.18); color: #dc3545;">ACCT ${realIdx + 1}</span>
        </td>
        <td colspan="3">&nbsp;</td>
        <td><i class="bi bi-bank"></i>${acc.schemeCode || 'N/A'}</td>
        <td><span style="color: #dc3545;">${formatPHP(acc.amortization || 0)}</span></td>
        <td colspan="6">&nbsp;</td>
        <td>${releaseFmt}</td>
        <td>${termFmt}</td>
        <td>&nbsp;</td>
    </tr>`;
}).join('') : ''}
```

**Features**:
- Starts from `slice(1)` (accounts 2, 3, 4, etc.)
- Shows ACCT 2, ACCT 3 badges (red)
- Displays individual amortization amounts
- Shows individual release and maturity dates
- Hidden by default (`display: none`)
- Red left border for visual grouping

---

### 4. Created Toggle Function ✅

**File**: index6.html  
**Function**: `toggleLcsAccountDetails(empNumStr, prefix)`  
**Lines**: ~5985-6005

#### Implementation:
```javascript
function toggleLcsAccountDetails(empNumStr, prefix = 'norm') {
    const chevron = document.getElementById(`lcs-chevron-${prefix}-${empNumStr}`);
    const rowKey = empNumStr;
    
    // Find all LCS account sub-rows for this employee
    const subRows = document.querySelectorAll(`tr[id^="lcs-sub-row-${prefix}-${rowKey}-"]`);
    
    if (subRows.length > 0) {
        const firstRow = subRows[0];
        const isHidden = firstRow.style.display === 'none';
        
        // Toggle all sub-rows
        subRows.forEach(row => {
            row.style.display = isHidden ? 'table-row' : 'none';
        });
        
        // Rotate chevron
        if (chevron) {
            chevron.className = isHidden ? 'bi bi-chevron-up' : 'bi bi-chevron-down';
        }
    }
}
```

**Behavior**:
- Finds all sub-rows by prefix pattern
- Toggles between `display: none` and `display: table-row`
- Rotates chevron icon (▼ ↔ ▲)

---

## Visual Design

### Color Scheme
- **Badge**: Red (`#dc3545`) - distinguishes from POS (yellow), ONQ (green), PLI (pink)
- **Background**: Subtle red tint (`rgba(220,53,69,0.04)`)
- **Border**: Left red border (`rgba(220,53,69,0.25)`) for visual grouping
- **Arrow**: Red arrow prefix (`↳`) aligns with POS/ONQ/PLI patterns

### Table Layout
```
┌──────────────────────────────────────────────────────────────────┐
│ # │ ID      │ DIV │ STA │ NAME        │ AMORT ▼    │ ... │ TAG │
├──────────────────────────────────────────────────────────────────┤
│ 1 │ 6114199 │ 017 │ 648 │ MATA, EUGENE│₱12,682.83 ▼│ ... │ ☐  │ ← Main Row
├──────────────────────────────────────────────────────────────────┤
│   │ ↳ ACCT 2│     │     │ 🏦 RPSU-02  │₱4,007.89   │ ... │    │ ← Sub-Row 1
│   │ ↳ ACCT 3│     │     │ 🏦 AUTO-04  │₱4,336.47   │ ... │    │ ← Sub-Row 2
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Structure Changes

### Row Data Object
```javascript
{
    empNumStr: "6114199",
    clientName: "MATA, EUGENE GERARD",
    monthlyAmort: 12682.83,        // ← COMBINED from all accounts
    hasMultipleAccounts: true,     // ← NEW FLAG
    lcsAccounts: [                 // ← NEW ARRAY
        {
            amortization: 4338.47,
            transactionDate: "08/29/2026",
            maturityDate: "08/28/2033",
            schemeCode: "RPSU-01"
        },
        {
            amortization: 4007.89,
            transactionDate: "07/01/2026",
            maturityDate: "01/28/2033",
            schemeCode: "RPSU-02"
        },
        {
            amortization: 4336.47,
            transactionDate: "09/15/2026",
            maturityDate: "04/29/2033",
            schemeCode: "AUTO-04"
        }
    ],
    transDate: "08/29/2026",       // ← Primary account date
    maturityDate: "08/28/2033",    // ← Primary account date
    // ... other fields
}
```

---

## Use Cases

### Scenario 1: Single Account Employee
- **Data**: 1 loan account
- **Display**: Normal row, no chevron
- **Behavior**: Works exactly as before

### Scenario 2: Dual Account Employee
- **Data**: 2 loan accounts
- **Display**: Main row shows combined amort, chevron appears
- **Click chevron**: Reveals 1 sub-row (ACCT 2)
- **Main row shows**: First account details + combined total

### Scenario 3: Triple Account Employee  
- **Data**: 3 loan accounts
- **Display**: Main row with chevron
- **Click chevron**: Reveals 2 sub-rows (ACCT 2, ACCT 3)
- **Amortization**: ₱4,338.47 + ₱4,007.89 + ₱4,336.47 = ₱12,682.83

---

## Filtering & Sorting Behavior

### Status Calculation
- **Uses combined amortization** for EFFECTED/OVERDEDUCTED/UNDERDEDUCTED status
- Main row status reflects **total monthly obligation**
- Example: If combined amort ₱12,682.83 vs POS ₱13,000 = EFFECTED

### Sorting
- **Sorts by combined amortization** when sorting "Amort" column
- Employee with 3 accounts totaling ₱12,682 sorts higher than single ₱10,000 account
- Sub-rows stay attached to parent (don't sort separately)

### Filtering
- **Month filter** applies to primary account's release date
- If primary account matches selected month, row appears (with all sub-accounts)
- Sub-accounts with different release dates still show when expanded

---

## Benefits

### For Users ✅
1. **Clearer data** - One person = one row
2. **Combined totals** - See total obligation at a glance
3. **Detailed breakdown** - Expand to see individual accounts
4. **Consistent UX** - Matches POS/ONQ/PLI expandable pattern
5. **Reduced clutter** - Table shows fewer rows by default

### For System ✅
1. **Accurate counts** - Dashboard metrics count employees, not accounts
2. **Preserved detail** - All account data still accessible
3. **Flexible display** - Collapse for overview, expand for details
4. **Scalable** - Handles 2, 3, 4+ accounts per employee

---

## Edge Cases Handled

### Case 1: Employee with 1 account
- ✅ No chevron shown
- ✅ Works exactly as before
- ✅ No sub-rows generated

### Case 2: All accounts filtered out except one
- ✅ Shows as single account (no chevron)
- ✅ Doesn't break if `lcsAccounts` array changes

### Case 3: Accounts with missing data
- ✅ Shows "N/A" for missing scheme codes
- ✅ Handles null/undefined amortization (shows ₱0.00)
- ✅ Formats dates gracefully (formatLoanDate handles invalid dates)

---

## Testing Checklist

### Display Tests
- [x] Employee with 1 account shows normally (no chevron)
- [x] Employee with 2 accounts shows chevron
- [x] Employee with 3+ accounts shows chevron
- [x] Combined amortization displays correctly in main row
- [x] Sub-rows hidden by default
- [x] Red visual styling applied (badge, border, arrow)

### Interaction Tests
- [x] Click chevron → sub-rows appear
- [x] Click chevron again → sub-rows hide
- [x] Chevron rotates (▼ → ▲ → ▼)
- [x] Sub-rows show correct account details
- [x] ACCT 2, ACCT 3, ACCT 4 badges numbered correctly

### Calculation Tests
- [x] Combined amort = sum of all individual amorts
- [x] Status calculation uses combined amort
- [x] Sorting by Amort column uses combined amount
- [x] Dashboard metrics count 1 employee (not 3 rows)

### Edge Case Tests
- [x] Mixed auto/normal accounts handled correctly
- [x] Filtering by month works with primary account date
- [x] Search finds employee by any account detail
- [x] Status filter works with combined calculations

---

## Future Enhancements

### Potential Additions
1. **Account type icons** - Different icons for RPSU vs AUTO accounts
2. **Sub-row totals** - Show subtotal for expanded accounts
3. **Highlight differences** - Color-code accounts with varying terms
4. **Quick-compare mode** - Side-by-side account comparison view
5. **Account nicknames** - Let users label "Primary", "Secondary", etc.

---

## Related Functions

| Function | Purpose | Changes |
|----------|---------|---------|
| `renderFirstBillingBranchTable()` | Build billing rows | Groups accounts, calculates combined amort |
| `buildBillingRowData()` | Create row data object | Receives primary account only |
| `generateBranchRowHtml()` | Generate HTML | Adds chevron, sub-rows, toggle call |
| `toggleLcsAccountDetails()` | Show/hide sub-rows | NEW - Handles expand/collapse |
| `applyBillingFilters()` | Filter table | Works with grouped rows |
| `sortBillingTable()` | Sort columns | Uses combined amort for sorting |

---

## Change Log

| Date | Version | Change | Author |
|------|---------|--------|--------|
| 2026-09-30 | 1.0 | Implemented grouped accounts with sub-rows | Kiro |
| 2026-09-30 | 1.0 | Added toggle function and chevron UI | Kiro |
| 2026-09-30 | 1.0 | Calculated combined monthly amortization | Kiro |

---

*This fix improves data clarity by grouping multiple loan accounts per employee while preserving full account detail visibility through expandable sub-rows.*
