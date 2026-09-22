// backend/app.js

import dotenv from 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

import adminRoutes from './route/adminRoute.js'
import userRoutes from './route/userRoute.js'
import categoryRoutes from './route/categoryRoute.js'
import eventRoutes from './route/eventRoute.js'
import bookingRoutes from './route/bookingRoute.js'
import payoutRoutes from './route/payoutRoute.js'
import reviewRoute from './route/reviewRoute.js'
import venueRoute from './route/venueRoute.js'
import bannerRoute from './route/bannerRoute.js'
import newsletterRoute from './route/newsletterRoute.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Global Middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())

// CORS: allow credentials for cookies / cross-origin requests
app.use(
    cors({
        origin: true, // In production, allows the requesting origin or set exact domain
        credentials: true,
    }),
)

// API Routes
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)
app.use('/api/category', categoryRoutes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/api/events', eventRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/payouts', payoutRoutes)
app.use('/api/reviews', reviewRoute)
app.use('/api/venues', venueRoute)
app.use('/api/banners', bannerRoute)
app.use('/api/newsletter', newsletterRoute)

// Production Static Serving
if (process.env.NODE_ENV === 'production') {
    // Correct folder name: '../frontend/dist'
    const frontendBuildPath = path.join(__dirname, '../frontend/dist')
    app.use(express.static(frontendBuildPath))

    // Catch-all route to serve Vite index.html for client-side routing
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'))
    })
} else {
    app.get('/', (req, res) => {
        res.send('API is running...')
    })
}

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    })
})

export default app
