const fs = require('fs');
const c = fs.readFileSync('index6.html', 'utf8');
const lines = c.split('\n');
lines.forEach((l, idx) => {
    if (l.includes('activeMonthSelect') || l.includes('performSearch') || l.includes('monthSelect') || l.includes('currentData.month')) {
        console.log(idx + 1, l.trim());
    }
});
