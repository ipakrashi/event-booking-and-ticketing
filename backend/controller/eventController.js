// backend/controller/eventController.js
import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Event from '../model/event.js'
import Venue from '../model/venue.js'
import { deleteFile } from '../util/fileUtils.js'

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
//  @desc :     Get Public Events Catalog
//  @route:     GET /api/events
//  @access:    Public
// ==================================
export const getAllEvents = asyncHandler(async (req, res) => {
    const { categoryId, status } = req.query

    // 1. Base filter: exclude internal organizer drafts
    const filter = {
        status: { $ne: 'draft' },
    }

    // 2. Allow clients to filter by specific public statuses (e.g., ?status=published)
    if (status && status !== 'draft') {
        filter.status = status
    }

    // 3. Category filter
    if (categoryId) {
        filter.categoryId = categoryId
    }

    const allEvents = await Event.find(filter)
        .populate('categoryId', 'name')
        .populate('venueId', 'name address city')
        .populate('organizerId', 'name email')
        .sort({ startDate: 1 })

    res.status(200).json({
        success: true,
        count: allEvents.length,
        data: allEvents,
    })
})

// ==================================
//  @desc :     Get Public Events Catalog by Event Id
//  @route:     GET /api/events/:id
//  @access:    Public
// ==================================
export const getEventById = asyncHandler(async (req, res) => {
    const selectedEvent = await Event.findOne({
        _id: req.params.id,
        status: { $ne: 'draft' },
    })
        .populate('categoryId', 'name')
        .populate('venueId', 'name address city auditoriums')
        .populate('organizerId', 'name email')

    if (!selectedEvent) {
        res.status(404)
        throw new Error('Event not found')
    }

    // Locate the specific auditorium subdocument inside venueId
    const selectedAuditorium = selectedEvent.venueId?.auditoriums?.id(
        selectedEvent.auditoriumId,
    )

    // Locate the specific screen subdocument inside that auditorium
    const selectedScreen = selectedAuditorium?.screens?.id(
        selectedEvent.screenId,
    )

    const outputEvent = {
        ...selectedEvent.toObject(),
        selectedAuditorium: selectedAuditorium || null,
        selectedScreen: selectedScreen || null,
    }

    res.status(200).json({
        success: true,
        data: outputEvent,
    })
})
// ==================================
//  @desc :     Delete Event (Hard delete only if zero sales)
//  @route:     DELETE /api/admin/events/:id
//  @access:    Admin / Private
// ==================================
export const deleteEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id)

    if (!event) {
        res.status(404)
        throw new Error('Event not found')
    }

    // Calculate total tickets sold across all tiers
    const totalSold = event.ticketTiers.reduce(
        (sum, tier) => sum + (tier.soldQuantity || 0),
        0,
    )

    if (totalSold > 0) {
        res.status(400)
        throw new Error(
            'Cannot delete an event with active ticket sales. Update status to cancelled instead.',
        )
    }

    // Safe to delete: remove image from disk and document from MongoDB
    deleteFile(event.posterImage?.url)
    await event.deleteOne()

    res.status(200).json({
        success: true,
        message: 'Event and associated assets deleted successfully',
    })
})

// ==================================
//  @desc :     Update Event Details (With Deep Integrity Engine)
//  @route:     PUT /api/admin/events/:id
//  @access:    Admin / Private
// ==================================
export const updateEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id)

    if (!event) {
        res.status(404)
        throw new Error('Event not found')
    }

    const {
        title,
        description,
        categoryId,
        venueId,
        auditoriumId,
        screenId,
        startDate,
        endDate,
        ticketTiers,
        status,
    } = req.body

    // ----------------------------------------------------
    // 1. RESOLVE TARGET VENUE, AUDITORIUM & SCREEN
    // ----------------------------------------------------
    const targetVenueId = venueId || event.venueId.toString()
    const targetAudiId = auditoriumId || event.auditoriumId.toString()
    const targetScreenId = screenId || event.screenId.toString()
    const targetStartDate = startDate ? new Date(startDate) : event.startDate

    // Fetch the Venue to verify screen capacity and layout
    const venueDoc = await Venue.findById(targetVenueId)
    if (!venueDoc) {
        res.status(404)
        throw new Error('Associated venue not found')
    }

    const targetAudi = venueDoc.auditoriums.id(targetAudiId)
    if (!targetAudi) {
        res.status(404)
        throw new Error('Associated auditorium not found in this venue')
    }

    const targetScreen = targetAudi.screens.id(targetScreenId)
    if (!targetScreen) {
        res.status(404)
        throw new Error('Associated screen not found in this auditorium')
    }

    const maxScreenCapacity = targetScreen.capacity

    // ----------------------------------------------------
    // 2. COLLISION CHECK (IF SCHEDULE / LOCATION CHANGED)
    // ----------------------------------------------------
    const scheduleChanged =
        venueId ||
        auditoriumId ||
        screenId ||
        (startDate &&
            new Date(startDate).getTime() !== event.startDate.getTime())

    if (scheduleChanged) {
        const collision = await Event.findOne({
            _id: { $ne: event._id },
            venueId: targetVenueId,
            auditoriumId: targetAudiId,
            screenId: targetScreenId,
            startDate: targetStartDate,
            status: { $ne: 'cancelled' },
        })

        if (collision) {
            res.status(400)
            throw new Error(
                'Another active event is already scheduled at this screen for the selected time',
            )
        }
    }

    // ----------------------------------------------------
    // 3. TICKET TIERS AUDIT & INTEGRITY ENGINE
    // ----------------------------------------------------
    if (ticketTiers) {
        let parsedTiers
        try {
            parsedTiers =
                typeof ticketTiers === 'string'
                    ? JSON.parse(ticketTiers)
                    : ticketTiers
        } catch (err) {
            res.status(400)
            throw new Error('Invalid JSON format for ticketTiers')
        }

        if (!Array.isArray(parsedTiers) || parsedTiers.length === 0) {
            res.status(400)
            throw new Error('ticketTiers must be a non-empty array')
        }

        // Calculate total sales committed across all tiers so far
        const totalSold = event.ticketTiers.reduce(
            (sum, tier) => sum + (tier.soldQuantity || 0),
            0,
        )

        // Calculate incoming proposed total capacity
        const proposedTotalCapacity = parsedTiers.reduce(
            (sum, tier) => sum + (Number(tier.totalQuantity) || 0),
            0,
        )

        // Screen capacity ceiling check (applies to both draft and active states)
        if (proposedTotalCapacity > maxScreenCapacity) {
            res.status(400)
            throw new Error(
                `Total ticket tier allocation (${proposedTotalCapacity}) exceeds screen capacity (${maxScreenCapacity})`,
            )
        }

        // Branch A: ZERO SALES (Draft mode - complete flexibility)
        if (totalSold === 0) {
            event.ticketTiers = parsedTiers
        }
        // Branch B: ACTIVE SALES (Strict integrity mode)
        else {
            if (parsedTiers.length !== event.ticketTiers.length) {
                res.status(400)
                throw new Error(
                    'Cannot add or delete ticket tiers once ticket sales have commenced',
                )
            }

            // Verify and mutate tiers in-place
            for (const existingTier of event.ticketTiers) {
                const incomingMatch = parsedTiers.find(
                    (t) =>
                        t._id &&
                        t._id.toString() === existingTier._id.toString(),
                )

                if (!incomingMatch) {
                    res.status(400)
                    throw new Error(
                        `Missing existing tier [${existingTier.name}] in update payload. Tier deletion is forbidden.`,
                    )
                }

                // Check immutable pricing snapshot
                if (Number(incomingMatch.price) !== existingTier.price) {
                    res.status(400)
                    throw new Error(
                        `Pricing change forbidden for tier "${existingTier.name}" after sales have started`,
                    )
                }

                // Check immutable tier label
                if (incomingMatch.name.trim() !== existingTier.name) {
                    res.status(400)
                    throw new Error(
                        `Name modification forbidden for tier "${existingTier.name}" after sales have started`,
                    )
                }

                const newQuantity = Number(incomingMatch.totalQuantity)

                // Monotonic floor check: cannot drop capacity below tickets already in customer pockets
                if (newQuantity < existingTier.soldQuantity) {
                    res.status(400)
                    throw new Error(
                        `Total quantity for tier "${existingTier.name}" cannot be less than already sold tickets (${existingTier.soldQuantity})`,
                    )
                }

                // Apply valid quantity adjustment
                existingTier.totalQuantity = newQuantity
            }
        }
    }

    // ----------------------------------------------------
    // 4. POSTER ASSET REPLACEMENT & DISK CLEANUP
    // ----------------------------------------------------
    if (req.file) {
        deleteFile(event.posterImage?.url)
        event.posterImage = {
            url: `/uploads/${req.file.filename}`,
            publicId: null,
        }
    }

    // ----------------------------------------------------
    // 5. CORE FIELD MUTATIONS
    // ----------------------------------------------------
    if (title) event.title = title
    if (description) event.description = description
    if (categoryId) event.categoryId = categoryId
    if (venueId) event.venueId = targetVenueId
    if (auditoriumId) event.auditoriumId = targetAudiId
    if (screenId) event.screenId = targetScreenId
    if (startDate) event.startDate = targetStartDate
    if (endDate) event.endDate = new Date(endDate)
    if (status) event.status = status

    const updatedEvent = await event.save()

    res.status(200).json({
        success: true,
        data: updatedEvent,
    })
})
