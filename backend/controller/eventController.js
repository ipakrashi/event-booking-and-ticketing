// backend/controller/eventController.js
import asyncHandler from 'express-async-handler'
import Event from '../model/event.js'

// ==================================
//  @desc :     Create New Event by Admin
//  @route:     POST /api/admin/events
//  @access:    Admin / Private
// ==================================

export const createEvent = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        categoryId,
        organizerId,
        venueId,
        auditoriumId,
        screenId,
        startDate,
        endDate,
        ticketTiers,
        status,
    } = req.body

    // 1. Validate required fields
    if (
        !title ||
        !description ||
        !categoryId ||
        !organizerId ||
        !venueId ||
        !auditoriumId ||
        !screenId ||
        !startDate ||
        !endDate ||
        !ticketTiers
    ) {
        res.status(400)
        throw new Error(
            'Please provide all required fields including ticket tiers',
        )
    }

    // 2. Parse ticketTiers (form-data sends nested structures as JSON strings)
    let parsedTicketTiers
    try {
        parsedTicketTiers =
            typeof ticketTiers === 'string'
                ? JSON.parse(ticketTiers)
                : ticketTiers
    } catch (err) {
        res.status(400)
        throw new Error(
            'Invalid format for ticketTiers. Expected a valid JSON array',
        )
    }

    if (!Array.isArray(parsedTicketTiers) || parsedTicketTiers.length === 0) {
        res.status(400)
        throw new Error('At least one ticket tier must be provided')
    }

    // 3. Collision check: Avoid double-booking the exact screen at the exact start time
    const duplicateEvent = await Event.findOne({
        venueId,
        auditoriumId,
        screenId,
        startDate: new Date(startDate),
    })

    if (duplicateEvent) {
        res.status(400)
        throw new Error(
            'An event is already scheduled at this screen for the selected time',
        )
    }

    // 4. Handle Multer file upload (preserving Cloudinary-ready object structure)
    const posterImage = req.file
        ? { url: `/uploads/${req.file.filename}`, publicId: null }
        : { url: '/placeholder-event.png', publicId: null }

    // 5. Persist document
    const event = await Event.create({
        title,
        description,
        categoryId,
        organizerId,
        venueId,
        auditoriumId,
        screenId,
        startDate,
        endDate,
        ticketTiers: parsedTicketTiers,
        posterImage,
        status: status || 'draft',
    })

    res.status(201).json({ success: true, data: event })
})

// ==================================
//  @desc :     Get Listed Events
//  @route:     GET /api/events
//  @access:    Public
// ==================================
