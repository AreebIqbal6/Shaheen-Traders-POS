const fs = require('fs');

const lines = fs.readFileSync('C:\\Users\\Noman Traders\\.gemini\\antigravity\\brain\\c3d903e6-a563-4094-b585-e9299b4507fb\\.system_generated\\logs\\transcript.jsonl', 'utf-8').split('\n');

const requests = [];
for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.type === 'USER_INPUT' && data.content.includes('<USER_REQUEST>')) {
      const match = data.content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
      if (match && match[1]) {
        requests.push(match[1].trim());
      }
    }
  } catch (e) {}
}

fs.writeFileSync('user_requests_summary.md', requests.map((r, i) => `${i + 1}. ${r}`).join('\n\n'));
console.log('Saved to user_requests_summary.md');
