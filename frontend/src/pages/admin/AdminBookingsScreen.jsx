// frontend/src/pages/admin/AdminBookingsScreen.jsx

import { useState } from 'react'
import {
    useGetAllBookingsQuery,
    useApprovePaymentMutation,
    useProcessRefundMutation,
} from '../../redux/api/bookingsApiSlice'
import {
    CheckCircle,
    CreditCard,
    RotateCcw,
    Search,
    ShieldAlert,
    Loader2,
    Calendar,
    User,
    Check,
} from 'lucide-react'

const AdminBookingsScreen = () => {
    const { data, isLoading, error } = useGetAllBookingsQuery()
    const bookings = data?.data || []

    const [approvePayment, { isLoading: isApproving }] =
        useApprovePaymentMutation()
    const [processRefund, { isLoading: isRefunding }] =
        useProcessRefundMutation()

    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const handleApprove = async (bookingId) => {
        if (
            !window.confirm(
                'Confirm and mark this booking as Paid? This will activate the attendee entry pass.',
            )
        ) {
            return
        }
        try {
            await approvePayment(bookingId).unwrap()
        } catch (err) {
            alert(err?.data?.message || 'Failed to approve payment')
        }
    }

    const handleRefundDecision = async (bookingId, action) => {
        const reason = window.prompt(
            action === 'approve'
                ? 'Enter any approval remarks:'
                : 'Enter reason for rejecting this refund request:',
        )
        if (reason === null) return

        try {
            await processRefund({
                id: bookingId,
                action,
                adminRemarks: reason.trim() || undefined,
            }).unwrap()
        } catch (err) {
            alert(err?.data?.message || `Failed to ${action} refund`)
        }
    }

    const filteredBookings = bookings.filter((b) => {
        const matchesSearch =
            b.user?.userName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            b.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.paymentDetails?.trxnId
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            b._id.includes(searchTerm)

        if (statusFilter === 'pending_payment') {
            return (
                matchesSearch &&
                (b.paymentStatus === 'pending_verification' ||
                    b.paymentStatus === 'not_paid')
            )
        }
        if (statusFilter === 'refund_requested') {
            return matchesSearch && b.bookingStatus === 'refund_requested'
        }
        if (statusFilter === 'confirmed') {
            return matchesSearch && b.bookingStatus === 'confirmed'
        }
        return matchesSearch
    })

    if (isLoading) {
        return (
            <div className='min-h-[60vh] flex flex-col items-center justify-center gap-3'>
                <Loader2 className='w-8 h-8 text-primary animate-spin' />
                <p className='text-xs opacity-60'>
                    Loading attendee bookings & reconciliations...
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className='max-w-4xl mx-auto px-4 py-12 text-center'>
                <div className='alert alert-error max-w-md mx-auto rounded-2xl'>
                    <ShieldAlert className='w-5 h-5' />
                    <span>
                        Failed to load bookings:{' '}
                        {error?.data?.message || 'Unauthorized or server error'}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6'>
            {/* Header & Filter Controls */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl sm:text-3xl font-black text-base-content flex items-center gap-2'>
                        <CreditCard className='w-7 h-7 text-primary shrink-0' />
                        <span>Payment Reconciliation & Bookings</span>
                    </h1>
                    <p className='text-xs sm:text-sm text-base-content/70 mt-1'>
                        Review offline transaction proofs, approve settlements,
                        and authorize cancellations
                    </p>
                </div>

                <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
                    <div className='relative flex-1 sm:w-64'>
                        <input
                            type='text'
                            placeholder='Search UTR, name, or event...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='input input-sm input-bordered w-full pl-8 rounded-xl text-xs'
                        />
                        <Search className='w-3.5 h-3.5 absolute left-2.5 top-2.5 opacity-50' />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className='select select-sm select-bordered rounded-xl text-xs font-semibold'
                    >
                        <option value='all'>All Records</option>
                        <option value='pending_payment'>
                            Pending Payment / Proof
                        </option>
                        <option value='refund_requested'>
                            Refund Requests
                        </option>
                        <option value='confirmed'>Confirmed & Paid</option>
                    </select>
                </div>
            </div>

            {filteredBookings.length === 0 ? (
                <div className='bg-base-100 rounded-3xl p-10 text-center border border-base-content/10 max-w-md mx-auto space-y-2'>
                    <CheckCircle className='w-8 h-8 text-success mx-auto opacity-50' />
                    <h3 className='font-bold text-sm'>
                        No matching bookings found
                    </h3>
                    <p className='text-xs opacity-60'>
                        No orders meet the selected filter criteria.
                    </p>
                </div>
            ) : (
                <>
                    {/* ============================================================== */}
                    {/* 1. DESKTOP VIEW: High-Density Table (Hidden on small screens) */}
                    {/* ============================================================== */}
                    <div className='hidden lg:block overflow-x-auto bg-base-100 rounded-3xl border border-base-content/10 shadow-sm'>
                        <table className='table table-sm w-full text-xs'>
                            <thead className='bg-base-200/50 uppercase text-[10px] tracking-wider text-base-content/70 font-bold'>
                                <tr>
                                    <th>Attendee</th>
                                    <th>Event Details</th>
                                    <th>Tier & Qty</th>
                                    <th>Total</th>
                                    <th>Payment Proof</th>
                                    <th>Status</th>
                                    <th className='text-right pr-4'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-base-content/5'>
                                {filteredBookings.map((b) => (
                                    <tr
                                        key={b._id}
                                        className='hover:bg-base-200/30 transition-colors'
                                    >
                                        <td>
                                            <div className='font-bold text-base-content flex items-center gap-1.5'>
                                                <User className='w-3.5 h-3.5 text-primary' />
                                                {b.user?.userName || 'N/A'}
                                            </div>
                                            <div className='text-[10px] opacity-60 font-mono'>
                                                {b.user?.email}
                                            </div>
                                            {b.user?.phone && (
                                                <div className='text-[10px] opacity-60 font-mono'>
                                                    {b.user?.phone}
                                                </div>
                                            )}
                                        </td>

                                        <td>
                                            <div className='font-bold text-base-content line-clamp-1 max-w-xs'>
                                                {b.event?.title}
                                            </div>
                                            <div className='text-[10px] opacity-60 flex items-center gap-1'>
                                                <Calendar className='w-3 h-3 text-primary' />
                                                {b.event?.venueId?.name} (
                                                {b.event?.venueId?.city})
                                            </div>
                                        </td>

                                        <td>
                                            <span className='badge badge-ghost badge-sm font-bold uppercase text-[10px]'>
                                                {b.tierName}
                                            </span>
                                            <span className='ml-1 font-mono font-bold text-xs'>
                                                x{b.bookedQty}
                                            </span>
                                        </td>

                                        <td className='font-mono font-bold text-sm text-primary'>
                                            ₹{b.totalAmount}
                                        </td>

                                        <td>
                                            {b.paymentDetails?.trxnId ? (
                                                <div className='space-y-0.5'>
                                                    <div className='font-mono font-bold text-xs text-info flex items-center gap-1'>
                                                        <span>
                                                            Ref:{' '}
                                                            {
                                                                b.paymentDetails
                                                                    .trxnId
                                                            }
                                                        </span>
                                                    </div>
                                                    <span className='badge badge-xs badge-outline uppercase text-[9px] font-bold'>
                                                        {b.paymentDetails.mode}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className='text-[10px] opacity-40 italic'>
                                                    No proof uploaded
                                                </span>
                                            )}
                                        </td>

                                        <td>
                                            <div className='flex flex-col gap-1 items-start'>
                                                <span
                                                    className={`badge badge-xs font-bold ${
                                                        b.paymentStatus ===
                                                        'paid'
                                                            ? 'badge-success'
                                                            : b.paymentStatus ===
                                                                'pending_verification'
                                                              ? 'badge-info'
                                                              : b.paymentStatus ===
                                                                  'refund_requested'
                                                                ? 'badge-warning'
                                                                : b.paymentStatus ===
                                                                    'refunded'
                                                                  ? 'badge-neutral'
                                                                  : 'badge-error'
                                                    }`}
                                                >
                                                    Pay: {b.paymentStatus}
                                                </span>

                                                <span
                                                    className={`badge badge-xs font-bold ${
                                                        b.bookingStatus ===
                                                        'confirmed'
                                                            ? 'badge-success'
                                                            : b.bookingStatus ===
                                                                'refund_requested'
                                                              ? 'badge-warning'
                                                              : 'badge-ghost'
                                                    }`}
                                                >
                                                    Book: {b.bookingStatus}
                                                </span>
                                            </div>
                                        </td>

                                        <td className='text-right pr-4 space-x-1.5 whitespace-nowrap'>
                                            {b.paymentStatus !== 'paid' &&
                                                b.bookingStatus !==
                                                    'cancelled' && (
                                                    <button
                                                        onClick={() =>
                                                            handleApprove(b._id)
                                                        }
                                                        disabled={isApproving}
                                                        className='btn btn-xs btn-primary rounded-xl font-bold gap-1 shadow-sm'
                                                        title='Confirm payment and activate QR pass token'
                                                    >
                                                        <Check className='w-3 h-3' />{' '}
                                                        Approve Pay
                                                    </button>
                                                )}

                                            {b.bookingStatus ===
                                                'refund_requested' && (
                                                <div className='inline-flex gap-1'>
                                                    <button
                                                        onClick={() =>
                                                            handleRefundDecision(
                                                                b._id,
                                                                'approve',
                                                            )
                                                        }
                                                        disabled={isRefunding}
                                                        className='btn btn-xs btn-error text-white rounded-xl font-bold gap-1'
                                                        title='Approve refund and restore ticket inventory'
                                                    >
                                                        <RotateCcw className='w-3 h-3' />{' '}
                                                        Refund
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleRefundDecision(
                                                                b._id,
                                                                'reject',
                                                            )
                                                        }
                                                        disabled={isRefunding}
                                                        className='btn btn-xs btn-ghost rounded-xl'
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ============================================================== */}
                    {/* 2. MOBILE & TABLET CARD VIEW (Shown on small / compact screens) */}
                    {/* ============================================================== */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden'>
                        {filteredBookings.map((b) => (
                            <div
                                key={b._id}
                                className='card bg-base-100 border border-base-content/10 shadow-sm rounded-2xl p-4 space-y-3.5'
                            >
                                {/* Card Header */}
                                <div className='flex items-start justify-between gap-2'>
                                    <div className='min-w-0'>
                                        <div className='font-bold text-sm text-base-content truncate flex items-center gap-1.5'>
                                            <User className='w-3.5 h-3.5 text-primary shrink-0' />
                                            <span className='truncate'>
                                                {b.user?.userName || 'N/A'}
                                            </span>
                                        </div>
                                        <div className='text-[11px] opacity-60 font-mono truncate'>
                                            {b.user?.email}
                                        </div>
                                    </div>
                                    <span className='font-mono font-black text-primary text-sm shrink-0'>
                                        ₹{b.totalAmount}
                                    </span>
                                </div>

                                {/* Event & Tier Details */}
                                <div className='bg-base-200/50 p-2.5 rounded-xl space-y-1 text-xs'>
                                    <div className='font-semibold text-base-content truncate'>
                                        {b.event?.title}
                                    </div>
                                    <div className='text-[11px] opacity-70 flex items-center gap-1 truncate'>
                                        <Calendar className='w-3 h-3 text-primary shrink-0' />
                                        <span>
                                            {b.event?.venueId?.name} (
                                            {b.event?.venueId?.city})
                                        </span>
                                    </div>
                                    <div className='pt-1 flex items-center justify-between border-t border-base-content/10 text-[11px]'>
                                        <span className='badge badge-ghost badge-xs font-bold uppercase'>
                                            {b.tierName}
                                        </span>
                                        <span className='font-mono font-bold opacity-70'>
                                            Qty: {b.bookedQty}
                                        </span>
                                    </div>
                                </div>

                                {/* Payment Proof & Status */}
                                <div className='flex flex-wrap items-center justify-between gap-2 text-xs'>
                                    <div>
                                        {b.paymentDetails?.trxnId ? (
                                            <div className='space-y-0.5'>
                                                <div className='font-mono font-bold text-[11px] text-info'>
                                                    Ref:{' '}
                                                    {b.paymentDetails.trxnId}
                                                </div>
                                                <span className='badge badge-xs badge-outline uppercase text-[9px] font-bold'>
                                                    {b.paymentDetails.mode}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className='text-[10px] opacity-40 italic'>
                                                No proof uploaded
                                            </span>
                                        )}
                                    </div>

                                    <div className='flex items-center gap-1.5'>
                                        <span
                                            className={`badge badge-xs font-bold ${
                                                b.paymentStatus === 'paid'
                                                    ? 'badge-success'
                                                    : b.paymentStatus ===
                                                        'pending_verification'
                                                      ? 'badge-info'
                                                      : b.paymentStatus ===
                                                          'refund_requested'
                                                        ? 'badge-warning'
                                                        : b.paymentStatus ===
                                                            'refunded'
                                                          ? 'badge-neutral'
                                                          : 'badge-error'
                                            }`}
                                        >
                                            {b.paymentStatus}
                                        </span>
                                        <span
                                            className={`badge badge-xs font-bold ${
                                                b.bookingStatus === 'confirmed'
                                                    ? 'badge-success'
                                                    : b.bookingStatus ===
                                                        'refund_requested'
                                                      ? 'badge-warning'
                                                      : 'badge-ghost'
                                            }`}
                                        >
                                            {b.bookingStatus}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                {(b.paymentStatus !== 'paid' &&
                                    b.bookingStatus !== 'cancelled') ||
                                b.bookingStatus === 'refund_requested' ? (
                                    <div className='pt-2 border-t border-base-content/10 flex items-center justify-end gap-2'>
                                        {b.paymentStatus !== 'paid' &&
                                            b.bookingStatus !== 'cancelled' && (
                                                <button
                                                    onClick={() =>
                                                        handleApprove(b._id)
                                                    }
                                                    disabled={isApproving}
                                                    className='btn btn-xs btn-primary rounded-xl font-bold gap-1 shadow-sm flex-1'
                                                >
                                                    <Check className='w-3 h-3' />{' '}
                                                    Approve Pay
                                                </button>
                                            )}

                                        {b.bookingStatus ===
                                            'refund_requested' && (
                                            <div className='flex items-center gap-1.5 flex-1 justify-end'>
                                                <button
                                                    onClick={() =>
                                                        handleRefundDecision(
                                                            b._id,
                                                            'approve',
                                                        )
                                                    }
                                                    disabled={isRefunding}
                                                    className='btn btn-xs btn-error text-white rounded-xl font-bold gap-1 flex-1'
                                                >
                                                    <RotateCcw className='w-3 h-3' />{' '}
                                                    Refund
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleRefundDecision(
                                                            b._id,
                                                            'reject',
                                                        )
                                                    }
                                                    disabled={isRefunding}
                                                    className='btn btn-xs btn-ghost rounded-xl'
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default AdminBookingsScreen
