// backend/route/payoutRoute.js
import express from 'express'
import { protect, admin, restrictTo } from '../middleware/appMiddleware.js'
import { generateEventPayout } from '../controller/payoutController.js'
const router = express.Router()
router.post(
    '/event/:eventId/generate',
    protect,
    restrictTo('admin', 'organizer'),
    generateEventPayout,
)
export default router
