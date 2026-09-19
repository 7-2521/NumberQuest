/* Number Quest server — serves the app and stores every player's progress in one JSON file.
   Zero dependencies. Run: node server.js   (PORT, DATA_DIR, FAMILY_PASSWORD are optional env vars)

   API (all JSON):
     GET    /api/state            -> { settings, profiles }
     PUT    /api/state            <- { settings, profiles }   (restore a backup)
     PUT    /api/settings         <- settings object
     PUT    /api/profiles/:id     <- profile object (upsert)
     DELETE /api/profiles/:id
   If FAMILY_PASSWORD is set, every /api request must send it in the x-family-key header. */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'state.json');
const PASSWORD = process.env.FAMILY_PASSWORD || '';
const ROOT = __dirname;

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

/* ---------- state ---------- */
let state = { settings: { sound: true, parentPin: '', unlockAll: false, dailyGoal: 3 }, profiles: [] };
function load() {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    const obj = JSON.parse(raw);
    if (obj && Array.isArray(obj.profiles)) state = { settings: obj.settings || state.settings, profiles: obj.profiles };
    console.log(`Loaded ${state.profiles.length} player(s) from ${FILE}`);
  } catch (e) {
    if (e.code !== 'ENOENT') console.error('Could not read state file:', e.message);
    else console.log(`No state file yet; will create ${FILE}`);
  }
}
let saveTimer = null;
function scheduleSave() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); }
function saveNow() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(state));
    fs.renameSync(tmp, FILE);
  } catch (e) { console.error('Save failed:', e.message); }
}
process.on('SIGTERM', () => { saveNow(); process.exit(0); });
process.on('SIGINT', () => { saveNow(); process.exit(0); });

/* ---------- helpers ---------- */
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 5e6) { reject(new Error('too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : null); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
const validId = id => /^[A-Za-z0-9_-]{1,40}$/.test(id);

async function api(req, res, url) {
  if (PASSWORD && req.headers['x-family-key'] !== PASSWORD) return json(res, 401, { error: 'unauthorized' });
  const parts = url.pathname.split('/').filter(Boolean); // ['api', ...]
  try {
    if (req.method === 'GET' && parts[1] === 'state') return json(res, 200, state);
    if (req.method === 'PUT' && parts[1] === 'state') {
      const body = await readBody(req);
      if (!body || !Array.isArray(body.profiles)) return json(res, 400, { error: 'bad state' });
      state = { settings: body.settings || state.settings, profiles: body.profiles };
      scheduleSave(); return json(res, 200, { ok: true });
    }
    if (req.method === 'PUT' && parts[1] === 'settings') {
      const body = await readBody(req);
      if (!body || typeof body !== 'object') return json(res, 400, { error: 'bad settings' });
      state.settings = body; scheduleSave(); return json(res, 200, { ok: true });
    }
    if (parts[1] === 'profiles' && parts[2] && validId(parts[2])) {
      const id = parts[2];
      if (req.method === 'PUT') {
        const body = await readBody(req);
        if (!body || body.id !== id) return json(res, 400, { error: 'bad profile' });
        const i = state.profiles.findIndex(p => p.id === id);
        if (i >= 0) state.profiles[i] = body; else state.profiles.push(body);
        scheduleSave(); return json(res, 200, { ok: true });
      }
      if (req.method === 'DELETE') {
        state.profiles = state.profiles.filter(p => p.id !== id);
        scheduleSave(); return json(res, 200, { ok: true });
      }
    }
    json(res, 404, { error: 'not found' });
  } catch (e) {
    json(res, 400, { error: e.message });
  }
}

function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  const file = path.normalize(path.join(ROOT, p));
  const rel = path.relative(ROOT, file);
  const blocked = /^(server\.js|package.*|data|node_modules|test|\.)/i;
  if (!file.startsWith(ROOT) || blocked.test(rel)) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
}

load();
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) return api(req, res, url);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  serveStatic(req, res, url);
}).listen(PORT, () => {
  console.log(`Number Quest running on http://localhost:${PORT}  (data: ${FILE}${PASSWORD ? ', password protected' : ''})`);
});
