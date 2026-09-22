// frontend/src/pages/MyBookingsScreen.jsx

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    Ticket,
    Calendar,
    MapPin,
    QrCode,
    Printer,
    X,
    CheckCircle2,
    Clock,
    AlertCircle,
    Truck,
    PackageCheck,
    ChevronRight,
    Sparkles,
} from 'lucide-react'
import {
    useGetMyBookingsQuery,
    useGetDigitalEntryPassQuery,
} from '../redux/api/bookingsApiSlice'

const MyBookingsScreen = () => {
    const {
        data: response,
        isLoading,
        isError,
        refetch,
    } = useGetMyBookingsQuery()
    const bookings = response?.data || []

    const [activePassId, setActivePassId] = useState(null)

    // Lazy load entry pass details and QR only when an attendee opens a modal
    const {
        data: passResponse,
        isLoading: isPassLoading,
        isError: isPassError,
    } = useGetDigitalEntryPassQuery(activePassId, {
        skip: !activePassId,
    })

    const passData = passResponse?.data

    const handlePrint = () => {
        window.print()
    }

    const getStatusBadge = (booking) => {
        if (booking.bookingStatus === 'cancelled') {
            return (
                <span className='badge badge-error gap-1 text-[11px] font-bold uppercase'>
                    <AlertCircle className='w-3 h-3' /> Cancelled
                </span>
            )
        }
        if (
            booking.paymentStatus === 'paid' &&
            booking.bookingStatus === 'confirmed'
        ) {
            return (
                <span className='badge badge-success gap-1 text-[11px] font-bold uppercase'>
                    <CheckCircle2 className='w-3 h-3' /> Confirmed
                </span>
            )
        }
        return (
            <span className='badge badge-warning gap-1 text-[11px] font-bold uppercase'>
                <Clock className='w-3 h-3' />{' '}
                {booking.paymentStatus.replace('_', ' ')}
            </span>
        )
    }

    const getDispatchBadge = (status) => {
        if (status === 'received') {
            return (
                <span className='badge badge-outline badge-success gap-1 text-[10px] font-semibold uppercase'>
                    <PackageCheck className='w-3 h-3' /> Received
                </span>
            )
        }
        if (status === 'dispatched') {
            return (
                <span className='badge badge-outline badge-info gap-1 text-[10px] font-semibold uppercase'>
                    <Truck className='w-3 h-3' /> Courier Dispatched
                </span>
            )
        }
        return null
    }

    return (
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-content/10 pb-6'>
                <div>
                    <div className='flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1'>
                        <Ticket className='w-4 h-4' /> Attendee Passbook
                    </div>
                    <h1 className='text-2xl sm:text-3xl font-black text-base-content'>
                        My Tickets & Gate Passes
                    </h1>
                </div>

                <Link
                    to='/events'
                    className='btn btn-outline btn-sm rounded-xl gap-2 font-semibold'
                >
                    <Sparkles className='w-4 h-4 text-primary' /> Browse More
                    Events
                </Link>
            </div>

            {/* Content States */}
            {isLoading ? (
                <div className='flex flex-col items-center justify-center py-20 gap-3'>
                    <span className='loading loading-spinner loading-lg text-primary'></span>
                    <p className='text-sm text-base-content/60 font-medium'>
                        Loading your booking portfolio...
                    </p>
                </div>
            ) : isError ? (
                <div className='alert alert-error rounded-2xl shadow-lg'>
                    <AlertCircle className='w-5 h-5' />
                    <span>Failed to retrieve bookings. Please try again.</span>
                    <button
                        onClick={refetch}
                        className='btn btn-xs btn-outline'
                    >
                        Retry
                    </button>
                </div>
            ) : bookings.length === 0 ? (
                <div className='text-center py-16 px-4 bg-base-100 rounded-3xl border border-base-content/10 shadow-sm space-y-4'>
                    <div className='w-16 h-16 rounded-2xl bg-base-200 text-base-content/40 flex items-center justify-center mx-auto'>
                        <Ticket className='w-8 h-8' />
                    </div>
                    <div className='space-y-1 max-w-sm mx-auto'>
                        <h3 className='text-lg font-bold'>
                            No tickets booked yet
                        </h3>
                        <p className='text-xs text-base-content/60'>
                            Explore upcoming performances, concerts, and
                            masterclasses to reserve your passes.
                        </p>
                    </div>
                    <Link
                        to='/events'
                        className='btn btn-primary btn-sm rounded-xl px-5'
                    >
                        Explore Events
                    </Link>
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6'>
                    {bookings.map((b) => {
                        const evt = b.event
                        const isPassAvailable =
                            b.paymentStatus === 'paid' &&
                            b.bookingStatus === 'confirmed' &&
                            b.entryPassToken

                        return (
                            <div
                                key={b._id}
                                className='card bg-base-100 border border-base-content/10 shadow-md hover:shadow-xl transition-all duration-200 rounded-3xl overflow-hidden flex flex-col justify-between'
                            >
                                <div className='p-5 sm:p-6 space-y-4'>
                                    {/* Top Metadata */}
                                    <div className='flex items-center justify-between gap-2'>
                                        <div className='flex items-center gap-2 flex-wrap'>
                                            {getStatusBadge(b)}
                                            {getDispatchBadge(b.despatchStatus)}
                                        </div>
                                        <span className='font-mono text-[11px] text-base-content/50 uppercase'>
                                            #{b._id.slice(-6)}
                                        </span>
                                    </div>

                                    {/* Event Title */}
                                    <div>
                                        <h2 className='text-lg sm:text-xl font-black text-base-content line-clamp-1'>
                                            {evt?.title ||
                                                'Private / Closed Event'}
                                        </h2>
                                        {evt?.startDate && (
                                            <p className='flex items-center gap-1.5 text-xs text-base-content/70 mt-1 font-medium'>
                                                <Calendar className='w-3.5 h-3.5 text-primary shrink-0' />
                                                {new Date(
                                                    evt.startDate,
                                                ).toLocaleDateString('en-IN', {
                                                    weekday: 'short',
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        )}
                                    </div>

                                    {/* Ticket Specifications */}
                                    <div className='bg-base-200/60 rounded-2xl p-3.5 grid grid-cols-2 gap-2 text-xs'>
                                        <div>
                                            <span className='text-[10px] text-base-content/60 uppercase font-bold tracking-wider block'>
                                                Tier
                                            </span>
                                            <span className='font-bold text-base-content truncate block'>
                                                {b.tierName}
                                            </span>
                                        </div>
                                        <div>
                                            <span className='text-[10px] text-base-content/60 uppercase font-bold tracking-wider block'>
                                                Passes Reserved
                                            </span>
                                            <span className='font-bold text-base-content block'>
                                                {b.bookedQty}{' '}
                                                {b.bookedQty > 1
                                                    ? 'Tickets'
                                                    : 'Ticket'}
                                            </span>
                                        </div>
                                        <div className='col-span-2 pt-2 border-t border-base-content/5 flex items-center justify-between'>
                                            <span className='text-[11px] text-base-content/60 font-semibold'>
                                                Total Paid
                                            </span>
                                            <span className='font-mono font-extrabold text-sm text-primary'>
                                                ₹
                                                {b.totalAmount.toLocaleString(
                                                    'en-IN',
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Entry Pass Verification Status */}
                                    {b.isCheckedIn && (
                                        <div className='flex items-center gap-2 p-2.5 rounded-xl bg-info/10 text-info text-xs font-semibold'>
                                            <CheckCircle2 className='w-4 h-4 shrink-0' />
                                            <span>
                                                Admitted at Gate (
                                                {new Date(
                                                    b.checkInTimestamp,
                                                ).toLocaleTimeString('en-IN', {
                                                    timeZone: 'Asia/Kolkata',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                                )
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className='px-5 pb-5 pt-2 border-t border-base-content/5 bg-base-100 flex items-center justify-between gap-3'>
                                    {isPassAvailable ? (
                                        <button
                                            onClick={() =>
                                                setActivePassId(b._id)
                                            }
                                            className='btn btn-primary btn-sm rounded-xl gap-2 w-full font-bold shadow-sm'
                                        >
                                            <QrCode className='w-4 h-4' /> View
                                            QR Entry Pass
                                        </button>
                                    ) : (
                                        <div className='text-xs text-base-content/60 italic py-1'>
                                            Pass generation pending payment
                                            confirmation
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ================= DIGITAL TICKET & PRINT MODAL ================= */}
            {activePassId && (
                <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150'>
                    <div className='bg-base-100 rounded-3xl max-w-md w-full border border-base-content/15 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]'>
                        {/* Modal Header */}
                        <div className='p-4 border-b border-base-content/10 flex items-center justify-between no-print'>
                            <div className='flex items-center gap-2'>
                                <Ticket className='w-5 h-5 text-primary' />
                                <h3 className='font-bold text-sm text-base-content'>
                                    Digital Admission Pass
                                </h3>
                            </div>
                            <button
                                onClick={() => setActivePassId(null)}
                                className='btn btn-circle btn-ghost btn-xs'
                                aria-label='Close modal'
                            >
                                <X className='w-4 h-4' />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div
                            className='p-6 overflow-y-auto space-y-6'
                            id='printable-ticket'
                        >
                            {isPassLoading ? (
                                <div className='py-16 text-center space-y-3'>
                                    <span className='loading loading-spinner loading-md text-primary'></span>
                                    <p className='text-xs text-base-content/60'>
                                        Rendering authenticated dynamic QR
                                        code...
                                    </p>
                                </div>
                            ) : isPassError || !passData ? (
                                <div className='alert alert-error text-xs rounded-xl'>
                                    <AlertCircle className='w-4 h-4' />
                                    <span>
                                        Failed to load gate pass details.
                                    </span>
                                </div>
                            ) : (
                                <div className='space-y-5'>
                                    {/* Ticket Card Wrapper */}
                                    <div className='bg-gradient-to-b from-base-200/90 to-base-200/40 border border-base-content/15 rounded-3xl p-6 text-center relative overflow-hidden shadow-inner'>
                                        {/* Top Notch Circles */}
                                        <div className='absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-base-100 border-r border-base-content/15'></div>
                                        <div className='absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-base-100 border-l border-base-content/15'></div>

                                        {/* Event Header */}
                                        <span className='badge badge-primary badge-sm font-bold uppercase tracking-wider mb-2'>
                                            Official Admission Pass
                                        </span>
                                        <h2 className='text-xl font-black text-base-content leading-tight'>
                                            {passData.event?.title}
                                        </h2>
                                        <p className='text-xs text-base-content/70 mt-1 flex items-center justify-center gap-1.5'>
                                            <MapPin className='w-3.5 h-3.5 text-primary' />
                                            {passData.event?.venue},{' '}
                                            {passData.event?.city}
                                        </p>

                                        {/* Base64 High-Resolution QR */}
                                        <div className='my-5 p-3.5 bg-white rounded-2xl w-fit mx-auto shadow-md border-2 border-primary/20'>
                                            <img
                                                src={passData.qrCode}
                                                alt='Entry Pass QR Code'
                                                className='w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto block'
                                            />
                                        </div>

                                        {/* Token String for Gatekeeper Manual Fallback */}
                                        <div className='space-y-1'>
                                            <span className='text-[10px] text-base-content/50 uppercase font-mono tracking-wider'>
                                                Verification Pass Token
                                            </span>
                                            <p className='font-mono font-bold text-xs tracking-wider text-primary break-all px-2'>
                                                {passData.entryPassToken}
                                            </p>
                                        </div>

                                        {/* Attendee Snapshot */}
                                        <div className='mt-5 pt-4 border-t border-dashed border-base-content/20 grid grid-cols-2 gap-2 text-left text-xs'>
                                            <div>
                                                <span className='text-[10px] text-base-content/50 uppercase font-bold tracking-wider block'>
                                                    Attendee
                                                </span>
                                                <span className='font-bold text-base-content truncate block'>
                                                    {passData.attendee?.name}
                                                </span>
                                            </div>
                                            <div className='text-right'>
                                                <span className='text-[10px] text-base-content/50 uppercase font-bold tracking-wider block'>
                                                    Tier & Qty
                                                </span>
                                                <span className='font-bold text-base-content block'>
                                                    {
                                                        passData.attendee
                                                            ?.tierName
                                                    }{' '}
                                                    ×{' '}
                                                    {
                                                        passData.attendee
                                                            ?.bookedQty
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gate Instructions */}
                                    <p className='text-[11px] text-base-content/60 text-center leading-relaxed no-print'>
                                        Present this digital screen or a
                                        physical paper printout at the security
                                        turnstiles. Equipped with anti-passback
                                        authentication; multiple entries using
                                        the same pass will trigger gate alerts.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Action Bar */}
                        <div className='p-4 bg-base-200/50 border-t border-base-content/10 flex items-center justify-end gap-2 no-print'>
                            <button
                                onClick={handlePrint}
                                disabled={!passData}
                                className='btn btn-primary btn-sm rounded-xl gap-2 font-bold shadow-sm'
                            >
                                <Printer className='w-4 h-4' /> Print / Save
                                Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Print CSS Rules */}
            <style role='style'>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    #printable-ticket,
                    #printable-ticket * {
                        visibility: visible !important;
                    }
                    #printable-ticket {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100vw !important;
                        height: auto !important;
                        padding: 24px !important;
                        margin: 0 !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    )
}

export default MyBookingsScreen
