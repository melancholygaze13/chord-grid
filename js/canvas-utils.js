/** Hi-DPI backing store; optional `scaleToContainer` for fluid preview width. */
export function applyCanvasDpr(mainCanvas, baseW, baseH, opts = {}) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  mainCanvas.width = Math.round(baseW * dpr);
  mainCanvas.height = Math.round(baseH * dpr);
  if (opts.scaleToContainer) {
    mainCanvas.style.width = '100%';
    mainCanvas.style.maxWidth = `${baseW}px`;
    mainCanvas.style.height = 'auto';
    mainCanvas.style.aspectRatio = `${baseW} / ${baseH}`;
    mainCanvas.style.marginLeft = 'auto';
    mainCanvas.style.marginRight = 'auto';
  } else {
    mainCanvas.style.width = `${baseW}px`;
    mainCanvas.style.height = `${baseH}px`;
    mainCanvas.style.maxWidth = '';
    mainCanvas.style.aspectRatio = '';
    mainCanvas.style.marginLeft = '';
    mainCanvas.style.marginRight = '';
  }
  const c = mainCanvas.getContext('2d');
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  return c;
}
