# Billing Status Guide - Simple Version

**Last Updated:** September 30, 2026

## What Are Statuses?

The system shows different statuses to tell you if an employee's loan deduction is correct or has problems.

---

## The 6 Statuses (In Order of Priority)

### 🔵 1. FIRST CSB ONQUEUE (Blue Badge)
**What it means:** Employee has an OnQueue loan at CitySavings Bank

**When you see this:**
- First OnQueue loan is code **339** or **0339** (our bank code)
- Total balance is **₱5,000 or more**

**Example:**
- Employee: CUEVA, JAY MARCE
- OnQueue loan: Code 0339, ₱7,999.48
- Total: ₱13,457.47
- **Status: FIRST CSB ONQUEUE** ✅

---

### 🟣 2. AS EASE / FIRST CSB ONQ (Purple Badge)
**What it means:** Employee has an OnQueue loan but balance is low

**When you see this:**
- First OnQueue loan is code **339** or **0339**
- Total balance is **less than ₱5,000**

**Example:**
- OnQueue loan: Code 0339, ₱8,000
- Total: ₱3,000
- **Status: AS EASE / FIRST CSB ONQ** ⚠️

**Special:** You cannot mark these for deletion (protected status)

---

### 🔴 3. NO BILLING (Red Badge)
**What it means:** No deductions found for this employee this month

**When you see this:**
- No POS (positive) deductions for the selected month
- OR all POS loans are from different months

**Example:**
- Filter: September
- POS loans: Only from February (no September loans)
- **Status: NO BILLING** ❌

**Note:** This is NOT an error, just means nothing to bill this month

---

### 🟠 4. OVERDEDUCTED (Orange Badge)
**What it means:** Employee was deducted MORE than they should pay

**When you see this:**
- POS deduction is **more than** Monthly Payment + ₱1.00

**Example:**
- Monthly Payment: ₱7,999.48
- POS Deduction: ₱8,275.67
- Difference: **+₱276.19** (too much)
- **Status: OVERDEDUCTED** ⚠️

**What to do:** Check why they were overcharged

---

### 🟡 5. UNDERDEDUCTED (Yellow Badge)
**What it means:** Employee was deducted LESS than they should pay

**When you see this:**
- POS deduction is **less than** Monthly Payment - ₱1.00

**Example:**
- Monthly Payment: ₱10,515.21
- POS Deduction: ₱2,299.65
- Difference: **-₱8,215.56** (not enough)
- **Status: UNDERDEDUCTED** ⚠️

**What to do:** Check why they were undercharged

---

### 🟢 6. EFFECTED (Green Badge)
**What it means:** Everything is correct! ✅

**When you see this:**
- POS deduction matches Monthly Payment (within ±₱1.00)
- No OnQueue loans
- Billing processed correctly

**Example:**
- Monthly Payment: ₱10,000
- POS Deduction: ₱10,000
- **Status: EFFECTED** ✅

**Note:** This is the GOOD status - no action needed

---

## How The System Decides (Priority Order)

The system checks in this order (stops at first match):

```
1. Is the first OnQueue loan code 339?
   └─ YES + Balance ≥ ₱5,000 → FIRST CSB ONQUEUE
   └─ YES + Balance < ₱5,000 → AS EASE

2. Is there NO deduction this month?
   └─ YES → NO BILLING

3. Was deducted TOO MUCH?
   └─ YES (more than +₱1) → OVERDEDUCTED

4. Was deducted TOO LITTLE?
   └─ YES (less than -₱1) → UNDERDEDUCTED

5. Is there any OnQueue loan?
   └─ YES + Balance ≥ ₱5,000 → FIRST CSB ONQUEUE
   └─ YES + Balance < ₱5,000 → AS EASE

6. Everything else
   └─ EFFECTED (correct)
```

---

## Important Rules

### Rule 1: Only FIRST Loan Matters for Code 339
❌ **Wrong:** Second OnQueue is 339  
✅ **Right:** First OnQueue must be 339

**Example:**
- OnQueue Loan 1: Code **1010** (first)
- OnQueue Loan 2: Code **0339** (second)
- **Result:** NOT "FIRST CSB ONQ" because first is 1010

---

### Rule 2: OnQueue Must Actually Exist
❌ **Wrong:** POS has code 339, no OnQueue → "FIRST CSB ONQ"  
✅ **Right:** POS has code 339, no OnQueue → Check if UNDERDED/OVERDED

**Example:**
- POS: Code 339, ₱2,299.65
- OnQueue: None (₱0.00)
- Monthly Payment: ₱10,515.21
- **Result:** UNDERDEDUCTED (not "FIRST CSB ONQ")

---

### Rule 3: Month Filter Matters
When filtering by month (e.g., "September"):
- Only loans with **EFF: 09/2026** are included
- Loans from other months (EFF: 02/2026) are **ignored**

**Example:**
- Filter: September
- POS Loan 1: EFF **02/2026**, ₱8,215.56 → **NOT COUNTED**
- POS Loan 2: EFF **09/2026**, ₱2,299.65 → **COUNTED**
- Total: ₱2,299.65 (not ₱10,515.21)

---

### Rule 4: ±₱1.00 Tolerance
Small differences under ₱1.00 are okay (rounding):

✅ **Okay:**
- Monthly Payment: ₱10,000
- Deduction: ₱10,000.50
- Difference: ₱0.50 → **EFFECTED**

❌ **Not Okay:**
- Monthly Payment: ₱10,000
- Deduction: ₱10,002
- Difference: ₱2.00 → **OVERDEDUCTED**

---

## Quick Reference Table

| Status | Color | When | What to Do |
|--------|-------|------|------------|
| **FIRST CSB ONQUEUE** | 🔵 Blue | OnQueue 339 + Balance ≥ ₱5k | Normal - CitySavings loan |
| **AS EASE** | 🟣 Purple | OnQueue 339 + Balance < ₱5k | Protected - Low balance |
| **NO BILLING** | 🔴 Red | No deductions this month | Check if correct |
| **OVERDEDUCTED** | 🟠 Orange | Deducted too much | Fix overcharge |
| **UNDERDEDUCTED** | 🟡 Yellow | Deducted too little | Fix undercharge |
| **EFFECTED** | 🟢 Green | Everything correct | No action needed ✅ |

---

## Common Questions

**Q: Why is status "NO BILLING" when there's a POS loan?**  
A: The POS loan is from a different month. Check the EFF date.

**Q: Why "UNDERDEDUCTED" and not "FIRST CSB ONQ" when POS is code 339?**  
A: Code 339 in POS doesn't make it OnQueue unless there's an actual OnQueue loan.

**Q: Why is the second OnQueue 0339 not showing "FIRST CSB ONQ"?**  
A: Only the FIRST OnQueue loan matters. Second position doesn't count.

**Q: What does "±₱1.00 tolerance" mean?**  
A: Small differences under ₱1 are ignored (for rounding). Over ₱1 = problem.

**Q: Can I change status manually?**  
A: No, status is automatic based on the loan data.

---

## Real Examples

### Example 1: Perfect Billing ✅
```
Employee: G088193
Monthly Payment: ₱7,999.48
POS Deduction: ₱7,999.48
OnQueue: None

Status: EFFECTED (Green)
```

### Example 2: Underdeducted ⚠️
```
Employee: G102623
Monthly Payment: ₱10,515.21
POS Deduction: ₱2,299.65 (September only)
OnQueue: None

Status: UNDERDEDUCTED (Yellow)
Difference: -₱8,215.56
```

### Example 3: First CSB OnQueue 🔵
```
Employee: CUEVA, JAY MARCE
Monthly Payment: ₱7,999.48
POS: ₱8,275.67
OnQueue: Code 0339, ₱7,999.48
Total: ₱13,457.47

Status: FIRST CSB ONQUEUE (Blue)
```

---

**Need Help?** Ask your system admin or check the detailed documentation.
