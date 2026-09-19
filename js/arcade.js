/* Arcade: timed fact drills with a scoring system (accuracy + speed + combos) and a family leaderboard per drill.
   Kept separate from lessons so lesson practice never feels like a timed test. */
const Arcade = (() => {
  const { el } = U;
  const DURATION = 60;
  const T = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const DRILLS = [
    { id: 'add10', group: 'Addition', name: 'Add to 10', icon: '➕', color: '#8ac926', gen: { type: 'addFacts', max: 10 } },
    { id: 'add20', group: 'Addition', name: 'Add to 20', icon: '➕', color: '#8ac926', gen: { type: 'addFacts', min: 5, max: 20 } },
    { id: 'doubles', group: 'Addition', name: 'Doubles', icon: '👯', color: '#8ac926', gen: { type: 'addFacts', max: 24, doubles: true } },
    { id: 'sub10', group: 'Subtraction', name: 'Subtract to 10', icon: '➖', color: '#ff924c', gen: { type: 'subFacts', max: 10 } },
    { id: 'sub20', group: 'Subtraction', name: 'Subtract to 20', icon: '➖', color: '#ff924c', gen: { type: 'subFacts', min: 5, max: 20 } },
    ...T.map(t => ({ id: 'x' + t, group: 'Times Tables', name: `×${t} table`, icon: '✖️', color: '#6a4c93', gen: { type: 'mulFacts', tables: [t], minFactor: 1, maxFactor: 12 } })),
    { id: 'xall10', group: 'Times Tables', name: 'All tables to 10', icon: '🏆', color: '#6a4c93', gen: { type: 'mulFacts', tables: T.slice(0, 9), minFactor: 1, maxFactor: 10 } },
    { id: 'xall12', group: 'Times Tables', name: 'All tables to 12', icon: '👑', color: '#6a4c93', gen: { type: 'mulFacts', tables: T, minFactor: 1, maxFactor: 12 } },
    { id: 'div10', group: 'Division', name: 'Division facts to 10', icon: '➗', color: '#1982c4', gen: { type: 'divFacts', tables: T.slice(0, 9), maxQuotient: 10 } },
    { id: 'div12', group: 'Division', name: 'Division facts to 12', icon: '➗', color: '#1982c4', gen: { type: 'divFacts', tables: T, maxQuotient: 12 } },
    { id: 'mix', group: 'Mixed', name: 'Mixed Mayhem', icon: '🌪️', color: '#ff70a6', gen: { type: 'mixed', gens: [{ type: 'addFacts', max: 20 }, { type: 'subFacts', max: 20 }, { type: 'mulFacts', tables: T.slice(0, 9), maxFactor: 10 }, { type: 'divFacts', tables: T.slice(0, 9), maxQuotient: 10 }] } },
  ];
  const GROUPS = [...new Set(DRILLS.map(d => d.group))];
  const drillById = id => DRILLS.find(d => d.id === id);

  // Scoring: +10 per correct, speed bonus (+5 under 2s, +3 under 4s), +20 every 5-in-a-row combo, −5 per miss
  const SCORING = { correct: 10, fast: 5, quick: 3, combo: 20, comboEvery: 5, miss: 5 };
  function pointsFor(ms, combo) {
    let pts = SCORING.correct;
    if (ms < 2000) pts += SCORING.fast; else if (ms < 4000) pts += SCORING.quick;
    if (combo > 0 && combo % SCORING.comboEvery === 0) pts += SCORING.combo;
    return pts;
  }

  /* ---------- leaderboard (all players, from shared data) ---------- */
  function leaderboard(drillId) {
    return Store.data.profiles
      .map(p => ({ p, a: p.arcade[drillId] }))
      .filter(x => x.a && x.a.best > 0)
      .sort((x, y) => y.a.best - x.a.best || (y.a.bestCorrect || 0) - (x.a.bestCorrect || 0));
  }
  function rankOf(drillId, profile) {
    const lb = leaderboard(drillId);
    const i = lb.findIndex(x => x.p.id === profile.id);
    return { rank: i + 1, of: lb.length };
  }
  function leaderTable(drillId, highlightId) {
    const lb = leaderboard(drillId);
    if (!lb.length) return el('p.muted.center', { text: 'No scores yet — be the first!' });
    const tbl = el('table.lb-table');
    tbl.appendChild(el('tr', {}, el('th', { text: '#' }), el('th', { text: 'Player' }), el('th', { text: 'Score' }), el('th', { text: 'Right' }), el('th', { text: 'Speed' })));
    lb.forEach((x, i) => {
      const medal = ['🥇', '🥈', '🥉'][i] || `${i + 1}`;
      tbl.appendChild(el('tr' + (x.p.id === highlightId ? '.me' : ''), {},
        el('td', { text: medal }),
        el('td', {}, el('span.avatar.tiny', { text: x.p.avatar, style: { background: x.p.color } }), ' ' + x.p.name),
        el('td', {}, el('b', { text: String(x.a.best) })),
        el('td', { text: `${x.a.bestCorrect || 0}${x.a.bestAcc != null ? ` (${x.a.bestAcc}%)` : ''}` }),
        el('td', { text: x.a.bestAvgMs ? (x.a.bestAvgMs / 1000).toFixed(1) + 's' : '–' })));
    });
    return tbl;
  }

  let S = null;
  let group = GROUPS[2]; // default to Times Tables

  /* ---------- menu ---------- */
  async function menu() {
    S = null;
    await Store.refresh();
    const p = Store.current();
    const app = document.getElementById('app');
    app.innerHTML = ''; app.className = 'screen arcade-screen';
    app.appendChild(Screens.topbar('🕹️ Arcade', () => Screens.home(), `🪙 ${p.coins}`));
    app.appendChild(el('p.lead', { text: '60-second drills. Answer fast and keep your combo going to score big!' }));
    const tabs = el('div.tabs');
    GROUPS.forEach(g => tabs.appendChild(el('button.tab' + (group === g ? '.on' : ''), { onclick: () => { group = g; menu(); } }, g)));
    tabs.appendChild(el('button.tab', { onclick: () => leaderScreen() }, '🏆 Leaderboard'));
    app.appendChild(tabs);
    const grid = el('div.mode-grid');
    DRILLS.filter(d => d.group === group).forEach(d => {
      const a = p.arcade[d.id] || {};
      const lb = leaderboard(d.id);
      const top = lb[0];
      grid.appendChild(el('button.mode-card', { style: { '--c': d.color }, onclick: () => start(d) },
        el('span.mode-icon', { text: d.icon }), el('span.mode-name', { text: d.name }),
        el('span.mode-best', { text: a.best ? `Your best: ${a.best}` : 'Not played yet' }),
        top ? el('span.mode-top', { text: `${top.p.avatar} ${top.p.name}: ${top.a.best}` }) : null));
    });
    app.appendChild(grid);
    app.appendChild(el('div.card.scoring-card', { html: `<b>How scoring works</b><br>+${SCORING.correct} for each right answer · +${SCORING.fast} speed bonus under 2 seconds (+${SCORING.quick} under 4) · +${SCORING.combo} every ${SCORING.comboEvery} in a row · −${SCORING.miss} for a miss` }));
  }

  async function leaderScreen(drillId) {
    await Store.refresh();
    const p = Store.current();
    drillId = drillId || (DRILLS.find(d => d.group === group) || DRILLS[0]).id;
    const app = document.getElementById('app');
    app.innerHTML = ''; app.className = 'screen arcade-screen';
    app.appendChild(Screens.topbar('🏆 Leaderboard', () => menu()));
    const sel = el('select.select');
    GROUPS.forEach(g => {
      const og = el('optgroup', { label: g });
      DRILLS.filter(d => d.group === g).forEach(d => og.appendChild(el('option', { value: d.id, text: `${d.icon} ${d.name}`, selected: d.id === drillId ? 'selected' : null })));
      sel.appendChild(og);
    });
    sel.addEventListener('change', () => leaderScreen(sel.value));
    app.appendChild(el('div.card', {}, el('p.label', { text: 'Drill' }), sel, leaderTable(drillId, p.id)));
    // hall of fame: top player per drill
    const hof = el('div.card');
    hof.appendChild(el('h3', { text: '👑 Hall of Fame' }));
    const list = el('div.hof');
    DRILLS.forEach(d => { const top = leaderboard(d.id)[0]; if (top) list.appendChild(el('div.hof-row', { html: `<span>${d.icon} ${d.name}</span><b>${top.p.avatar} ${U.esc(top.p.name)} — ${top.a.best}</b>` })); });
    if (!list.children.length) list.appendChild(el('p.muted', { text: 'No scores yet.' }));
    hof.appendChild(list);
    app.appendChild(hof);
    const btns = el('div.btn-row');
    btns.appendChild(el('button.btn.primary', { onclick: () => start(drillById(drillId)) }, `Play ${drillById(drillId).name} ▶`));
    app.appendChild(btns);
  }

  /* ---------- game ---------- */
  function start(drill) {
    const p = Store.current();
    S = { drill, profile: p, score: 0, correct: 0, wrong: 0, combo: 0, bestCombo: 0, times: [], typed: '', problem: null, t0: Date.now(), left: DURATION, timer: null, done: false, flash: null, countdown: 3, popup: null };
    renderCountdown();
  }
  function renderCountdown() {
    const app = document.getElementById('app');
    app.innerHTML = ''; app.className = 'screen arcade-screen';
    app.appendChild(el('div.countdown', { text: S.countdown > 0 ? S.countdown : 'GO!' }));
    app.appendChild(el('p.lead.center', { text: `${S.drill.icon} ${S.drill.name}` }));
    Sound.play(S.countdown > 0 ? 'tick' : 'star');
    setTimeout(() => {
      if (!S) return;
      if (S.countdown > 0) { S.countdown--; renderCountdown(); }
      else { S.t0 = Date.now(); nextProblem(); S.timer = setInterval(tick, 200); render(); }
    }, 700);
  }
  function tick() {
    if (!S) return;
    S.left = Math.max(0, DURATION - (Date.now() - S.t0) / 1000);
    const bar = document.getElementById('timebar');
    if (bar) bar.style.width = `${100 * S.left / DURATION}%`;
    const lbl = document.getElementById('timelbl');
    if (lbl) lbl.textContent = Math.ceil(S.left);
    if (S.left <= 0) finish();
  }
  function nextProblem() {
    let q = Gen.make(S.drill.gen, S.profile), guard = 0;
    while (S.problem && q.text === S.problem.text && guard++ < 10) q = Gen.make(S.drill.gen, S.profile);
    S.problem = q; S.typed = ''; S.pt0 = Date.now();
  }

  function render() {
    const app = document.getElementById('app');
    app.innerHTML = ''; app.className = 'screen arcade-screen';
    app.style.setProperty('--world', S.drill.color);
    app.appendChild(el('div.arcade-top', {},
      el('button.icon-btn', { onclick: () => { stop(); menu(); } }, '✕'),
      el('div.arcade-score', { html: `⭐ <b>${S.score}</b>` }),
      S.combo >= 2 ? el('div.combo', { text: `🔥 ${S.combo} combo` }) : null,
      el('div.arcade-time', { html: `⏱️ <b id="timelbl">${Math.ceil(S.left)}</b>` })));
    app.appendChild(el('div.progress-bar.time', {}, el('div.progress-fill#timebar', { style: { width: `${100 * S.left / DURATION}%` } })));
    const p = S.problem;
    const card = el('div.card.q-card.arcade-card');
    if (S.flash) card.classList.add(S.flash);
    card.appendChild(el('div.q-eq.huge', { html: p.eq.map(x => `<span>${x}</span>`).join('') + `<span>=</span><span class="ans-box ${S.typed ? 'filled' : ''}">${S.typed || '&nbsp;'}</span>` }));
    if (S.popup) card.appendChild(el('div.pts-pop', { text: S.popup }));
    if (S.reveal) card.appendChild(el('div.q-final', { html: `The answer was <b>${S.reveal}</b>` }));
    app.appendChild(card);
    const pad = el('div.keypad');
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].forEach(k => {
      const b = el('button.key', { text: k, onclick: () => key(k) });
      if (k === '✓') b.classList.add('ok'); if (k === '⌫') b.classList.add('del');
      pad.appendChild(b);
    });
    app.appendChild(pad);
  }
  function key(k) {
    if (!S || S.done || !S.problem || S.reveal) return;
    if (k === '⌫') S.typed = S.typed.slice(0, -1);
    else if (k === '✓') { if (S.typed) submit(); return; }
    else if (S.typed.length < 4) S.typed += k;
    render();
  }
  function submit() {
    const ms = Date.now() - S.pt0;
    const ok = Number(S.typed) === Number(S.problem.answer);
    if (S.problem.factKey) Store.recordFact(S.profile, S.problem.factKey, ok, ms);
    if (ok) {
      S.correct++; S.combo++; S.bestCombo = Math.max(S.bestCombo, S.combo); S.times.push(ms);
      const pts = pointsFor(ms, S.combo);
      S.score += pts; S.flash = 'good'; S.reveal = null;
      S.popup = `+${pts}${ms < 2000 ? ' ⚡' : ''}${S.combo % SCORING.comboEvery === 0 ? ' 🔥 COMBO!' : ''}`;
      Sound.play(S.combo % SCORING.comboEvery === 0 ? 'coin' : 'correct');
      nextProblem(); render();
      setTimeout(() => { if (S) { S.flash = null; S.popup = null; const c = document.querySelector('.arcade-card'); if (c) c.classList.remove('good'); const pp = document.querySelector('.pts-pop'); if (pp) pp.remove(); } }, 500);
    } else {
      S.wrong++; S.combo = 0; S.score = Math.max(0, S.score - SCORING.miss);
      S.flash = 'bad'; S.reveal = S.problem.answer; S.popup = `−${SCORING.miss}`;
      Sound.play('wrong');
      const wrongP = S.problem; render();
      setTimeout(() => { if (S && S.problem === wrongP) { S.flash = null; S.reveal = null; S.popup = null; nextProblem(); render(); } }, 1200);
    }
  }
  function onKeyDown(e) {
    if (!S || S.done || !S.problem) return;
    if (/^[0-9]$/.test(e.key)) key(e.key);
    else if (e.key === 'Backspace') key('⌫');
    else if (e.key === 'Enter') key('✓');
  }
  function stop() { if (S && S.timer) clearInterval(S.timer); S = null; }

  function finish() {
    clearInterval(S.timer); S.done = true;
    const p = S.profile, d = S.drill;
    const prev = (p.arcade[d.id] || {}).best || 0;
    const isBest = S.score > prev;
    const attempts = S.correct + S.wrong;
    const acc = attempts ? Math.round(100 * S.correct / attempts) : 0;
    const avgMs = S.times.length ? Math.round(S.times.reduce((a, b) => a + b, 0) / S.times.length) : 0;
    const coins = Math.min(30, Math.floor(S.score / 15)) + (isBest && prev > 0 ? 10 : 0);
    Store.recordArcade(p, d.id, S.score, DURATION * 1000, { correct: S.correct, wrong: S.wrong, acc, avgMs, combo: S.bestCombo });
    Store.addCoins(p, coins); Store.addXp(p, S.correct * 2); Store.save();
    const newBadges = Rewards.checkBadges(p);
    const { rank, of } = rankOf(d.id, p);

    const app = document.getElementById('app');
    app.innerHTML = ''; app.className = 'screen arcade-screen';
    const card = el('div.card.results-card');
    card.appendChild(el('h2', { text: `${d.icon} ${d.name}` }));
    card.appendChild(el('div.big-score', { html: `<span>${S.score}</span> points` }));
    if (isBest) card.appendChild(el('div.callout', { html: `🏆 <b>New personal best!</b>${prev ? ` (was ${prev})` : ''}` }));
    else card.appendChild(el('p.muted', { text: `Your best: ${prev}` }));
    if (rank === 1 && of > 1) card.appendChild(el('div.callout', { html: `👑 <b>You're #1 in the family for this drill!</b>` }));
    else if (of > 1) card.appendChild(el('p.muted', { text: `Family rank: #${rank} of ${of}` }));
    const rows = el('div.result-rows');
    rows.appendChild(el('div.result-row', { html: `<span>Correct</span><b>${S.correct}</b>` }));
    rows.appendChild(el('div.result-row', { html: `<span>Missed</span><b>${S.wrong}</b>` }));
    rows.appendChild(el('div.result-row', { html: `<span>Accuracy</span><b>${acc}%</b>` }));
    rows.appendChild(el('div.result-row', { html: `<span>Average speed</span><b>${avgMs ? (avgMs / 1000).toFixed(1) + 's' : '–'}</b>` }));
    rows.appendChild(el('div.result-row', { html: `<span>Best combo</span><b>🔥 ${S.bestCombo}</b>` }));
    rows.appendChild(el('div.result-row', { html: `<span>Coins earned</span><b>🪙 ${coins}</b>` }));
    newBadges.forEach(b => rows.appendChild(el('div.callout', { html: `🏅 New badge: <b>${b.icon} ${b.name}</b>` })));
    card.appendChild(rows);
    app.appendChild(card);
    const lb = el('div.card');
    lb.appendChild(el('h3', { text: '🏆 Family leaderboard' }));
    lb.appendChild(leaderTable(d.id, p.id));
    app.appendChild(lb);
    app.appendChild(el('div.btn-row', {},
      el('button.btn.primary', { onclick: () => start(d) }, '↺ Play again'),
      el('button.btn.secondary', { onclick: () => menu() }, 'Arcade menu'),
      el('button.btn.ghost', { onclick: () => { stop(); Screens.home(); } }, '🏠 Home')));
    if (isBest && S.score > 0) { Confetti.burst(rank === 1 ? 160 : 70); Sound.play('fanfare'); }
    else if (S.correct >= 10) Sound.play('star');
  }

  document.addEventListener('keydown', onKeyDown);
  return { menu, start, stop, leaderScreen, DRILLS, leaderboard, _state: () => S, _finish: finish };
})();
