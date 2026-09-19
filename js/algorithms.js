/* Step engines for the traditional written algorithms:
   column addition (carrying), column subtraction (borrowing), long multiplication, long division.

   Each engine returns a "worksheet":
     { ncols, rows: [{small, underline, bracket, answer}], cells: [...], steps: [...], answer, title, op }
   Cells: { r, c, text, small, cls, showAt, hideAt, strikeAt, order }
     - c ranges -1..ncols-1 ; column -1 holds the operator / divisor
     - showAt: index of the step that writes this cell (-1 = part of the problem)
     - strikeAt: step index after which the cell is drawn crossed out
     - hideAt: step index after which the cell disappears (scratch work)
   Steps: { idx, prompt, hint, answer, cells } — the kid types `answer`, one char per target cell
     (or the whole answer into a single target cell). */
const Alg = (() => {
  const NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands', 'hundred-thousands', 'millions'];
  const digitsLSF = n => String(n).split('').reverse().map(Number);
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];

  class Builder {
    constructor(ncols) { this.ncols = ncols; this.rows = []; this.cells = []; this.steps = []; }
    row(opts = {}) { this.rows.push(opts); return this.rows.length - 1; }
    cell(r, c, text, opts = {}) {
      const cell = Object.assign({ r, c, text: String(text), showAt: -1, order: 1 }, opts);
      this.cells.push(cell);
      return cell;
    }
    step(prompt, hint, answer, targets, opts = {}) {
      const idx = this.steps.length;
      const ans = String(answer);
      let pos = 0;
      const cells = targets.map(t => {
        const len = t.len || (targets.length === 1 ? ans.length : 1);
        const text = ans.slice(pos, pos + len); pos += len;
        return this.cell(t.r, t.c, text, { showAt: idx, small: !!t.small, cls: t.cls, order: t.order == null ? 1 : t.order });
      });
      this.steps.push({ idx, prompt, hint, answer: ans, cells, kind: opts.kind || 'write' });
      return idx;
    }
    build(extra) { return Object.assign({ ncols: this.ncols, rows: this.rows, cells: this.cells, steps: this.steps }, extra); }
  }

  // Right-aligned targets for a multi-digit value ending at column `endCol` on row r.
  const spread = (r, endCol, value) => String(value).split('').map((_, i, arr) => ({ r, c: endCol - (arr.length - 1 - i) }));

  /* ---------------- ADDITION ---------------- */
  function add(a, b) {
    const A = digitsLSF(a), B = digitsLSF(b), n = Math.max(A.length, B.length);
    const W = n + 1;
    const col = k => W - 1 - k;
    const bd = new Builder(W);
    const rC = bd.row({ small: true }), rA = bd.row(), rB = bd.row({ underline: true }), rS = bd.row({ answer: true });
    A.forEach((d, k) => bd.cell(rA, col(k), d));
    B.forEach((d, k) => bd.cell(rB, col(k), d));
    bd.cell(rB, -1, '+', { cls: 'op' });
    let carry = 0;
    for (let k = 0; k < n; k++) {
      const terms = [];
      if (carry) terms.push(carry);
      if (k < A.length) terms.push(A[k]);
      if (k < B.length) terms.push(B[k]);
      const s = terms.reduce((x, y) => x + y, 0);
      const expr = terms.join(' + ');
      const name = NAMES[k];
      if (terms.length === 1) {
        bd.step(`Only one number in the ${name} column. Bring down the ${s}.`, `There is nothing to add to the ${s}, so write ${s} in the ${name} place.`, s, [{ r: rS, c: col(k) }]);
        carry = 0;
      } else if (k === n - 1) {
        bd.step(`Add the ${name}: ${expr} = ?`, `${expr} = ${s}. This is the last column, so write the whole number.`, s, spread(rS, col(k), s));
      } else if (s >= 10) {
        const c1 = Math.floor(s / 10), d0 = s % 10;
        const i1 = bd.step(`Add the ${name}: ${expr} = ?`, `${expr} = ${s}.`, s, [{ r: rS, c: W, cls: 'scratch' }], { kind: 'scratch' });
        bd.step(`${s} has two digits! Write only the ${d0} in the ${name} place.`, `The ones digit of ${s} is ${d0}. Write ${d0} below the line.`, d0, [{ r: rS, c: col(k) }]);
        const i3 = bd.step(`Now carry the ${c1} to the ${NAMES[k + 1]} column.`, `Write a small ${c1} above the ${NAMES[k + 1]} column. It gets added in next.`, c1, [{ r: rC, c: col(k + 1), small: true }], { kind: 'carry' });
        bd.steps[i1].cells[0].hideAt = i3;
        carry = c1;
      } else {
        bd.step(`Add the ${name}: ${expr} = ?`, `${expr} = ${s}. Write ${s} in the ${name} place.`, s, [{ r: rS, c: col(k) }]);
        carry = 0;
      }
    }
    return bd.build({ op: 'add', a, b, answer: a + b, answerText: String(a + b), title: `${a} + ${b}` });
  }

  /* ---------------- SUBTRACTION ---------------- */
  function sub(a, b) {
    if (b > a) [a, b] = [b, a];
    const A = digitsLSF(a), B = digitsLSF(b), n = A.length, W = n;
    const col = k => W - 1 - k;
    const bd = new Builder(W);
    const rT = bd.row({ small: true }), rA = bd.row(), rB = bd.row({ underline: true }), rS = bd.row({ answer: true });
    const topCell = A.map((d, k) => bd.cell(rA, col(k), d));
    B.forEach((d, k) => bd.cell(rB, col(k), d));
    bd.cell(rB, -1, '−', { cls: 'op' });
    const cur = A.slice();
    const markCell = new Array(n).fill(null);
    const L = String(a - b).length - 1; // highest column of the answer
    for (let k = 0; k < n; k++) {
      const y = k < B.length ? B[k] : 0;
      if (cur[k] < y) {
        let j = k + 1;
        while (cur[j] === 0) j++;
        for (let m = j; m > k; m--) {
          const before = cur[m], after = before - 1, lower = m - 1;
          let why;
          if (m === j) {
            why = j === k + 1
              ? `You can't take ${y} from ${cur[k]}. Borrow 1 from the ${NAMES[m]} column.`
              : `You can't take ${y} from ${cur[k]}, and the ${NAMES[k + 1]} column is 0, so borrow from the ${NAMES[m]}.`;
          } else {
            why = `The ${NAMES[m]} column now has ${before}. Lend 1 to the ${NAMES[lower]} column.`;
          }
          const idx = bd.step(`${why} Cross out the ${before}. What does it become?`,
            `${before} − 1 = ${after}. Cross out the ${before} and write ${after} above it. The ${NAMES[lower]} column gets 10 more.`,
            after, [{ r: rT, c: col(m), small: true }], { kind: 'borrow' });
          topCell[m].strikeAt = idx;
          if (markCell[m]) markCell[m].strikeAt = idx;
          topCell[m] = bd.steps[idx].cells[0];
          markCell[lower] = bd.cell(topCell[lower].r, col(lower), '1', { small: true, cls: 'bmark', order: 0, showAt: idx });
          cur[lower] += 10; cur[m] = after;
        }
        bd.step(`The ${NAMES[k]} column now has ${cur[k]}. ${cur[k]} − ${y} = ?`, `${cur[k]} − ${y} = ${cur[k] - y}. Write it in the ${NAMES[k]} place.`, cur[k] - y, [{ r: rS, c: col(k) }]);
      } else {
        const diff = cur[k] - y;
        if (k > L && diff === 0) continue;
        if (k >= B.length) {
          bd.step(`Nothing is under the ${cur[k]} in the ${NAMES[k]} column. Bring it down: ${cur[k]} − 0 = ?`, `${cur[k]} − 0 = ${cur[k]}.`, diff, [{ r: rS, c: col(k) }]);
        } else {
          bd.step(`Subtract the ${NAMES[k]}: ${cur[k]} − ${y} = ?`, `${cur[k]} − ${y} = ${diff}. Write ${diff} in the ${NAMES[k]} place.`, diff, [{ r: rS, c: col(k) }]);
        }
      }
    }
    return bd.build({ op: 'sub', a, b, answer: a - b, answerText: String(a - b), title: `${a} − ${b}` });
  }

  /* ---------------- MULTIPLICATION ---------------- */
  function mul(a, b) {
    const A = digitsLSF(a), B = digitsLSF(b), nA = A.length, nB = B.length;
    const W = nA + nB;
    const col = k => W - 1 - k;
    const bd = new Builder(W);
    const rC = bd.row({ small: true }), rA = bd.row(), rB = bd.row({ underline: true });
    A.forEach((d, k) => bd.cell(rA, col(k), d));
    B.forEach((d, k) => bd.cell(rB, col(k), d));
    bd.cell(rB, -1, '×', { cls: 'op' });
    let rAddC = null, rTot = null;
    const partialRows = [];
    if (nB > 1) {
      rAddC = bd.row({ small: true });
      for (let i = 0; i < nB; i++) partialRows.push(bd.row(i === nB - 1 ? { underline: true } : {}));
      rTot = bd.row({ answer: true });
    } else {
      partialRows.push(bd.row({ answer: true }));
    }
    const partialDigits = [];
    let carryCells = [];
    for (let i = 0; i < nB; i++) {
      const d = B[i], r = partialRows[i];
      const digitsHere = {};
      if (i > 0) {
        const zeros = '0'.repeat(i);
        const idx = bd.step(
          `Now multiply by the ${NAMES[i]} digit, ${d}. That is really ${d} ${NAMES[i]}, so first write ${i === 1 ? 'a 0 in the ones place' : `${i} zeros on the right`} as a placeholder.`,
          `Write ${zeros} at the right end of the new row. Then multiply by ${d}.`, zeros,
          [...Array(i)].map((_, q) => ({ r, c: col(q) })), { kind: 'placeholder' });
        carryCells.forEach(c => { c.hideAt = idx; });   // clear the carries from the previous row (no room to cross them out)
        carryCells = [];
        for (let q = 0; q < i; q++) digitsHere[q] = 0;
      }
      let carry = 0;
      for (let k = 0; k < nA; k++) {
        const p = A[k] * d + carry, pos = k + i;
        const expr = `${A[k]} × ${d}` + (carry ? ` + ${carry}` : '');
        const where = nB > 1 ? '' : ` the ${NAMES[k]}`;
        if (k === nA - 1) {
          bd.step(`Multiply${where}: ${expr} = ?`, `${expr} = ${p}. This is the last digit, so write the whole number.`, p, spread(r, col(pos), p));
          String(p).split('').reverse().forEach((ch, q) => { digitsHere[pos + q] = Number(ch); });
        } else if (p >= 10) {
          const c1 = Math.floor(p / 10), d0 = p % 10;
          const i1 = bd.step(`Multiply${where}: ${expr} = ?`, `${expr} = ${p}.`, p, [{ r, c: W, cls: 'scratch' }], { kind: 'scratch' });
          bd.step(`${p} has two digits! Write only the ${d0} in the ${NAMES[pos]} place.`, `The ones digit of ${p} is ${d0}. Write ${d0}; the ${c1} gets carried.`, d0, [{ r, c: col(pos) }]);
          const i3 = bd.step(`Now carry the ${c1}. Write it above the ${NAMES[k + 1]} digit of ${a}.`, `Write a small ${c1} above the next column. Add it after the next multiplication.`, c1, [{ r: rC, c: col(k + 1), small: true }], { kind: 'carry' });
          bd.steps[i1].cells[0].hideAt = i3;
          carryCells.push(bd.steps[i3].cells[0]);
          digitsHere[pos] = d0; carry = c1;
        } else {
          bd.step(`Multiply${where}: ${expr} = ?`, `${expr} = ${p}. Write ${p} in the ${NAMES[pos]} place.`, p, [{ r, c: col(pos) }]);
          digitsHere[pos] = p; carry = 0;
        }
      }
      partialDigits.push(digitsHere);
    }
    if (nB > 1) {
      // add the partial products, column by column
      let kmax = 0;
      partialDigits.forEach(pd => Object.keys(pd).forEach(k => { kmax = Math.max(kmax, Number(k)); }));
      let carry = 0;
      for (let k = 0; k <= kmax; k++) {
        const terms = [];
        if (carry) terms.push(carry);
        partialDigits.forEach(pd => { if (pd[k] != null) terms.push(pd[k]); });
        const s = terms.reduce((x, y) => x + y, 0);
        const expr = terms.join(' + ');
        if (k === kmax) {
          bd.step(`Add the last column: ${expr} = ?`, `${expr} = ${s}. Write the whole number.`, s, spread(rTot, col(k), s));
        } else if (terms.length === 1) {
          bd.step(`Add the ${NAMES[k]} column. Only one number here, so bring down the ${s}.`, `Write ${s} in the ${NAMES[k]} place of the answer.`, s, [{ r: rTot, c: col(k) }]);
          carry = 0;
        } else if (s >= 10) {
          const c1 = Math.floor(s / 10), d0 = s % 10;
          const i1 = bd.step(`Add the ${NAMES[k]} column: ${expr} = ?`, `${expr} = ${s}.`, s, [{ r: rTot, c: W, cls: 'scratch' }], { kind: 'scratch' });
          bd.step(`${s} has two digits! Write only the ${d0} in the ${NAMES[k]} place.`, `Write ${d0} below; carry the ${c1}.`, d0, [{ r: rTot, c: col(k) }]);
          const i3 = bd.step(`Carry the ${c1} to the ${NAMES[k + 1]} column.`, `Write a small ${c1} above the ${NAMES[k + 1]} column of the partial products.`, c1, [{ r: rAddC, c: col(k + 1), small: true }], { kind: 'carry' });
          bd.steps[i1].cells[0].hideAt = i3;
          carry = c1;
        } else {
          bd.step(`Add the ${NAMES[k]} column: ${expr} = ?`, `${expr} = ${s}. Write ${s} in the ${NAMES[k]} place.`, s, [{ r: rTot, c: col(k) }]);
          carry = 0;
        }
      }
    }
    return bd.build({ op: 'mul', a, b, answer: a * b, answerText: String(a * b), title: `${a} × ${b}` });
  }

  /* ---------------- LONG DIVISION ---------------- */
  function div(a, d) {
    const A = String(a).split('').map(Number), n = A.length, W = n + 1;
    const bd = new Builder(W);
    const rQ = bd.row({ answer: true }), rD = bd.row({ bracket: true });
    A.forEach((x, i) => bd.cell(rD, i, x));
    bd.cell(rD, -1, d, { cls: 'divisor' });
    let cur = 0, started = false, note = '', workRow = rD;
    for (let i = 0; i < n; i++) {
      cur = cur * 10 + A[i];
      if (!started && cur < d) {
        note = `${d} doesn't go into ${cur}, so look at ${cur * 10 + A[i + 1]}. `;
        continue;
      }
      started = true;
      const q = Math.floor(cur / d), prod = q * d, rem = cur - prod;
      const qHint = q === 0
        ? `${d} is bigger than ${cur}, so it goes in 0 times. Write 0 above the ${A[i]}.`
        : `${d} × ${q} = ${prod}${prod + d <= 99999 ? `, and ${d} × ${q + 1} = ${prod + d} is too big` : ''}. So ${q} times. Write ${q} above the ${A[i]}.`;
      bd.step(`${note}How many times does ${d} go into ${cur}?`, qHint, q, [{ r: rQ, c: i }], { kind: 'divide' });
      note = '';
      if (q > 0) {
        const len = String(prod).length;
        const rM = bd.row({ underline: { from: i - len, to: i } });
        bd.cell(rM, i - len, '−', { cls: 'op minus', showAt: bd.steps.length });
        bd.step(`Multiply: ${q} × ${d} = ? Write it under the ${cur}.`, `${q} × ${d} = ${prod}. Write ${prod} under the ${cur} and draw a line.`, prod, spread(rM, i, prod), { kind: 'multiply' });
        const rR = bd.row();
        bd.step(`Subtract: ${cur} − ${prod} = ?`, `${cur} − ${prod} = ${rem}. Write ${rem} under the line.`, rem, spread(rR, i, rem), { kind: 'subtract' });
        workRow = rR;
      }
      if (i < n - 1) {
        bd.step(`Bring down the next digit of ${a}.`, `The next digit is ${A[i + 1]}. Write it next to the ${rem}. Now you have ${rem * 10 + A[i + 1]}.`, A[i + 1], [{ r: workRow, c: i + 1 }], { kind: 'bringdown' });
        cur = rem;
      } else if (rem > 0) {
        const idx = bd.steps.length;
        bd.cell(rQ, n, 'R', { cls: 'rem-label', order: 0, showAt: idx });
        bd.step(`No more digits to bring down, and ${rem} is left over. What is the remainder?`, `The leftover ${rem} is the remainder. Write R ${rem} next to the quotient.`, rem, [{ r: rQ, c: n, cls: 'rem' }], { kind: 'remainder' });
      }
    }
    const q = Math.floor(a / d), r = a % d;
    return bd.build({ op: 'div', a, b: d, answer: q, remainder: r, answerText: r ? `${q} R ${r}` : String(q), title: `${a} ÷ ${d}` });
  }

  const build = (op, a, b) => ({ add, sub, mul, div })[op](a, b);
  return { add, sub, mul, div, build, NAMES };
})();
if (typeof module !== 'undefined') module.exports = Alg;
