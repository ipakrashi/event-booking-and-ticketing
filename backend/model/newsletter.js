// backend/model/newsletter.js

import mongoose from 'mongoose'

const newsletterSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email address is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please provide a valid email address',
            ],
            index: true,
        },
        source: {
            type: String,
            default: 'homepage_footer',
            trim: true,
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

const Newsletter = mongoose.model('Newsletter', newsletterSchema)
export default Newsletter
