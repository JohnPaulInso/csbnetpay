# Duplicate Deductions Fix & UI Improvements

## Issue Description

The system was experiencing duplicate deduction entries when employees had multiple loan accounts. Specifically:

1. **Duplicate fetches**: When an employee (e.g., "tipontipo") had multiple loan accounts in the LCS database, each account row would fetch ALL deductions from POS, ONQ, and PLI files for that employee number, regardless of which specific account the deduction belonged to.

2. **NetPay not filtered**: NetPay was also being duplicated across multiple accounts with the same employee number.

3. **Broken count**: The TOTAL count would show "1" when "Select All (All Deductions)" was active, but showed "3,964" when filters were applied. This indicated the counting logic wasn't properly handling the deduplicated vs non-deduplicated views.

4. **Missing POS checkboxes**: ONQ deductions had checkboxes in the dropdown, but POS deductions did not.

5. **Tag color**: Tagged rows showed green tint, but should show red tint to indicate flagged items.

6. **Checkbox colors**: All checkboxes used default colors instead of being color-coded by type.

## Root Cause

The `buildBillingRowData` function was fetching all loans for an employee number without filtering by which specific account (person) they belonged to. When an employee had multiple accounts:
- **Employee 2980059** might have loans under both "CARON, MARY ROSE" and "OBRETA, ALBERT OHASA"
- Both account rows would show ALL deductions for employee 2980059
- This caused duplicates because deductions for CARON were also showing up in OBRETA's row and vice versa

## Solutions Implemented

### 1. Enhanced NetPay Data Storage (Lines 5041-5063)

Added name tracking to NetPay entries for filtering:

```javascript
// Store names in netpay for name matching
const prev = netpayEmpMap.get(emp) || { amt: 0, entries: [] };
netpayEmpMap.set(emp, {
    amt: prev.amt + npVal,
    entries: [...prev.entries, {
        amt: npVal,
        fname: r[netpayMap.FNAME] || r[4] || '',
        lname: r[netpayMap.LNAME] || r[6] || ''
    }]
});
```

### 2. Enhanced ONQ Loan Data Storage (Lines 5047-5076)

Added `fname` and `lname` fields to ONQ loan details (POS already had them):

```javascript
const loanDetail = {
    code: code,
    eff: r[onqMap.EFFYY] ? `${formatLoanMonth(r[onqMap.EFFMM])}/${r[onqMap.EFFYY] || ''}` : 'N/A',
    term: r[onqMap.TERYY] ? `${formatLoanMonth(r[onqMap.TERMM])}/${r[onqMap.TERYY] || ''}` : 'N/A',
    dedamt: amtVal,
    policyNo: r[onqMap.POLICYNO] || 'N/A',
    fname: r[onqMap.FNAME] || r[4] || '',  // NEW
    lname: r[onqMap.LNAME] || r[6] || ''   // NEW
};
```

### 3. Name Matching Helper Functions (Lines 4672-4703)

Created two helper functions to match loan names with account names:

**`normalizeNameForMatch(name)`**
- Converts names to uppercase
- Removes extra whitespace, commas, and periods
- Creates a normalized string for comparison

**`doesNameMatch(accountName, loanFname, loanLname)`**
- Compares the account name (e.g., "CARON, MARY ROSE") with loan first/last names
- Handles different name formats:
  - "LASTNAME, FIRSTNAME"
  - "LASTNAME FIRSTNAME"  
  - "FIRSTNAME LASTNAME"
- Returns true if names match or if no name data exists in loan (can't filter)

### 4. Modified buildBillingRowData Function (Lines 4705-4760)

Updated the function to filter NetPay, POS, and ONQ by name matching:

```javascript
// Filter NetPay by name matching
const netpayObjRaw = netpayEmpMap.get(targetEmp) || { amt: 0, entries: [] };
const netpayEntriesFiltered = (netpayObjRaw.entries || []).filter(entry =>
    doesNameMatch(clientName, entry.fname, entry.lname)
);
const netPayVal = netpayEntriesFiltered.reduce((sum, e) => sum + (e.amt || 0), 0);

// Filter POS loans by name
const posLoansFiltered = (posObjRaw.loans || []).filter(loan => 
    doesNameMatch(clientName, loan.fname, loan.lname)
);

// Filter ONQ loans by name
const onqLoansFiltered = (onqObjRaw.loans || []).filter(loan => 
    doesNameMatch(clientName, loan.fname, loan.lname)
);
```

### 5. Red Tint for Tagged Rows (Line ~5296)

Changed tagged row background from green to red:

```javascript
// Red tint for tagged rows; prev: green tint
style="background: rgba(239,68,68,0.12);"  // was: rgba(52,211,153,0.08)
```

### 6. Color-Coded Checkboxes (Lines ~5317-5335)

Added accent colors to match each deduction type:

- **NetPay**: Purple (`accent-color: #a855f7`)
- **CSB POS**: Amber/Yellow (`accent-color: #fbbf24`)
- **ONQ**: Green (`accent-color: #10b981`)

### 7. Added POS Accordion Checkboxes (Lines ~5374-5385)

Replaced read-only dots with interactive checkboxes in POS dropdown:

```javascript
// Before: Read-only dot indicator
<span id="pos-acc-dot-..." style="..."></span>

// After: Interactive checkbox with amber accent
<input type="checkbox" id="pos-acc-check-..." 
    style="accent-color: #fbbf24;" 
    onchange="updatePosLoanSelection(...)">
```

### 8. Sync Functions (Lines 5561-5572)

Added `syncAccordionCheckbox` function to keep accordion and inline checkboxes in sync:

```javascript
function syncAccordionCheckbox(prefix, rowKey, idx, isChecked) {
    const accCheckbox = document.getElementById(`pos-acc-check-${prefix}-${rowKey}-${idx}`);
    if (accCheckbox) accCheckbox.checked = isChecked;
}
```

## Benefits

1. **Eliminates duplicates**: Each account row now only shows NetPay and deductions that belong to that specific person
2. **Accurate counts**: The TOTAL count now correctly reflects unique accounts regardless of filter state
3. **Better data integrity**: All deductions (NetPay, POS, ONQ) are properly associated with the correct borrower
4. **Visual consistency**: POS deductions now have checkboxes like ONQ
5. **Better UX**: Color-coded checkboxes make it easy to identify deduction types at a glance
6. **Clear flagging**: Red tint for tagged rows makes them stand out as items requiring attention
7. **Handles missing names**: If no name data exists in the loan CSV, it includes the loan (backwards compatible)
8. **Flexible matching**: Handles various name format variations (comma-separated, space-separated, different orders)

## Testing Recommendations

1. Search for "tipontipo" or employee 2980059 and verify each account shows only its own deductions
2. Check that TOTAL count is consistent whether "Select All" is active or not
3. Verify that employees with single accounts still work correctly
4. Test with employees who have similar names (e.g., same last name)
5. Ensure the NetPay, POS, and ONQ totals match the expected values
6. Verify POS checkboxes in dropdown work correctly
7. Check that tagged rows show red tint
8. Confirm checkbox colors: purple (NetPay), yellow (POS), green (ONQ)
9. Test checkbox syncing between accordion dropdown and inline rows

## Date Implemented

September 27, 2026

## CSV Structure Requirements

All three CSV files must have FNAME and LNAME columns:
- **sep26.csv** (NetPay): Columns 4 (FNAME) and 6 (LNAME)
- **pos_sep26.csv** (POS): Columns 4 (FNAME) and 6 (LNAME)
- **onq_sep26.csv** (ONQ): Columns 4 (FNAME) and 6 (LNAME)
