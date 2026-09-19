// Run: node test/algorithms.test.js
const Alg = require('../js/algorithms.js');

let failures = 0;
function assert(cond, msg) { if (!cond) { failures++; console.error('FAIL:', msg); } }

// Reassemble the text of a row from cells (after all steps done), ignoring struck/hidden cells
function rowText(ws, r) {
  const done = ws.steps.length;
  const byCol = {};
  for (const cell of ws.cells) {
    if (cell.r !== r || cell.c < 0 || cell.c >= ws.ncols) continue;
    if (cell.cls && (cell.cls.includes('scratch') || cell.cls.includes('bmark') || cell.cls.includes('rem'))) continue;
    if (cell.strikeAt != null && cell.strikeAt < done) continue;
    if (cell.hideAt != null && cell.hideAt < done) continue;
    byCol[cell.c] = (byCol[cell.c] || '') + cell.text;
  }
  let s = '';
  for (let c = 0; c < ws.ncols; c++) s += byCol[c] || '';
  return s;
}

function checkSteps(ws, label) {
  ws.steps.forEach(st => {
    const joined = st.cells.map(c => c.text).join('');
    assert(joined === st.answer, `${label}: step ${st.idx} cells "${joined}" != answer "${st.answer}"`);
    assert(/^\d+$/.test(st.answer), `${label}: non-numeric answer "${st.answer}"`);
    assert(st.prompt && st.hint, `${label}: step ${st.idx} missing prompt/hint`);
    st.cells.forEach(c => assert(c.c >= -1 && c.c <= ws.ncols, `${label}: cell col out of range ${c.c}`));
  });
}

const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

for (let t = 0; t < 3000; t++) {
  const a = rnd(0, 99999), b = rnd(0, 99999);
  const ws = Alg.add(a, b);
  checkSteps(ws, `add ${a}+${b}`);
  const ansRow = ws.rows.findIndex(r => r.answer);
  assert(Number(rowText(ws, ansRow)) === a + b, `add ${a}+${b}: got ${rowText(ws, ansRow)}`);
}
for (let t = 0; t < 3000; t++) {
  let a = rnd(0, 99999), b = rnd(0, 99999);
  if (b > a) [a, b] = [b, a];
  const ws = Alg.sub(a, b);
  checkSteps(ws, `sub ${a}-${b}`);
  const ansRow = ws.rows.findIndex(r => r.answer);
  assert(Number(rowText(ws, ansRow) || '0') === a - b, `sub ${a}-${b}: got "${rowText(ws, ansRow)}"`);
}
for (let t = 0; t < 3000; t++) {
  const a = rnd(1, 9999), b = rnd(1, 999);
  const ws = Alg.mul(a, b);
  checkSteps(ws, `mul ${a}x${b}`);
  const ansRow = ws.rows.findIndex(r => r.answer);
  assert(Number(rowText(ws, ansRow)) === a * b, `mul ${a}x${b}: got ${rowText(ws, ansRow)}`);
}
for (let t = 0; t < 3000; t++) {
  const d = rnd(2, 99), a = rnd(d, 99999);
  const ws = Alg.div(a, d);
  checkSteps(ws, `div ${a}/${d}`);
  const q = rowText(ws, 0);
  assert(Number(q) === Math.floor(a / d), `div ${a}/${d}: quotient got "${q}"`);
  assert(ws.remainder === a % d, `div ${a}/${d}: remainder`);
  const remStep = ws.steps.find(s => s.kind === 'remainder');
  if (a % d) assert(remStep && Number(remStep.answer) === a % d, `div ${a}/${d}: remainder step`);
  else assert(!remStep, `div ${a}/${d}: unexpected remainder step`);
}

// Specific traditional cases
const s1 = Alg.sub(300, 47);
console.log('300-47 steps:'); s1.steps.forEach(s => console.log('  ', s.kind, '|', s.prompt, '->', s.answer));
const d1 = Alg.div(412, 4);
console.log('412/4 steps:'); d1.steps.forEach(s => console.log('  ', s.kind, '|', s.prompt, '->', s.answer));
const m1 = Alg.mul(34, 27);
console.log('34x27 steps:'); m1.steps.forEach(s => console.log('  ', s.kind, '|', s.prompt, '->', s.answer));
const a1 = Alg.add(478, 256);
console.log('478+256 steps:'); a1.steps.forEach(s => console.log('  ', s.kind, '|', s.prompt, '->', s.answer));

console.log(failures ? `${failures} failures` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
