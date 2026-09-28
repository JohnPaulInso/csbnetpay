# POS Dropdown Shows Sub-Rows Instead of Card

## Overview
The POS dropdown button now toggles the visibility of sub-deduction rows directly in the table, instead of showing a separate CSB DEDUCTIONS card. This provides a cleaner, more integrated view of individual POS loan deductions.

## Changes Made (2026-09-28)

### 1. Hidden CSB DEDUCTIONS Card
- The `deductions-row` (containing the CSB DEDUCTIONS and ONQUEUE cards) remains hidden
- Users no longer see the separate card popup when clicking POS dropdown
- Sub-rows provide all the same information inline within the main table

### 2. Sub-Rows Hidden by Default
- All POS sub-deduction rows start with `display: none`
- Provides cleaner initial table view
- Reduces visual clutter for accounts with many deductions

### 3. Updated togglePosDetails() Function
```javascript
function togglePosDetails(empNumStr, prefix = 'norm') {
    const chevron = document.getElementById(`pos-chevron-${prefix}-${empNumStr}`);
    const rowKey = empNumStr;
    
    // Find all sub-rows for this account
    const subRows = document.querySelectorAll(`tr[id^="pos-sub-row-${prefix}-${rowKey}-"]`);
    
    if (subRows.length > 0) {
        const firstRow = subRows[0];
        const isHidden = firstRow.style.display === 'none' || !firstRow.style.display;
        
        // Toggle all sub-rows
        subRows.forEach(row => {
            row.style.display = isHidden ? 'table-row' : 'none';
        });
        
        // Update chevron
        if (chevron) {
            chevron.className = isHidden ? 'bi bi-chevron-up' : 'bi bi-chevron-down';
        }
    }
}
```

## User Experience

### Before
1. Click yellow POS dropdown button
2. CSB DEDUCTIONS card appears in a separate row
3. Card shows deductions in a compact grid format
4. Card overlays the table, separate from main rows

### After
1. Click yellow POS dropdown button
2. Sub-deduction rows expand directly below the main row
3. Each sub-row shows full loan details inline
4. Chevron rotates to indicate open/closed state
5. Sub-rows are part of the main table structure

## Visual Features

### Sub-Row Display
- **Yellow left border**: `border-left: 2px solid rgba(251,191,36,0.25)`
- **Arrow indicator**: `↳` symbol in first column
- **Full loan details**: Code, EFF, TERM, Amount, Policy Number, Status
- **Red tag checkbox**: For marking deletions
- **Yellow checkbox**: For selecting specific loans
- **Status badges**: EFFECTED, OVERDED, UNDERDED with color coding

### Default State
- Chevron down: `bi bi-chevron-down`
- Sub-rows hidden: `display: none`
- Clean compact table view

### Expanded State
- Chevron up: `bi bi-chevron-up`
- Sub-rows visible: `display: table-row`
- Shows all individual POS loans for that account

## Technical Details

### Sub-Row ID Pattern
```html
<tr id="pos-sub-row-${prefix}-${rowKey}-${loanIndex}">
```

### querySelector Usage
```javascript
const subRows = document.querySelectorAll(`tr[id^="pos-sub-row-${prefix}-${rowKey}-"]`);
```
This finds ALL sub-rows for a given account, regardless of how many loans exist.

### Chevron Toggle
```javascript
chevron.className = isHidden ? 'bi bi-chevron-up' : 'bi bi-chevron-down';
```

## Benefits

1. **Seamless Integration**: Sub-rows are part of the main table flow
2. **Better Context**: See main row and sub-rows together without scrolling
3. **Consistent Layout**: All data uses the same table column structure
4. **Less Clicking**: No need to close card before viewing next account
5. **Better Performance**: No card rendering/positioning calculations
6. **Mobile Friendly**: Table structure adapts better than floating cards

## Related Features

- **Red Deletion Tags**: Sub-rows can be tagged for deletion (checkbox-red-tag)
- **Yellow Selection**: Individual loans can be checked/unchecked
- **localStorage Persistence**: Sub-row tag states and checkbox states persist
- **Accordion Sync**: Inline checkboxes sync with accordion view (if needed)
- **Current Month Only Mode**: Respects billing month filtering

## ONQ Behavior
- ONQ dropdown button still uses the card view (no sub-rows for ONQ)
- ONQ accordion remains unchanged
- Future enhancement: Could add sub-rows for ONQ similar to POS

## Date Implemented
- **2026-09-28**: Refactored POS dropdown to show sub-rows instead of CSB DEDUCTIONS card
