/* Rewards: sticker shop (spend coins), themes, and badges (earned automatically) */
const Rewards = (() => {
  const { el } = U;

  const STICKER_PAGES = [
    { name: 'Animals', items: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦄', '🐢'] },
    { name: 'Sea', items: ['🐙', '🦑', '🦐', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🦈', '🐊', '🦭', '🐚', '⚓', '🧜', '🏄'] },
    { name: 'Space', items: ['🚀', '🛸', '🪐', '🌍', '🌙', '☄️', '⭐', '🌟', '👽', '🧑‍🚀', '🔭', '🛰️', '🌌', '☀️', '🌈', '⚡'] },
    { name: 'Food', items: ['🍎', '🍕', '🍔', '🍩', '🍪', '🍦', '🧁', '🍭', '🍉', '🍓', '🥑', '🌮', '🍿', '🥨', '🍰', '🍒'] },
    { name: 'Dinos & Magic', items: ['🦖', '🦕', '🐉', '🧙', '🧚', '🧞', '🔮', '🗡️', '🛡️', '👑', '💎', '🏰', '🦩', '🦚', '🎠', '🎪'] },
  ];
  const stickerCost = (page, i) => 10 + Math.floor(i / 4) * 5 + page * 5;

  const THEMES = [
    { id: 'sky', name: 'Sky', cost: 0, colors: ['#4facfe', '#00f2fe'] },
    { id: 'sunset', name: 'Sunset', cost: 60, colors: ['#f7797d', '#fbd786'] },
    { id: 'forest', name: 'Forest', cost: 60, colors: ['#11998e', '#38ef7d'] },
    { id: 'candy', name: 'Candy', cost: 80, colors: ['#ff9a9e', '#fad0c4'] },
    { id: 'space', name: 'Deep Space', cost: 120, colors: ['#243b55', '#141e30'] },
    { id: 'lava', name: 'Lava', cost: 120, colors: ['#f12711', '#f5af19'] },
  ];

  const BADGES = [
    { id: 'first', icon: '🎈', name: 'First Steps', desc: 'Finish your first lesson', test: p => Object.values(p.lessons).some(l => l.stars > 0) },
    { id: 'perfect', icon: '💯', name: 'Perfect!', desc: 'Get 3 stars on a lesson', test: p => Object.values(p.lessons).some(l => l.stars === 3) },
    { id: 'five', icon: '🖐️', name: 'High Five', desc: 'Finish 5 lessons', test: p => Object.values(p.lessons).filter(l => l.stars > 0).length >= 5 },
    { id: 'fifteen', icon: '🚀', name: 'Blast Off', desc: 'Finish 15 lessons', test: p => Object.values(p.lessons).filter(l => l.stars > 0).length >= 15 },
    { id: 'streak3', icon: '🔥', name: 'On Fire', desc: 'Play 3 days in a row', test: p => (p.streak.best || 0) >= 3 },
    { id: 'streak7', icon: '🌋', name: 'Unstoppable', desc: 'Play 7 days in a row', test: p => (p.streak.best || 0) >= 7 },
    { id: 'coins100', icon: '💰', name: 'Piggy Bank', desc: 'Earn 100 coins in total', test: p => (p.coinsEarned || 0) >= 100 },
    { id: 'arcade10', icon: '🕹️', name: 'Arcade Star', desc: 'Get 10+ right in one arcade drill', test: p => Object.values(p.arcade).some(a => (a.topCorrect || 0) >= 10) },
    { id: 'arcade25', icon: '⚡', name: 'Lightning Fingers', desc: 'Get 25+ right in one arcade drill', test: p => Object.values(p.arcade).some(a => (a.topCorrect || 0) >= 25) },
    { id: 'champion', icon: '🥇', name: 'Family Champion', desc: 'Hold the #1 spot on any leaderboard (with 2+ players)', test: p => Arcade.DRILLS.some(d => { const lb = Arcade.leaderboard(d.id); return lb.length > 1 && lb[0].p.id === p.id; }) },
    { id: 'carry', icon: '🎒', name: 'Carry Master', desc: 'Finish every lesson in Carry Canyon', test: p => worldDone(p, 'carry') },
    { id: 'borrow', icon: '🤝', name: 'Borrow Boss', desc: 'Finish every lesson in Borrow Bridge', test: p => worldDone(p, 'borrow') },
    { id: 'times', icon: '✖️', name: 'Times Table Titan', desc: 'Get 3 stars on All Tables to 12', test: p => (p.lessons.xall || {}).stars === 3 },
    { id: 'divide', icon: '📐', name: 'Long Division Legend', desc: 'Finish every lesson in Division Valley', test: p => worldDone(p, 'division') },
    { id: 'castle', icon: '👑', name: 'Math Royalty', desc: 'Finish every lesson in Challenge Castle', test: p => worldDone(p, 'castle') },
    { id: 'collector', icon: '📒', name: 'Collector', desc: 'Collect 10 stickers', test: p => p.stickers.length >= 10 },
    { id: 'level5', icon: '🌟', name: 'Level 5', desc: 'Reach level 5', test: p => Store.level(p.xp) >= 5 },
    { id: 'level10', icon: '💫', name: 'Level 10', desc: 'Reach level 10', test: p => Store.level(p.xp) >= 10 },
  ];
  function worldDone(p, wid) {
    const w = Curriculum.worldById(wid);
    return w && w.lessons.every(l => (p.lessons[l.id] || {}).stars > 0);
  }
  function checkBadges(p) {
    const fresh = [];
    for (const b of BADGES) {
      if (p.badges.includes(b.id)) continue;
      if (b.test(p)) { p.badges.push(b.id); fresh.push(b); }
    }
    if (fresh.length) Store.save();
    return fresh;
  }

  /* ---------- screens ---------- */
  let tab = 0;
  function stickers() {
    const p = Store.current();
    const app = document.getElementById('app');
    app.innerHTML = ''; app.className = 'screen stickers-screen';
    app.appendChild(Screens.topbar('🎁 Sticker Shop', () => Screens.home(), `🪙 ${p.coins}`));
    app.appendChild(el('p.lead', { text: `Spend your coins on stickers and themes. You have ${p.stickers.length} stickers.` }));
    const tabs = el('div.tabs');
    STICKER_PAGES.forEach((pg, i) => tabs.appendChild(el('button.tab' + (tab === i ? '.on' : ''), { onclick: () => { tab = i; stickers(); } }, pg.name)));
    tabs.appendChild(el('button.tab' + (tab === STICKER_PAGES.length ? '.on' : ''), { onclick: () => { tab = STICKER_PAGES.length; stickers(); } }, '🎨 Themes'));
    app.appendChild(tabs);
    if (tab === STICKER_PAGES.length) { app.appendChild(renderThemes(p)); return; }
    const pg = STICKER_PAGES[tab];
    const grid = el('div.sticker-grid');
    pg.items.forEach((s, i) => {
      const id = `${tab}:${i}`, owned = p.stickers.includes(id), cost = stickerCost(tab, i);
      const btn = el('button.sticker' + (owned ? '.owned' : ''), {
        onclick: async () => {
          if (owned) { U.toast('You already have this one!'); return; }
          if (p.coins < cost) { Sound.play('wrong'); U.toast(`You need ${cost - p.coins} more coins`); return; }
          Store.addCoins(p, -cost); p.stickers.push(id); Store.save();
          Sound.play('coin'); Confetti.burst(40); checkBadges(p); stickers();
        },
      }, el('span.sticker-emoji', { text: s }), el('span.sticker-cost', { text: owned ? 'Yours!' : `🪙 ${cost}` }));
      grid.appendChild(btn);
    });
    app.appendChild(grid);
  }
  function renderThemes(p) {
    const grid = el('div.theme-grid');
    THEMES.forEach(t => {
      const owned = t.cost === 0 || p.stickers.includes('theme:' + t.id), active = p.theme === t.id;
      grid.appendChild(el('button.theme-card' + (active ? '.on' : ''), {
        style: { background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` },
        onclick: () => {
          if (!owned) {
            if (p.coins < t.cost) { Sound.play('wrong'); U.toast(`You need ${t.cost - p.coins} more coins`); return; }
            Store.addCoins(p, -t.cost); p.stickers.push('theme:' + t.id); Sound.play('coin');
          }
          p.theme = t.id; Store.save(); Screens.applyTheme(p); stickers();
        },
      }, el('span.theme-name', { text: t.name }), el('span.theme-cost', { text: active ? '✓ In use' : owned ? 'Tap to use' : `🪙 ${t.cost}` })));
    });
    return grid;
  }

  function badges() {
    const p = Store.current();
    checkBadges(p);
    const app = document.getElementById('app');
    app.innerHTML = ''; app.className = 'screen badges-screen';
    app.appendChild(Screens.topbar('🏅 Badges', () => Screens.home()));
    app.appendChild(el('p.lead', { text: `${p.badges.length} of ${BADGES.length} badges earned` }));
    const grid = el('div.badge-grid');
    BADGES.forEach(b => {
      const has = p.badges.includes(b.id);
      grid.appendChild(el('div.badge' + (has ? '.on' : ''), {}, el('span.badge-icon', { text: has ? b.icon : '🔒' }), el('span.badge-name', { text: b.name }), el('span.badge-desc', { text: b.desc })));
    });
    app.appendChild(grid);
    // sticker book
    if (p.stickers.filter(s => !s.startsWith('theme:')).length) {
      app.appendChild(el('h3.section-title', { text: '📒 My Stickers' }));
      const book = el('div.sticker-book');
      p.stickers.filter(s => !s.startsWith('theme:')).forEach(id => { const [pg, i] = id.split(':').map(Number); book.appendChild(el('span.book-sticker', { text: STICKER_PAGES[pg].items[i] })); });
      app.appendChild(book);
    }
  }

  return { STICKER_PAGES, THEMES, BADGES, checkBadges, stickers, badges };
})();
