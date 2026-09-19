// backend/route/bookingRoute.js

import express from 'express'
import { protect, admin, restrictTo } from '../middleware/appMiddleware.js'
import {
    createBooking,
    getMyBookings,
    getEventBookings,
    updatePaymentStatus,
    updateDispatchStatus,
    updateReceiveStatus,
    bulkUpdateReceiveStatus,
    cancelBooking,
} from '../controller/bookingController.js'

const router = express.Router()

router.post('/', protect, createBooking)
router.get('/my-bookings', protect, getMyBookings)
router.get(
    '/event/:eventId',
    protect,
    restrictTo('admin', 'organizer'),
    getEventBookings,
)

// Bulk actions placed before parameterized :id routes
router.patch(
    '/bulk-receive',
    protect,
    restrictTo('admin', 'organizer'),
    bulkUpdateReceiveStatus,
)

router.put('/:id/pay', protect, updatePaymentStatus)
router.put(
    '/:id/dispatch',
    protect,
    restrictTo('admin', 'organizer'),
    updateDispatchStatus,
)
router.put('/:id/receive', protect, updateReceiveStatus)
router.put('/:id/cancel', protect, cancelBooking)

export default router
