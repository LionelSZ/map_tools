import proj4 from 'proj4'

// 定义坐标系
const coordSystems = {
    wgs84: 'EPSG:4326',
    webMercator: 'EPSG:3857',
    cgcs2000: 'EPSG:4490'
}

// 定义proj4坐标系参数
proj4.defs('EPSG:4490', '+proj=longlat +ellps=GRS80 +no_defs')

// GCJ-02 火星坐标系与 WGS84 转换
const PI = 3.1415926535897932384626
const a = 6378245.0
const ee = 0.00669342162296594323

function transformLat(lng, lat) {
    let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
    ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0
    ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0
    return ret
}

function transformLng(lng, lat) {
    let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0
    ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0
    ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0
    return ret
}

function outOfChina(lng, lat) {
    return (lng < 72.004 || lng > 137.8347) || (lat < 0.8293 || lat > 55.8271)
}

// WGS84 to GCJ-02
function wgs84ToGcj02(lng, lat) {
    if (outOfChina(lng, lat)) {
        return [lng, lat]
    }
    let dlat = transformLat(lng - 105.0, lat - 35.0)
    let dlng = transformLng(lng - 105.0, lat - 35.0)
    const radlat = lat / 180.0 * PI
    let magic = Math.sin(radlat)
    magic = 1 - ee * magic * magic
    const sqrtmagic = Math.sqrt(magic)
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI)
    dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI)
    const mglat = lat + dlat
    const mglng = lng + dlng
    return [mglng, mglat]
}

// GCJ-02 to WGS84
function gcj02ToWgs84(lng, lat) {
    if (outOfChina(lng, lat)) {
        return [lng, lat]
    }
    let dlat = transformLat(lng - 105.0, lat - 35.0)
    let dlng = transformLng(lng - 105.0, lat - 35.0)
    const radlat = lat / 180.0 * PI
    let magic = Math.sin(radlat)
    magic = 1 - ee * magic * magic
    const sqrtmagic = Math.sqrt(magic)
    dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI)
    dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI)
    const mglat = lat - dlat
    const mglng = lng - dlng
    return [mglng, mglat]
}

// GCJ-02 to BD-09
function gcj02ToBd09(lng, lat) {
    const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * Math.PI * 3000.0 / 180.0)
    const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * Math.PI * 3000.0 / 180.0)
    const bd_lng = z * Math.cos(theta) + 0.0065
    const bd_lat = z * Math.sin(theta) + 0.006
    return [bd_lng, bd_lat]
}

// BD-09 to GCJ-02
function bd09ToGcj02(lng, lat) {
    const x = lng - 0.0065
    const y = lat - 0.006
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * Math.PI * 3000.0 / 180.0)
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * Math.PI * 3000.0 / 180.0)
    const gg_lng = z * Math.cos(theta)
    const gg_lat = z * Math.sin(theta)
    return [gg_lng, gg_lat]
}

// BD-09 to WGS84
function bd09ToWgs84(lng, lat) {
    const gcj02 = bd09ToGcj02(lng, lat)
    return gcj02ToWgs84(gcj02[0], gcj02[1])
}

// WGS84 to BD-09
function wgs84ToBd09(lng, lat) {
    const gcj02 = wgs84ToGcj02(lng, lat)
    return gcj02ToBd09(gcj02[0], gcj02[1])
}

export function useCoordinateConversion() {
    /**
     * 转换坐标
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @param {string} from - 源坐标系 (wgs84, gcj02, bd09, webMercator, cgcs2000)
     * @param {string} to - 目标坐标系 (wgs84, gcj02, bd09, webMercator, cgcs2000)
     * @returns {Array} [lng, lat]
     */
    const convert = (lng, lat, from, to) => {
        if (from === to) {
            return [lng, lat]
        }

        let coords = [lng, lat]

        // 先转换到 WGS84
        if (from === 'gcj02') {
            coords = gcj02ToWgs84(lng, lat)
        } else if (from === 'bd09') {
            coords = bd09ToWgs84(lng, lat)
        } else if (from === 'webMercator') {
            coords = proj4(coordSystems.webMercator, coordSystems.wgs84, [lng, lat])
        } else if (from === 'cgcs2000') {
            coords = proj4(coordSystems.cgcs2000, coordSystems.wgs84, [lng, lat])
        }

        // 从 WGS84 转换到目标坐标系
        if (to === 'gcj02') {
            coords = wgs84ToGcj02(coords[0], coords[1])
        } else if (to === 'bd09') {
            coords = wgs84ToBd09(coords[0], coords[1])
        } else if (to === 'webMercator') {
            coords = proj4(coordSystems.wgs84, coordSystems.webMercator, coords)
        } else if (to === 'cgcs2000') {
            coords = proj4(coordSystems.wgs84, coordSystems.cgcs2000, coords)
        }

        return coords
    }

    /**
     * 批量转换坐标
     * @param {Array} coordinates - 坐标数组 [[lng, lat], ...]
     * @param {string} from - 源坐标系
     * @param {string} to - 目标坐标系
     * @returns {Array} 转换后的坐标数组
     */
    const convertBatch = (coordinates, from, to) => {
        return coordinates.map(coord => convert(coord[0], coord[1], from, to))
    }

    /**
     * 格式化坐标输出
     * @param {Array} coords - [lng, lat]
     * @param {number} precision - 精度（小数位数）
     * @returns {string} "lng, lat"
     */
    const formatCoords = (coords, precision = 6) => {
        return `${coords[0].toFixed(precision)}, ${coords[1].toFixed(precision)}`
    }

    /**
     * 解析坐标字符串
     * @param {string} coordsStr - "lng, lat"
     * @returns {Array|null} [lng, lat] 或 null
     */
    const parseCoords = (coordsStr) => {
        const parts = coordsStr.split(',').map(p => p.trim())
        if (parts.length !== 2) return null

        const lng = parseFloat(parts[0])
        const lat = parseFloat(parts[1])

        if (isNaN(lng) || isNaN(lat)) return null

        return [lng, lat]
    }

    return {
        convert,
        convertBatch,
        formatCoords,
        parseCoords
    }
}
