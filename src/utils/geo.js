// 坐标系与地图外链
//
// 项目里的景点坐标是 WGS-84（和 GPS、维基、OSM 一致），高德用的是 GCJ-02，
// 两者在北京相差约 300—500 米 —— 直接把 WGS-84 坐标塞给高德，点位会飘到隔壁街区。
// 这里做一次标准转换，再用高德的 URI API 打开，不需要任何 key。
//
// 为什么不用高德 JS API 嵌地图：
// 1. 需要注册「Web 端 (JS API)」类型的 key + 安全密钥，页面里必然明文可见；
// 2. 需求只是「标注大概位置 + 看路线先后」，自绘 SVG 已经够用，且离线可看；
// 3. URI 外链点开就是高德 App 或网页版，能直接导航，比嵌入更实用。
// 如果以后要嵌真地图，把 key 填到下面 AMAP_JS_KEY 即可，组件已经留好降级。

export const AMAP_JS_KEY = ''

const PI = Math.PI
const A = 6378245.0
const EE = 0.00669342162296594323

const outOfChina = (lng, lat) => lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271

const transformLat = (x, y) => {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(y * PI) + 40.0 * Math.sin((y / 3.0) * PI)) * 2.0) / 3.0
  ret += ((160.0 * Math.sin((y / 12.0) * PI) + 320 * Math.sin((y * PI) / 30.0)) * 2.0) / 3.0
  return ret
}

const transformLng = (x, y) => {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += ((20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(x * PI) + 40.0 * Math.sin((x / 3.0) * PI)) * 2.0) / 3.0
  ret += ((150.0 * Math.sin((x / 12.0) * PI) + 300.0 * Math.sin((x / 30.0) * PI)) * 2.0) / 3.0
  return ret
}

// WGS-84 → GCJ-02（高德、腾讯、百度底图都用这套偏移）
export const wgs84ToGcj02 = (lng, lat) => {
  if (outOfChina(lng, lat)) return { lng, lat }
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI)
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI)
  return { lng: lng + dLng, lat: lat + dLat }
}

const fmt = (value) => Number(value).toFixed(6)

// 单个景点的「在高德地图打开」
export const amapSpotUrl = (spot) => {
  if (!spot) return ''
  const { lng, lat } = wgs84ToGcj02(spot.lng, spot.lat)
  const name = encodeURIComponent(spot.name)
  return `https://uri.amap.com/marker?position=${fmt(lng)},${fmt(lat)}&name=${name}&coordinate=gaode&callnative=0&src=myplan`
}

// 一天的整条路线：多个点位一次打开，高德会按顺序标出来
export const amapDayUrl = (spots) => {
  if (!spots || !spots.length) return ''
  const points = spots
    .map((spot) => {
      const { lng, lat } = wgs84ToGcj02(spot.lng, spot.lat)
      return `${fmt(lng)},${fmt(lat)},${encodeURIComponent(spot.name)}`
    })
    .join('|')
  return `https://uri.amap.com/marker?positions=${points}&coordinate=gaode&callnative=0&src=myplan`
}
