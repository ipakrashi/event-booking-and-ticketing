// backend/util/settlementService.js

import mongoose from 'mongoose'
import Booking from '../model/booking.js'
import Event from '../model/event.js'

/**
 * Computes all financial inflow, deductions, platform commission, and GST.
 * Shared by both the preview controller and the persistent ledger generator.
 */
export const computeEventSettlement = async (eventId) => {
    // 1. Fetch event rate snapshots
    const event = await Event.findById(eventId).select(
        'title status organizerId commissionRate platformGSTRate ticketGSTRate',
    )

    if (!event) {
        const error = new Error('Event not found')
        error.statusCode = 404
        throw error
    }

    // 2. Run single-pass $facet aggregation across Bookings
    const stats = await Booking.aggregate([
        { $match: { event: new mongoose.Types.ObjectId(eventId) } },
        {
            $facet: {
                paidBookings: [
                    { $match: { paymentStatus: 'paid' } },
                    {
                        $group: {
                            _id: null,
                            grossRevenue: { $sum: '$totalAmount' },
                            ticketsSold: { $sum: '$bookedQty' },
                        },
                    },
                ],
                refundedBookings: [
                    {
                        $match: {
                            bookingStatus: {
                                $in: [
                                    'cancelled',
                                    'full_refund_issued',
                                    'partial_refund_issued',
                                ],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            totalRefunds: { $sum: '$refundAmount' },
                            refundedQty: { $sum: '$cancelledQty' },
                        },
                    },
                ],
                pendingBookings: [
                    {
                        $match: {
                            paymentStatus: {
                                $in: ['not_paid', 'pending_verification'],
                            },
                            bookingStatus: { $ne: 'cancelled' },
                        },
                    },
                    {
                        $group: {
                            _id: null,
                            amountOnHold: { $sum: '$totalAmount' },
                            pendingQty: { $sum: '$bookedQty' },
                        },
                    },
                ],
            },
        },
    ])

    // 3. Extract and sanitize values (protecting against empty arrays)
    const facetData = stats[0]

    const grossRevenue = facetData?.paidBookings[0]?.grossRevenue || 0
    const ticketsSold = facetData?.paidBookings[0]?.ticketsSold || 0

    const refundDeductions = facetData?.refundedBookings[0]?.totalRefunds || 0
    const refundedQty = facetData?.refundedBookings[0]?.refundedQty || 0

    const amountOnHold = facetData?.pendingBookings[0]?.amountOnHold || 0
    const pendingQty = facetData?.pendingBookings[0]?.pendingQty || 0

    // 4. Mathematical derivations
    const netEventRevenue = Math.max(0, grossRevenue - refundDeductions)

    const commissionRate = event.commissionRate ?? 10
    const platformGSTRate = event.platformGSTRate ?? 18

    // Base facilitation cut
    const rawPlatformCommissionBase = (netEventRevenue * commissionRate) / 100
    const platformCommissionBase =
        Math.round((rawPlatformCommissionBase + Number.EPSILON) * 100) / 100

    // 18% GST levied by platform on its own facilitation fee (Organizer's ITC)
    const rawPlatformGSTOutput =
        (platformCommissionBase * platformGSTRate) / 100
    const platformGSTOutput =
        Math.round((rawPlatformGSTOutput + Number.EPSILON) * 100) / 100

    // Total platform deduction from ticket pool
    const totalPlatformDeduction =
        Math.round(
            (platformCommissionBase + platformGSTOutput + Number.EPSILON) * 100,
        ) / 100

    // Net payable to organizer
    const amountPayable = Math.max(
        0,
        Math.round(
            (netEventRevenue - totalPlatformDeduction + Number.EPSILON) * 100,
        ) / 100,
    )

    return {
        event,
        settlement: {
            grossRevenue,
            ticketsSold,
            refundDeductions,
            refundedQty,
            amountOnHold,
            pendingQty,
            netEventRevenue,
            commissionRateSnapshot: commissionRate,
            platformGSTRateSnapshot: platformGSTRate,
            platformCommissionBase,
            platformGSTOutput,
            totalPlatformDeduction,
            amountPayable,
        },
    }
}
