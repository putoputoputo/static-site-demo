// 全站主题
//
// 两个维度，都只在这里算：
//   1. 明暗底（dark / light）—— 写到 <html data-theme>，CSS 里两套 token 值随之切换
//   2. 强调色 —— 写到 <html> 行内样式的 --accent-raw，其余档位由 CSS 的 color-mix 派生
//
// 为什么不把强调色算完再写进去：浅色模式下强调色要压暗才够对比度，
// 而「压暗」是 CSS 的 color-mix 干的活。JS 只给原色，CSS 决定实际用哪个，
// 这样 SSR（没有 document）时也是对的，不会出现「JS 没跑就一片白」。
//
// 存 localStorage，刷新不丢；CSS 的 :root 有同样的默认值，所以没 JS 也是原来的深色鎏金站。

export const STORAGE_KEY = 'myplan.theme.accent'
export const MODE_KEY = 'myplan.theme.mode'
export const DEFAULT_ACCENT = '#d4af37'
export const DEFAULT_MODE = 'dark'

export const THEME_MODES = [
  { id: 'dark', name: '深色', bg: '#121212' },
  { id: 'light', name: '浅色', bg: '#f2efe7' },
]

// 预设：金（原色）/ 绿 / 青 / 蓝 / 紫 / 红 / 近白
export const THEME_PRESETS = [
  { id: 'gold', name: '鎏金', hex: '#d4af37', note: '站点原色' },
  { id: 'moss', name: '苔绿', hex: '#7fb98a', note: '' },
  { id: 'pine', name: '松青', hex: '#6fb0a6', note: '' },
  { id: 'indigo', name: '靛蓝', hex: '#7fa6cf', note: '' },
  { id: 'violet', name: '紫藤', hex: '#b58cc0', note: '' },
  { id: 'cinnabar', name: '朱砂', hex: '#d87c6a', note: '' },
  { id: 'paper', name: '月白', hex: '#d8d3c2', note: '接近白' },
]

// 浅色模式下强调色压暗的比例，必须和 style.css 里 html[data-theme='light'] 的一致，
// 否则面板上显示的对比度和实际渲染的对不上
const LIGHT_MIX_BASE = '#1c1a14'
const LIGHT_MIX_RATIO = 0.52

const PAGE_BG_DARK = '#121212'
const PAGE_BG_LIGHT = '#f2efe7'

// 接受 #abc / abc / #aabbcc / aabbcc，统一成小写 #aabbcc；非法返回 null
export const normalizeHex = (input) => {
  const raw = String(input || '').trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return '#' + raw.split('').map((c) => c + c).join('').toLowerCase()
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return '#' + raw.toLowerCase()
  return null
}

export const hexToRgb = (hex) => {
  const norm = normalizeHex(hex)
  if (!norm) return null
  return [1, 3, 5].map((i) => parseInt(norm.slice(i, i + 2), 16))
}

export const rgbToHex = (rgb) =>
  '#' + rgb.map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('')

// 两色线性混合，weight 是前者占比（和 CSS color-mix 的语义一致）
export const mixHex = (a, b, weight = 0.5) => {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  if (!ca || !cb) return normalizeHex(a) || a
  return rgbToHex(ca.map((v, i) => v * weight + cb[i] * (1 - weight)))
}

// WCAG 相对亮度
export const relativeLuminance = (hex) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const contrastRatio = (a, b) => {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const light = Math.max(la, lb)
  const dark = Math.min(la, lb)
  return (light + 0.05) / (dark + 0.05)
}

export const PAGE_BG = PAGE_BG_DARK
export const pageBgOf = (mode) => (mode === 'light' ? PAGE_BG_LIGHT : PAGE_BG_DARK)

// 浅色模式下实际会被 CSS 用上的强调色（压暗版）
export const displayAccent = (hex, mode = DEFAULT_MODE) => {
  const accent = normalizeHex(hex) || DEFAULT_ACCENT
  if (mode !== 'light') return accent
  return mixHex(accent, LIGHT_MIX_BASE, LIGHT_MIX_RATIO)
}

export const accentTokens = (hex, mode = DEFAULT_MODE) => {
  const accent = normalizeHex(hex) || DEFAULT_ACCENT
  const shown = displayAccent(accent, mode)
  const rgb = hexToRgb(shown)
  const contrast = contrastRatio(shown, pageBgOf(mode))
  return {
    accent,
    shown,
    mode,
    soft: `rgba(${rgb.join(', ')}, 0.14)`,
    line: `rgba(${rgb.join(', ')}, 0.38)`,
    // 强调色当底（按钮、标签）时上面压的字：亮底配深字，深底配浅字
    ink: relativeLuminance(shown) > 0.35 ? '#141414' : '#f2efe6',
    contrast: Math.round(contrast * 10) / 10,
    level: contrast >= 4.5 ? 'ok' : contrast >= 3 ? 'warn' : 'bad',
  }
}

// 一行提示语，页面直接显示；底色不同，说法跟着变
export const contrastHint = (hex, mode = DEFAULT_MODE) => {
  const { contrast, level } = accentTokens(hex, mode)
  const where = mode === 'light' ? '浅底' : '深底'
  if (mode === 'light' && level !== 'ok') {
    // 浅色模式已经压暗过一次，再偏淡说明原色本身就太浅（比如月白）
    return `对比度 ${contrast}:1，这个颜色压暗后在浅底上仍偏淡，建议选深一点的原色`
  }
  if (level === 'ok') return `对比度 ${contrast}:1，${where}上读小字没问题`
  if (level === 'warn') return `对比度 ${contrast}:1，做小字偏淡，建议再${mode === 'light' ? '深' : '亮'}一点`
  return `对比度 ${contrast}:1，这个颜色在${where}上几乎看不清，只适合做大色块`
}

export const loadAccent = () => {
  try {
    return normalizeHex(localStorage.getItem(STORAGE_KEY)) || DEFAULT_ACCENT
  } catch {
    return DEFAULT_ACCENT
  }
}

export const saveAccent = (hex) => {
  const norm = normalizeHex(hex)
  if (!norm) return null
  try {
    localStorage.setItem(STORAGE_KEY, norm)
  } catch {
    /* 隐私模式写不了，本次会话仍生效 */
  }
  return norm
}

export const clearAccent = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* 同上 */
  }
}

export const normalizeMode = (mode) => (mode === 'light' ? 'light' : 'dark')

export const loadMode = () => {
  try {
    return normalizeMode(localStorage.getItem(MODE_KEY))
  } catch {
    return DEFAULT_MODE
  }
}

export const saveMode = (mode) => {
  const norm = normalizeMode(mode)
  try {
    localStorage.setItem(MODE_KEY, norm)
  } catch {
    /* 同上 */
  }
  return norm
}

export const clearMode = () => {
  try {
    localStorage.removeItem(MODE_KEY)
  } catch {
    /* 同上 */
  }
}

const rootOf = (root) => root || (typeof document !== 'undefined' ? document.documentElement : null)

// 只写原色：实际取值（浅色下压暗）由 CSS 的 color-mix 决定
export const applyAccent = (hex, root) => {
  const tokens = accentTokens(hex, DEFAULT_MODE)
  const el = rootOf(root)
  if (!el || !el.style) return tokens
  el.style.setProperty('--accent-raw', tokens.accent)
  return tokens
}

// 明暗底：写 data-theme，CSS 里两套 token 随之切换
export const applyMode = (mode, root) => {
  const norm = normalizeMode(mode)
  const el = rootOf(root)
  if (!el || !el.setAttribute) return norm
  el.setAttribute('data-theme', norm)
  return norm
}

// URL 上带 ?theme=light / ?theme=dark 可以临时强制某一套底色（不写 localStorage）。
// 用途：把「浅色版」的链接直接发给别人看，不用让对方先去点开关。
const modeFromUrl = () => {
  try {
    const value = new URLSearchParams(window.location.search).get('theme')
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

// 挂载前调用，避免首屏先闪一下默认深色 / 默认金色
export const initTheme = () => {
  const mode = modeFromUrl() || loadMode()
  applyMode(mode)
  applyAccent(loadAccent())
  return { accent: loadAccent(), mode }
}
