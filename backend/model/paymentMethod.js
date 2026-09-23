// backend/model/paymentMethod.js

import mongoose from 'mongoose'

const paymentMethodSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Payment method name is required'],
            trim: true,
        },
        code: {
            type: String,
            required: [true, 'Payment method code is required'],
            unique: true,
            trim: true,
            lowercase: true, // e.g., 'razorpay', 'upi', 'bank_transfer', 'cash'
        },
        type: {
            type: String,
            enum: ['online_gateway', 'offline_proof'],
            default: 'offline_proof',
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        instructions: {
            type: String,
            trim: true,
            default: '', // Bank details, UPI handle, or counter instructions
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true },
)

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema)
export default PaymentMethod
