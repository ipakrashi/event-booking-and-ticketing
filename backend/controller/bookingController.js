// backend/controller/bookingController.js

import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import crypto from 'crypto'
import QRCode from 'qrcode'
import Event from '../model/event.js'
import Booking from '../model/booking.js'

// ==================================
//  @desc :     Create New Booking for an Event
//  @route:     POST /api/bookings
//  @access:    Private (Logged-in Users)
// ==================================
export const createBooking = asyncHandler(async (req, res) => {
    const { eventId, ticketTierId, bookedQty } = req.body
    const userId = req.user._id

    // 1. Validate incoming payload structure & formats
    if (!eventId || !ticketTierId || !bookedQty) {
        res.status(400)
        throw new Error('Please provide eventId, ticketTierId, and bookedQty')
    }

    if (
        !mongoose.Types.ObjectId.isValid(eventId) ||
        !mongoose.Types.ObjectId.isValid(ticketTierId)
    ) {
        res.status(400)
        throw new Error('Invalid event or ticket tier ID format')
    }

    const requestedQty = Number(bookedQty)
    if (!Number.isInteger(requestedQty) || requestedQty <= 0) {
        res.status(400)
        throw new Error('Booked quantity must be a positive integer')
    }

    // 2. Fetch the target event
    const event = await Event.findById(eventId)
    if (!event) {
        res.status(404)
        throw new Error('Event not found')
    }

    // Guard: Support active sales and advance sales window
    const bookableStatuses = ['published', 'coming_soon']
    if (!bookableStatuses.includes(event.status)) {
        res.status(400)
        throw new Error(
            `Ticket bookings are not active. Event status is: ${event.status}`,
        )
    }

    // 3. Locate the requested ticket tier subdocument
    const tier = event.ticketTiers.id(ticketTierId)
    if (!tier) {
        res.status(404)
        throw new Error('Selected ticket tier does not exist for this event')
    }

    // ----------------------------------------------------
    // 4. ATOMIC INVENTORY RESERVATION (COMPARE-AND-SWAP)
    // ----------------------------------------------------

    // Step A: In-memory capacity check against fetched snapshot
    const remainingSeats = tier.totalQuantity - tier.soldQuantity

    if (requestedQty > remainingSeats) {
        res.status(400)
        throw new Error(
            `Only ${remainingSeats} ticket(s) remaining for tier "${tier.name}"`,
        )
    }

    // Step B: Atomic write with version lock on soldQuantity
    const updatedEvent = await Event.findOneAndUpdate(
        {
            _id: eventId,
            ticketTiers: {
                $elemMatch: {
                    _id: ticketTierId,
                    soldQuantity: tier.soldQuantity, // Optimistic concurrency guard
                },
            },
        },
        {
            $inc: { 'ticketTiers.$.soldQuantity': requestedQty },
        },
        {
            returnDocument: 'after',
            runValidators: true,
        },
    )

    // Step C: Handle collision if another purchase completed concurrently
    if (!updatedEvent) {
        res.status(409)
        throw new Error(
            'Seat availability changed while processing your request. Please retry your booking.',
        )
    }

    // ----------------------------------------------------
    // 5. COMPUTE FINANCIALS & FREEZE SNAPSHOT IN BOOKING
    // ----------------------------------------------------
    const unitPrice = tier.price
    const totalAmount = unitPrice * requestedQty

    const booking = await Booking.create({
        user: userId,
        event: eventId,
        ticketTierId: tier._id,
        tierName: tier.name,
        unitPrice: unitPrice,
        bookedQty: requestedQty,
        totalAmount: totalAmount,
        bookingStatus: 'request_sent',
        paymentStatus: 'not_paid',
        despatchStatus: 'not_dispatched',
    })

    res.status(201).json({
        success: true,
        message: 'Booking request created successfully',
        data: booking,
    })
})

// ==================================
//  @desc :     Get Logged-in User Bookings
//  @route:     GET /api/bookings/my-bookings
//  @access:    Private
// ==================================
export const getMyBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate('event', 'title startDate endDate venueId posterImage')
        .sort({ createdAt: -1 })

    res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
    })
})

// ==================================
//  @desc :     Get All Bookings for a Specific Event (Attendee Roster)
//  @route:     GET /api/bookings/event/:eventId
//  @access:    Private/Admin/Organiser
// ==================================
export const getEventBookings = asyncHandler(async (req, res) => {
    const { eventId } = req.params

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(400)
        throw new Error('Invalid event ID format')
    }

    const event = await Event.findById(eventId)
    if (!event) {
        res.status(404)
        throw new Error('Event not found')
    }

    // Role extraction guard (handles populated role document or raw role string)
    const userRole = req.user.role?.role || req.user.role

    // Authorization & Ownership Verification
    const isOwner =
        event.organizerId &&
        event.organizerId.toString() === req.user._id.toString()
    const isAdmin = userRole === 'admin'

    if (!isOwner && !isAdmin) {
        res.status(403)
        throw new Error(
            'You are not authorized to view attendee records for an event you do not own',
        )
    }

    const bookings = await Booking.find({ event: eventId })
        .populate(
            'user',
            'userName email phone address city state pincode country',
        )
        .sort({ createdAt: -1 })

    // Summary metrics for the organizer dashboard
    const summary = bookings.reduce(
        (acc, b) => {
            acc.totalTicketsSold += b.bookedQty
            if (b.paymentStatus === 'paid') {
                acc.totalRevenue += b.totalAmount
            }
            return acc
        },
        { totalTicketsSold: 0, totalRevenue: 0 },
    )

    res.status(200).json({
        success: true,
        count: bookings.length,
        summary,
        data: bookings,
    })
})

// ==================================
//  @desc :     Update Payment Status and details for a booking
//  @route:     PUT /api/bookings/:id/pay
//  @access:    Private
// ==================================
export const updatePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { paymentAmount, paymentDetails } = req.body

    // 1. Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid booking ID format')
    }

    // 2. Validate incoming payload structure
    if (!paymentAmount || !paymentDetails?.mode || !paymentDetails?.trxnId) {
        res.status(400)
        throw new Error(
            'Please provide paymentAmount, paymentDetails.mode, and paymentDetails.trxnId',
        )
    }

    // 3. Find booking
    const bookingDetails = await Booking.findById(id)
    if (!bookingDetails) {
        res.status(404)
        throw new Error('Booking Details Not Found')
    }

    // 4. Ownership verification
    const userRole = req.user.role?.role || req.user.role
    const isOwner = bookingDetails.user.toString() === req.user._id.toString()
    const isAdmin = userRole === 'admin'

    if (!isOwner && !isAdmin) {
        res.status(403)
        throw new Error(
            'You are not authorized to update payment for this booking',
        )
    }

    // 5. State guards
    if (bookingDetails.paymentStatus === 'paid') {
        res.status(400)
        throw new Error('There are no payments pending for this booking')
    }

    if (bookingDetails.bookingStatus === 'cancelled') {
        res.status(400)
        throw new Error('Cannot submit payment for a cancelled booking')
    }

    // 6. Tally amounts
    if (Number(paymentAmount) !== bookingDetails.totalAmount) {
        res.status(400)
        throw new Error(
            `Paid amount (${paymentAmount}) does not match outstanding total (${bookingDetails.totalAmount})`,
        )
    }

    // 7. Update fields directly on the document
    bookingDetails.paymentStatus = 'paid'
    bookingDetails.bookingStatus = 'confirmed'
    bookingDetails.paymentDetails = {
        mode: paymentDetails.mode.toLowerCase().trim(),
        trxnId: paymentDetails.trxnId.trim(),
    }

    // Assign cryptographically random entry pass token if not already assigned
    if (!bookingDetails.entryPassToken) {
        bookingDetails.entryPassToken = crypto.randomBytes(32).toString('hex')
    }

    // 8. Persist to MongoDB
    const updatedBooking = await bookingDetails.save()

    res.status(200).json({
        success: true,
        message: 'Payment recorded and booking confirmed successfully',
        data: updatedBooking,
    })
})

// ==================================
//  @desc :     Update Dispatch Status, Generate Shipping Label & Manifest
//  @route:     PUT /api/bookings/:id/dispatch
//  @access:    Private (Admin / Organizer)
// ==================================
export const updateDispatchStatus = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { despatchDetails } = req.body

    // 1. Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid booking ID format')
    }

    // 2. Validate payload structure
    const courierName = despatchDetails?.courierName?.trim()
    const podId = despatchDetails?.podId?.trim()

    if (!courierName || !podId) {
        res.status(400)
        throw new Error('Please provide courierName and podId')
    }

    // 3. Find booking & populate organizer and recipient contact/dispatch information
    const booking = await Booking.findById(id)
        .populate('event', 'organizerId title')
        .populate(
            'user',
            'userName email phone address city state country pincode',
        )

    if (!booking) {
        res.status(404)
        throw new Error('Booking Details Not Found')
    }

    // 4. Ownership verification
    const userRole = req.user.role?.role || req.user.role
    const isAdmin = userRole === 'admin'
    const isOwner =
        booking.event?.organizerId?.toString() === req.user._id.toString()

    if (!isAdmin && !isOwner) {
        res.status(403)
        throw new Error(
            'You are not authorized to dispatch tickets for an event you do not own',
        )
    }

    // 5. State guards
    if (booking.paymentStatus !== 'paid') {
        res.status(400)
        throw new Error('Cannot dispatch tickets for an unpaid booking')
    }

    if (booking.bookingStatus === 'cancelled') {
        res.status(400)
        throw new Error('Cannot dispatch tickets for a cancelled booking')
    }

    if (
        booking.despatchStatus === 'dispatched' ||
        booking.despatchStatus === 'received'
    ) {
        res.status(400)
        throw new Error(
            `Tickets have already been ${booking.despatchStatus} for this event via ${booking.despatchDetails?.courierName} (POD: ${booking.despatchDetails?.podId})`,
        )
    }

    // 6. Recipient Physical Address Guard
    const recipient = booking.user
    if (
        !recipient ||
        !recipient.address ||
        !recipient.city ||
        !recipient.pincode
    ) {
        res.status(400)
        throw new Error(
            'Attendee delivery address is incomplete (address, city, or pincode missing). Cannot generate shipping label.',
        )
    }

    // 7. Synthesize Verified Physical Shipping Label
    const shippingLabel = {
        bookingId: booking._id,
        eventTitle: booking.event?.title,
        recipientName: recipient.userName,
        recipientContact: recipient.phone || 'N/A',
        recipientEmail: recipient.email,
        deliveryAddress:
            `${recipient.address}, ${recipient.city}, ${recipient.state || ''} - ${recipient.pincode}, ${recipient.country || 'India'}`.replace(
                /\s+,/g,
                ',',
            ),
        courierService: courierName,
        trackingNumber: podId,
        dispatchedAt: new Date(),
    }

    // 8. Mutate fields & commit
    booking.despatchStatus = 'dispatched'
    booking.despatchDetails = {
        courierName,
        podId,
    }

    const updatedBooking = await booking.save()

    res.status(200).json({
        success: true,
        message: 'Tickets marked as dispatched successfully',
        data: updatedBooking,
        shippingLabel,
    })
})

// ==================================
//  @desc :     Get Physical Shipping Label for a Booking
//  @route:     GET /api/bookings/:id/shipping-label
//  @access:    Private (Admin / Organizer)
// ==================================
export const getShippingLabel = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid booking ID format')
    }

    const booking = await Booking.findById(id)
        .populate('event', 'title organizerId')
        .populate(
            'user',
            'userName email phone address city state country pincode',
        )

    if (!booking) {
        res.status(404)
        throw new Error('Booking Details Not Found')
    }

    const userRole = req.user.role?.role || req.user.role
    const isAdmin = userRole === 'admin'
    const isOwner =
        booking.event?.organizerId?.toString() === req.user._id.toString()

    if (!isAdmin && !isOwner) {
        res.status(403)
        throw new Error(
            'Not authorized to view shipping label for this booking',
        )
    }

    const recipient = booking.user
    const deliveryAddress = recipient?.address
        ? `${recipient.address}, ${recipient.city}, ${recipient.state || ''} - ${recipient.pincode}, ${recipient.country || 'India'}`.replace(
              /\s+,/g,
              ',',
          )
        : 'Incomplete Address'

    const shippingLabel = {
        bookingId: booking._id,
        eventTitle: booking.event?.title,
        recipientName: recipient?.userName || 'N/A',
        recipientContact: recipient?.phone || 'N/A',
        recipientEmail: recipient?.email || 'N/A',
        deliveryAddress,
        despatchStatus: booking.despatchStatus,
        courierService: booking.despatchDetails?.courierName || null,
        trackingNumber: booking.despatchDetails?.podId || null,
    }

    res.status(200).json({
        success: true,
        data: shippingLabel,
    })
})

// ==================================
//  @desc :     Update Ticket Receipt Status
//  @route:     PUT /api/bookings/:id/receive
//  @access:    Private (Customer / Admin / Organizer)
// ==================================
export const updateReceiveStatus = asyncHandler(async (req, res) => {
    const { id } = req.params

    // 1. Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid booking ID format')
    }

    // 2. Find booking & populate event organizer
    const bookingDetails = await Booking.findById(id).populate(
        'event',
        'organizerId',
    )

    if (!bookingDetails) {
        res.status(404)
        throw new Error('Booking Details Not Found')
    }

    // 3. Ownership verification
    const userRole = req.user.role?.role || req.user.role
    const isAdmin = userRole === 'admin'
    const isOwner =
        bookingDetails.event?.organizerId?.toString() ===
        req.user._id.toString()
    const isCustomer =
        bookingDetails.user.toString() === req.user._id.toString()

    if (!isCustomer && !isAdmin && !isOwner) {
        res.status(403)
        throw new Error(
            'You are not authorized to update Despatch status for tickets of events you do not own',
        )
    }

    // 4. State guards
    if (bookingDetails.despatchStatus !== 'dispatched') {
        res.status(400)
        throw new Error(
            'Tickets have not yet been dispatched, cannot update status to received',
        )
    }

    if (bookingDetails.bookingStatus === 'cancelled') {
        res.status(400)
        throw new Error(
            'Cannot mark tickets as received for a cancelled booking',
        )
    }

    // 5. Mutate fields
    bookingDetails.despatchStatus = 'received'

    // 6. Persist to MongoDB
    const updatedBooking = await bookingDetails.save()

    res.status(200).json({
        success: true,
        message: 'Tickets marked as received successfully',
        data: updatedBooking,
    })
})

// ==================================
//  @desc :     Bulk Update Ticket Receipt Status
//  @route:     PATCH /api/bookings/bulk-receive
//  @access:    Private (Admin / Organizer)
// ==================================
export const bulkUpdateReceiveStatus = asyncHandler(async (req, res) => {
    const { bookingIds } = req.body

    // 1. Validate incoming array structure
    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
        res.status(400)
        throw new Error('Please provide an array of bookingIds')
    }

    // 2. Validate format of each ObjectId in the array
    const isValidFormat = bookingIds.every((id) =>
        mongoose.Types.ObjectId.isValid(id),
    )
    if (!isValidFormat) {
        res.status(400)
        throw new Error(
            'One or more booking IDs have an invalid ObjectId format',
        )
    }

    // 3. Resolve role and determine ownership scope
    const userRole = req.user.role?.role || req.user.role
    const isAdmin = userRole === 'admin'

    let filter = {
        _id: { $in: bookingIds },
        despatchStatus: 'dispatched',
        bookingStatus: { $ne: 'cancelled' },
    }

    // If organizer, restrict update strictly to events they own
    if (!isAdmin) {
        const organizerEvents = await Event.find({
            organizerId: req.user._id,
        }).select('_id')

        const ownedEventIds = organizerEvents.map((evt) => evt._id)

        filter.event = { $in: ownedEventIds }
    }

    // 4. Execute atomic bulk update
    const result = await Booking.updateMany(filter, {
        $set: {
            despatchStatus: 'received',
        },
    })

    res.status(200).json({
        success: true,
        message: `Successfully marked ${result.modifiedCount} booking(s) as received`,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
    })
})

// ==================================
//  @desc :     Cancel Booking & Rollback Inventory
//  @route:     PUT /api/bookings/:id/cancel
//  @access:    Private (Customer / Organizer / Admin)
// ==================================
export const cancelBooking = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { cancelledQty, cancellationReason } = req.body

    // 1. Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid booking ID format')
    }

    // 2. Validate payload structure
    const parsedQty = Number(cancelledQty)
    if (!parsedQty || !Number.isInteger(parsedQty) || parsedQty <= 0) {
        res.status(400)
        throw new Error('Valid cancel quantity is required')
    }

    // 3. Find booking & populate event organizer
    const bookingDetails = await Booking.findById(id).populate(
        'event',
        'organizerId',
    )

    if (!bookingDetails) {
        res.status(404)
        throw new Error('Booking Details Not Found')
    }

    // 4. Ownership verification
    const userRole = req.user.role?.role || req.user.role
    const isAdmin = userRole === 'admin'
    const isOwner =
        bookingDetails.event?.organizerId?.toString() ===
        req.user._id.toString()
    const isCustomer =
        bookingDetails.user.toString() === req.user._id.toString()

    if (!isCustomer && !isAdmin && !isOwner) {
        res.status(403)
        throw new Error(
            'You are not authorized to cancel tickets for an event you do not own',
        )
    }

    // 5. State guards
    if (
        bookingDetails.despatchStatus === 'dispatched' ||
        bookingDetails.despatchStatus === 'received'
    ) {
        res.status(400)
        throw new Error(
            `Cannot cancel tickets that have already been ${bookingDetails.despatchStatus} for this event`,
        )
    }

    const nonCancellableStatuses = [
        'rejected',
        'cancelled',
        'refund_issued',
        'refund_requested',
    ]
    if (nonCancellableStatuses.includes(bookingDetails.bookingStatus)) {
        res.status(400)
        throw new Error(
            `Cannot cancel tickets that are currently marked as ${bookingDetails.bookingStatus}`,
        )
    }

    // Full cancellation policy guard
    if (parsedQty !== bookingDetails.bookedQty) {
        res.status(400)
        throw new Error(
            `Partial cancellations are not supported. Tickets Booked: ${bookingDetails.bookedQty}, Cancellation Requested: ${parsedQty}`,
        )
    }

    // 6. ATOMIC INVENTORY ROLLBACK
    const eventId = bookingDetails.event._id || bookingDetails.event
    const updatedEvent = await Event.findOneAndUpdate(
        {
            _id: eventId,
            'ticketTiers._id': bookingDetails.ticketTierId,
        },
        {
            $inc: { 'ticketTiers.$.soldQuantity': -parsedQty },
        },
        {
            returnDocument: 'after',
            runValidators: true,
        },
    )

    if (!updatedEvent) {
        res.status(500)
        throw new Error(
            'Failed to restore ticket inventory during cancellation',
        )
    }

    // 7. Update booking audit and state fields
    bookingDetails.cancelledQty = parsedQty
    bookingDetails.cancellationReason = cancellationReason || 'Not specified'
    bookingDetails.refundAmount = parsedQty * bookingDetails.unitPrice
    bookingDetails.bookingStatus = 'cancelled'
    bookingDetails.entryPassToken = null

    if (bookingDetails.paymentStatus === 'paid') {
        bookingDetails.paymentStatus = 'refund_requested'
    }

    // 8. Persist to MongoDB
    const updatedBooking = await bookingDetails.save()

    res.status(200).json({
        success: true,
        message: 'Booking cancelled and ticket inventory restored successfully',
        data: updatedBooking,
    })
})

// ==================================
//  @desc :     Get Digital Entry Pass with Dynamic QR Code
//  @route:     GET /api/bookings/:id/entry-pass
//  @access:    Private (Customer Owner / Admin)
// ==================================
export const getDigitalEntryPass = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid booking ID format')
    }

    const booking = await Booking.findById(id)
        .populate('event', 'title startDate endDate venueId posterImage status')
        .populate({
            path: 'event',
            populate: {
                path: 'venueId',
                select: 'name address city',
            },
        })
        .populate(
            'user',
            'userName email phone address city state pincode country',
        )

    if (!booking) {
        res.status(404)
        throw new Error('Booking not found')
    }

    // Ownership Verification
    const userRole = req.user.role?.role || req.user.role
    const isOwner = booking.user._id.toString() === req.user._id.toString()
    const isAdmin = userRole === 'admin'

    if (!isOwner && !isAdmin) {
        res.status(403)
        throw new Error('Not authorized to access this entry pass')
    }

    // Guard: Must be paid and confirmed
    if (
        booking.paymentStatus !== 'paid' ||
        booking.bookingStatus !== 'confirmed'
    ) {
        res.status(400)
        throw new Error(
            `Cannot generate entry pass for a booking with payment status '${booking.paymentStatus}' and booking status '${booking.bookingStatus}'`,
        )
    }

    if (!booking.entryPassToken) {
        res.status(500)
        throw new Error(
            'Entry pass token is missing for this confirmed booking',
        )
    }

    // Generate Base64 Data URI using High Error Correction Level ('H')
    const qrDataUrl = await QRCode.toDataURL(booking.entryPassToken, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 320,
        color: {
            dark: '#000000',
            light: '#ffffff',
        },
    })

    res.status(200).json({
        success: true,
        data: {
            passId: booking._id,
            qrCode: qrDataUrl,
            entryPassToken: booking.entryPassToken,
            isCheckedIn: booking.isCheckedIn,
            checkInTimestamp: booking.checkInTimestamp,
            event: {
                title: booking.event?.title,
                startDate: booking.event?.startDate,
                endDate: booking.event?.endDate,
                venue: booking.event?.venueId?.name,
                city: booking.event?.venueId?.city,
                address: booking.event?.venueId?.address,
            },
            attendee: {
                name: booking.user?.userName,
                email: booking.user?.email,
                phone: booking.user?.phone || null,
                address: booking.user?.address || null,
                city: booking.user?.city || null,
                state: booking.user?.state || null,
                pincode: booking.user?.pincode || null,
                country: booking.user?.country || null,
                tierName: booking.tierName,
                bookedQty: booking.bookedQty,
            },
        },
    })
})

// ==================================
//  @desc :     Verify Entry Pass at Gate Scanner (Anti-Passback)
//  @route:     POST /api/bookings/verify-entry
//  @access:    Private (Admin / Event Staff / Organizer)
// ==================================
export const verifyGateEntry = asyncHandler(async (req, res) => {
    const { passToken } = req.body

    if (!passToken || typeof passToken !== 'string') {
        res.status(400)
        throw new Error('Please provide a valid passToken string')
    }

    // Find booking by the unique, indexed token
    const booking = await Booking.findOne({ entryPassToken: passToken.trim() })
        .populate('event', 'title startDate endDate organizerId status')
        .populate('user', 'userName email')

    if (!booking) {
        res.status(404)
        throw new Error('Invalid or non-existent entry pass. Admission Denied.')
    }

    // Authorization: Verifier must be admin, or the organizer/assigned staff of this event
    const userRole = req.user.role?.role || req.user.role
    const isAdmin = userRole === 'admin'
    const isOrganizer =
        booking.event?.organizerId?.toString() === req.user._id.toString()

    if (!isAdmin && !isOrganizer) {
        res.status(403)
        throw new Error(
            'Not authorized to scan or admit attendees for this event',
        )
    }

    // State Barrier: Active Payment & Booking Status
    if (
        booking.bookingStatus === 'cancelled' ||
        booking.paymentStatus !== 'paid'
    ) {
        res.status(400)
        throw new Error(
            `Admission Denied: Pass is associated with a ${booking.bookingStatus} booking`,
        )
    }

    // Anti-Passback Guard: Prevent ticket reuse
    if (booking.isCheckedIn) {
        res.status(400)
        throw new Error(
            `Admission Denied: Pass has ALREADY been scanned and admitted on ${new Date(
                booking.checkInTimestamp,
            ).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
        )
    }

    // Atomic Admission Commit
    booking.isCheckedIn = true
    booking.checkInTimestamp = new Date()
    booking.checkedInBy = req.user._id

    const admittedBooking = await booking.save()

    res.status(200).json({
        success: true,
        message: 'Entry Approved. Welcome to the event!',
        data: {
            passId: admittedBooking._id,
            attendeeName: booking.user?.userName,
            tier: admittedBooking.tierName,
            admittedQuantity: admittedBooking.bookedQty,
            checkInTimestamp: admittedBooking.checkInTimestamp,
            eventTitle: booking.event?.title,
        },
    })
})
