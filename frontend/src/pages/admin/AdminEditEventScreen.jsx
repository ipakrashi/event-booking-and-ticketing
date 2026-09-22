// frontend/src/pages/admin/AdminEditEventScreen.jsx

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    useGetEventByIdQuery,
    useUpdateEventMutation,
} from '../../redux/api/eventsApiSlice'
import { useGetCategoriesQuery } from '../../redux/api/categoriesApiSlice'
import { useGetVenuesQuery } from '../../redux/api/venuesApiSlice'
import {
    Calendar,
    Upload,
    Plus,
    Trash2,
    Building2,
    Tag,
    Ticket,
    AlertCircle,
    CheckCircle2,
    Loader2,
    ArrowLeft,
} from 'lucide-react'

const AdminEditEventScreen = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const { data: eventData, isLoading: isLoadingEvent } =
        useGetEventByIdQuery(id)
    const { data: categoryData } = useGetCategoriesQuery()
    const { data: venueData } = useGetVenuesQuery()

    const [updateEvent, { isLoading: isUpdating }] = useUpdateEventMutation()

    const categories = categoryData?.data || []
    const venues = venueData?.data || []
    const event = eventData?.data

    // Form inputs
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [venueId, setVenueId] = useState('')
    const [auditoriumId, setAuditoriumId] = useState('')
    const [screenId, setScreenId] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [status, setStatus] = useState('published')
    const [isFeatured, setIsFeatured] = useState(false)
    const [isTopEvent, setIsTopEvent] = useState(false)

    // Poster
    const [posterFile, setPosterFile] = useState(null)
    const [posterPreview, setPosterPreview] = useState('')

    // Ticket Tiers
    const [ticketTiers, setTicketTiers] = useState([])
    const [hasCommittedSales, setHasCommittedSales] = useState(false)

    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    // Populate data when event is loaded
    useEffect(() => {
        if (event) {
            setTitle(event.title || '')
            setDescription(event.description || '')
            setCategoryId(event.categoryId?._id || event.categoryId || '')
            setVenueId(event.venueId?._id || event.venueId || '')
            setAuditoriumId(event.auditoriumId || '')
            setScreenId(event.screenId || '')

            if (event.startDate) {
                setStartDate(
                    new Date(event.startDate).toISOString().slice(0, 16),
                )
            }
            if (event.endDate) {
                setEndDate(new Date(event.endDate).toISOString().slice(0, 16))
            }

            setStatus(event.status || 'published')
            setIsFeatured(!!event.isFeatured)
            setIsTopEvent(!!event.isTopEvent)
            setPosterPreview(event.posterImage?.url || '')

            if (Array.isArray(event.ticketTiers)) {
                setTicketTiers(
                    event.ticketTiers.map((t) => ({
                        _id: t._id,
                        name: t.name,
                        price: t.price,
                        totalQuantity: t.totalQuantity,
                        soldQuantity: t.soldQuantity || 0,
                    })),
                )
                const sold = event.ticketTiers.some(
                    (t) => (t.soldQuantity || 0) > 0,
                )
                setHasCommittedSales(sold)
            }
        }
    }, [event])

    // Cascade lookups
    const selectedVenue = venues.find((v) => v._id === venueId)
    const availableAuditoriums = selectedVenue?.auditoriums || []
    const selectedAudi = availableAuditoriums.find(
        (a) => a._id === auditoriumId,
    )
    const availableScreens = selectedAudi?.screens || []
    const selectedScreen = availableScreens.find((s) => s._id === screenId)
    const screenCapacity = Number(
        selectedScreen?.seatingCapacity || selectedScreen?.capacity || 0,
    )

    const totalAllocatedSeats = ticketTiers.reduce(
        (sum, t) => sum + (Number(t.totalQuantity) || 0),
        0,
    )

    const handleAddTier = () => {
        if (hasCommittedSales) {
            alert('Cannot add new tiers after ticket sales have started.')
            return
        }
        setTicketTiers((prev) => [
            ...prev,
            { name: '', price: '', totalQuantity: '', soldQuantity: 0 },
        ])
    }

    const handleRemoveTier = (index) => {
        if (hasCommittedSales) {
            alert('Cannot delete tiers after ticket sales have started.')
            return
        }
        if (ticketTiers.length === 1) return
        setTicketTiers((prev) => prev.filter((_, i) => i !== index))
    }

    const handleTierChange = (index, field, value) => {
        setTicketTiers((prev) => {
            const next = [...prev]
            next[index][field] = value
            return next
        })
    }

    const handlePosterChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setPosterFile(file)
            setPosterPreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage('')
        setSuccessMessage('')

        if (new Date(endDate) < new Date(startDate)) {
            setErrorMessage('End date must be on or after start date.')
            return
        }

        if (screenCapacity > 0 && totalAllocatedSeats > screenCapacity) {
            setErrorMessage(
                `Allocated seats (${totalAllocatedSeats}) exceed screen capacity (${screenCapacity}).`,
            )
            return
        }

        const formData = new FormData()
        formData.append('title', title.trim())
        formData.append('description', description.trim())
        formData.append('categoryId', categoryId)
        formData.append('venueId', venueId)
        formData.append('auditoriumId', auditoriumId)
        formData.append('screenId', screenId)
        formData.append('startDate', new Date(startDate).toISOString())
        formData.append('endDate', new Date(endDate).toISOString())
        formData.append('status', status)
        formData.append('isFeatured', isFeatured)
        formData.append('isTopEvent', isTopEvent)
        formData.append(
            'ticketTiers',
            JSON.stringify(
                ticketTiers.map((t) => ({
                    ...(t._id && { _id: t._id }),
                    name: t.name.trim(),
                    price: Number(t.price),
                    totalQuantity: Number(t.totalQuantity),
                })),
            ),
        )

        if (posterFile) {
            formData.append('poster', posterFile)
        }

        try {
            await updateEvent({ id, formData }).unwrap()
            setSuccessMessage(`Event updated successfully!`)
            setTimeout(() => {
                navigate('/admin/events')
            }, 1200)
        } catch (err) {
            setErrorMessage(
                err?.data?.message || err?.error || 'Failed to update event.',
            )
        }
    }

    if (isLoadingEvent) {
        return (
            <div className='min-h-[60vh] flex flex-col items-center justify-center gap-2'>
                <Loader2 className='w-7 h-7 text-primary animate-spin' />
                <span className='text-xs opacity-60'>
                    Loading event specifications...
                </span>
            </div>
        )
    }

    return (
        <div className='max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6'>
            {/* Navigation Header */}
            <div className='flex items-center justify-between'>
                <button
                    onClick={() => navigate('/admin/events')}
                    className='btn btn-ghost btn-sm rounded-xl gap-2 text-xs font-semibold'
                >
                    <ArrowLeft className='w-4 h-4' /> Back to Events
                </button>
                <h1 className='text-xl sm:text-2xl font-black text-base-content flex items-center gap-2'>
                    <Calendar className='w-6 h-6 text-primary' /> Edit Event
                </h1>
            </div>

            {/* Error / Success Notifications */}
            {errorMessage && (
                <div className='alert alert-error text-xs rounded-2xl'>
                    <AlertCircle className='w-4 h-4 shrink-0' />
                    <span>{errorMessage}</span>
                </div>
            )}
            {successMessage && (
                <div className='alert alert-success text-xs rounded-2xl text-success-content'>
                    <CheckCircle2 className='w-4 h-4 shrink-0' />
                    <span>{successMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Event Basic Info */}
                <div className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-6 space-y-4'>
                    <h2 className='text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2'>
                        <Tag className='w-4 h-4' /> Event Information
                    </h2>

                    <div className='space-y-3'>
                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Title
                            </label>
                            <input
                                type='text'
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className='input input-bordered input-sm w-full rounded-xl text-xs'
                            />
                        </div>

                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Description
                            </label>
                            <textarea
                                required
                                rows='3'
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className='textarea textarea-bordered textarea-sm w-full rounded-xl text-xs'
                            />
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                            <div>
                                <label className='text-xs font-bold block mb-1'>
                                    Category
                                </label>
                                <select
                                    required
                                    value={categoryId}
                                    onChange={(e) =>
                                        setCategoryId(e.target.value)
                                    }
                                    className='select select-bordered select-sm w-full rounded-xl text-xs capitalize'
                                >
                                    {categories.map((c) => (
                                        <option key={c._id} value={c._id}>
                                            {c.eventCategory}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className='text-xs font-bold block mb-1'>
                                    Start Date
                                </label>
                                <input
                                    type='datetime-local'
                                    required
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    className='input input-bordered input-sm w-full rounded-xl text-xs'
                                />
                            </div>

                            <div>
                                <label className='text-xs font-bold block mb-1'>
                                    End Date
                                </label>
                                <input
                                    type='datetime-local'
                                    required
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className='input input-bordered input-sm w-full rounded-xl text-xs'
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location Hierarchy */}
                <div className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-6 space-y-4'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2'>
                            <Building2 className='w-4 h-4' /> Location & Hall
                        </h2>
                        {screenCapacity > 0 && (
                            <span className='badge badge-neutral text-xs font-mono font-bold'>
                                Hall Capacity: {screenCapacity}
                            </span>
                        )}
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Venue
                            </label>
                            <select
                                required
                                value={venueId}
                                onChange={(e) => {
                                    setVenueId(e.target.value)
                                    setAuditoriumId('')
                                    setScreenId('')
                                }}
                                className='select select-bordered select-sm w-full rounded-xl text-xs'
                            >
                                {venues.map((v) => (
                                    <option key={v._id} value={v._id}>
                                        {v.name} ({v.city})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Auditorium
                            </label>
                            <select
                                required
                                value={auditoriumId}
                                onChange={(e) => {
                                    setAuditoriumId(e.target.value)
                                    setScreenId('')
                                }}
                                className='select select-bordered select-sm w-full rounded-xl text-xs'
                            >
                                <option value=''>Choose Hall</option>
                                {availableAuditoriums.map((a) => (
                                    <option key={a._id} value={a._id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Screen / Zone
                            </label>
                            <select
                                required
                                value={screenId}
                                onChange={(e) => setScreenId(e.target.value)}
                                className='select select-bordered select-sm w-full rounded-xl text-xs'
                            >
                                <option value=''>Choose Screen</option>
                                {availableScreens.map((s) => (
                                    <option key={s._id} value={s._id}>
                                        {s.screenNumber} ({s.screenType} - Cap:{' '}
                                        {s.seatingCapacity})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Ticket Tiers */}
                <div className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-6 space-y-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h2 className='text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2'>
                                <Ticket className='w-4 h-4' /> Ticket Pricing &
                                Tiers
                            </h2>
                            <p className='text-[11px] text-base-content/60 mt-0.5'>
                                Allocated: {totalAllocatedSeats} /{' '}
                                {screenCapacity || '—'} seats
                            </p>
                        </div>

                        {!hasCommittedSales && (
                            <button
                                type='button'
                                onClick={handleAddTier}
                                className='btn btn-xs btn-primary rounded-xl font-bold gap-1'
                            >
                                <Plus className='w-3 h-3' /> Add Tier
                            </button>
                        )}
                    </div>

                    {hasCommittedSales && (
                        <div className='alert alert-warning text-xs rounded-xl'>
                            <span>
                                Ticket sales have started. Price and tier names
                                are locked to preserve integrity. Total
                                quantities may still be increased.
                            </span>
                        </div>
                    )}

                    <div className='space-y-2.5'>
                        {ticketTiers.map((tier, idx) => (
                            <div
                                key={idx}
                                className='grid grid-cols-12 gap-2 items-center bg-base-200/50 p-2.5 rounded-2xl'
                            >
                                <div className='col-span-5'>
                                    <input
                                        type='text'
                                        required
                                        disabled={hasCommittedSales}
                                        value={tier.name}
                                        onChange={(e) =>
                                            handleTierChange(
                                                idx,
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                        className='input input-sm input-bordered w-full rounded-xl text-xs'
                                    />
                                </div>
                                <div className='col-span-3'>
                                    <input
                                        type='number'
                                        required
                                        disabled={hasCommittedSales}
                                        min='0'
                                        value={tier.price}
                                        onChange={(e) =>
                                            handleTierChange(
                                                idx,
                                                'price',
                                                e.target.value,
                                            )
                                        }
                                        className='input input-sm input-bordered w-full rounded-xl text-xs font-mono'
                                    />
                                </div>
                                <div className='col-span-3'>
                                    <input
                                        type='number'
                                        required
                                        min={tier.soldQuantity || 1}
                                        value={tier.totalQuantity}
                                        onChange={(e) =>
                                            handleTierChange(
                                                idx,
                                                'totalQuantity',
                                                e.target.value,
                                            )
                                        }
                                        className='input input-sm input-bordered w-full rounded-xl text-xs font-mono'
                                    />
                                </div>
                                <div className='col-span-1 text-center'>
                                    {!hasCommittedSales && (
                                        <button
                                            type='button'
                                            disabled={ticketTiers.length === 1}
                                            onClick={() =>
                                                handleRemoveTier(idx)
                                            }
                                            className='btn btn-ghost btn-xs text-error rounded-lg'
                                        >
                                            <Trash2 className='w-3.5 h-3.5' />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Poster & Lifecycle Status */}
                <div className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-6 space-y-4'>
                    <h2 className='text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2'>
                        <Upload className='w-4 h-4' /> Event Poster & Lifecycle
                    </h2>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-center'>
                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Replace Poster
                            </label>
                            <input
                                type='file'
                                accept='image/*'
                                onChange={handlePosterChange}
                                className='file-input file-input-bordered file-input-sm w-full rounded-xl text-xs'
                            />
                        </div>

                        {posterPreview && (
                            <div className='flex items-center gap-3 bg-base-200/50 p-2 rounded-2xl'>
                                <img
                                    src={posterPreview}
                                    alt='Poster preview'
                                    className='w-16 h-20 object-cover rounded-xl border'
                                />
                                <span className='text-xs opacity-70'>
                                    Current Poster
                                </span>
                            </div>
                        )}
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-base-content/10'>
                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className='select select-bordered select-sm w-full rounded-xl text-xs font-semibold'
                            >
                                <option value='published'>Published</option>
                                <option value='coming_soon'>Coming Soon</option>
                                <option value='draft'>Draft</option>
                                <option value='sold_out'>Sold Out</option>
                                <option value='cancelled'>Cancelled</option>
                                <option value='completed'>Completed</option>
                            </select>
                        </div>

                        <div className='flex items-center gap-2 pt-6'>
                            <input
                                type='checkbox'
                                id='featured'
                                checked={isFeatured}
                                onChange={(e) =>
                                    setIsFeatured(e.target.checked)
                                }
                                className='checkbox checkbox-primary checkbox-sm rounded-md'
                            />
                            <label
                                htmlFor='featured'
                                className='text-xs font-bold cursor-pointer'
                            >
                                Featured Event
                            </label>
                        </div>

                        <div className='flex items-center gap-2 pt-6'>
                            <input
                                type='checkbox'
                                id='topEvent'
                                checked={isTopEvent}
                                onChange={(e) =>
                                    setIsTopEvent(e.target.checked)
                                }
                                className='checkbox checkbox-primary checkbox-sm rounded-md'
                            />
                            <label
                                htmlFor='topEvent'
                                className='text-xs font-bold cursor-pointer'
                            >
                                Top Event Spotlight
                            </label>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type='submit'
                    disabled={isUpdating}
                    className='btn btn-primary w-full rounded-2xl font-black gap-2 shadow-lg shadow-primary/20 text-sm h-12'
                >
                    {isUpdating ? (
                        <>
                            <Loader2 className='w-4 h-4 animate-spin' />
                            <span>Updating Event...</span>
                        </>
                    ) : (
                        <span>Save Changes</span>
                    )}
                </button>
            </form>
        </div>
    )
}

export default AdminEditEventScreen
