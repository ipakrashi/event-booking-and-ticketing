// backend/model/event.js
import mongoose from 'mongoose'

// Subdocument schema for tiered ticketing
const ticketTierSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Ticket tier name is required'],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, 'Ticket price is required'],
            min: [0, 'Price cannot be negative'],
        },
        totalQuantity: {
            type: Number,
            required: [true, 'Total quantity is required'],
            min: [1, 'Must have at least 1 ticket in this tier'],
        },
        soldQuantity: {
            type: Number,
            default: 0,
            min: [0, 'Sold quantity cannot be negative'],
        },
    },
    { _id: true },
)

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Event title is required'],
            trim: true,
            maxlength: [150, 'Title cannot exceed 150 characters'],
        },
        description: {
            type: String,
            required: [true, 'Event description is required'],
            trim: true,
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EventCategory', // Fixed: matches registered model name
            required: [true, 'Category is required'],
        },
        organizerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Organizer is required'],
            index: true,
        },
        venueId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Venue',
            required: [true, 'Venue is required'],
            index: true,
        },
        auditoriumId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Auditorium is required'],
        },
        screenId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Screen is required'],
        },
        startDate: {
            type: Date,
            required: [true, 'Event start date is required'],
        },
        endDate: {
            type: Date,
            required: [true, 'Event end date is required'],
            validate: {
                validator: function (val) {
                    return val >= this.startDate
                },
                message: 'End date must be on or after start date',
            },
        },
        ticketTiers: {
            type: [ticketTierSchema],
            validate: {
                validator: function (val) {
                    return Array.isArray(val) && val.length > 0
                },
                message: 'An event must have at least one ticket tier',
            },
        },
        posterImage: {
            url: {
                type: String,
                default: '/placeholder-event.png',
                trim: true,
            },
            publicId: {
                type: String,
                default: null,
            },
        },
        status: {
            type: String,
            enum: ['draft', 'published', 'sold_out', 'cancelled'],
            default: 'draft',
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
)

// Efficient compound index for catalog discovery
eventSchema.index({ status: 1, categoryId: 1, startDate: 1 })

const Event = mongoose.model('Event', eventSchema)
export default Event
