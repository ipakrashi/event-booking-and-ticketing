// backend/controller/reviewController.js

import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Review from '../model/review.js'
import Event from '../model/event.js'
import Booking from '../model/booking.js'

// ============================================================================
// @desc    Add / Create a Review for an Event
// @route   POST /api/events/:eventId/reviews
// @access  Private (Verified Attendees)
// ============================================================================
export const createEventReview = asyncHandler(async (req, res) => {
    const { eventId } = req.params
    const { rating, comment } = req.body
    const userId = req.user._id

    // 1. Validate ID format
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(400)
        throw new Error('Invalid Event ID format')
    }

    // 2. Validate payload invariants
    const numericRating = Number(rating)
    if (!numericRating || numericRating < 1 || numericRating > 5) {
        res.status(400)
        throw new Error('Rating must be an integer between 1 and 5')
    }

    if (!comment || comment.trim().length < 5) {
        res.status(400)
        throw new Error('Review comment must be at least 5 characters long')
    }

    // 3. Confirm target event exists and is not a draft
    const event = await Event.findById(eventId)
    if (!event || event.status === 'draft') {
        res.status(404)
        throw new Error('Event not found or not currently published')
    }

    // 4. Invariant Check: Verify user is a genuine attendee with a confirmed/paid booking
    const userBooking = await Booking.findOne({
        user: userId,
        event: eventId,
        paymentStatus: 'paid',
        bookingStatus: { $in: ['confirmed', 'request_sent'] },
    })

    if (!userBooking) {
        res.status(403)
        throw new Error(
            'Action forbidden: Only verified attendees with paid bookings can submit a review.',
        )
    }

    // 5. Invariant Check: Prevent duplicate reviews
    const existingReview = await Review.findOne({
        event: eventId,
        user: userId,
    })

    if (existingReview) {
        res.status(400)
        throw new Error('You have already submitted a review for this event')
    }

    // 6. Create Review (Triggers static calcAverageRatings post-save hook)
    const review = await Review.create({
        user: userId,
        event: eventId,
        rating: numericRating,
        comment: comment.trim(),
        isVerifiedAttendee: true,
    })

    const populatedReview = await Review.findById(review._id).populate(
        'user',
        'userName email',
    )

    res.status(201).json({
        success: true,
        message: 'Review recorded successfully',
        data: populatedReview,
    })
})

// ============================================================================
// @desc    Get All Reviews for an Event
// @route   GET /api/events/:eventId/reviews
// @access  Public
// ============================================================================
export const getEventReviews = asyncHandler(async (req, res) => {
    const { eventId } = req.params

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(400)
        throw new Error('Invalid Event ID format')
    }

    const reviews = await Review.find({ event: eventId })
        .populate('user', 'userName')
        .sort({ createdAt: -1 })

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews,
    })
})

// ============================================================================
// @desc    Delete a Review (Author or Admin)
// @route   DELETE /api/events/:eventId/reviews/:reviewId
// @access  Private
// ============================================================================
export const deleteReview = asyncHandler(async (req, res) => {
    const { eventId, reviewId } = req.params

    if (
        !mongoose.Types.ObjectId.isValid(eventId) ||
        !mongoose.Types.ObjectId.isValid(reviewId)
    ) {
        res.status(400)
        throw new Error('Invalid Event ID or Review ID format')
    }

    const review = await Review.findOne({
        _id: reviewId,
        event: eventId,
    })

    if (!review) {
        res.status(404)
        throw new Error('Review not found')
    }

    const userRoleName = req.user?.role?.role?.toLowerCase()
    const isOwner = review.user.toString() === req.user._id.toString()
    const isAdmin = userRoleName === 'admin'

    if (!isOwner && !isAdmin) {
        res.status(403)
        throw new Error('Not authorized to delete this review')
    }

    // deleteOne triggers the post-deleteOne hook to recalculate ratings
    await review.deleteOne()

    res.status(200).json({
        success: true,
        message: 'Review deleted and event rating recalculated successfully',
    })
})

// ============================================================================
// @desc    Get Latest Verified Reviews (Platform-Wide for Homepage)
// @route   GET /api/reviews/latest
// @access  Public
// ============================================================================
export const getLatestReviews = asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 6, 12)

    const reviews = await Review.find({ isVerifiedAttendee: true })
        .populate('user', 'userName')
        .populate('event', 'title')
        .sort({ createdAt: -1 })
        .limit(limit)

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews,
    })
})
