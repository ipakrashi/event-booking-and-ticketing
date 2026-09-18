// backend/middleware/appMiddleware.js

import path from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import asyncHandler from 'express-async-handler'
import multer from 'multer'
import User from '../model/user.js'

// ============================================================================
// 1. ENVIRONMENT & PATH SETUP (ES Modules)
// ============================================================================
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================================
// 2. AUTHENTICATION & SESSION CONCURRENCY (protect)
// ============================================================================
/**
 * Verifies the JWT from HTTP-only cookie, checks tokenVersion concurrency,
 * populates user role, and executes a heartbeat timestamp update.
 */
const protect = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.jwt

    if (!token) {
        res.status(401)
        throw new Error('Not Authorized, No Token')
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = await User.findById(decoded.userId || decoded.id)
            .select('-password')
            .populate('role')

        if (!req.user) {
            res.status(401)
            throw new Error('Not Authorized, User Not Found')
        }

        // Concurrency Guard: Detect if account was logged in elsewhere
        if (decoded.tokenVersion !== req.user.tokenVersion) {
            res.status(401)
            throw new Error(
                'Session expired. Your account was accessed from another device.',
            )
        }

        // Heartbeat: Asynchronously bump lastLogin timestamp without blocking the request pipeline
        User.updateOne({ _id: req.user._id }, { lastLogin: new Date() })
            .exec()
            .catch((err) =>
                console.error('Heartbeat update failed:', err.message),
            )

        next()
    } catch (error) {
        res.status(401)
        if (error.message.includes('Session expired')) {
            throw new Error(error.message)
        }
        throw new Error('Not Authorized, Invalid Token')
    }
})

// ============================================================================
// 3. ROLE-BASED ACCESS CONTROL (admin & restrictTo)
// ============================================================================
/**
 * Dedicated guard for system administrators.
 */
const admin = (req, res, next) => {
    const userRoleName = req.user?.role?.role?.toLowerCase()

    if (req.user && userRoleName === 'admin') {
        next()
    } else {
        res.status(403)
        throw new Error('Not Authorized as Admin')
    }
}

/**
 * Flexible RBAC guard accepting variable allowed roles.
 * Usage: restrictTo('admin', 'organizer')
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        const userRoleName = req.user?.role?.role?.toLowerCase()
        const allowedRoles = roles.map((r) => r.toLowerCase())

        if (
            !req.user ||
            !req.user.role ||
            !allowedRoles.includes(userRoleName)
        ) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action.',
            })
        }
        next()
    }
}

// ============================================================================
// 4. MULTER FILE INGESTION (Disk Storage & Filtering)
// ============================================================================
const storage = multer.diskStorage({
    destination(req, file, cb) {
        // Resolves to backend/uploads regardless of where the Node process started
        cb(null, path.resolve(__dirname, '../uploads'))
    },
    filename(req, file, cb) {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
        cb(
            null,
            `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
        )
    },
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpe?g|png|webp/
    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase(),
    )
    const mimetype = allowedTypes.test(file.mimetype)

    if (extname && mimetype) {
        cb(null, true)
    } else {
        cb(
            new Error('Only image files (jpg, jpeg, png, webp) are allowed!'),
            false,
        )
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB payload limit
    fileFilter,
})

// ============================================================================
// 5. CONSOLIDATED EXPORTS
// ============================================================================
export { protect, admin, restrictTo, upload }
