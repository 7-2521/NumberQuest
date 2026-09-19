/* Bootstrap */
(async function boot() {
  const app = document.getElementById('app');
  app.innerHTML = '<div class="loading">🦊 Loading…</div>';
  try {
    await Store.load();
  } catch (e) {
    if (e.unauthorized) return loginScreen();
    console.error(e);
  }
  Sound.setEnabled(Store.settings.sound !== false);
  Screens.profiles();

  function loginScreen(bad) {
    app.innerHTML = ''; app.className = 'screen profiles-screen';
    app.appendChild(U.el('div.logo', {}, U.el('span.logo-icon', { text: '🦊' }), U.el('h1', { text: 'Number Quest' }), U.el('p', { text: 'Enter the family password to play' })));
    const card = U.el('div.card.login-card');
    const input = U.el('input.text-input.big', { type: 'password', placeholder: 'Family password' });
    card.appendChild(input);
    if (bad) card.appendChild(U.el('p.error', { text: 'That password is not right. Try again.' }));
    const go = async () => {
      try { await Store.login(input.value.trim()); location.reload(); }
      catch (err) { loginScreen(true); }
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    card.appendChild(U.el('div.btn-row', {}, U.el('button.btn.primary.big', { onclick: go }, 'Enter')));
    app.appendChild(card);
    setTimeout(() => input.focus(), 50);
  }
})();
