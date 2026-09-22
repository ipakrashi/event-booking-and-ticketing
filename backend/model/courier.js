// backend/model/courier.js

import mongoose from 'mongoose'

const courierSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Courier partner name is required'],
            unique: true,
            trim: true,
        },
        trackingUrl: {
            type: String,
            trim: true,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
)

const Courier = mongoose.model('Courier', courierSchema)
export default Courier
