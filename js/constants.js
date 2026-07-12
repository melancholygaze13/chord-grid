/** Base diagram size (css px). */
export const L = Object.freeze({ w: 440, h: 520 });

export const DEFAULT_TUNING = Object.freeze(['E', 'A', 'D', 'G', 'B', 'E']);
export const BASS_TUNING = Object.freeze(['E', 'A', 'D', 'G']);

export const INSTRUMENTS = Object.freeze({
  guitar: Object.freeze({ label: 'Guitar', tuning: DEFAULT_TUNING }),
  bass: Object.freeze({ label: 'Bass guitar', tuning: BASS_TUNING }),
});

/** Keep in sync with `index.html` font link. */
export const FONT_UI = '"Geist", system-ui, sans-serif';

export const LIGHT_THEME = Object.freeze({
  paper: '#fbfbfc',
  nut: '#2d3142',
  fretWire: '#d4d4d8',
  muted: '#52525b',
  openRing: '#3f3f46',
  dotDark: '#18181b',
  labelMuted: '#71717a',
});

export const DARK_THEME = Object.freeze({
  paper: '#141922',
  nut: '#edf2fc',
  fretWire: '#4d5768',
  muted: '#d5dae4',
  openRing: '#f3f7ff',
  dotDark: '#f1f5fb',
  labelMuted: '#b3bac8',
});
