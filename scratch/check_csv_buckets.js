const fs = require('fs');

console.log("Analyzing NPL BUCKET values in SUNLINE LCS.csv...");
const content = fs.readFileSync('SUNLINE LCS.csv', 'utf8');
const lines = content.split('\n');

const uniqueBuckets = new Set();
for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Parse CSV line simply
    const row = [];
    let insideQuote = false;
    let current = '';
    for (let k = 0; k < line.length; k++) {
        const char = line[k];
        if (char === '"') {
            insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
            row.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    row.push(current.trim());
    
    const bucket = row[51] ? row[51].replace(/^"|"$/g, '').trim() : '';
    if (bucket) {
        uniqueBuckets.add(bucket);
    }
}

const list = Array.from(uniqueBuckets);
console.log("Unique NPL BUCKET values count:", list.length);
console.log(JSON.stringify(list, null, 2));
