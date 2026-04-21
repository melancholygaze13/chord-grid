import { DEFAULT_TUNING, L } from './constants.js';
import { applyCanvasDpr } from './canvas-utils.js';
import { drawCheatSheetComposite } from './cheat-sheet.js';
import { drawChordDiagram } from './diagram.js';
import { computeChordLayout, fretRowFromY, stringIndexFromX } from './geometry.js';
import { installRoundRectPolyfill } from './polyfills.js';
import { computeSheetLayout } from './sheet-layout.js';
import { normalizedTuningOrDefault } from './tuning.js';

installRoundRectPolyfill();

/** Per-string frets: index 0 = low E; -1 mute, 0 open, >0 fret number. */
let positions = [0, 0, 0, 0, 0, 0];

/** @type {{ id: number; name: string; positions: number[]; startFret: number }[]} */
let cheatItems = [];
let nextCheatId = 1;

const tuningInput = document.getElementById('tuning');
const startFretSelect = document.getElementById('startFret');
const showFretNumbersEl = document.getElementById('showFretNumbers');
const canvas = document.getElementById('c');
const sheetCanvas = document.getElementById('sheetCanvas');
const sheetTitleInput = document.getElementById('sheetTitle');
const chordTitleInput = document.getElementById('chordTitle');

function getTuning() {
  return normalizedTuningOrDefault(tuningInput.value);
}

function fretNumbersVisible() {
  return showFretNumbersEl.checked;
}

function getStartFret() {
  const n = parseInt(startFretSelect.value, 10);
  if (Number.isFinite(n) && n >= 1 && n <= 24) return n;
  return 1;
}

function diagramOptionsForEditor() {
  return {
    tuning: getTuning(),
    showFretNumbers: fretNumbersVisible(),
    startFret: getStartFret(),
    transparentDiagramBackground: true,
  };
}

function populateStartFretSelect() {
  for (let f = 1; f <= 24; f++) {
    const opt = document.createElement('option');
    opt.value = String(f);
    opt.textContent = f === 1 ? '1 / Open' : String(f);
    startFretSelect.appendChild(opt);
  }
  startFretSelect.value = '1';
}

function renderSheetPreview() {
  const hint = document.getElementById('sheetEmptyHint');
  const n = cheatItems.length;
  if (n === 0) {
    sheetCanvas.style.display = 'none';
    hint.style.display = 'block';
    return;
  }
  hint.style.display = 'none';
  sheetCanvas.style.display = 'block';
  const layout = computeSheetLayout(n);
  const c = applyCanvasDpr(sheetCanvas, layout.totalW, layout.totalH, {
    scaleToContainer: true,
  });
  drawCheatSheetComposite(c, layout.totalW, layout.totalH, layout, cheatItems, sheetTitleInput.value, {
    getTuning,
    showFretNumbers: fretNumbersVisible(),
  });
}

function enterDraftMode() {
  positions = [0, 0, 0, 0, 0, 0];
  if (chordTitleInput) chordTitleInput.value = '';
  render();
}

function addChordToSheet(copyPositions) {
  const nm =
    (chordTitleInput && chordTitleInput.value.trim()) || `Chord ${cheatItems.length + 1}`;
  cheatItems.push({
    id: nextCheatId++,
    name: nm,
    positions: copyPositions,
    startFret: getStartFret(),
  });
  renderSheetPreview();
  enterDraftMode();
}

function getLogicalPoint(ev) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((ev.clientX - rect.left) / rect.width) * L.w,
    y: ((ev.clientY - rect.top) / rect.height) * L.h,
  };
}

function applyPointerEdit(ev) {
  if (!ev.isPrimary) return;

  const { x, y } = getLogicalPoint(ev);
  const sf = getStartFret();
  const lay = computeChordLayout(positions, L.w, L.h, 1, {
    showFretNumbers: fretNumbersVisible(),
    startFret: sf,
  });
  const s = stringIndexFromX(x, lay);
  if (s === null) return;

  const onBoard =
    x >= lay.padL - 10 &&
    x <= lay.padL + lay.innerW + 10 &&
    y >= lay.boardTop - 6 &&
    y <= lay.boardBottom + 6;

  const wantMute = ev.button === 2 || ev.altKey;
  if (wantMute) {
    ev.preventDefault();
    positions[s] = -1;
    render();
    return;
  }

  if (ev.shiftKey) {
    ev.preventDefault();
    positions[s] = 0;
    render();
    return;
  }

  if (ev.button === 0 && onBoard && !ev.altKey) {
    ev.preventDefault();
    const rel = fretRowFromY(y, lay);
    const nextFret = lay.baseFret + rel;
    if (positions[s] === nextFret) {
      positions[s] = 0;
    } else {
      positions[s] = nextFret;
    }
    render();
  }
}

function render() {
  const c = applyCanvasDpr(canvas, L.w, L.h);
  drawChordDiagram(c, positions, L.w, L.h, 1, diagramOptionsForEditor());
  renderSheetPreview();
}

function downloadPng() {
  if (cheatItems.length > 0) {
    const layout = computeSheetLayout(cheatItems.length);
    const exportScale = 2;
    const off = document.createElement('canvas');
    off.width = Math.round(layout.totalW * exportScale);
    off.height = Math.round(layout.totalH * exportScale);
    const oc = off.getContext('2d');
    oc.imageSmoothingEnabled = true;
    oc.imageSmoothingQuality = 'high';
    oc.setTransform(exportScale, 0, 0, exportScale, 0, 0);
    drawCheatSheetComposite(oc, layout.totalW, layout.totalH, layout, cheatItems, sheetTitleInput.value, {
      getTuning,
      showFretNumbers: fretNumbersVisible(),
    });
    const a = document.createElement('a');
    a.download = 'chord-sheet.png';
    a.href = off.toDataURL('image/png');
    a.click();
    return;
  }
  const exportScale = 3;
  const off = document.createElement('canvas');
  off.width = Math.round(L.w * exportScale);
  off.height = Math.round(L.h * exportScale);
  const oc = off.getContext('2d');
  oc.imageSmoothingEnabled = true;
  oc.imageSmoothingQuality = 'high';
  oc.setTransform(exportScale, 0, 0, exportScale, 0, 0);
  drawChordDiagram(oc, positions, L.w, L.h, 1, {
    ...diagramOptionsForEditor(),
    transparentDiagramBackground: false,
  });
  const a = document.createElement('a');
  a.download = 'chord.png';
  a.href = off.toDataURL('image/png');
  a.click();
}

function initialRender() {
  render();
}

function init() {
  populateStartFretSelect();

  tuningInput.value = DEFAULT_TUNING.join(', ');
  if (chordTitleInput) chordTitleInput.disabled = false;

  tuningInput.addEventListener('input', render);
  startFretSelect.addEventListener('change', render);
  showFretNumbersEl.addEventListener('change', render);
  sheetTitleInput.addEventListener('input', renderSheetPreview);

  canvas.addEventListener('pointerdown', applyPointerEdit);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  document.getElementById('addToSheetBtn').addEventListener('click', () => {
    addChordToSheet(positions.slice());
  });

  document.getElementById('pngBtn').addEventListener('click', downloadPng);
  window.addEventListener('resize', render);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initialRender);
  } else {
    initialRender();
  }
}

init();
