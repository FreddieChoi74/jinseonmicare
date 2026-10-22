const http = require('http');
const fs = require('fs');
const path = require('path');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const baseDir = __dirname;

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(baseDir, reqPath);

  if (req.method === 'POST' && reqPath === '/api/consult') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const logFile = path.join(baseDir, 'consult_requests.json');
        let list = [];
        if (fs.existsSync(logFile)) {
          try { list = JSON.parse(fs.readFileSync(logFile, 'utf8')); } catch (e) { list = []; }
        }
        list.push({ ...data, receivedAt: new Date().toISOString() });
        fs.writeFileSync(logFile, JSON.stringify(list, null, 2), 'utf8');
        console.log('\n[새 상담 접수 도착!]', data);
        res.writeHead(200, { 
          'Content-Type': 'application/json; charset=utf-8', 
          'Access-Control-Allow-Origin': '*' 
        });
        res.end(JSON.stringify({ success: true, message: '접수 완료' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3456, '0.0.0.0', () => {
  console.log('Jinseonmi Server listening on http://127.0.0.1:3456 (or http://localhost:3456)');
});
