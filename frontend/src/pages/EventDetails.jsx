// frontend/src/pages/EventDetails.jsx

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
    useGetEventByIdQuery,
    useGetEventReviewsQuery,
    useCreateEventReviewMutation,
} from '../redux/api/eventsApiSlice'
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
} from 'lucide-react'

const EventDetails = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const { userInfo } = useSelector((state) => state.auth)

    const { data: responseData, isLoading, isError } = useGetEventByIdQuery(id)
    const event = responseData?.data

    // Reviews Hook
    const { data: reviewsData, isLoading: loadingReviews } =
        useGetEventReviewsQuery(id)
    const reviews = reviewsData?.data || []

    // Review Form Mutation
    const [createReview, { isLoading: submittingReview }] =
        useCreateEventReviewMutation()
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [reviewError, setReviewError] = useState(null)
    const [reviewSuccess, setReviewSuccess] = useState(false)

    // Track tier quantities: { [tierId]: count }
    const [selectedQuantities, setSelectedQuantities] = useState({})

    const handleQuantityChange = (tierId, delta, maxAvailable) => {
        setSelectedQuantities((prev) => {
            const current = prev[tierId] || 0
            const next = Math.max(0, Math.min(maxAvailable, current + delta))
            return { ...prev, [tierId]: next }
        })
    }

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
            <div className='min-h-[70vh] flex flex-col items-center justify-center gap-3 text-gray-400'>
                <Loader2 className='w-8 h-8 animate-spin text-indigo-500' />
                <p className='text-sm font-medium'>Loading event details...</p>
            </div>
        )
    }

    if (isError || !event) {
        return (
            <div className='max-w-4xl mx-auto px-6 py-16 text-center space-y-4'>
                <Ticket className='w-12 h-12 mx-auto text-gray-500' />
                <h2 className='text-2xl font-black text-white'>
                    Event Not Found
                </h2>
                <p className='text-sm text-gray-400'>
                    The requested event could not be retrieved or is not
                    currently published.
                </p>
                <Link
                    to='/events'
                    className='btn bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl border-0 inline-flex items-center gap-2'
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

    const handleProceedToCheckout = () => {
        if (!userInfo) {
            navigate('/login')
            return
        }

        const payload = {
            eventId: event._id,
            selectedTiers: Object.entries(selectedQuantities)
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
                }),
            subtotal,
            estimatedTax,
            grandTotal,
        }

        console.log('Proceeding with reservation payload:', payload)
    }

    return (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12'>
            {/* Top Breadcrumb Link */}
            <Link
                to='/events'
                className='inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors'
            >
                <ArrowLeft className='w-3.5 h-3.5' /> Back to Events
            </Link>

            {/* ================= HERO HEADER & POSTER ================= */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
                {/* Left: Poster Image */}
                <div className='lg:col-span-5 rounded-3xl overflow-hidden border border-white/10 bg-[#161b22] shadow-2xl'>
                    <div className='relative aspect-[4/3] sm:aspect-square bg-slate-900'>
                        <img
                            src={
                                event.posterImage?.url ||
                                '/placeholder-event.png'
                            }
                            alt={event.title}
                            className='w-full h-full object-cover'
                        />
                        <span className='badge badge-sm font-bold absolute top-4 right-4 uppercase bg-indigo-600/90 text-white border-0 shadow'>
                            {event.status}
                        </span>
                    </div>
                </div>

                {/* Right: Event Info & Hierarchy */}
                <div className='lg:col-span-7 space-y-6'>
                    <div className='space-y-3'>
                        <div className='flex flex-wrap items-center gap-3'>
                            <span className='text-xs font-bold text-indigo-400 uppercase tracking-widest'>
                                {event.categoryId?.eventCategory ||
                                    'Live Event'}
                            </span>

                            {/* Aggregated Rating Badge */}
                            <div className='flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs'>
                                <Star className='w-3.5 h-3.5 text-amber-400 fill-amber-400' />
                                <span className='font-bold text-white'>
                                    {event.averageRating > 0
                                        ? event.averageRating.toFixed(1)
                                        : 'New'}
                                </span>
                                <span className='text-gray-400 text-[11px]'>
                                    ({event.totalReviews || 0}{' '}
                                    {event.totalReviews === 1
                                        ? 'review'
                                        : 'reviews'}
                                    )
                                </span>
                            </div>
                        </div>

                        <h1 className='text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight'>
                            {event.title}
                        </h1>
                        <p className='text-gray-300 text-sm sm:text-base leading-relaxed'>
                            {event.description}
                        </p>
                    </div>

                    {/* Venue & Hall Specs Box */}
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-[#161b22] border border-white/10 shadow-lg'>
                        <div className='space-y-1'>
                            <div className='flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase'>
                                <MapPin className='w-4 h-4' /> Venue Location
                            </div>
                            <p className='text-sm font-bold text-white'>
                                {event.venueId?.name}
                            </p>
                            <p className='text-xs text-gray-400'>
                                {event.venueId?.address}, {event.venueId?.city}
                            </p>
                        </div>

                        <div className='space-y-1'>
                            <div className='flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase'>
                                <Calendar className='w-4 h-4' /> Date & Schedule
                            </div>
                            <p className='text-sm font-bold text-white'>
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
                            <p className='text-xs text-gray-400 flex items-center gap-1'>
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
                            <div className='space-y-1 pt-3 border-t border-white/10 sm:border-t-0'>
                                <div className='flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase'>
                                    <Building2 className='w-4 h-4' /> Auditorium
                                </div>
                                <p className='text-sm font-semibold text-gray-200'>
                                    {event.selectedAuditorium.name}
                                </p>
                            </div>
                        )}

                        {event.selectedScreen && (
                            <div className='space-y-1 pt-3 border-t border-white/10 sm:border-t-0'>
                                <div className='flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase'>
                                    <Tv className='w-4 h-4' /> Screen Capacity
                                </div>
                                <p className='text-sm font-semibold text-gray-200 flex items-center gap-1'>
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
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6 border-t border-white/10'>
                {/* Tier Selection Cards (Left: 7 Cols) */}
                <div className='lg:col-span-7 space-y-4'>
                    <div className='flex items-center gap-2'>
                        <Ticket className='w-5 h-5 text-indigo-400' />
                        <h2 className='text-2xl font-black text-white'>
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
                                            ? 'bg-indigo-950/40 border-indigo-500/50'
                                            : 'bg-[#161b22] border-white/10'
                                    }`}
                                >
                                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                                        <div>
                                            <div className='flex items-center gap-2'>
                                                <h3 className='text-base font-bold text-white'>
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
                                            <p className='text-xs text-gray-400 mt-1'>
                                                {available} of{' '}
                                                {tier.totalQuantity} seats
                                                available
                                            </p>
                                            <span className='text-lg font-black text-indigo-400 mt-2 block'>
                                                ₹
                                                {tier.price.toLocaleString(
                                                    'en-IN',
                                                )}
                                            </span>
                                        </div>

                                        {!isSoldOut && (
                                            <div className='flex items-center gap-3 self-end sm:self-center bg-white/5 border border-white/10 p-1 rounded-xl'>
                                                <button
                                                    onClick={() =>
                                                        handleQuantityChange(
                                                            tier._id,
                                                            -1,
                                                            available,
                                                        )
                                                    }
                                                    disabled={qty === 0}
                                                    className='btn btn-xs btn-ghost btn-square text-white hover:bg-white/10 disabled:opacity-30'
                                                >
                                                    <Minus className='w-3.5 h-3.5' />
                                                </button>
                                                <span className='text-sm font-bold text-white px-2 min-w-6 text-center font-mono'>
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
                                                    className='btn btn-xs btn-ghost btn-square text-white hover:bg-white/10 disabled:opacity-30'
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
                <div className='lg:col-span-5 bg-[#161b22] border border-white/10 rounded-3xl p-6 shadow-xl space-y-6 sticky top-24'>
                    <h3 className='text-lg font-bold text-white border-b border-white/10 pb-3'>
                        Booking Summary
                    </h3>

                    {totalTicketCount === 0 ? (
                        <p className='text-xs text-gray-400 py-4 text-center'>
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
                                            className='flex items-center justify-between text-xs text-gray-300'
                                        >
                                            <span>
                                                {tier.name} × {qty}
                                            </span>
                                            <span className='font-mono font-bold text-white'>
                                                ₹
                                                {(
                                                    qty * tier.price
                                                ).toLocaleString('en-IN')}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className='border-t border-white/10 pt-3 space-y-2 text-xs text-gray-400'>
                                <div className='flex justify-between'>
                                    <span>Subtotal</span>
                                    <span className='font-mono text-white'>
                                        ₹{subtotal.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <div className='flex justify-between'>
                                    <span>Taxes & GST ({ticketGSTRate}%)</span>
                                    <span className='font-mono text-white'>
                                        ₹{estimatedTax.toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>

                            <div className='border-t border-white/10 pt-4 flex items-center justify-between'>
                                <div>
                                    <span className='text-xs text-gray-400 uppercase block font-semibold'>
                                        Total Payable
                                    </span>
                                    <span className='text-2xl font-black text-white font-mono'>
                                        ₹{grandTotal.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <span className='badge badge-ghost text-[10px] text-gray-400'>
                                    {totalTicketCount}{' '}
                                    {totalTicketCount === 1 ? 'Seat' : 'Seats'}
                                </span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleProceedToCheckout}
                        disabled={totalTicketCount === 0}
                        className='btn bg-indigo-600 hover:bg-indigo-500 text-white font-bold w-full rounded-xl py-3 border-0 shadow-lg shadow-indigo-600/30 disabled:opacity-40'
                    >
                        {userInfo
                            ? 'Proceed to Confirmation'
                            : 'Sign In to Reserve'}
                    </button>

                    <div className='flex items-center justify-center gap-1.5 text-[11px] text-gray-500'>
                        <ShieldCheck className='w-3.5 h-3.5 text-emerald-400' />
                        <span>Instant Anti-Passback QR Code Issuance</span>
                    </div>
                </div>
            </div>

            {/* ================= REVIEWS & ATTENDEE FEEDBACK SECTION ================= */}
            <div className='pt-8 border-t border-white/10 space-y-8'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                    <div>
                        <div className='flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1'>
                            <MessageSquare className='w-4 h-4' /> Social Proof
                        </div>
                        <h2 className='text-2xl sm:text-3xl font-black text-white'>
                            Verified Reviews
                        </h2>
                    </div>

                    <div className='flex items-center gap-2 text-sm text-gray-300'>
                        <span className='font-bold text-white text-lg'>
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
                                            : 'text-gray-600'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className='text-xs text-gray-400'>
                            ({event.totalReviews || 0} total)
                        </span>
                    </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 items-start'>
                    {/* Review List (Left: 7 cols) */}
                    <div className='lg:col-span-7 space-y-4'>
                        {loadingReviews ? (
                            <div className='flex items-center justify-center py-10 text-gray-400 gap-2'>
                                <Loader2 className='w-5 h-5 animate-spin text-indigo-500' />
                                <span className='text-xs font-medium'>
                                    Loading attendee reviews...
                                </span>
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className='p-8 rounded-2xl bg-[#161b22] border border-white/10 text-center space-y-2'>
                                <MessageSquare className='w-8 h-8 text-gray-600 mx-auto' />
                                <p className='text-sm font-semibold text-gray-300'>
                                    No reviews yet.
                                </p>
                                <p className='text-xs text-gray-500'>
                                    Be the first verified attendee to share
                                    feedback on this event!
                                </p>
                            </div>
                        ) : (
                            reviews.map((rev) => (
                                <div
                                    key={rev._id}
                                    className='bg-[#161b22] border border-white/10 rounded-2xl p-5 space-y-3 shadow-md'
                                >
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-2'>
                                            <div className='w-7 h-7 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center font-bold text-xs'>
                                                {rev.user?.userName
                                                    ?.charAt(0)
                                                    .toUpperCase() || 'A'}
                                            </div>
                                            <div>
                                                <span className='text-xs font-bold text-white block'>
                                                    {rev.user?.userName ||
                                                        'Verified Attendee'}
                                                </span>
                                                <span className='text-[10px] text-gray-400'>
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

                                        <div className='flex items-center gap-2'>
                                            {rev.isVerifiedAttendee && (
                                                <span className='badge badge-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-semibold gap-1 py-2 px-2 text-[10px]'>
                                                    <ShieldCheck className='w-3 h-3' />{' '}
                                                    Verified Attendee
                                                </span>
                                            )}
                                            <div className='flex items-center gap-0.5 text-amber-400'>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={`w-3.5 h-3.5 ${
                                                            star <= rev.rating
                                                                ? 'fill-amber-400'
                                                                : 'text-gray-600'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <p className='text-xs text-gray-300 leading-relaxed italic'>
                                        "{rev.comment}"
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Write a Review Box (Right: 5 cols) */}
                    <div className='lg:col-span-5 bg-[#161b22] border border-white/10 rounded-3xl p-6 shadow-xl space-y-4'>
                        <div className='border-b border-white/10 pb-3'>
                            <h3 className='text-base font-bold text-white'>
                                Leave Verified Feedback
                            </h3>
                            <p className='text-xs text-gray-400 mt-1'>
                                Reviews are restricted to attendees who hold a
                                paid booking for this event.
                            </p>
                        </div>

                        {reviewSuccess && (
                            <div className='p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2'>
                                <ShieldCheck className='w-4 h-4 shrink-0' />
                                <span>
                                    Your review has been submitted and
                                    aggregated!
                                </span>
                            </div>
                        )}

                        {reviewError && (
                            <div className='p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2'>
                                <AlertCircle className='w-4 h-4 shrink-0 mt-0.5' />
                                <span>{reviewError}</span>
                            </div>
                        )}

                        {userInfo ? (
                            <form
                                onSubmit={handleReviewSubmit}
                                className='space-y-4'
                            >
                                <div>
                                    <label className='text-xs font-semibold text-gray-300 block mb-1'>
                                        Rating
                                    </label>
                                    <div className='flex items-center gap-2'>
                                        {[1, 2, 3, 4, 5].map((num) => (
                                            <button
                                                key={num}
                                                type='button'
                                                onClick={() => setRating(num)}
                                                className='p-1 text-amber-400 hover:scale-110 transition-transform'
                                            >
                                                <Star
                                                    className={`w-6 h-6 ${
                                                        num <= rating
                                                            ? 'fill-amber-400'
                                                            : 'text-gray-600'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                        <span className='text-xs font-mono font-bold text-white ml-2'>
                                            {rating} / 5 Stars
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className='text-xs font-semibold text-gray-300 block mb-1'>
                                        Your Review
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={comment}
                                        onChange={(e) =>
                                            setComment(e.target.value)
                                        }
                                        placeholder='Share your experience regarding seating, acoustics, or venue entry...'
                                        className='w-full rounded-xl bg-white/5 border border-white/10 p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors'
                                    />
                                </div>

                                <button
                                    type='submit'
                                    disabled={submittingReview}
                                    className='btn bg-indigo-600 hover:bg-indigo-500 text-white font-bold w-full rounded-xl border-0 shadow-md flex items-center justify-center gap-2 disabled:opacity-50'
                                >
                                    {submittingReview ? (
                                        <>
                                            <Loader2 className='w-4 h-4 animate-spin' />{' '}
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Send className='w-4 h-4' /> Submit
                                            Review
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className='py-6 text-center space-y-3'>
                                <p className='text-xs text-gray-400'>
                                    You must be signed in with your attendee
                                    account to submit a review.
                                </p>
                                <Link
                                    to='/login'
                                    className='btn btn-sm bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl border-0'
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
