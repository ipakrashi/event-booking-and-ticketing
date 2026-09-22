// backend/controller/newsletterController.js

import asyncHandler from 'express-async-handler'
import Newsletter from '../model/newsletter.js'

// ============================================================================
// @desc    Subscribe an email address to the newsletter
// @route   POST /api/newsletter/subscribe
// @access  Public
// ============================================================================
export const subscribeNewsletter = asyncHandler(async (req, res) => {
    const { email } = req.body

    if (!email || !email.trim()) {
        res.status(400)
        throw new Error('Please provide a valid email address')
    }

    const cleanEmail = email.trim().toLowerCase()

    const existingSubscriber = await Newsletter.findOne({ email: cleanEmail })

    if (existingSubscriber) {
        if (!existingSubscriber.isActive) {
            existingSubscriber.isActive = true
            await existingSubscriber.save()
            return res.status(200).json({
                success: true,
                message:
                    'Welcome back! Your subscription has been reactivated.',
            })
        }

        return res.status(200).json({
            success: true,
            message: 'You are already subscribed to our newsletter.',
        })
    }

    const subscriber = await Newsletter.create({
        email: cleanEmail,
        source: 'homepage_footer',
    })

    res.status(201).json({
        success: true,
        message: 'Thank you for subscribing! Stay tuned for updates.',
        data: subscriber,
    })
})

// ============================================================================
// @desc    Get all subscribers with pagination & optional active filtering
// @route   GET /api/admin/newsletter/subscribers
// @access  Private (Admin)
// ============================================================================
export const getAllSubscribers = asyncHandler(async (req, res) => {
    const { status, search } = req.query
    const query = {}

    // Filter by active/inactive subscription if specified
    if (status !== undefined) {
        query.isActive = status === 'active' || status === 'true'
    }

    // Optional email search keyword
    if (search && search.trim()) {
        query.email = { $regex: search.trim(), $options: 'i' }
    }

    const subscribers = await Newsletter.find(query).sort({ createdAt: -1 })

    res.status(200).json({
        success: true,
        count: subscribers.length,
        data: subscribers,
    })
})

// ============================================================================
// @desc    Toggle subscriber active status or unsubscribe
// @route   PUT /api/admin/newsletter/subscribers/:id
// @access  Private (Admin)
// ============================================================================
export const toggleSubscriberStatus = asyncHandler(async (req, res) => {
    const subscriber = await Newsletter.findById(req.params.id)

    if (!subscriber) {
        res.status(404)
        throw new Error('Subscriber record not found')
    }

    subscriber.isActive = !subscriber.isActive
    const updatedSubscriber = await subscriber.save()

    res.status(200).json({
        success: true,
        message: `Subscriber marked as ${updatedSubscriber.isActive ? 'active' : 'inactive'}`,
        data: updatedSubscriber,
    })
})
