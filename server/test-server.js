const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify({ status: 'OK', message: 'Test server works!' }));
});

server.listen(3001, '0.0.0.0', () => {
  console.log('✅ Test server running on:');
  console.log('   http://localhost:3001');
  console.log('   http://127.0.0.1:3001');
  console.log('   http://YOUR_IP:3001');
});
