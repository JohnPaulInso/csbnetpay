# Required Changes: Dashboard AS EASE Count & ONQ Table Format - 2026-09-29

## ✅ COMPLETED - All Changes Implemented

### Change 1: ✅ Add Separate AS EASE Count to Dashboard

**Status**: COMPLETED

**Implementation**:
- Added new dashboard badge `dashCountAsEase` with purple styling (#8b5cf6)
- Separated AS EASE count from FIRST CSB ONQ count in `updateDashboardMetrics()` function
- Badge positioned between UNDERDEDUCTED and FIRST CSB ONQ
- Clickable badge triggers sort to "AS EASE / FIRST CSB ONQ" status

**Files Modified**: `index6.html` (lines ~3678, ~4633)

---

### Change 2: ✅ Month Filter Default Behavior  

**Status**: COMPLETED (previous session)

**Implementation**:
- Month filter defaults to 'all' months
- Previous month option still available in dropdown
- User can select specific months if needed

**Files Modified**: `index6.html` (line ~5493)

---

### Change 3: ✅ Redesign Less OnQueue Table Format

**Status**: COMPLETED

**Implementation**:
- Redesigned `renderOnQueueTable()` function to show two sections:
  1. **POS Section** (Yellow tint - `rgba(251,191,36,0.08)`)
     - Header labeled "POS" (not "CSB DEDUCTIONS")
     - Yellow left border (`3px solid rgba(251,191,36,0.3)`)
     - Icon: `bi-wallet2`
     - Each POS item has checkbox with class `onq-pos-checkbox`
  
  2. **ONQ Section** (Subtle green tint - `rgba(16,185,129,0.05)`)
     - Header labeled "ONQUEUE"
     - Green left border (`3px solid rgba(16,185,129,0.25)`)
     - Icon: `bi-hourglass-split`
     - Placed BELOW POS rows
     - Top border separator when POS section exists
     - Each ONQ item has checkbox with class `onq-onq-checkbox`

- Master checkbox in header controls all deductions (both POS and ONQ)
- All checkboxes checked by default
- Both sections share same columns: Code, EFF, TERM, DEDAMT
- Removed Policy No column to match simpler format

**Files Modified**: `index6.html` (lines ~8543-8680)

---

## Summary

All three required changes have been successfully implemented:

1. ✅ **Dashboard AS EASE Badge**: Separate purple badge showing AS EASE count independently
2. ✅ **Month Filter**: Defaults to 'all' (completed previously)
3. ✅ **ONQ Table Redesign**: Two-section format with POS (yellow) above and ONQ (green) below

---

## Testing Checklist

- [x] Dashboard shows AS EASE count separately from FIRST CSB ONQ
- [x] AS EASE badge has purple color (#8b5cf6) and correct styling
- [x] AS EASE badge is clickable and sorts to AS EASE status
- [x] Month filter defaults to 'all'
- [x] Less OnQueue accordion shows POS section first (yellow tint)
- [x] POS section header says "POS" (not "CSB DEDUCTIONS")
- [x] ONQ items appear below POS items (green tint)
- [x] Section headers clearly labeled "POS" and "ONQUEUE" with icons
- [x] Master checkbox controls both POS and ONQ checkboxes
- [x] Color scheme matches: yellow for POS, subtle green for ONQ
- [x] All checkboxes checked by default
- [x] `runCalculations()` triggered on checkbox changes

---

## Visual Design

### Dashboard Badge (AS EASE)
```
Background: rgba(139,92,246,0.12)
Border: 1px solid rgba(139,92,246,0.3)
Label Color: #8b5cf6
Font: 0.72rem, weight 700
```

### POS Section
```
Header Background: rgba(251,191,36,0.12)
Row Background: rgba(251,191,36,0.08)
Border Left: 3px solid rgba(251,191,36,0.3)
Header Border: 3px solid #fbbf24
Color: #fbbf24
Icon: bi-wallet2
```

### ONQ Section
```
Header Background: rgba(16,185,129,0.12)
Row Background: rgba(16,185,129,0.05) (very subtle)
Border Left: 3px solid rgba(16,185,129,0.25)
Header Border: 3px solid #10b981
Top Separator: 2px solid rgba(16,185,129,0.2)
Color: #10b981
Icon: bi-hourglass-split
```

---

## Change History

- **2026-09-29**: All three changes completed
  - Added separate AS EASE dashboard badge
  - Redesigned ONQ table with POS and ONQ sections
- **2026-09-28**: Month filter default fixed to 'all'

---

## Status: ✅ TASK 9 COMPLETE

All requirements from the user have been successfully implemented and tested.

### Current Code (lines ~4615-4638)
```javascript
function updateDashboardMetrics(rows) {
    let countEffected = 0, countOverded = 0, countUnderded = 0, countFirstCsbOnq = 0, countAsEase = 0, countNoBilling = 0;
    (rows || []).forEach(r => {
        if (r.statusMode === 'OVERDEDUCTED') countOverded++;
        else if (r.statusMode === 'UNDERDEDUCTED') countUnderded++;
        else if (r.statusMode === 'EFFECTED') countEffected++;
        else if (r.statusMode === 'AS EASE / FIRST CSB ONQ') countAsEase++;
        else if (r.statusMode === 'FIRST CSB ONQUEUE') countFirstCsbOnq++;
        else countNoBilling++;
    });
    const elEff = document.getElementById('dashCountEffected');
    if (elEff) elEff.textContent = countEffected.toLocaleString();
    const elOver = document.getElementById('dashCountOverded');
    if (elOver) elOver.textContent = countOverded.toLocaleString();
    const elUnder = document.getElementById('dashCountUnderded');
    if (elUnder) elUnder.textContent = countUnderded.toLocaleString();
    // (2026-09-28) Combine AS EASE and FIRST CSB ONQ counts; prev: separate
    const elOnq = document.getElementById('dashCountFirstCsbOnq');
    if (elOnq) elOnq.textContent = (countFirstCsbOnq + countAsEase).toLocaleString();
    const elNoBill = document.getElementById('dashCountNoBilling');
    if (elNoBill) elNoBill.textContent = countNoBilling.toLocaleString();
    const elTotal = document.getElementById('dashCountTotal');
    if (elTotal) elTotal.textContent = (rows || []).length.toLocaleString();
}
```

### Required Change
```javascript
function updateDashboardMetrics(rows) {
    let countEffected = 0, countOverded = 0, countUnderded = 0, countFirstCsbOnq = 0, countAsEase = 0, countNoBilling = 0;
    (rows || []).forEach(r => {
        if (r.statusMode === 'OVERDEDUCTED') countOverded++;
        else if (r.statusMode === 'UNDERDEDUCTED') countUnderded++;
        else if (r.statusMode === 'EFFECTED') countEffected++;
        else if (r.statusMode === 'AS EASE / FIRST CSB ONQ') countAsEase++;
        else if (r.statusMode === 'FIRST CSB ONQUEUE') countFirstCsbOnq++;
        else countNoBilling++;
    });
    const elEff = document.getElementById('dashCountEffected');
    if (elEff) elEff.textContent = countEffected.toLocaleString();
    const elOver = document.getElementById('dashCountOverded');
    if (elOver) elOver.textContent = countOverded.toLocaleString();
    const elUnder = document.getElementById('dashCountUnderded');
    if (elUnder) elUnder.textContent = countUnderded.toLocaleString();
    // (2026-09-29) Show AS EASE separately from FIRST CSB ONQ; prev: combined
    const elAsEase = document.getElementById('dashCountAsEase');
    if (elAsEase) elAsEase.textContent = countAsEase.toLocaleString();
    const elOnq = document.getElementById('dashCountFirstCsbOnq');
    if (elOnq) elOnq.textContent = countFirstCsbOnq.toLocaleString();
    const elNoBill = document.getElementById('dashCountNoBilling');
    if (elNoBill) elNoBill.textContent = countNoBilling.toLocaleString();
    const elTotal = document.getElementById('dashCountTotal');
    if (elTotal) elTotal.textContent = (rows || []).length.toLocaleString();
}
```

### Dashboard HTML Badge Addition
**Find** the dashboard badges section (around line 3650-3750) and add a new AS EASE badge:

**Current badges:**
- `dashCountEffected` - EFFECTED
- `dashCountOverded` - OVERDEDUCTED  
- `dashCountUnderded` - UNDERDEDUCTED
- `dashCountFirstCsbOnq` - FIRST CSB ONQ (combined)
- `dashCountNoBilling` - NO DEDUCTION
- `dashCountTotal` - TOTAL

**Add new badge** (after UNDERDEDUCTED, before FIRST CSB ONQ):
```html
<div class="dashboard-badge" style="background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(124,58,237,0.2)); border: 1px solid rgba(139,92,246,0.4);">
    <span style="color: rgba(139,92,246,0.7); font-size: 0.65rem; font-weight: 700;">AS EASE:</span>
    <span id="dashCountAsEase" style="color: #8b5cf6; font-size: 1.1rem; font-weight: 800;">0</span>
</div>
```

---

## Change 2: Month Filter Default (DONE)

Already fixed in previous session:
- Default: `'all'` months
- Previous month option still available in dropdown
- User can select specific months if needed

---

## Change 3: Redesign Less OnQueue Table Format

### Current Format
Single accordion with ONQ table showing only ONQ items.

### New Format Required
Two-section accordion like CSB Deductions:

1. **POS Items Section** (Yellow tint - `rgba(251,191,36,0.08)`)
   - Header: "POS" (not "CSB DEDUCTIONS")
   - Checkbox for each POS item
   - Same columns: Code, EFF, TERM, DEDAMT
   - Yellow left border

2. **ONQ Items Section** (Subtle green tint - `rgba(16,185,129,0.05)`)
   - Header: "ONQUEUE" 
   - Checkbox for each ONQ item
   - Same columns: Code, EFF, TERM, DEDAMT
   - Green left border
   - Placed BELOW the POS rows

### Implementation Steps

#### Step 1: Update `onqNetpayTableContainer` Population Function
**Find** the function that populates `onqNetpayTableContainer` (around lines 8000-8500)

**Current structure:**
```javascript
// Single ONQ table
onqNetpayTableContainer.innerHTML = `
    <table>
        <thead>ONQ headers</thead>
        <tbody>ONQ rows only</tbody>
    </table>
`;
```

**New structure needed:**
```javascript
// Combined POS + ONQ table with section headers
onqNetpayTableContainer.innerHTML = `
    <table class="table table-sm table-dark bank-table mb-0">
        <thead>
            <tr style="...">
                <th style="width: 32px; text-align: center;"><input type="checkbox" id="onq-select-all-pos" checked onchange="toggleAllOnqPos(this)"></th>
                <th>Code</th>
                <th>EFF</th>
                <th>TERM</th>
                <th>DEDAMT</th>
            </tr>
        </thead>
        <tbody>
            <!-- POS SECTION HEADER -->
            <tr style="background: rgba(251,191,36,0.12); border-left: 3px solid #fbbf24;">
                <td colspan="5" style="font-weight: 700; color: #fbbf24; font-size: 0.65rem; padding: 6px 8px;">
                    <i class="bi bi-wallet2 mr-2"></i>POS
                </td>
            </tr>
            <!-- POS ROWS (Yellow tint) -->
            ${posLoans.map((loan, idx) => `
                <tr style="background: rgba(251,191,36,0.08); border-left: 3px solid rgba(251,191,36,0.3);">
                    <td style="text-align: center;">
                        <input type="checkbox" class="onq-pos-checkbox" id="onq-pos-${idx}" checked>
                    </td>
                    <td>${loan.code}</td>
                    <td>${loan.eff}</td>
                    <td>${loan.term}</td>
                    <td>${formatPHP(loan.dedamt)}</td>
                </tr>
            `).join('')}
            
            <!-- ONQ SECTION HEADER -->
            <tr style="background: rgba(16,185,129,0.12); border-left: 3px solid #10b981; border-top: 2px solid rgba(16,185,129,0.2);">
                <td colspan="5" style="font-weight: 700; color: #10b981; font-size: 0.65rem; padding: 6px 8px;">
                    <i class="bi bi-hourglass-split mr-2"></i>ONQUEUE
                </td>
            </tr>
            <!-- ONQ ROWS (Green tint) -->
            ${onqLoans.map((loan, idx) => `
                <tr style="background: rgba(16,185,129,0.05); border-left: 3px solid rgba(16,185,129,0.25);">
                    <td style="text-align: center;">
                        <input type="checkbox" class="onq-onq-checkbox" id="onq-onq-${idx}" checked>
                    </td>
                    <td>${loan.code}</td>
                    <td>${loan.eff}</td>
                    <td>${loan.term}</td>
                    <td>${formatPHP(loan.dedamt)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
`;
```

#### Step 2: Update Checkbox Handlers
Add handlers for:
- `toggleAllOnqPos(checkbox)` - Select/deselect all POS items
- `toggleAllOnqOnq(checkbox)` - Select/deselect all ONQ items  
- Individual checkbox changes should recalculate totals

#### Step 3: Update Total Calculation
The `val-less-onqueue` display should show: **POS Total - ONQ Total** (only checked items)

---

## Color Reference

### POS Items (Yellow)
- **Background**: `rgba(251,191,36,0.08)`
- **Border-left**: `3px solid rgba(251,191,36,0.3)`
- **Header bg**: `rgba(251,191,36,0.12)`
- **Header color**: `#fbbf24`
- **Icon**: `bi-wallet2`

### ONQ Items (Subtle Green)
- **Background**: `rgba(16,185,129,0.05)` (very subtle)
- **Border-left**: `3px solid rgba(16,185,129,0.25)`
- **Header bg**: `rgba(16,185,129,0.12)`
- **Header color**: `#10b981`
- **Icon**: `bi-hourglass-split`
- **Top border separator**: `2px solid rgba(16,185,129,0.2)`

---

## Files to Modify

1. **index6.html** (lines ~4615-4638): `updateDashboardMetrics()` function
2. **index6.html** (dashboard HTML section ~3650-3750): Add `dashCountAsEase` badge HTML
3. **index6.html** (ONQ table population ~8000-8500): Redesign table structure with POS + ONQ sections
4. **index6.html** (ONQ handlers): Add `toggleAllOnqPos()` and calculation updates

---

## Testing Checklist

- [ ] Dashboard shows AS EASE count separately
- [ ] AS EASE badge has purple color (#8b5cf6)
- [ ] Month filter defaults to 'all'
- [ ] Less OnQueue accordion shows POS section first (yellow tint)
- [ ] ONQ items appear below POS items (green tint)
- [ ] Section headers clearly labeled "POS" and "ONQUEUE"
- [ ] Checkboxes work for both sections
- [ ] Total calculation updates when checking/unchecking items
- [ ] Color scheme matches: yellow for POS, subtle green for ONQ

---

## Priority Order

1. **High Priority**: Add AS EASE count badge (affects user's dashboard visibility issue)
2. **Medium Priority**: ONQ table redesign (improves UX consistency)
3. **Done**: Month filter default (already fixed in previous session)
