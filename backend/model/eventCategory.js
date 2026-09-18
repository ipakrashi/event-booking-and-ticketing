// backend/model/eventCategory.js

import mongoose from 'mongoose'

const eventCategorySchema = new mongoose.Schema(
    {
        eventCategory: {
            type: String,
            required: [true, 'Category name is required'],
            unique: true,
            trim: true,
            lowercase: true, // Stores 'tech', 'music', etc. uniformly
        },

        description: {
            type: String,
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

const EventCategory = mongoose.model('EventCategory', eventCategorySchema)
export default EventCategory
