/* Main navigation screens: player picker, new player, home, world map */
const Screens = (() => {
  const { el } = U;

  function topbar(title, onBack, right) {
    return el('div.topbar', {},
      el('button.icon-btn', { onclick: onBack, title: 'Back' }, '◀'),
      el('h1', { text: title }),
      right ? el('div.coin-pill', { html: right }) : el('span'));
  }
  function applyTheme(p) {
    document.body.className = 'theme-' + ((p && p.theme) || 'sky');
  }
  function leaveGames() { Arcade.stop(); Lesson.stop(); }

  /* ---------- player picker ---------- */
  async function profiles() {
    leaveGames();
    await Store.refresh();
    applyTheme(null);
    const app = document.getElementById('app');
    app.innerHTML = ''; app.className = 'screen profiles-screen';
    app.appendChild(el('div.logo', {}, el('span.logo-icon', { text: '🦊' }), el('h1', { text: 'Number Quest' }), el('p', { text: 'Who is playing today?' })));
    const grid = el('div.profile-grid');
    Store.data.profiles.forEach(p => {
      grid.appendChild(el('button.profile-card', { style: { '--c': p.color }, onclick: () => { Sound.unlock(); Store.setCurrent(p.id); home(); } },
        el('span.avatar.big', { text: p.avatar }), el('span.pname', { text: p.name }), el('span.plevel', { text: `Level ${Store.level(p.xp)} · ${Object.values(p.lessons).reduce((s, l) => s + (l.stars || 0), 0)} ★` })));
    });
    grid.appendChild(el('button.profile-card.add', { onclick: newProfile }, el('span.avatar.big', { text: '＋' }), el('span.pname', { text: 'New player' })));
    app.appendChild(grid);
    app.appendChild(el('div.footer', {}, el('button.btn.ghost', { onclick: () => Parent.gate() }, '👪 Grown-ups')));
  }

  function newProfile() {
    const app = document.getElementById('app');
    app.innerHTML = ''; app.className = 'screen new-profile-screen';
    app.appendChild(topbar('New player', profiles));
    const card = el('div.card');
    let avatar = U.pick(Store.AVATARS), color = U.pick(Store.COLORS);
    const preview = el('span.avatar.big.preview', { text: avatar, style: { background: color } });
    card.appendChild(el('div.center', {}, preview));
    const name = el('input.text-input.big', { type: 'text', placeholder: 'Your name', maxlength: 16, autocomplete: 'off' });
    card.appendChild(name);
    card.appendChild(el('p.label', { text: 'Pick a buddy' }));
    const av = el('div.avatar-grid');
    Store.AVATARS.forEach(a => av.appendChild(el('button.avatar-pick' + (a === avatar ? '.on' : ''), { text: a, onclick: e => { avatar = a; preview.textContent = a; av.querySelectorAll('.on').forEach(x => x.classList.remove('on')); e.currentTarget.classList.add('on'); Sound.play('tap'); } })));
    card.appendChild(av);
    card.appendChild(el('p.label', { text: 'Pick a color' }));
    const cg = el('div.color-grid');
    Store.COLORS.forEach(c => cg.appendChild(el('button.color-pick' + (c === color ? '.on' : ''), { style: { background: c }, onclick: e => { color = c; preview.style.background = c; cg.querySelectorAll('.on').forEach(x => x.classList.remove('on')); e.currentTarget.classList.add('on'); Sound.play('tap'); } })));
    card.appendChild(cg);
    card.appendChild(el('div.btn-row', {}, el('button.btn.primary.big', {
      onclick: () => {
        const n = name.value.trim();
        if (!n) { name.focus(); U.toast('Type your name first'); return; }
        Sound.unlock(); Store.newProfile(n, avatar, color); Sound.play('fanfare'); Confetti.burst(80); home();
      },
    }, "Let's go! 🚀")));
    app.appendChild(card);
    setTimeout(() => name.focus(), 100);
  }

  /* ---------- home ---------- */
  function home() {
    leaveGames();
    const p = Store.current();
    if (!p) return profiles();
    applyTheme(p);
    Rewards.checkBadges(p);
    const app = document.getElementById('app');
    app.innerHTML = ''; app.className = 'screen home-screen';
    const lv = Store.level(p.xp), lo = Store.xpForLevel(lv), hi = Store.xpForLevel(lv + 1);
    const head = el('div.home-head', {},
      el('button.avatar.big', { text: p.avatar, style: { background: p.color }, onclick: profiles, title: 'Switch player' }),
      el('div.home-info', {},
        el('h1', { text: `Hi, ${p.name}!` }),
        el('div.level-row', {}, el('span.level-lbl', { text: `Level ${lv}` }), el('div.progress-bar.xp', {}, el('div.progress-fill', { style: { width: `${Math.round(100 * (p.xp - lo) / (hi - lo))}%` } })), el('span.level-lbl.muted', { text: `${p.xp - lo}/${hi - lo} XP` }))),
      el('div.pills', {}, el('span.coin-pill', { html: `🪙 ${p.coins}` }), el('span.coin-pill.streak', { html: `🔥 ${p.streak.count || 0}` })));
    app.appendChild(head);

    const goal = Store.settings.dailyGoal, done = p.daily.day === U.todayKey() ? p.daily.done : 0;
    app.appendChild(el('div.daily', {}, el('span', { text: done >= goal ? '🎉 Daily goal done!' : `Today's goal: ${done} / ${goal} lessons` }),
      el('div.progress-bar', {}, el('div.progress-fill', { style: { width: `${Math.min(100, 100 * done / goal)}%` } }))));

    const next = Curriculum.nextLesson(p);
    app.appendChild(el('button.card.continue-card', { style: { '--world': next.world.color }, onclick: () => Lesson.start(next) },
      el('span.cont-icon', { text: next.icon }),
      el('div', {}, el('span.cont-lbl', { text: (p.lessons[next.id] || {}).stars ? 'Keep practicing' : 'Continue your quest' }), el('b', { text: next.title }), el('span.muted', { text: `${next.world.icon} ${next.world.name}` })),
      el('span.cont-go', { text: '▶' })));

    app.appendChild(el('h3.section-title', { text: '🗺️ Worlds' }));
    const grid = el('div.world-grid');
    Curriculum.WORLDS.forEach(w => {
      const pr = Curriculum.worldProgress(p, w);
      const unlocked = Curriculum.isUnlocked(p, w.lessons[0]);
      grid.appendChild(el('button.world-card' + (unlocked ? '' : '.locked'), { style: { '--c': w.color }, onclick: () => unlocked ? world(w.id) : U.toast('Finish 2 lessons in the world before this one to unlock!') },
        el('span.world-icon', { text: unlocked ? w.icon : '🔒' }),
        el('span.world-name', { text: w.name }),
        el('span.world-blurb', { text: w.blurb }),
        el('div.progress-bar', {}, el('div.progress-fill', { style: { width: `${100 * pr.done / pr.total}%` } })),
        el('span.world-stars', { text: `${pr.stars} / ${pr.maxStars} ★` })));
    });
    app.appendChild(grid);

    app.appendChild(el('div.bottom-nav', {},
      el('button.nav-btn', { onclick: () => Arcade.menu() }, el('span', { text: '🕹️' }), 'Arcade'),
      el('button.nav-btn', { onclick: () => Rewards.stickers() }, el('span', { text: '🎁' }), 'Shop'),
      el('button.nav-btn', { onclick: () => Rewards.badges() }, el('span', { text: '🏅' }), 'Badges'),
      el('button.nav-btn', { onclick: profiles }, el('span', { text: '👥' }), 'Switch')));
  }

  /* ---------- world map ---------- */
  function world(id) {
    leaveGames();
    const p = Store.current();
    if (!p) return profiles();
    const w = Curriculum.worldById(id);
    const app = document.getElementById('app');
    app.innerHTML = ''; app.className = 'screen world-screen';
    app.style.setProperty('--world', w.color);
    app.appendChild(topbar(`${w.icon} ${w.name}`, home, `🪙 ${p.coins}`));
    app.appendChild(el('p.lead', { text: w.blurb }));
    const path = el('div.lesson-path');
    w.lessons.forEach((l, i) => {
      const r = p.lessons[l.id] || {};
      const unlocked = Curriculum.isUnlocked(p, l);
      const node = el('button.lesson-node' + (unlocked ? '' : '.locked') + (r.stars ? '.done' : '') + (unlocked && !r.stars ? '.current' : ''), {
        style: { '--i': i },
        onclick: () => unlocked ? Lesson.start(l) : U.toast('Finish the lesson before this one first!'),
      },
        el('span.node-icon', { text: unlocked ? l.icon : '🔒' }),
        el('div.node-text', {}, el('b', { text: l.title }), el('span.node-stars', { html: [1, 2, 3].map(k => `<i class="${k <= (r.stars || 0) ? 'on' : ''}">★</i>`).join('') })),
        el('span.node-num', { text: String(i + 1) }));
      path.appendChild(node);
    });
    app.appendChild(path);
  }

  return { topbar, applyTheme, profiles, newProfile, home, world };
})();
