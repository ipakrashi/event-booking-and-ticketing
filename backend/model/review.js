// backend/model/review.js

import mongoose from 'mongoose'
import Event from './event.js'

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to an authenticated user'],
            index: true,
        },
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Review must belong to a valid event'],
            index: true,
        },
        rating: {
            type: Number,
            required: [true, 'Rating score is required'],
            min: [1, 'Rating must be at least 1 star'],
            max: [5, 'Rating cannot exceed 5 stars'],
            validate: {
                validator: Number.isInteger,
                message: 'Rating score must be an integer (1 to 5)',
            },
        },
        comment: {
            type: String,
            required: [true, 'Review comment cannot be empty'],
            trim: true,
            minlength: [5, 'Comment must be at least 5 characters long'],
            maxlength: [1000, 'Comment cannot exceed 1000 characters'],
        },
        isVerifiedAttendee: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
)

// Invariant: Single review per user per event
reviewSchema.index({ event: 1, user: 1 }, { unique: true })

// Static Method: Atomic aggregation pipeline to update Event document
reviewSchema.statics.calcAverageRatings = async function (eventId) {
    const stats = await this.aggregate([
        {
            $match: { event: new mongoose.Types.ObjectId(eventId) },
        },
        {
            $group: {
                _id: '$event',
                totalReviews: { $sum: 1 },
                avgRating: { $avg: '$rating' },
            },
        },
    ])

    if (stats.length > 0) {
        await Event.findByIdAndUpdate(eventId, {
            averageRating: Math.round(stats[0].avgRating * 10) / 10,
            totalReviews: stats[0].totalReviews,
        })
    } else {
        // Reset to default if all reviews were deleted
        await Event.findByIdAndUpdate(eventId, {
            averageRating: 0,
            totalReviews: 0,
        })
    }
}

// Post-save hook (covers both create and update)
reviewSchema.post('save', async function () {
    await this.constructor.calcAverageRatings(this.event)
})

// Post-deleteOne hook
reviewSchema.post(
    'deleteOne',
    { document: true, query: false },
    async function () {
        await this.constructor.calcAverageRatings(this.event)
    },
)

const Review = mongoose.model('Review', reviewSchema)
export default Review
