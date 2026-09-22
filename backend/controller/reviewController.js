// backend/controller/reviewController.js

import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Review from '../model/review.js'
import Event from '../model/event.js'
import Booking from '../model/booking.js'

// ============================================================================
// @desc    Add / Create a Review for an Event
// @route   POST /api/events/:eventId/reviews
// @access  Private (Verified Attendees with confirmed gate check-in)
// ============================================================================
export const createEventReview = asyncHandler(async (req, res) => {
    const { eventId } = req.params
    const { rating, comment } = req.body
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(400)
        throw new Error('Invalid Event ID format')
    }

    const numericRating = Number(rating)
    if (!numericRating || numericRating < 1 || numericRating > 5) {
        res.status(400)
        throw new Error('Rating must be an integer between 1 and 5')
    }

    if (!comment || comment.trim().length < 5) {
        res.status(400)
        throw new Error('Review comment must be at least 5 characters long')
    }

    const event = await Event.findById(eventId)
    if (!event || event.status === 'draft') {
        res.status(404)
        throw new Error('Event not found or not currently published')
    }

    // 1. Invariant: User must have physically attended (paid, confirmed, and scanned at gate)
    const attendeeBooking = await Booking.findOne({
        user: userId,
        event: eventId,
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        isCheckedIn: true,
    })

    if (!attendeeBooking) {
        res.status(403)
        throw new Error(
            'Reviews are restricted to attendees who held a paid booking and checked in at the venue.',
        )
    }

    // 2. Invariant: Prevent duplicate reviews
    const existingReview = await Review.findOne({
        event: eventId,
        user: userId,
    })

    if (existingReview) {
        res.status(400)
        throw new Error('You have already submitted a review for this event')
    }

    // 3. Create Review in 'pending' status
    const review = await Review.create({
        user: userId,
        event: eventId,
        rating: numericRating,
        comment: comment.trim(),
        isVerifiedAttendee: true,
        status: 'pending',
    })

    const populatedReview = await Review.findById(review._id).populate(
        'user',
        'userName email',
    )

    res.status(201).json({
        success: true,
        message:
            'Review submitted successfully! It will be published once reviewed by the organizer.',
        data: populatedReview,
    })
})

// ============================================================================
// @desc    Get All Approved Reviews for an Event (Public View)
// @route   GET /api/events/:eventId/reviews
// @access  Public
// ============================================================================
export const getEventReviews = asyncHandler(async (req, res) => {
    const { eventId } = req.params

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(400)
        throw new Error('Invalid Event ID format')
    }

    // Only return approved reviews to public attendees
    const reviews = await Review.find({ event: eventId, status: 'approved' })
        .populate('user', 'userName')
        .sort({ createdAt: -1 })

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews,
    })
})

// ============================================================================
// @desc    Check logged-in user's review status & attendance for an event
// @route   GET /api/events/:eventId/reviews/my-status
// @access  Private
// ============================================================================
export const getMyReviewStatus = asyncHandler(async (req, res) => {
    const { eventId } = req.params
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(400)
        throw new Error('Invalid Event ID format')
    }

    // Check attendance check-in
    const attendedBooking = await Booking.findOne({
        user: userId,
        event: eventId,
        paymentStatus: 'paid',
        bookingStatus: 'confirmed',
        isCheckedIn: true,
    })

    // Check if review already submitted
    const existingReview = await Review.findOne({
        event: eventId,
        user: userId,
    })

    res.status(200).json({
        success: true,
        hasAttended: !!attendedBooking,
        hasReviewed: !!existingReview,
        reviewStatus: existingReview ? existingReview.status : null,
        review: existingReview || null,
    })
})

// ============================================================================
// @desc    Get All Reviews for Moderation (Admin / Event Organizer)
// @route   GET /api/events/:eventId/reviews/admin
// @access  Private (Admin / Organizer)
// ============================================================================
export const getEventReviewsForModeration = asyncHandler(async (req, res) => {
    const { eventId } = req.params

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(400)
        throw new Error('Invalid Event ID format')
    }

    const event = await Event.findById(eventId)
    if (!event) {
        res.status(404)
        throw new Error('Event not found')
    }

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
    const isAdmin = userRole === 'admin'
    const isOwner = event.organizerId?.toString() === req.user._id.toString()

    if (!isAdmin && !isOwner) {
        res.status(403)
        throw new Error('Not authorized to moderate reviews for this event')
    }

    const reviews = await Review.find({ event: eventId })
        .populate('user', 'userName email')
        .sort({ createdAt: -1 })

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews,
    })
})

// ============================================================================
// @desc    Moderate a Review (Approve, Reject, On Hold)
// @route   PUT /api/events/:eventId/reviews/:reviewId/moderate
// @access  Private (Admin / Organizer)
// ============================================================================
export const moderateReview = asyncHandler(async (req, res) => {
    const { eventId, reviewId } = req.params
    const { status, moderationRemarks } = req.body

    const allowedStatuses = ['approved', 'rejected', 'on_hold']
    if (!allowedStatuses.includes(status)) {
        res.status(400)
        throw new Error(
            "Invalid status. Must be 'approved', 'rejected', or 'on_hold'",
        )
    }

    const event = await Event.findById(eventId)
    if (!event) {
        res.status(404)
        throw new Error('Event not found')
    }

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
    const isAdmin = userRole === 'admin'
    const isOwner = event.organizerId?.toString() === req.user._id.toString()

    if (!isAdmin && !isOwner) {
        res.status(403)
        throw new Error('Not authorized to moderate reviews for this event')
    }

    const review = await Review.findOne({ _id: reviewId, event: eventId })
    if (!review) {
        res.status(404)
        throw new Error('Review not found')
    }

    review.status = status
    review.moderatedBy = req.user._id
    if (moderationRemarks) {
        review.moderationRemarks = moderationRemarks.trim()
    }

    // review.save() automatically triggers calcAverageRatings to refresh event score
    await review.save()

    res.status(200).json({
        success: true,
        message: `Review marked as ${status}`,
        data: review,
    })
})

// ============================================================================
// @desc    Delete a Review (Author or Admin)
// @route   DELETE /api/events/:eventId/reviews/:reviewId
// @access  Private
// ============================================================================
export const deleteReview = asyncHandler(async (req, res) => {
    const { eventId, reviewId } = req.params

    const review = await Review.findOne({ _id: reviewId, event: eventId })
    if (!review) {
        res.status(404)
        throw new Error('Review not found')
    }

    const userRoleName = (
        req.user?.role?.role ||
        req.user?.role ||
        ''
    ).toLowerCase()
    const isOwner = review.user.toString() === req.user._id.toString()
    const isAdmin = userRoleName === 'admin'

    if (!isOwner && !isAdmin) {
        res.status(403)
        throw new Error('Not authorized to delete this review')
    }

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

    const reviews = await Review.find({
        isVerifiedAttendee: true,
        status: 'approved',
    })
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
// ============================================================================
// @desc    Get All Reviews for Moderation (Cross-Event: Admin all, Organizer own events)
// @route   GET /api/reviews/admin
// @access  Private (Admin / Organizer)
// ============================================================================
export const getAllReviewsForModeration = asyncHandler(async (req, res) => {
    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
    const isAdmin = userRole === 'admin'
    const isOrganizer = userRole === 'organizer'

    if (!isAdmin && !isOrganizer) {
        res.status(403)
        throw new Error('Not authorized to access review moderation')
    }

    let filter = {}

    // Organizers only see reviews for events they organized
    if (isOrganizer && !isAdmin) {
        const myEvents = await Event.find({ organizerId: req.user._id }).select(
            '_id',
        )
        const myEventIds = myEvents.map((e) => e._id)
        filter.event = { $in: myEventIds }
    }

    const { status, eventId } = req.query
    if (status && status !== 'all') {
        filter.status = status
    }
    if (eventId && mongoose.Types.ObjectId.isValid(eventId)) {
        filter.event = eventId
    }

    const reviews = await Review.find(filter)
        .populate('user', 'userName email')
        .populate('event', 'title startDate organizerId')
        .populate('moderatedBy', 'userName')
        .sort({ createdAt: -1 })

    res.status(200).json({
        success: true,
        count: reviews.length,
        data: reviews,
    })
})

// ============================================================================
// @desc    Moderate a Review (Approve, Reject, On Hold)
// @route   PUT /api/reviews/:reviewId/moderate
// @access  Private (Admin / Organizer)
// ============================================================================
export const moderateReviewDirect = asyncHandler(async (req, res) => {
    const { reviewId } = req.params
    const { status, moderationRemarks } = req.body

    const allowedStatuses = ['approved', 'rejected', 'on_hold']
    if (!allowedStatuses.includes(status)) {
        res.status(400)
        throw new Error(
            "Invalid status. Must be 'approved', 'rejected', or 'on_hold'",
        )
    }

    const review = await Review.findById(reviewId).populate(
        'event',
        'organizerId title',
    )
    if (!review) {
        res.status(404)
        throw new Error('Review not found')
    }

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
    const isAdmin = userRole === 'admin'
    const isOwner =
        review.event?.organizerId?.toString() === req.user._id.toString()

    if (!isAdmin && !isOwner) {
        res.status(403)
        throw new Error('Not authorized to moderate this review')
    }

    review.status = status
    review.moderatedBy = req.user._id
    if (moderationRemarks !== undefined) {
        review.moderationRemarks = moderationRemarks?.trim() || null
    }

    await review.save()

    res.status(200).json({
        success: true,
        message: `Review marked as ${status}`,
        data: review,
    })
})
