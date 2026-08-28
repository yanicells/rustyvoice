export const C = {
  canvas: '#1A1A1A',
  sidebar: '#181818',
  raised: '#232323',
  composer: '#212121',
  overlay: '#E6EAF20D',
  overlayStrong: '#E6EAF217',
  item: '#F0F0F00F',
  border: '#E6EAF212',
  borderStrong: '#E6EAF224',
  sidebarBorder: '#292929',
  text: '#E2E2E2',
  secondary: '#A3A3A3',
  tertiary: '#7D7D7D',
  ghost: '#575757',
  accent: '#E2795B',
  accentDim: '#E2795B33',
  danger: '#E57373',
  ok: '#7DCEA0',
  inverse: '#E7E9EC',
  onInverse: '#17181C',
}

export const SIDEBAR_WIDTH = 252
export const TRAFFIC_LIGHT_CLEARANCE = process.platform === 'darwin' ? 86 : 8
export const TITLEBAR_HEIGHT = 48
export const CONTENT_MAX_WIDTH = 720

export const THEME = {
  text: C.text,
  textMuted: C.secondary,
  textFaint: C.tertiary,
  textDim: C.secondary,
  border: C.border,
  bg: C.canvas,
  accent: C.accent,
  caret: C.accent,
  fontSans: '.SystemUIFont',
}
