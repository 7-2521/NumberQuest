/* Grown-ups area: progress dashboard for every child, settings, backup/restore */
const Parent = (() => {
  const { el } = U;

  async function gate() {
    const pin = Store.settings.parentPin;
    if (pin) {
      const v = await UI.prompt('Enter the grown-up PIN', { type: 'password', inputmode: 'numeric', placeholder: 'PIN' });
      if (v === null) return;
      if (v !== pin) { U.toast('Wrong PIN'); return; }
    } else {
      const a = U.rand(6, 9), b = U.rand(6, 9);
      const v = await UI.prompt(`Grown-ups only! What is <b>${a} × ${b}</b>?`, { inputmode: 'numeric', placeholder: 'Answer' });
      if (v === null) return;
      if (Number(v) !== a * b) { U.toast('Not quite - ask a grown-up'); return; }
    }
    await Store.refresh();
    dashboard();
  }

  function stat(label, value) { return el('div.stat', {}, el('span.stat-val', { html: String(value) }), el('span.stat-label', { text: label })); }

  function dashboard() {
    const app = document.getElementById('app');
    app.innerHTML = ''; app.className = 'screen parent-screen';
    app.appendChild(Screens.topbar('👪 Grown-ups', () => Screens.profiles()));
    const data = Store.data;
    if (!data.profiles.length) app.appendChild(el('p.lead', { text: 'No players yet. Go back and add one!' }));
    data.profiles.forEach(p => app.appendChild(childCard(p)));
    app.appendChild(settingsCard());
    app.appendChild(backupCard());
  }

  function childCard(p) {
    const card = el('div.card.child-card');
    const lessonsDone = Object.values(p.lessons).filter(l => l.stars > 0).length;
    const totalStars = Object.values(p.lessons).reduce((s, l) => s + (l.stars || 0), 0);
    const recent = p.history.slice(-20);
    const acc = recent.length ? Math.round(100 * recent.reduce((s, h) => s + h.correct, 0) / Math.max(1, recent.reduce((s, h) => s + h.total, 0))) : null;
    const last = p.streak.last ? new Date(p.streak.last + 'T12:00:00') : null;
    card.appendChild(el('div.child-head', {},
      el('span.avatar', { text: p.avatar, style: { background: p.color } }),
      el('div', {}, el('h3', { text: p.name }), el('div.muted', { text: `Level ${Store.level(p.xp)} · ${p.coins} coins · ${p.streak.count || 0} day streak` }))));
    card.appendChild(el('div.stat-row', {},
      stat('Lessons done', `${lessonsDone} / ${Curriculum.LESSONS.length}`),
      stat('Stars', `${totalStars} ★`),
      stat('Recent accuracy', acc == null ? '–' : `${acc}%`),
      stat('Time played', U.fmtTime(p.timeMs)),
      stat('Last played', last ? last.toLocaleDateString() : 'never')));

    // per-world progress
    const worlds = el('div.world-bars');
    Curriculum.WORLDS.forEach(w => {
      const pr = Curriculum.worldProgress(p, w);
      worlds.appendChild(el('div.world-bar', {},
        el('span.wb-name', { text: `${w.icon} ${w.name}` }),
        el('div.progress-bar', {}, el('div.progress-fill', { style: { width: `${100 * pr.done / pr.total}%`, background: w.color } })),
        el('span.wb-val', { text: `${pr.done}/${pr.total} · ${pr.stars}★` })));
    });
    card.appendChild(worlds);

    // lesson detail (collapsible)
    const det = el('details.lesson-details', {}, el('summary', { text: 'Lesson-by-lesson' }));
    const tbl = el('table.lesson-table');
    tbl.appendChild(el('tr', {}, el('th', { text: 'Lesson' }), el('th', { text: 'Stars' }), el('th', { text: 'Best' }), el('th', { text: 'Tries' })));
    Curriculum.LESSONS.forEach(l => {
      const r = p.lessons[l.id];
      if (!r) return;
      tbl.appendChild(el('tr', {}, el('td', { text: `${l.world.icon} ${l.title}` }), el('td', { text: '★'.repeat(r.stars) + '☆'.repeat(3 - r.stars) }), el('td', { text: `${r.best}%` }), el('td', { text: String(r.attempts) })));
    });
    det.appendChild(tbl);
    card.appendChild(det);

    // trouble facts
    const weak = Object.entries(p.facts).map(([k, f]) => ({ k, f })).filter(x => x.f.w >= 2 && x.f.w >= x.f.c * 0.4).sort((a, b) => (b.f.w - b.f.c) - (a.f.w - a.f.c)).slice(0, 8);
    if (weak.length) {
      const sym = { add: '+', sub: '−', mul: '×', div: '÷' };
      card.appendChild(el('div.weak', {}, el('b', { text: 'Facts to work on: ' }), ...weak.map(x => { const [op, a, b] = x.k.split(':'); return el('span.weak-fact', { text: `${a} ${sym[op]} ${b}`, title: `${x.f.c} right, ${x.f.w} wrong` }); })));
    }

    card.appendChild(el('div.btn-row.left', {},
      el('button.btn.ghost.small', { onclick: async () => { const n = await UI.prompt('Rename player', { value: p.name, maxlength: 16 }); if (n && n.trim()) { p.name = n.trim(); Store.save(); dashboard(); } } }, '✏️ Rename'),
      el('button.btn.ghost.small', { onclick: async () => { if (await UI.confirm(`Reset ALL progress for ${p.name}? This cannot be undone.`, 'Reset')) { Store.resetProgress(p.id); dashboard(); } } }, '↺ Reset progress'),
      el('button.btn.ghost.small.danger', { onclick: async () => { if (await UI.confirm(`Delete ${p.name}'s player completely?`, 'Delete')) { Store.deleteProfile(p.id); dashboard(); } } }, '🗑️ Delete')));
    return card;
  }

  function settingsCard() {
    const s = Store.settings;
    const card = el('div.card');
    card.appendChild(el('h3', { text: '⚙️ Settings' }));
    const row = (label, control) => el('div.setting-row', {}, el('span', { text: label }), control);
    const toggle = (val, fn) => el('button.toggle' + (val ? '.on' : ''), { onclick: e => { fn(!val); Store.save(); settingsRefresh(); } }, val ? 'On' : 'Off');
    card.appendChild(row('Sounds', toggle(s.sound, v => { s.sound = v; Sound.setEnabled(v); })));
    const dark = Screens.Dark;
    card.appendChild(row('Dark mode (this device)', el('div.seg', {}, ...['auto', 'on', 'off'].map(m => el('button.seg-btn' + (dark.mode === m ? '.on' : ''), { onclick: () => { dark.mode = m; settingsRefresh(); } }, m === 'auto' ? 'Auto' : m === 'on' ? 'On' : 'Off')))));
    card.appendChild(row('Unlock all lessons (skip the path)', toggle(s.unlockAll, v => { s.unlockAll = v; })));
    card.appendChild(row('Daily goal (lessons per day)', el('div.stepper', {},
      el('button.btn.ghost.small', { onclick: () => { s.dailyGoal = Math.max(1, s.dailyGoal - 1); Store.save(); settingsRefresh(); } }, '−'),
      el('b', { text: String(s.dailyGoal) }),
      el('button.btn.ghost.small', { onclick: () => { s.dailyGoal = Math.min(10, s.dailyGoal + 1); Store.save(); settingsRefresh(); } }, '+'))));
    card.appendChild(row('Grown-up PIN', el('button.btn.ghost.small', {
      onclick: async () => {
        const v = await UI.prompt('Set a PIN for this area (leave empty to remove it). Without a PIN, a multiplication question is asked instead.', { type: 'password', inputmode: 'numeric', value: '' });
        if (v === null) return;
        s.parentPin = v.trim(); Store.save(); U.toast(v.trim() ? 'PIN set' : 'PIN removed'); settingsRefresh();
      },
    }, s.parentPin ? 'Change / remove' : 'Set PIN')));
    card.appendChild(el('p.muted.small', { text: Store.remote ? 'Progress is saved on the server and shared by every device that opens this site.' : 'Progress is saved in this browser only. Use Backup to move it to another device.' }));
    return card;
  }
  function settingsRefresh() { dashboard(); }

  function backupCard() {
    const card = el('div.card');
    card.appendChild(el('h3', { text: '💾 Backup & restore' }));
    card.appendChild(el('p.muted', { text: 'Download a backup file with every player\'s progress, or restore from one.' }));
    const file = el('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
    file.addEventListener('change', async () => {
      const f = file.files[0]; if (!f) return;
      try {
        const text = await f.text();
        if (!(await UI.confirm('Restore this backup? It replaces all current players and progress.', 'Restore'))) return;
        await Store.importJson(text);
        U.toast('Backup restored'); dashboard();
      } catch (e) { UI.alert('Could not read that file: ' + e.message); }
    });
    card.appendChild(file);
    card.appendChild(el('div.btn-row.left', {},
      el('button.btn.secondary.small', {
        onclick: () => {
          const blob = new Blob([Store.exportJson()], { type: 'application/json' });
          const a = el('a', { href: URL.createObjectURL(blob), download: `number-quest-backup-${U.todayKey()}.json` });
          document.body.appendChild(a); a.click(); a.remove();
        },
      }, '⬇️ Download backup'),
      el('button.btn.ghost.small', { onclick: () => file.click() }, '⬆️ Restore from file')));
    return card;
  }

  return { gate, dashboard };
})();
