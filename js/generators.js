/* Problem generators. A lesson's `gen` spec is turned into a problem object:
   { kind: 'fact'|'missing'|'count'|'choice'|'column', ... , answer: string }
   Fact-style problems carry a `factKey` so per-fact accuracy can be tracked (like Reflex/XtraMath do). */

const Vis = (() => {
  const objs = (emoji, n, cls = '') => `<span class="objs ${cls}">${Array.from({ length: n }, () => `<span class="obj">${emoji}</span>`).join('')}</span>`;
  const groups = (emoji, counts) => `<div class="groups">${counts.map(n => `<div class="group">${objs(emoji, n)}</div>`).join('<span class="gplus">+</span>')}</div>`;
  const array = (emoji, rows, cols) => `<div class="array">${Array.from({ length: rows }, () => `<div class="arow">${objs(emoji, cols)}</div>`).join('')}</div>`;
  const removed = (emoji, total, gone) => `<span class="objs">${Array.from({ length: total }, (_, i) => `<span class="obj ${i >= total - gone ? 'gone' : ''}">${emoji}</span>`).join('')}</span>`;
  // base-ten blocks: hundreds flats, tens rods, ones cubes
  const flat = () => `<div class="hundred-flat">${'<i></i>'.repeat(100)}</div>`;
  const lbl = (n, word, labels) => (labels ? `<span class="pv-lbl">${n} ${word}${n > 1 ? 's' : ''}</span>` : '');
  const blocks = (h, t, o, labels = false) => `<div class="tens-ones">`
    + (h ? `<div class="pv-group"><div class="flats">${Array.from({ length: h }, flat).join('')}</div>${lbl(h, 'hundred', labels)}</div>` : '')
    + (t ? `<div class="pv-group"><div class="rods">${Array.from({ length: t }, () => '<div class="ten-rod"></div>').join('')}</div>${lbl(t, 'ten', labels)}</div>` : '')
    + (o ? `<div class="pv-group"><div class="ones-cubes">${Array.from({ length: o }, () => '<div class="one-cube"></div>').join('')}</div>${lbl(o, 'one', labels)}</div>` : '')
    + `</div>`;
  const tens = (t, o, labels) => blocks(0, t, o, labels);
  const number = (n, labels) => { const d = String(n).padStart(3, '0').split('').map(Number); return blocks(d[0], d[1], d[2], labels); };
  const chart = n => { const d = String(n).split(''); const names = ['Ones', 'Tens', 'Hundreds', 'Thousands'].slice(0, d.length).reverse(); return `<table class="pv"><tr>${names.map(x => `<th>${x}</th>`).join('')}</tr><tr>${d.map(x => `<td>${x}</td>`).join('')}</tr></table>`; };
  return { objs, groups, array, removed, tens, blocks, number, chart };
})();

const Gen = (() => {
  const { rand, pick, shuffle } = U;
  const EMOJI = ['🍎', '🍪', '⭐', '🐟', '🎈', '🚗', '🐞', '🌸', '🧁', '🐢', '🍓', '🦆', '🔵', '🍩', '🐝'];
  const NAMES = ['Sam', 'Mia', 'Leo', 'Ava', 'Max', 'Zoe', 'Eli', 'Ivy', 'Ben', 'Lily', 'Noah', 'Ruby'];
  const ITEMS = [['apple', 'apples', '🍎'], ['cookie', 'cookies', '🍪'], ['marble', 'marbles', '🔵'], ['sticker', 'stickers', '⭐'], ['balloon', 'balloons', '🎈'], ['fish', 'fish', '🐟'], ['toy car', 'toy cars', '🚗'], ['book', 'books', '📚'], ['coin', 'coins', '🪙'], ['flower', 'flowers', '🌸'], ['shell', 'shells', '🐚'], ['crayon', 'crayons', '🖍️']];

  const key = (op, a, b) => `${op}:${a}:${b}`;

  // Facts the player has struggled with recently, filtered by a predicate on {op,a,b}
  function weakFacts(profile, filter) {
    if (!profile || !profile.facts) return [];
    return Object.entries(profile.facts)
      .map(([k, f]) => { const [op, a, b] = k.split(':'); return { op, a: +a, b: +b, f }; })
      .filter(x => filter(x) && x.f.w > 0 && x.f.w >= x.f.c * 0.5)
      .sort((x, y) => (y.f.w - y.f.c) - (x.f.w - x.f.c))
      .slice(0, 8);
  }
  const maybeWeak = (profile, filter) => (Math.random() < 0.3 ? pick(weakFacts(profile, filter) || []) : null) || null;

  /* ---------- number sense ---------- */
  function count(s) {
    const n = rand(s.min || 1, s.max || 10), emoji = pick(EMOJI);
    return { kind: 'count', text: `How many ${emoji} are there?`, visual: Vis.objs(emoji, n, n > 10 ? 'wrap' : ''), answer: String(n) };
  }
  function next(s) {
    const max = s.max || 20;
    if (Math.random() < 0.5) { const n = rand(s.min || 0, max - 1); return { kind: 'fact', text: `What number comes right <b>after</b> ${n}?`, sequence: [n - 2, n - 1, n, '?'].filter(x => x === '?' || x >= 0), answer: String(n + 1) }; }
    const n = rand((s.min || 0) + 1, max); return { kind: 'fact', text: `What number comes right <b>before</b> ${n}?`, sequence: ['?', n, n + 1, n + 2], answer: String(n - 1) };
  }
  function skip(s) {
    const step = pick(s.steps || [2, 5, 10]);
    const start = step * rand(1, Math.floor((s.max || 50) / step) - 3);
    const seq = [start, start + step, start + 2 * step];
    return { kind: 'fact', text: `Count by ${step}s. What comes next?`, sequence: [...seq, '?'], answer: String(start + 3 * step) };
  }
  function compare(s) {
    const max = s.max || 20;
    let a = rand(0, max), b = Math.random() < 0.15 ? a : rand(0, max);
    const answer = a < b ? '<' : a > b ? '>' : '=';
    return {
      kind: 'choice', text: `Which sign makes this true?`, compare: [a, b], answer,
      choices: [{ v: '<', label: '<', sub: 'is less than' }, { v: '=', label: '=', sub: 'is equal to' }, { v: '>', label: '>', sub: 'is greater than' }],
    };
  }
  // Count base-ten blocks: how many hundreds / tens / ones, or what number is shown
  function bundles(s) {
    const n = rand(s.min || 11, s.max || 99);
    const d = String(n).padStart(3, '0').split('').map(Number);
    const ask = pick(s.ask || ['number', 'tens', 'ones']);
    const visual = Vis.number(n);
    if (ask === 'tens') return { kind: 'fact', text: 'How many <b>rods</b> are in the <b>tens</b> place?', visual, answer: String(d[1]) };
    if (ask === 'ones') return { kind: 'fact', text: 'How many <b>loose cubes</b> are in the <b>ones</b> place? (Do not count the cubes inside the rods.)', visual, answer: String(d[2]) };
    if (ask === 'hundreds') return { kind: 'fact', text: 'How many <b>big squares</b> are in the <b>hundreds</b> place?', visual, answer: String(d[0]) };
    return { kind: 'fact', text: 'What number do the blocks show?', visual, answer: String(n) };
  }
  function placeValue(s) {
    const max = s.max || 99;
    const n = rand(s.min || 10, max);
    const digits = String(n).split('').map(Number).reverse();
    const names = ['ones', 'tens', 'hundreds', 'thousands'];
    const variant = pick(s.variants || ['build', 'digit', 'howmany']);
    if (variant === 'build') {
      const parts = digits.map((d, i) => `${d} ${names[i]}`).reverse().filter(p => !p.startsWith('0 '));
      return { kind: 'fact', text: `What number is <b>${parts.join(' and ')}</b>?`, visual: s.visual === false ? null : Vis.number(n), answer: String(n) };
    }
    if (variant === 'digit') {
      const i = rand(0, digits.length - 1);
      return { kind: 'fact', text: `What digit is in the <b>${names[i]}</b> place of <b class="big">${n}</b>?`, answer: String(digits[i]) };
    }
    const i = rand(1, digits.length - 1);
    return { kind: 'fact', text: `How many <b>${names[i]}</b> are in <b class="big">${n}</b>?`, answer: String(digits[i]) };
  }

  /* ---------- addition & subtraction facts ---------- */
  function addFacts(s, profile) {
    const lo = s.min || 0, hi = s.max || 10;
    let a, b;
    const weak = maybeWeak(profile, x => x.op === 'add' && x.a + x.b <= hi && x.a + x.b >= lo);
    if (weak) { a = weak.a; b = weak.b; }
    else if (s.doubles) { a = rand(1, Math.floor(hi / 2)); b = a; }
    else if (s.plusOne) { a = rand(lo, hi - 1); b = pick([1, 2]); if (Math.random() < 0.5) [a, b] = [b, a]; }
    else { const sum = rand(Math.max(lo, 1), hi); const m = s.visual && sum >= 2 ? 1 : 0; a = rand(m, sum - m); b = sum - a; }
    const emoji = pick(EMOJI);
    return { kind: 'fact', text: `${a} + ${b} = ?`, eq: [a, '+', b], answer: String(a + b), factKey: key('add', a, b), visual: s.visual ? Vis.groups(emoji, [a, b]) : null };
  }
  function subFacts(s, profile) {
    const hi = s.max || 10, lo = s.min || 0;
    let a, b;
    const weak = maybeWeak(profile, x => x.op === 'sub' && x.a <= hi && x.a >= lo);
    if (weak) { a = weak.a; b = weak.b; }
    else if (s.fromTen) { a = 10; b = rand(1, 9); }
    else { a = rand(Math.max(lo, 1), hi); b = rand(lo ? 1 : 0, a); }
    const emoji = pick(EMOJI);
    return { kind: 'fact', text: `${a} − ${b} = ?`, eq: [a, '−', b], answer: String(a - b), factKey: key('sub', a, b), visual: s.visual ? Vis.removed(emoji, a, b) : null };
  }
  function makeTen(s) {
    const target = s.target || 10, a = rand(0, target);
    return { kind: 'missing', parts: [a, '+', '?', '=', target], answer: String(target - a), factKey: key('add', a, target - a), visual: s.visual ? Vis.groups('🔵', [a]) : null };
  }
  function missingAddend(s) {
    const c = rand(2, s.max || 20), a = rand(0, c);
    const parts = Math.random() < 0.5 ? [a, '+', '?', '=', c] : ['?', '+', a, '=', c];
    return { kind: 'missing', parts, answer: String(c - a), factKey: key('add', a, c - a) };
  }
  function factFamily(s) {
    const c = rand(2, s.max || 20), a = rand(1, c - 1), b = c - a;
    const v = rand(0, 3);
    const parts = [[a, '+', '?', '=', c], [c, '−', '?', '=', a], ['?', '−', b, '=', a], [c, '−', a, '=', '?']][v];
    const answer = [b, b, c, b][v];
    return { kind: 'missing', parts, answer: String(answer), factKey: v === 0 ? key('add', a, b) : key('sub', c, v === 2 ? b : a) };
  }
  function addThree(s) {
    const max = s.max || 20;
    let a = rand(1, 9), b = rand(1, 9), c = rand(1, 9);
    while (a + b + c > max) { a = rand(1, 9); b = rand(1, 9); c = rand(1, 9); }
    return { kind: 'fact', text: `${a} + ${b} + ${c} = ?`, eq: [a, '+', b, '+', c], answer: String(a + b + c) };
  }

  /* ---------- multiplication & division facts ---------- */
  function mulFacts(s, profile) {
    const tables = s.tables || [2, 5, 10], maxF = s.maxFactor || 10;
    let a, b;
    const weak = maybeWeak(profile, x => x.op === 'mul' && (tables.includes(x.a) || tables.includes(x.b)) && x.a <= maxF && x.b <= maxF);
    if (weak) { a = weak.a; b = weak.b; }
    else { a = pick(tables); b = rand(s.minFactor == null ? 0 : s.minFactor, maxF); if (Math.random() < 0.5 && !s.visual) [a, b] = [b, a]; }
    const emoji = pick(EMOJI);
    return { kind: 'fact', text: `${a} × ${b} = ?`, eq: [a, '×', b], answer: String(a * b), factKey: key('mul', a, b), visual: s.visual && a * b <= 40 && a * b > 0 ? Vis.array(emoji, a, b) : null };
  }
  function groups(s) {
    const g = rand(2, s.maxGroups || 5), n = rand(1, s.maxEach || 5), emoji = pick(EMOJI);
    return { kind: 'fact', text: `${g} groups of ${n}. How many in all?`, visual: Vis.groups(emoji, Array(g).fill(n)), answer: String(g * n), factKey: key('mul', g, n) };
  }
  function divFacts(s, profile) {
    const tables = s.tables || [2, 5, 10], maxQ = s.maxQuotient || 10;
    let d, q;
    const weak = maybeWeak(profile, x => x.op === 'div' && tables.includes(x.b));
    if (weak) { d = weak.b; q = weak.a / weak.b; } else { d = pick(tables); q = rand(s.minQuotient == null ? 1 : s.minQuotient, maxQ); }
    const emoji = pick(EMOJI);
    return { kind: 'fact', text: `${d * q} ÷ ${d} = ?`, eq: [d * q, '÷', d], answer: String(q), factKey: key('div', d * q, d), visual: s.visual && d * q <= 30 ? Vis.groups(emoji, Array(d).fill(q)) : null };
  }
  function sharing(s) {
    const d = rand(2, s.maxGroups || 5), q = rand(1, s.maxEach || 5), emoji = pick(EMOJI);
    return { kind: 'fact', text: `Share ${d * q} ${emoji} equally into ${d} groups. How many in each group?`, visual: Vis.objs(emoji, d * q, 'wrap'), answer: String(q), factKey: key('div', d * q, d) };
  }
  function mulDivFamily(s) {
    const a = rand(2, s.maxFactor || 10), b = rand(2, s.maxFactor || 10), c = a * b;
    const v = rand(0, 3);
    const parts = [[a, '×', '?', '=', c], [c, '÷', '?', '=', a], ['?', '÷', b, '=', a], [c, '÷', a, '=', '?']][v];
    const answer = [b, b, c, b][v];
    return { kind: 'missing', parts, answer: String(answer), factKey: v === 0 ? key('mul', a, b) : key('div', c, v === 2 ? b : a) };
  }

  /* ---------- column (written) arithmetic ---------- */
  const numWithDigits = n => rand(n === 1 ? 0 : Math.pow(10, n - 1), Math.pow(10, n) - 1);
  function columnNumbers(s) {
    const op = s.op;
    const [da, db] = s.digits || [2, 2];
    for (let tries = 0; tries < 500; tries++) {
      if (op === 'add') {
        const a = numWithDigits(da), b = numWithDigits(db);
        if (a + b === 0) continue;
        const A = String(a).split('').reverse(), B = String(b).split('').reverse();
        // count carries between columns; a carry out of the last column just makes a longer answer
        const n = Math.max(A.length, B.length);
        let carries = 0, c = 0, lastCarry = 0;
        for (let k = 0; k < n; k++) { const sum = (+A[k] || 0) + (+B[k] || 0) + c; c = sum >= 10 ? 1 : 0; if (k < n - 1) carries += c; else lastCarry = c; }
        if (s.regroup === 'none' && (carries || lastCarry)) continue;
        if (s.regroup !== 'none' && s.regroup !== 'mixed' && carries === 0) continue;
        return [a, b];
      }
      if (op === 'sub') {
        let a = numWithDigits(da), b = numWithDigits(db);
        if (s.zeros) { const str = String(a).split(''); str[str.length - 2] = '0'; if (str.length > 2 && Math.random() < 0.5) str[str.length - 3] = '0'; a = Number(str.join('')); if (String(a).length !== da) continue; }
        if (b > a) { if (da === db) [a, b] = [b, a]; else continue; }
        if (a === b) continue;
        const A = String(a).split('').reverse(), B = String(b).split('').reverse();
        let borrows = 0, chains = 0;
        const cur = A.map(Number);
        for (let k = 0; k < A.length; k++) {
          const y = +B[k] || 0;
          if (cur[k] < y) { let j = k + 1; while (cur[j] === 0) j++; if (j > k + 1) chains++; for (let m = j; m > k; m--) { cur[m] -= 1; cur[m - 1] += 10; } borrows++; }
        }
        if (s.regroup === 'none' && borrows) continue;
        if (s.regroup !== 'none' && s.regroup !== 'mixed' && borrows === 0) continue;
        if (s.zeros && chains === 0) continue;   // must actually borrow across a zero
        return [a, b];
      }
      if (op === 'mul') {
        const a = numWithDigits(da), b = numWithDigits(db);
        if (a < 2 || b < 2) continue;
        if (db > 1 && /[01]/.test(String(b))) continue;   // keep both multiplier digits meaningful
        if (db === 1) {
          const A = String(a).split('').reverse().map(Number);
          let carries = 0, c = 0;
          for (let k = 0; k < A.length - 1; k++) { const p = A[k] * b + c; c = Math.floor(p / 10); if (c) carries++; }
          if (s.regroup === 'none' && carries) continue;
          if (s.regroup !== 'none' && s.regroup !== 'mixed' && carries === 0) continue;
        }
        return [a, b];
      }
      if (op === 'div') {
        const d = s.divisorDigits === 2 ? rand(11, s.maxDivisor || 25) : rand(s.minDivisor || 2, 9);
        const q = numWithDigits(s.quotientDigits || (da - 1));
        if (q < 2) continue;
        if (!s.zerosOk && /0/.test(String(q))) continue;   // zeros in the quotient are taught in their own lesson
        const r = s.remainder ? rand(1, d - 1) : 0;
        const a = q * d + r;
        if (String(a).length !== da) continue;
        if (s.remainder === 'mixed' && Math.random() < 0.5) return [q * d, d];
        return [a, d];
      }
    }
    return op === 'div' ? [84, 4] : [23, 45];
  }
  function column(s) {
    const [a, b] = columnNumbers(s);
    const ws = Alg.build(s.op, a, b);
    return { kind: 'column', ws, text: ws.title, answer: ws.answerText };
  }

  /* ---------- word problems ---------- */
  function word(s) {
    const op = pick(s.ops || ['add', 'sub']);
    const max = s.max || 20;
    const n1 = pick(NAMES); let n2 = pick(NAMES); while (n2 === n1) n2 = pick(NAMES);
    const [one, many, emoji] = pick(ITEMS);
    const pl = n => (n === 1 ? one : many);
    let text, answer, visual = null, eq;
    if (op === 'add') {
      const a = rand(1, max - 1), b = rand(1, max - a);
      text = pick([
        `${n1} has ${a} ${pl(a)}. ${n2} gives ${n1} ${b} more. How many ${many} does ${n1} have now?`,
        `There are ${a} ${many} in a basket and ${b} ${many} on the table. How many ${many} are there in all?`,
        `${n1} picked ${a} ${many} in the morning and ${b} more in the afternoon. How many ${many} did ${n1} pick altogether?`,
      ]);
      answer = a + b; eq = `${a} + ${b} = ${answer}`;
      if (s.visual) visual = Vis.groups(emoji, [a, b]);
    } else if (op === 'sub') {
      const a = rand(2, max), b = rand(1, a);
      text = pick([
        `${n1} had ${a} ${pl(a)}. ${n1} gave ${b} to ${n2}. How many ${many} does ${n1} have left?`,
        `There were ${a} ${many} on the shelf. ${b} fell off. How many ${many} are still on the shelf?`,
        `${n1} has ${a} ${many} and ${n2} has ${b} ${many}. How many more does ${n1} have than ${n2}?`,
      ]);
      answer = a - b; eq = `${a} − ${b} = ${answer}`;
      if (s.visual) visual = Vis.removed(emoji, a, b);
    } else if (op === 'mul') {
      const a = rand(2, s.maxFactor || 9), b = rand(2, s.maxFactor || 9);
      text = pick([
        `There are ${a} boxes with ${b} ${many} in each box. How many ${many} are there in all?`,
        `${n1} has ${a} bags. Each bag holds ${b} ${many}. How many ${many} does ${n1} have?`,
        `${a} friends each bring ${b} ${many} to the party. How many ${many} in all?`,
      ]);
      answer = a * b; eq = `${a} × ${b} = ${answer}`;
    } else {
      const d = rand(2, s.maxFactor || 9), q = rand(2, s.maxFactor || 9);
      text = pick([
        `${n1} shares ${d * q} ${many} equally among ${d} friends. How many ${many} does each friend get?`,
        `${d * q} ${many} are packed into boxes of ${d}. How many boxes are needed?`,
        `${n1} puts ${d * q} ${many} into ${d} equal rows. How many ${many} are in each row?`,
      ]);
      answer = q; eq = `${d * q} ÷ ${d} = ${answer}`;
    }
    return { kind: 'fact', word: true, text: `${emoji} ${text}`, visual, answer: String(answer), eq };
  }

  const TYPES = { count, next, skip, compare, bundles, placeValue, addFacts, subFacts, makeTen, missingAddend, factFamily, addThree, mulFacts, groups, divFacts, sharing, mulDivFamily, column, word };

  function make(spec, profile) {
    if (spec.type === 'mixed') return make(pick(spec.gens), profile);
    const fn = TYPES[spec.type];
    if (!fn) throw new Error('Unknown generator ' + spec.type);
    return fn(spec, profile);
  }

  // Avoid showing the same problem twice in a row
  function makeSet(spec, n, profile) {
    const out = [], seen = new Set();
    let guard = 0;
    while (out.length < n && guard++ < n * 20) {
      const p = make(spec, profile);
      const sig = p.kind === 'column' ? p.ws.title : (p.text || '') + JSON.stringify(p.parts || '') + p.answer;
      if (seen.has(sig)) continue;
      seen.add(sig); out.push(p);
    }
    while (out.length < n) out.push(make(spec, profile));
    return out;
  }

  return { make, makeSet, key, weakFacts, TYPES };
})();
