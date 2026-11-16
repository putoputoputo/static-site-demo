// 全站主题色
//
// 设计：只维护一个颜色（强调色），其余档位全部由它派生 ——
// 软背景 = 14% 透明度、描边 = 38%、强调色底上的文字按亮度在深/浅之间切。
// 这样「自定义颜色」不是给每个色相准备一套色板，而是任何颜色都能直接生效。
//
// 存 localStorage，刷新不丢；CSS 里 `:root` 有同样的默认值，
// 所以即使 JS 没跑（或 SSR 阶段），站点也是原来的鎏金色，不会掉色。
//
// 命名沿用数据层的习惯：纯函数导出，Node 里能直接 import 做回归。

export const STORAGE_KEY = 'myplan.theme.accent'
export const DEFAULT_ACCENT = '#d4af37'

// 预设：金（原色）/ 绿 / 青 / 蓝 / 紫 / 红 / 近白。
// 色值都按深底（#121212）调过，对比度在 4.5 以上，不至于选完看不清小字。
export const THEME_PRESETS = [
  { id: 'gold', name: '鎏金', hex: '#d4af37', note: '站点原色' },
  { id: 'moss', name: '苔绿', hex: '#7fb98a', note: '' },
  { id: 'pine', name: '松青', hex: '#6fb0a6', note: '' },
  { id: 'indigo', name: '靛蓝', hex: '#7fa6cf', note: '' },
  { id: 'violet', name: '紫藤', hex: '#b58cc0', note: '' },
  { id: 'cinnabar', name: '朱砂', hex: '#d87c6a', note: '' },
  { id: 'paper', name: '月白', hex: '#d8d3c2', note: '接近白' },
]

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

// 站点底色固定深色，强调色在它上面的可读性决定「能不能拿来做小字」
export const PAGE_BG = '#121212'

export const accentTokens = (hex) => {
  const accent = normalizeHex(hex) || DEFAULT_ACCENT
  const rgb = hexToRgb(accent)
  const contrast = contrastRatio(accent, PAGE_BG)
  return {
    accent,
    soft: `rgba(${rgb.join(', ')}, 0.14)`,
    line: `rgba(${rgb.join(', ')}, 0.38)`,
    // 强调色当底（按钮、标签）时上面压的字：亮色配深字，深色配浅字
    ink: relativeLuminance(accent) > 0.4 ? '#141414' : '#f2efe6',
    contrast: Math.round(contrast * 10) / 10,
    level: contrast >= 4.5 ? 'ok' : contrast >= 3 ? 'warn' : 'bad',
  }
}

// 一行提示语，页面直接显示
export const contrastHint = (hex) => {
  const { contrast, level } = accentTokens(hex)
  if (level === 'ok') return `对比度 ${contrast}:1，深底上读小字没问题`
  if (level === 'warn') return `对比度 ${contrast}:1，做小字偏淡，建议再亮一点`
  return `对比度 ${contrast}:1，这个颜色在深底上几乎看不清，只适合做大色块`
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

// 写到 <html> 的行内样式，优先于 style.css 里的 :root 默认值
export const applyAccent = (hex, root) => {
  const tokens = accentTokens(hex)
  const el = root || (typeof document !== 'undefined' ? document.documentElement : null)
  if (!el || !el.style) return tokens
  el.style.setProperty('--accent', tokens.accent)
  el.style.setProperty('--accent-soft', tokens.soft)
  el.style.setProperty('--accent-line', tokens.line)
  el.style.setProperty('--accent-ink', tokens.ink)
  return tokens
}

// 挂载前调用，避免首屏先闪一下默认金色
export const initTheme = () => applyAccent(loadAccent())
