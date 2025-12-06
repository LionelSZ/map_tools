import { MapboxConfig } from '@/config/mapbox'

const GEOCODING_API_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places'

// 本地缓存，减少API调用
const cache = new Map()

export function useGeocoding() {
    /**
     * 正向地理编码：地址转经纬度
     * @param {string} address - 地址字符串
     * @param {Object} options - 可选参数
     * @returns {Promise<Array>} 返回匹配结果数组
     */
    const forwardGeocode = async (address, options = {}) => {
        const cacheKey = `forward:${address}`
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey)
        }

        try {
            const params = new URLSearchParams({
                access_token: MapboxConfig.MAPBOX_TOKEN,
                limit: options.limit || 5,
                language: options.language || 'zh',
                ...options
            })

            const url = `${GEOCODING_API_BASE}/${encodeURIComponent(address)}.json?${params}`
            const response = await fetch(url)

            if (!response.ok) {
                throw new Error('Geocoding request failed')
            }

            const data = await response.json()
            const results = data.features.map(feature => ({
                place_name: feature.place_name,
                place_name_zh: feature.place_name_zh || feature.place_name,
                center: feature.center, // [lng, lat]
                bbox: feature.bbox,
                relevance: feature.relevance,
                properties: feature.properties,
                context: feature.context
            }))

            cache.set(cacheKey, results)
            return results
        } catch (error) {
            console.error('Forward geocoding error:', error)
            throw error
        }
    }

    /**
     * 逆向地理编码：经纬度转地址
     * @param {number} lng - 经度
     * @param {number} lat - 纬度
     * @param {Object} options - 可选参数
     * @returns {Promise<Object>} 返回地址信息
     */
    const reverseGeocode = async (lng, lat, options = {}) => {
        const cacheKey = `reverse:${lng},${lat}`
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey)
        }

        try {
            const params = new URLSearchParams({
                access_token: MapboxConfig.MAPBOX_TOKEN,
                language: options.language || 'zh',
                ...options
            })

            const url = `${GEOCODING_API_BASE}/${lng},${lat}.json?${params}`
            const response = await fetch(url)

            if (!response.ok) {
                throw new Error('Reverse geocoding request failed')
            }

            const data = await response.json()

            if (data.features.length === 0) {
                return null
            }

            const feature = data.features[0]
            const result = {
                place_name: feature.place_name,
                place_name_zh: feature.place_name_zh || feature.place_name,
                center: feature.center,
                address: feature.address || '',
                properties: feature.properties,
                context: feature.context,
                // 解析地址组件
                parsed: parseAddressComponents(feature)
            }

            cache.set(cacheKey, result)
            return result
        } catch (error) {
            console.error('Reverse geocoding error:', error)
            throw error
        }
    }

    /**
     * 解析地址组件
     * @param {Object} feature - Mapbox feature对象
     * @returns {Object} 解析后的地址组件
     */
    const parseAddressComponents = (feature) => {
        const components = {
            country: '',
            region: '',
            district: '',
            place: '',
            locality: '',
            neighborhood: '',
            address: ''
        }

        if (feature.context) {
            feature.context.forEach(item => {
                const id = item.id.split('.')[0]
                components[id] = item.text_zh || item.text
            })
        }

        if (feature.address) {
            components.address = feature.address
        }

        return components
    }

    /**
     * 批量正向地理编码
     * @param {Array<string>} addresses - 地址数组
     * @param {Object} options - 可选参数
     * @returns {Promise<Array>} 返回结果数组
     */
    const batchForwardGeocode = async (addresses, options = {}) => {
        const results = []
        for (const address of addresses) {
            try {
                const result = await forwardGeocode(address, options)
                results.push({
                    address,
                    success: true,
                    data: result[0] || null
                })
            } catch (error) {
                results.push({
                    address,
                    success: false,
                    error: error.message
                })
            }
            // 添加延迟，避免API限流
            await new Promise(resolve => setTimeout(resolve, 200))
        }
        return results
    }

    /**
     * 批量逆向地理编码
     * @param {Array<Array>} coordinates - 坐标数组 [[lng, lat], ...]
     * @param {Object} options - 可选参数
     * @returns {Promise<Array>} 返回结果数组
     */
    const batchReverseGeocode = async (coordinates, options = {}) => {
        const results = []
        for (const [lng, lat] of coordinates) {
            try {
                const result = await reverseGeocode(lng, lat, options)
                results.push({
                    coordinate: [lng, lat],
                    success: true,
                    data: result
                })
            } catch (error) {
                results.push({
                    coordinate: [lng, lat],
                    success: false,
                    error: error.message
                })
            }
            // 添加延迟，避免API限流
            await new Promise(resolve => setTimeout(resolve, 200))
        }
        return results
    }

    /**
     * 清除缓存
     */
    const clearCache = () => {
        cache.clear()
    }

    /**
     * 获取缓存大小
     */
    const getCacheSize = () => {
        return cache.size
    }

    return {
        forwardGeocode,
        reverseGeocode,
        batchForwardGeocode,
        batchReverseGeocode,
        clearCache,
        getCacheSize
    }
}
