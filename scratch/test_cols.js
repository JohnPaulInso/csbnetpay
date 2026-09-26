const fs = require('fs');
const readline = require('readline');

async function findCols() {
    const stream = fs.createReadStream('lcs_Sep232026.csv', { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let header = null;
    const testValues = [
        'CALAMITY LOAN APDS',
        'CALAMITY LOAN AUTO',
        'DE102-RPSU CONS ADD-ON',
        'RPSU - SPECIAL 7.5',
        'RPSU 6 TO 7 YEARS AT 9.66%',
        'SORDEPED.CONS.ANIV',
        'AUTO 7.5',
        'AUTO02-AUTO CONS-NEW',
        'RPSU.575'
    ];
    const colFound = {};
    for await (const line of rl) {
        if (!header) {
            header = line.split(',').map(h => h.replace(/^"|"$/g, '').trim());
            continue;
        }
        testValues.forEach(val => {
            if (line.includes(val)) {
                const parts = line.split(',');
                parts.forEach((p, idx) => {
                    const clean = p.replace(/^"|"$/g, '').trim();
                    if (clean === val) {
                        colFound[val] = header[idx] + ' (col ' + idx + ')';
                    }
                });
            }
        });
        if (Object.keys(colFound).length >= testValues.length) break;
    }
    console.log(colFound);
}
findCols();
