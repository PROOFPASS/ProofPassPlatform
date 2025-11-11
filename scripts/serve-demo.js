#!/usr/bin/env node
/**
 * Simple HTTP server to serve the blockchain demo
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const HTML_FILE = path.join(__dirname, '..', 'apps', 'dashboard', 'public', 'blockchain-demo.html');

const server = http.createServer((req, res) => {
    console.log(`Request: ${req.method} ${req.url}`);

    if (req.url === '/' || req.url === '/blockchain-demo.html') {
        fs.readFile(HTML_FILE, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading file');
                return;
            }

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('🚀 ProofPass Blockchain Demo Server');
    console.log('═══════════════════════════════════════');
    console.log('');
    console.log(`✅ Server running at: http://localhost:${PORT}`);
    console.log('');
    console.log('📱 Open in your browser:');
    console.log(`   http://localhost:${PORT}/blockchain-demo.html`);
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('');
});
