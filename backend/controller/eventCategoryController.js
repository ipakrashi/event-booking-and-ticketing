//  backend/controller/eventCategoryController.js

import asyncHandler from 'express-async-handler'
import EventCategory from '../model/eventCategory.js'

// ==========================================
// @desc    Register / Add a new category
// @route   POST /api/admin/category
// @access  Private/Admin
// ==========================================

export const createEventCategory = asyncHandler(async (req, res) => {
    const { eventCategory } = req.body

    if (!eventCategory) {
        res.status(400)
        throw new Error('Category is required')
    }

    const normalizedCategory = eventCategory.trim().toLowerCase()
    const existingCategory = await EventCategory.findOne({
        eventCategory: normalizedCategory,
    })

    if (existingCategory) {
        res.status(400)
        throw new Error('This Category already exists in Database')
    } else {
        const newCategory = await EventCategory.create({ eventCategory })
        res.status(201).json({ success: true, newCategory })
    }
})

// ==========================================
// @desc    Update a category
// @route   POST /api/admin/category/:id
// @access  Private/Admin
// ==========================================
export const updateEventCategory = asyncHandler(async (req, res) => {
    const eventCategory = await EventCategory.findById(req.params.id)
    if (!eventCategory) {
        res.status(404)
        throw new Error('Category Not Found')
    }

    if (req.body.eventCategory) {
        eventCategory.eventCategory = req.body.eventCategory
            .trim()
            .toLowerCase()
    }

    if (req.body.isActive !== undefined) {
        eventCategory.isActive = req.body.isActive
    }

    const updatedEventCategory = await eventCategory.save()

    res.status(200).json({ success: true, data: updatedEventCategory })
})

// ==========================================
// @desc   Get All Categories for popup
// @route   GET /api/category
// @access  Public
// ==========================================
export const getEventCategories = asyncHandler(async (req, res) => {
    // only return active categories to the client
    const eventCategories = await EventCategory.find({ isActive: true }).sort({
        eventCategory: 1,
    })

    res.status(200).json({
        success: true,
        count: eventCategories.length,
        data: eventCategories,
    })
})
