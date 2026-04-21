export function round2(n) {
  return Math.round(n * 100) / 100;
}

/** Shared by `diagram.js` drawing and editor pointer hit-testing. */
export function computeChordLayout(positions, w, h, scale = 1, layoutOpts = {}) {
  const fretNumExtra = layoutOpts.showFretNumbers ? 36 * scale : 0;
  const padL = 52 * scale + fretNumExtra;
  const padR = 28 * scale;
  const padT = 58 * scale;
  const padB = 44 * scale;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const raw = layoutOpts.startFret;
  const baseFret =
    typeof raw === 'number' && Number.isFinite(raw)
      ? Math.min(24, Math.max(1, Math.round(raw)))
      : 1;

  const fretsPlayed = positions.filter((f) => f > 0);
  const maxF = fretsPlayed.length ? Math.max(...fretsPlayed) : baseFret + 3;
  const numFretRows = Math.min(5, Math.max(4, maxF - baseFret + 1));

  const stringXs = [];
  for (let i = 0; i < 6; i++) {
    stringXs.push(round2(padL + (innerW * i) / 5));
  }

  const fretGap = innerH / numFretRows;
  const boardTop = round2(padT);
  const boardBottom = round2(padT + innerH);
  const nutH = baseFret === 1 ? 5 * scale : 1.75 * scale;
  const openY = round2(boardTop - nutH - 14 * scale);
  const muteY = round2(boardTop - nutH - 13 * scale);

  return {
    scale,
    padL,
    padR,
    padT,
    padB,
    innerW,
    innerH,
    stringXs,
    fretGap,
    boardTop,
    boardBottom,
    numFretRows,
    baseFret,
    nutH,
    openY,
    muteY,
  };
}

export function stringIndexFromX(x, lay) {
  const left = lay.padL;
  const right = lay.padL + lay.innerW;
  const margin = 14;
  if (x < left - margin || x > right + margin) return null;
  const xc = Math.max(left, Math.min(right, x));
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < 6; i++) {
    const d = Math.abs(xc - lay.stringXs[i]);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

export function fretRowFromY(y, lay) {
  const ty = Math.max(lay.boardTop, Math.min(lay.boardBottom, y));
  const cellFloat = (ty - lay.boardTop) / lay.fretGap;
  return Math.max(0, Math.min(lay.numFretRows - 1, Math.round(cellFloat - 0.5)));
}
