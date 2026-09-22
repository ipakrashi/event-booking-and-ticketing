// frontend/src/pages/EventDetails.jsx

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
    useGetEventByIdQuery,
    useGetEventReviewsQuery,
    useCreateEventReviewMutation,
    useGetMyReviewStatusQuery,
} from '../redux/api/eventsApiSlice'
import { useCreateBookingMutation } from '../redux/api/bookingsApiSlice'

import {
    MapPin,
    Calendar,
    Clock,
    Ticket,
    ShieldCheck,
    Building2,
    Users,
    Plus,
    Minus,
    Loader2,
    ArrowLeft,
    Tv,
    Star,
    MessageSquare,
    Send,
    AlertCircle,
    CheckCircle2,
    QrCode,
} from 'lucide-react'

const EventDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { userInfo } = useSelector((state) => state.auth)

    const { data: responseData, isLoading, isError } = useGetEventByIdQuery(id)
    const event = responseData?.data

    // Reviews Hooks
    const { data: reviewsData, isLoading: loadingReviews } =
        useGetEventReviewsQuery(id)
    const reviews = reviewsData?.data || []

    const [createReview, { isLoading: submittingReview }] =
        useCreateEventReviewMutation()
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [reviewError, setReviewError] = useState(null)
    const [reviewSuccess, setReviewSuccess] = useState(false)

    // Booking State & Mutations
    const [createBooking, { isLoading: isBooking }] = useCreateBookingMutation()
    const [selectedQuantities, setSelectedQuantities] = useState({})
    const [bookingError, setBookingError] = useState(null)
    const [bookingSuccessModal, setBookingSuccessModal] = useState(false)
    const [confirmedBookingData, setConfirmedBookingData] = useState(null)

    const handleQuantityChange = (tierId, delta, maxAvailable) => {
        setSelectedQuantities((prev) => {
            const current = prev[tierId] || 0
            const next = Math.max(0, Math.min(maxAvailable, current + delta))
            return { ...prev, [tierId]: next }
        })
    }
    const { data: myReviewStatusData, isLoading: loadingReviewStatus } =
        useGetMyReviewStatusQuery(id, { skip: !userInfo })
    const myReviewStatus = myReviewStatusData || {}

    const handleReviewSubmit = async (e) => {
        e.preventDefault()
        setReviewError(null)
        setReviewSuccess(false)

        if (!comment.trim() || comment.trim().length < 5) {
            setReviewError('Review comment must be at least 5 characters long.')
            return
        }

        try {
            await createReview({
                eventId: id,
                rating: Number(rating),
                comment: comment.trim(),
            }).unwrap()

            setReviewSuccess(true)
            setComment('')
            setRating(5)
        } catch (err) {
            setReviewError(
                err?.data?.message ||
                    err?.error ||
                    'Failed to submit review. Please try again.',
            )
        }
    }

    if (isLoading) {
        return (
            <div className='min-h-[70vh] flex flex-col items-center justify-center gap-3 text-base-content/50'>
                <Loader2 className='w-8 h-8 animate-spin text-primary' />
                <p className='text-sm font-medium'>Loading event details...</p>
            </div>
        )
    }

    if (isError || !event) {
        return (
            <div className='max-w-4xl mx-auto px-6 py-16 text-center space-y-4'>
                <Ticket className='w-12 h-12 mx-auto text-base-content/40' />
                <h2 className='text-2xl font-black text-base-content'>
                    Event Not Found
                </h2>
                <p className='text-sm text-base-content/70'>
                    The requested event could not be retrieved or is not
                    currently published.
                </p>
                <Link
                    to='/events'
                    className='btn btn-primary font-bold rounded-xl inline-flex items-center gap-2'
                >
                    <ArrowLeft className='w-4 h-4' /> Back to Catalog
                </Link>
            </div>
        )
    }

    const tiers = event.ticketTiers || []
    let totalTicketCount = 0
    let subtotal = 0

    tiers.forEach((tier) => {
        const qty = selectedQuantities[tier._id] || 0
        totalTicketCount += qty
        subtotal += qty * tier.price
    })

    const ticketGSTRate = event.ticketGSTRate || 18
    const estimatedTax = Math.round(subtotal * (ticketGSTRate / 100))
    const grandTotal = subtotal + estimatedTax

    const handleProceedToCheckout = async () => {
        setBookingError(null)

        if (!userInfo) {
            navigate('/login')
            return
        }

        const selectedTiersPayload = Object.entries(selectedQuantities)
            .filter(([_, qty]) => qty > 0)
            .map(([tierId, quantity]) => {
                const tier = tiers.find((t) => t._id === tierId)
                return {
                    tierId,
                    name: tier.name,
                    unitPrice: tier.price,
                    quantity,
                    total: tier.price * quantity,
                }
            })

        if (selectedTiersPayload.length === 0) {
            setBookingError('Please select at least one ticket tier.')
            return
        }

        try {
            const res = await createBooking({
                eventId: event._id,
                selectedTiers: selectedTiersPayload,
                paymentMode: 'upi',
            }).unwrap()

            // Normalize response: handle both single object and array of bookings
            const rawData = res.data
            const bookingList = Array.isArray(rawData) ? rawData : [rawData]

            const summaryData = {
                bookings: bookingList,
                tierSummary: bookingList
                    .map((b) => `${b.tierName} × ${b.bookedQty}`)
                    .join(', '),
                totalAmount: bookingList.reduce(
                    (sum, b) => sum + (b.totalAmount || 0),
                    0,
                ),
                bookingStatus: bookingList[0]?.bookingStatus || 'request_sent',
                paymentStatus: bookingList[0]?.paymentStatus || 'not_paid',
            }

            setConfirmedBookingData(summaryData)
            setBookingSuccessModal(true)
            setSelectedQuantities({})
        } catch (err) {
            setBookingError(
                err?.data?.message ||
                    err?.error ||
                    'Unable to complete booking reservation. Please try again.',
            )
        }
    }

    return (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12'>
            {/* Top Breadcrumb Link */}
            <Link
                to='/events'
                className='inline-flex items-center gap-1.5 text-xs font-semibold text-base-content/60 hover:text-base-content transition-colors'
            >
                <ArrowLeft className='w-3.5 h-3.5' /> Back to Events
            </Link>
            {/* ================= HERO HEADER & POSTER ================= */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
                {/* Left: Poster Image */}
                <div className='lg:col-span-5 rounded-3xl overflow-hidden border border-base-content/10 bg-base-100 shadow-2xl'>
                    <div className='relative aspect-[4/3] sm:aspect-square bg-base-300'>
                        <img
                            src={
                                event.posterImage?.url ||
                                '/placeholder-event.png'
                            }
                            alt={event.title}
                            className='w-full h-full object-cover'
                        />
                        <span className='badge badge-sm font-bold absolute top-4 right-4 uppercase bg-primary text-primary-content border-0 shadow'>
                            {event.status}
                        </span>
                    </div>
                </div>

                {/* Right: Event Info */}
                <div className='lg:col-span-7 space-y-6'>
                    <div className='space-y-3'>
                        <div className='flex flex-wrap items-center gap-3'>
                            <span className='text-xs font-bold text-primary uppercase tracking-widest'>
                                {event.categoryId?.eventCategory ||
                                    'Live Event'}
                            </span>

                            <div className='flex items-center gap-1.5 px-3 py-1 rounded-full bg-base-100 border border-base-content/10 text-xs'>
                                <Star className='w-3.5 h-3.5 text-amber-400 fill-amber-400' />
                                <span className='font-bold text-base-content'>
                                    {event.averageRating > 0
                                        ? event.averageRating.toFixed(1)
                                        : 'New'}
                                </span>
                                <span className='text-base-content/60 text-[11px]'>
                                    ({event.totalReviews || 0}{' '}
                                    {event.totalReviews === 1
                                        ? 'review'
                                        : 'reviews'}
                                    )
                                </span>
                            </div>
                        </div>

                        <h1 className='text-3xl sm:text-4xl md:text-5xl font-black text-base-content leading-tight'>
                            {event.title}
                        </h1>
                        <p className='text-base-content/70 text-sm sm:text-base leading-relaxed'>
                            {event.description}
                        </p>
                    </div>

                    {/* Venue Specs Box */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-base-100 border border-base-content/10 shadow-lg'>
                        <div className='space-y-1'>
                            <div className='flex items-center gap-2 text-primary text-xs font-bold uppercase'>
                                <MapPin className='w-4 h-4' /> Venue Location
                            </div>
                            <p className='text-sm font-bold text-base-content'>
                                {event.venueId?.name}
                            </p>
                            <p className='text-xs text-base-content/60'>
                                {event.venueId?.address}, {event.venueId?.city}
                            </p>
                        </div>

                        <div className='space-y-1'>
                            <div className='flex items-center gap-2 text-primary text-xs font-bold uppercase'>
                                <Calendar className='w-4 h-4' /> Date & Schedule
                            </div>
                            <p className='text-sm font-bold text-base-content'>
                                {new Date(event.startDate).toLocaleDateString(
                                    'en-IN',
                                    {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                    },
                                )}
                            </p>
                            <p className='text-xs text-base-content/60 flex items-center gap-1'>
                                <Clock className='w-3.5 h-3.5 opacity-60' />
                                {new Date(event.startDate).toLocaleTimeString(
                                    [],
                                    {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    },
                                )}
                            </p>
                        </div>

                        {event.selectedAuditorium && (
                            <div className='space-y-1 pt-3 border-t border-base-content/10 sm:border-t-0'>
                                <div className='flex items-center gap-2 text-primary text-xs font-bold uppercase'>
                                    <Building2 className='w-4 h-4' /> Auditorium
                                </div>
                                <p className='text-sm font-semibold text-base-content/80'>
                                    {event.selectedAuditorium.name}
                                </p>
                            </div>
                        )}

                        {event.selectedScreen && (
                            <div className='space-y-1 pt-3 border-t border-base-content/10 sm:border-t-0'>
                                <div className='flex items-center gap-2 text-primary text-xs font-bold uppercase'>
                                    <Tv className='w-4 h-4' /> Screen Capacity
                                </div>
                                <p className='text-sm font-semibold text-base-content/80 flex items-center gap-1'>
                                    <Users className='w-3.5 h-3.5 opacity-60' />{' '}
                                    Screen #{event.selectedScreen.screenNumber}{' '}
                                    ({event.selectedScreen.capacity} Seats)
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* ================= TICKET TIER SELECTOR & SUMMARY ================= */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6 border-t border-base-content/10'>
                {/* Tier Selection Cards (Left: 7 Cols) */}
                <div className='lg:col-span-7 space-y-4'>
                    <div className='flex items-center gap-2'>
                        <Ticket className='w-5 h-5 text-primary' />
                        <h2 className='text-2xl font-black text-base-content'>
                            Select Ticket Tiers
                        </h2>
                    </div>

                    <div className='space-y-3'>
                        {tiers.map((tier) => {
                            const available = Math.max(
                                0,
                                tier.totalQuantity - (tier.soldQuantity || 0),
                            )
                            const qty = selectedQuantities[tier._id] || 0
                            const isSoldOut = available === 0

                            return (
                                <div
                                    key={tier._id}
                                    className={`p-5 rounded-2xl border transition-all ${
                                        qty > 0
                                            ? 'bg-primary/10 border-primary shadow-sm'
                                            : 'bg-base-100 border-base-content/10'
                                    }`}
                                >
                                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                                        <div>
                                            <div className='flex items-center gap-2'>
                                                <h3 className='text-base font-bold text-base-content'>
                                                    {tier.name}
                                                </h3>
                                                {isSoldOut ? (
                                                    <span className='badge badge-error badge-sm uppercase font-bold text-[10px]'>
                                                        Sold Out
                                                    </span>
                                                ) : available <= 5 ? (
                                                    <span className='badge badge-warning badge-sm uppercase font-bold text-[10px]'>
                                                        Only {available} Left
                                                    </span>
                                                ) : null}
                                            </div>
                                            <p className='text-xs text-base-content/60 mt-1'>
                                                {available} of{' '}
                                                {tier.totalQuantity} seats
                                                available
                                            </p>
                                            <span className='text-lg font-black text-primary mt-2 block'>
                                                ₹
                                                {tier.price.toLocaleString(
                                                    'en-IN',
                                                )}
                                            </span>
                                        </div>

                                        {!isSoldOut && (
                                            <div className='flex items-center gap-3 self-end sm:self-center bg-base-200 border border-base-content/10 p-1 rounded-xl'>
                                                <button
                                                    onClick={() =>
                                                        handleQuantityChange(
                                                            tier._id,
                                                            -1,
                                                            available,
                                                        )
                                                    }
                                                    disabled={qty === 0}
                                                    className='btn btn-xs btn-ghost btn-square disabled:opacity-30'
                                                >
                                                    <Minus className='w-3.5 h-3.5' />
                                                </button>
                                                <span className='text-sm font-bold px-2 min-w-6 text-center font-mono'>
                                                    {qty}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleQuantityChange(
                                                            tier._id,
                                                            1,
                                                            available,
                                                        )
                                                    }
                                                    disabled={qty >= available}
                                                    className='btn btn-xs btn-ghost btn-square disabled:opacity-30'
                                                >
                                                    <Plus className='w-3.5 h-3.5' />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Order Summary Box (Right: 5 Cols) */}
                <div className='lg:col-span-5 bg-base-100 border border-base-content/10 rounded-3xl p-6 shadow-xl space-y-6 sticky top-24'>
                    <h3 className='text-lg font-bold text-base-content border-b border-base-content/10 pb-3'>
                        Booking Summary
                    </h3>

                    {bookingError && (
                        <div className='alert alert-error text-xs py-2.5 px-3 rounded-xl shadow-sm flex items-center gap-2'>
                            <AlertCircle className='w-4 h-4 shrink-0' />
                            <span>{bookingError}</span>
                        </div>
                    )}

                    {totalTicketCount === 0 ? (
                        <p className='text-xs text-base-content/50 py-4 text-center'>
                            Please select at least one ticket tier to continue.
                        </p>
                    ) : (
                        <div className='space-y-4'>
                            <div className='space-y-2'>
                                {tiers.map((tier) => {
                                    const qty =
                                        selectedQuantities[tier._id] || 0
                                    if (qty === 0) return null
                                    return (
                                        <div
                                            key={tier._id}
                                            className='flex items-center justify-between text-xs text-base-content/80'
                                        >
                                            <span>
                                                {tier.name} × {qty}
                                            </span>
                                            <span className='font-mono font-bold text-base-content'>
                                                ₹
                                                {(
                                                    qty * tier.price
                                                ).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className='border-t border-base-content/10 pt-3 space-y-2 text-xs text-base-content/60'>
                                <div className='flex justify-between'>
                                    <span>Subtotal</span>
                                    <span className='font-mono text-base-content font-bold'>
                                        ₹{subtotal.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span>Taxes & GST ({ticketGSTRate}%)</span>
                                    <span className='font-mono text-base-content font-bold'>
                                        ₹{estimatedTax.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            <div className='border-t border-base-content/10 pt-4 flex items-center justify-between'>
                                <div>
                                    <span className='text-xs text-base-content/60 uppercase block font-semibold'>
                                        Total Payable
                                    </span>
                                    <span className='text-2xl font-black text-base-content font-mono'>
                                        ₹{grandTotal.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <span className='badge badge-ghost text-[10px] text-base-content/60'>
                                    {totalTicketCount}{' '}
                                    {totalTicketCount === 1 ? 'Seat' : 'Seats'}
                                </span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleProceedToCheckout}
                        disabled={totalTicketCount === 0 || isBooking}
                        className='btn btn-primary w-full rounded-xl py-3 font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 disabled:opacity-40'
                    >
                        {isBooking ? (
                            <>
                                <Loader2 className='w-4 h-4 animate-spin' />
                                <span>Reserving Seats & Pass...</span>
                            </>
                        ) : userInfo ? (
                            'Proceed to Confirmation'
                        ) : (
                            'Sign In to Reserve'
                        )}
                    </button>

                    <div className='flex items-center justify-center gap-1.5 text-[11px] text-base-content/50'>
                        <ShieldCheck className='w-3.5 h-3.5 text-success' />
                        <span>Instant Anti-Passback QR Code Issuance</span>
                    </div>
                </div>
            </div>
            {/* ================= DYNAMIC SUCCESS & RESERVATION MODAL ================= */}
            {bookingSuccessModal && confirmedBookingData && (
                <div className='modal modal-open bg-black/70 backdrop-blur-sm z-50'>
                    <div className='modal-box max-w-md bg-base-100 border border-base-content/10 rounded-3xl p-6 text-center space-y-4 shadow-2xl'>
                        {/* Status Icon */}
                        <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-inner ${
                                confirmedBookingData.paymentStatus === 'paid'
                                    ? 'bg-success/20 text-success'
                                    : 'bg-amber-500/20 text-amber-500'
                            }`}
                        >
                            {confirmedBookingData.paymentStatus === 'paid' ? (
                                <CheckCircle2 className='w-8 h-8' />
                            ) : (
                                <Ticket className='w-8 h-8' />
                            )}
                        </div>

                        {/* Dynamic Title & Description */}
                        <div>
                            <h3 className='text-2xl font-black text-base-content'>
                                {confirmedBookingData.paymentStatus === 'paid'
                                    ? 'Booking Confirmed!'
                                    : 'Seats Reserved!'}
                            </h3>
                            <p className='text-xs text-base-content/70 mt-1 leading-relaxed'>
                                {confirmedBookingData.paymentStatus === 'paid'
                                    ? 'Your payment has been verified and anti-passback entry pass is ready.'
                                    : 'Your seats are locked. Please submit payment proof to generate your QR entry pass.'}
                            </p>
                        </div>

                        {/* Document Details */}
                        <div className='p-4 rounded-2xl bg-base-200 border border-base-content/10 text-left space-y-2 text-xs'>
                            <div className='flex justify-between items-center'>
                                <span className='text-base-content/60'>
                                    Event:
                                </span>
                                <span className='font-bold text-base-content truncate max-w-[200px]'>
                                    {event.title}
                                </span>
                            </div>

                            <div className='flex justify-between items-center'>
                                <span className='text-base-content/60'>
                                    Tier & Qty:
                                </span>
                                <span className='font-bold text-base-content'>
                                    {confirmedBookingData.tierSummary}
                                </span>
                            </div>

                            <div className='flex justify-between items-center'>
                                <span className='text-base-content/60'>
                                    Total Payable:
                                </span>
                                <span className='font-mono font-black text-primary text-sm'>
                                    ₹
                                    {confirmedBookingData.totalAmount?.toLocaleString(
                                        'en-IN',
                                    )}
                                </span>
                            </div>

                            <div className='flex justify-between items-center pt-1 border-t border-base-content/10'>
                                <span className='text-base-content/60'>
                                    Booking State:
                                </span>
                                <span className='badge badge-neutral badge-sm font-mono font-bold uppercase text-[10px] px-2.5 py-1'>
                                    {confirmedBookingData.bookingStatus?.replace(
                                        '_',
                                        ' ',
                                    )}
                                </span>
                            </div>

                            <div className='flex justify-between items-center'>
                                <span className='text-base-content/60'>
                                    Payment:
                                </span>
                                <span
                                    className={`badge badge-sm font-mono font-bold uppercase text-[10px] px-2.5 py-1 ${
                                        confirmedBookingData.paymentStatus ===
                                        'paid'
                                            ? 'badge-success'
                                            : 'badge-warning text-warning-content'
                                    }`}
                                >
                                    {confirmedBookingData.paymentStatus?.replace(
                                        '_',
                                        ' ',
                                    )}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className='pt-2 flex flex-col gap-2'>
                            <button
                                onClick={() => navigate('/my-bookings')}
                                className='btn btn-primary w-full rounded-xl font-bold gap-2 shadow-md shadow-primary/20'
                            >
                                {confirmedBookingData.paymentStatus ===
                                'paid' ? (
                                    <>
                                        <QrCode className='w-4 h-4' /> View My
                                        Entry Pass
                                    </>
                                ) : (
                                    <>
                                        <Ticket className='w-4 h-4' /> Submit
                                        Payment & View Bookings
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => {
                                    setBookingSuccessModal(false)
                                    setConfirmedBookingData(null)
                                }}
                                className='btn btn-ghost w-full rounded-xl text-xs text-base-content/60'
                            >
                                Close & Keep Browsing
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ================= REVIEWS SECTION ================= */}
            <div className='pt-8 border-t border-base-content/10 space-y-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                    <div>
                        <div className='flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1'>
                            <MessageSquare className='w-4 h-4' /> Social Proof
                        </div>
                        <h2 className='text-2xl sm:text-3xl font-black text-base-content'>
                            Verified Reviews
                        </h2>
                    </div>

                    <div className='flex items-center gap-2 text-sm text-base-content/70'>
                        <span className='font-bold text-base-content text-lg'>
                            {event.averageRating > 0
                                ? event.averageRating.toFixed(1)
                                : '—'}
                        </span>
                        <div className='flex items-center text-amber-400'>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                    key={s}
                                    className={`w-4 h-4 ${
                                        s <=
                                        Math.round(event.averageRating || 0)
                                            ? 'fill-amber-400'
                                            : 'text-base-content/20'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className='text-xs text-base-content/60'>
                            ({event.totalReviews || 0} total)
                        </span>
                    </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
                    {/* Review List */}
                    <div className='lg:col-span-7 space-y-4'>
                        {loadingReviews ? (
                            <div className='flex items-center justify-center py-10 text-base-content/50 gap-2'>
                                <Loader2 className='w-5 h-5 animate-spin text-primary' />
                                <span className='text-xs font-medium'>
                                    Loading attendee reviews...
                                </span>
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className='p-8 rounded-2xl bg-base-100 border border-base-content/10 text-center space-y-2'>
                                <MessageSquare className='w-8 h-8 text-base-content/40 mx-auto' />
                                <p className='text-sm font-semibold text-base-content'>
                                    No reviews yet.
                                </p>
                                <p className='text-xs text-base-content/60'>
                                    Be the first verified attendee to share
                                    feedback!
                                </p>
                            </div>
                        ) : (
                            reviews.map((rev) => (
                                <div
                                    key={rev._id}
                                    className='bg-base-100 border border-base-content/10 rounded-2xl p-5 space-y-3 shadow-md'
                                >
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-2'>
                                            <div className='w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs'>
                                                {rev.user?.userName
                                                    ?.charAt(0)
                                                    .toUpperCase() || 'A'}
                                            </div>
                                            <div>
                                                <span className='text-xs font-bold text-base-content block'>
                                                    {rev.user?.userName ||
                                                        'Verified Attendee'}
                                                </span>
                                                <span className='text-[10px] text-base-content/50'>
                                                    {new Date(
                                                        rev.createdAt,
                                                    ).toLocaleDateString(
                                                        'en-IN',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {rev.isVerifiedAttendee && (
                                            <span className='badge badge-xs bg-success/20 text-success border-success/30 font-semibold gap-1 py-2 px-2 text-[10px]'>
                                                <ShieldCheck className='w-3 h-3' />{' '}
                                                Verified Attendee
                                            </span>
                                        )}
                                    </div>

                                    <p className='text-xs text-base-content/80 leading-relaxed italic'>
                                        "{rev.comment}"
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Review Form Box */}
                    <div className='lg:col-span-5 bg-base-100 border border-base-content/10 rounded-3xl p-6 shadow-xl space-y-4'>
                        <div className='border-b border-base-content/10 pb-3'>
                            <h3 className='text-base font-bold text-base-content'>
                                Leave Verified Feedback
                            </h3>
                            <p className='text-xs text-base-content/60 mt-1'>
                                Reviews are restricted to verified attendees who
                                checked in at the event. Submissions are
                                published upon organizer approval.
                            </p>
                        </div>

                        {reviewSuccess && (
                            <div className='p-3 rounded-xl bg-success/10 border border-success/30 text-success text-xs flex items-center gap-2'>
                                <ShieldCheck className='w-4 h-4 shrink-0' />
                                <span>
                                    Your review was submitted and is pending
                                    organizer approval!
                                </span>
                            </div>
                        )}

                        {reviewError && (
                            <div className='p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-start gap-2'>
                                <AlertCircle className='w-4 h-4 shrink-0 mt-0.5' />
                                <span>{reviewError}</span>
                            </div>
                        )}

                        {userInfo ? (
                            myReviewStatus.hasReviewed ? (
                                <div className='p-6 text-center space-y-3 bg-base-200/50 rounded-2xl border border-base-content/10'>
                                    <CheckCircle2 className='w-8 h-8 text-success mx-auto' />
                                    <h4 className='font-bold text-sm text-base-content'>
                                        Feedback Recorded
                                    </h4>
                                    <p className='text-xs text-base-content/60'>
                                        You have already submitted a review for
                                        this event.
                                    </p>
                                    <span
                                        className={`badge badge-sm font-bold uppercase text-[10px] ${
                                            myReviewStatus.reviewStatus ===
                                            'approved'
                                                ? 'badge-success'
                                                : myReviewStatus.reviewStatus ===
                                                    'rejected'
                                                  ? 'badge-error'
                                                  : 'badge-warning text-warning-content'
                                        }`}
                                    >
                                        Status:{' '}
                                        {myReviewStatus.reviewStatus?.replace(
                                            '_',
                                            ' ',
                                        )}
                                    </span>
                                </div>
                            ) : !myReviewStatus.hasAttended ? (
                                <div className='p-6 text-center space-y-3 bg-base-200/50 rounded-2xl border border-base-content/10'>
                                    <Ticket className='w-8 h-8 text-base-content/40 mx-auto' />
                                    <h4 className='font-bold text-sm text-base-content'>
                                        Attendance Verification Required
                                    </h4>
                                    <p className='text-xs text-base-content/60 leading-relaxed'>
                                        Only attendees whose entry passes were
                                        scanned and admitted at the venue are
                                        eligible to leave reviews.
                                    </p>
                                    <button
                                        type='button'
                                        disabled
                                        className='btn btn-disabled w-full rounded-xl text-xs'
                                    >
                                        Review Locked
                                    </button>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleReviewSubmit}
                                    className='space-y-4'
                                >
                                    <div>
                                        <label className='text-xs font-semibold text-base-content/70 block mb-1'>
                                            Rating
                                        </label>
                                        <div className='flex items-center gap-2'>
                                            {[1, 2, 3, 4, 5].map((num) => (
                                                <button
                                                    key={num}
                                                    type='button'
                                                    onClick={() =>
                                                        setRating(num)
                                                    }
                                                    className='p-1 text-amber-400 hover:scale-110 transition-transform'
                                                >
                                                    <Star
                                                        className={`w-6 h-6 ${
                                                            num <= rating
                                                                ? 'fill-amber-400'
                                                                : 'text-base-content/20'
                                                        }`}
                                                    />
                                                </button>
                                            ))}
                                            <span className='text-xs font-mono font-bold text-base-content ml-2'>
                                                {rating} / 5 Stars
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className='text-xs font-semibold text-base-content/70 block mb-1'>
                                            Your Review
                                        </label>
                                        <textarea
                                            rows={4}
                                            value={comment}
                                            onChange={(e) =>
                                                setComment(e.target.value)
                                            }
                                            placeholder='Share your verified experience regarding acoustics, seating, or performance...'
                                            className='w-full rounded-xl bg-base-200 border border-base-content/10 p-3 text-xs text-base-content placeholder:text-base-content/40 focus:outline-none focus:border-primary transition-colors'
                                        />
                                    </div>

                                    <button
                                        type='submit'
                                        disabled={submittingReview}
                                        className='btn btn-primary w-full rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50'
                                    >
                                        {submittingReview ? (
                                            <>
                                                <Loader2 className='w-4 h-4 animate-spin' />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className='w-4 h-4' />{' '}
                                                Submit Review for Approval
                                            </>
                                        )}
                                    </button>
                                </form>
                            )
                        ) : (
                            <div className='py-6 text-center space-y-3'>
                                <p className='text-xs text-base-content/60'>
                                    You must be signed in with an attended
                                    booking to submit a review.
                                </p>
                                <Link
                                    to='/login'
                                    className='btn btn-sm btn-primary rounded-xl font-bold'
                                >
                                    Sign In to Review
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EventDetails
