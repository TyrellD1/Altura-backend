const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'file-based-caching', 'cache');

if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
    console.log(`Directory created: ${directoryPath}`);
} 
