const fs = require('fs');
let p = fs.readFileSync('package.json', 'utf8');
fs.writeFileSync('package.json', p.replace(/"version": "[^"]+"/, '"version": "0.5.37"'));
let t = fs.readFileSync('src-tauri/tauri.conf.json', 'utf8');
fs.writeFileSync('src-tauri/tauri.conf.json', t.replace(/"version": "[^"]+"/, '"version": "0.5.37"'));
let c = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
fs.writeFileSync('src-tauri/Cargo.toml', c.replace(/version = "[^"]+"/, 'version = "0.5.37"'));
