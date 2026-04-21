import { FONT_UI } from './constants.js';
import { drawChordDiagram } from './diagram.js';

export function drawCheatSheetComposite(ctx, w, h, layout, cheatItems, sheetTitle, view) {
  const tuning = view.getTuning();
  const showFret = view.showFretNumbers;

  ctx.save();
  ctx.fillStyle = '#f4f4f6';
  ctx.fillRect(0, 0, w, h);

  const title = sheetTitle.trim() || 'Chord sheet';
  ctx.fillStyle = '#141416';
  const titlePx = Math.min(24, Math.max(15, Math.round(w / 36)));
  ctx.font = `600 ${titlePx}px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(title, w / 2, layout.margin);

  const { margin, cols, cellW, diagramH, nameBand, gap, titleBlock, rowHeight, diagramScale } =
    layout;
  const baseY = margin + titleBlock + 12;

  cheatItems.forEach((it, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = margin + col * (cellW + gap);
    const y = baseY + row * (rowHeight + gap);

    ctx.save();
    const labelPx = Math.max(9, Math.min(13, Math.round(11 * (0.35 + 0.65 * diagramScale))));
    ctx.fillStyle = '#3f3f46';
    ctx.font = `600 ${labelPx}px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(it.name || '—', x + cellW / 2, y);

    ctx.translate(x, y + nameBand);
    drawChordDiagram(ctx, it.positions, cellW, diagramH, diagramScale, {
      tuning,
      showFretNumbers: showFret,
      startFret: it.startFret,
    });
    ctx.restore();
  });

  ctx.restore();
}
