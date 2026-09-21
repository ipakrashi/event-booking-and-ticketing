// backend/controller/payoutController.js
import asyncHandler from 'express-async-handler'
import mongoose from 'mongoose'
import Payout from '../model/payout.js'
import { computeEventSettlement } from '../util/settlementService.js'

// ==================================
//  @desc :     Generate or Refresh Payout Ledger
//  @route:     POST /api/payouts/event/:eventId/generate
//  @access:    Private (Admin Only)
// ==================================
export const generateEventPayout = asyncHandler(async (req, res) => {
    const { eventId } = req.params

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        res.status(400)
        throw new Error('Invalid Event ID format')
    }

    const { event, settlement } = await computeEventSettlement(eventId)

    // Lifecycle Guard: Event must be completed
    if (event.status !== 'completed') {
        res.status(400)
        throw new Error(
            `Cannot generate final payout ledger for an event with status '${event.status}'. Event must be 'completed'.`,
        )
    }

    // Atomic Upsert into Payout collection
    const payoutRecord = await Payout.findOneAndUpdate(
        { event: eventId },
        {
            $set: {
                organizer: event.organizerId,
                commissionRateSnapshot: settlement.commissionRateSnapshot,
                platformGSTRateSnapshot: settlement.platformGSTRateSnapshot,
                grossRevenue: settlement.grossRevenue,
                refundDeductions: settlement.refundDeductions,
                amountOnHold: settlement.amountOnHold,
                netEventRevenue: settlement.netEventRevenue,
                platformCommissionBase: settlement.platformCommissionBase,
                platformGSTOutput: settlement.platformGSTOutput,
                totalPlatformDeduction: settlement.totalPlatformDeduction,
                amountPayable: settlement.amountPayable,
            },
            $setOnInsert: {
                amountPaid: 0,
                balanceDue: settlement.amountPayable,
                payoutStatus: 'pending',
                disbursements: [],
            },
        },
        { new: true, upsert: true, runValidators: true },
    )

    res.status(200).json({
        success: true,
        message: 'Payout ledger recorded successfully',
        data: payoutRecord,
    })
})
