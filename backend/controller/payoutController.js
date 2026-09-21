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
        { returnDocument: 'after', upsert: true, runValidators: true },
    )

    res.status(200).json({
        success: true,
        message: 'Payout ledger recorded successfully',
        data: payoutRecord,
    })
})
// ==================================
//  @desc :     Disburse Payout Installment
//  @route:     POST /api/payouts/:payoutId/disburse
//  @access:    Private (Admin Only)
// ==================================
export const recordPayoutDisbursement = asyncHandler(async (req, res) => {
    const { payoutId } = req.params
    const { amount, mode, trxnId, notes } = req.body

    // 1. Validate ID format
    if (!mongoose.Types.ObjectId.isValid(payoutId)) {
        res.status(400)
        throw new Error('Invalid Payout ID format')
    }

    // 2. Validate input fields
    const disbursementAmount = Number(amount)
    if (!disbursementAmount || disbursementAmount <= 0) {
        res.status(400)
        throw new Error('Disbursement amount must be a positive number')
    }

    if (!mode || !trxnId) {
        res.status(400)
        throw new Error(
            'Please provide disbursement mode and transaction reference (trxnId)',
        )
    }

    // 3. Fetch target Payout ledger
    const payout = await Payout.findById(payoutId)
    if (!payout) {
        res.status(404)
        throw new Error('Payout ledger record not found')
    }

    // 4. State Barrier: Check if already settled
    if (payout.payoutStatus === 'settled' || payout.balanceDue <= 0) {
        res.status(400)
        throw new Error('This payout ledger is already fully settled')
    }

    // 5. Overpayment Barrier: Disbursed amount cannot exceed balance due
    if (disbursementAmount > payout.balanceDue) {
        res.status(400)
        throw new Error(
            `Disbursement amount (${disbursementAmount}) exceeds current balance due (${payout.balanceDue})`,
        )
    }

    // 6. Duplicate UTR check within this payout ledger
    const isDuplicateTrxn = payout.disbursements.some(
        (d) => d.trxnId.trim().toLowerCase() === trxnId.trim().toLowerCase(),
    )
    if (isDuplicateTrxn) {
        res.status(400)
        throw new Error(
            `Transaction ID '${trxnId}' has already been recorded for this payout`,
        )
    }

    // 7. Mutate Ledger & Calculate State
    const newAmountPaid =
        Math.round(
            (payout.amountPaid + disbursementAmount + Number.EPSILON) * 100,
        ) / 100
    const newBalanceDue = Math.max(
        0,
        Math.round(
            (payout.amountPayable - newAmountPaid + Number.EPSILON) * 100,
        ) / 100,
    )

    payout.amountPaid = newAmountPaid
    payout.balanceDue = newBalanceDue
    payout.payoutStatus = newBalanceDue === 0 ? 'settled' : 'partially_settled'

    // Append disbursement audit record
    payout.disbursements.push({
        amount: disbursementAmount,
        mode,
        trxnId: trxnId.trim(),
        processedBy: req.user._id,
        notes: notes?.trim() || null,
    })

    const savedPayout = await payout.save()

    res.status(200).json({
        success: true,
        message: `Disbursement of ₹${disbursementAmount} recorded successfully`,
        data: savedPayout,
    })
})
