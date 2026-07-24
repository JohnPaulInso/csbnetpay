# Abstract Excel to CSV Conversion Column Templates & Standard Specifications

This document outlines the standard column templates, header detection patterns, and output formats used by the Abstract Uploader (`index.html`, `index-uploaded.html`, `index_backup_new.html`) for converting raw monthly Abstract Excel workbooks (e.g. `7-2026 Abstract.xlsx`) into standard CSV data files.

---

## 1. Sheet Keyword Detection

| Target Sheet ID | Accepted Sheet Name Keywords & Patterns | Output CSV Filename Format |
|---|---|---|
| **NETPAY** | `NetPay`, `Net Pay`, `NETPAY`, `NET PAY`, `NTHP`, `NET` | `{month}{yy}.csv` (e.g. `jul26.csv`) |
| **POS** | `0339 positive`, `0339 POSITIVE`, `POSITIVE`, `POS`, `0339`, `339`, `POS DEDNS` | `pos_{month}{yy}.csv` (e.g. `pos_jul26.csv`) |
| **ONQUEUE** | `OnQUEUE`, `ONQUEUE`, `ON QUEUE`, `ONQ`, `ON Q`, `QUEUE`, `QUEQUE`, `ONQUE` | `onq_{month}{yy}.csv` (e.g. `onq_jul26.csv`) |
| **PLI** | `ALL PLIS DEDNS`, `PLI`, `PLIS`, `PLI DEDNS`, `ALL PLIS` | `pli_{month}{yy}.csv` (e.g. `pli_jul26.csv`) |

---

## 2. Dynamic Column Header Mapping Rules

Row 0 of each sheet is analyzed for column header titles (case-insensitive regex patterns). Cells are dynamically mapped to output columns regardless of input column order or position. All numbers are sanitized by removing commas before numeric formatting (`.toFixed(2)`).

### A. NETPAY Sheet Standard Output Structure (14 Columns)
- **Column A (0)**: `REGCODE` (Header pattern: `/^REG\s*CODE$/i`, `/^REG$/i`)
- **Column B (1)**: `DIVCODE` (Header pattern: `/^DIV\s*CODE$/i`, `/^DIV$/i`)
- **Column C (2)**: `STACODE` (Header pattern: `/^STA\s*CODE$/i`, `/^STA$/i`)
- **Column D (3)**: `EMPNO` (Header pattern: `/^EMP\s*NO$/i`, `/^EMPLOYEE\s*NO$/i`, `/^EMP$/i`)
- **Column E (4)**: `FNAME` (Header pattern: `/^FNAME$/i`, `/^FIRST\s*NAME$/i`)
- **Column F (5)**: `MI` (Header pattern: `/^MI$/i`, `/^MIDDLE\s*INITIAL$/i`)
- **Column G (6)**: `LNAME` (Header pattern: `/^LNAME$/i`, `/^LAST\s*NAME$/i`)
- **Column H (7)**: `TAKEHOME` (Header pattern: `/TAKE\s*HOME/i`, `/NTHP/i`)
- **Column I (8)**: `""` (Blank spacer column)
- **Column J (9)**: `GRADE` (Header pattern: `/^GRADE$/i`)
- **Column K (10)**: `STEP` (Header pattern: `/^STEP$/i`)
- **Column L (11)**: `TAXCODE` (Header pattern: `/^TAX\s*CODE$/i`, `/^TAXCODE$/i`)
- **Column M (12)**: `""` (Blank spacer column)
- **Column N (13)**: `ACCOUNT` (Header pattern: `/^ACCOUNT$/i`, `/^BANK\s*ACCOUNT$/i`)

---

### B. POS (DEDAMT Code 339) Sheet Standard Output Structure (16 Columns)
- **Column A (0)**: `REGCODE`
- **Column B (1)**: `DIVCODE`
- **Column C (2)**: `STACODE`
- **Column D (3)**: `EMPNO`
- **Column E (4)**: `FNAME`
- **Column F (5)**: `MI`
- **Column G (6)**: `LNAME`
- **Column H (7)**: `DEDCODE` (Header pattern: `/^DED\s*CODE$/i`, `/^DED$/i`)
- **Column I (8)**: `DEDID` (Header pattern: `/^DED\s*ID$/i`)
- **Column J (9)**: `EFFYY` (Header pattern: `/^EFF\s*YY$/i`, `/^EFFYY$/i`)
- **Column K (10)**: `EFFMM` (Header pattern: `/^EFF\s*MM$/i`, `/^EFFMM$/i`)
- **Column L (11)**: `TERYY` (Header pattern: `/^TER\s*YY$/i`, `/^TERYY$/i`)
- **Column M (12)**: `TERMM` (Header pattern: `/^TER\s*MM$/i`, `/^TERMM$/i`)
- **Column N (13)**: `DEDAMT` (Header pattern: `/^DED\s*AMT$/i`, `/^DEDAMT$/i`, `/^AMOUNT$/i`)
- **Column O (14)**: `""` (Blank spacer column)
- **Column P (15)**: `POLICYNO` (Header pattern: `/^POLICY\s*NO$/i`, `/^POLICYNO$/i`)

---

### C. ONQUEUE Sheet Standard Output Structure (17 Columns)
- **Column A (0)**: `"BLANK"` (or empty string for data rows)
- **Column B (1)**: `REGCODE`
- **Column C (2)**: `DIVCODE`
- **Column D (3)**: `STACODE`
- **Column E (4)**: `EMPNO`
- **Column F (5)**: `FNAME`
- **Column G (6)**: `MI`
- **Column H (7)**: `LNAME`
- **Column I (8)**: `DEDCODE`
- **Column J (9)**: `DEDID`
- **Column K (10)**: `EFFYY`
- **Column L (11)**: `EFFMM`
- **Column M (12)**: `TERYY`
- **Column N (13)**: `TERMM`
- **Column O (14)**: `DEDAMT`
- **Column P (15)**: `""` (Blank spacer column)
- **Column Q (16)**: `POLICYNO`

---

### D. PLI Sheet Standard Output Structure (18 Columns)
- **Column A (0)**: `"BLANK"` (or empty string for data rows)
- **Column B (1)**: `DIVCODE`
- **Column C (2)**: `STACODE`
- **Column D (3)**: `EMPNO`
- **Column E (4)**: `FNPRE` (Header pattern: `/^FNPRE$/i`)
- **Column F (5)**: `FNAME`
- **Column G (6)**: `MI`
- **Column H (7)**: `LNAME`
- **Column I (8)**: `APPEL` (Header pattern: `/^APPEL$/i`)
- **Column J (9)**: `DEDCODE`
- **Column K (10)**: `DEDID`
- **Column L (11)**: `EFFYY`
- **Column M (12)**: `EFFMM`
- **Column N (13)**: `TERYY`
- **Column O (14)**: `TERMM`
- **Column P (15)**: `DEDAMT`
- **Column Q (16)**: `POLICYNO`
- **Column R (17)**: `AGENT` (Header pattern: `/^AGENT$/i`)

---

## 3. Numeric Formatting & Cleaning
1. Amounts under `TAKEHOME` (Column H in NetPay) and `DEDAMT` (Column N in POS, Column O in ONQUEUE, Column P in PLI) are formatted with 2 decimal places (`.toFixed(2)`).
2. Commas in raw numbers (e.g. `"12,352.96"`) are automatically stripped out before saving to prevent CSV quote/column shifting.
