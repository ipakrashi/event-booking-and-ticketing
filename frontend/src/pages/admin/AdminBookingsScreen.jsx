// frontend/src/pages/admin/AdminBookingsScreen.jsx

import { useState, useEffect } from 'react'
import {
    useGetAllBookingsQuery,
    useApprovePaymentMutation,
    useProcessRefundMutation,
    useUpdateDispatchStatusMutation,
    useGetShippingLabelQuery,
} from '../../redux/api/bookingsApiSlice'
import {
    useGetCouriersQuery,
    useCreateCourierMutation,
    useDeleteCourierMutation,
} from '../../redux/api/couriersApiSlice'
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
    Truck,
    PackageCheck,
    FileText,
    Printer,
    X,
    MapPin,
    Phone,
    Mail,
} from 'lucide-react'

// Shipping Label Modal Component
const ShippingLabelModal = ({ bookingId, onClose }) => {
    const { data, isLoading, error } = useGetShippingLabelQuery(bookingId)
    const label = data?.data

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className='modal modal-open bg-black/70 backdrop-blur-sm z-50'>
            <div className='modal-box max-w-md rounded-3xl bg-base-100 p-6 space-y-4 border border-base-content/10 shadow-2xl relative'>
                <button
                    onClick={onClose}
                    className='btn btn-sm btn-circle btn-ghost absolute right-4 top-4'
                >
                    <X className='w-4 h-4' />
                </button>

                <div className='flex items-center gap-2'>
                    <FileText className='w-5 h-5 text-primary' />
                    <h3 className='text-lg font-black text-base-content'>
                        Physical Shipping Label
                    </h3>
                </div>

                {isLoading ? (
                    <div className='py-12 flex flex-col items-center gap-3'>
                        <Loader2 className='w-8 h-8 text-primary animate-spin' />
                        <span className='text-xs opacity-60'>
                            Generating shipping label...
                        </span>
                    </div>
                ) : error ? (
                    <div className='alert alert-error text-xs rounded-2xl'>
                        <ShieldAlert className='w-4 h-4 shrink-0' />
                        <span>
                            {error?.data?.message ||
                                'Failed to load shipping label'}
                        </span>
                    </div>
                ) : (
                    <div className='space-y-4'>
                        {/* Printable Manifest Box */}
                        <div
                            id='printable-shipping-label'
                            className='border-2 border-dashed border-base-content/30 rounded-2xl p-4 bg-base-200/40 space-y-3 font-sans text-xs'
                        >
                            {/* Courier & Tracking Header */}
                            <div className='flex justify-between items-start border-b border-base-content/10 pb-2.5'>
                                <div>
                                    <span className='text-[10px] uppercase font-bold text-base-content/50 block'>
                                        Courier Partner
                                    </span>
                                    <span className='font-black text-sm text-primary uppercase'>
                                        {label?.courierService ||
                                            'Standard Dispatch'}
                                    </span>
                                </div>
                                <div className='text-right'>
                                    <span className='text-[10px] uppercase font-bold text-base-content/50 block'>
                                        Tracking / POD
                                    </span>
                                    <span className='font-mono font-black text-xs text-base-content'>
                                        {label?.trackingNumber || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Recipient Details */}
                            <div className='space-y-1'>
                                <span className='text-[10px] uppercase font-bold text-base-content/50 block'>
                                    Ship To:
                                </span>
                                <div className='font-bold text-sm text-base-content'>
                                    {label?.recipientName}
                                </div>
                                <div className='text-base-content/80 flex items-start gap-1.5 leading-relaxed'>
                                    <MapPin className='w-3.5 h-3.5 text-primary shrink-0 mt-0.5' />
                                    <span>{label?.deliveryAddress}</span>
                                </div>
                                <div className='flex items-center gap-4 text-[11px] text-base-content/70 pt-1 font-mono'>
                                    <span className='flex items-center gap-1'>
                                        <Phone className='w-3 h-3 text-primary' />{' '}
                                        {label?.recipientContact}
                                    </span>
                                    <span className='flex items-center gap-1 truncate'>
                                        <Mail className='w-3 h-3 text-primary' />{' '}
                                        {label?.recipientEmail}
                                    </span>
                                </div>
                            </div>

                            {/* Item / Event Reference */}
                            <div className='border-t border-base-content/10 pt-2 flex justify-between items-center text-[11px]'>
                                <div>
                                    <span className='text-[10px] opacity-50 block'>
                                        Contents:
                                    </span>
                                    <span className='font-bold text-base-content truncate max-w-[200px] block'>
                                        {label?.eventTitle}
                                    </span>
                                </div>
                                <div className='badge badge-neutral font-mono text-[9px] font-bold uppercase'>
                                    {label?.despatchStatus}
                                </div>
                            </div>
                        </div>

                        {/* Modal Action Footer */}
                        <div className='flex gap-2 pt-1'>
                            <button
                                onClick={handlePrint}
                                className='btn btn-sm btn-primary rounded-xl font-bold gap-1.5 flex-1'
                            >
                                <Printer className='w-4 h-4' /> Print Label
                            </button>
                            <button
                                onClick={onClose}
                                className='btn btn-sm btn-ghost rounded-xl'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Dedicated Dynamic Courier Dispatch Modal Component
const CourierDispatchModal = ({ booking, onClose, onDispatchSuccess }) => {
    const { data: courierData, isLoading: loadingCouriers } =
        useGetCouriersQuery()
    const couriers = courierData?.data || []

    const [createCourier, { isLoading: isCreatingCourier }] =
        useCreateCourierMutation()
    const [deleteCourier] = useDeleteCourierMutation()
    const [updateDispatch, { isLoading: isDispatching }] =
        useUpdateDispatchStatusMutation()

    const [selectedCourier, setSelectedCourier] = useState('')
    const [podId, setPodId] = useState('')
    const [showManage, setShowManage] = useState(false)
    const [newCourierName, setNewCourierName] = useState('')

    // Set initial courier selection once data loads
    useEffect(() => {
        if (couriers.length > 0 && !selectedCourier) {
            setSelectedCourier(couriers[0].name)
        }
    }, [couriers, selectedCourier])

    const handleAddCourier = async (e) => {
        e.preventDefault()
        if (!newCourierName.trim()) return
        try {
            await createCourier({ name: newCourierName.trim() }).unwrap()
            setSelectedCourier(newCourierName.trim())
            setNewCourierName('')
        } catch (err) {
            alert(err?.data?.message || 'Failed to add courier')
        }
    }

    const handleDeleteCourier = async (id, name) => {
        if (!window.confirm(`Remove "${name}" from courier list?`)) return
        try {
            await deleteCourier(id).unwrap()
        } catch (err) {
            alert(err?.data?.message || 'Failed to delete courier')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const courierToUse = selectedCourier || couriers[0]?.name
        if (!courierToUse) {
            return alert('Please select or add a courier service')
        }
        if (!podId.trim()) {
            return alert('Please enter tracking / POD number')
        }

        try {
            await updateDispatch({
                id: booking._id,
                courierName: courierToUse,
                podId: podId.trim(),
            }).unwrap()
            onDispatchSuccess()
        } catch (err) {
            alert(
                err?.data?.message ||
                    'Failed to update courier dispatch status',
            )
        }
    }

    return (
        <div className='modal modal-open bg-black/60 backdrop-blur-sm z-50'>
            <div className='modal-box rounded-3xl max-w-sm p-6 space-y-4 border border-base-content/10'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                        <Truck className='w-5 h-5 text-primary' />
                        <h3 className='font-bold text-base text-base-content'>
                            Courier Ticket Dispatch
                        </h3>
                    </div>
                    <button
                        type='button'
                        onClick={() => setShowManage((prev) => !prev)}
                        className='btn btn-ghost btn-xs text-primary font-bold'
                    >
                        {showManage ? 'Back to Form' : '+ Manage List'}
                    </button>
                </div>

                <p className='text-xs opacity-70'>
                    Attendee:{' '}
                    <span className='font-bold text-base-content'>
                        {booking.user?.userName}
                    </span>
                    <br />
                    Event:{' '}
                    <span className='font-bold text-base-content'>
                        {booking.event?.title}
                    </span>
                </p>

                {showManage ? (
                    <div className='space-y-3 bg-base-200/60 p-3 rounded-2xl border border-base-content/10'>
                        <span className='text-[10px] uppercase font-bold text-base-content/60 block'>
                            Admin: Add Courier Partner
                        </span>
                        <div className='flex gap-1.5'>
                            <input
                                type='text'
                                placeholder='Courier Name (e.g. FedEx)'
                                value={newCourierName}
                                onChange={(e) =>
                                    setNewCourierName(e.target.value)
                                }
                                className='input input-xs input-bordered w-full rounded-lg text-xs'
                            />
                            <button
                                type='button'
                                onClick={handleAddCourier}
                                disabled={
                                    isCreatingCourier || !newCourierName.trim()
                                }
                                className='btn btn-xs btn-primary rounded-lg font-bold'
                            >
                                Add
                            </button>
                        </div>

                        <div className='max-h-32 overflow-y-auto space-y-1 pt-1'>
                            {couriers.map((c) => (
                                <div
                                    key={c._id}
                                    className='flex items-center justify-between text-xs bg-base-100 px-2.5 py-1 rounded-lg border border-base-content/5'
                                >
                                    <span className='font-medium text-base-content'>
                                        {c.name}
                                    </span>
                                    <button
                                        type='button'
                                        onClick={() =>
                                            handleDeleteCourier(c._id, c.name)
                                        }
                                        className='text-error hover:opacity-80 p-0.5'
                                        title='Delete courier'
                                    >
                                        <X className='w-3 h-3' />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className='space-y-3 pt-1'>
                        <div>
                            <label className='text-[11px] font-bold block mb-1'>
                                Courier Service
                            </label>
                            {loadingCouriers ? (
                                <div className='flex items-center gap-2 py-2 text-xs opacity-50'>
                                    <Loader2 className='w-3 h-3 animate-spin' />{' '}
                                    Loading couriers...
                                </div>
                            ) : couriers.length === 0 ? (
                                <div className='text-xs text-error py-1'>
                                    No couriers available.{' '}
                                    <button
                                        type='button'
                                        onClick={() => setShowManage(true)}
                                        className='underline font-bold'
                                    >
                                        Add one now
                                    </button>
                                </div>
                            ) : (
                                <select
                                    value={selectedCourier || couriers[0]?.name}
                                    onChange={(e) =>
                                        setSelectedCourier(e.target.value)
                                    }
                                    className='select select-sm select-bordered w-full rounded-xl text-xs'
                                >
                                    {couriers.map((c) => (
                                        <option key={c._id} value={c.name}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className='text-[11px] font-bold block mb-1'>
                                POD / Waybill / Tracking Number
                            </label>
                            <input
                                type='text'
                                required
                                placeholder='e.g. BLUEDART98721345'
                                value={podId}
                                onChange={(e) => setPodId(e.target.value)}
                                className='input input-sm input-bordered w-full rounded-xl font-mono text-xs'
                            />
                        </div>

                        <div className='modal-action pt-2'>
                            <button
                                type='button'
                                onClick={onClose}
                                className='btn btn-sm btn-ghost rounded-xl'
                            >
                                Cancel
                            </button>
                            <button
                                type='submit'
                                disabled={
                                    isDispatching || couriers.length === 0
                                }
                                className='btn btn-sm btn-primary rounded-xl font-bold gap-1'
                            >
                                {isDispatching ? (
                                    <>
                                        <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                        Dispatching...
                                    </>
                                ) : (
                                    <>
                                        <PackageCheck className='w-4 h-4' />{' '}
                                        Confirm Dispatch
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}

const AdminBookingsScreen = () => {
    const { data, isLoading, error } = useGetAllBookingsQuery()
    const bookings = data?.data || []

    const [approvePayment, { isLoading: isApproving }] =
        useApprovePaymentMutation()
    const [processRefund, { isLoading: isRefunding }] =
        useProcessRefundMutation()

    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Modal UI states
    const [dispatchModalBooking, setDispatchModalBooking] = useState(null)
    const [labelModalBookingId, setLabelModalBookingId] = useState(null)

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
            b.despatchDetails?.podId
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
        if (statusFilter === 'not_dispatched') {
            return (
                matchesSearch &&
                b.paymentStatus === 'paid' &&
                b.despatchStatus === 'not_dispatched'
            )
        }
        if (statusFilter === 'dispatched') {
            return matchesSearch && b.despatchStatus === 'dispatched'
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
                        Review offline transaction proofs, dispatch physical
                        tickets, and authorize settlements
                    </p>
                </div>

                <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
                    <div className='relative flex-1 sm:w-64'>
                        <input
                            type='text'
                            placeholder='Search UTR, POD, name, or event...'
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
                        <option value='confirmed'>Confirmed & Paid</option>
                        <option value='not_dispatched'>
                            Ready for Dispatch
                        </option>
                        <option value='dispatched'>Dispatched Orders</option>
                        <option value='refund_requested'>
                            Refund Requests
                        </option>
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
                    {/* 1. DESKTOP VIEW */}
                    <div className='hidden lg:block overflow-x-auto bg-base-100 rounded-3xl border border-base-content/10 shadow-sm'>
                        <table className='table table-sm w-full text-xs'>
                            <thead className='bg-base-200/50 uppercase text-[10px] tracking-wider text-base-content/70 font-bold'>
                                <tr>
                                    <th>Attendee</th>
                                    <th>Event Details</th>
                                    <th>Tier & Qty</th>
                                    <th>Total</th>
                                    <th>Payment Proof</th>
                                    <th>Status & Dispatch</th>
                                    <th className='text-right pr-4'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-base-content/5'>
                                {filteredBookings.map((b) => {
                                    const isTerminal =
                                        [
                                            'refund_issued',
                                            'refunded',
                                            'cancelled',
                                            'rejected',
                                        ].includes(b.bookingStatus) ||
                                        b.paymentStatus === 'refunded'

                                    const canApproveOffline =
                                        !isTerminal &&
                                        b.paymentStatus !== 'paid' &&
                                        (b.paymentStatus ===
                                            'pending_verification' ||
                                            b.paymentStatus === 'not_paid') &&
                                        b.bookingStatus !== 'refund_requested'

                                    const canDispatch =
                                        !isTerminal &&
                                        b.paymentStatus === 'paid' &&
                                        b.bookingStatus === 'confirmed' &&
                                        b.despatchStatus === 'not_dispatched'

                                    const isDispatched =
                                        b.despatchStatus === 'dispatched' ||
                                        b.despatchStatus === 'received'

                                    return (
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
                                                                    b
                                                                        .paymentDetails
                                                                        .trxnId
                                                                }
                                                            </span>
                                                        </div>
                                                        <span className='badge badge-xs badge-outline uppercase text-[9px] font-bold'>
                                                            {
                                                                b.paymentDetails
                                                                    .mode
                                                            }
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
                                                    <div className='flex items-center gap-1'>
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
                                                                        : 'badge-error'
                                                            }`}
                                                        >
                                                            Pay:{' '}
                                                            {b.paymentStatus}
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
                                                            Book:{' '}
                                                            {b.bookingStatus}
                                                        </span>
                                                    </div>

                                                    {/* Dispatch Badge */}
                                                    <div className='flex items-center gap-1 text-[10px]'>
                                                        <span
                                                            className={`badge badge-xs gap-1 font-bold ${
                                                                b.despatchStatus ===
                                                                'dispatched'
                                                                    ? 'badge-neutral text-neutral-content'
                                                                    : b.despatchStatus ===
                                                                        'received'
                                                                      ? 'badge-success'
                                                                      : 'badge-ghost opacity-70'
                                                            }`}
                                                        >
                                                            <Truck className='w-2.5 h-2.5' />{' '}
                                                            {b.despatchStatus?.replace(
                                                                '_',
                                                                ' ',
                                                            )}
                                                        </span>
                                                        {b.despatchDetails
                                                            ?.podId && (
                                                            <span className='font-mono text-[9px] opacity-70 truncate max-w-[120px]'>
                                                                POD:{' '}
                                                                {
                                                                    b
                                                                        .despatchDetails
                                                                        .podId
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className='text-right pr-4 space-x-1.5 whitespace-nowrap'>
                                                {/* Terminal State Badge */}
                                                {isTerminal && (
                                                    <span className='badge badge-ghost badge-xs font-mono opacity-50'>
                                                        Settled / Closed
                                                    </span>
                                                )}

                                                {/* Approve Offline Payment */}
                                                {canApproveOffline && (
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

                                                {/* Courier Dispatch Action */}
                                                {canDispatch && (
                                                    <button
                                                        onClick={() =>
                                                            setDispatchModalBooking(
                                                                b,
                                                            )
                                                        }
                                                        className='btn btn-xs btn-outline btn-primary rounded-xl font-bold gap-1'
                                                        title='Add tracking & mark physical tickets as dispatched'
                                                    >
                                                        <Truck className='w-3 h-3' />{' '}
                                                        Dispatch
                                                    </button>
                                                )}

                                                {/* Shipping Label View Action */}
                                                {isDispatched && (
                                                    <button
                                                        onClick={() =>
                                                            setLabelModalBookingId(
                                                                b._id,
                                                            )
                                                        }
                                                        className='btn btn-xs btn-ghost text-primary hover:bg-primary/10 rounded-xl gap-1'
                                                        title='View & Print Shipping Label'
                                                    >
                                                        <FileText className='w-3 h-3' />{' '}
                                                        Label
                                                    </button>
                                                )}

                                                {/* Refund Request Decision */}
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
                                                            disabled={
                                                                isRefunding
                                                            }
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
                                                            disabled={
                                                                isRefunding
                                                            }
                                                            className='btn btn-xs btn-ghost rounded-xl'
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* 2. MOBILE & TABLET CARD VIEW */}
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden'>
                        {filteredBookings.map((b) => {
                            const isTerminal =
                                [
                                    'refund_issued',
                                    'refunded',
                                    'cancelled',
                                    'rejected',
                                ].includes(b.bookingStatus) ||
                                b.paymentStatus === 'refunded'

                            const canApproveOffline =
                                !isTerminal &&
                                b.paymentStatus !== 'paid' &&
                                (b.paymentStatus === 'pending_verification' ||
                                    b.paymentStatus === 'not_paid') &&
                                b.bookingStatus !== 'refund_requested'

                            const canDispatch =
                                !isTerminal &&
                                b.paymentStatus === 'paid' &&
                                b.bookingStatus === 'confirmed' &&
                                b.despatchStatus === 'not_dispatched'

                            const isDispatched =
                                b.despatchStatus === 'dispatched' ||
                                b.despatchStatus === 'received'

                            return (
                                <div
                                    key={b._id}
                                    className='card bg-base-100 border border-base-content/10 shadow-sm rounded-2xl p-4 space-y-3.5'
                                >
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

                                    {/* Status & Dispatch Badges */}
                                    <div className='space-y-1.5'>
                                        <div className='flex flex-wrap items-center justify-between gap-1.5 text-xs'>
                                            <div className='flex items-center gap-1'>
                                                <span
                                                    className={`badge badge-xs font-bold uppercase ${
                                                        b.paymentStatus ===
                                                        'paid'
                                                            ? 'badge-success'
                                                            : b.paymentStatus ===
                                                                'pending_verification'
                                                              ? 'badge-info'
                                                              : 'badge-error'
                                                    }`}
                                                >
                                                    {b.paymentStatus}
                                                </span>
                                                <span
                                                    className={`badge badge-xs font-bold uppercase ${
                                                        b.bookingStatus ===
                                                        'confirmed'
                                                            ? 'badge-success'
                                                            : 'badge-ghost'
                                                    }`}
                                                >
                                                    {b.bookingStatus}
                                                </span>
                                            </div>
                                            <span
                                                className={`badge badge-xs gap-1 font-bold ${
                                                    b.despatchStatus ===
                                                    'dispatched'
                                                        ? 'badge-neutral text-neutral-content'
                                                        : 'badge-ghost opacity-70'
                                                }`}
                                            >
                                                <Truck className='w-2.5 h-2.5' />{' '}
                                                {b.despatchStatus?.replace(
                                                    '_',
                                                    ' ',
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className='pt-2 border-t border-base-content/10 flex flex-wrap items-center justify-end gap-2'>
                                        {isTerminal && (
                                            <span className='badge badge-ghost badge-xs font-mono opacity-50'>
                                                Settled / Closed
                                            </span>
                                        )}

                                        {canApproveOffline && (
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

                                        {canDispatch && (
                                            <button
                                                onClick={() =>
                                                    setDispatchModalBooking(b)
                                                }
                                                className='btn btn-xs btn-outline btn-primary rounded-xl font-bold gap-1 flex-1'
                                            >
                                                <Truck className='w-3 h-3' />{' '}
                                                Dispatch
                                            </button>
                                        )}

                                        {isDispatched && (
                                            <button
                                                onClick={() =>
                                                    setLabelModalBookingId(
                                                        b._id,
                                                    )
                                                }
                                                className='btn btn-xs btn-ghost text-primary hover:bg-primary/10 rounded-xl gap-1'
                                            >
                                                <FileText className='w-3 h-3' />{' '}
                                                Shipping Label
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
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* Courier Dispatch Submission Modal */}
            {dispatchModalBooking && (
                <CourierDispatchModal
                    booking={dispatchModalBooking}
                    onClose={() => setDispatchModalBooking(null)}
                    onDispatchSuccess={() => setDispatchModalBooking(null)}
                />
            )}

            {/* Physical Shipping Label Modal */}
            {labelModalBookingId && (
                <ShippingLabelModal
                    bookingId={labelModalBookingId}
                    onClose={() => setLabelModalBookingId(null)}
                />
            )}
        </div>
    )
}

export default AdminBookingsScreen
