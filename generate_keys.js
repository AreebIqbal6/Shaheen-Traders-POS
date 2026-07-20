import { spawn } from 'child_process';

const child = spawn('npx', ['tauri', 'signer', 'generate', '-w', 'src-tauri/shaheen.key'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true
});

child.stdin.write('ShaheenSecureKey2026!\n');

setTimeout(() => {
  child.stdin.write('ShaheenSecureKey2026!\n');
}, 1000);
