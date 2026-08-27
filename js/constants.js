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
  stringLow: '#4f4d4a',
  stringHigh: '#bdbab5',
});

export const DARK_THEME = Object.freeze({
  paper: '#212630',
  nut: '#dbe6f5',
  fretWire: '#758094',
  muted: '#d1d9e8',
  openRing: '#ccd9e8',
  dotDark: '#edf5fc',
  labelMuted: '#a8b5c9',
  stringLow: '#c7ccd6',
  stringHigh: '#99a1b0',
});
