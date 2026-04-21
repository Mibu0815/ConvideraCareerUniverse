/**
 * Career Universe Design Tokens
 *
 * Convidera-aligned design system based on:
 * - convidera.com brand analysis (soft grey canvas, dark charcoal statements,
 *   Aeonik-style typography, orange accent dot, blue gradient blobs)
 * - Career Universe semantic needs (personal/admin/domain zones,
 *   skill-level progression)
 *
 * DO NOT hard-code colors, spacings, or font sizes anywhere else.
 * If a design decision isn't expressible via these tokens, update the tokens
 * first, then use them.
 */

export const colors = {
  // Neutral scale — the foundation
  canvas: '#F5F6F8',
  canvasDark: '#0A0A0B',
  surface: '#FFFFFF',
  surfaceSoft: '#FAFAFB',
  border: '#E4E6EA',
  borderStrong: '#D1D5DB',
  divider: '#EFF0F3',

  // Text
  textPrimary: '#0A0A0B',
  textSecondary: '#5A5D65',
  textMuted: '#9B9FA7',
  textInverse: '#F5F6F8',
  textInverseMuted: '#9B9FA7',

  // Brand accents — use sparingly
  brandDot: '#FF5A1F',
  brandBlue: '#0055FF',
  brandBlueHover: '#0044CC',
  brandBlueSubtle: '#E8EFFF',

  // Zone semantics (Career Universe specific)
  zonePersonal: '#00A878',
  zonePersonalSoft: '#E6F7F0',
  zoneAdmin: '#0A0A0B',
  zoneAdminSoft: '#F3F3F4',
  zoneDomain: '#0055FF',
  zoneDomainSoft: '#E8EFFF',

  // Status
  success: '#00A878',
  successSoft: '#E6F7F0',
  warning: '#FF5A1F',
  warningSoft: '#FFF0E8',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',
  info: '#0055FF',
  infoSoft: '#E8EFFF',

  // Skill level progression (blue scale — for hard skill levels 1-4)
  level1: '#DBEAFE',
  level2: '#93C5FD',
  level3: '#3B82F6',
  level4: '#1E40AF',
} as const

export const typography = {
  fontFamily: {
    display: 'var(--font-inter), system-ui, sans-serif',
    body: 'var(--font-inter), system-ui, sans-serif',
    mono: 'ui-monospace, SF Mono, Menlo, monospace',
  },
  scale: {
    displayXl: { size: '64px', lineHeight: '1.1', tracking: '-0.02em', weight: 600 },
    displayL:  { size: '48px', lineHeight: '1.15', tracking: '-0.02em', weight: 600 },
    h1:        { size: '32px', lineHeight: '1.2', tracking: '-0.01em', weight: 600 },
    h2:        { size: '24px', lineHeight: '1.3', tracking: '-0.01em', weight: 600 },
    h3:        { size: '20px', lineHeight: '1.4', tracking: '0', weight: 600 },
    h4:        { size: '18px', lineHeight: '1.4', tracking: '0', weight: 600 },
    bodyL:     { size: '18px', lineHeight: '1.6', tracking: '0', weight: 400 },
    body:      { size: '16px', lineHeight: '1.5', tracking: '0', weight: 400 },
    bodyS:     { size: '14px', lineHeight: '1.5', tracking: '0', weight: 400 },
    caption:   { size: '12px', lineHeight: '1.4', tracking: '0.02em', weight: 500 },
    overline:  { size: '11px', lineHeight: '1.3', tracking: '0.08em', weight: 600 },
  },
} as const

export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px',
} as const

export const radius = {
  none: '0',
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
  pill: '999px',
} as const

export const shadow = {
  none: 'none',
  xs: '0 1px 2px rgb(10 10 11 / 0.04)',
  sm: '0 2px 4px rgb(10 10 11 / 0.06)',
  md: '0 4px 12px rgb(10 10 11 / 0.08)',
  lg: '0 12px 24px rgb(10 10 11 / 0.10)',
  xl: '0 24px 48px rgb(10 10 11 / 0.14)',
} as const

export const layout = {
  pageMaxWidth: '1400px',
  contentMaxWidth: '1200px',
  narrowMaxWidth: '720px',
  contentPaddingX: {
    mobile: '16px',
    tablet: '24px',
    desktop: '32px',
  },
  navHeight: '64px',
  borderRadius: {
    input: '10px',
    button: '10px',
    card: '16px',
    pill: '999px',
  },
} as const

export const motion = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '320ms',
  },
  easing: {
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
} as const

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  banner: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  toast: 70,
  tooltip: 80,
} as const
