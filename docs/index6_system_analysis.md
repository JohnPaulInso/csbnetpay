# Index6.html System Analysis

## Executive Summary

Index6.html is a **CitySavings Credit Portal - Billing Console**, a comprehensive enterprise web application for managing employee loan deductions, billing calculations, and credit operations. The system processes multiple data sources (LCS database, POS, ONQ, PLI) to generate accurate billing statements and track deduction statuses.

---

## System Architecture

### Technology Stack
- **Frontend**: HTML5, CSS3 (Custom Design System)
- **CSS Framework**: Bootstrap 4.5.2 with extensive custom overrides
- **JavaScript**: Vanilla ES6+ (No frameworks)
- **UI Libraries**: 
  - Chart.js (data visualization)
  - Bootstrap Icons
  - SheetJS (xlsx - Excel parsing)
  - html2canvas (screenshot generation)
  - fflate.min.js (compression)
- **Fonts**: Montserrat, Inter, Poppins (Google Fonts)

### Design System
- **Theme**: Dark mode enterprise UI with glassmorphism effects
- **Color Palette**:
  - Background: Deep space gradient (indigo-violet to black)
  - Accent: Amber/Orange (#F59E0B, #E5A93C)
  - Success: Emerald green (#10B981)
  - Status indicators: Multi-color system
- **Layout**: Responsive design with mobile-first approach

---

## Core Data Structures

### 1. LCS Database (`lcsEmpMap`)
- **Type**: Map object
- **Purpose**: Central employee loan database from SUNLINE LCS spreadsheet
- **Key**: Employee number (string)
- **Value**: Array of loan records per employee
- **Data Points**: 
  - Employee details (ID, name, division, station)
  - Loan information (amount, maturity, release date)
  - Monthly amortization
  - Account status

### 2. POS Deductions (`posEmpMap`)
- **Type**: Map object
- **Purpose**: Positive deduction amounts (CSB Deductions)
- **Key**: Employee number
- **Value**: Array of POS loan records
- **Fields**:
  - DEDAMT (deduction amount)
  - Effectivity date
  - Loan account details

### 3. ONQ Deductions (`onqEmpMap`)
- **Type**: Map object
- **Purpose**: ONQUEUE (Less OnQueue) deduction records
- **Key**: Employee number
- **Value**: Array of ONQ loan records
- **Behavior**: Default is 0 unless "Select All" mode enabled

### 4. PLI Deductions (`pliEmpMap`)
- **Type**: Map object
- **Purpose**: Private Liabilities (PLI 1-5) deduction records
- **Key**: Employee number
- **Value**: Array of PLI loan records
- **Features**: 
  - 5 slots per employee
  - Manual redemption tracking
  - Double deduction monitoring

### 5. Row Cache (`window.firstBillingRowsCache`)
- **Type**: Object (cache)
- **Purpose**: Performance optimization for billing table rows
- **Key Format**: `{prefix}-{rowKey}` (e.g., "norm-12345" or "auto-67890")
- **Contents**: Complete billing row data including:
  - All calculated values
  - User selections (checkboxes)
  - Status information

---

## Key Functional Components

### 1. Data Loading & Parsing

#### CSV File Loading
```javascript
function loadLcsDatabase()
```
- **Purpose**: Loads LCS database from CSV file
- **Process**:
  1. Finds latest MonDDYYYY LCS file via `available_files.json`
  2. Parses CSV with dynamic header mapping
  3. Populates `lcsEmpMap` with employee records
  4. Clears PLI, POS, ONQ checkbox states
  5. Triggers UI updates via callbacks

#### Date & Month Handling
```javascript
function normalizeMonthYear(str)
function getLoanDateMonthKey(dateStr)
function getExpectedEffectivity(dateStr)
```
- Converts various date formats to MM/YYYY standard
- Handles 2-digit and 4-digit years
- Calculates next-month effectivity for loans

### 2. Billing Row Generation

#### Core Function: `buildBillingRowData()`
- **Inputs**:
  - Employee number
  - Account data from LCS
  - NetPay, POS, ONQ, PLI maps
  - Row key identifier
  
- **Outputs**: Complete billing row object with:
  - Employee identification
  - Calculated deductions
  - Status determination
  - UI display values

#### Status Calculation Logic
```javascript
STATUS_SORT_CYCLE = [
  'ALL',
  'EFFECTED',           // POS matches amort (±1.0), no ONQ
  'OVERDEDUCTED',       // POS > Monthly Amort + 1.0
  'UNDERDEDUCTED',      // POS < Monthly Amort - 1.0
  'AS EASE / FIRST CSB ONQ',  // Has ONQ + Net Total < ₱5,000
  'FIRST CSB ONQUEUE',  // Has ONQ + Net Total ≥ ₱5,000
  'NO BILLING'          // No POS deductions
]
```

**Status Determination Rules**:
1. **NO BILLING**: `csbPositive === 0`
2. **AS EASE**: `firstOnqAmt > 0 AND netTotal < 5000`
3. **FIRST CSB ONQUEUE**: `firstOnqAmt > 0 AND netTotal >= 5000`
4. **OVERDEDUCTED**: `diff > 1.0 AND firstOnqAmt === 0`
5. **UNDERDEDUCTED**: `diff < -1.0 AND firstOnqAmt === 0`
6. **EFFECTED**: Default (within ±1.0 tolerance)

Where:
- `diff = csbPositive - monthlyAmort`
- `netTotal = netPayVal + csbPositive - firstOnqAmt`

### 3. Filter & Search System

#### Billing Filters
- **Types**: Auto billing, Normal billing
- **Storage**: `localStorage` with versioning (`billing_filters_auto_v4`, `billing_filters_normal_v4`)
- **Features**:
  - Add custom account filters
  - Toggle individual filters on/off
  - "Select All" / "Deselect All" functionality
  - Filters by account name (uppercase matching)

#### Search Implementation
```javascript
function applyBillingFilters()
```
- **Search Scope**:
  - Client name
  - Employee number
  - Division
  - Station
  - Status (with aliases)
  - Release date
  - Maturity date
  - Numeric values (amounts)
  
- **Special Features**:
  - Real-time filtering
  - Clear button visibility toggle
  - Status filter bypass for release month

### 4. Deduction Selection Modes

#### Current Month vs. All Deductions
```javascript
function toggleDedSelectionMode(type)
```
- **Modes**:
  - **Current Month Only**: Auto-selects deductions matching billing month
  - **Select All**: Includes all deductions regardless of effectivity
  
- **Behavior per Type**:
  - **POS**: Current month checked by default, updates on mode toggle
  - **ONQ**: All unchecked in "current" mode, all checked in "all" mode
  - **PLI**: All unchecked in "current" mode, all checked in "all" mode

#### Checkbox Persistence
- **Storage**: `localStorage` per row and deduction type
- **Keys**: 
  - `pos_checks_{prefix}-{rowKey}`
  - `onq_checks_{prefix}-{rowKey}`
  - `pli_checks_{prefix}-{rowKey}`
- **Content**: JSON object mapping loan index to checked state

### 5. Table Rendering & Performance

#### Infinite Scroll Implementation
```javascript
function attachInfiniteScroll()
function handleTableScroll()
function loadMoreRows()
```
- **Initial Load**: 50 rows
- **Chunk Size**: 50 rows per scroll
- **Detection**: Scroll position > 80% of scrollable height
- **Throttling**: `isLoadingMore` flag prevents concurrent loads

#### Table Sorting
```javascript
function sortBillingTable(col)
```
- **Sortable Columns**:
  - ID (numeric)
  - Division
  - Station
  - Name (alphabetic)
  - Monthly Amort
  - NetPay
  - POS (Positive)
  - ONQ (OnQueue)
  - PLI (Private Liabilities)
  - Net Total (calculated)
  - Status (custom ranking)
  - Diff (POS - Amort)
  - Maturity Date
  - Release Date

- **Sort Direction**: Toggle ASC/DESC on repeat clicks
- **Status Sort**: Cycles through STATUS_SORT_CYCLE options

### 6. UI Interaction Features

#### Sub-Row Expansion (Accordion Pattern)
```javascript
function togglePosDetails(empNumStr, prefix)
function toggleOnqDetails(empNumStr, prefix)
function togglePliDetails(empNumStr, prefix)
```
- **Purpose**: Show/hide individual loan deductions within each employee row
- **Visual Indicator**: Chevron icon rotation (down ↔ up)
- **State Management**: DOM manipulation (display: none ↔ table-row)

#### Checkbox Synchronization
```javascript
function syncAccordionCheckbox(prefix, rowKey, idx, isChecked)
function updatePosLoanSelection(empNumStr, prefix)
function updateOnqLoanSelection(empNumStr, prefix)
function updatePliLoanSelection(empNumStr, prefix)
```
- Inline checkbox ↔ Accordion checkbox
- Auto-calculation of subtotals
- Main checkbox auto-uncheck when all sub-items unchecked

#### Math Popover (Tooltip System)
- **Global Singleton**: `#global-math-popover`
- **Position**: Fixed (escapes stacking contexts)
- **Z-Index**: 999999 (top-layer)
- **Trigger**: Hover on `.orange-node` elements
- **Content**: Formula explanations and calculation breakdowns

### 7. Dashboard Metrics

```javascript
function updateDashboardMetrics(rows)
```
- **Tracked Counts**:
  - Total Effected
  - Overdeducted
  - Underdeducted
  - First CSB ONQUEUE
  - AS EASE (protected status)
  - No Billing

- **Display**: Badge counters in navigation or header area

---

## Branch & Month Selection

### Branch Filtering
- **Element**: `#branchSelect` dropdown
- **Behavior**: 
  - Requires explicit selection before data load
  - Filters LCS rows by branch value
  - "ALL" option shows all branches
  - Stored in DOM element value

### Active Month Selection
- **Element**: `#activeMonthSelect` dropdown
- **Format**: `mmmDD` (e.g., "sep26" for September 2026)
- **Purpose**: Determines current billing month for effectivity checks
- **Generation**: Dynamic options from LCS data via `generateLoanMonthOptions()`

### Loan Release Month Filter
- **Elements**: `#loanReleaseMonthFilter-norm`, `#loanReleaseMonthFilter-auto`
- **Purpose**: Filter billing rows by loan release/transaction date
- **Bypass**: Automatically set to "all" when status filter is active

---

## Calculation Formulas

### Net Total
```
Net Total = NetPay + POS - ONQ - PLI
```

### Difference (for status)
```
Diff = CSB Positive (POS) - Monthly Amortization
```

### Status Tolerance
```
EFFECTED range: -1.0 ≤ Diff ≤ +1.0
```

### AS EASE Threshold
```
Net Total < ₱5,000.00 AND ONQ > 0
```

---

## Mobile Responsiveness

### Breakpoints
- **Mobile**: ≤ 575.98px
- **Tablet**: 576px - 767.98px
- **Desktop**: ≥ 768px
- **Large Desktop**: ≥ 1024px

### Mobile Adaptations
1. **Summary Cards**: 2-column grid layout
2. **Font Sizes**: Reduced by 15-20%
3. **Table Display**: Horizontal scroll with sticky headers
4. **History Grid**: Card-based layout (not table)
5. **Navigation**: Bottom fixed nav bar
6. **Input Fields**: 16px minimum to prevent iOS zoom

---

## Performance Optimizations

### 1. Row Caching
- Cache built rows in `window.firstBillingRowsCache`
- Prevents redundant calculations
- Keyed by `{prefix}-{rowKey}` format

### 2. Lazy Rendering
- Infinite scroll loads 50 rows at a time
- Reduces initial DOM size
- Improves perceived performance

### 3. Backdrop Filter Reduction
- Navigation blur: 10px (reduced from 20px)
- Math popover blur: 8px (reduced from 24px)
- Improves scroll performance

### 4. LocalStorage Persistence
- Checkbox states saved per row
- Filter configurations cached
- Version keys for cache invalidation

### 5. Skeleton Loaders
- Display while data loads
- Prevents layout shift
- Improves perceived performance

---

## Data Flow Diagram

```
[available_files.json] → [findLatestLcsFile()]
                              ↓
                    [loadLcsDatabase()] 
                              ↓
                    [Parse CSV → lcsEmpMap]
                              ↓
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
         [POS Data]      [ONQ Data]      [PLI Data]
              ↓               ↓               ↓
         [posEmpMap]     [onqEmpMap]     [pliEmpMap]
              └───────────────┼───────────────┘
                              ↓
              [buildBillingRowData(empNum, ...)]
                              ↓
              [Calculate Status, Totals, etc.]
                              ↓
              [Store in window.firstBillingRowsCache]
                              ↓
                  [applyBillingFilters()]
                              ↓
              [sortBillingTable() if needed]
                              ↓
              [Render visible rows (50 chunks)]
                              ↓
                  [User Interactions] ←────┐
                              ↓             │
              [Update calculations]         │
              [Sync localStorage]           │
              [Re-render affected rows] ────┘
```

---

## Key UI Components

### 1. Navigation Bar
- **Position**: Sticky top
- **Backdrop**: Blur effect (10px)
- **Links**: Dashboard, Billing, Reports, Settings
- **Active State**: Amber glow with border

### 2. Dashboard Summary Cards
- **Count**: 6 cards (4 top, 2 bottom)
- **Height**: Fixed 148px for uniformity
- **Contents**:
  - Incoming Deduction (input field)
  - Semi-Total Summary
  - Amortization Summary
  - New NetPay Summary
  - Donut Chart (visual breakdown)
  - Line Chart (allocation progress)

### 3. Billing Table
- **Headers**: Sticky on scroll
- **Columns**: 
  - Select (checkbox)
  - # (index)
  - ID (employee number)
  - Division
  - Station
  - Client Name
  - Monthly Amort
  - NetPay
  - POS (expandable)
  - ONQ (expandable)
  - PLI (expandable)
  - Net Total
  - Status
  - Diff
  - Maturity Date
  - Release Date

### 4. Expandable Sub-Rows
- **POS Sub-Rows**: Individual loan deductions with checkboxes
- **ONQ Sub-Rows**: ONQUEUE deduction items
- **PLI Sub-Rows**: Private liability entries
- **Visual**: Indented, slightly darker background

### 5. Filter Popover
- **Trigger**: Button click next to search
- **Contents**:
  - List of saved filters with checkboxes
  - "Select All" / "Deselect All" buttons
  - Add new filter input
  - Apply button

### 6. Custom Select Dropdowns
- **Appearance**: Custom styled (native selects hidden)
- **Features**:
  - Smooth animations
  - Amber accent on hover/focus
  - Arrow rotation on open
  - Max height with scroll

---

## Security & Data Handling

### LocalStorage Usage
- **Billing Filters**: Versioned (v4) to invalidate old formats
- **Checkbox States**: Per-row persistence
- **Session Data**: Billing tags, active selections

### Data Validation
- **Numeric Inputs**: `parseFloat()` with `isNaN()` checks
- **Date Parsing**: Multiple format support with fallbacks
- **Empty State Handling**: "N/A" display for missing data

### CSV Injection Prevention
- Quote handling in `parseCsvLine()`
- Field sanitization before display

---

## Known Features & Behaviors

### 1. Deduction Mode Memory
- Separate mode per table type (auto vs. normal)
- Persisted in `window.dedSelectionMode` object

### 2. Status Filter Auto-Reset
- Selecting status filter clears release month filter
- Prevents conflicting filter states

### 3. Checkbox Auto-Uncheck
- Main deduction checkbox unchecks when all sub-items unchecked
- Prevents inconsistent UI state

### 4. Sub-Row Red Tint (Deletion Tags)
- Checkbox style: `.checkbox-red-tag`
- Purpose: Mark items for removal
- Color: Red (#EF4444)

### 5. Copy-to-Clipboard Features
- Employee ID: Click to copy
- Net Proceeds: Tap to copy with glow animation
- Visual feedback: Amber text-shadow pulse

### 6. Landscape Mode Toggle
- **Target**: First Billing table
- **Class**: `.rotated-landscape-mode`
- **Effect**: Horizontal scroll optimization, amber border glow

---

## Integration Points

### 1. File Upload System
- **Target**: CSV files (LCS, POS, ONQ, PLI)
- **Discovery**: `available_files.json` manifest
- **Auto-Selection**: Latest file by date in filename

### 2. Export Capabilities
- **Screenshots**: html2canvas library
- **Excel Export**: SheetJS (xlsx) library
- **Data Format**: Maintains calculations and formatting

### 3. Session Persistence
- **Active Session**: `window.activeSession` object
- **Contents**: User selections, added redemptions, custom values

---

## Maintenance Notes

### CSS Variable System
```css
:root {
  --bg-deep: #040407
  --accent: #E5A93C
  --emerald: #059669
  --text-primary: #F0F4F8
  --radius-lg: 20px
  --font-size-hero: 1.7rem
  --card-padding: 20px
}
```

### Responsive Breakpoints Override
- Mobile overwrites CSS variables
- Desktop uses base values
- Tablet uses interpolated values

### Version Comments
- Extensive change logs in CSS comments
- Date-stamped modifications (2026-07-11, 2026-07-13, etc.)
- "Fix" and "New" labels for change tracking

---

## Critical Functions Reference

| Function | Purpose | Key Behavior |
|----------|---------|-------------|
| `loadLcsDatabase()` | Load CSV database | Async, populates lcsEmpMap |
| `buildBillingRowData()` | Generate row object | Calculates all deductions & status |
| `renderFirstBillingBranchTable()` | Render table | Infinite scroll initialization |
| `sortBillingTable(col)` | Sort by column | Handles status cycle |
| `applyBillingFilters()` | Filter rows | Search + month + status filters |
| `toggleDedSelectionMode(type)` | Switch all/current | Updates all checkboxes |
| `updatePosLoanSelection()` | Recalc POS total | Syncs UI & localStorage |
| `updateOnqLoanSelection()` | Recalc ONQ total | Syncs UI & localStorage |
| `updatePliLoanSelection()` | Recalc PLI total | Syncs UI & localStorage |
| `formatPHP(val)` | Currency formatter | Returns ₱#,###.## |
| `normalizeMonthYear(str)` | Date standardization | Converts to MM/YYYY |

---

## Future Considerations

### Potential Enhancements
1. **Backend Integration**: RESTful API for data persistence
2. **User Authentication**: Role-based access control
3. **Real-time Collaboration**: WebSocket for multi-user editing
4. **Audit Trail**: Complete change history logging
5. **Export Templates**: Custom report generation
6. **Automated Notifications**: Status change alerts
7. **Batch Operations**: Bulk updates via CSV import

### Performance Improvements
1. **Virtual Scrolling**: Render only visible rows (e.g., react-window)
2. **Web Workers**: Offload calculations to background threads
3. **IndexedDB**: Client-side database for large datasets
4. **Service Worker**: Offline capability and caching

### Code Quality
1. **Module System**: Split into ES6 modules
2. **TypeScript**: Type safety for complex data structures
3. **Unit Tests**: Jest/Mocha for calculation functions
4. **E2E Tests**: Cypress/Playwright for user flows

---

## Conclusion

Index6.html is a sophisticated single-page application for credit billing management. It demonstrates advanced CSS design, complex state management, and efficient data processing—all without external JavaScript frameworks. The system handles multiple data sources, provides rich filtering/sorting capabilities, and maintains responsive performance with large datasets through clever optimization strategies.

**Key Strengths**:
- Comprehensive status calculation logic
- Robust filter & search system
- Performance-optimized rendering
- Mobile-responsive design
- Rich user interactions

**Architecture Pattern**: Monolithic SPA with procedural JavaScript and extensive DOM manipulation.

**Suitable For**: Internal enterprise tool, credit union billing operations, loan management workflows.

---

*Document Version: 1.0*  
*Analysis Date: 2026-09-30*  
*File Analyzed: index6.html (11,505 lines)*
