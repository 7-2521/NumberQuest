// Run: node test/generators.test.js — loads the browser scripts in a sandbox and generates problems for every lesson
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const ctx = {
  console, window: {}, document: { getElementById: () => null, addEventListener: () => {}, createElement: () => ({ style: {}, classList: { add() {} }, appendChild() {}, setAttribute() {}, addEventListener() {} }), createTextNode: () => ({}) },
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} }, location: { protocol: 'file:' }, setTimeout, clearTimeout, requestAnimationFrame: () => 0, module: undefined,
};
vm.createContext(ctx);
for (const f of ['util', 'store', 'algorithms', 'generators', 'curriculum', 'workspace']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
}
vm.runInContext('Store.load()', ctx);

let failures = 0;
const assert = (c, m) => { if (!c) { failures++; console.error('FAIL:', m); } };

const lessons = vm.runInContext('Curriculum.LESSONS', ctx);
const ids = new Set();
for (const l of lessons) {
  assert(!ids.has(l.id), `duplicate lesson id ${l.id}`); ids.add(l.id);
  assert(l.learn && l.learn.length, `${l.id}: no learn slides`);
  for (const s of l.learn) {
    if (s.demo) {
      const ws = vm.runInContext(`Alg.build(${JSON.stringify(s.demo[0])}, ${s.demo[1]}, ${s.demo[2]})`, ctx);
      assert(ws.steps.length > 0, `${l.id}: demo has no steps`);
    } else assert(s.html && s.title, `${l.id}: slide missing html/title`);
  }
  const t0 = Date.now();
  const probs = vm.runInContext(`Gen.makeSet(${JSON.stringify(l.gen)}, 30, null)`, ctx);
  const dt = Date.now() - t0;
  assert(dt < 2000, `${l.id}: generation slow (${dt}ms)`);
  assert(probs.length === 30, `${l.id}: expected 30 problems`);
  for (const p of probs) {
    assert(typeof p.answer === 'string' && p.answer.length, `${l.id}: missing answer in ${JSON.stringify(p).slice(0, 80)}`);
    assert(['fact', 'missing', 'count', 'choice', 'column'].includes(p.kind), `${l.id}: bad kind ${p.kind}`);
    if (p.kind === 'column') {
      const g = l.gen.type === 'mixed' ? null : l.gen;
      if (g && g.regroup === 'none') {
        const hasCarry = p.ws.steps.some(s => s.kind === 'carry' || s.kind === 'borrow');
        assert(!hasCarry, `${l.id}: regroup none but got regrouping in ${p.ws.title}`);
      }
      if (g && g.regroup === 'some') {
        const hasCarry = p.ws.steps.some(s => s.kind === 'carry' || s.kind === 'borrow');
        assert(hasCarry, `${l.id}: regroup some but no regrouping in ${p.ws.title}`);
      }
      if (g && g.op === 'div' && g.remainder === false) assert(p.ws.remainder === 0, `${l.id}: unexpected remainder in ${p.ws.title}`);
      if (g && g.digits) {
        assert(String(p.ws.a).length === g.digits[0], `${l.id}: a digits wrong in ${p.ws.title}`);
        if (g.op !== 'div' && g.digits[1]) assert(String(p.ws.b).length === g.digits[1], `${l.id}: b digits wrong in ${p.ws.title}`);
      }
    }
    if (p.kind === 'fact' && p.eq && !p.word) {
      const [a, op, b] = p.eq;
      const expect = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : op === '÷' ? a / b : null;
      if (p.eq.length === 3) assert(Number(p.answer) === expect, `${l.id}: eq/answer mismatch ${p.eq.join(' ')} = ${p.answer}`);
      assert(expect >= 0, `${l.id}: negative result ${p.eq.join(' ')}`);
    }
  }
  const sample = probs[0];
  console.log(`${l.world.icon} ${l.id.padEnd(14)} ${sample.kind.padEnd(7)} e.g. ${(sample.text || (sample.parts && sample.parts.join(' ')) || '').replace(/<[^>]+>/g, '').slice(0, 60)} -> ${sample.answer}`);
}
console.log(`${lessons.length} lessons checked.`);
console.log(failures ? `${failures} failures` : 'ALL PASSED');
process.exit(failures ? 1 : 0);
