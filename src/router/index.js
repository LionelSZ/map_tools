import { createRouter, createWebHistory } from 'vue-router'
import MapboxLocator from '@/views/MapboxLocator.vue'
import GeoJsonViewer from '@/views/GeoJsonViewer.vue'

const routes = [
    {
        path: '/',
        redirect: '/locator'
    },
    {
        path: '/locator',
        name: 'MapboxLocator',
        component: MapboxLocator
    },
    {
        path: '/geojson',
        name: 'GeoJsonViewer',
        component: GeoJsonViewer
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
