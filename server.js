/**
 * ChronoLog Local Development & Data API Server
 * Uses built-in Node.js modules - NO npm install required!
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const DATA_FILE = path.join(__dirname, 'js', 'modern-data.js');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper to read modern-data.js content as JSON object
function readDataFromDisk() {
  try {
    const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
    const startIdx = fileContent.indexOf('{');
    const endIdx = fileContent.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) return null;
    const jsonStr = fileContent.substring(startIdx, endIdx + 1);
    // Safe evaluation in function scope
    return (new Function('return ' + jsonStr))();
  } catch (err) {
    console.error('Error reading modern-data.js:', err);
    return null;
  }
}

// Helper to write JSON object back to js/modern-data.js
function writeDataToDisk(data) {
  try {
    const fileHeader = `/**\n * Modern History Timeline Data (Offline Fallback & Local Storage)\n * Spectrum's Modern History of India (1707 - 1947)\n */\n\nconst modernTimelineData = `;
    const content = fileHeader + JSON.stringify(data, null, 2) + ';\n';
    fs.writeFileSync(DATA_FILE, content, 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to modern-data.js:', err);
    return false;
  }
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === '/api/events' && req.method === 'GET') {
    const data = readDataFromDisk();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data || { events: [] }));
    return;
  }

  if (pathname === '/api/events' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const newEvent = JSON.parse(body);
        const currentData = readDataFromDisk() || {
          title: { text: { headline: "Modern History" } },
          events: []
        };

        if (!currentData.events) currentData.events = [];
        
        // Add unique ID or timestamp
        newEvent.id = newEvent.id || 'evt_' + Date.now();
        currentData.events.push(newEvent);

        // Sort events chronologically by start year
        currentData.events.sort((a, b) => {
          const yearA = parseInt(a.start_date?.year || 0, 10);
          const yearB = parseInt(b.start_date?.year || 0, 10);
          return yearA - yearB;
        });

        writeDataToDisk(currentData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, event: newEvent, total: currentData.events.length }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/events/update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const updatedEvent = JSON.parse(body);
        const currentData = readDataFromDisk();
        if (!currentData || !currentData.events) {
          throw new Error('No events found');
        }

        const idx = currentData.events.findIndex(e => e.id === updatedEvent.id || e.text?.headline === updatedEvent.text?.headline);
        if (idx !== -1) {
          currentData.events[idx] = updatedEvent;
          writeDataToDisk(currentData);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Event not found' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/events/delete' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { id, headline } = JSON.parse(body);
        const currentData = readDataFromDisk();
        if (!currentData || !currentData.events) {
          throw new Error('No events found');
        }

        currentData.events = currentData.events.filter(e => {
          if (id && e.id === id) return false;
          if (headline && e.text?.headline === headline) return false;
          return true;
        });

        writeDataToDisk(currentData);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, remaining: currentData.events.length }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  if (pathname === '/' || pathname === '') {
    pathname = '/modern.html';
  }

  const filePath = path.join(__dirname, pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  🏛️ ChronoLog Server Running at http://localhost:${PORT}`);
  console.log(`  📊 Timeline View: http://localhost:${PORT}/modern.html`);
  console.log(`  ✍️ Data Entry Studio: http://localhost:${PORT}/editor.html`);
  console.log(`=======================================================`);
});
