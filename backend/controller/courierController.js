// backend/controller/courierController.js

import asyncHandler from 'express-async-handler'
import Courier from '../model/courier.js'

// @desc    Get all couriers (Active for dropdowns, all for Admin management)
// @route   GET /api/couriers
// @access  Private (Staff / Admin)
export const getCouriers = asyncHandler(async (req, res) => {
    const { all } = req.query
    const filter = all === 'true' ? {} : { isActive: true }

    const couriers = await Courier.find(filter).sort({ name: 1 })

    res.status(200).json({
        success: true,
        count: couriers.length,
        data: couriers,
    })
})

// @desc    Create new courier service
// @route   POST /api/admin/couriers
// @access  Private (Admin)
export const createCourier = asyncHandler(async (req, res) => {
    const { name, trackingUrl } = req.body

    if (!name || !name.trim()) {
        res.status(400)
        throw new Error('Courier partner name is required')
    }

    const existing = await Courier.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    })

    if (existing) {
        res.status(400)
        throw new Error(`Courier "${name.trim()}" already exists`)
    }

    const courier = await Courier.create({
        name: name.trim(),
        trackingUrl: trackingUrl?.trim() || '',
    })

    res.status(201).json({
        success: true,
        message: 'Courier partner added successfully',
        data: courier,
    })
})

// @desc    Toggle courier active status or delete
// @route   DELETE /api/admin/couriers/:id
// @access  Private (Admin)
export const deleteCourier = asyncHandler(async (req, res) => {
    const courier = await Courier.findById(req.params.id)

    if (!courier) {
        res.status(404)
        throw new Error('Courier partner not found')
    }

    await courier.deleteOne()

    res.status(200).json({
        success: true,
        message: 'Courier partner removed successfully',
    })
})
