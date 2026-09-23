import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Booking must belong to a user'],
        },
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Booking must belong to an event'],
        },
        ticketTierId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Ticket tier ID is required'],
        },
        tierName: {
            type: String,
            required: [true, 'Tier name snapshot is required'],
            trim: true,
        },
        unitPrice: {
            type: Number,
            required: [true, 'Unit price snapshot is required'],
            min: [0, 'Unit price cannot be negative'],
        },
        bookedQty: {
            type: Number,
            required: [true, 'Booked quantity is required'],
            min: [1, 'Must book at least 1 ticket'],
            validate: {
                validator: Number.isInteger,
                message: 'Booked quantity must be an integer',
            },
        },
        totalAmount: {
            type: Number,
            required: [true, 'Total amount is required'],
            min: [0, 'Total amount cannot be negative'],
        },
        // --- Audit & Rollback Fields ---
        cancelledQty: {
            type: Number,
            default: 0,
            min: [0, 'Cancelled quantity cannot be negative'],
            validate: {
                validator: Number.isInteger,
                message: 'Cancelled quantity must be an integer',
            },
        },
        refundAmount: {
            type: Number,
            default: 0,
            min: [0, 'Refund amount cannot be negative'],
        },
        cancellationReason: {
            type: String,
            trim: true,
            default: null,
        },
        // -------------------------------
        bookingStatus: {
            type: String,
            enum: {
                values: [
                    'request_sent',
                    'confirmed',
                    'rejected',
                    'cancelled',
                    'refund_requested',
                    'refund_issued',
                ],
                message: '{VALUE} is not a valid booking status',
            },
            default: 'request_sent',
        },
        paymentStatus: {
            type: String,
            enum: {
                values: [
                    'paid',
                    'pending_verification',
                    'not_paid',
                    'refund_requested',
                    'refunded',
                ],
                message: '{VALUE} is not a valid payment status',
            },
            default: 'not_paid',
        },
        paymentDetails: {
            mode: {
                type: String,
                enum: ['upi', 'cash', 'card', 'bank_transfer', null],
                default: null,
            },
            trxnId: {
                type: String,
                trim: true,
                default: null,
            },
            refundId: {
                type: String,
                trim: true,
                default: null, // Stores 'rfnd_...' from Razorpay
            },
        },
        despatchStatus: {
            type: String,
            enum: {
                values: ['not_dispatched', 'dispatched', 'received'],
                message: '{VALUE} is not a valid despatch status',
            },
            default: 'not_dispatched',
        },
        despatchDetails: {
            courierName: {
                type: String,
                trim: true,
                default: null,
            },
            podId: {
                type: String,
                trim: true,
                default: null,
            },
        },
        // --- Gate Entry & Digital Pass ---
        entryPassToken: {
            type: String,
            trim: true,
            sparse: true,
            unique: true,
        },
        isCheckedIn: {
            type: Boolean,
            default: false,
            index: true,
        },
        checkInTimestamp: {
            type: Date,
            default: null,
        },
        checkedInBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    },
)

// Indexing for user history, event-level analytics, and operational fulfillment filters
bookingSchema.index({ user: 1, createdAt: -1 })
bookingSchema.index({ event: 1, bookingStatus: 1 })
bookingSchema.index({ paymentStatus: 1 })
bookingSchema.index({ despatchStatus: 1 })

const Booking = mongoose.model('Booking', bookingSchema)

export default Booking
