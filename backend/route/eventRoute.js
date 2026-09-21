// backend/route/eventRoute.js

import express from 'express'
import {
    getAllEvents,
    getEventById,
    getEventSettlementSummary,
} from '../controller/eventController.js'
import {
    createEventReview,
    getEventReviews,
    deleteReview,
} from '../controller/reviewController.js'
import { protect, restrictTo } from '../middleware/appMiddleware.js'

const router = express.Router()

// Catalog Routes
router.get('/', getAllEvents)
router.get('/:id', getEventById)
router.get(
    '/:id/settlement-summary',
    protect,
    restrictTo('admin', 'organizer'),
    getEventSettlementSummary,
)

// Review Routes
router
    .route('/:eventId/reviews')
    .get(getEventReviews)
    .post(protect, createEventReview)

router.route('/:eventId/reviews/:reviewId').delete(protect, deleteReview)

export default router
