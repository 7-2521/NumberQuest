/* Persistence.
   - When served by server.js (Railway / node), state syncs to the server API so every
     computer in the family sees the same players and progress.
   - When opened as a plain file (or the API is unreachable) it falls back to localStorage. */
const Store = (() => {
  const KEY = 'numberquest.v1';
  const AVATARS = ['🦊', '🐼', '🦄', '🐸', '🐯', '🐙', '🦖', '🐨', '🦁', '🐧', '🐰', '🐲', '🐵', '🦋', '🐶', '🐱'];
  const COLORS = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff70a6', '#00b4d8'];

  let data = null;
  let remote = false;           // true when talking to server.js
  let synced = {};              // last JSON string sent per profile id / 'settings'
  let flushTimer = null;
  let familyKey = '';

  function blank() {
    return { version: 1, currentProfileId: null, settings: { sound: true, parentPin: '', unlockAll: false, dailyGoal: 3 }, profiles: [] };
  }

  function migrate(p) {
    p.lessons = p.lessons || {};
    p.facts = p.facts || {};
    p.history = p.history || [];
    p.stickers = p.stickers || [];
    p.badges = p.badges || [];
    p.arcade = p.arcade || {};
    p.streak = p.streak || { count: 0, last: null, best: 0 };
    p.daily = p.daily || { day: null, done: 0 };
    p.coins = p.coins || 0;
    p.xp = p.xp || 0;
    p.timeMs = p.timeMs || 0;
    p.theme = p.theme || 'sky';
  }
  function normalize(d) {
    if (!d.settings) d.settings = blank().settings;
    if (!d.profiles) d.profiles = [];
    d.profiles.forEach(migrate);
    return d;
  }

  /* ---------- remote API ---------- */
  const headers = () => ({ 'Content-Type': 'application/json', 'x-family-key': familyKey });
  async function api(method, path, body) {
    const res = await fetch('/api' + path, { method, headers: headers(), body: body ? JSON.stringify(body) : undefined });
    if (res.status === 401) throw Object.assign(new Error('unauthorized'), { unauthorized: true });
    if (!res.ok) throw new Error('API ' + res.status);
    return res.json();
  }

  async function load() {
    familyKey = localStorage.getItem(KEY + '.key') || '';
    const localId = localStorage.getItem(KEY + '.current') || null;
    if (location.protocol.startsWith('http')) {
      try {
        const d = await api('GET', '/state');
        remote = true;
        data = normalize(d);
        data.currentProfileId = localId;
        markSynced();
        return data;
      } catch (e) {
        if (e.unauthorized) { remote = true; data = null; throw e; }
        remote = false;
      }
    }
    try {
      const raw = localStorage.getItem(KEY);
      data = raw ? JSON.parse(raw) : blank();
    } catch (e) { data = blank(); }
    normalize(data);
    return data;
  }

  async function login(key) {
    familyKey = key;
    await api('GET', '/state');  // throws if wrong
    localStorage.setItem(KEY + '.key', key);
  }

  async function refresh() {
    if (!remote) return data;
    try {
      const d = normalize(await api('GET', '/state'));
      const cur = data.currentProfileId;
      data = d; data.currentProfileId = cur;
      markSynced();
    } catch (e) { /* keep what we have */ }
    return data;
  }

  function markSynced() {
    synced = {};
    for (const p of data.profiles) synced[p.id] = JSON.stringify(p);
    synced.settings = JSON.stringify(data.settings);
  }

  function save() {
    if (data.currentProfileId) localStorage.setItem(KEY + '.current', data.currentProfileId);
    else localStorage.removeItem(KEY + '.current');
    if (!remote) {
      try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { console.warn('save failed', e); }
      return;
    }
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 400);
  }

  async function flush() {
    if (!remote) return;
    const jobs = [];
    for (const p of data.profiles) {
      const s = JSON.stringify(p);
      if (synced[p.id] !== s) { synced[p.id] = s; jobs.push(api('PUT', '/profiles/' + p.id, p)); }
    }
    const ss = JSON.stringify(data.settings);
    if (synced.settings !== ss) { synced.settings = ss; jobs.push(api('PUT', '/settings', data.settings)); }
    try { await Promise.all(jobs); } catch (e) { console.warn('sync failed', e); U.toast('Could not save to server - check connection'); }
  }

  /* ---------- profiles ---------- */
  function newProfile(name, avatar, color) {
    const p = { id: U.uid(), name, avatar, color, createdAt: Date.now() };
    migrate(p);
    data.profiles.push(p);
    data.currentProfileId = p.id;
    save();
    return p;
  }
  const getProfile = id => data.profiles.find(p => p.id === id) || null;
  const current = () => getProfile(data.currentProfileId);
  function setCurrent(id) { data.currentProfileId = id; save(); }
  function deleteProfile(id) {
    data.profiles = data.profiles.filter(p => p.id !== id);
    delete synced[id];
    if (data.currentProfileId === id) data.currentProfileId = null;
    if (remote) api('DELETE', '/profiles/' + id).catch(() => U.toast('Could not delete on server'));
    save();
  }
  function resetProgress(id) {
    const p = getProfile(id); if (!p) return;
    for (const k of ['lessons', 'facts', 'history', 'stickers', 'badges', 'arcade', 'streak', 'daily', 'coins', 'xp', 'timeMs']) delete p[k];
    migrate(p);
    save();
  }

  /* ---------- progress recording ---------- */
  function touchStreak(p) {
    const today = U.todayKey();
    if (p.streak.last === today) return;
    if (p.streak.last && U.daysBetween(p.streak.last, today) === 1) p.streak.count += 1;
    else p.streak.count = 1;
    p.streak.last = today;
    p.streak.best = Math.max(p.streak.best || 0, p.streak.count);
  }
  function bumpDaily(p) {
    const today = U.todayKey();
    if (p.daily.day !== today) { p.daily.day = today; p.daily.done = 0; }
    p.daily.done += 1;
  }
  function addCoins(p, n) { p.coins = Math.max(0, (p.coins || 0) + n); if (n > 0) p.coinsEarned = (p.coinsEarned || 0) + n; }
  function addXp(p, n) { p.xp = (p.xp || 0) + n; }
  const level = xp => Math.floor(Math.sqrt((xp || 0) / 60)) + 1;
  const xpForLevel = lv => (lv - 1) * (lv - 1) * 60;

  function recordLesson(p, lessonId, r) {
    const prev = p.lessons[lessonId] || { stars: 0, attempts: 0, best: 0 };
    prev.attempts += 1;
    prev.stars = Math.max(prev.stars, r.stars);
    prev.best = Math.max(prev.best, r.total ? Math.round(100 * r.correct / r.total) : 0);
    prev.last = Date.now();
    if (r.stars > 0 && !prev.completedAt) prev.completedAt = Date.now();
    p.lessons[lessonId] = prev;
    p.history.push({ t: Date.now(), lesson: lessonId, correct: r.correct, total: r.total, ms: r.ms, stars: r.stars });
    if (p.history.length > 400) p.history = p.history.slice(-400);
    p.timeMs += r.ms || 0;
    addCoins(p, r.coins || 0); addXp(p, r.xp || 0);
    touchStreak(p); bumpDaily(p);
    save();
  }

  function recordFact(p, key, ok, ms) {
    const f = p.facts[key] || { c: 0, w: 0, ms: 0, n: 0 };
    if (ok) f.c += 1; else f.w += 1;
    if (ok && ms) { f.n += 1; f.ms = Math.round(f.ms + (ms - f.ms) / f.n); }
    f.t = Date.now();
    p.facts[key] = f;
  }

  function recordArcade(p, mode, score, ms, detail) {
    const a = p.arcade[mode] || { best: 0, plays: 0 };
    a.plays += 1; a.last = Date.now();
    if (score >= a.best) {
      a.best = score;
      if (detail) { a.bestCorrect = detail.correct; a.bestAcc = detail.acc; a.bestAvgMs = detail.avgMs; a.bestCombo = detail.combo; a.bestAt = Date.now(); }
    }
    if (detail) a.topCorrect = Math.max(a.topCorrect || 0, detail.correct);
    p.arcade[mode] = a;
    p.timeMs += ms || 0;
    touchStreak(p);
    save();
  }

  function exportJson() { return JSON.stringify(data, null, 2); }
  async function importJson(text) {
    const obj = JSON.parse(text);
    if (!obj || !Array.isArray(obj.profiles)) throw new Error('Not a Number Quest backup file');
    normalize(obj);
    if (remote) {
      await api('PUT', '/state', { settings: obj.settings, profiles: obj.profiles });
      data = obj; markSynced();
    } else {
      data = obj;
    }
    data.currentProfileId = null;
    save();
  }

  return {
    AVATARS, COLORS, load, login, refresh, save, flush,
    get data() { return data; }, get settings() { return data.settings; }, get remote() { return remote; },
    newProfile, getProfile, current, setCurrent, deleteProfile, resetProgress,
    recordLesson, recordFact, recordArcade, addCoins, addXp, level, xpForLevel, touchStreak,
    exportJson, importJson,
  };
})();
