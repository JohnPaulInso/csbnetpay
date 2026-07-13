# Loan Evaluation (LE) Revamp - Implementation Guide

## Overview
This document outlines the revamp of the **Loan Evaluation (LE)** tool in [index5.html](file:///c:/Users/Lenovo/Desktop/filez/SEARCH/index5.html). The update introduces premium banking aesthetics, a parallelized ingestion pipeline, and calculations.

---

## 1. Design & Typography (Premium Glassmorphism Dark Theme)
- **Typography**: Refined Montserrat headers and body typography.
- **Glassmorphic Layout**:
  - Deep blue slate gradient background (`#0F172A` to `#020617`).
  - Translucent slate cards (`rgba(15, 23, 42, 0.45)`) backed by backdrop filter blur (`18px`).
  - Crisp hairline border frames (`1px solid rgba(255, 255, 255, 0.08)`) with glowing amber borders on hover (`rgba(245, 158, 11, 0.25)`).
  - High-contrast text layout (`#F8FAFC` for primary content, `#94A3B8` for secondary labels, `#64748B` for muted labels).
- **Custom-Styled Controls**:
  - Native checkboxes and radio selectors styled with custom CSS indicators that glow amber when active.
- **Unnested Margins**:
  - Dynamically rendered items within accordion slots (e.g. PLIs or OnQueue tables) are stripped of duplicate padding, margins, and borders to keep layout grid columns aligned.
- **Proportional History Ledger**:
  - Audit trail runs use proportional column grid sizes (`110px 1.5fr 1.2fr 1.2fr 44px`) to scale cleanly on diverse viewport resolutions.
- **Layout Alignment**:
  - Flex columns stack labels vertically above value nodes to ensure horizontal values never clash or wrap.
- **Responsive Hybrid Grid**:
  - **PC View**: Renders all assessment phases in structured tables.
  - **Mobile View**: Tables automatically collapse into vertical stack cards. Utilizes custom `data-label` CSS pseudo-elements to maintain clear labeling.
  - Mobile bottom navigation uses glassmorphism and active tab glow colors.

---

## 2. Multi-CSV Data Ingestion Pipeline
To improve speed and reliability, the tool fetches and parses active month data files in parallel:
1. **Selection**: User selects active month (e.g., `June 2026`) and employee number.
2. **Fetch**: Parallelizes `fetch()` calls for:
   - `{month}.csv` (Baseline NetPay)
   - `pos_{month}.csv` (Positive DEDAMT components)
   - `onq_{month}.csv` (OnQueue deductions list)
   - `pli_{month}.csv` (Private lending institution items)
   - `tranch2026.csv` (Basic pay grid by Salary Grade and Step)
3. **Parse**: Synchronous parsing handles optional quoted CSV data and normalizes numeric values to prevent NaN bugs.

---

## 3. Financial Equations & Logic
Key computations are marked with the 🍊 emoji. Popovers are bound on hover (PC) or click/tap (Mobile) detailing each step's math:

### Phase A: Core Baseline & Loan Setup
- **🍊 NETPAY & DEDAMT BASELINE**:
  $$\text{Baseline Subtotal} = \text{NetPay} + \text{DEDAMT}$$
- **🍊 LOAN AMOUNT**: Editable input default-initialized to:
  $$\text{Remaining Value} = \text{NetPay} + \text{DEDAMT} - \text{OnQueue}$$
  $$\text{Initial Loan Amount} = \left\lfloor \frac{\text{Remaining Value}}{20.01} \right\rfloor \times 1000$$
- **🍊 INTEREST ESTIMATOR**: Displays a dynamic subtitle directly underneath the Loan Amount:
  $$\text{Total Interest} = (\text{Amortization} \times \text{Term}) - \text{Loan Amount}$$
  It recalculates instantly whenever the Loan Amount, Term, or Interest Rate changes.

### Phase B: Private Lending Institutional (PLI) Matrix
- **🍊 PLI Accordions**: Creates 5 Accordion slots displaying `pli_{month}.csv` rows. Enforces standard HTML radio grouping (`name="pli_radio_{index}"`) so that at most 1 item is active per accordion. Includes a default "None" option (value = 0).
- **🍊 PLI SUBTOTAL**: Sum of active DEDPLI choices across sections 1 to 5.
- **🍊 NETPAY + PLI TOTAL**: $\text{NetPay} + \text{PLI Subtotal}$.

### Phase C: Salary Adjustments & Progressions
- **🍊 ANTICIPATED**: Baseline salary tracking value looked up inside `tranch2026.csv` using the employee's original Salary Grade and Step parameters.
- **🍊 PROMOTION**: Dual-dropdown overrides configuration.
  - Dropdown 1 (Salary Grade): Options 1 to 33.
  - Dropdown 2 (Step): Options 1 to 8.
  - Lookups retrieve matching step salary values from `tranch2026.csv`.
- **🍊 PLI + ANTICIPATED + PROMOTION SUBTOTAL**:
  $$\text{PLI + ANTICIPATED + PROMOTION Subtotal} = 5\text{ PLIs Sum} + \text{Anticipated Value} + \text{Promotion Margin}$$

### Phase D: Queue Reconciliation & Final Determination
- **🍊 LESS ONQUEUE**: Checked checkboxes from `onq_{month}.csv` sum up as active queue deductions.
- **🍊 SEMITOTAL**:
  $$\text{SemiTotal} = \text{PLI + ANTICIPATED + PROMOTION Subtotal} + \text{Active OnQueue Total} - \text{Incoming Deduction}$$
- **🍊 AMORTIZATION**: Standard financial PMT equation rounded up to two decimal points:
  $$\text{Amortization} = \text{RoundUp}\left( -\text{PMT}\left(\frac{\text{Interest}}{12}, \text{Term}, \text{Loan Amount}, 0\right), 2 \right)$$
- **🍊 NEW NETPAY**:
  $$\text{New NetPay} = \text{SemiTotal} - \text{Amortization}$$
  *Safety Guard*: If New NetPay < ₱5,000.00, typography turns warning red and displays a statutory warning limit warning message.

### Receipt List Accordion & Subtotal Visibility (Updated 2026-07-13)
- **🍊 REDEMPTION/ADJUSTMENT ACCORDION**: Displays a dynamic, collapsable list (`#dynamic-pli-rows-container`) of all active redemptions and adjustments.
  - Sourced from active selected PLIs if the master **REDEMPTION** toggle is enabled.
  - Sourced from **Anticipated Step Pay** if the **ANTICIPATION** toggle is enabled and its delta value is positive.
  - Sourced from **Promotion Override Delta** if the **PROMOTION** toggle is enabled and its delta value is non-zero.
  - *Automatic Listing*: The accordion and respective rows display automatically if ANY of these items are active, without requiring the master REDEMPTION toggle to be turned on or a PLI to be selected first.
- **🍊 SUBTOTAL AFTER REDEMPTION ROW**: The row displaying the revised baseline sum (`#row-subtotal-after-redemption`) is shown dynamically if there is at least one active, non-zero component (PLIs, Anticipated, or Promotion) enabled, regardless of the master REDEMPTION toggle state.

---

## 4. Bottom Session Runs Audit Trail
- Positioned as a full-width bottom section for ease of tracking.
- Automatically stores each calculation state to `localStorage` in a timestamped history log.
- Clicking any history card loads the saved state, re-ingests month CSV data for the employee, restores dropdowns/radios/checkboxes, and triggers recalculation.
- **Deletion Capabilities**:
  - **Individual Deletion**: Users can click the trash close-icon (`x-circle-fill`) at the top-right corner of any session history card to delete that specific saved state.
