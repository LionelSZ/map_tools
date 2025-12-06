import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
// import cloudflare from '@cloudflare/vite-plugin'


export default defineConfig({
    plugins: [vue()],
    build: {
        outDir: 'dist'
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        port: 5173,
        open: true
    }
})
