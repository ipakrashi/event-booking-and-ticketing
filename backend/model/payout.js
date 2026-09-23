import mongoose from 'mongoose'

const disbursementSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: [true, 'Disbursement amount is required'],
            min: [1, 'Disbursement amount must be greater than zero'],
        },
        mode: {
            type: String,
            enum: ['bank_transfer', 'upi', 'cheque', 'neft_rtgs', 'razorpay'],
            required: true,
        },
        trxnId: {
            type: String,
            required: [true, 'Transaction reference/UTR is required'],
            trim: true,
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        notes: {
            type: String,
            trim: true,
            default: null,
        },
    },
    { timestamps: true },
)

const payoutSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Payout must be linked to an event'],
            unique: true,
        },
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Payout must be linked to an organizer'],
        },

        // --- Rate Snapshots ---
        commissionRateSnapshot: {
            type: Number,
            required: true,
        },
        platformGSTRateSnapshot: {
            type: Number,
            default: 18,
        },

        // --- Collections & Inflows ---
        grossRevenue: {
            type: Number,
            default: 0,
        },
        refundDeductions: {
            type: Number,
            default: 0,
        },
        amountOnHold: {
            type: Number,
            default: 0,
        },
        netEventRevenue: {
            type: Number,
            default: 0, // grossRevenue - refundDeductions
        },

        // --- Platform Cut & GST Breakdown ---
        platformCommissionBase: {
            type: Number,
            default: 0, // Base fee before GST
        },
        platformGSTOutput: {
            type: Number,
            default: 0, // GST collected by platform on commission (Input Tax Credit for organizer)
        },
        totalPlatformDeduction: {
            type: Number,
            default: 0, // platformCommissionBase + platformGSTOutput
        },

        // --- Organizer Settlement Figures ---
        amountPayable: {
            type: Number,
            default: 0, // netEventRevenue - totalPlatformDeduction
        },
        amountPaid: {
            type: Number,
            default: 0,
        },
        balanceDue: {
            type: Number,
            default: 0, // amountPayable - amountPaid
        },

        payoutStatus: {
            type: String,
            enum: ['pending', 'partially_settled', 'settled'],
            default: 'pending',
        },
        disbursements: [disbursementSchema],
    },
    {
        timestamps: true,
    },
)

payoutSchema.index({ organizer: 1, payoutStatus: 1 })

const Payout = mongoose.model('Payout', payoutSchema)
export default Payout
