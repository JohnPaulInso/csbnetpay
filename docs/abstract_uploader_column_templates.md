# Abstract Uploader Column Templates & Conversion Rules

## Overview
This document specifies the exact column templates, header detection rules, and output formats used by the Abstract Uploader on `index.html` when converting multi-sheet Excel files (such as `7-2026 Abstract.xlsx`) into standard CSV data files (`jul26.csv`, `pos_jul26.csv`, `onq_jul26.csv`, `pli_jul26.csv`).

---

## 1. NETPAY Sheet (`julYY.csv`)

### Sheet Detection Keywords
- Matches sheet names containing: `netpay`, `net pay`, `nthp`, `net`

### Target CSV Column Structure (14 Columns)
1. `REGCODE`
2. `DIVCODE`
3. `STACODE`
4. `EMPNO`
5. `FNAME`
6. `MI`
7. `LNAME`
8. `TAKEHOME` (Calculated Net Pay / Take Home amount, formatted to 2 decimal places)
9. `` (Blank column for separator)
10. `GRADE`
11. `STEP`
12. `TAXCODE`
13. `` (Blank column for separator)
14. `ACCOUNT` (Bank Account Number)

### Header Detection Rules
- `REGCODE`: Regex `/^REG\s*CODE$/i` or `/^REG$/i` (Fallback index: 0)
- `DIVCODE`: Regex `/^DIV\s*CODE$/i` or `/^DIV$/i` (Fallback index: 1)
- `STACODE`: Regex `/^STA\s*CODE$/i` or `/^STA$/i` (Fallback index: 2)
- `EMPNO`: Regex `/^EMP\s*NO$/i` or `/^EMPLOYEE\s*NO$/i` or `/^EMP$/i` (Fallback index: 3)
- `FNAME`: Regex `/^FNAME$/i` or `/^FIRST\s*NAME$/i` (Fallback index: 5)
- `MI`: Regex `/^MI$/i` or `/^MIDDLE\s*INITIAL$/i` (Fallback index: 6)
- `LNAME`: Regex `/^LNAME$/i` or `/^LAST\s*NAME$/i` (Fallback index: 7)
- `TAKEHOME`: Regex `/TAKE\s*HOME/i` or `/NTHP/i` (Fallback index: 25)
- `GRADE`: Regex `/^GRADE$/i` (Fallback index: 18)
- `STEP`: Regex `/^STEP$/i` (Fallback index: 19)
- `TAXCODE`: Regex `/^TAX\s*CODE$/i` or `/^TAXCODE$/i` (Fallback index: 20)
- `ACCOUNT`: Regex `/^ACCOUNT$/i` or `/^BANK\s*ACCOUNT$/i` (Fallback index: 26)

---

## 2. POS / Positive Sheet (`pos_julYY.csv`)

### Sheet Detection Keywords
- Matches sheet names containing: `positive`, `pos`, `0339`, `339` (excluding `pli`, `onq`, `queue`)

### Target CSV Column Structure (16 Columns)
1. `REGCODE`
2. `DIVCODE`
3. `STACODE`
4. `EMPNO`
5. `FNAME`
6. `MI`
7. `LNAME`
8. `DEDCODE` (Deduction Code, e.g., 0339)
9. `DEDID`
10. `EFFYY`
11. `EFFMM`
12. `TERYY`
13. `TERMM`
14. `DEDAMT` (Deduction Amount, formatted to 2 decimal places without embedded commas)
15. `` (Blank column for separator)
16. `POLICYNO`

### Header Detection Rules
- `REGCODE`: Regex `/^REG\s*CODE$/i` or `/^REG$/i` (Fallback index: 0)
- `DIVCODE`: Regex `/^DIV\s*CODE$/i` or `/^DIV$/i` (Fallback index: 1)
- `STACODE`: Regex `/^STA\s*CODE$/i` or `/^STA$/i` (Fallback index: 2)
- `EMPNO`: Regex `/^EMP\s*NO$/i` or `/^EMPLOYEE\s*NO$/i` or `/^EMP$/i` (Fallback index: 3)
- `FNAME`: Regex `/^FNAME$/i` or `/^FIRST\s*NAME$/i` (Fallback index: 5)
- `MI`: Regex `/^MI$/i` or `/^MIDDLE\s*INITIAL$/i` (Fallback index: 6)
- `LNAME`: Regex `/^LNAME$/i` or `/^LAST\s*NAME$/i` (Fallback index: 7)
- `DEDCODE`: Regex `/^DED\s*CODE$/i` or `/^DED$/i` (Fallback index: 9)
- `DEDID`: Regex `/^DED\s*ID$/i` (Fallback index: 10)
- `EFFYY`: Regex `/^EFF\s*YY$/i` or `/^EFFYY$/i` (Fallback index: 11)
- `EFFMM`: Regex `/^EFF\s*MM$/i` or `/^EFFMM$/i` (Fallback index: 12)
- `TERYY`: Regex `/^TER\s*YY$/i` or `/^TERYY$/i` (Fallback index: 13)
- `TERMM`: Regex `/^TER\s*MM$/i` or `/^TERMM$/i` (Fallback index: 14)
- `DEDAMT`: Regex `/^DED\s*AMT$/i` or `/^DEDAMT$/i` or `/^AMOUNT$/i` (Fallback index: 15)
- `POLICYNO`: Regex `/^POLICY\s*NO$/i` or `/^POLICYNO$/i` (Fallback index: 16)

---

## 3. ONQUEUE Sheet (`onq_julYY.csv`)

### Sheet Detection Keywords
- Matches sheet names containing: `onqueue`, `onq`, `queue`, `queque`, `onque` (excluding `pli`)

### Target CSV Column Structure (17 Columns)
1. `BLANK` (Header titled "BLANK", values empty)
2. `REGCODE`
3. `DIVCODE`
4. `STACODE`
5. `EMPNO`
6. `FNAME`
7. `MI`
8. `LNAME`
9. `DEDCODE`
10. `DEDID`
11. `EFFYY`
12. `EFFMM`
13. `TERYY`
14. `TERMM`
15. `DEDAMT` (Deduction Amount, formatted to 2 decimal places)
16. `` (Blank column)
17. `POLICYNO`

---

## 4. PLI Sheet (`pli_julYY.csv`)

### Sheet Detection Keywords
- Matches sheet names containing: `pli`, `plis`

### Target CSV Column Structure (18 Columns)
1. `BLANK` (Header titled "BLANK", values empty)
2. `DIVCODE`
3. `STACODE`
4. `EMPNO`
5. `FNPRE`
6. `FNAME`
7. `MI`
8. `LNAME`
9. `APPEL`
10. `DEDCODE`
11. `DEDID`
12. `EFFYY`
13. `EFFMM`
14. `TERYY`
15. `TERMM`
16. `DEDAMT` (Deduction Amount, formatted to 2 decimal places)
17. `POLICYNO`
18. `AGENT`

---

## Numeric Formatting Rule
For all sheet types, numeric values in deduction and takehome columns are parsed to numbers and output using `.toFixed(2)` without thousand-separator commas (e.g. `12352.96`), ensuring proper CSV parsing across all browsers and search scripts.
