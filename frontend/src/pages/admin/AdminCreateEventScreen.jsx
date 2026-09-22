// frontend/src/pages/admin/AdminCreateEventScreen.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useCreateEventMutation } from '../../redux/api/eventsApiSlice'
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

const AdminCreateEventScreen = () => {
    const navigate = useNavigate()
    const { userInfo } = useSelector((state) => state.auth)

    const { data: categoryData } = useGetCategoriesQuery()
    const categories = categoryData?.data || []

    const { data: venueData } = useGetVenuesQuery()
    const venues = venueData?.data || []

    const [createEvent, { isLoading: isCreating }] = useCreateEventMutation()

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

    // Poster file & preview
    const [posterFile, setPosterFile] = useState(null)
    const [posterPreview, setPosterPreview] = useState('')

    // Ticket Tiers State
    const [ticketTiers, setTicketTiers] = useState([
        { name: 'General Admission', price: '', totalQuantity: '' },
    ])

    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

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

    // Tier handlers
    const handleAddTier = () => {
        setTicketTiers((prev) => [
            ...prev,
            { name: '', price: '', totalQuantity: '' },
        ])
    }

    const handleRemoveTier = (index) => {
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

        if (!categoryId || !venueId || !auditoriumId || !screenId) {
            setErrorMessage(
                'Please select Category, Venue, Auditorium, and Screen.',
            )
            return
        }

        if (new Date(endDate) < new Date(startDate)) {
            setErrorMessage('End date must be on or after start date.')
            return
        }

        if (screenCapacity > 0 && totalAllocatedSeats > screenCapacity) {
            setErrorMessage(
                `Allocated seats (${totalAllocatedSeats}) exceed the screen capacity (${screenCapacity}).`,
            )
            return
        }

        // Validate tiers
        for (const tier of ticketTiers) {
            if (
                !tier.name.trim() ||
                tier.price === '' ||
                tier.totalQuantity === ''
            ) {
                setErrorMessage('All ticket tier fields are required.')
                return
            }
        }

        const formData = new FormData()
        formData.append('title', title.trim())
        formData.append('description', description.trim())
        formData.append('categoryId', categoryId)
        formData.append('organizerId', userInfo?._id)
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
            await createEvent(formData).unwrap()
            setSuccessMessage(`Event "${title}" created successfully!`)
            setTimeout(() => {
                navigate('/events')
            }, 1200)
        } catch (err) {
            setErrorMessage(
                err?.data?.message || err?.error || 'Failed to create event.',
            )
        }
    }

    return (
        <div className='max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6'>
            {/* Top Navigation Bar */}
            <div className='flex items-center justify-between'>
                <button
                    onClick={() => navigate(-1)}
                    className='btn btn-ghost btn-sm rounded-xl gap-2 text-xs font-semibold'
                >
                    <ArrowLeft className='w-4 h-4' /> Back
                </button>
                <h1 className='text-xl sm:text-2xl font-black text-base-content flex items-center gap-2'>
                    <Calendar className='w-6 h-6 text-primary' /> Create New
                    Event
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
                {/* Section 1: Basic Event Details */}
                <div className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-6 space-y-4'>
                    <h2 className='text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2'>
                        <Tag className='w-4 h-4' /> Event Information
                    </h2>

                    <div className='space-y-3'>
                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Event Title{' '}
                                <span className='text-error'>*</span>
                            </label>
                            <input
                                type='text'
                                required
                                maxLength={150}
                                placeholder='e.g. Classical Dance Workshop by Sujata Pakrashi Lahiri'
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className='input input-bordered input-sm w-full rounded-xl text-xs'
                            />
                        </div>

                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Description{' '}
                                <span className='text-error'>*</span>
                            </label>
                            <textarea
                                required
                                rows='3'
                                placeholder='Detailed itinerary, special instructions, and dress code...'
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className='textarea textarea-bordered textarea-sm w-full rounded-xl text-xs'
                            />
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                            <div>
                                <label className='text-xs font-bold block mb-1'>
                                    Category{' '}
                                    <span className='text-error'>*</span>
                                </label>
                                <select
                                    required
                                    value={categoryId}
                                    onChange={(e) =>
                                        setCategoryId(e.target.value)
                                    }
                                    className='select select-bordered select-sm w-full rounded-xl text-xs capitalize'
                                >
                                    <option value=''>Select Category</option>
                                    {categories.map((c) => (
                                        <option key={c._id} value={c._id}>
                                            {c.eventCategory}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className='text-xs font-bold block mb-1'>
                                    Start Date & Time{' '}
                                    <span className='text-error'>*</span>
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
                                    End Date & Time{' '}
                                    <span className='text-error'>*</span>
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

                {/* Section 2: Location Hierarchy (Cascade: Venue -> Audi -> Screen) */}
                <div className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-6 space-y-4'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2'>
                            <Building2 className='w-4 h-4' /> Location & Hall
                            Allocation
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
                                Venue <span className='text-error'>*</span>
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
                                <option value=''>Choose Venue</option>
                                {venues.map((v) => (
                                    <option key={v._id} value={v._id}>
                                        {v.name} ({v.city})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Auditorium / Hall{' '}
                                <span className='text-error'>*</span>
                            </label>
                            <select
                                required
                                disabled={!venueId}
                                value={auditoriumId}
                                onChange={(e) => {
                                    setAuditoriumId(e.target.value)
                                    setScreenId('')
                                }}
                                className='select select-bordered select-sm w-full rounded-xl text-xs'
                            >
                                <option value=''>Choose Auditorium</option>
                                {availableAuditoriums.map((a) => (
                                    <option key={a._id} value={a._id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Screen / Zone{' '}
                                <span className='text-error'>*</span>
                            </label>
                            <select
                                required
                                disabled={!auditoriumId}
                                value={screenId}
                                onChange={(e) => setScreenId(e.target.value)}
                                className='select select-bordered select-sm w-full rounded-xl text-xs'
                            >
                                <option value=''>Choose Screen/Stage</option>
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

                {/* Section 3: Tiered Ticket Builder */}
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
                        <button
                            type='button'
                            onClick={handleAddTier}
                            className='btn btn-xs btn-primary rounded-xl font-bold gap-1'
                        >
                            <Plus className='w-3 h-3' /> Add Tier
                        </button>
                    </div>

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
                                        placeholder='Tier Name (e.g. VIP, General)'
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
                                        min='0'
                                        placeholder='Price (₹)'
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
                                        min='1'
                                        placeholder='Qty'
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
                                    <button
                                        type='button'
                                        disabled={ticketTiers.length === 1}
                                        onClick={() => handleRemoveTier(idx)}
                                        className='btn btn-ghost btn-xs text-error rounded-lg'
                                    >
                                        <Trash2 className='w-3.5 h-3.5' />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 4: Poster Upload & Publishing Status */}
                <div className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-6 space-y-4'>
                    <h2 className='text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2'>
                        <Upload className='w-4 h-4' /> Event Poster & Visibility
                    </h2>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 items-center'>
                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Poster Image
                            </label>
                            <input
                                type='file'
                                accept='image/*'
                                onChange={handlePosterChange}
                                className='file-input file-input-bordered file-input-sm w-full rounded-xl text-xs'
                            />
                            <p className='text-[10px] text-base-content/50 mt-1'>
                                High resolution recommended (16:9 or 4:3 ratio).
                            </p>
                        </div>

                        {posterPreview && (
                            <div className='flex items-center gap-3 bg-base-200/50 p-2 rounded-2xl'>
                                <img
                                    src={posterPreview}
                                    alt='Poster preview'
                                    className='w-16 h-20 object-cover rounded-xl border'
                                />
                                <span className='text-xs opacity-70'>
                                    Poster Preview
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
                                <option value='draft'>Draft</option>
                                <option value='coming_soon'>Coming Soon</option>
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

                {/* Submit CTA */}
                <button
                    type='submit'
                    disabled={isCreating}
                    className='btn btn-primary w-full rounded-2xl font-black gap-2 shadow-lg shadow-primary/20 text-sm h-12'
                >
                    {isCreating ? (
                        <>
                            <Loader2 className='w-4 h-4 animate-spin' />
                            <span>Creating & Publishing Event...</span>
                        </>
                    ) : (
                        <span>Publish Event</span>
                    )}
                </button>
            </form>
        </div>
    )
}

export default AdminCreateEventScreen
