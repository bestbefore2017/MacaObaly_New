const http = require('http');

const url = 'https://api.storyblok.com/v1/cdn/stories?token=VdLWwVoZVAbmH4X3E93rhwtt&version=draft&starts_with=categories/&per_page=100';

const req = http.request(url, {
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    json.stories.forEach(s => {
      if (!s.parent_id || s.parent_id === 0) {
        console.log(`${s.slug}: ${s.uuid}`);
      }
    });
  });
});

req.on('error', console.error);
req.end();
