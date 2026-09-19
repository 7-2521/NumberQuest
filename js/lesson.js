/* Lesson runner: Learn (slides + worked demos) -> Practice (hints, retries) -> Quiz (stars) -> Results */
const Lesson = (() => {
  const { el } = U;
  let S = null;
  const PRAISE = ['Great job!', 'You got it!', 'Awesome!', 'Nice work!', 'Exactly right!', 'Super!', 'Brilliant!', 'That\'s it!', 'Fantastic!', 'Way to go!'];
  const OOPS = ['Not quite.', 'Almost!', 'Hmm, try again.', 'Oops!', 'Close, but not yet.'];

  function start(lesson) {
    const profile = Store.current();
    S = {
      lesson, profile, phase: 'learn', slide: 0, demoDone: 0,
      problems: [], idx: 0, startedAt: Date.now(),
      practice: { correct: 0, total: 0 }, quiz: { correct: 0, total: 0 },
      coins: 0, xp: 0, locked: false,
    };
    if (!lesson.learn || !lesson.learn.length) beginPhase('practice');
    render();
  }

  function beginPhase(phase) {
    S.phase = phase;
    const n = phase === 'practice' ? S.lesson.practice : S.lesson.quiz;
    S.fresh = true;
    S.problems = Gen.makeSet(S.lesson.gen, n, S.profile).map(p => ({ p, typed: '', attempts: 0, wrongSteps: 0, done: 0, finished: false, hint: false, revealed: false, t0: Date.now() }));
    S.idx = 0;
  }

  const cur = () => S.problems[S.idx];

  /* ---------------- rendering ---------------- */
  function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.className = 'screen lesson-screen';
    const w = S.lesson.world;
    app.style.setProperty('--world', w.color);

    const header = el('div.lesson-header',
      { },
      el('button.icon-btn', { onclick: exit, title: 'Back' }, '✕'),
      el('div.lesson-title', {}, el('span.lesson-icon', { text: S.lesson.icon }), el('span', { text: S.lesson.title })),
      el('div.coin-pill', { html: `🪙 ${S.profile.coins + S.coins}` }),
    );
    app.appendChild(header);
    app.appendChild(renderProgress());
    const body = el('div.lesson-body' + (S.fresh ? '.fadein' : ''));
    S.fresh = false;
    app.appendChild(body);
    if (S.phase === 'learn') renderLearn(body);
    else if (S.phase === 'results') renderResults(body);
    else renderProblem(body);
  }

  function renderProgress() {
    const total = (S.lesson.learn || []).length + S.lesson.practice + S.lesson.quiz;
    let done = 0;
    if (S.phase === 'learn') done = S.slide;
    else if (S.phase === 'practice') done = (S.lesson.learn || []).length + S.idx;
    else if (S.phase === 'quiz') done = (S.lesson.learn || []).length + S.lesson.practice + S.idx;
    else done = total;
    const label = { learn: '📖 Learn', practice: '✏️ Practice', quiz: '⭐ Quiz', results: '🏁 Done' }[S.phase];
    return el('div.progress-wrap', {},
      el('div.progress-label', { text: label }),
      el('div.progress-bar', {}, el('div.progress-fill', { style: { width: `${Math.round(100 * done / total)}%` } })),
    );
  }

  const bubble = (text, mood = 'normal') => el('div.mascot-row', {}, el('div.mascot', { text: '🦊' }), el('div.bubble.' + mood, { html: text }));

  /* ---------------- LEARN ---------------- */
  function renderLearn(body) {
    const slide = S.lesson.learn[S.slide];
    const card = el('div.card.learn-card');
    if (slide.demo) {
      const [op, a, b] = slide.demo;
      if (!S.demoWs || S.demoKey !== S.slide) { S.demoWs = Alg.build(op, a, b); S.demoDone = 0; S.demoKey = S.slide; }
      const ws = S.demoWs;
      const finished = S.demoDone >= ws.steps.length;
      const say = S.demoDone === 0 ? `Let's work out <b>${ws.title}</b> step by step. Tap <b>Next step</b>.`
        : finished ? `All done! <b>${ws.title} = ${ws.answerText}</b>. ${S.slide < S.lesson.learn.length - 1 ? 'Tap Next to keep going.' : 'Now you try!'}`
        : `<b>Step ${S.demoDone}:</b> ${ws.steps[S.demoDone - 1].hint}`;
      body.appendChild(bubble(say));
      card.appendChild(el('h2', { text: slide.title }));
      card.appendChild(el('div.ws-wrap', {}, Workspace.render(ws, { done: S.demoDone, typed: '', highlight: S.demoDone - 1, demo: true })));
      if (!finished) {
        card.appendChild(el('div.prompt-preview', { html: `<b>Next:</b> ${ws.steps[S.demoDone].prompt}` }));
      }
      body.appendChild(card);
      const btns = el('div.btn-row');
      if (S.demoDone > 0) btns.appendChild(el('button.btn.ghost', { onclick: () => { S.demoDone = 0; render(); } }, '↺ Restart'));
      if (!finished) btns.appendChild(el('button.btn.primary', { onclick: () => { Sound.play('tap'); S.demoDone++; render(); } }, 'Next step ▶'));
      else btns.appendChild(el('button.btn.primary', { onclick: nextSlide }, S.slide < S.lesson.learn.length - 1 ? 'Next ▶' : 'Start practice ✏️'));
      body.appendChild(btns);
    } else {
      body.appendChild(bubble(S.slide === 0 ? `Welcome to <b>${S.lesson.title}</b>! Let's learn first.` : 'Read this, then tap Next.'));
      card.appendChild(el('h2', { text: slide.title }));
      card.appendChild(el('div.learn-body', { html: slide.html }));
      body.appendChild(card);
      const btns = el('div.btn-row');
      if (S.slide > 0) btns.appendChild(el('button.btn.ghost', { onclick: () => { S.slide--; render(); } }, '◀ Back'));
      btns.appendChild(el('button.btn.primary', { onclick: nextSlide }, S.slide < S.lesson.learn.length - 1 ? 'Next ▶' : 'Start practice ✏️'));
      body.appendChild(btns);
    }
  }
  function nextSlide() {
    Sound.play('tap'); S.fresh = true;
    if (S.slide < S.lesson.learn.length - 1) { S.slide++; render(); }
    else { beginPhase('practice'); render(); }
  }

  /* ---------------- PROBLEMS ---------------- */
  function renderProblem(body) {
    const c = cur();
    const p = c.p;
    body.appendChild(el('div.qcount', { text: `${S.phase === 'practice' ? 'Practice' : 'Quiz'} ${S.idx + 1} of ${S.problems.length}` }));
    body.appendChild(el('div.bubble-slot#bubble', {}, bubble(promptFor(c))));
    const card = el('div.card.q-card#qcard');
    card.appendChild(renderQuestion(c));
    body.appendChild(card);
    body.appendChild(renderInput(c));
  }

  function promptFor(c) {
    const p = c.p;
    if (c.finished) return c.msg || 'Done!';
    if (c.msg) return c.msg;
    if (p.kind === 'column') return p.ws.steps[c.done].prompt;
    if (p.kind === 'count') return 'Count them all, then type the number.';
    if (p.kind === 'choice') return 'Tap the right sign.';
    if (p.kind === 'missing') return 'What number goes in the box?';
    if (p.word) return 'Read the story carefully. What is the answer?';
    return 'Type your answer, then press ✓.';
  }

  function renderQuestion(c) {
    const p = c.p;
    const wrap = el('div.question');
    const typed = c.typed;
    const box = (txt, cls = '') => `<span class="ans-box ${cls} ${txt ? 'filled' : ''}">${txt || '&nbsp;'}</span>`;
    if (p.kind === 'column') {
      wrap.appendChild(el('div.q-title', { text: p.ws.title }));
      wrap.appendChild(el('div.ws-wrap', {}, Workspace.render(p.ws, { done: c.done, typed, wrong: c.shake, highlight: c.finished ? null : c.done - 1 })));
      if (c.finished) wrap.appendChild(el('div.q-final', { html: `${p.ws.title} = <b>${p.ws.answerText}</b>` }));
      return wrap;
    }
    if (p.kind === 'count') {
      wrap.appendChild(el('div.q-text', { html: p.text }));
      wrap.appendChild(el('div.q-visual', { html: p.visual }));
      wrap.appendChild(el('div.q-eq', { html: box(typed) }));
      return wrap;
    }
    if (p.kind === 'choice') {
      wrap.appendChild(el('div.q-text', { html: p.text }));
      wrap.appendChild(el('div.q-eq.compare', { html: `<span>${p.compare[0]}</span>${box(c.finished || c.revealed ? p.answer : typed, 'sign')}<span>${p.compare[1]}</span>` }));
      return wrap;
    }
    if (p.kind === 'missing') {
      const parts = p.parts.map(x => x === '?' ? box(typed) : `<span>${x}</span>`).join('');
      if (p.visual) wrap.appendChild(el('div.q-visual', { html: p.visual }));
      wrap.appendChild(el('div.q-eq', { html: parts }));
      return wrap;
    }
    // fact / word / place value
    if (!Array.isArray(p.eq) || p.word) wrap.appendChild(el('div.q-text' + (p.word ? '.story' : ''), { html: p.text }));
    if (p.visual) wrap.appendChild(el('div.q-visual', { html: p.visual }));
    if (p.sequence) wrap.appendChild(el('div.numline', { html: p.sequence.map(x => x === '?' ? box(typed) : `<span>${x}</span>`).join('') }));
    else if (Array.isArray(p.eq)) wrap.appendChild(el('div.q-eq', { html: p.eq.map(x => `<span>${x}</span>`).join('') + '<span>=</span>' + box(typed) }));
    else wrap.appendChild(el('div.q-eq', { html: box(typed) }));
    if (p.word && (c.finished || c.revealed) && p.eq) wrap.appendChild(el('div.q-final', { text: p.eq }));
    return wrap;
  }

  function renderInput(c) {
    const p = c.p;
    const area = el('div.input-area');
    if (c.finished) {
      if (c.autoNext) return area;
      area.appendChild(el('div.btn-row', {}, el('button.btn.primary.big', { onclick: nextProblem }, S.idx < S.problems.length - 1 ? 'Next ▶' : (S.phase === 'practice' ? 'Start quiz ⭐' : 'See results 🏁'))));
      return area;
    }
    if (p.kind === 'choice') {
      const row = el('div.choice-row');
      p.choices.forEach(ch => row.appendChild(el('button.btn.choice', { onclick: () => submit(ch.v) }, el('span.choice-label', { text: ch.label }), el('span.choice-sub', { text: ch.sub }))));
      area.appendChild(row);
    } else {
      const pad = el('div.keypad');
      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
      keys.forEach(k => {
        const b = el('button.key', { text: k, onclick: () => key(k) });
        if (k === '✓') b.classList.add('ok');
        if (k === '⌫') b.classList.add('del');
        pad.appendChild(b);
      });
      area.appendChild(pad);
    }
    if (S.phase === 'practice' && !c.msgIsHint) {
      area.appendChild(el('button.btn.ghost.hint-btn', { onclick: showHint }, '💡 Hint'));
    }
    return area;
  }

  function refresh() {
    const card = document.getElementById('qcard');
    if (card) { card.innerHTML = ''; card.appendChild(renderQuestion(cur())); }
    const b = document.getElementById('bubble');
    if (b) { b.innerHTML = ''; b.appendChild(bubble(promptFor(cur()), cur().mood || 'normal')); }
  }

  /* ---------------- input ---------------- */
  function key(k) {
    if (!S || S.locked) return;
    const c = cur();
    if (c.finished) { if (k === '✓') nextProblem(); return; }
    Sound.play('tap');
    if (k === '⌫') { c.typed = c.typed.slice(0, -1); refresh(); return; }
    if (k === '✓') { if (c.typed.length) submit(c.typed); return; }
    const max = c.p.kind === 'column' ? Workspace.expectedLength(c.p.ws.steps[c.done]) : 6;
    if (c.typed.length >= max) return;
    c.typed += k;
    refresh();
    if (c.p.kind === 'column' && c.typed.length === max) {
      const snap = { done: c.done, typed: c.typed };
      setTimeout(() => { if (S && cur() === c && !c.finished && c.done === snap.done && c.typed === snap.typed) submit(c.typed); }, 120);
    }
  }
  function onKeyDown(e) {
    if (!S || S.phase === 'learn' || S.phase === 'results') return;
    if (/^[0-9]$/.test(e.key)) key(e.key);
    else if (e.key === 'Backspace') key('⌫');
    else if (e.key === 'Enter') key('✓');
    else if (cur() && cur().p.kind === 'choice' && ['<', '>', '='].includes(e.key)) submit(e.key);
  }

  function showHint() {
    const c = cur();
    c.hint = true;
    c.msg = '💡 ' + hintFor(c);
    c.msgIsHint = true; c.mood = 'hint';
    render();
  }
  function hintFor(c) {
    const p = c.p;
    if (p.kind === 'column') return p.ws.steps[c.done].hint;
    if (p.kind === 'count') return 'Touch each one as you count: 1, 2, 3 ...';
    if (p.kind === 'choice') return `The alligator mouth opens toward the bigger number. ${p.compare[0]} and ${p.compare[1]} — which is bigger?`;
    if (p.kind === 'missing') { const [x, op, y, , z] = p.parts; return op === '+' ? `Count up from ${x === '?' ? y : x} until you reach ${z}.` : op === '−' ? `Think of the fact family: what plus ${y === '?' ? x : y}... or what minus what gives ${z}?` : op === '×' ? `Which times table gives ${z}?` : `Think: ${y === '?' ? x : y} times what makes ${x === '?' ? z : x}?`; }
    if (p.word) return `Find the numbers in the story and decide: add, subtract, multiply, or divide? The answer is ${p.eq.split('=')[0].trim()}.`;
    if (Array.isArray(p.eq)) {
      const [a, op, b] = p.eq;
      if (op === '+') return `Start at ${Math.max(a, b)} and count on ${Math.min(a, b)} more.`;
      if (op === '−') return `Start at ${a} and count back ${b}. Or think: ${b} plus what makes ${a}?`;
      if (op === '×') return `${a} × ${b} means ${a} groups of ${b}. Skip count by ${b}: ${Array.from({ length: Math.min(a, 5) }, (_, i) => b * (i + 1)).join(', ')} ...`;
      if (op === '÷') return `Think: ${b} times what equals ${a}?`;
    }
    return 'Take your time and think about the place values.';
  }

  /* ---------------- checking ---------------- */
  function submit(value) {
    if (!S || S.locked) return;
    const c = cur(), p = c.p;
    let expected, ok;
    if (c.finished) return;
    if (p.kind === 'column') { const step = p.ws.steps[c.done]; if (!step) return; expected = step.answer; ok = value === expected; }
    else if (p.kind === 'choice') { expected = p.answer; ok = value === expected; }
    else { expected = p.answer; ok = Number(value) === Number(expected) && value !== ''; }
    const ms = Date.now() - c.t0;
    if (ok) onCorrect(c, ms); else onWrong(c, expected);
  }

  function onCorrect(c, ms) {
    const p = c.p;
    Sound.play('correct');
    if (p.kind === 'column') {
      const firstTry = c.attempts === 0;
      c.done++; c.typed = ''; c.attempts = 0; c.shake = false; c.msg = null; c.msgIsHint = false; c.mood = 'normal';
      // long written problems forgive one slip per 8 steps (a 12-step long division allows 1)
      if (c.done >= p.ws.steps.length) finishProblem(c, c.wrongSteps <= Math.floor(p.ws.steps.length / 8) && !c.hint);
      else { S.locked = true; setTimeout(() => { S.locked = false; render(); }, 250); }
      return;
    }
    const firstTry = c.attempts === 0 && !c.hint;
    if (p.factKey && !c.revealed) Store.recordFact(S.profile, p.factKey, c.attempts === 0, ms);
    finishProblem(c, firstTry && !c.revealed);
  }

  function finishProblem(c, correct) {
    c.finished = true; c.correct = correct;
    const stats = S.phase === 'practice' ? S.practice : S.quiz;
    stats.total++;
    if (correct) {
      stats.correct++;
      const coins = S.phase === 'practice' ? 2 : 5, xp = S.phase === 'practice' ? 5 : 10;
      S.coins += coins; S.xp += xp;
      c.msg = `${U.pick(PRAISE)} <span class="coin-pop">+${coins} 🪙</span>`; c.mood = 'happy';
      Sound.play('coin');
    } else {
      c.msg = c.p.kind === 'column' ? `Finished! Check the steps you missed, then keep going.` : `Now you know it! Let's keep going.`;
      c.mood = 'normal';
      S.xp += 2;
    }
    c.autoNext = c.p.kind !== 'column' && correct;
    render();
    if (c.autoNext) { S.locked = true; setTimeout(() => { if (S && cur() === c) { S.locked = false; nextProblem(); } }, 1100); }
  }

  function onWrong(c, expected) {
    const p = c.p;
    Sound.play('wrong');
    c.attempts++;
    if (p.kind === 'column') c.wrongSteps++;
    if (p.factKey && c.attempts === 1) Store.recordFact(S.profile, p.factKey, false, 0);
    c.shake = true;
    const reveal = S.phase === 'quiz' || c.attempts >= 2;
    if (reveal) {
      c.revealed = true;
      if (p.kind === 'column') {
        // fill in the correct step and move on
        c.msg = `${U.pick(OOPS)} ${p.ws.steps[c.done].hint}`; c.mood = 'hint';
        c.done++; c.typed = ''; c.attempts = 0;
        refresh();
        if (c.done >= p.ws.steps.length) { S.locked = true; setTimeout(() => { S.locked = false; finishProblem(c, c.wrongSteps <= Math.floor(p.ws.steps.length / 8) && !c.hint); }, 1400); }
        else render();
        return;
      }
      const shown = p.kind === 'choice' ? `<b>${expected}</b>` : `<b>${expected}</b>`;
      c.msg = `${U.pick(OOPS)} The answer is ${shown}. ${p.kind === 'choice' ? '' : 'Type it to continue.'}`; c.mood = 'hint';
      c.typed = '';
      if (p.kind === 'choice') { render(); S.locked = true; setTimeout(() => { S.locked = false; finishProblem(c, false); }, 1600); return; }
      render();
    } else {
      c.msg = `${U.pick(OOPS)} 💡 ${hintFor(c)}`; c.msgIsHint = true; c.mood = 'hint';
      c.typed = '';
      render();
    }
    setTimeout(() => { c.shake = false; }, 400);
  }

  function nextProblem() {
    if (!S) return;
    Sound.play('tap');
    S.fresh = true;
    if (S.idx < S.problems.length - 1) { S.idx++; cur().t0 = Date.now(); render(); return; }
    if (S.phase === 'practice') { beginPhase('quiz'); render(); return; }
    finishLesson();
  }

  /* ---------------- results ---------------- */
  function finishLesson() {
    const pct = S.quiz.total ? S.quiz.correct / S.quiz.total : 0;
    const stars = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;
    const prev = S.profile.lessons[S.lesson.id] || {};
    let bonus = 0;
    if (stars === 3 && prev.stars < 3) bonus += 20;
    if (stars > 0 && !prev.completedAt) bonus += 10;
    S.coins += bonus; S.xp += stars * 15;
    const beforeLevel = Store.level(S.profile.xp);
    Store.recordLesson(S.profile, S.lesson.id, { stars, correct: S.quiz.correct, total: S.quiz.total, ms: Date.now() - S.startedAt, coins: S.coins, xp: S.xp });
    S.result = { stars, bonus, levelUp: Store.level(S.profile.xp) > beforeLevel, newBadges: Rewards.checkBadges(S.profile) };
    S.phase = 'results'; S.fresh = true;
    render();
    if (stars > 0) { Confetti.burst(stars * 60); Sound.play(stars === 3 ? 'fanfare' : 'star'); }
  }

  function renderResults(body) {
    const r = S.result;
    const card = el('div.card.results-card');
    const msg = r.stars === 3 ? 'Perfect! You mastered it!' : r.stars === 2 ? 'Great work! Almost perfect.' : r.stars === 1 ? 'Good job! Practice makes perfect.' : 'Keep trying! Let\'s go through the lesson again.';
    body.appendChild(bubble(msg, r.stars ? 'happy' : 'normal'));
    card.appendChild(el('div.stars-big', { html: [1, 2, 3].map(i => `<span class="${i <= r.stars ? 'on' : ''}" style="animation-delay:${i * 0.25}s">★</span>`).join('') }));
    card.appendChild(el('h2', { text: S.lesson.title }));
    const rows = el('div.result-rows');
    rows.appendChild(el('div.result-row', { html: `<span>Quiz score</span><b>${S.quiz.correct} / ${S.quiz.total}</b>` }));
    rows.appendChild(el('div.result-row', { html: `<span>Practice</span><b>${S.practice.correct} / ${S.practice.total}</b>` }));
    rows.appendChild(el('div.result-row', { html: `<span>Coins earned</span><b>🪙 ${S.coins}${r.bonus ? ` <small>(+${r.bonus} bonus)</small>` : ''}</b>` }));
    rows.appendChild(el('div.result-row', { html: `<span>XP earned</span><b>✨ ${S.xp}</b>` }));
    card.appendChild(rows);
    if (r.levelUp) card.appendChild(el('div.callout', { html: `🎉 <b>Level up!</b> You are now level ${Store.level(S.profile.xp)}!` }));
    r.newBadges.forEach(b => card.appendChild(el('div.callout', { html: `🏅 New badge: <b>${b.icon} ${b.name}</b> — ${b.desc}` })));
    body.appendChild(card);
    const btns = el('div.btn-row');
    btns.appendChild(el('button.btn.ghost', { onclick: () => start(S.lesson) }, '↺ Play again'));
    const next = Curriculum.nextLesson(S.profile);
    if (r.stars > 0 && next && next.id !== S.lesson.id) btns.appendChild(el('button.btn.primary', { onclick: () => start(next) }, `Next: ${next.title} ▶`));
    btns.appendChild(el('button.btn.secondary', { onclick: () => Screens.world(S.lesson.world.id) }, '🗺️ Map'));
    body.appendChild(btns);
  }

  async function exit() {
    if (S.phase !== 'results' && S.phase !== 'learn') {
      const ok = await UI.confirm('Leave this lesson? Your progress in it will not be saved.');
      if (!ok) return;
    }
    const w = S.lesson.world;
    S = null;
    Screens.world(w.id);
  }

  document.addEventListener('keydown', onKeyDown);
  function stop() { S = null; }
  return { start, stop, get active() { return !!S; }, _cur: () => (S ? cur() : null) };
})();
