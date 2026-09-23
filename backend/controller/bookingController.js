// backend/controller/bookingController.js

import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import crypto from 'crypto'
import QRCode from 'qrcode'
import Razorpay from 'razorpay'
import Event from '../model/event.js'
import Booking from '../model/booking.js'

// Initialize instance using test credentials from .env
const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
}

// =========================================================================
// @desc :    Create New Booking(s) in 'request_sent' & 'not_paid' status
// @route:    POST /api/bookings
// @access:   Private (Logged-in Users)
// =========================================================================
export const createBooking = asyncHandler(async (req, res) => {
    const { eventId, selectedTiers, ticketTierId, bookedQty } = req.body
    const userId = req.user._id

    if (!eventId || (!selectedTiers && (!ticketTierId || !bookedQty))) {
        res.status(400)
        throw new Error(
            'Please provide eventId and either selectedTiers array or ticketTierId with bookedQty',
        )
    }

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(400)
        throw new Error('Invalid event ID format')
    }

    const event = await Event.findById(eventId)
    if (!event) {
        res.status(404)
        throw new Error('Event not found')
    }

    const bookableStatuses = ['published', 'coming_soon']
    if (!bookableStatuses.includes(event.status)) {
        res.status(400)
        throw new Error(
            `Ticket bookings are not active. Event status is: ${event.status}`,
        )
    }

    let itemsToBook = []
    if (Array.isArray(selectedTiers) && selectedTiers.length > 0) {
        itemsToBook = selectedTiers.map((item) => ({
            tierId: item.tierId,
            quantity: Number(item.quantity),
        }))
    } else {
        itemsToBook = [
            {
                tierId: ticketTierId,
                quantity: Number(bookedQty),
            },
        ]
    }

    for (const item of itemsToBook) {
        if (
            !mongoose.Types.ObjectId.isValid(item.tierId) ||
            !Number.isInteger(item.quantity) ||
            item.quantity <= 0
        ) {
            res.status(400)
            throw new Error('Invalid tier ID or quantity specified')
        }
    }

    const createdBookings = []
    const rollbacks = []

    try {
        for (const item of itemsToBook) {
            const tier = event.ticketTiers.id(item.tierId)
            if (!tier) {
                throw new Error(
                    `Ticket tier ID "${item.tierId}" does not exist`,
                )
            }

            const remaining = tier.totalQuantity - tier.soldQuantity
            if (item.quantity > remaining) {
                throw new Error(
                    `Only ${remaining} seat(s) remaining for tier "${tier.name}"`,
                )
            }

            // Atomically reserve tier inventory
            const updatedEvent = await Event.findOneAndUpdate(
                {
                    _id: eventId,
                    ticketTiers: {
                        $elemMatch: {
                            _id: item.tierId,
                            soldQuantity: tier.soldQuantity,
                        },
                    },
                },
                {
                    $inc: { 'ticketTiers.$.soldQuantity': item.quantity },
                },
                {
                    returnDocument: 'after',
                    runValidators: true,
                },
            )

            if (!updatedEvent) {
                throw new Error(
                    `Seat availability changed for tier "${tier.name}". Please retry.`,
                )
            }

            rollbacks.push({ tierId: item.tierId, quantity: item.quantity })

            const unitPrice = tier.price
            const totalAmount = unitPrice * item.quantity

            // STRICT INITIALIZATION: 'request_sent', 'not_paid'
            const booking = await Booking.create({
                user: userId,
                event: eventId,
                ticketTierId: tier._id,
                tierName: tier.name,
                unitPrice: unitPrice,
                bookedQty: item.quantity,
                totalAmount: totalAmount,
                bookingStatus: 'request_sent',
                paymentStatus: 'not_paid',
                paymentDetails: {
                    mode: null,
                    trxnId: null,
                },
                despatchStatus: 'not_dispatched',
                // entryPassToken is intentionally omitted until payment is confirmed
            })
            createdBookings.push(booking)
        }
    } catch (err) {
        for (const rb of rollbacks) {
            await Event.updateOne(
                { _id: eventId, 'ticketTiers._id': rb.tierId },
                { $inc: { 'ticketTiers.$.soldQuantity': -rb.quantity } },
            )
        }
        res.status(400)
        throw new Error(err.message)
    }

    res.status(201).json({
        success: true,
        message:
            'Booking request registered successfully. Complete payment to confirm and receive your pass.',
        count: createdBookings.length,
        data:
            createdBookings.length === 1 ? createdBookings[0] : createdBookings,
    })
})

// =========================================================================
// @desc :    Get Logged-in User Bookings
// @route:    GET /api/bookings/my-bookings
// @access:   Private
// =========================================================================
export const getMyBookings = asyncHandler(async (req, res) => {
    const bookings = await Booking.find({ user: req.user._id })
        .populate(
            'event',
            'title startDate endDate venueId posterImage status organizerId',
        )
        .populate({
            path: 'event',
            populate: {
                path: 'venueId',
                select: 'name address city',
            },
        })
        .sort({ createdAt: -1 })

    res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
    })
})

// =========================================================================
// @desc :    Get All System Bookings (Admin) or Organizer Bookings
// @route:    GET /api/bookings/admin/all
// @access:   Private (Admin / Organizer)
// =========================================================================
export const getAllBookings = asyncHandler(async (req, res) => {
    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
    const isAdmin = userRole === 'admin'

    let filter = {}
    if (!isAdmin) {
        const myEvents = await Event.find({ organizerId: req.user._id }).select(
            '_id',
        )
        const myEventIds = myEvents.map((e) => e._id)
        filter = { event: { $in: myEventIds } }
    }

    const bookings = await Booking.find(filter)
        .populate('user', 'userName email phone')
        .populate({
            path: 'event',
            select: 'title startDate organizerId venueId',
            populate: { path: 'venueId', select: 'name city' },
        })
        .sort({ createdAt: -1 })

    res.status(200).json({
        success: true,
        count: bookings.length,
        data: bookings,
    })
})

// =========================================================================
// @desc :    Get All Bookings for an Event (Attendee Roster)
// @route:    GET /api/bookings/event/:eventId
// @access:   Private/Admin/Organizer
// =========================================================================
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

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
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

// =========================================================================
// @desc :    Record / Confirm Manual Payment
// @route:    PUT /api/bookings/:id/pay
// @access:   Private (User for own booking, Admin or Organizer for event)
// =========================================================================
export const updatePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { paymentAmount, paymentDetails } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid booking ID format')
    }

    if (!paymentAmount || !paymentDetails?.mode || !paymentDetails?.trxnId) {
        res.status(400)
        throw new Error(
            'Please provide paymentAmount, paymentDetails.mode, and paymentDetails.trxnId',
        )
    }

    const booking = await Booking.findById(id).populate(
        'event',
        'organizerId title',
    )
    if (!booking) {
        res.status(404)
        throw new Error('Booking not found')
    }

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
    const isOwner = booking.user.toString() === req.user._id.toString()
    const isAdmin = userRole === 'admin'
    const isOrganizer =
        booking.event?.organizerId?.toString() === req.user._id.toString()

    if (!isOwner && !isAdmin && !isOrganizer) {
        res.status(403)
        throw new Error('Not authorized to process payment for this booking')
    }

    if (booking.paymentStatus === 'paid') {
        res.status(400)
        throw new Error('Booking is already paid')
    }

    if (['cancelled', 'rejected'].includes(booking.bookingStatus)) {
        res.status(400)
        throw new Error(
            `Cannot submit payment for a ${booking.bookingStatus} booking`,
        )
    }

    if (Number(paymentAmount) !== booking.totalAmount) {
        res.status(400)
        throw new Error(
            `Paid amount (₹${paymentAmount}) does not match outstanding total (₹${booking.totalAmount})`,
        )
    }

    booking.paymentStatus = 'paid'
    booking.bookingStatus = 'confirmed'
    booking.paymentDetails = {
        mode: paymentDetails.mode.toLowerCase().trim(),
        trxnId: paymentDetails.trxnId.trim(),
    }

    if (!booking.entryPassToken) {
        booking.entryPassToken = crypto.randomBytes(32).toString('hex')
    }

    const updatedBooking = await booking.save()

    res.status(200).json({
        success: true,
        message: 'Payment received. Booking is confirmed.',
        data: updatedBooking,
    })
})

// =========================================================================
// @desc :    Customer Request Cancellation & Refund
// @route:    PUT /api/bookings/:id/request-refund
// @access:   Private (Customer / Admin)
// =========================================================================
export const requestBookingRefund = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { cancellationReason } = req.body

    const booking = await Booking.findById(id).populate(
        'event',
        'title startDate endDate status',
    )
    if (!booking) {
        res.status(404)
        throw new Error('Booking not found')
    }

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
    const isCustomer = booking.user.toString() === req.user._id.toString()
    const isAdmin = userRole === 'admin'

    if (!isCustomer && !isAdmin) {
        res.status(403)
        throw new Error('Not authorized to cancel this booking')
    }

    // 1. Ineligible Booking Statuses
    const nonCancellableStatuses = [
        'cancelled',
        'refund_issued',
        'refund_requested',
        'rejected',
    ]
    if (nonCancellableStatuses.includes(booking.bookingStatus)) {
        res.status(400)
        throw new Error(
            `Booking is already in '${booking.bookingStatus}' state and cannot be cancelled.`,
        )
    }

    // 2. Physical Dispatch Barrier
    if (
        booking.despatchStatus === 'dispatched' ||
        booking.despatchStatus === 'received'
    ) {
        res.status(400)
        throw new Error(
            `Cannot cancel tickets that have already been ${booking.despatchStatus}`,
        )
    }

    // 3. Event Status Restrictions (Completed / Cancelled events cannot be cancelled)
    if (['completed', 'cancelled'].includes(booking.event?.status)) {
        res.status(400)
        throw new Error(
            `Cannot cancel reservations for an event that is already marked as ${booking.event?.status}.`,
        )
    }

    // 4. Time Cutoff: No cancellation beyond the event start date/time
    if (
        booking.event?.startDate &&
        new Date() >= new Date(booking.event.startDate)
    ) {
        res.status(400)
        throw new Error(
            'The cancellation window has closed. Bookings cannot be cancelled once the event has started.',
        )
    }

    booking.cancellationReason = cancellationReason || 'Requested by customer'
    booking.refundAmount = booking.totalAmount

    // Differentiate: Paid vs Unpaid
    if (booking.paymentStatus === 'paid') {
        booking.bookingStatus = 'refund_requested'
        booking.paymentStatus = 'refund_requested'
    } else {
        // Unpaid: Immediately restore tier seat inventory and mark cancelled
        await Event.updateOne(
            {
                _id: booking.event._id || booking.event,
                'ticketTiers._id': booking.ticketTierId,
            },
            { $inc: { 'ticketTiers.$.soldQuantity': -booking.bookedQty } },
        )
        booking.bookingStatus = 'cancelled'
        booking.cancelledQty = booking.bookedQty
    }

    const updated = await booking.save()

    res.status(200).json({
        success: true,
        message:
            booking.paymentStatus === 'refund_requested'
                ? 'Refund request submitted. Awaiting Admin/Organizer review.'
                : 'Reservation cancelled and locked seats released successfully.',
        data: updated,
    })
})

// =========================================================================
// @desc :    Approve & Process Refund (Admin / Organizer)
// @route:    PUT /api/bookings/:id/process-refund
// @access:   Private (Admin / Event Organizer)
// =========================================================================
export const processRefundApproval = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { action, adminRemarks } = req.body

    const booking = await Booking.findById(id).populate(
        'event',
        'organizerId title',
    )
    if (!booking) {
        res.status(404)
        throw new Error('Booking not found')
    }

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
    const isAdmin = userRole === 'admin'
    const isOrganizer =
        booking.event?.organizerId?.toString() === req.user._id.toString()

    if (!isAdmin && !isOrganizer) {
        res.status(403)
        throw new Error('Not authorized to approve refunds for this event')
    }

    if (booking.bookingStatus !== 'refund_requested') {
        res.status(400)
        throw new Error(
            `No active refund requested for this booking. Current status: ${booking.bookingStatus}`,
        )
    }

    if (action === 'approve') {
        await Event.updateOne(
            { _id: booking.event._id, 'ticketTiers._id': booking.ticketTierId },
            { $inc: { 'ticketTiers.$.soldQuantity': -booking.bookedQty } },
        )

        booking.cancelledQty = booking.bookedQty
        booking.bookingStatus = 'refund_issued'
        booking.paymentStatus = 'refunded'
        booking.entryPassToken = null
        booking.cancellationReason = adminRemarks
            ? `${booking.cancellationReason} | Remarks: ${adminRemarks}`
            : booking.cancellationReason
    } else if (action === 'reject') {
        booking.bookingStatus = 'confirmed'
        booking.paymentStatus = 'paid'
        booking.cancellationReason = `Refund Rejected: ${adminRemarks || 'Conditions not met'}`
    } else {
        res.status(400)
        throw new Error("Invalid action. Must be 'approve' or 'reject'")
    }

    const updated = await booking.save()

    res.status(200).json({
        success: true,
        message:
            action === 'approve'
                ? 'Refund approved and inventory restored'
                : 'Refund request rejected',
        data: updated,
    })
})

// =========================================================================
// @desc :    Update Dispatch Status
// @route:    PUT /api/bookings/:id/dispatch
// @access:   Private (Admin / Organizer)
// =========================================================================
export const updateDispatchStatus = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { despatchDetails } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid booking ID format')
    }

    const courierName = despatchDetails?.courierName?.trim()
    const podId = despatchDetails?.podId?.trim()

    if (!courierName || !podId) {
        res.status(400)
        throw new Error('Please provide courierName and podId')
    }

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

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
    const isAdmin = userRole === 'admin'
    const isOwner =
        booking.event?.organizerId?.toString() === req.user._id.toString()

    if (!isAdmin && !isOwner) {
        res.status(403)
        throw new Error(
            'You are not authorized to dispatch tickets for an event you do not own',
        )
    }

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

// =========================================================================
// @desc :    Get Physical Shipping Label
// @route:    GET /api/bookings/:id/shipping-label
// @access:   Private (Admin / Organizer)
// =========================================================================
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

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
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

// =========================================================================
// @desc :    Update Ticket Receipt Status
// @route:    PUT /api/bookings/:id/receive
// @access:   Private (Customer / Admin / Organizer)
// =========================================================================
export const updateReceiveStatus = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid booking ID format')
    }

    const bookingDetails = await Booking.findById(id).populate(
        'event',
        'organizerId',
    )

    if (!bookingDetails) {
        res.status(404)
        throw new Error('Booking Details Not Found')
    }

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
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

    bookingDetails.despatchStatus = 'received'
    const updatedBooking = await bookingDetails.save()

    res.status(200).json({
        success: true,
        message: 'Tickets marked as received successfully',
        data: updatedBooking,
    })
})

// =========================================================================
// @desc :    Bulk Update Ticket Receipt Status
// @route:    PATCH /api/bookings/bulk-receive
// @access:   Private (Admin / Organizer)
// =========================================================================
export const bulkUpdateReceiveStatus = asyncHandler(async (req, res) => {
    const { bookingIds } = req.body

    if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
        res.status(400)
        throw new Error('Please provide an array of bookingIds')
    }

    const isValidFormat = bookingIds.every((id) =>
        mongoose.Types.ObjectId.isValid(id),
    )
    if (!isValidFormat) {
        res.status(400)
        throw new Error(
            'One or more booking IDs have an invalid ObjectId format',
        )
    }

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
    const isAdmin = userRole === 'admin'

    let filter = {
        _id: { $in: bookingIds },
        despatchStatus: 'dispatched',
        bookingStatus: { $ne: 'cancelled' },
    }

    if (!isAdmin) {
        const organizerEvents = await Event.find({
            organizerId: req.user._id,
        }).select('_id')

        const ownedEventIds = organizerEvents.map((evt) => evt._id)
        filter.event = { $in: ownedEventIds }
    }

    const result = await Booking.updateMany(filter, {
        $set: { despatchStatus: 'received' },
    })

    res.status(200).json({
        success: true,
        message: `Successfully marked ${result.modifiedCount} booking(s) as received`,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
    })
})

// =========================================================================
// @desc :    Get Digital Entry Pass with Dynamic QR Code
// @route:    GET /api/bookings/:id/entry-pass
// @access:   Private (Customer Owner / Admin)
// =========================================================================
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

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
    const isOwner = booking.user._id.toString() === req.user._id.toString()
    const isAdmin = userRole === 'admin'

    if (!isOwner && !isAdmin) {
        res.status(403)
        throw new Error('Not authorized to access this entry pass')
    }

    // STRICT CONDITIONS: Paid, Confirmed, and Dispatched/Received
    if (booking.paymentStatus !== 'paid') {
        res.status(400)
        throw new Error(
            'Entry Pass locked: Payment has not been completed or verified.',
        )
    }

    if (booking.bookingStatus !== 'confirmed') {
        res.status(400)
        throw new Error(
            `Entry Pass locked: Booking is currently in '${booking.bookingStatus}' status.`,
        )
    }

    const allowedDespatch = ['dispatched', 'received']
    if (!allowedDespatch.includes(booking.despatchStatus)) {
        res.status(400)
        throw new Error(
            `Entry Pass locked: Physical tickets/wristbands are currently '${booking.despatchStatus}'. Must be 'dispatched' or 'received'.`,
        )
    }

    if (!booking.entryPassToken) {
        booking.entryPassToken = crypto.randomBytes(32).toString('hex')
        await booking.save()
    }

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
            despatchStatus: booking.despatchStatus,
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
                tierName: booking.tierName,
                bookedQty: booking.bookedQty,
            },
        },
    })
})

// =========================================================================
// @desc :    Verify Entry Pass at Gate Scanner (Anti-Passback + Event-Day Guard)
// @route:    POST /api/bookings/verify-entry
// @access:   Private (Admin / Event Staff / Organizer)
// =========================================================================
export const verifyGateEntry = asyncHandler(async (req, res) => {
    const { passToken } = req.body

    if (!passToken || typeof passToken !== 'string') {
        res.status(400)
        throw new Error('Please provide a valid passToken string')
    }

    const booking = await Booking.findOne({ entryPassToken: passToken.trim() })
        .populate('event', 'title startDate endDate organizerId status')
        .populate('user', 'userName email')

    if (!booking) {
        res.status(404)
        throw new Error('Invalid or non-existent entry pass. Admission Denied.')
    }

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
    const isAdmin = userRole === 'admin'
    const isOrganizer =
        booking.event?.organizerId?.toString() === req.user._id.toString()

    if (!isAdmin && !isOrganizer) {
        res.status(403)
        throw new Error(
            'Not authorized to scan or admit attendees for this event',
        )
    }

    if (
        booking.bookingStatus === 'cancelled' ||
        booking.paymentStatus !== 'paid'
    ) {
        res.status(400)
        throw new Error(
            `Admission Denied: Pass is associated with a ${booking.bookingStatus} booking`,
        )
    }

    // -------------------------------------------------------------------------
    // 1. Operational Event-Day Time Window Guard
    // -------------------------------------------------------------------------
    const now = new Date()
    const eventStart = new Date(booking.event.startDate)
    const eventEnd = new Date(booking.event.endDate)

    // Format calendar dates using Indian Standard Time (Asia/Kolkata)
    const eventDateStr = eventStart.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
    const todayStr = now.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })

    // Allow entry on the calendar day of the event, or up to 3 hours prior to start time
    const EARLY_ENTRY_BUFFER_MS = 3 * 60 * 60 * 1000
    const earliestAllowedEntry = new Date(
        eventStart.getTime() - EARLY_ENTRY_BUFFER_MS,
    )

    if (now < earliestAllowedEntry && todayStr !== eventDateStr) {
        res.status(400)
        throw new Error(
            `Admission Denied: Pass is valid only on the day of the event (${eventDateStr}). Gates open 3 hours before start time.`,
        )
    }

    if (now > eventEnd) {
        res.status(400)
        throw new Error(
            `Admission Denied: Event concluded on ${eventEnd.toLocaleDateString(
                'en-IN',
                { timeZone: 'Asia/Kolkata' },
            )}. This ticket pass has expired.`,
        )
    }

    // -------------------------------------------------------------------------
    // 2. Anti-Passback Guard
    // -------------------------------------------------------------------------
    if (booking.isCheckedIn) {
        res.status(400)
        throw new Error(
            `Admission Denied: Pass has ALREADY been scanned and admitted on ${new Date(
                booking.checkInTimestamp,
            ).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
        )
    }

    // -------------------------------------------------------------------------
    // 3. Mark Checked In
    // -------------------------------------------------------------------------
    booking.isCheckedIn = true
    booking.checkInTimestamp = now
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

// =========================================================================
// @desc :    Attendee Submits Offline Payment Proof / UTR Reference
// @route:    PUT /api/bookings/:id/submit-payment
// @access:   Private (Booking Owner)
// =========================================================================
export const submitPaymentDetails = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { mode, trxnId } = req.body

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid booking ID format')
    }

    if (!mode || !trxnId?.trim()) {
        res.status(400)
        throw new Error(
            'Please specify payment mode and transaction/reference ID',
        )
    }

    const booking = await Booking.findById(id)
    if (!booking) {
        res.status(404)
        throw new Error('Booking not found')
    }

    if (booking.user.toString() !== req.user._id.toString()) {
        res.status(403)
        throw new Error('Not authorized to submit payment for this booking')
    }

    if (booking.paymentStatus === 'paid') {
        res.status(400)
        throw new Error('Booking is already marked as paid')
    }

    booking.paymentStatus = 'pending_verification'
    booking.paymentDetails = {
        mode: mode.toLowerCase().trim(),
        trxnId: trxnId.trim(),
    }

    const updated = await booking.save()

    res.status(200).json({
        success: true,
        message: 'Payment details submitted for verification',
        data: updated,
    })
})

// =========================================================================
// @desc :    Admin / Organizer Approves Payment & Issues Token
// @route:    PUT /api/bookings/:id/approve-payment
// @access:   Private (Admin / Event Organizer)
// =========================================================================
export const approvePaymentAndConfirm = asyncHandler(async (req, res) => {
    const { id } = req.params

    const booking = await Booking.findById(id).populate(
        'event',
        'organizerId title',
    )
    if (!booking) {
        res.status(404)
        throw new Error('Booking not found')
    }

    const userRole = (req.user.role?.role || req.user.role || '').toLowerCase()
    const isAdmin = userRole === 'admin'
    const isOrganizer =
        booking.event?.organizerId?.toString() === req.user._id.toString()

    if (!isAdmin && !isOrganizer) {
        res.status(403)
        throw new Error('Not authorized to approve payments for this booking')
    }

    booking.paymentStatus = 'paid'
    booking.bookingStatus = 'confirmed'

    // Generate pass token only upon approval
    if (!booking.entryPassToken) {
        booking.entryPassToken = crypto.randomBytes(32).toString('hex')
    }

    const updated = await booking.save()

    res.status(200).json({
        success: true,
        message: 'Payment confirmed and Entry Pass token activated',
        data: updated,
    })
})

// =========================================================================
// @desc :    Create Razorpay Order for a Booking
// @route:    POST /api/bookings/:id/create-razorpay-order
// @access:   Private (Booking Owner)
// =========================================================================
export const createRazorpayOrder = asyncHandler(async (req, res) => {
    const { id } = req.params

    const booking = await Booking.findById(id).populate('event', 'title')
    if (!booking) {
        res.status(404)
        throw new Error('Booking not found')
    }

    // Ownership Guard
    if (booking.user.toString() !== req.user._id.toString()) {
        res.status(403)
        throw new Error('Not authorized to pay for this booking')
    }

    if (booking.paymentStatus === 'paid') {
        res.status(400)
        throw new Error('This booking is already paid')
    }

    const instance = getRazorpayInstance()

    // Razorpay accepts amounts in paise (₹1 = 100 paise)
    const options = {
        amount: Math.round(booking.totalAmount * 100),
        currency: 'INR',
        receipt: `rcpt_${booking._id.toString().slice(-8)}`, // Max 40 chars
        notes: {
            bookingId: booking._id.toString(),
            eventTitle: booking.event?.title || 'Event Ticket',
        },
    }

    const order = await instance.orders.create(options)

    // Save order ID on paymentDetails for reconciliation tracking
    booking.paymentDetails = {
        mode: 'card', // updated dynamically on confirmation
        trxnId: order.id,
    }
    await booking.save()

    res.status(200).json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID, // Send public key to browser
        booking,
    })
})

// =========================================================================
// @desc :    Verify Razorpay Payment Signature & Confirm Booking
// @route:    POST /api/bookings/:id/verify-razorpay-payment
// @access:   Private (Booking Owner)
// =========================================================================
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        res.status(400)
        throw new Error('Incomplete payment response from gateway')
    }

    const booking = await Booking.findById(id).populate('event', 'title')
    if (!booking) {
        res.status(404)
        throw new Error('Booking not found')
    }

    // ---------------------------------------------------------------------
    // The Cryptographic Handshake:
    // Generate HMAC-SHA256 digest of `${order_id}|${payment_id}`
    // using your private RAZORPAY_KEY_SECRET.
    // ---------------------------------------------------------------------
    const body = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex')

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
        res.status(400)
        throw new Error('Payment verification failed: Signature mismatch.')
    }

    // Mathematical match confirmed -> Transition state to Confirmed & Paid
    booking.paymentStatus = 'paid'
    booking.bookingStatus = 'confirmed'
    booking.paymentDetails = {
        mode: 'upi', // Captured via gateway
        trxnId: razorpay_payment_id,
    }

    // Issue anti-passback token if not already generated
    if (!booking.entryPassToken) {
        booking.entryPassToken = crypto.randomBytes(32).toString('hex')
    }

    const updatedBooking = await booking.save()

    res.status(200).json({
        success: true,
        message: 'Payment confirmed successfully. Your digital pass is active!',
        data: updatedBooking,
    })
})
