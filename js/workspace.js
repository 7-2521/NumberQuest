/* Renders a worksheet from Alg.* as a paper-like grid.
   state = { done: number of steps completed, typed: chars typed for the active step,
             wrong: bool (shake active boxes), highlight: step index whose cells glow } */
const Workspace = (() => {
  // How typed characters fill the active step's target cells
  function distribute(step, typed) {
    let pos = 0;
    const out = [];
    let activeSet = false;
    for (const cell of step.cells) {
      const len = cell.text.length;
      const text = typed.slice(pos, pos + len);
      const full = text.length >= len;
      const active = !activeSet && !full;
      if (active) activeSet = true;
      out.push({ cell, text, active, len });
      pos += len;
    }
    return out;
  }
  const expectedLength = step => step.cells.reduce((n, c) => n + c.text.length, 0);

  function render(ws, state) {
    const done = state.done;
    const active = ws.steps[done] || null;
    const fill = active ? distribute(active, state.typed || '') : [];
    const fillFor = cell => fill.find(f => f.cell === cell);
    const totalCols = ws.ncols + 2; // op column + digits + scratch column
    const grid = U.el('div.ws-grid', { style: { gridTemplateColumns: `var(--opw) repeat(${ws.ncols}, var(--cellw)) auto` } });
    if (ws.op === 'div') grid.classList.add('ws-div');

    // index cells by row/col
    const byPos = {};
    for (const cell of ws.cells) (byPos[`${cell.r}|${cell.c}`] = byPos[`${cell.r}|${cell.c}`] || []).push(cell);

    ws.rows.forEach((row, r) => {
      for (let c = -1; c <= ws.ncols; c++) {
        const box = U.el('div.ws-cell');
        if (row.small) box.classList.add('sm');
        if (c === -1) box.classList.add('opcol');
        if (c === ws.ncols) box.classList.add('scratchcol');
        if (row.underline === true && c < ws.ncols) box.classList.add('underline');
        if (row.underline && typeof row.underline === 'object' && c >= row.underline.from && c <= row.underline.to) box.classList.add('underline');
        if (row.bracket) { if (c >= 0 && c < ws.ncols) box.classList.add('bracket-top'); if (c === -1) box.classList.add('bracket-right'); }
        const items = (byPos[`${r}|${c}`] || []).slice().sort((a, b) => a.order - b.order);
        for (const cell of items) {
          if (cell.hideAt != null && cell.hideAt < done) continue;
          if (cell.showAt === -1 || cell.showAt < done) {
            const span = U.el('span.ws-t', { text: cell.text });
            if (cell.small) span.classList.add('sm');
            if (cell.cls) span.classList.add(...cell.cls.split(' '));
            if (cell.strikeAt != null && cell.strikeAt < done) span.classList.add('struck');
            if (state.highlight != null && state.highlight >= 0 && cell.showAt === state.highlight) span.classList.add('fresh');
            box.appendChild(span);
          } else if (cell.showAt === done) {
            const f = fillFor(cell);
            const span = U.el('span.ws-in', { text: f ? f.text : '' });
            if (cell.small) span.classList.add('sm');
            if (cell.cls) span.classList.add(...cell.cls.split(' '));
            if (f && f.active) span.classList.add(state.demo ? 'preview' : 'active');
            if (f && f.len > 1) span.classList.add('wide');
            if (state.wrong) span.classList.add('wrong');
            box.appendChild(span);
          }
        }
        grid.appendChild(box);
      }
    });
    return grid;
  }

  return { render, distribute, expectedLength };
})();
