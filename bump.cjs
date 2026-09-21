const fs = require('fs');
const version = require('./package.json').version;
let t = fs.readFileSync('src-tauri/tauri.conf.json', 'utf8');
fs.writeFileSync('src-tauri/tauri.conf.json', t.replace(/"version": "[^"]+"/, `"version": "${version}"`));
let c = fs.readFileSync('src-tauri/Cargo.toml', 'utf8');
fs.writeFileSync('src-tauri/Cargo.toml', c.replace(/version = "[^"]+"/, `version = "${version}"`));
console.log(`Synced Tauri versions to ${version}`);
