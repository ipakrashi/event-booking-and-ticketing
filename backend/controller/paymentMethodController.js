// backend/controller/paymentMethodController.js

import asyncHandler from 'express-async-handler'
import PaymentMethod from '../model/paymentMethod.js'

// =========================================================================
// @desc :    Get All Active Payment Methods (Public / Attendee Dropdown)
// @route:    GET /api/payment-methods
// @access:   Public
// =========================================================================
export const getActivePaymentMethods = asyncHandler(async (req, res) => {
    let methods = await PaymentMethod.find({ isActive: true }).sort({
        createdAt: 1,
    })

    // Seed defaults if collection is empty
    if (methods.length === 0) {
        methods = await PaymentMethod.insertMany([
            {
                name: 'Razorpay Online Gateway (UPI / Card / NetBanking)',
                code: 'razorpay',
                type: 'online_gateway',
                description: 'Instant verification with Razorpay test gateway',
                isActive: true,
            },
            {
                name: 'UPI (GPay / PhonePe / Paytm / BHIM)',
                code: 'upi',
                type: 'offline_proof',
                description: 'Pay via UPI QR and upload UTR/Ref ID',
                instructions: 'Transfer to organizer UPI: eventpass@upi',
                isActive: true,
            },
            {
                name: 'Bank Transfer (IMPS / NEFT / RTGS)',
                code: 'bank_transfer',
                type: 'offline_proof',
                description: 'Direct wire to verified account',
                instructions: 'A/C: 9876543210, IFSC: HDFC0001234',
                isActive: true,
            },
            {
                name: 'Direct Cash at Venue Counter',
                code: 'cash',
                type: 'offline_proof',
                description: 'Pay at physical counter prior to showtime',
                isActive: true,
            },
        ])
    }

    res.status(200).json({
        success: true,
        data: methods,
    })
})

// =========================================================================
// @desc :    Admin Create Payment Method
// @route:    POST /api/payment-methods
// @access:   Private (Admin)
// =========================================================================
export const createPaymentMethod = asyncHandler(async (req, res) => {
    const { name, code, type, description, instructions } = req.body

    if (!name || !code) {
        res.status(400)
        throw new Error('Please provide name and code')
    }

    const existing = await PaymentMethod.findOne({
        code: code.trim().toLowerCase(),
    })
    if (existing) {
        res.status(400)
        throw new Error(`Payment method with code '${code}' already exists`)
    }

    const method = await PaymentMethod.create({
        name: name.trim(),
        code: code.trim().toLowerCase(),
        type: type || 'offline_proof',
        description: description?.trim() || '',
        instructions: instructions?.trim() || '',
        isActive: true,
    })

    res.status(201).json({
        success: true,
        data: method,
    })
})
