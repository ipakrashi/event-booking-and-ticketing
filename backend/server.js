// backend/server.js

import dotenv from 'dotenv/config'
import express from 'express'
import dns from 'dns'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import adminRoutes from './route/adminRoute.js'
import userRoutes from './route/userRoute.js'
import categoryRoutes from './route/categoryRoute.js'
import connectDB from './util/connectDb.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dns.setServers(['8.8.8.8', '8.8.4.4'])

const app = express()
const PORT = process.env.PORT || 3000

//Connection to Database
connectDB()

// Middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cookieParser())
app.use(cors())

// Routes
app.use('/api/admin', adminRoutes)
app.use('/api/users', userRoutes)
app.use('/api/category', categoryRoutes)
// Expose the uploads directory so image URLs can be fetched publicly in the browser/client
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ---- PRODUCTION ROUTING BLOCK ----
if (process.env.NODE_ENV === 'production') {
    const clientBuildPath = path.join(__dirname, '../client/dist')
    app.use(express.static(clientBuildPath))

    // FIX: Replaced the string '*' with the Regular Expression /(.*)/
    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(clientBuildPath, 'index.html'))
    })
} else {
    app.get('/', (req, res) => {
        res.send('API is running...')
    })
}
// ----------------------------------
// Custom Error Handlers
app.use((err, req, res, next) => {
    // If the status code is still 200, change it to 500 (Server Error)
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode
    res.status(statusCode)
    // Return a JSON response with the error message
    res.json({
        message: err.message,
        // Only show the stack trace if you are in development mode
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    })
})

// Server Start
app.listen(PORT, () => {
    console.log(`Server Started On Port : ${PORT}`)
})
