// backend/route/reviewRoute.js

import express from 'express'
import {
    getLatestReviews,
    getAllReviewsForModeration,
    moderateReviewDirect,
} from '../controller/reviewController.js'
import { protect, restrictTo } from '../middleware/appMiddleware.js'

const router = express.Router()

// Public
router.get('/latest', getLatestReviews)

// Staff Moderation Console Routes
router.get(
    '/admin',
    protect,
    restrictTo('admin', 'organizer'),
    getAllReviewsForModeration,
)
router.put(
    '/:reviewId/moderate',
    protect,
    restrictTo('admin', 'organizer'),
    moderateReviewDirect,
)

export default router
