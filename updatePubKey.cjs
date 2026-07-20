const fs = require('fs');
let data = fs.readFileSync('src-tauri/tauri.conf.json', 'utf8');
const pubKey = fs.readFileSync('shaheen.key.pub', 'utf8').trim();
data = data.replace(/"pubkey":\s*"[^"]*"/, '"pubkey": "' + pubKey + '"');
fs.writeFileSync('src-tauri/tauri.conf.json', data);
console.log('Done');
