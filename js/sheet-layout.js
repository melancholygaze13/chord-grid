import { L } from './constants.js';

/** Layout metrics for the multi-chord sheet canvas. */
export function computeSheetLayout(n) {
  const margin = 28;
  const titleBlock = 52;
  const gap = 14;
  const MIN_CELL = 122;
  const BASE_W = 1120;

  let cols = Math.min(6, Math.max(1, Math.ceil(Math.sqrt(n))));
  cols = Math.min(cols, n);

  let innerW = BASE_W - 2 * margin;
  let cellW = (innerW - (cols - 1) * gap) / cols;

  while (cellW < MIN_CELL && cols > 1) {
    cols -= 1;
    cellW = (innerW - (cols - 1) * gap) / cols;
  }

  let totalW = BASE_W;
  if (cellW < MIN_CELL && cols >= 1) {
    cellW = MIN_CELL;
    totalW = 2 * margin + cols * cellW + (cols - 1) * gap;
  }

  const MAX_CELL_W = L.w;
  if (cellW > MAX_CELL_W) {
    cellW = MAX_CELL_W;
    totalW = 2 * margin + cols * cellW + (cols - 1) * gap;
  }

  const rows = Math.ceil(n / cols);
  const nameBand = Math.max(14, Math.min(22, Math.round(11 + cellW * 0.018)));
  const diagramH = cellW * (520 / 440);
  const rowHeight = nameBand + diagramH + 8;
  const gridH = rows * rowHeight + (rows - 1) * gap;
  const totalH = margin + titleBlock + 16 + gridH + margin;

  return {
    totalW,
    totalH,
    margin,
    cols,
    rows,
    cellW,
    diagramH,
    nameBand,
    gap,
    titleBlock,
    rowHeight,
    diagramScale: Math.max(0.18, Math.min(2.1, cellW / L.w)),
  };
}
