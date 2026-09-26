const fs = require('fs');
const readline = require('readline');

const normalFilters = [
    'CALAMITY LOAN APDS',
    'CALAMITY LOAN AUTO',
    'DE102-RPSU CONS ADD-ON',
    'DE103-RPSU AGRI DIMINISHING',
    'DE104-RPSU CONS DIMINISHING',
    'DE999-HOUSEHOLD LOAN',
    'DEPED REDUCED INTEREST RATE PROMO',
    'RPSU - SPECIAL 7.5',
    'RPSU 6 TO 7 YEARS AT 9.66%',
    'RPSU 7 YEARS AT 9.66%',
    'RPSU02-RPSU CONS-NEW',
    'RPSU05-RPSU AGRI-ANIV',
    'RPSU06-RPSU CONS-ANIV',
    'RPSU07-5YR 7.5% CONS-ANIV',
    'SORDEPED.CONS.ANIV'
];

const autoFilters = [
    'AUTO 6 TO 7 YEARS AT 9.66%',
    'AUTO 7 YEARS AT 9.66%',
    'AUTO 7.5',
    'AUTO REDUCED INTEREST RATE PROMO',
    'AUTO02-AUTO CONS-NEW',
    'AUTO03-AUTO AGRI-ANIV',
    'AUTO04-AUTO CONS-ANIV'
];

function accountMatches(acc, filterList) {
    const sub = String(acc.sub || '').toUpperCase();
    const sc = String(acc.scheme || '').toUpperCase();
    for (const f of filterList) {
        const uf = f.toUpperCase();
        if (sub.includes(uf) || sc.includes(uf) || uf.includes(sub) || uf.includes(sc)) return true;
    }
    return false;
}

async function run() {
    const stream = fs.createReadStream('lcs_Sep232026.csv', { encoding: 'utf8' });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let header = null;
    let bogoNormal = 0;
    let bogoAuto = 0;
    for await (const line of rl) {
        if (!header) {
            header = line.split(',').map(h => h.replace(/^"|"$/g, '').trim());
            continue;
        }
        const p = line.split(',');
        const branch = p[1].replace(/^"|"$/g, '').trim().toUpperCase();
        if (branch !== 'BOGO') continue;
        const acc = {
            sub: p[5].replace(/^"|"$/g, '').trim(),
            scheme: p[6].replace(/^"|"$/g, '').trim()
        };
        if (accountMatches(acc, normalFilters)) bogoNormal++;
        if (accountMatches(acc, autoFilters)) bogoAuto++;
    }
    console.log('Bogo Normal matched:', bogoNormal, 'Bogo Autonomous matched:', bogoAuto);
}
run();
