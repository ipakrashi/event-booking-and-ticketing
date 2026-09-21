// backend/controller/eventController.js

import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Event from '../model/event.js'
import Venue from '../model/venue.js'
import { deleteFile } from '../util/fileUtils.js'
import { computeEventSettlement } from '../util/settlementService.js'

// ============================================================================
// @desc    Create New Event by Admin / Organizer
// @route   POST /api/admin/events
// @access  Private (Admin)
// ============================================================================
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
        isFeatured,
        isTopEvent,
        bannerImages,
    } = req.body

    // 1. Validate required structural invariants
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
            'Please provide all required fields: title, description, categoryId, organizerId, venueId, auditoriumId, screenId, startDate, endDate, and ticketTiers',
        )
    }

    // 2. Validate MongoDB ObjectId formats
    if (
        !mongoose.Types.ObjectId.isValid(categoryId) ||
        !mongoose.Types.ObjectId.isValid(organizerId) ||
        !mongoose.Types.ObjectId.isValid(venueId) ||
        !mongoose.Types.ObjectId.isValid(auditoriumId) ||
        !mongoose.Types.ObjectId.isValid(screenId)
    ) {
        res.status(400)
        throw new Error(
            'One or more referenced IDs have an invalid ObjectId format',
        )
    }

    // 3. Parse and validate ticket tiers (multipart form-data sends arrays as JSON strings)
    let parsedTicketTiers
    try {
        parsedTicketTiers =
            typeof ticketTiers === 'string'
                ? JSON.parse(ticketTiers)
                : ticketTiers
    } catch {
        res.status(400)
        throw new Error('Invalid JSON format provided for ticketTiers')
    }

    if (!Array.isArray(parsedTicketTiers) || parsedTicketTiers.length === 0) {
        res.status(400)
        throw new Error(
            'At least one ticket tier must be provided in ticketTiers',
        )
    }

    // 4. Parse bannerImages if supplied as a JSON string
    let parsedBannerImages = []
    if (bannerImages) {
        try {
            parsedBannerImages =
                typeof bannerImages === 'string'
                    ? JSON.parse(bannerImages)
                    : bannerImages
        } catch {
            parsedBannerImages = [bannerImages]
        }
    }

    // 5. Verify Venue, Auditorium, Screen, and physical capacity ceiling
    const venueDoc = await Venue.findById(venueId)
    if (!venueDoc) {
        res.status(404)
        throw new Error('Associated venue not found')
    }

    const targetAudi = venueDoc.auditoriums.id(auditoriumId)
    if (!targetAudi) {
        res.status(404)
        throw new Error('Associated auditorium not found in this venue')
    }

    const targetScreen = targetAudi.screens.id(screenId)
    if (!targetScreen) {
        res.status(404)
        throw new Error('Associated screen not found in this auditorium')
    }

    const totalAllocatedSeats = parsedTicketTiers.reduce(
        (sum, tier) => sum + (Number(tier.totalQuantity) || 0),
        0,
    )

    if (totalAllocatedSeats > targetScreen.capacity) {
        res.status(400)
        throw new Error(
            `Total tickets allocated across tiers (${totalAllocatedSeats}) exceeds screen seating capacity (${targetScreen.capacity})`,
        )
    }

    // 6. Collision check: prevent overlapping schedules on the exact same screen
    const duplicateEvent = await Event.findOne({
        venueId,
        auditoriumId,
        screenId,
        startDate: new Date(startDate),
        status: { $ne: 'cancelled' },
    })

    if (duplicateEvent) {
        res.status(400)
        throw new Error(
            'An active event is already scheduled at this auditorium screen for the selected start time',
        )
    }

    // 7. Process Multer poster image upload
    const posterImage = req.file
        ? { url: `/uploads/${req.file.filename}`, publicId: null }
        : { url: '/placeholder-event.png', publicId: null }

    // 8. Construct and persist document
    const event = await Event.create({
        title: title.trim(),
        description: description.trim(),
        categoryId,
        organizerId,
        venueId,
        auditoriumId,
        screenId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        ticketTiers: parsedTicketTiers,
        posterImage,
        bannerImages: Array.isArray(parsedBannerImages)
            ? parsedBannerImages
            : [],
        isFeatured: isFeatured === 'true' || isFeatured === true,
        isTopEvent: isTopEvent === 'true' || isTopEvent === true,
        status: status || 'draft',
    })

    res.status(201).json({
        success: true,
        data: event,
    })
})

// ============================================================================
// @desc    Get Public Events Catalog (With Filtering for Home & Catalog)
// @route   GET /api/events
// @access  Public
// ============================================================================
export const getAllEvents = asyncHandler(async (req, res) => {
    const { categoryId, status, isFeatured, isTopEvent, search } = req.query

    // 1. Default barrier: exclude internal organizer drafts from public queries
    const filter = {
        status: { $ne: 'draft' },
    }

    // 2. Allow clients to filter by specific public lifecycle status
    if (status && status !== 'draft') {
        filter.status = status
    }

    // 3. Category filtering
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
        filter.categoryId = categoryId
    }

    // 4. Section 2: Top Events Filter (?isTopEvent=true)
    if (isTopEvent !== undefined) {
        filter.isTopEvent = isTopEvent === 'true' || isTopEvent === true
    }

    // 5. Section 3: Featured Spotlight Filter (?isFeatured=true)
    if (isFeatured !== undefined) {
        filter.isFeatured = isFeatured === 'true' || isFeatured === true
    }

    // 6. Optional text search over title and description
    if (search && search.trim()) {
        filter.$or = [
            { title: { $regex: search.trim(), $options: 'i' } },
            { description: { $regex: search.trim(), $options: 'i' } },
        ]
    }

    const allEvents = await Event.find(filter)
        .populate('categoryId', 'eventCategory')
        .populate('venueId', 'name address city')
        .populate('organizerId', 'userName email')
        .sort({ startDate: 1 })

    res.status(200).json({
        success: true,
        count: allEvents.length,
        data: allEvents,
    })
})

// ============================================================================
// @desc    Get Public Event Details by ID (With Populated Hierarchy)
// @route   GET /api/events/:id
// @access  Public
// ============================================================================
export const getEventById = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid event ID format')
    }

    const selectedEvent = await Event.findOne({
        _id: id,
        status: { $ne: 'draft' },
    })
        .populate('categoryId', 'eventCategory')
        .populate('venueId', 'name address city auditoriums')
        .populate('organizerId', 'userName email')

    if (!selectedEvent) {
        res.status(404)
        throw new Error('Event not found or is currently not published')
    }

    // Resolve nested auditorium and screen subdocuments from venue document
    const selectedAuditorium = selectedEvent.venueId?.auditoriums?.id(
        selectedEvent.auditoriumId,
    )

    const selectedScreen = selectedAuditorium?.screens?.id(
        selectedEvent.screenId,
    )

    const outputEvent = {
        ...selectedEvent.toObject(),
        selectedAuditorium: selectedAuditorium
            ? {
                  _id: selectedAuditorium._id,
                  name: selectedAuditorium.name,
                  screenCount: selectedAuditorium.screens?.length || 0,
              }
            : null,
        selectedScreen: selectedScreen
            ? {
                  _id: selectedScreen._id,
                  screenNumber: selectedScreen.screenNumber,
                  capacity: selectedScreen.capacity,
                  soundSystem: selectedScreen.soundSystem,
              }
            : null,
    }

    res.status(200).json({
        success: true,
        data: outputEvent,
    })
})

// ============================================================================
// @desc    Update Event Details (Enforcing Capacity & Inventory Integrity)
// @route   PUT /api/admin/events/:id
// @access  Private (Admin)
// ============================================================================
export const updateEvent = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid event ID format')
    }

    const event = await Event.findById(id)
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
        isFeatured,
        isTopEvent,
        bannerImages,
    } = req.body

    // 1. Resolve Target Venue, Auditorium & Screen Hierarchy
    const targetVenueId = venueId || event.venueId.toString()
    const targetAudiId = auditoriumId || event.auditoriumId.toString()
    const targetScreenId = screenId || event.screenId.toString()
    const targetStartDate = startDate ? new Date(startDate) : event.startDate

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

    // 2. Schedule and Location Collision Guard
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

    // 3. Ticket Tiers Integrity Engine
    if (ticketTiers) {
        let parsedTiers
        try {
            parsedTiers =
                typeof ticketTiers === 'string'
                    ? JSON.parse(ticketTiers)
                    : ticketTiers
        } catch {
            res.status(400)
            throw new Error('Invalid JSON format provided for ticketTiers')
        }

        if (!Array.isArray(parsedTiers) || parsedTiers.length === 0) {
            res.status(400)
            throw new Error('ticketTiers must be a non-empty array')
        }

        const totalSold = event.ticketTiers.reduce(
            (sum, tier) => sum + (tier.soldQuantity || 0),
            0,
        )

        const proposedTotalCapacity = parsedTiers.reduce(
            (sum, tier) => sum + (Number(tier.totalQuantity) || 0),
            0,
        )

        if (proposedTotalCapacity > maxScreenCapacity) {
            res.status(400)
            throw new Error(
                `Total ticket allocation (${proposedTotalCapacity}) exceeds screen capacity (${maxScreenCapacity})`,
            )
        }

        // Branch A: ZERO ACTIVE SALES (Permits structural tier modifications)
        if (totalSold === 0) {
            event.ticketTiers = parsedTiers
        }
        // Branch B: ACTIVE SALES ALREADY COMMENCED (Strict immutability)
        else {
            if (parsedTiers.length !== event.ticketTiers.length) {
                res.status(400)
                throw new Error(
                    'Cannot add or delete ticket tiers once ticket sales have commenced',
                )
            }

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

                if (Number(incomingMatch.price) !== existingTier.price) {
                    res.status(400)
                    throw new Error(
                        `Price modifications are forbidden for tier "${existingTier.name}" after ticket sales start`,
                    )
                }

                if (incomingMatch.name.trim() !== existingTier.name) {
                    res.status(400)
                    throw new Error(
                        `Name modifications are forbidden for tier "${existingTier.name}" after ticket sales start`,
                    )
                }

                const newQuantity = Number(incomingMatch.totalQuantity)
                if (newQuantity < existingTier.soldQuantity) {
                    res.status(400)
                    throw new Error(
                        `Total quantity for tier "${existingTier.name}" cannot be decreased below already sold tickets (${existingTier.soldQuantity})`,
                    )
                }

                existingTier.totalQuantity = newQuantity
            }
        }
    }

    // 4. File Replacement Handling
    if (req.file) {
        deleteFile(event.posterImage?.url)
        event.posterImage = {
            url: `/uploads/${req.file.filename}`,
            publicId: null,
        }
    }

    // 5. Apply Scalar & Homepage Layout Fields Safely
    if (title !== undefined) event.title = title.trim()
    if (description !== undefined) event.description = description.trim()
    if (categoryId !== undefined) event.categoryId = categoryId
    if (venueId !== undefined) event.venueId = targetVenueId
    if (auditoriumId !== undefined) event.auditoriumId = targetAudiId
    if (screenId !== undefined) event.screenId = targetScreenId
    if (startDate !== undefined) event.startDate = targetStartDate
    if (endDate !== undefined) event.endDate = new Date(endDate)
    if (status !== undefined) event.status = status

    if (isFeatured !== undefined) {
        event.isFeatured = isFeatured === 'true' || isFeatured === true
    }

    if (isTopEvent !== undefined) {
        event.isTopEvent = isTopEvent === 'true' || isTopEvent === true
    }

    if (bannerImages !== undefined) {
        try {
            event.bannerImages =
                typeof bannerImages === 'string'
                    ? JSON.parse(bannerImages)
                    : bannerImages
        } catch {
            event.bannerImages = Array.isArray(bannerImages)
                ? bannerImages
                : [bannerImages]
        }
    }

    const updatedEvent = await event.save()

    res.status(200).json({
        success: true,
        data: updatedEvent,
    })
})

// ============================================================================
// @desc    Delete Event (Restricted to Zero Committed Sales)
// @route   DELETE /api/admin/events/:id
// @access  Private (Admin)
// ============================================================================
export const deleteEvent = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid event ID format')
    }

    const event = await Event.findById(id)
    if (!event) {
        res.status(404)
        throw new Error('Event not found')
    }

    const totalSold = event.ticketTiers.reduce(
        (sum, tier) => sum + (tier.soldQuantity || 0),
        0,
    )

    if (totalSold > 0) {
        res.status(400)
        throw new Error(
            'Cannot delete an event with active ticket sales. Update its status to "cancelled" instead.',
        )
    }

    deleteFile(event.posterImage?.url)
    await event.deleteOne()

    res.status(200).json({
        success: true,
        message: 'Event and associated assets removed successfully',
    })
})

// ============================================================================
// @desc    Get Real-time Event Settlement Summary (Preview)
// @route   GET /api/events/:id/settlement-summary
// @access  Private (Organizer / Admin)
// ============================================================================
export const getEventSettlementSummary = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid Event ID format')
    }

    const { event, settlement } = await computeEventSettlement(id)

    const userRole = (
        req.user?.role?.role ||
        req.user?.role ||
        ''
    ).toLowerCase()
    const isAdmin = userRole === 'admin'
    const isOrganizer =
        event.organizerId?.toString() === req.user?._id?.toString()

    if (!isAdmin && !isOrganizer) {
        res.status(403)
        throw new Error(
            'Not authorized to view financial metrics for this event',
        )
    }

    res.status(200).json({
        success: true,
        data: {
            eventId: event._id,
            title: event.title,
            eventStatus: event.status,
            ...settlement,
        },
    })
})
