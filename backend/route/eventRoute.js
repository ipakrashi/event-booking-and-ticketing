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
    getMyReviewStatus,
    getEventReviewsForModeration,
    moderateReview,
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

// Review Status for Logged-In User
router.get('/:eventId/reviews/my-status', protect, getMyReviewStatus)

// Review Moderation (Admin / Organizer)
router.get(
    '/:eventId/reviews/admin',
    protect,
    restrictTo('admin', 'organizer'),
    getEventReviewsForModeration,
)
router.put(
    '/:eventId/reviews/:reviewId/moderate',
    protect,
    restrictTo('admin', 'organizer'),
    moderateReview,
)

// Standard Public & Attendee Review Routes
router
    .route('/:eventId/reviews')
    .get(getEventReviews)
    .post(protect, createEventReview)

router.route('/:eventId/reviews/:reviewId').delete(protect, deleteReview)

export default router
