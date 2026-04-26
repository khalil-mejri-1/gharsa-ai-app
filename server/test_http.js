const http = require('http');

http.get('http://localhost:5001/api/messages/unread-count/69ecbcc3fee0a0177d9d7cdd', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data}`);
  });
}).on('error', (err) => {
  console.error(`Error: ${err.message}`);
});
