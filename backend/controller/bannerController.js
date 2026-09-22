// backend/controller/bannerController.js

import asyncHandler from 'express-async-handler'
import Banner from '../model/banner.js'

// ============================================================================
// @desc    Get Active Banners for Public Hero Slider
// @route   GET /api/banners
// @access  Public
// ============================================================================
export const getActiveBanners = asyncHandler(async (req, res) => {
    const banners = await Banner.find({ isActive: true })
        .populate({
            path: 'eventId',
            select: 'title status startDate venueId ticketTiers',
            populate: {
                path: 'venueId',
                select: 'name city',
            },
        })
        .sort({ order: 1, createdAt: -1 })

    res.status(200).json({
        success: true,
        count: banners.length,
        data: banners,
    })
})

// ============================================================================
// @desc    Create a Hero Banner
// @route   POST /api/admin/banners
// @access  Private (Admin)
// ============================================================================
export const createBanner = asyncHandler(async (req, res) => {
    const { title, subtitle, badgeText, imageUrl, eventId, order, isActive } =
        req.body

    if (!title || !subtitle || !eventId) {
        res.status(400)
        throw new Error('Please provide title, subtitle, and linked eventId')
    }

    const bannerImage = req.file ? `/uploads/${req.file.filename}` : imageUrl

    if (!bannerImage) {
        res.status(400)
        throw new Error('Banner image is required')
    }

    const banner = await Banner.create({
        title,
        subtitle,
        badgeText: badgeText || 'Live Ticketing Platform',
        imageUrl: bannerImage,
        eventId,
        order: Number(order) || 0,
        isActive: isActive !== undefined ? isActive : true,
    })

    res.status(201).json({
        success: true,
        data: banner,
    })
})
