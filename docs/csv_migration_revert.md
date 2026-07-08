# Data Format Migration Revert Guide (GZ to CSV)

## Overview
This document describes the revert operation from compressed Gzip format (`.csv.gz`) back to standard plain CSV format (`.csv`) across the CSB NetPay search engine application.

## Key Changes and Files Reverted (Date: 2026-07-08)

### 1. File Format Reversion
- **Action**: All `*.csv.gz` compressed data files were decompressed back into plain `*.csv` files, and the compressed `.csv.gz` files were deleted.
- **Scope**: Applied to all 132 files (NETPAY, POS/DEDAMT, ONQ, PLI) stored in the root directory.

### 2. Client Scripts Reverted to Direct Fetch
The following JavaScript and HTML files have had their fetching routines updated to pull plain `.csv` files directly:
- [index.script](file:///c:/Users/Lenovo/Desktop/filez/SEARCH/index.script) — NETPAY page logic.
- [index2.script](file:///c:/Users/Lenovo/Desktop/filez/SEARCH/index2.script) — DEDAMT page logic.
- [index3.script](file:///c:/Users/Lenovo/Desktop/filez/SEARCH/index3.script) — ONQ page logic.
- [index4.script](file:///c:/Users/Lenovo/Desktop/filez/SEARCH/index4.script) — PLI page logic.
- [index5.html](file:///c:/Users/Lenovo/Desktop/filez/SEARCH/index5.html) — LE page logic.

All occurrences of `DecompressionStream` and `.gz` path checking were removed from `fetchCSVText` and HEAD verification methods.

### 3. Build & Manifest Updates
- **Manifest Builder in g.bat**: Updated the automatic `available_files.json` generator to read `*.csv` files directly.
- **Service Worker**: Bumped the cache version to `csb-search-v18` in [service-worker.js](file:///c:/Users/Lenovo/Desktop/filez/SEARCH/service-worker.js) to trigger clients to invalidate old cached scripts that request GZ files.

### 4. Admin Excel to CSV Conversion
- **Uploader Page ([index.html](file:///c:/Users/Lenovo/Desktop/filez/SEARCH/index.html))**: Reverted the conversion process inside `convertExcelToCSV` to generate raw text CSV files directly rather than using `fflate.gzipSync` compression.
