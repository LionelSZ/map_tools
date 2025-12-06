import { createRouter, createWebHistory } from 'vue-router'
import MapboxLocator from '@/views/MapboxLocator.vue'
import GeoJsonViewer from '@/views/GeoJsonViewer.vue'
import MeasurementTool from '@/views/MeasurementTool.vue'
import QueryTool from '@/views/QueryTool.vue'
import EditTool from '@/views/EditTool.vue'
import CoordinateConverter from '@/views/CoordinateConverter.vue'
import Geocoder from '@/views/Geocoder.vue'

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
    },
    {
        path: '/measurement',
        name: 'MeasurementTool',
        component: MeasurementTool
    },
    {
        path: '/query',
        name: 'QueryTool',
        component: QueryTool
    },
    {
        path: '/edit',
        name: 'EditTool',
        component: EditTool
    },
    {
        path: '/coordinate-converter',
        name: 'CoordinateConverter',
        component: CoordinateConverter
    },
    {
        path: '/geocoder',
        name: 'Geocoder',
        component: Geocoder
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
