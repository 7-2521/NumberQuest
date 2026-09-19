/* Shared helpers: randomness, DOM, sound, confetti, dates */
const U = (() => {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const pad2 = n => String(n).padStart(2, '0');
  const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const daysBetween = (k1, k2) => Math.round((new Date(k2) - new Date(k1)) / 86400000);
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // el('div.card.big', {onclick: fn, html: '...'}, child, child...)
  function el(spec, attrs = {}, ...children) {
    // spec: tag, optional #id, optional .classes in any order, e.g. 'div.card#main' or 'div#main.card'
    const tag = (spec.match(/^[a-z0-9-]+/i) || ['div'])[0];
    const node = document.createElement(tag);
    const id = spec.match(/#([\w-]+)/);
    if (id) node.id = id[1];
    const classes = [...spec.matchAll(/\.([\w-]+)/g)].map(m => m[1]);
    if (classes.length) node.className = classes.join(' ');
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null) continue;
      if (k === 'html') node.innerHTML = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else node.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }

  function toast(msg, ms = 1800) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), ms);
  }

  const fmtTime = ms => {
    const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000);
    return m ? `${m}m ${s}s` : `${s}s`;
  };

  return { rand, pick, shuffle, clamp, todayKey, daysBetween, uid, esc, el, toast, fmtTime };
})();

/* Tiny synth for feedback sounds (no audio files needed) */
const Sound = (() => {
  let ctx = null;
  let enabled = true;
  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, start, dur, type = 'sine', vol = 0.18) {
    const c = ensure(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g); g.connect(c.destination);
    o.start(c.currentTime + start); o.stop(c.currentTime + start + dur + 0.05);
  }
  const fx = {
    tap: () => tone(600, 0, 0.06, 'triangle', 0.08),
    correct: () => { tone(523, 0, 0.12); tone(659, 0.1, 0.12); tone(784, 0.2, 0.2); },
    wrong: () => { tone(220, 0, 0.18, 'square', 0.08); tone(180, 0.15, 0.22, 'square', 0.08); },
    coin: () => { tone(988, 0, 0.08, 'square', 0.08); tone(1319, 0.08, 0.18, 'square', 0.08); },
    star: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.25)),
    fanfare: () => [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.15)),
    tick: () => tone(880, 0, 0.04, 'sine', 0.05),
  };
  return {
    setEnabled(v) { enabled = !!v; },
    play(name) { if (enabled && fx[name]) fx[name](); },
    unlock() { ensure(); },
  };
})();

/* Confetti burst on a full-screen canvas */
const Confetti = (() => {
  let parts = [], raf = null;
  const colors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff924c', '#ff70a6'];
  function burst(n = 120) {
    const cv = document.getElementById('confetti');
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    for (let i = 0; i < n; i++) {
      parts.push({
        x: cv.width / 2 + (Math.random() - 0.5) * cv.width * 0.5, y: cv.height * 0.35,
        vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4,
        w: 6 + Math.random() * 8, h: 6 + Math.random() * 10,
        color: U.pick(colors), rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, life: 1,
      });
    }
    if (!raf) frame();
  }
  function frame() {
    const cv = document.getElementById('confetti');
    const g = cv.getContext('2d');
    g.clearRect(0, 0, cv.width, cv.height);
    parts = parts.filter(p => p.life > 0);
    for (const p of parts) {
      p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.008;
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = Math.max(0, p.life);
      g.fillStyle = p.color; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
    }
    if (parts.length) raf = requestAnimationFrame(frame);
    else { raf = null; g.clearRect(0, 0, cv.width, cv.height); }
  }
  return { burst };
})();

/* Simple modal dialogs (no native alert/confirm) */
const UI = (() => {
  function modal(build) {
    return new Promise(resolve => {
      const back = U.el('div.modal-back');
      const box = U.el('div.modal');
      const close = v => { back.remove(); resolve(v); };
      build(box, close);
      back.appendChild(box);
      back.addEventListener('click', e => { if (e.target === back) close(null); });
      document.body.appendChild(back);
    });
  }
  const confirm = (msg, okText = 'Yes', cancelText = 'Cancel') => modal((box, close) => {
    box.appendChild(U.el('p.modal-msg', { html: msg }));
    box.appendChild(U.el('div.btn-row', {},
      U.el('button.btn.ghost', { onclick: () => close(false) }, cancelText),
      U.el('button.btn.primary', { onclick: () => close(true) }, okText)));
  });
  const alert = msg => modal((box, close) => {
    box.appendChild(U.el('p.modal-msg', { html: msg }));
    box.appendChild(U.el('div.btn-row', {}, U.el('button.btn.primary', { onclick: () => close(true) }, 'OK')));
  });
  const prompt = (msg, opts = {}) => modal((box, close) => {
    box.appendChild(U.el('p.modal-msg', { html: msg }));
    const input = U.el('input.text-input', { type: opts.type || 'text', placeholder: opts.placeholder || '', value: opts.value || '', maxlength: opts.maxlength || 40, inputmode: opts.inputmode || null });
    box.appendChild(input);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') close(input.value); });
    box.appendChild(U.el('div.btn-row', {},
      U.el('button.btn.ghost', { onclick: () => close(null) }, 'Cancel'),
      U.el('button.btn.primary', { onclick: () => close(input.value) }, opts.okText || 'OK')));
    setTimeout(() => input.focus(), 50);
  });
  return { modal, confirm, alert, prompt };
})();
