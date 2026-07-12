# Salary Standardization Logic Integration

This document outlines the design and implementation details for updating the "anticipated logic" to compute net pay increases based on salary standardization tranches, matching the behavior of `Salary Adjustment.xlsx`.

## Context & Requirements

Previously, the "Anticipated" value in the workspace showed the baseline basic pay of the employee's original grade and step. In the updated implementation:
1. The calculation comparing old vs new tranches is static, comparing the employee's same original Grade and Step.
2. The FROM baseline basic pay is sourced from the 3rd Tranche (`tranch2026.csv`) salary schedule.
3. The TO target basic pay is sourced from the 4th Tranche (`tranch2027.csv`) salary schedule.
4. A comparison table is generated dynamically, showing a row-by-row breakdown of the FROM baseline, TO target, and their differences (DIFF).
5. Subtraction difference is shown exclusively under the `NETPAY` column in the `DIFF` row, while other columns render a dash `-`.

## Computational Mechanics

To match the spreadsheet's results, we implemented the standard Philippine tax and statutory deductions formula directly in JavaScript:

1. **Annualized Income**:
   - $\text{Annual Basic} = \text{Monthly Basic} \times 12$
   - $\text{Taxable Bonus} = \max(0, \text{Monthly Basic} \times 2 - 90000)$
   - $\text{Total Annual Comp} = \text{Annual Basic} + \text{Taxable Bonus}$

2. **Deductions**:
   - $\text{GSIS (9\%)} = \text{Monthly Basic} \times 0.09$
   - $\text{PhilHealth (2.5\%)} = \text{Monthly Basic} \times 0.025$
   - $\text{Pag-IBIG} = 200.00$
   - $\text{Annual Deductions} = (\text{GSIS} + \text{PhilHealth} + \text{Pag-IBIG}) \times 12$

3. **Taxable Income**:
   - $\text{Taxable Income} = \text{Total Annual Comp} - \text{Annual Deductions}$

4. **Annual Withholding Tax (TRAIN Law)**:
   - $\le 250,000$: $0$
   - $\le 400,000$: $15\%$ of amount exceeding $250,000$
   - $\le 800,000$: $22,500 + 20\%$ of amount exceeding $400,000$
   - $\le 2,000,000$: $102,500 + 25\%$ of amount exceeding $800,000$
   - $\le 8,000,000$: $402,500 + 30\%$ of amount exceeding $2,000,000$
   - $> 8,000,000$: $2,202,500 + 35\%$ of amount exceeding $8,000,000$
   - $\text{Monthly Tax} = \text{Annual Tax} / 12$
   - **Note on Taxable Bonus**:
     - For standard/anticipated calculations: $\text{Taxable Bonus} = \max(0, \text{Monthly Basic} \times 2 - 90000)$.
     - For promotion calculations: $\text{Taxable Bonus} = \text{Monthly Basic} \times 2$ (if exceeding 90k, otherwise 0). No 90,000 threshold subtraction is performed, matching the spreadsheet formula in the `SALARY GRADE` sheet.

5. **Net Take Home Pay (NTHP)**:
   - $\text{Net Pay} = \text{Monthly Basic} + 2000.00 \text{ (PERA)} - \text{GSIS} - \text{PhilHealth} - \text{Pag-IBIG} - \text{Monthly Tax}$

## Dynamic Override Delta Computations

- **Anticipated Increase (Comparison Table)**:
  - **FROM Row**: Sourced from `tranch2026.csv` for the employee's `originalGrade` and `originalStep`.
  - **TO Row**: Sourced from `tranch2027.csv` for the employee's `originalGrade` and `originalStep`.
  - **DIFF Row**: Computes the subtraction delta `TO - FROM` exclusively for the `NETPAY` column. Other columns render `-`.
  - **anticipatedVal**: Set to the Net Pay DIFF value.
- **Promotional Override Margin (Comparison Table)**:
  - **FROM Row**: Sourced from `tranch2026.csv` for the employee's `originalGrade` and `originalStep` using the Promotion WTAX logic.
  - **TO Row**: Sourced from `tranch2026.csv` for the selected promotional `promoGrade` and `promoStep` using the Promotion WTAX logic.
  - **DIFF Row**: Computes subtraction delta `TO - FROM` for all columns.
  - **promotionMargin**: Set to the Net Pay DIFF value.

## UI Updates
- Stacking the adjustment panels vertically inside the Private Liabilities card, making them full width (`col-12`) to accommodate the comparison table cleanly.
- Added a breakdown table `#tableAnticipatedBreakdown` displaying columns: `YEAR`, `BASIC`, `PERA`, `GSIS`, `PHILHEALTH`, `PAG-IBIG`, `WTAX`, `NET PAY`.
- Added a promotion breakdown table `#tablePromotionBreakdown` displaying columns: `YEAR`, `BASIC`, `PERA`, `GSIS`, `PHILHEALTH`, `PAG-IBIG`, `WTAX`, `NET PAY`.
- Added hover title tooltips to both table headers, showing the exact formula corresponding to each column.
