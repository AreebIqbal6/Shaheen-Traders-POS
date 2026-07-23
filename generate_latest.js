import fs from 'fs';
import path from 'path';

const version = '0.1.4';
const nsisDir = path.join('src-tauri', 'target', 'release', 'bundle', 'nsis');

const files = fs.readdirSync(nsisDir);
const sigFile = files.find(f => f.endsWith('.zip.sig'));

if (!sigFile) {
  console.error('Error: .zip.sig file not found. Tauri did not generate the updater bundle.');
  process.exit(1);
}

const signature = fs.readFileSync(path.join(nsisDir, sigFile), 'utf-8');
const zipName = sigFile.replace('.sig', '');

const latestJson = {
  version: version,
  notes: "Enabled OTA Auto-Updater and added Update button",
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature: signature,
      url: `https://github.com/AreebIqbal6/Shaheen-Traders-POS/releases/download/v${version}/${zipName}`
    }
  }
};

fs.writeFileSync('latest.json', JSON.stringify(latestJson, null, 2));
console.log('Successfully generated latest.json');
