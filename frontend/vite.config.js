// frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:5000', // change to 3000 if your backend PORT is 3000
                changeOrigin: true,
                secure: false,
            },
            '/uploads': {
                target: 'http://localhost:5000', // allows uploaded poster images to load cleanly
                changeOrigin: true,
                secure: false,
            },
        },
    },
})
