# Loan Evaluation (LE) Revamp - Implementation Guide

## Overview
This document outlines the revamp of the **Loan Evaluation (LE)** tool in [index5.html](file:///c:/Users/Lenovo/Desktop/filez/SEARCH/index5.html). The update introduces premium banking aesthetics, a parallelized ingestion pipeline, and calculations.

---

## 1. Design & Typography (Professional Banking Dark Theme)
- **Typography**: Refined Montserrat headers and body typography.
- **Banking Theme**: Replaced transparent glass styles with a dark-slate banking color system:
  - Deep blue slate gradient background (`#0F172A` to `#020617`).
  - Dark Slate cards (`#1E293B` or semi-opaque `#0F2147`) with structured light borders (`rgba(255, 255, 255, 0.08)`).
  - High-contrast text layout (`#F8FAFC` for primary content, `#94A3B8` for secondary labels).
- **Layout Alignment (Side-by-Side Flex Cards)**:
  - Merged the Anticipated and Promotional override controls into a single wide flex grid card.
  - Stacked labels vertically above values (e.g. `Original SG / Step` above `SG-11 Step-5`) to guarantee no text wrapping or linebreaks occur.
  - Form overrides are set with balanced `flex` attributes to fill row spaces cleanly.
- **Responsive Hybrid Grid**:
  - **PC View**: Renders all assessment phases in structured tables.
  - **Mobile View**: Tables automatically collapse into vertical stack cards. Utilizes custom `data-label` CSS pseudo-elements to maintain clear labeling.

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

---

## 4. Bottom Session Runs Audit Trail
- Positioned as a full-width bottom section for ease of tracking.
- Automatically stores each calculation state to `localStorage` in a timestamped history log.
- Clicking any history card loads the saved state, re-ingests month CSV data for the employee, restores dropdowns/radios/checkboxes, and triggers recalculation.
- **Deletion Capabilities**:
  - **Individual Deletion**: Users can click the trash close-icon (`x-circle-fill`) at the top-right corner of any session history card to delete that specific saved state.
