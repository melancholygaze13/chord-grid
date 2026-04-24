import { DEFAULT_TUNING, FONT_UI, LIGHT_THEME } from './constants.js';
import { computeChordLayout, round2 } from './geometry.js';

/**
 * @typedef {Object} DiagramOptions
 * @property {string[]=} tuning
 * @property {boolean=} showFretNumbers
 * @property {number} startFret
 * @property {boolean=} transparentDiagramBackground
 */

export function drawChordDiagram(c, positions, w, h, scale = 1, opts) {
  const t = opts.theme || LIGHT_THEME;
  const showNums = !!opts.showFretNumbers;
  const tuning =
    opts.tuning && opts.tuning.length === 6 ? opts.tuning : [...DEFAULT_TUNING];
  const startFret =
    typeof opts.startFret === 'number' && Number.isFinite(opts.startFret)
      ? Math.min(24, Math.max(1, Math.round(opts.startFret)))
      : 1;

  const lay = computeChordLayout(positions, w, h, scale, {
    showFretNumbers: showNums,
    startFret,
  });
  const {
    padL,
    innerW,
    stringXs,
    fretGap,
    boardTop,
    boardBottom,
    numFretRows,
    baseFret,
    nutH,
    openY,
    muteY,
  } = lay;

  c.save();
  const panelR = 10 * scale;
  const transparentBg = opts.transparentDiagramBackground === true;
  c.beginPath();
  c.roundRect(0, 0, w, h, panelR);
  c.clip();
  if (transparentBg) {
    c.clearRect(0, 0, w, h);
  } else {
    c.fillStyle = t.paper;
    c.fillRect(0, 0, w, h);
  }

  c.strokeStyle = t.fretWire;
  c.lineWidth = 1.35 * scale;
  c.lineCap = 'square';
  c.beginPath();
  for (let ridx = 1; ridx <= numFretRows; ridx++) {
    const y = round2(boardTop + ridx * fretGap);
    c.moveTo(padL, y);
    c.lineTo(padL + innerW, y);
  }
  c.stroke();
  c.lineCap = 'butt';

  if (showNums) {
    c.fillStyle = t.labelMuted;
    c.font = `600 ${11 * scale}px ${FONT_UI}`;
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    const fy = boardTop + fretGap * 0.5;
    c.fillText(String(baseFret), padL - 22 * scale, fy);
  } else if (baseFret > 1) {
    c.fillStyle = t.muted;
    c.font = `600 ${14 * scale}px ${FONT_UI}`;
    c.textAlign = 'right';
    c.textBaseline = 'middle';
    c.fillText(String(baseFret), padL - 12 * scale, boardTop + fretGap * 0.5);
    c.font = `500 ${9 * scale}px ${FONT_UI}`;
    c.fillStyle = t.labelMuted;
    c.textAlign = 'right';
    c.fillText('fr', padL - 12 * scale, boardTop + fretGap * 0.5 + 12 * scale);
  }

  const stringVisual = [
    { w: 3.25, hi: '#e4e2df', mid: '#6e6a66', lo: '#2f2c29' },
    { w: 2.6, hi: '#e8e6e4', mid: '#86827e', lo: '#45423f' },
    { w: 2.05, hi: '#eceae8', mid: '#9e9a96', lo: '#5a5754' },
    { w: 1.55, hi: '#efeeed', mid: '#b0aca8', lo: '#767370' },
    { w: 1.12, hi: '#f2f1f0', mid: '#c0bdba', lo: '#95928f' },
    { w: 0.8, hi: '#f5f4f3', mid: '#d0cecc', lo: '#b0aeac' },
  ];
  c.lineCap = 'butt';
  for (let s = 0; s < 6; s++) {
    const x = stringXs[s];
    const sv = stringVisual[s];
    const lw = sv.w * scale;
    const grad = c.createLinearGradient(x, boardTop, x, boardBottom);
    grad.addColorStop(0, sv.hi);
    grad.addColorStop(0.42, sv.mid);
    grad.addColorStop(1, sv.lo);
    c.strokeStyle = grad;
    c.lineWidth = lw;
    c.beginPath();
    c.moveTo(x, boardTop);
    c.lineTo(x, boardBottom);
    c.stroke();
  }

  c.fillStyle = t.nut;
  c.fillRect(padL - 0.5 * scale, boardTop - nutH, innerW + 1 * scale, nutH);

  const stringGap = innerW / 5;
  const openRingR = Math.min(7.4 * scale, fretGap * 0.29, stringGap * 0.31);
  const muteFontPx = Math.min(16 * scale, fretGap * 0.5, stringGap * 0.52);
  const openStrokeW = Math.min(2 * scale, openRingR * 0.24);

  c.textAlign = 'center';
  c.textBaseline = 'middle';

  for (let s = 0; s < 6; s++) {
    const x = stringXs[s];
    const fr = positions[s];
    if (fr === -1) {
      c.fillStyle = t.muted;
      c.font = `700 ${muteFontPx}px ${FONT_UI}`;
      c.fillText('×', x, muteY);
    } else if (fr === 0) {
      c.strokeStyle = t.openRing;
      c.lineWidth = openStrokeW;
      c.beginPath();
      c.arc(x, openY, openRingR, 0, Math.PI * 2);
      c.stroke();
    }
  }

  const dotR = Math.min(15 * scale, fretGap * 0.34, stringGap * 0.42);
  const getCellCenter = (s, fretRel) => ({
    cx: stringXs[s],
    cy: boardTop + fretGap * (fretRel + 0.5),
  });

  const barres = [];
  const usedBarre = new Array(6).fill(false);

  for (let s = 0; s < 6; ) {
    const f = positions[s];
    if (f <= 0) {
      s++;
      continue;
    }
    const rel = f - baseFret;
    if (rel < 0 || rel >= numFretRows) {
      s++;
      continue;
    }
    let e = s;
    while (
      e + 1 < 6 &&
      positions[e + 1] === f &&
      positions[e + 1] - baseFret >= 0 &&
      positions[e + 1] - baseFret < numFretRows
    ) {
      e++;
    }
    if (e > s && e - s + 1 >= 3) {
      const cy = boardTop + fretGap * (rel + 0.5);
      barres.push({ s0: s, s1: e, fret: f, cy, rel });
      for (let j = s; j <= e; j++) usedBarre[j] = true;
      s = e + 1;
    } else s++;
  }

  for (const b of barres) {
    const x0 = stringXs[b.s0];
    const x1 = stringXs[b.s1];
    const cy = b.cy;
    const barH = dotR * 2 - 1 * scale;
    const rCap = barH / 2;
    const left = Math.min(x0, x1) - dotR + 0.5 * scale;
    const right = Math.max(x0, x1) + dotR - 0.5 * scale;
    c.save();
    c.fillStyle = t.dotDark;
    c.beginPath();
    c.roundRect(left, cy - barH / 2, right - left, barH, rCap);
    c.fill();
    c.restore();
  }

  for (let s = 0; s < 6; s++) {
    if (usedBarre[s]) continue;
    const f = positions[s];
    if (f <= 0) continue;
    const rel = f - baseFret;
    if (rel < 0 || rel >= numFretRows) continue;
    const { cx, cy } = getCellCenter(s, rel);
    c.fillStyle = t.dotDark;
    c.beginPath();
    c.arc(cx, cy, dotR, 0, Math.PI * 2);
    c.fill();
  }

  c.fillStyle = t.labelMuted;
  c.font = `600 ${11 * scale}px ${FONT_UI}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  const labelY = h - 18 * scale;
  for (let s = 0; s < 6; s++) {
    c.fillText(tuning[s], stringXs[s], labelY);
  }

  c.restore();
}
