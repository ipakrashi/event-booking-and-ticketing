// frontend/src/pages/admin/AdminReviewsScreen.jsx

import { useState } from 'react'
import {
    useGetAllReviewsForModerationQuery,
    useModerateReviewDirectMutation,
    useGetEventsQuery,
} from '../../redux/api/eventsApiSlice'
import {
    Star,
    CheckCircle,
    XCircle,
    PauseCircle,
    Search,
    ShieldAlert,
    Loader2,
    Calendar,
    User,
    MessageSquare,
    Check,
    X,
    Clock,
} from 'lucide-react'

const AdminReviewsScreen = () => {
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedEventId, setSelectedEventId] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    const { data: eventsData } = useGetEventsQuery()
    const events = eventsData?.data || []

    const { data, isLoading, error } = useGetAllReviewsForModerationQuery({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        eventId: selectedEventId || undefined,
    })
    const reviews = data?.data || []

    const [moderateReview, { isLoading: isModerating }] =
        useModerateReviewDirectMutation()

    const handleModerate = async (reviewId, newStatus) => {
        let remarks = undefined
        if (newStatus === 'rejected') {
            const promptReason = window.prompt(
                'Enter internal reason for rejecting this review (optional):',
            )
            if (promptReason === null) return
            remarks = promptReason.trim() || undefined
        }

        try {
            await moderateReview({
                reviewId,
                status: newStatus,
                moderationRemarks: remarks,
            }).unwrap()
        } catch (err) {
            alert(
                err?.data?.message || `Failed to update status to ${newStatus}`,
            )
        }
    }

    const filteredReviews = reviews.filter((r) => {
        const matchesSearch =
            r.user?.userName
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            r.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.comment?.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesSearch
    })

    const pendingCount = reviews.filter((r) => r.status === 'pending').length
    const approvedCount = reviews.filter((r) => r.status === 'approved').length
    const holdCount = reviews.filter((r) => r.status === 'on_hold').length
    const rejectedCount = reviews.filter((r) => r.status === 'rejected').length

    if (isLoading) {
        return (
            <div className='min-h-[60vh] flex flex-col items-center justify-center gap-3'>
                <Loader2 className='w-8 h-8 text-primary animate-spin' />
                <p className='text-xs opacity-60'>
                    Loading moderation queue...
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
                        {error?.data?.message || 'Failed to load reviews'}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6'>
            {/* Header */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl sm:text-3xl font-black text-base-content flex items-center gap-2'>
                        <MessageSquare className='w-7 h-7 text-primary shrink-0' />
                        <span>Review Moderation Console</span>
                    </h1>
                    <p className='text-xs sm:text-sm text-base-content/70 mt-1'>
                        Review verified attendee feedback before publishing to
                        public event pages
                    </p>
                </div>

                {/* Search & Event Selector */}
                <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
                    <div className='relative flex-1 sm:w-64'>
                        <input
                            type='text'
                            placeholder='Search attendee, event, or keyword...'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className='input input-sm input-bordered w-full pl-8 rounded-xl text-xs'
                        />
                        <Search className='w-3.5 h-3.5 absolute left-2.5 top-2.5 opacity-50' />
                    </div>

                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className='select select-sm select-bordered rounded-xl text-xs font-semibold sm:max-w-xs truncate'
                    >
                        <option value=''>All Events</option>
                        {events.map((ev) => (
                            <option key={ev._id} value={ev._id}>
                                {ev.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Quick Filter Status Pills */}
            <div className='flex flex-wrap items-center gap-2 border-b border-base-content/10 pb-4'>
                <button
                    onClick={() => setStatusFilter('all')}
                    className={`btn btn-xs rounded-xl font-bold ${
                        statusFilter === 'all'
                            ? 'btn-neutral'
                            : 'btn-ghost text-base-content/60'
                    }`}
                >
                    All ({reviews.length})
                </button>
                <button
                    onClick={() => setStatusFilter('pending')}
                    className={`btn btn-xs rounded-xl font-bold gap-1 ${
                        statusFilter === 'pending'
                            ? 'btn-warning text-warning-content'
                            : 'btn-ghost text-amber-500'
                    }`}
                >
                    <Clock className='w-3 h-3' /> Pending ({pendingCount})
                </button>
                <button
                    onClick={() => setStatusFilter('approved')}
                    className={`btn btn-xs rounded-xl font-bold gap-1 ${
                        statusFilter === 'approved'
                            ? 'btn-success text-success-content'
                            : 'btn-ghost text-success'
                    }`}
                >
                    <CheckCircle className='w-3 h-3' /> Approved (
                    {approvedCount})
                </button>
                <button
                    onClick={() => setStatusFilter('on_hold')}
                    className={`btn btn-xs rounded-xl font-bold gap-1 ${
                        statusFilter === 'on_hold'
                            ? 'btn-info text-info-content'
                            : 'btn-ghost text-info'
                    }`}
                >
                    <PauseCircle className='w-3 h-3' /> On Hold ({holdCount})
                </button>
                <button
                    onClick={() => setStatusFilter('rejected')}
                    className={`btn btn-xs rounded-xl font-bold gap-1 ${
                        statusFilter === 'rejected'
                            ? 'btn-error text-error-content'
                            : 'btn-ghost text-error'
                    }`}
                >
                    <XCircle className='w-3 h-3' /> Rejected ({rejectedCount})
                </button>
            </div>

            {filteredReviews.length === 0 ? (
                <div className='bg-base-100 rounded-3xl p-10 text-center border border-base-content/10 max-w-md mx-auto space-y-2'>
                    <CheckCircle className='w-8 h-8 text-success mx-auto opacity-50' />
                    <h3 className='font-bold text-sm'>No reviews found</h3>
                    <p className='text-xs opacity-60'>
                        The selected filter criteria has no matching reviews in
                        queue.
                    </p>
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {filteredReviews.map((r) => {
                        const isPending = r.status === 'pending'
                        const isApproved = r.status === 'approved'
                        const isOnHold = r.status === 'on_hold'
                        const isRejected = r.status === 'rejected'

                        return (
                            <div
                                key={r._id}
                                className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-5 space-y-3.5 hover:border-base-content/20 transition-all'
                            >
                                {/* Header: Attendee & Event */}
                                <div className='flex items-start justify-between gap-2'>
                                    <div className='min-w-0'>
                                        <div className='font-bold text-sm text-base-content flex items-center gap-1.5'>
                                            <User className='w-3.5 h-3.5 text-primary shrink-0' />
                                            <span className='truncate'>
                                                {r.user?.userName ||
                                                    'Anonymous'}
                                            </span>
                                            {r.isVerifiedAttendee && (
                                                <span className='badge badge-xs badge-success text-[9px] font-mono'>
                                                    Checked In
                                                </span>
                                            )}
                                        </div>
                                        <div className='text-[11px] opacity-60 font-mono truncate'>
                                            {r.user?.email}
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <span
                                        className={`badge badge-xs font-bold uppercase text-[9px] px-2 py-1 ${
                                            isApproved
                                                ? 'badge-success'
                                                : isPending
                                                  ? 'badge-warning text-warning-content'
                                                  : isOnHold
                                                    ? 'badge-info'
                                                    : 'badge-error'
                                        }`}
                                    >
                                        {r.status.replace('_', ' ')}
                                    </span>
                                </div>

                                {/* Event info & Rating */}
                                <div className='bg-base-200/50 p-2.5 rounded-xl space-y-1.5 text-xs'>
                                    <div className='flex items-center justify-between gap-2'>
                                        <div className='font-semibold text-base-content truncate flex items-center gap-1'>
                                            <Calendar className='w-3 h-3 text-primary shrink-0' />
                                            <span>{r.event?.title}</span>
                                        </div>
                                        <div className='flex items-center gap-0.5 shrink-0'>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-3 h-3 ${
                                                        star <= r.rating
                                                            ? 'text-amber-400 fill-amber-400'
                                                            : 'text-base-content/20'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className='text-xs text-base-content/80 leading-relaxed italic bg-base-100 p-2.5 rounded-lg border border-base-content/5'>
                                        "{r.comment}"
                                    </p>
                                </div>

                                {/* Moderator notes if any */}
                                {r.moderationRemarks && (
                                    <div className='text-[10px] text-base-content/60 bg-base-200/60 p-2 rounded-lg'>
                                        <span className='font-bold'>Note:</span>{' '}
                                        {r.moderationRemarks}
                                    </div>
                                )}

                                {/* Moderation Actions */}
                                <div className='pt-2 border-t border-base-content/10 flex flex-wrap items-center justify-end gap-1.5'>
                                    {!isApproved && (
                                        <button
                                            onClick={() =>
                                                handleModerate(
                                                    r._id,
                                                    'approved',
                                                )
                                            }
                                            disabled={isModerating}
                                            className='btn btn-xs btn-success text-success-content rounded-xl font-bold gap-1'
                                            title='Approve and publish review to event page'
                                        >
                                            <Check className='w-3 h-3' />{' '}
                                            Approve
                                        </button>
                                    )}

                                    {!isOnHold && (
                                        <button
                                            onClick={() =>
                                                handleModerate(r._id, 'on_hold')
                                            }
                                            disabled={isModerating}
                                            className='btn btn-xs btn-ghost text-info hover:bg-info/10 rounded-xl gap-1'
                                            title='Hold review for secondary check'
                                        >
                                            <PauseCircle className='w-3 h-3' />{' '}
                                            Hold
                                        </button>
                                    )}

                                    {!isRejected && (
                                        <button
                                            onClick={() =>
                                                handleModerate(
                                                    r._id,
                                                    'rejected',
                                                )
                                            }
                                            disabled={isModerating}
                                            className='btn btn-xs btn-ghost text-error hover:bg-error/10 rounded-xl gap-1'
                                            title='Reject review'
                                        >
                                            <X className='w-3 h-3' /> Reject
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default AdminReviewsScreen
