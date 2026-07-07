const fs = require('fs');
const path = require('path');

const directoryPath = __dirname;
const files = fs.readdirSync(directoryPath);

const csvFiles = files.filter(file => file.endsWith('.csv'));

const manifest = {
    netpay: csvFiles.filter(f => /^[a-z]{3}\d{2}\.csv$/.test(f)),
    pos: csvFiles.filter(f => /^pos_[a-z]{3}\d{2}\.csv$/.test(f)),
    onq: csvFiles.filter(f => /^onq_[a-z]{3}\d{2}\.csv$/.test(f)),
    pli: csvFiles.filter(f => /^pli_[a-z]{3}\d{2}\.csv$/.test(f))
};

fs.writeFileSync(path.join(directoryPath, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Successfully generated manifest.json with ' + csvFiles.length + ' CSV files!');
