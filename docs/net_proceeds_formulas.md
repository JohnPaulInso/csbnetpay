# Net Proceeds Formulas & Calculation Explanations

Here are the exact formulas and logic used to calculate net proceeds and related fields in the Loan Evaluation template.

---

## 1. Formula for Loan Proceeds (id="val-netproc-loan-proceeds")
Loan Proceeds is calculated as the Loan Amount minus a 6% service/interest deduction fee (94% of the Loan Amount):

**Formula:**
Loan Proceeds = Loan Amount * 0.94

*Example:*
- For a Loan Amount of 73,000.00: 73,000.00 * 0.94 = 68,620.00
- For a Loan Amount of 3,000.00: 3,000.00 * 0.94 = 2,820.00

---

## 2. Why checking/unchecking a checkbox on PLI slot changes the Loan Proceeds
When you check or uncheck a checkbox under the PLI section:
1. It updates the total value of included PLI deductions.
2. This changes the baseline capacity for the loan amount calculation (since including a PLI deduction increases your net capacity).
3. The system automatically recalculates and updates the Loan Amount capacity (e.g., from 3,000.00 up to 73,000.00 when the checkbox is active).
4. Because the Loan Proceeds value is exactly 94% of the Loan Amount, any change to the Loan Amount updates the Loan Proceeds (e.g., changing from 2,820.00 to 68,620.00).

---

## 3. Formula for Less Advance Payment (id="val-netproc-advance-payment")
Advance Payment is the difference in amortizations multiplied by the number of advance payment months, active only when checked:

**Formula:**
If "Less Advance Payment" checkbox is Checked:
Advance Payment = (New CSB Amortization - Sum of Checked CSB Deductions - Sum of Checked PLI Deductions) * Advance Payment Months

If "Less Advance Payment" checkbox is Unchecked:
Advance Payment = 0

---

## 4. Formula for Net Proceeds (id="val-netproc-total")
Net Proceeds represents the final payout received by the client:

**Formula:**
Net Proceeds = Loan Proceeds - Less Old Balance - Less Old Redemption - Less Advance Payment
