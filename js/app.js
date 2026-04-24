import { DARK_THEME, DEFAULT_TUNING, FONT_UI, L, LIGHT_THEME } from './constants.js';
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
const THEME_STORAGE_KEY = 'chord-grid-theme';

const tuningInput = document.getElementById('tuning');
const startFretSelect = document.getElementById('startFret');
const showFretNumbersEl = document.getElementById('showFretNumbers');
const canvas = document.getElementById('c');
const sheetCanvas = document.getElementById('sheetCanvas');
const sheetTitleInput = document.getElementById('sheetTitle');
const chordTitleInput = document.getElementById('chordTitle');
const sheetLibrary = document.getElementById('sheetLibrary');
const sheetLibraryList = document.getElementById('sheetLibraryList');
const sheetLibraryTitle = document.getElementById('sheetLibraryTitle');
const themeToggleBtn = document.getElementById('themeToggle');
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const EXPORT_WATERMARK = 'Made with ChordGrid';

let selectedTheme = loadPreferredTheme();

function loadPreferredTheme() {
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return systemThemeQuery.matches ? 'dark' : 'light';
}

function currentDiagramTheme() {
  return selectedTheme === 'dark' ? DARK_THEME : LIGHT_THEME;
}

function applyTheme(theme, { persist = true } = {}) {
  selectedTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = selectedTheme;
  updateThemeToggleLabel();
  if (persist) {
    window.localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);
  }
}

function updateThemeToggleLabel() {
  if (!themeToggleBtn) return;
  const darkActive = selectedTheme === 'dark';
  themeToggleBtn.setAttribute('aria-pressed', String(darkActive));
  themeToggleBtn.setAttribute(
    'aria-label',
    darkActive ? 'Switch to light theme' : 'Switch to dark theme'
  );
  const icon = themeToggleBtn.querySelector('.theme-toggle__icon');
  if (icon) {
    icon.textContent = darkActive ? '☀' : '☾';
  }
  const label = themeToggleBtn.querySelector('.theme-toggle__label');
  if (label) {
    label.textContent = darkActive ? 'Light mode' : 'Dark mode';
  }
}

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
    theme: currentDiagramTheme(),
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

function renderSheetLibrary() {
  if (!sheetLibrary || !sheetLibraryList || !sheetLibraryTitle) return;

  const count = cheatItems.length;
  sheetLibraryTitle.textContent = count === 1 ? '1 chord in sheet' : `${count} chords in sheet`;
  sheetLibrary.style.display = count > 0 ? 'block' : 'none';
  sheetLibraryList.textContent = '';

  cheatItems.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'sheet-library__item';

    const meta = document.createElement('div');
    meta.className = 'sheet-library__meta';

    const name = document.createElement('span');
    name.className = 'sheet-library__name';
    name.textContent = item.name || 'Untitled chord';

    const detail = document.createElement('span');
    detail.className = 'sheet-library__detail';
    detail.textContent = `Start fret ${item.startFret}`;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'sheet-library__remove secondary';
    removeBtn.textContent = '×';
    removeBtn.setAttribute('aria-label', `Remove ${item.name || 'chord'} from sheet`);
    removeBtn.addEventListener('click', () => {
      removeChordFromSheet(item.id);
    });

    meta.append(name, detail);
    row.append(meta, removeBtn);
    sheetLibraryList.appendChild(row);
  });
}

function renderSheetPreview() {
  const emptyState = document.getElementById('sheetEmptyState');
  const sheetScroll = document.getElementById('sheetScroll');
  renderSheetLibrary();
  const n = cheatItems.length;
  if (n === 0) {
    if (sheetScroll) sheetScroll.style.display = 'none';
    if (emptyState) emptyState.style.display = 'grid';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';
  if (sheetScroll) sheetScroll.style.display = 'block';
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

function removeChordFromSheet(id) {
  cheatItems = cheatItems.filter((item) => item.id !== id);
  renderSheetPreview();
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

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.download = filename;
  a.href = url;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function buildSinglePagePdf(jpegBytes, pageWidth, pageHeight) {
  const encoder = new TextEncoder();
  const chunks = [];
  let length = 0;
  const offsets = [0];

  const pushAscii = (text) => {
    const bytes = encoder.encode(text);
    chunks.push(bytes);
    length += bytes.length;
  };

  const pushBinary = (bytes) => {
    chunks.push(bytes);
    length += bytes.length;
  };

  const addObject = (body, binaryBytes, streamTail = '') => {
    offsets.push(length);
    pushAscii(`${offsets.length - 1} 0 obj\n`);
    pushAscii(body);
    if (binaryBytes) pushBinary(binaryBytes);
    if (streamTail) pushAscii(streamTail);
    pushAscii(`\nendobj\n`);
  };

  const imageStreamHeader =
    `<< /Type /XObject /Subtype /Image /Width ${Math.round(pageWidth)} /Height ${Math.round(pageHeight)} ` +
    `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
  const contentStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ`;

  pushAscii('%PDF-1.3\n');
  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObject(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`
  );
  addObject(imageStreamHeader, jpegBytes, '\nendstream');
  addObject(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);

  const startXref = length;
  pushAscii(`xref\n0 ${offsets.length}\n`);
  pushAscii('0000000000 65535 f \n');
  for (let i = 1; i < offsets.length; i++) {
    pushAscii(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  pushAscii(
    `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`
  );

  return new Blob(chunks, { type: 'application/pdf' });
}

function drawExportWatermark(ctx, width, height) {
  const paddingX = Math.max(18, Math.round(width * 0.024));
  const paddingY = Math.max(10, Math.round(height * 0.018));
  const fontSize = Math.max(10, Math.min(12, Math.round(width * 0.01)));

  ctx.save();
  ctx.font = `500 ${fontSize}px ${FONT_UI}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  const x = width - paddingX;
  const y = height - paddingY;
  ctx.fillStyle = 'rgba(20, 20, 22, 0.5)';
  ctx.fillText(EXPORT_WATERMARK, x, y);
  ctx.restore();
}

function renderExportCanvas() {
  if (cheatItems.length > 0) {
    const layout = computeSheetLayout(cheatItems.length);
    const exportScale = 2;
    const footerHeight = Math.max(28, Math.round(layout.totalW * 0.032));
    const off = document.createElement('canvas');
    off.width = Math.round(layout.totalW * exportScale);
    off.height = Math.round((layout.totalH + footerHeight) * exportScale);
    const oc = off.getContext('2d');
    oc.imageSmoothingEnabled = true;
    oc.imageSmoothingQuality = 'high';
    oc.setTransform(exportScale, 0, 0, exportScale, 0, 0);
    oc.fillStyle = '#f4f4f6';
    oc.fillRect(0, 0, layout.totalW, layout.totalH + footerHeight);
    drawCheatSheetComposite(oc, layout.totalW, layout.totalH, layout, cheatItems, sheetTitleInput.value, {
      getTuning,
      showFretNumbers: fretNumbersVisible(),
    });
    drawExportWatermark(oc, layout.totalW, layout.totalH + footerHeight);
    return {
      canvas: off,
      filenameBase: 'chord-sheet',
      width: layout.totalW,
      height: layout.totalH + footerHeight,
    };
  }
  const exportScale = 3;
  const footerHeight = Math.max(28, Math.round(L.w * 0.04));
  const off = document.createElement('canvas');
  off.width = Math.round(L.w * exportScale);
  off.height = Math.round((L.h + footerHeight) * exportScale);
  const oc = off.getContext('2d');
  oc.imageSmoothingEnabled = true;
  oc.imageSmoothingQuality = 'high';
  oc.setTransform(exportScale, 0, 0, exportScale, 0, 0);
  oc.fillStyle = '#f4f4f6';
  oc.fillRect(0, 0, L.w, L.h + footerHeight);
  drawChordDiagram(oc, positions, L.w, L.h, 1, {
    ...diagramOptionsForEditor(),
    transparentDiagramBackground: false,
    theme: LIGHT_THEME,
  });
  drawExportWatermark(oc, L.w, L.h + footerHeight);
  return {
    canvas: off,
    filenameBase: 'chord',
    width: L.w,
    height: L.h + footerHeight,
  };
}

function downloadPng() {
  const exportAsset = renderExportCanvas();
  const a = document.createElement('a');
  a.download = `${exportAsset.filenameBase}.png`;
  a.href = exportAsset.canvas.toDataURL('image/png');
  a.click();
}

function downloadPdf() {
  const exportAsset = renderExportCanvas();
  const jpegBytes = dataUrlToUint8Array(exportAsset.canvas.toDataURL('image/jpeg', 0.92));
  const pdfBlob = buildSinglePagePdf(jpegBytes, exportAsset.width, exportAsset.height);
  downloadBlob(pdfBlob, `${exportAsset.filenameBase}.pdf`);
}

function initialRender() {
  render();
}

function init() {
  applyTheme(selectedTheme, { persist: false });
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
  document.getElementById('pdfBtn').addEventListener('click', downloadPdf);
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      applyTheme(selectedTheme === 'dark' ? 'light' : 'dark');
      render();
    });
  }
  if (systemThemeQuery && typeof systemThemeQuery.addEventListener === 'function') {
    systemThemeQuery.addEventListener('change', (event) => {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return;
      applyTheme(event.matches ? 'dark' : 'light', { persist: false });
      render();
    });
  }
  window.addEventListener('resize', render);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(initialRender);
  } else {
    initialRender();
  }
}

init();
