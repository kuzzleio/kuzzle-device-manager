const fs = require('fs');

const packageVersion = JSON.parse(fs.readFileSync('../package.json', 'utf-8')).version;

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));

packageJson.version = packageVersion;

fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));