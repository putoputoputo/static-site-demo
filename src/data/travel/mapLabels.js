// 地图标签位置与短名
//
// 放在数据层而不是组件里，是因为 scripts/travel-map-report.mjs 要用同一份：
// 城区 15 个点挤在 100×140 像素内，标签位置只能手工排，两份各写一份必然漂移。
//
// dx / dy 是相对点位的像素偏移；anchor 决定文字从哪边展开（start 向右、end 向左、middle 居中）。
// 改完跑 `node scripts/travel-map-report.mjs`，它会检查越界与重叠。

export const mapLabelPos = {
  'forbidden-city': { dx: 9, dy: 4, anchor: 'start' },
  'jingshan-park': { dx: -9, dy: -3, anchor: 'end' },
  'beihai-park': { dx: 0, dy: -12, anchor: 'middle' },
  'tiananmen-square': { dx: -9, dy: 12, anchor: 'end' },
  'national-museum': { dx: 9, dy: 5, anchor: 'start' },
  qianmen: { dx: 9, dy: 5, anchor: 'start' },
  shichahai: { dx: 9, dy: 4, anchor: 'start' },
  yonghegong: { dx: 9, dy: 4, anchor: 'start' },
  guozijian: { dx: -9, dy: 4, anchor: 'end' },
  tiantan: { dx: 9, dy: 4, anchor: 'start' },
  'summer-palace': { dx: -9, dy: 4, anchor: 'end' },
  yuanmingyuan: { dx: 9, dy: 11, anchor: 'start' },
  'olympic-forest': { dx: -9, dy: -5, anchor: 'end' },
  'birds-nest': { dx: 0, dy: 16, anchor: 'middle' },
  'art-798': { dx: 9, dy: 4, anchor: 'start' },
}

// 图上只写短名，全名放在 title 与详情页
export const mapShortName = {
  'forbidden-city': '故宫',
  'tiananmen-square': '天安门广场',
  'national-museum': '国家博物馆',
  'jingshan-park': '景山',
  'beihai-park': '北海',
  qianmen: '前门',
  shichahai: '什刹海',
  yonghegong: '雍和宫',
  guozijian: '国子监',
  tiantan: '天坛',
  'summer-palace': '颐和园',
  yuanmingyuan: '圆明园',
  'olympic-forest': '奥森',
  'birds-nest': '鸟巢',
  'art-798': '798',
}
