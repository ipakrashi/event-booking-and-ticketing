// backend/route/bookingRoute.js

import express from 'express'
import {
    createBooking,
    getMyBookings,
    getAllBookings,
    getEventBookings,
    updatePaymentStatus,
    requestBookingRefund,
    processRefundApproval,
    updateDispatchStatus,
    getShippingLabel,
    updateReceiveStatus,
    bulkUpdateReceiveStatus,
    getDigitalEntryPass,
    verifyGateEntry,
    submitPaymentDetails,
    approvePaymentAndConfirm,
    createRazorpayOrder,
    verifyRazorpayPayment,
} from '../controller/bookingController.js'
import { protect, restrictTo } from '../middleware/appMiddleware.js'

const router = express.Router()

// User creation & list
router.post('/', protect, createBooking)
router.get('/my-bookings', protect, getMyBookings)

// Admin & Organizer roster views
router.get(
    '/admin/all',
    protect,
    restrictTo('admin', 'organizer'),
    getAllBookings,
)
router.get(
    '/event/:eventId',
    protect,
    restrictTo('admin', 'organizer'),
    getEventBookings,
)

// Payment & Settlement (User / Organizer / Admin)
router.put('/:id/pay', protect, updatePaymentStatus)

// Refund Lifecycle
router.put('/:id/request-refund', protect, requestBookingRefund)
router.put(
    '/:id/process-refund',
    protect,
    restrictTo('admin', 'organizer'),
    processRefundApproval,
)

// Digital Pass & Gate Scanner
router.get('/:id/entry-pass', protect, getDigitalEntryPass)
router.post(
    '/verify-entry',
    protect,
    restrictTo('admin', 'organizer'),
    verifyGateEntry,
)

// Shipping & Dispatch
router.get(
    '/:id/shipping-label',
    protect,
    restrictTo('admin', 'organizer'),
    getShippingLabel,
)
router.patch(
    '/bulk-receive',
    protect,
    restrictTo('admin', 'organizer'),
    bulkUpdateReceiveStatus,
)
router.put(
    '/:id/dispatch',
    protect,
    restrictTo('admin', 'organizer'),
    updateDispatchStatus,
)
router.put('/:id/receive', protect, updateReceiveStatus)
// Attendee logs offline transaction details
router.put('/:id/submit-payment', protect, submitPaymentDetails)

// Admin/Organizer reconciliation approval
router.put(
    '/:id/approve-payment',
    protect,
    restrictTo('admin', 'organizer'),
    approvePaymentAndConfirm,
)
// =========================================================================
// Razorpay Online Gateway Endpoints
// =========================================================================
router.post('/:id/create-razorpay-order', protect, createRazorpayOrder)
router.post('/:id/verify-razorpay-payment', protect, verifyRazorpayPayment)
export default router
