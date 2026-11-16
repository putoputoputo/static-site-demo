// 高德 Web 服务（restapi.amap.com）封装
//
// 为什么走 restapi 而不是 JS API：
// 1. restapi 返回 JSON，响应头带 `Access-Control-Allow-Origin: *`，浏览器可以直连，不需要后端代理；
// 2. 不用往页面里塞 300KB 的 JS SDK，也不用 AMap 的容器和事件体系；
// 3. 我们只要三件事——地点搜索、路线规划、坐标解析，restapi 全有。
//
// 关于 key：
// - 必须是「Web 服务」类型的 key。JS API / Android / iOS 的 key 调 restapi 会返回
//   `USERKEY_PLAT_NOMATCH (10009)`；带 `platform=JS` 调又会要安全密钥 `INVALID_USER_SCODE (10008)`。
// - key 存在浏览器 localStorage 里，代码里只放一个默认值，换 key 不用重新构建。
// - 这个项目是自用的，key 明文在前端，不构成安全问题；但配额是共享的，别往外贴。

const BASE = 'https://restapi.amap.com/v3'
// v2：之前存过 JS API 平台的 key（调 restapi 必返 10009），换版本号使旧值失效，
// 免得用户明明换了默认 key、页面却还在读 localStorage 里那个坏的。
const KEY_STORAGE = 'myplan.amap.webkey.v2'

// 默认 key：由用户提供，平台已确认为「Web 服务」，
// 已实测通过 /v3/place/text（10000）与 /v3/direction/transit/integrated（status 1）。
export const DEFAULT_AMAP_KEY = '911a6fa515b1d72ec6f617e2fcf8fd2d'

export const getAmapKey = () => {
  try {
    return localStorage.getItem(KEY_STORAGE) || DEFAULT_AMAP_KEY
  } catch {
    return DEFAULT_AMAP_KEY
  }
}

export const setAmapKey = (key) => {
  try {
    const value = String(key || '').trim()
    if (value) localStorage.setItem(KEY_STORAGE, value)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    /* 隐私模式下 localStorage 可能不可写，忽略：本次会话仍用默认 key */
  }
}

export const isCustomKey = () => {
  try {
    return Boolean(localStorage.getItem(KEY_STORAGE))
  } catch {
    return false
  }
}

// 清掉自填的 key，回到代码里的默认值
export const clearAmapKey = () => {
  try {
    localStorage.removeItem(KEY_STORAGE)
  } catch {
    /* 同上，忽略 */
  }
}

// 错误码 → 能照着做的一句话。高德的 info 是英文常量，直接抛给用户等于没说。
const ERROR_HINTS = {
  10001: 'key 不正确或已过期，去控制台复制一次',
  10003: '当日调用量超限，明天再试或换 key',
  10008: '这个 key 是 JS API 平台且启用了安全密钥，Web 服务用不了，请新建「Web 服务」类型的 key',
  10009: '这个 key 不是「Web 服务」平台的，去控制台新建一个「Web 服务」key',
  10012: '请求太频繁，隔几秒再试',
  10044: '该 key 的配额已用完',
}

export const explainAmapError = (payload) => {
  const code = Number(payload && payload.infocode)
  const hint = ERROR_HINTS[code]
  if (hint) return `${hint}（${code} ${payload.info || ''}）`
  return `高德返回错误：${(payload && payload.info) || '未知'}（${code || '?'}）`
}

const buildUrl = (path, params) => {
  const search = new URLSearchParams({ ...params, key: getAmapKey(), output: 'JSON' })
  return `${BASE}${path}?${search.toString()}`
}

// 统一请求：超时 8 秒（春节在路上用手机流量，别让页面干等）
const request = async (path, params, { timeout = 8000 } = {}) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const response = await fetch(buildUrl(path, params), { signal: controller.signal })
    const payload = await response.json()
    if (String(payload.status) !== '1') {
      return { ok: false, error: explainAmapError(payload), raw: payload }
    }
    return { ok: true, data: payload, raw: payload }
  } catch (error) {
    const aborted = error && error.name === 'AbortError'
    return {
      ok: false,
      error: aborted ? '高德接口超时（8 秒），检查网络后重试' : '连不上高德接口，可能是网络或跨域被拦',
      raw: null,
    }
  } finally {
    clearTimeout(timer)
  }
}

// 自检：拿一个最小的搜索请求试 key
export const probeAmapKey = async () => {
  const result = await request('/place/text', {
    keywords: '天安门',
    city: '北京',
    citylimit: 'true',
    offset: '1',
    page: '1',
  })
  return result.ok
    ? { ok: true, message: `key 可用，返回 ${result.data.count || 0} 条结果` }
    : { ok: false, message: result.error }
}

// 地点搜索：输入框联想用。城市锁北京，避免搜「南站」跑出天津的南站。
export const searchAmapPlaces = async (keyword) => {
  const kw = String(keyword || '').trim()
  if (kw.length < 2) return { ok: true, items: [] }
  const result = await request('/place/text', {
    keywords: kw,
    city: '北京',
    citylimit: 'true',
    offset: '8',
    page: '1',
    extensions: 'base',
  })
  if (!result.ok) return result
  const pois = Array.isArray(result.data.pois) ? result.data.pois : []
  const items = pois
    .map((poi) => {
      const [lng, lat] = String(poi.location || '').split(',').map(Number)
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
      return {
        id: `amap-${poi.id}`,
        name: poi.name,
        // 高德是 GCJ-02，这里原样保留，画到我们 WGS-84 的地图上时再转
        lat,
        lng,
        gcj: true,
        address: [poi.cityname, poi.adname, poi.address].filter(Boolean).join(' '),
      }
    })
    .filter(Boolean)
  return { ok: true, items }
}

// 公交路径规划：origin / destination 是 GCJ-02 的 { lng, lat }
export const planAmapTransit = async (origin, destination) => {
  if (!origin || !destination) return { ok: false, error: '起终点不完整' }
  const result = await request('/direction/transit/integrated', {
    origin: `${Number(origin.lng).toFixed(6)},${Number(origin.lat).toFixed(6)}`,
    destination: `${Number(destination.lng).toFixed(6)},${Number(destination.lat).toFixed(6)}`,
    city: '北京',
    cityd: '北京',
    strategy: '0',
    nightflag: '0',
  })
  if (!result.ok) return result

  const transits = (result.data.route && result.data.route.transits) || []
  const plans = transits.slice(0, 3).map((item, index) => {
    const seconds = Number(item.duration) || 0
    const meters = Number(item.distance) || 0
    const cost = Number(item.cost) || 0
    const walkMeters = Number(item.walking_distance) || 0
    const segments = (item.segments || []).map((segment) => {
      const busline = segment.bus && segment.bus.buslines && segment.bus.buslines[0]
      const walking = segment.walking && Number(segment.walking.distance)
      if (busline) {
        return {
          type: 'bus',
          name: busline.name,
          typeName: busline.type || '',
          stops: Number(busline.via_num || 0) + 1,
          from: busline.departure_stop && busline.departure_stop.name,
          to: busline.arrival_stop && busline.arrival_stop.name,
        }
      }
      return { type: 'walk', meters: walking || 0 }
    })
    return {
      index: index + 1,
      minutes: Math.round(seconds / 60),
      km: Math.round(meters / 100) / 10,
      cost,
      walkMeters,
      transfers: segments.filter((segment) => segment.type === 'bus').length - 1,
      segments,
    }
  })

  return { ok: true, plans }
}

// 打车 / 自驾的粗估，页面用作「不想挤地铁」的对照
export const planAmapDriving = async (origin, destination) => {
  if (!origin || !destination) return { ok: false, error: '起终点不完整' }
  const result = await request('/direction/driving', {
    origin: `${Number(origin.lng).toFixed(6)},${Number(origin.lat).toFixed(6)}`,
    destination: `${Number(destination.lng).toFixed(6)},${Number(destination.lat).toFixed(6)}`,
    strategy: '0',
    extensions: 'base',
  })
  if (!result.ok) return result
  const path = (result.data.route && result.data.route.paths && result.data.route.paths[0]) || {}
  return {
    ok: true,
    minutes: Math.round((Number(path.duration) || 0) / 60),
    km: Math.round((Number(path.distance) || 0) / 100) / 10,
    tolls: Number(path.tolls) || 0,
  }
}
