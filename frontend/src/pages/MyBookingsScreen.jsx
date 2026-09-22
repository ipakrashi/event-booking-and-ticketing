// frontend/src/pages/MyBookingsScreen.jsx

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    useGetMyBookingsQuery,
    useRequestRefundMutation,
    useGetEntryPassQuery,
    useSubmitPaymentDetailsMutation,
} from '../redux/api/bookingsApiSlice'
import {
    Ticket,
    Calendar,
    MapPin,
    QrCode,
    AlertCircle,
    CheckCircle2,
    Clock,
    X,
    RotateCcw,
    Truck,
    Lock,
    Loader2,
    CreditCard,
    Ban,
} from 'lucide-react'

// QR Pass Modal Component
const QrModal = ({ bookingId, onClose }) => {
    const { data, isLoading, error } = useGetEntryPassQuery(bookingId)
    const pass = data?.data

    return (
        <div className='modal modal-open bg-black/70 backdrop-blur-sm z-50'>
            <div className='modal-box max-w-sm rounded-3xl bg-base-100 p-6 text-center space-y-4 border border-base-content/10 shadow-2xl'>
                <button
                    onClick={onClose}
                    className='btn btn-sm btn-circle btn-ghost absolute right-4 top-4'
                >
                    <X className='w-4 h-4' />
                </button>

                <h3 className='text-lg font-black text-base-content'>
                    Digital Entry Pass
                </h3>

                {isLoading ? (
                    <div className='py-12 flex flex-col items-center gap-3'>
                        <Loader2 className='w-8 h-8 text-primary animate-spin' />
                        <span className='text-xs opacity-60'>
                            Generating dynamic pass...
                        </span>
                    </div>
                ) : error ? (
                    <div className='alert alert-error text-xs rounded-2xl'>
                        <AlertCircle className='w-4 h-4 shrink-0' />
                        <span>
                            {error?.data?.message || 'Failed to generate pass'}
                        </span>
                    </div>
                ) : (
                    <div className='space-y-4'>
                        <div className='p-3 bg-white rounded-2xl inline-block shadow-inner border'>
                            <img
                                src={pass?.qrCode}
                                alt='Entry QR'
                                className='w-52 h-52 mx-auto object-contain'
                            />
                        </div>

                        <div className='text-left bg-base-200/60 p-3.5 rounded-2xl space-y-1 text-xs'>
                            <div className='font-bold text-sm truncate text-base-content'>
                                {pass?.event?.title}
                            </div>
                            <div className='opacity-70 flex items-center gap-1'>
                                <MapPin className='w-3 h-3 text-primary' />{' '}
                                {pass?.event?.venue} ({pass?.event?.city})
                            </div>
                            <div className='pt-1 border-t border-base-content/10 flex justify-between font-mono'>
                                <span>Tier: {pass?.attendee?.tierName}</span>
                                <span>Qty: {pass?.attendee?.bookedQty}</span>
                            </div>
                            <div className='text-[10px] text-primary font-mono truncate pt-1'>
                                Token: {pass?.entryPassToken?.slice(0, 16)}...
                            </div>
                        </div>

                        {pass?.isCheckedIn ? (
                            <div className='badge badge-warning gap-1 text-xs py-2'>
                                <Clock className='w-3 h-3' /> Already Admitted
                            </div>
                        ) : (
                            <p className='text-[11px] opacity-60'>
                                Present this pass at the gate for scanner
                                check-in
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

const MyBookingsScreen = () => {
    const { data, isLoading, error } = useGetMyBookingsQuery()
    const bookings = data?.data || []

    const [requestRefund, { isLoading: isRefunding }] =
        useRequestRefundMutation()
    const [submitPayment, { isLoading: isSubmittingPay }] =
        useSubmitPaymentDetailsMutation()

    // Modal UI states
    const [selectedBookingForQr, setSelectedBookingForQr] = useState(null)
    const [cancelModalBooking, setCancelModalBooking] = useState(null)
    const [cancellationReason, setCancellationReason] = useState('')

    // Payment proof modal states
    const [paymentModalBooking, setPaymentModalBooking] = useState(null)
    const [payMode, setPayMode] = useState('upi')
    const [payTrxnId, setPayTrxnId] = useState('')

    const handleCancelSubmit = async (e) => {
        e.preventDefault()
        if (!cancellationReason.trim())
            return alert('Please enter a cancellation reason')

        try {
            await requestRefund({
                id: cancelModalBooking._id,
                cancellationReason: cancellationReason.trim(),
            }).unwrap()
            setCancelModalBooking(null)
            setCancellationReason('')
        } catch (err) {
            alert(err?.data?.message || 'Failed to process cancellation')
        }
    }

    const handlePaymentSubmit = async (e) => {
        e.preventDefault()
        if (!payTrxnId.trim())
            return alert('Please enter transaction/reference ID')
        try {
            await submitPayment({
                id: paymentModalBooking._id,
                mode: payMode,
                trxnId: payTrxnId.trim(),
            }).unwrap()
            setPaymentModalBooking(null)
            setPayTrxnId('')
        } catch (err) {
            alert(err?.data?.message || 'Failed to submit payment details')
        }
    }

    if (isLoading) {
        return (
            <div className='min-h-[60vh] flex flex-col items-center justify-center gap-3'>
                <Loader2 className='w-8 h-8 text-primary animate-spin' />
                <p className='text-sm opacity-60'>
                    Loading your tickets & bookings...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className='max-w-4xl mx-auto px-4 py-12 text-center'>
                <div className='alert alert-error max-w-md mx-auto rounded-2xl'>
                    <AlertCircle className='w-5 h-5' />
                    <span>Failed to load bookings. Please try again.</span>
                </div>
            </div>
        )
    }

    return (
        <div className='max-w-6xl mx-auto px-4 py-8 space-y-6'>
            <div>
                <h1 className='text-2xl sm:text-3xl font-black text-base-content flex items-center gap-2'>
                    <Ticket className='w-7 h-7 text-primary' /> My Tickets &
                    Bookings
                </h1>
                <p className='text-xs sm:text-sm text-base-content/70 mt-1'>
                    View reservation status, settlement progress, courier
                    dispatch, and gate entry passes
                </p>
            </div>

            {bookings.length === 0 ? (
                <div className='bg-base-100 rounded-3xl p-10 text-center border border-base-content/10 space-y-4 max-w-md mx-auto'>
                    <div className='w-14 h-14 bg-base-200 rounded-2xl flex items-center justify-center mx-auto text-base-content/40'>
                        <Ticket className='w-7 h-7' />
                    </div>
                    <h3 className='font-bold text-lg'>No Bookings Found</h3>
                    <p className='text-xs opacity-60'>
                        You haven't reserved any tickets yet. Explore upcoming
                        concerts and workshops!
                    </p>
                    <Link
                        to='/events'
                        className='btn btn-primary btn-sm rounded-xl px-5'
                    >
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {bookings.map((b) => {
                        const now = new Date()
                        const eventStart = b.event?.startDate
                            ? new Date(b.event.startDate)
                            : null
                        const isEventStartedOrPast = eventStart
                            ? now >= eventStart
                            : false
                        const isEventStatusLocked = [
                            'completed',
                            'cancelled',
                        ].includes(b.event?.status)
                        const isTerminalBooking = [
                            'cancelled',
                            'refund_requested',
                            'refund_issued',
                            'rejected',
                        ].includes(b.bookingStatus)

                        // Digital Entry Pass: accessible when paid, confirmed, and dispatched or received
                        const isPassAccessible =
                            b.paymentStatus === 'paid' &&
                            b.bookingStatus === 'confirmed' &&
                            (b.despatchStatus === 'dispatched' ||
                                b.despatchStatus === 'received')

                        // Paid Refund Eligibility: Paid, confirmed, not dispatched, event not started/locked, not in terminal state
                        const canRequestRefund =
                            b.paymentStatus === 'paid' &&
                            b.bookingStatus === 'confirmed' &&
                            b.despatchStatus === 'not_dispatched' &&
                            !isEventStartedOrPast &&
                            !isEventStatusLocked &&
                            !isTerminalBooking

                        // Unpaid Cancellation Eligibility: Reservation can be released immediately if event hasn't started
                        const canCancelUnpaid =
                            b.paymentStatus === 'not_paid' &&
                            !isTerminalBooking &&
                            !isEventStartedOrPast &&
                            !isEventStatusLocked

                        return (
                            <div
                                key={b._id}
                                className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-5 space-y-4 hover:border-base-content/20 transition-all'
                            >
                                <div className='flex items-start justify-between gap-3'>
                                    <div>
                                        <h3 className='font-bold text-base text-base-content line-clamp-1'>
                                            {b.event?.title || 'Event Booking'}
                                        </h3>
                                        <div className='text-xs text-base-content/60 flex items-center gap-1 mt-0.5'>
                                            <MapPin className='w-3.5 h-3.5 text-primary shrink-0' />
                                            <span>
                                                {b.event?.venueId?.name} (
                                                {b.event?.venueId?.city})
                                            </span>
                                        </div>
                                        {eventStart && (
                                            <div className='text-[11px] text-base-content/50 flex items-center gap-1 mt-0.5 font-mono'>
                                                <Calendar className='w-3 h-3' />
                                                <span>
                                                    {eventStart.toLocaleDateString(
                                                        'en-IN',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        },
                                                    )}{' '}
                                                    •{' '}
                                                    {eventStart.toLocaleTimeString(
                                                        'en-IN',
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <span className='font-mono font-black text-primary text-sm'>
                                        ₹
                                        {b.totalAmount?.toLocaleString('en-IN')}
                                    </span>
                                </div>

                                <div className='grid grid-cols-3 gap-2 bg-base-200/50 p-3 rounded-2xl text-center text-xs'>
                                    <div>
                                        <span className='text-[10px] uppercase font-bold opacity-50 block'>
                                            Tier
                                        </span>
                                        <span className='font-bold truncate block'>
                                            {b.tierName}
                                        </span>
                                    </div>
                                    <div>
                                        <span className='text-[10px] uppercase font-bold opacity-50 block'>
                                            Qty
                                        </span>
                                        <span className='font-bold block'>
                                            {b.bookedQty}
                                        </span>
                                    </div>
                                    <div>
                                        <span className='text-[10px] uppercase font-bold opacity-50 block'>
                                            Payment
                                        </span>
                                        <span
                                            className={`badge badge-xs font-bold uppercase text-[9px] ${
                                                b.paymentStatus === 'paid'
                                                    ? 'badge-success'
                                                    : b.paymentStatus ===
                                                        'pending_verification'
                                                      ? 'badge-info'
                                                      : b.paymentStatus ===
                                                          'not_paid'
                                                        ? 'badge-warning text-warning-content'
                                                        : 'badge-error'
                                            }`}
                                        >
                                            {b.paymentStatus?.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                {/* Status Indicators */}
                                <div className='space-y-1.5 text-xs'>
                                    <div className='flex items-center justify-between text-[11px] opacity-70'>
                                        <span>Booking State:</span>
                                        <span className='font-bold uppercase tracking-wider'>
                                            {b.bookingStatus?.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className='flex items-center justify-between text-[11px] opacity-70'>
                                        <span>Dispatch State:</span>
                                        <span className='font-bold capitalize flex items-center gap-1'>
                                            <Truck className='w-3 h-3' />{' '}
                                            {b.despatchStatus?.replace(
                                                '_',
                                                ' ',
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className='pt-2 border-t border-base-content/10 flex flex-wrap items-center justify-between gap-2'>
                                    {/* Unpaid Booking: Enter Offline Payment Proof */}
                                    {b.paymentStatus === 'not_paid' &&
                                        !isTerminalBooking && (
                                            <button
                                                onClick={() =>
                                                    setPaymentModalBooking(b)
                                                }
                                                className='btn btn-sm btn-primary rounded-xl font-bold gap-1.5 flex-1'
                                            >
                                                <CreditCard className='w-4 h-4' />{' '}
                                                Submit Payment Proof
                                            </button>
                                        )}

                                    {/* Awaiting Admin Approval */}
                                    {b.paymentStatus ===
                                        'pending_verification' && (
                                        <div className='flex items-center gap-1.5 text-[11px] text-info bg-info/10 px-3 py-2 rounded-xl flex-1'>
                                            <Clock className='w-3.5 h-3.5 shrink-0' />
                                            <span>
                                                Verification in progress (Ref:{' '}
                                                {b.paymentDetails?.trxnId})
                                            </span>
                                        </div>
                                    )}

                                    {/* Paid: Entry Pass Accessible vs Locked pending dispatch */}
                                    {b.paymentStatus === 'paid' &&
                                        (isPassAccessible ? (
                                            <button
                                                onClick={() =>
                                                    setSelectedBookingForQr(
                                                        b._id,
                                                    )
                                                }
                                                className='btn btn-sm btn-primary rounded-xl font-bold gap-1.5 flex-1'
                                            >
                                                <QrCode className='w-4 h-4' />{' '}
                                                View QR Pass
                                            </button>
                                        ) : (
                                            <div className='flex items-center gap-1.5 text-[11px] text-base-content/60 bg-base-200 px-3 py-2 rounded-xl flex-1'>
                                                <Lock className='w-3.5 h-3.5 shrink-0' />
                                                <span>
                                                    Pass unlocks once tickets
                                                    are dispatched
                                                </span>
                                            </div>
                                        ))}

                                    {/* Cancellation Actions */}
                                    {canRequestRefund && (
                                        <button
                                            onClick={() =>
                                                setCancelModalBooking(b)
                                            }
                                            className='btn btn-sm btn-ghost text-error hover:bg-error/10 rounded-xl gap-1'
                                        >
                                            <RotateCcw className='w-3.5 h-3.5' />{' '}
                                            Request Refund
                                        </button>
                                    )}

                                    {canCancelUnpaid && (
                                        <button
                                            onClick={() =>
                                                setCancelModalBooking(b)
                                            }
                                            className='btn btn-sm btn-ghost text-error/80 hover:bg-error/10 rounded-xl gap-1 text-xs'
                                        >
                                            <Ban className='w-3.5 h-3.5' />{' '}
                                            Cancel Reservation
                                        </button>
                                    )}

                                    {/* Window Closed Indicator */}
                                    {(isEventStartedOrPast ||
                                        isEventStatusLocked) &&
                                        !isTerminalBooking && (
                                            <div className='text-[10px] text-base-content/50 bg-base-200/60 px-2.5 py-1.5 rounded-lg italic'>
                                                Cancellation window closed
                                                (Event{' '}
                                                {isEventStatusLocked
                                                    ? b.event?.status
                                                    : 'started'}
                                                )
                                            </div>
                                        )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* View QR Code Modal */}
            {selectedBookingForQr && (
                <QrModal
                    bookingId={selectedBookingForQr}
                    onClose={() => setSelectedBookingForQr(null)}
                />
            )}

            {/* Attendee Offline Payment Submission Modal */}
            {paymentModalBooking && (
                <div className='modal modal-open bg-black/60 backdrop-blur-sm z-50'>
                    <div className='modal-box rounded-3xl max-w-sm p-6 space-y-4'>
                        <h3 className='font-bold text-base text-base-content'>
                            Submit Payment Proof
                        </h3>
                        <p className='text-xs opacity-70'>
                            Event:{' '}
                            <span className='font-bold'>
                                {paymentModalBooking.event?.title}
                            </span>
                            <br />
                            Total Amount:{' '}
                            <span className='font-bold text-primary font-mono'>
                                ₹
                                {paymentModalBooking.totalAmount?.toLocaleString(
                                    'en-IN',
                                )}
                            </span>
                        </p>

                        <form
                            onSubmit={handlePaymentSubmit}
                            className='space-y-3 pt-1'
                        >
                            <div>
                                <label className='text-[11px] font-bold block mb-1'>
                                    Payment Method
                                </label>
                                <select
                                    value={payMode}
                                    onChange={(e) => setPayMode(e.target.value)}
                                    className='select select-sm select-bordered w-full rounded-xl text-xs'
                                >
                                    <option value='upi'>
                                        UPI (GPay / PhonePe / Paytm / BHIM)
                                    </option>
                                    <option value='bank_transfer'>
                                        Bank Transfer (IMPS / NEFT / RTGS)
                                    </option>
                                    <option value='cash'>
                                        Direct Cash at Venue Counter
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className='text-[11px] font-bold block mb-1'>
                                    Transaction / UTR Reference ID
                                </label>
                                <input
                                    type='text'
                                    required
                                    placeholder='e.g. 428901849204 or UTR number'
                                    value={payTrxnId}
                                    onChange={(e) =>
                                        setPayTrxnId(e.target.value)
                                    }
                                    className='input input-sm input-bordered w-full rounded-xl font-mono text-xs'
                                />
                            </div>

                            <div className='modal-action pt-2'>
                                <button
                                    type='button'
                                    onClick={() => setPaymentModalBooking(null)}
                                    className='btn btn-sm btn-ghost rounded-xl'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    disabled={isSubmittingPay}
                                    className='btn btn-sm btn-primary rounded-xl font-bold gap-1'
                                >
                                    {isSubmittingPay ? (
                                        <>
                                            <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Details'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Dynamic Cancellation / Refund Modal */}
            {cancelModalBooking && (
                <div className='modal modal-open bg-black/60 z-50'>
                    <div className='modal-box rounded-3xl max-w-sm p-6 space-y-4'>
                        <h3 className='font-bold text-base text-base-content'>
                            {cancelModalBooking.paymentStatus === 'paid'
                                ? 'Request Cancellation & Refund'
                                : 'Cancel Unpaid Reservation'}
                        </h3>
                        <p className='text-xs opacity-70 leading-relaxed'>
                            {cancelModalBooking.paymentStatus === 'paid'
                                ? `Your refund request for ₹${cancelModalBooking.totalAmount?.toLocaleString('en-IN')} will be reviewed by the event organizer.`
                                : `This will immediately release your ${cancelModalBooking.bookedQty} seat(s) back to the available inventory.`}
                        </p>

                        <form
                            onSubmit={handleCancelSubmit}
                            className='space-y-3'
                        >
                            <textarea
                                required
                                value={cancellationReason}
                                onChange={(e) =>
                                    setCancellationReason(e.target.value)
                                }
                                placeholder={
                                    cancelModalBooking.paymentStatus === 'paid'
                                        ? 'State reason for refund request...'
                                        : 'State reason for releasing reservation...'
                                }
                                className='textarea textarea-bordered w-full text-xs rounded-xl h-24'
                            />
                            <div className='modal-action pt-2'>
                                <button
                                    type='button'
                                    onClick={() => {
                                        setCancelModalBooking(null)
                                        setCancellationReason('')
                                    }}
                                    className='btn btn-sm btn-ghost rounded-xl'
                                >
                                    Dismiss
                                </button>
                                <button
                                    type='submit'
                                    disabled={isRefunding}
                                    className='btn btn-sm btn-error text-white rounded-xl'
                                >
                                    {isRefunding ? (
                                        <>
                                            <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                            Processing...
                                        </>
                                    ) : cancelModalBooking.paymentStatus ===
                                      'paid' ? (
                                        'Submit Refund Request'
                                    ) : (
                                        'Confirm Cancellation'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MyBookingsScreen
