// backend/route/eventRoute.js
import express from 'express'
import {
    getAllEvents,
    getEventById,
    getEventSettlementSummary,
} from '../controller/eventController.js'
import { protect, admin, restrictTo } from '../middleware/appMiddleware.js'

const router = express.Router()
router.get('/', getAllEvents)
router.get('/:id', getEventById)
router.get(
    '/:id/settlement-summary',
    protect,
    restrictTo('admin', 'organizer'),
    getEventSettlementSummary,
)
export default router
