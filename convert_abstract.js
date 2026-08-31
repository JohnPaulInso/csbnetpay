/**
 * convert_abstract.js - Fast Automated Abstract Excel to CSV Splitter & GitHub Uploader
 * (2026-07-13) Fast automated abstract converter and GitHub auto-pusher
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const XLSX = require('xlsx');

const ROOT_DIR = path.resolve(__dirname);
const MONTH_MAP = {
    '1': 'jan', '01': 'jan', 'jan': 'jan', 'january': 'jan',
    '2': 'feb', '02': 'feb', 'feb': 'feb', 'february': 'feb',
    '3': 'mar', '03': 'mar', 'mar': 'mar', 'march': 'mar',
    '4': 'apr', '04': 'apr', 'apr': 'apr', 'april': 'apr',
    '5': 'may', '05': 'may', 'may': 'may',
    '6': 'jun', '06': 'jun', 'jun': 'jun', 'june': 'jun',
    '7': 'jul', '07': 'jul', 'jul': 'jul', 'july': 'jul',
    '8': 'aug', '08': 'aug', 'aug': 'aug', 'august': 'aug',
    '9': 'sep', '09': 'sep', 'sep': 'sep', 'september': 'sep',
    '10': 'oct', 'oct': 'oct', 'october': 'oct',
    '11': 'nov', 'nov': 'nov', 'november': 'nov',
    '12': 'dec', 'dec': 'dec', 'december': 'dec'
};

const MONTH_NAMES = {
    jan: 'January', feb: 'February', mar: 'March', apr: 'April',
    may: 'May', jun: 'June', jul: 'July', aug: 'August',
    sep: 'September', oct: 'October', nov: 'November', dec: 'December'
};

function findFile(inputArg) {
    if (inputArg) {
        let clean = inputArg.trim().replace(/^['"]+|['"]+$/g, '');
        const candidatePaths = [
            path.resolve(clean),
            path.resolve(ROOT_DIR, clean),
            path.resolve(ROOT_DIR, clean + '.xlsx'),
            path.resolve(ROOT_DIR, clean + '.xlsm'),
            path.resolve(process.env.USERPROFILE || '', 'Downloads', clean),
            path.resolve(process.env.USERPROFILE || '', 'Downloads', clean + '.xlsx'),
            path.resolve(process.env.USERPROFILE || '', 'Downloads', clean + '.xlsm'),
            path.resolve(process.env.USERPROFILE || '', 'Desktop', clean),
            path.resolve(process.env.USERPROFILE || '', 'Desktop', clean + '.xlsx'),
            path.resolve(process.env.USERPROFILE || '', 'Desktop', clean + '.xlsm')
        ];

        for (const p of candidatePaths) {
            if (fs.existsSync(p) && fs.statSync(p).isFile()) {
                return p;
            }
        }

        // Fuzzy match in ROOT_DIR or Downloads
        const searchDirs = [ROOT_DIR, path.resolve(process.env.USERPROFILE || '', 'Downloads')];
        for (const dir of searchDirs) {
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                const match = files.find(f => f.toLowerCase().includes(clean.toLowerCase()) && (f.endsWith('.xlsx') || f.endsWith('.xlsm')));
                if (match) return path.resolve(dir, match);
            }
        }
    }

    // Default: find newest abstract file in ROOT_DIR or Downloads
    const searchDirs = [ROOT_DIR, path.resolve(process.env.USERPROFILE || '', 'Downloads')];
    let newestFile = null;
    let newestMtime = 0;

    for (const dir of searchDirs) {
        if (!fs.existsSync(dir)) continue;
        const files = fs.readdirSync(dir);
        for (const f of files) {
            if ((f.endsWith('.xlsx') || f.endsWith('.xlsm')) && (f.toLowerCase().includes('abstract') || f.toLowerCase().includes('lcs'))) {
                const fullPath = path.resolve(dir, f);
                const stat = fs.statSync(fullPath);
                if (stat.mtimeMs > newestMtime) {
                    newestMtime = stat.mtimeMs;
                    newestFile = fullPath;
                }
            }
        }
    }
    return newestFile;
}

function parseMonthYear(filename, overrideMonth, overrideYear) {
    let month = overrideMonth ? MONTH_MAP[overrideMonth.toLowerCase()] : null;
    let year = overrideYear ? String(overrideYear) : null;

    const base = path.basename(filename);

    if (!month) {
        // Look for patterns like "8-2026", "Abstract-8", "Abstract 8", "7-2026", "aug26", "august"
        const m1 = base.match(/(?:abstract[-_\s]*|)(\d{1,2})[-_\s]+(\d{4})/i);
        const m2 = base.match(/(\d{4})[-_\s]+(?:abstract[-_\s]*|)(\d{1,2})/i);
        const m3 = base.match(/(?:abstract[-_\s]+|abstract-)(\d{1,2})\b/i);
        const mMonth = base.match(/(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i);

        if (m1) {
            month = MONTH_MAP[m1[1]];
            year = m1[2];
        } else if (m2) {
            year = m2[1];
            month = MONTH_MAP[m2[2]];
        } else if (m3) {
            month = MONTH_MAP[m3[1]];
        } else if (mMonth) {
            month = MONTH_MAP[mMonth[1].toLowerCase()];
        }
    }

    if (!year) {
        const yMatch = base.match(/202[0-9]/);
        if (yMatch) {
            year = yMatch[0];
        } else {
            year = String(new Date().getFullYear());
        }
    }

    if (!month) {
        month = MONTH_MAP[String(new Date().getMonth() + 1)];
    }

    return { month, year, yy: year.slice(-2) };
}

function sheetMatchesConfig(sheetName, sheetConfig) {
    const s = sheetName.toLowerCase().trim();
    if (sheetConfig.id === "PLI") {
        return s.includes("pli");
    }
    if (sheetConfig.id === "POS") {
        return (s.includes("positive") || s.includes("pos") || s.includes("0339") || s.includes("339")) && !s.includes("pli") && !s.includes("onq") && !s.includes("queue");
    }
    if (sheetConfig.id === "ONQUEUE") {
        return (s.includes("onqueue") || s.includes("onq") || s.includes("queue") || s.includes("queque") || s.includes("onque")) && !s.includes("pli");
    }
    if (sheetConfig.id === "NETPAY") {
        return s.includes("netpay") || s.includes("net pay") || s.includes("nthp") || s === "net";
    }
    if (sheetConfig.id === "LCS") {
        return s.includes("lcs") || s.includes("sunline") || s.includes("ledger");
    }
    return false;
}

// (2026-07-13) Support forceReconvert parameter; prev: 3 arguments only
function convertFile(filePath, customMonth, customYear, forceReconvert = false) {
    console.log(`\n============================================`);
    console.log(` CSB NetPay - Fast Abstract Converter`);
    console.log(`============================================`);
    console.log(`Reading: ${filePath}`);

    const { month, year, yy } = parseMonthYear(filePath, customMonth, customYear);
    console.log(`Detected Month: ${MONTH_NAMES[month]} (${month}), Year: ${year} (${yy})`);

    const monthsCap = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthsLower = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const mIdx = monthsLower.indexOf(month);
    const lcsMonth = mIdx !== -1 ? monthsCap[mIdx] : 'Aug';
    const lcsDay = String(new Date().getDate()).padStart(2, '0');
    const lcsOutput = `lcs_${lcsMonth}${lcsDay}${year}.csv`;

    const sheetsToProcess = [
        { id: "NETPAY", output: `${month}${yy}.csv` },
        { id: "POS", output: `pos_${month}${yy}.csv` },
        { id: "ONQUEUE", output: `onq_${month}${yy}.csv` },
        { id: "PLI", output: `pli_${month}${yy}.csv` },
        { id: "LCS", output: lcsOutput }
    ];

    console.time('Read Workbook');
    const workbook = XLSX.readFile(filePath, { dense: true, cellFormula: false, cellHTML: false, cellText: false });
    console.timeEnd('Read Workbook');

    let presentSheets = sheetsToProcess.filter(sheetConfig =>
        Object.keys(workbook.Sheets).some(name => sheetMatchesConfig(name, sheetConfig))
    );

    if (presentSheets.length === 0) {
        if (Object.keys(workbook.Sheets).length === 1) {
            presentSheets = [{ id: "LCS", output: lcsOutput, forceSheetName: Object.keys(workbook.Sheets)[0] }];
        } else {
            console.error('ERROR: No matching sheets found in workbook:', Object.keys(workbook.Sheets));
            process.exit(1);
        }
    }

    // (2026-07-13) CLI progress bar renderer; prev: basic console logs
    function renderProgressBar(current, total, label, width = 25) {
        const percent = total > 0 ? Math.min(100, Math.max(0, Math.floor((current / total) * 100))) : 100;
        const filled = Math.floor((width * percent) / 100);
        const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
        const curStr = Number(current).toLocaleString();
        const totStr = Number(total).toLocaleString();
        process.stdout.write(`\r[${bar}] ${percent.toString().padStart(3)}% | ${curStr}/${totStr} rows | ${label}   `);
    }

    const generatedFiles = [];
    const totalSheets = presentSheets.length;
    let sheetIndex = 0;
    const sourceStat = fs.existsSync(filePath) ? fs.statSync(filePath) : null;

    // (2026-07-13) Skip recently converted sheets; prev: re-export all sheets every time
    for (const sheetConfig of presentSheets) {
        sheetIndex++;
        const sheetName = sheetConfig.forceSheetName || Object.keys(workbook.Sheets).find(name => sheetMatchesConfig(name, sheetConfig));
        const outPath = path.resolve(ROOT_DIR, sheetConfig.output);

        if (!forceReconvert && fs.existsSync(outPath)) {
            const targetStat = fs.statSync(outPath);
            if (targetStat.size > 0 && sourceStat && targetStat.mtimeMs >= sourceStat.mtimeMs) {
                console.log(`\n[${sheetIndex}/${totalSheets}] Sheet [${sheetName}] -> ${sheetConfig.output} already converted recently (skipped).`);
                generatedFiles.push(sheetConfig.output);
                continue;
            }
        }

        console.log(`\n[${sheetIndex}/${totalSheets}] Converting Sheet [${sheetName}] -> ${sheetConfig.output}`);

        const sheet = workbook.Sheets[sheetName];
        // (2026-07-13) Direct row reading & fast CSV serializer; prev: slow aoa_to_sheet
        let rawRows;
        if (sheet['!data'] && Array.isArray(sheet['!data'])) {
            rawRows = sheet['!data'].map(row => (row || []).map(cell => (cell && cell.v !== undefined ? cell.v : "")));
        } else {
            rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: "" });
        }

        if (!rawRows || rawRows.length === 0) {
            console.warn(`Warning: Sheet ${sheetName} is empty.`);
            continue;
        }

        const totalRows = rawRows.length;
        const headers = (rawRows[0] || []).map(c => String(c || "").trim().toUpperCase());
        const findCol = (patterns) => headers.findIndex(h => patterns.some(p => p.test(h)));

        const hasBlankPrefix = headers[0] === 'BLANK' || headers[0] === '';
        const blankOffset = hasBlankPrefix ? 1 : 0;

        const colMap = {
            REGCODE: findCol([/^REG\s*CODE$/i, /^REG$/i]),
            DIVCODE: findCol([/^DIV\s*CODE$/i, /^DIV$/i]),
            STACODE: findCol([/^STA\s*CODE$/i, /^STA$/i]),
            EMPNO: findCol([/^EMP\s*NO$/i, /^EMPLOYEE\s*NO$/i, /^EMPNO$/i, /^EMP$/i]),
            FNPRE: findCol([/^FNPRE$/i]),
            FNAME: findCol([/^FNAME$/i, /^FIRST\s*NAME$/i]),
            MI: findCol([/^MI$/i, /^MIDDLE\s*INITIAL$/i]),
            LNAME: findCol([/^LNAME$/i, /^LAST\s*NAME$/i]),
            APPEL: findCol([/^APPEL$/i]),
            TAKEHOME: findCol([/TAKE\s*HOME/i, /NTHP/i]),
            DEDCODE: findCol([/^DED\s*CODE$/i, /^DEDCODE$/i, /^DED$/i]),
            DEDID: findCol([/^DED\s*ID$/i, /^DEDID$/i]),
            EFFYY: findCol([/^EFF\s*YY$/i, /^EFFYY$/i]),
            EFFMM: findCol([/^EFF\s*MM$/i, /^EFFMM$/i]),
            TERYY: findCol([/^TER\s*YY$/i, /^TERYY$/i]),
            TERMM: findCol([/^TER\s*MM$/i, /^TERMM$/i]),
            DEDAMT: findCol([/^DED\s*AMT$/i, /^DEDAMT$/i, /^AMOUNT$/i]),
            POLICYNO: findCol([/^POLICY\s*NO$/i, /^POLICYNO$/i]),
            ACCOUNT: findCol([/^ACCOUNT$/i, /^BANK\s*ACCOUNT$/i]),
            GRADE: findCol([/^GRADE$/i]),
            STEP: findCol([/^STEP$/i]),
            TAXCODE: findCol([/^TAX\s*CODE$/i, /^TAXCODE$/i]),
            AGENT: findCol([/^AGENT$/i])
        };

        const getVal = (r, idx) => (idx !== -1 && r[idx] !== undefined && r[idx] !== null) ? String(r[idx]).replace(/,/g, '').trim() : "";

        const processedRows = new Array(totalRows);
        for (let rowIndex = 0; rowIndex < totalRows; rowIndex++) {
            const r = rawRows[rowIndex];
            if (sheetConfig.id === "NETPAY") {
                if (rowIndex === 0) {
                    processedRows[rowIndex] = ["REGCODE", "DIVCODE", "STACODE", "EMPNO", "FNAME", "MI", "LNAME", "TAKEHOME", "", "GRADE", "STEP", "TAXCODE", "", "ACCOUNT"];
                } else {
                    processedRows[rowIndex] = [
                        getVal(r, colMap.REGCODE !== -1 ? colMap.REGCODE : 0),
                        getVal(r, colMap.DIVCODE !== -1 ? colMap.DIVCODE : 1),
                        getVal(r, colMap.STACODE !== -1 ? colMap.STACODE : 2),
                        getVal(r, colMap.EMPNO !== -1 ? colMap.EMPNO : 3),
                        getVal(r, colMap.FNAME !== -1 ? colMap.FNAME : 5),
                        getVal(r, colMap.MI !== -1 ? colMap.MI : 6),
                        getVal(r, colMap.LNAME !== -1 ? colMap.LNAME : 7),
                        getVal(r, colMap.TAKEHOME !== -1 ? colMap.TAKEHOME : 25),
                        "",
                        getVal(r, colMap.GRADE !== -1 ? colMap.GRADE : 18),
                        getVal(r, colMap.STEP !== -1 ? colMap.STEP : 19),
                        getVal(r, colMap.TAXCODE !== -1 ? colMap.TAXCODE : 20),
                        "",
                        getVal(r, colMap.ACCOUNT !== -1 ? colMap.ACCOUNT : 26)
                    ];
                }
            } else if (sheetConfig.id === "POS") {
                if (rowIndex === 0) {
                    processedRows[rowIndex] = ["REGCODE", "DIVCODE", "STACODE", "EMPNO", "FNAME", "MI", "LNAME", "DEDCODE", "DEDID", "EFFYY", "EFFMM", "TERYY", "TERMM", "DEDAMT", "", "POLICYNO"];
                } else {
                    processedRows[rowIndex] = [
                        getVal(r, colMap.REGCODE !== -1 ? colMap.REGCODE : 0),
                        getVal(r, colMap.DIVCODE !== -1 ? colMap.DIVCODE : 1),
                        getVal(r, colMap.STACODE !== -1 ? colMap.STACODE : 2),
                        getVal(r, colMap.EMPNO !== -1 ? colMap.EMPNO : 3),
                        getVal(r, colMap.FNAME !== -1 ? colMap.FNAME : 5),
                        getVal(r, colMap.MI !== -1 ? colMap.MI : 6),
                        getVal(r, colMap.LNAME !== -1 ? colMap.LNAME : 7),
                        getVal(r, colMap.DEDCODE !== -1 ? colMap.DEDCODE : 9),
                        getVal(r, colMap.DEDID !== -1 ? colMap.DEDID : 10),
                        getVal(r, colMap.EFFYY !== -1 ? colMap.EFFYY : 11),
                        getVal(r, colMap.EFFMM !== -1 ? colMap.EFFMM : 12),
                        getVal(r, colMap.TERYY !== -1 ? colMap.TERYY : 13),
                        getVal(r, colMap.TERMM !== -1 ? colMap.TERMM : 14),
                        getVal(r, colMap.DEDAMT !== -1 ? colMap.DEDAMT : 15),
                        "",
                        getVal(r, colMap.POLICYNO !== -1 ? colMap.POLICYNO : 16)
                    ];
                }
            } else if (sheetConfig.id === "ONQUEUE") {
                if (rowIndex === 0) {
                    processedRows[rowIndex] = ["REGCODE", "DIVCODE", "STACODE", "EMPNO", "FNAME", "MI", "LNAME", "DEDCODE", "DEDID", "EFFYY", "EFFMM", "TERYY", "TERMM", "DEDAMT", "", "POLICYNO"];
                } else {
                    processedRows[rowIndex] = [
                        getVal(r, colMap.REGCODE !== -1 ? colMap.REGCODE : blankOffset + 0),
                        getVal(r, colMap.DIVCODE !== -1 ? colMap.DIVCODE : blankOffset + 1),
                        getVal(r, colMap.STACODE !== -1 ? colMap.STACODE : blankOffset + 2),
                        getVal(r, colMap.EMPNO !== -1 ? colMap.EMPNO : blankOffset + 3),
                        getVal(r, colMap.FNAME !== -1 ? colMap.FNAME : blankOffset + 4),
                        getVal(r, colMap.MI !== -1 ? colMap.MI : blankOffset + 5),
                        getVal(r, colMap.LNAME !== -1 ? colMap.LNAME : blankOffset + 6),
                        getVal(r, colMap.DEDCODE !== -1 ? colMap.DEDCODE : blankOffset + 7),
                        getVal(r, colMap.DEDID !== -1 ? colMap.DEDID : blankOffset + 8),
                        getVal(r, colMap.EFFYY !== -1 ? colMap.EFFYY : blankOffset + 9),
                        getVal(r, colMap.EFFMM !== -1 ? colMap.EFFMM : blankOffset + 10),
                        getVal(r, colMap.TERYY !== -1 ? colMap.TERYY : blankOffset + 11),
                        getVal(r, colMap.TERMM !== -1 ? colMap.TERMM : blankOffset + 12),
                        getVal(r, colMap.DEDAMT !== -1 ? colMap.DEDAMT : blankOffset + 13),
                        "",
                        getVal(r, colMap.POLICYNO !== -1 ? colMap.POLICYNO : blankOffset + 15)
                    ];
                }
            } else if (sheetConfig.id === "PLI") {
                if (rowIndex === 0) {
                    processedRows[rowIndex] = ["BLANK", "DIVCODE", "STACODE", "EMPNO", "FNPRE", "FNAME", "MI", "LNAME", "APPEL", "DEDCODE", "DEDID", "EFFYY", "EFFMM", "TERYY", "TERMM", "DEDAMT", "POLICYNO", "AGENT"];
                } else {
                    processedRows[rowIndex] = [
                        "",
                        getVal(r, colMap.DIVCODE !== -1 ? colMap.DIVCODE : 1),
                        getVal(r, colMap.STACODE !== -1 ? colMap.STACODE : 2),
                        getVal(r, colMap.EMPNO !== -1 ? colMap.EMPNO : 3),
                        getVal(r, colMap.FNPRE !== -1 ? colMap.FNPRE : 4),
                        getVal(r, colMap.FNAME !== -1 ? colMap.FNAME : 5),
                        getVal(r, colMap.MI !== -1 ? colMap.MI : 6),
                        getVal(r, colMap.LNAME !== -1 ? colMap.LNAME : 7),
                        getVal(r, colMap.APPEL !== -1 ? colMap.APPEL : 8),
                        getVal(r, colMap.DEDCODE !== -1 ? colMap.DEDCODE : 9),
                        getVal(r, colMap.DEDID !== -1 ? colMap.DEDID : 10),
                        getVal(r, colMap.EFFYY !== -1 ? colMap.EFFYY : 11),
                        getVal(r, colMap.EFFMM !== -1 ? colMap.EFFMM : 12),
                        getVal(r, colMap.TERYY !== -1 ? colMap.TERYY : 13),
                        getVal(r, colMap.TERMM !== -1 ? colMap.TERMM : 14),
                        getVal(r, colMap.DEDAMT !== -1 ? colMap.DEDAMT : 15),
                        getVal(r, colMap.POLICYNO !== -1 ? colMap.POLICYNO : 16),
                        getVal(r, colMap.AGENT !== -1 ? colMap.AGENT : 17)
                    ];
                }
            } else {
                processedRows[rowIndex] = r;
            }

            if (rowIndex % 10000 === 0 || rowIndex === totalRows - 1) {
                renderProgressBar(rowIndex + 1, totalRows, `Formatting ${sheetConfig.output}`);
            }
        }

        // Numeric sanitization and formatting
        for (let r = 1; r < processedRows.length; r++) {
            for (let c = 0; c < processedRows[r].length; c++) {
                let val = processedRows[r][c];
                if (val !== "") {
                    let cleanVal = String(val).replace(/,/g, '').trim();
                    let num = parseFloat(cleanVal);
                    if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(cleanVal)) {
                        if (c === 3) {
                            processedRows[r][c] = String(Math.round(num));
                        } else if (cleanVal.includes('.') || (sheetConfig.id === 'NETPAY' && c === 7) || (sheetConfig.id !== 'NETPAY' && c >= 12)) {
                            processedRows[r][c] = num.toFixed(2);
                        }
                    }
                }
            }
        }

        renderProgressBar(totalRows, totalRows, `Writing ${sheetConfig.output}`);
        
        // Fast direct CSV generation without XLSX.utils.aoa_to_sheet memory overhead
        let csvContent = "";
        const rowStrings = new Array(totalRows);
        for (let i = 0; i < totalRows; i++) {
            const row = processedRows[i];
            let rowStr = "";
            for (let j = 0; j < row.length; j++) {
                let val = row[j] !== undefined && row[j] !== null ? String(row[j]) : "";
                if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
                    val = '"' + val.replace(/"/g, '""') + '"';
                }
                rowStr += (j > 0 ? "," : "") + val;
            }
            rowStrings[i] = rowStr;
        }
        csvContent = rowStrings.join("\r\n");
        fs.writeFileSync(outPath, csvContent, 'utf8');
        process.stdout.write(`\r✔ [█████████████████████████] 100% | ${totalRows.toLocaleString()} rows | Saved ${sheetConfig.output} (${(csvContent.length / 1024 / 1024).toFixed(2)} MB)\n`);
        generatedFiles.push(sheetConfig.output);
    }

    // Update available_files.json manifest
    console.log(`\nUpdating available_files.json manifest...`);
    const allCsvs = fs.readdirSync(ROOT_DIR).filter(f => f.endsWith('.csv')).sort();
    fs.writeFileSync(path.resolve(ROOT_DIR, 'available_files.json'), JSON.stringify(allCsvs, null, 2), 'utf8');
    console.log(`✔ Manifest updated (${allCsvs.length} files total).`);

    return { generatedFiles, monthName: MONTH_NAMES[month], year };
}

function pushToGithub(monthName, year) {
    console.log(`\n============================================`);
    console.log(` Pushing to GitHub Main Branch`);
    console.log(`============================================`);
    try {
        const commitMsg = `Update: Add converted ${monthName} ${year} abstract CSVs`;
        console.log(`[1/3] Staging files: git add .`);
        execSync('git add .', { cwd: ROOT_DIR, stdio: 'inherit' });

        console.log(`[2/3] Committing: ${commitMsg}`);
        try {
            execSync(`git commit -m "${commitMsg}"`, { cwd: ROOT_DIR, stdio: 'inherit' });
        } catch(e) {
            console.log('No new changes to commit or working tree clean.');
        }

        console.log(`[3/3] Pushing: git push -u origin main`);
        execSync('git push -u origin main', { cwd: ROOT_DIR, stdio: 'inherit' });
        console.log(`\nSUCCESS: All files converted and published to GitHub!`);
    } catch (err) {
        console.error('Git push error:', err.message);
    }
}

// (2026-07-13) Support force flag & unquoted filenames; prev: basic args
const args = process.argv.slice(2);
const autoPush = !args.includes('--no-push');
const forceReconvert = args.includes('--force');
const filteredArgs = args.filter(a => a !== '--no-push' && a !== '--push' && a !== '--force');

let targetFile = null;
let customMonth = null;
let customYear = null;

if (filteredArgs.length > 0) {
    const fullJoined = filteredArgs.join(' ');
    targetFile = findFile(fullJoined);
    if (!targetFile) {
        targetFile = findFile(filteredArgs[0]);
        customMonth = filteredArgs[1];
        customYear = filteredArgs[2];
    }
} else {
    targetFile = findFile(null);
}

if (!targetFile) {
    console.error('ERROR: No Abstract Excel file (.xlsx or .xlsm) found.');
    console.log('Usage:');
    console.log('  node convert_abstract.js "path/to/Abstract-8.xlsx"');
    console.log('  .\\u "Abstract 8-2026.xlsx"');
    console.log('  .\\u Abstract-8');
    process.exit(1);
}

const result = convertFile(targetFile, customMonth, customYear, forceReconvert);
if (autoPush) {
    pushToGithub(result.monthName, result.year);
}
