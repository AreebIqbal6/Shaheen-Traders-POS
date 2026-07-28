const https = require('https');

https.get('https://shaheen-traders-pos.vercel.app/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/src="(\/assets\/index-[^"]*\.js)"/);
    if (match) {
      https.get('https://shaheen-traders-pos.vercel.app' + match[1], (res2) => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => {
          const urlMatch = data2.match(/https:\/\/[a-zA-Z0-9]*\.supabase\.co/g);
          console.log('Found URLs:', [...new Set(urlMatch)]);
          const keyMatch = data2.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+/g);
          if (keyMatch) {
            console.log('Found Anon Keys (first 50 chars):', [...new Set(keyMatch)].map(k => k.substring(0, 50) + '...'));
            // Write it out for the agent to easily grab
            const fs = require('fs');
            fs.writeFileSync('old_supabase_keys.txt', JSON.stringify({
              url: urlMatch ? urlMatch[0] : null,
              key: keyMatch ? keyMatch[0] : null
            }));
          }
        });
      });
    } else {
      console.log('No JS bundle found');
    }
  });
});
