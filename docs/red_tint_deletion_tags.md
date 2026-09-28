# Red-Tinted Deletion Tags for Sub-Deduction Rows

## Overview
Sub-deduction rows in the POS dropdown can be tagged with RED checkboxes to mark them for deletion. These items display with a red-tinted background to visually indicate they are flagged for removal.

## Feature Details

### Visual Indicators
- **RED Checkbox**: Custom-styled red checkbox (`.checkbox-red-tag`) with:
  - Red border: `#ef4444`
  - Red background when checked
  - Red glow effect on hover and checked state
  - White checkmark icon when checked
  
- **RED Tint Background**: When checkbox is checked, the entire sub-row gets a red tint:
  - Background color: `rgba(239, 68, 68, 0.12)` (12% opacity red)
  - Reverts to yellow tint `rgba(251, 191, 36, 0.04)` when unchecked

### Storage
- **localStorage key**: `billing_sub_tags`
- **Storage format**: JSON object with keys like `norm-{rowKey}-sub-{loanIndex}`
- **Example**: `{"norm-12345-sub-0": true, "norm-12345-sub-1": true}`

### Implementation

#### CSS Styling
```css
input[type="checkbox"].checkbox-red-tag {
    appearance: none;
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border: 2px solid rgba(239, 68, 68, 0.4);
    border-radius: 4px;
    background: rgba(10, 14, 23, 0.5);
    /* ... hover and checked states */
}
```

#### JavaScript Function
```javascript
function toggleSubRowTag(prefix, rowKey, lIdx, isChecked) {
    const tags = JSON.parse(localStorage.getItem('billing_sub_tags') || '{}');
    const key = `${prefix}-${rowKey}-sub-${lIdx}`;
    
    if (isChecked) {
        tags[key] = true;
    } else {
        delete tags[key];
    }
    
    localStorage.setItem('billing_sub_tags', JSON.stringify(tags));
    
    // Apply red tint to row
    const row = document.getElementById(`pos-sub-row-${prefix}-${rowKey}-${lIdx}`);
    if (row) {
        row.style.background = isChecked ? 
            'rgba(239,68,68,0.12)' :  // RED tint for deletion
            'rgba(251,191,36,0.04)';   // Default yellow tint
    }
}
```

## Contrast with Main Row Tags

### Main Row Tags (GREEN)
- Purpose: General flagging/marking for attention
- Checkbox: Green with green tint background
- Storage: `billing_tags`
- Background: `rgba(52, 211, 153, 0.08)` (green)

### Sub-Row Tags (RED)
- Purpose: Mark specific deductions for deletion
- Checkbox: Red with red tint background
- Storage: `billing_sub_tags`
- Background: `rgba(239, 68, 68, 0.12)` (red)

## User Workflow

1. **Open Dropdown**: Click the yellow chevron button next to CSB POS amount
2. **View Sub-Deductions**: See all individual POS loans for that account
3. **Tag for Deletion**: Check the red checkbox in the "Tag" column for any loans to delete
4. **Visual Confirmation**: Row immediately shows red tint background
5. **Persistent State**: Tags remain checked across page reloads
6. **Batch Processing**: All red-tinted items can be identified for deletion workflow

## Technical Notes

- Sub-row tags are INDEPENDENT from main row tags (separate storage keys)
- Only POS sub-deductions have deletion tags currently
- ONQ deductions do not have sub-row deletion tags in this implementation
- The red tint is immediately visible and persists in localStorage
- Checkbox state loads from localStorage on table render

## Date Added
- **2026-09-27**: Initial implementation of red deletion tags
- **2026-09-28**: Enhanced with custom `.checkbox-red-tag` styling for browser consistency
