// backend/model/banner.js

import mongoose from 'mongoose'

const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Banner title/tagline is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        subtitle: {
            type: String,
            required: [true, 'Banner subtitle is required'],
            trim: true,
            maxlength: [200, 'Subtitle cannot exceed 200 characters'],
        },
        badgeText: {
            type: String,
            default: 'Featured Event',
            trim: true,
        },
        imageUrl: {
            type: String,
            required: [true, 'Banner landscape image URL is required'],
            trim: true,
        },
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: [true, 'Linked Event reference is required'],
            index: true,
        },
        order: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
    },
)

const Banner = mongoose.model('Banner', bannerSchema)
export default Banner
