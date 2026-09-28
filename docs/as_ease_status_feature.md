# AS EASE / FIRST CSB ONQ Status Feature

## Overview
When an account has ONQUEUE deductions (FIRST CSB ONQ status) BUT the net total is below ₱5,000, the system automatically changes the status to "AS EASE / FIRST CSB ONQ" and **disables the red deletion tag checkboxes** for sub-deduction rows.

## Date Implemented
**2026-09-28**

## Business Logic

### Status Determination
```javascript
if (effectiveOnq > 0) {
    // Calculate: Net Total = NetPay + CSB POS - ONQUEUE
    const netTotal = netPayVal + effectivePos - effectiveOnq;
    
    if (netTotal < 5000) {
        statusMode = 'AS EASE / FIRST CSB ONQ';  // Special status
    } else {
        statusMode = 'FIRST CSB ONQUEUE';        // Regular ONQ status
    }
}
```

### Threshold
- **₱5,000** is the threshold
- Below ₱5,000 → AS EASE status (protected from deletion tagging)
- ₱5,000 and above → Regular FIRST CSB ONQ status (can tag for deletion)

## Visual Indicators

### Status Badge
- **Color**: Purple/violet (`#8b5cf6`)
- **Background**: `rgba(139,92,246,0.22)` (purple tint)
- **Text**: "AS EASE / ONQ" (shorter to fit badge)
- **Border**: 1px solid purple

### Badge Comparison
| Status | Color | Background | Text |
|--------|-------|------------|------|
| AS EASE / FIRST CSB ONQ | Purple #8b5cf6 | rgba(139,92,246,0.22) | AS EASE / ONQ |
| FIRST CSB ONQUEUE | Blue #3b82f6 | rgba(13,110,253,0.22) | FIRST CSB ONQ |

## Sub-Row Tag Protection

### Disabled Checkboxes
When status is "AS EASE / FIRST CSB ONQ":
- Red tag checkboxes are **disabled**
- Visual: `opacity: 0.3; cursor: not-allowed;`
- Tooltip: "Cannot tag AS EASE items for deletion"
- User cannot check or uncheck the deletion tags

### Enabled Checkboxes
When status is regular "FIRST CSB ONQUEUE" (net total ≥ ₱5,000):
- Red tag checkboxes are **enabled**
- Normal styling and interaction
- Tooltip: "Tag sub-deduction for deletion"

## Implementation Details

### Status Calculation (buildBillingRowData)
```javascript
// Calculate net total for AS EASE check
const netTotal = netPayVal + effectivePos - effectiveOnq;

if (effectivePos === 0) {
    statusMode = 'NO BILLING';
} else if (effectiveOnq > 0) {
    // Check net total threshold
    if (netTotal < 5000) {
        statusMode = 'AS EASE / FIRST CSB ONQ';
    } else {
        statusMode = 'FIRST CSB ONQUEUE';
    }
} else if (effectivePos > (monthlyAmort + 1.0)) {
    statusMode = 'OVERDEDUCTED';
} else if (effectivePos < (monthlyAmort - 1.0)) {
    statusMode = 'UNDERDEDUCTED';
} else {
    statusMode = 'EFFECTED';
}
```

### Live Status Update (updateFirstBillingRowStatus)
```javascript
// Recalculate when checkboxes are toggled
const formulaVal = effNetPay + effPos - effOnq;

let newStatus = 'NO BILLING';
if (effPos === 0) {
    newStatus = 'NO BILLING';
} else if (effOnq > 0) {
    // Dynamic check based on current values
    if (formulaVal < 5000) {
        newStatus = 'AS EASE / FIRST CSB ONQ';
    } else {
        newStatus = 'FIRST CSB ONQUEUE';
    }
}
```

### Sub-Row Checkbox Rendering
```javascript
<input type="checkbox" id="tag-sub-row-${prefix}-${rowKey}-${lIdx}"
    class="checkbox-red-tag"
    ${isSubTagged ? 'checked' : ''}
    ${statusMode === 'AS EASE / FIRST CSB ONQ' ? 'disabled' : ''}
    onchange="toggleSubRowTag('${prefix}', '${rowKey}', ${lIdx}, this.checked)"
    style="${statusMode === 'AS EASE / FIRST CSB ONQ' ? 'opacity: 0.3; cursor: not-allowed;' : ''}"
    title="${statusMode === 'AS EASE / FIRST CSB ONQ' ? 'Cannot tag AS EASE items for deletion' : 'Tag sub-deduction for deletion'}">
```

## Dashboard Integration

### Status Counting
```javascript
function updateDashboardMetrics(rows) {
    let countAsEase = 0;
    let countFirstCsbOnq = 0;
    
    rows.forEach(r => {
        if (r.statusMode === 'AS EASE / FIRST CSB ONQ') countAsEase++;
        else if (r.statusMode === 'FIRST CSB ONQUEUE') countFirstCsbOnq++;
    });
    
    // Combined count for FIRST CSB ONQ dashboard display
    const totalOnq = countFirstCsbOnq + countAsEase;
    document.getElementById('dashCountFirstCsbOnq').textContent = totalOnq.toLocaleString();
}
```

### Sorting
- AS EASE and FIRST CSB ONQ share the same ranking (4)
- Both appear together when sorting by status
- Sort order: EFFECTED (1) → OVERDED (2) → UNDERDED (3) → ONQ/AS EASE (4) → NO BILLING (5)

### Search/Filter
Searchable terms for AS EASE status:
- "as ease"
- "ease"
- "onq"
- Full status name matches

## User Experience Flow

### Scenario 1: Net Total Below ₱5,000
1. Account has ONQUEUE deductions
2. System calculates: Net Total = ₱4,015.97 (< ₱5,000)
3. Status badge shows: **"AS EASE / ONQ"** in purple
4. User clicks POS dropdown to see sub-rows
5. Red deletion tag checkboxes are **grayed out and disabled**
6. Tooltip explains: "Cannot tag AS EASE items for deletion"
7. User cannot mark these items for deletion

### Scenario 2: Net Total Meets Threshold
1. Account has ONQUEUE deductions
2. System calculates: Net Total = ₱5,200.00 (≥ ₱5,000)
3. Status badge shows: **"FIRST CSB ONQ"** in blue
4. User clicks POS dropdown to see sub-rows
5. Red deletion tag checkboxes are **enabled and interactive**
6. User CAN mark specific sub-deductions for deletion

### Scenario 3: Dynamic Change
1. Account starts with Net Total = ₱4,800 → AS EASE status
2. User unchecks ONQUEUE checkbox
3. Net Total recalculates = ₱6,300 → Status changes to FIRST CSB ONQ
4. Red checkboxes become enabled
5. User re-checks ONQUEUE checkbox
6. Net Total drops to ₱4,800 → Status reverts to AS EASE
7. Red checkboxes become disabled again

## Protection Purpose

### Why Disable Deletion Tags?
- **AS EASE** indicates accounts with low net totals that should be handled carefully
- These accounts may be at risk or require special attention
- Preventing deletion tagging ensures they're not accidentally marked for removal
- Forces manual review before any deletion actions

### Business Rules
- Below ₱5,000 net total = Protected status
- Cannot bulk-delete AS EASE items
- Must be manually reviewed and processed differently
- Protects vulnerable accounts from accidental deletion

## Related Features

- **Red Deletion Tags**: Sub-row checkboxes for marking items for deletion
- **Net Total Calculation**: NetPay + CSB POS - ONQUEUE
- **Dynamic Status Updates**: Real-time recalculation when checkboxes toggle
- **Status-Based Sorting**: Group AS EASE and regular ONQ together
- **Dashboard Metrics**: Combined count display

## Technical Notes

- Status comparison is case-sensitive in the code
- Both AS EASE and regular ONQ use rank 4 in sorting
- Dashboard combines both counts under "FIRST CSB ONQ" label
- Checkbox disabled state uses HTML `disabled` attribute + CSS styling
- Status transitions happen instantly on checkbox toggle

## Files Modified
- `index6.html`: Main implementation file
  - Status calculation logic
  - Badge rendering
  - Checkbox disabling logic
  - Dashboard counting
  - Sorting and filtering

## Testing Checklist
- [ ] AS EASE badge displays correctly when net total < ₱5,000
- [ ] Regular ONQ badge displays when net total ≥ ₱5,000
- [ ] Red checkboxes are disabled for AS EASE rows
- [ ] Red checkboxes are enabled for regular ONQ rows
- [ ] Status changes dynamically when toggling ONQUEUE checkbox
- [ ] Dashboard count includes both AS EASE and ONQ
- [ ] Sorting groups AS EASE and ONQ together
- [ ] Search finds AS EASE rows with "ease" or "onq" keywords
- [ ] Tooltip shows correct message based on disabled state
