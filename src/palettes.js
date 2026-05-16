export const palettes = {
  rose: {
    name: 'Rose',
    background: '#241018',
    panel: '#321823',
    surface: '#ffd9e4',
    text: '#fff5f8',
    muted: '#d8a9b9',
    eye: '#a81c43',
    modules: ['#a81c43', '#711a3a', '#49265b', '#c93657'],
    ghosts: ['#ebafca', '#dca2cc', '#f1bac9'],
    ghostOpacity: 0.5,
  },
  aurora: {
    name: 'Aurora',
    background: '#071b1f',
    panel: '#10272b',
    surface: '#d0f8ec',
    text: '#f1fffb',
    muted: '#9bd7c7',
    eye: '#008c78',
    modules: ['#008c78', '#0f766e', '#2453a6', '#9739a8', '#d78722'],
    ghosts: ['#95e0cb', '#b6c7ff', '#e8b6f2', '#ffd18a'],
    ghostOpacity: 0.48,
  },
  ink: {
    name: 'Ink',
    background: '#0c1017',
    panel: '#171d29',
    surface: '#f4f7fb',
    text: '#f8fbff',
    muted: '#aeb8ca',
    eye: '#111827',
    modules: ['#111827', '#23314a', '#3e5577', '#6d7585'],
    ghosts: ['#cfd7e4', '#dfe6f0', '#bdc7d6'],
    ghostOpacity: 0.42,
  },
  citrus: {
    name: 'Citrus',
    background: '#1b1708',
    panel: '#2c260f',
    surface: '#fff2bd',
    text: '#fff9e5',
    muted: '#e7ce7d',
    eye: '#9a5b00',
    modules: ['#9a5b00', '#b45309', '#047857', '#176087', '#7c2d12'],
    ghosts: ['#f4d87a', '#badf96', '#f0b36e'],
    ghostOpacity: 0.5,
  },
  lavender: {
    name: 'Lavender',
    background: '#171528',
    panel: '#222039',
    surface: '#e6e2ff',
    text: '#fbf9ff',
    muted: '#c4bee8',
    eye: '#5146d9',
    modules: ['#5146d9', '#2c2799', '#6b21a8', '#284f9b'],
    ghosts: ['#c4c4f0', '#d1c4f0', '#b4b4e6'],
    ghostOpacity: 0.5,
  },
};

export const defaultOptions = {
  text: 'https://example.com/pretty-qr',
  theme: 'aurora',
  size: 1024,
  quietZone: 10,
  frame: 'clover',
  cloverDepth: 0.07,
  cloverBaseSize: 0.41,
  eyes: 'custom',
  connected: true,
  shapes: 'mixed',
  ghosts: true,
  superBlocks: true,
  safeMode: false,
  seed: 1,
  logoText: '',
  customColors: null,
  eyeCenter: 'mixed',
  eyeDifferent: true,
  animatedEyes: false,
  eyeSpeed: 12,
};

export const optionChoices = {
  theme: Object.keys(palettes),
  frame: ['square', 'squircle', 'clover', 'ticket'],
  eyes: ['standard', 'custom', 'orbit'],
  eyeCenter: ['mixed', 'dot', 'poly', 'star', 'orbit', 'ring'],
  shapes: ['squares', 'dots', 'mixed'],
};

export function resolvePalette(options = {}) {
  const base = palettes[options.theme] ?? palettes[defaultOptions.theme];
  const custom = options.customColors ?? {};
  const modules = normalizeColorList(custom.modules, base.modules);
  const ghosts = normalizeColorList(custom.ghosts, base.ghosts);

  return {
    ...base,
    background: normalizeColor(custom.background, base.background),
    panel: normalizeColor(custom.panel, base.panel),
    surface: normalizeColor(custom.surface, base.surface),
    text: normalizeColor(custom.text, base.text),
    muted: normalizeColor(custom.muted, base.muted),
    eye: normalizeColor(custom.eye, base.eye),
    modules,
    ghosts,
  };
}

export function colorsFromPalette(palette) {
  return {
    background: palette.background,
    panel: palette.panel,
    surface: palette.surface,
    text: palette.text,
    muted: palette.muted,
    eye: palette.eye,
    modules: [...palette.modules],
    ghosts: [...palette.ghosts],
  };
}

function normalizeColor(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : fallback;
}

function normalizeColorList(value, fallback) {
  if (!Array.isArray(value)) return [...fallback];
  const colors = value.map((item) => normalizeColor(item, null)).filter(Boolean);
  return colors.length ? colors : [...fallback];
}
