// frontend/src/pages/admin/AdminEventsScreen.jsx

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    useGetEventsQuery,
    useDeleteEventMutation,
} from '../../redux/api/eventsApiSlice'
import {
    Calendar,
    Plus,
    Edit2,
    Trash2,
    MapPin,
    Tag,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Search,
    Ticket,
    Filter,
} from 'lucide-react'

const AdminEventsScreen = () => {
    const navigate = useNavigate()

    // Pass status: 'all' to ensure drafts, coming_soon, published, and sold_out events are all returned
    const {
        data: eventsData,
        isLoading,
        error,
    } = useGetEventsQuery({ status: 'all' })
    const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation()

    const [searchTerm, setSearchTerm] = useState('')
    const [selectedStatus, setSelectedStatus] = useState('all')
    const [selectedVenue, setSelectedVenue] = useState('all')
    const [scheduleSort, setScheduleSort] = useState('earliest')
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' })

    const events = eventsData?.data || []

    // Distinct venues for the filter dropdown
    const uniqueVenues = Array.from(
        new Set(events.map((e) => e.venueId?.name).filter(Boolean)),
    )

    const handleDelete = async (event) => {
        const totalSold = event.ticketTiers?.reduce(
            (sum, t) => sum + (t.soldQuantity || 0),
            0,
        )

        if (totalSold > 0) {
            alert(
                `Cannot delete "${event.title}" because ${totalSold} ticket(s) have already been booked. Edit the status to "cancelled" instead.`,
            )
            return
        }

        if (
            !window.confirm(`Are you sure you want to delete "${event.title}"?`)
        ) {
            return
        }

        setStatusMessage({ type: '', text: '' })
        try {
            await deleteEvent(event._id).unwrap()
            setStatusMessage({
                type: 'success',
                text: `Event "${event.title}" removed successfully.`,
            })
        } catch (err) {
            setStatusMessage({
                type: 'error',
                text:
                    err?.data?.message ||
                    err?.error ||
                    'Failed to delete event.',
            })
        }
    }

    // Multi-Criteria In-Memory Filter & Sorter
    const filteredEvents = events
        .filter((e) => {
            const term = searchTerm.toLowerCase().trim()
            const matchesSearch =
                !term ||
                e.title?.toLowerCase().includes(term) ||
                e.venueId?.name?.toLowerCase().includes(term) ||
                e.venueId?.city?.toLowerCase().includes(term) ||
                e.categoryId?.eventCategory?.toLowerCase().includes(term) ||
                new Date(e.startDate)
                    .toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                    })
                    .toLowerCase()
                    .includes(term)

            const matchesStatus =
                selectedStatus === 'all' || e.status === selectedStatus

            const matchesVenue =
                selectedVenue === 'all' || e.venueId?.name === selectedVenue

            return matchesSearch && matchesStatus && matchesVenue
        })
        .sort((a, b) => {
            if (scheduleSort === 'earliest') {
                return new Date(a.startDate) - new Date(b.startDate)
            }
            if (scheduleSort === 'latest') {
                return new Date(b.startDate) - new Date(a.startDate)
            }
            return 0
        })

    return (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                <div>
                    <h1 className='text-2xl sm:text-3xl font-black text-base-content flex items-center gap-2.5'>
                        <Calendar className='w-7 h-7 text-primary' /> Event
                        Management
                    </h1>
                    <p className='text-xs sm:text-sm text-base-content/70 mt-1'>
                        Review, modify, cancel, and manage tickets across all
                        system events
                    </p>
                </div>

                <Link
                    to='/admin/events/create'
                    className='btn btn-primary btn-sm rounded-xl font-bold gap-2 shadow-md shadow-primary/20'
                >
                    <Plus className='w-4 h-4' /> Create Event
                </Link>
            </div>

            {/* Notification alert */}
            {statusMessage.text && (
                <div
                    className={`alert text-xs rounded-2xl flex items-center gap-2 shadow-sm ${
                        statusMessage.type === 'success'
                            ? 'alert-success text-success-content'
                            : 'alert-error text-error-content'
                    }`}
                >
                    {statusMessage.type === 'success' ? (
                        <CheckCircle2 className='w-4 h-4 shrink-0' />
                    ) : (
                        <AlertCircle className='w-4 h-4 shrink-0' />
                    )}
                    <span>{statusMessage.text}</span>
                </div>
            )}

            {/* Filter & Search Toolbar */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-base-100 p-4 rounded-3xl border border-base-content/10 shadow-sm'>
                {/* Search by Title / Venue / Schedule */}
                <div className='relative'>
                    <input
                        type='text'
                        placeholder='Search name, venue, schedule...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='input input-bordered input-sm w-full pl-8 rounded-xl text-xs'
                    />
                    <Search className='w-3.5 h-3.5 absolute left-2.5 top-2.5 opacity-50' />
                </div>

                {/* Status Filter */}
                <div>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className='select select-bordered select-sm w-full rounded-xl text-xs font-semibold'
                    >
                        <option value='all'>All Statuses</option>
                        <option value='published'>Published</option>
                        <option value='coming_soon'>Coming Soon</option>
                        <option value='draft'>Draft</option>
                        <option value='sold_out'>Sold Out</option>
                        <option value='cancelled'>Cancelled</option>
                        <option value='completed'>Completed</option>
                    </select>
                </div>

                {/* Venue Filter */}
                <div>
                    <select
                        value={selectedVenue}
                        onChange={(e) => setSelectedVenue(e.target.value)}
                        className='select select-bordered select-sm w-full rounded-xl text-xs font-semibold'
                    >
                        <option value='all'>All Venues</option>
                        {uniqueVenues.map((v) => (
                            <option key={v} value={v}>
                                {v}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Schedule Sorter */}
                <div>
                    <select
                        value={scheduleSort}
                        onChange={(e) => setScheduleSort(e.target.value)}
                        className='select select-bordered select-sm w-full rounded-xl text-xs font-semibold'
                    >
                        <option value='earliest'>
                            Schedule: Earliest First
                        </option>
                        <option value='latest'>Schedule: Latest First</option>
                    </select>
                </div>
            </div>

            {/* Event List Table */}
            <div className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl overflow-hidden'>
                {isLoading ? (
                    <div className='py-16 flex flex-col items-center justify-center gap-2'>
                        <Loader2 className='w-6 h-6 text-primary animate-spin' />
                        <span className='text-xs opacity-60'>
                            Loading event records...
                        </span>
                    </div>
                ) : error ? (
                    <div className='p-6'>
                        <div className='alert alert-error text-xs rounded-2xl'>
                            <AlertCircle className='w-4 h-4 shrink-0' />
                            <span>
                                {error?.data?.message ||
                                    'Failed to load events.'}
                            </span>
                        </div>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className='py-16 text-center text-xs opacity-60 space-y-2'>
                        <p>No events match the selected filter criteria.</p>
                        {(searchTerm ||
                            selectedStatus !== 'all' ||
                            selectedVenue !== 'all') && (
                            <button
                                onClick={() => {
                                    setSearchTerm('')
                                    setSelectedStatus('all')
                                    setSelectedVenue('all')
                                }}
                                className='btn btn-xs btn-ghost rounded-xl text-primary font-bold'
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='table table-sm w-full text-xs'>
                            <thead className='bg-base-200/50 uppercase text-[10px] tracking-wider text-base-content/70 font-bold'>
                                <tr>
                                    <th>Event</th>
                                    <th>Location & Hall</th>
                                    <th>Schedule</th>
                                    <th>Sales / Capacity</th>
                                    <th>Status</th>
                                    <th className='text-right pr-4'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-base-content/5'>
                                {filteredEvents.map((evt) => {
                                    const totalSold = evt.ticketTiers?.reduce(
                                        (sum, t) => sum + (t.soldQuantity || 0),
                                        0,
                                    )
                                    const totalCap = evt.ticketTiers?.reduce(
                                        (sum, t) =>
                                            sum + (t.totalQuantity || 0),
                                        0,
                                    )

                                    return (
                                        <tr
                                            key={evt._id}
                                            className='hover:bg-base-200/30 transition-colors'
                                        >
                                            {/* Event Info */}
                                            <td>
                                                <div className='flex items-center gap-3'>
                                                    <img
                                                        src={
                                                            evt.posterImage
                                                                ?.url ||
                                                            '/placeholder-event.png'
                                                        }
                                                        alt={evt.title}
                                                        className='w-10 h-12 rounded-lg object-cover border border-base-content/10'
                                                    />
                                                    <div>
                                                        <span className='font-bold text-base-content line-clamp-1 max-w-xs block'>
                                                            {evt.title}
                                                        </span>
                                                        <span className='text-[10px] text-primary capitalize flex items-center gap-1 mt-0.5'>
                                                            <Tag className='w-3 h-3' />
                                                            {evt.categoryId
                                                                ?.eventCategory ||
                                                                'Event'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Venue */}
                                            <td>
                                                <div className='font-bold text-base-content'>
                                                    {evt.venueId?.name || 'N/A'}
                                                </div>
                                                <div className='text-[10px] opacity-60 flex items-center gap-1'>
                                                    <MapPin className='w-3 h-3 text-primary' />
                                                    {evt.venueId?.city}
                                                </div>
                                            </td>

                                            {/* Schedule */}
                                            <td>
                                                <div className='text-[11px] font-mono'>
                                                    {new Date(
                                                        evt.startDate,
                                                    ).toLocaleDateString(
                                                        'en-IN',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                        },
                                                    )}
                                                </div>
                                                <div className='text-[10px] opacity-60 font-mono'>
                                                    {new Date(
                                                        evt.startDate,
                                                    ).toLocaleTimeString(
                                                        'en-IN',
                                                        {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        },
                                                    )}
                                                </div>
                                            </td>

                                            {/* Tickets Sold */}
                                            <td>
                                                <div className='font-mono font-bold flex items-center gap-1'>
                                                    <Ticket className='w-3 h-3 text-primary' />
                                                    <span>
                                                        {totalSold} / {totalCap}
                                                    </span>
                                                </div>
                                                <div className='text-[10px] opacity-50 font-mono'>
                                                    {evt.ticketTiers?.length ||
                                                        0}{' '}
                                                    tier(s)
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td>
                                                <span
                                                    className={`badge badge-xs font-bold uppercase ${
                                                        evt.status ===
                                                        'published'
                                                            ? 'badge-success'
                                                            : evt.status ===
                                                                'coming_soon'
                                                              ? 'badge-warning'
                                                              : evt.status ===
                                                                  'sold_out'
                                                                ? 'badge-info'
                                                                : 'badge-ghost'
                                                    }`}
                                                >
                                                    {evt.status}
                                                </span>
                                            </td>

                                            {/* Action Buttons */}
                                            <td className='text-right pr-4 space-x-1 whitespace-nowrap'>
                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/events/${evt._id}/edit`,
                                                        )
                                                    }
                                                    className='btn btn-ghost btn-xs rounded-lg'
                                                    title='Edit Event'
                                                >
                                                    <Edit2 className='w-3.5 h-3.5 text-primary' />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDelete(evt)
                                                    }
                                                    disabled={isDeleting}
                                                    className='btn btn-ghost btn-xs rounded-lg text-error hover:bg-error/10'
                                                    title='Delete Event'
                                                >
                                                    <Trash2 className='w-3.5 h-3.5' />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminEventsScreen
