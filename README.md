# 🦊 Number Quest

A colorful, gamified math app for elementary kids that teaches **traditional methods** — memorized facts, column addition with carrying, subtraction with borrowing, long multiplication, and long division — with **unlimited player profiles** that track progress separately.

No frameworks, no build step, no database. One Node file serves it and stores progress; it also works by simply opening `index.html`.

## What's inside

| Area | Details |
|------|---------|
| **8 worlds, 59 lessons** | Number Land → Addition Alley → Subtraction Station → Carry Canyon → Borrow Bridge → Multiplication Mountain → Division Valley → Challenge Castle |
| **Every lesson: Learn → Practice → Quiz** | Learn slides include animated *worked examples* that step through the written method. Practice gives hints and retries. The quiz awards 1–3 stars. |
| **Interactive column work** | Kids write each digit where it belongs: the carry above the next column, the crossed-out digit when borrowing, the placeholder 0 in long multiplication, the divide-multiply-subtract-bring-down cycle in long division. |
| **Arcade** | 60-second drills (each times table, addition, subtraction, division, mixed) scored on accuracy, speed, and combos, with a **family leaderboard per drill** and a Hall of Fame. |
| **Rewards** | Coins, XP and levels, daily goal, streaks, 18 badges, a sticker shop, unlockable color themes. |
| **Adaptive facts** | Facts a child misses are quietly re-served more often; the parent dashboard lists "facts to work on". |
| **Grown-ups area** | Per-child progress (lessons, stars, accuracy, time, weak facts), rename/reset/delete players, sound, unlock-all, daily goal, PIN, backup/restore. |
| **Traditional methods only** | Standard algorithms, times-table memorization, count-on/count-back, fact families. No number bonds diagrams, decomposition strategies, or "common core" alternatives. |

## Run it locally

```bash
node server.js          # then open http://localhost:3000
```

Progress is saved to `data/state.json`. Any device on your home network can use the same address (`http://<your-pc-ip>:3000`) and share the same players.

**No Node?** Just double-click `index.html`. Progress is then saved in that browser only (use *Grown-ups → Backup* to move it).

## Deploy to Railway (so each kid can play from their own computer)

1. Push this folder to a GitHub repo (or use `railway up` from the Railway CLI).
2. In Railway: **New Project → Deploy from GitHub repo**. It detects Node and runs `node server.js`.
3. **Add a Volume** so progress survives redeploys: in the service, *Settings → Volumes → Add Volume*, mount path `/data`.
4. **Variables** (service → Variables):
   - `DATA_DIR` = `/data`
   - `FAMILY_PASSWORD` = a password your kids can type (optional but recommended — the site is public otherwise). Each browser asks for it once.
5. *Settings → Networking → Generate Domain*. Send that link to the kids.

Everyone who opens the link sees the same list of players; each child taps their own avatar. Leaderboards compare all players.

## Tests

```bash
npm test                          # 12,000 randomized checks of the four column algorithms
node test/generators.test.js      # every lesson's problem generator
```

## Project layout

```
index.html            app shell
css/app.css           all styling (themes, workspace grid, keypad, …)
js/util.js            DOM helper, sounds (synthesized), confetti, modals
js/store.js           profiles + progress; syncs to server API or localStorage
js/algorithms.js      step engines: add (carry), sub (borrow), mul (long), div (long)
js/generators.js      problem generators (facts, counting, place value, word problems, column)
js/curriculum.js      worlds, lessons, and teaching slides
js/workspace.js       renders a column worksheet (carries, strike-outs, division bracket)
js/lesson.js          Learn → Practice → Quiz → Results runner
js/arcade.js          timed drills, scoring, leaderboards
js/rewards.js         stickers, themes, badges
js/parent.js          grown-ups dashboard and settings
js/screens.js         player picker, home, world map
server.js             zero-dependency static + JSON API server
docs/research.md      what was borrowed from other apps and why
```

## Adding a lesson

Add an entry to a world in `js/curriculum.js`:

```js
{
  id: 'x3-facts', title: '×3 Facts', icon: '✖️', practice: 8, quiz: 10,
  gen: { type: 'mulFacts', tables: [3], maxFactor: 10, visual: true },
  learn: [
    { title: 'The 3s', html: '<p>…</p>' },
    { title: 'Watch: 23 × 3', demo: ['mul', 23, 3] },   // animated worked example
  ],
}
```

Generator types live in `js/generators.js` (`count, next, skip, compare, placeValue, addFacts, subFacts, makeTen, missingAddend, factFamily, addThree, mulFacts, groups, divFacts, sharing, mulDivFamily, column, word, mixed`).
