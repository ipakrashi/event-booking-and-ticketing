// frontend/src/pages/admin/AdminCreateBannerScreen.jsx

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    useGetHeroBannersQuery,
    useCreateBannerMutation,
} from '../../redux/api/bannersApiSlice'
import { useGetEventsQuery } from '../../redux/api/eventsApiSlice'
import {
    Sparkles,
    Upload,
    Calendar,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Layers,
    Eye,
} from 'lucide-react'

const AdminCreateBannerScreen = () => {
    const navigate = useNavigate()

    const { data: bannerData, isLoading: isLoadingBanners } =
        useGetHeroBannersQuery()
    const { data: eventsData } = useGetEventsQuery({ status: 'all' })
    const [createBanner, { isLoading: isCreating }] = useCreateBannerMutation()

    const banners = bannerData?.data || []
    const events = eventsData?.data || []

    const [title, setTitle] = useState('')
    const [subtitle, setSubtitle] = useState('')
    const [badgeText, setBadgeText] = useState('Featured Event')
    const [eventId, setEventId] = useState('')
    const [order, setOrder] = useState('0')
    const [isActive, setIsActive] = useState(true)

    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')

    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' })

    const handleEventSelect = (e) => {
        const selectedId = e.target.value
        setEventId(selectedId)

        const matchedEvent = events.find((ev) => ev._id === selectedId)
        if (matchedEvent) {
            if (!title) setTitle(matchedEvent.title)
            if (!subtitle)
                setSubtitle(
                    `Live at ${matchedEvent.venueId?.name || 'Grand Venue'} - Grab your passes now!`,
                )
        }
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatusMessage({ type: '', text: '' })

        if (!title.trim() || !subtitle.trim() || !eventId) {
            setStatusMessage({
                type: 'error',
                text: 'Title, subtitle, and linked event are required.',
            })
            return
        }

        if (!imageFile) {
            setStatusMessage({
                type: 'error',
                text: 'Please choose a landscape image for the hero slider.',
            })
            return
        }

        const formData = new FormData()
        formData.append('title', title.trim())
        formData.append('subtitle', subtitle.trim())
        formData.append('badgeText', badgeText.trim())
        formData.append('eventId', eventId)
        formData.append('order', Number(order) || 0)
        formData.append('isActive', isActive)
        formData.append('image', imageFile)

        try {
            await createBanner(formData).unwrap()
            setStatusMessage({
                type: 'success',
                text: `Hero banner created and activated successfully!`,
            })
            // Reset form
            setTitle('')
            setSubtitle('')
            setBadgeText('Featured Event')
            setEventId('')
            setOrder('0')
            setImageFile(null)
            setImagePreview('')
        } catch (err) {
            setStatusMessage({
                type: 'error',
                text:
                    err?.data?.message ||
                    err?.error ||
                    'Failed to create hero banner.',
            })
        }
    }

    return (
        <div className='max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <button
                    onClick={() => navigate(-1)}
                    className='btn btn-ghost btn-sm rounded-xl gap-2 text-xs font-semibold'
                >
                    <ArrowLeft className='w-4 h-4' /> Back
                </button>
                <h1 className='text-xl sm:text-2xl font-black text-base-content flex items-center gap-2'>
                    <Sparkles className='w-6 h-6 text-primary' /> Create Hero
                    Banner
                </h1>
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

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
                {/* Form Column */}
                <div className='lg:col-span-2 card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-6 space-y-4'>
                    <h2 className='text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2'>
                        <Layers className='w-4 h-4' /> Banner Details & Asset
                    </h2>

                    <form onSubmit={handleSubmit} className='space-y-4'>
                        {/* Event Link */}
                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Link to Event{' '}
                                <span className='text-error'>*</span>
                            </label>
                            <select
                                required
                                value={eventId}
                                onChange={handleEventSelect}
                                className='select select-bordered select-sm w-full rounded-xl text-xs'
                            >
                                <option value=''>
                                    Choose an event to feature
                                </option>
                                {events.map((ev) => (
                                    <option key={ev._id} value={ev._id}>
                                        {ev.title} (
                                        {ev.venueId?.name || 'Venue'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Title & Badge */}
                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                            <div className='sm:col-span-2'>
                                <label className='text-xs font-bold block mb-1'>
                                    Banner Headline{' '}
                                    <span className='text-error'>*</span>
                                </label>
                                <input
                                    type='text'
                                    required
                                    maxLength={100}
                                    placeholder='e.g. Macbeth: Tragedy of Ambition'
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className='input input-bordered input-sm w-full rounded-xl text-xs'
                                />
                            </div>

                            <div>
                                <label className='text-xs font-bold block mb-1'>
                                    Badge Pill
                                </label>
                                <input
                                    type='text'
                                    placeholder='e.g. Exclusive Premiere'
                                    value={badgeText}
                                    onChange={(e) =>
                                        setBadgeText(e.target.value)
                                    }
                                    className='input input-bordered input-sm w-full rounded-xl text-xs'
                                />
                            </div>
                        </div>

                        {/* Subtitle */}
                        <div>
                            <label className='text-xs font-bold block mb-1'>
                                Subtitle / Tagline{' '}
                                <span className='text-error'>*</span>
                            </label>
                            <textarea
                                required
                                rows='2'
                                maxLength={200}
                                placeholder='Compelling one-liner that draws user attention on the landing page...'
                                value={subtitle}
                                onChange={(e) => setSubtitle(e.target.value)}
                                className='textarea textarea-bordered textarea-sm w-full rounded-xl text-xs'
                            />
                        </div>

                        {/* Image Upload with Preview */}
                        <div className='space-y-2'>
                            <label className='text-xs font-bold block'>
                                Banner Image (Landscape Recommended 16:9 / 21:9){' '}
                                <span className='text-error'>*</span>
                            </label>
                            <input
                                type='file'
                                accept='image/*'
                                required
                                onChange={handleImageChange}
                                className='file-input file-input-bordered file-input-sm w-full rounded-xl text-xs'
                            />
                            {imagePreview && (
                                <div className='relative rounded-2xl overflow-hidden border border-base-content/15 aspect-[21/9] bg-base-200 mt-2'>
                                    <img
                                        src={imagePreview}
                                        alt='Banner preview'
                                        className='w-full h-full object-cover'
                                    />
                                    <div className='absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] text-white font-mono'>
                                        Landscape Preview
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order & Active */}
                        <div className='grid grid-cols-2 gap-3 pt-2 border-t border-base-content/10'>
                            <div>
                                <label className='text-xs font-bold block mb-1'>
                                    Display Order
                                </label>
                                <input
                                    type='number'
                                    value={order}
                                    onChange={(e) => setOrder(e.target.value)}
                                    className='input input-bordered input-sm w-full rounded-xl text-xs font-mono'
                                />
                                <p className='text-[10px] opacity-50 mt-0.5'>
                                    Lower numbers appear first.
                                </p>
                            </div>

                            <div className='flex items-center gap-2 pt-6'>
                                <input
                                    type='checkbox'
                                    id='activeCheck'
                                    checked={isActive}
                                    onChange={(e) =>
                                        setIsActive(e.target.checked)
                                    }
                                    className='checkbox checkbox-primary checkbox-sm rounded-md'
                                />
                                <label
                                    htmlFor='activeCheck'
                                    className='text-xs font-bold cursor-pointer'
                                >
                                    Display Immediately
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type='submit'
                            disabled={isCreating}
                            className='btn btn-primary w-full rounded-2xl font-black gap-2 shadow-lg shadow-primary/20 text-sm h-11'
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                    <span>Publishing Hero Banner...</span>
                                </>
                            ) : (
                                <span>Publish Hero Banner</span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Sidebar: Active Banners Overview */}
                <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-sm font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-2'>
                            <Eye className='w-4 h-4 text-primary' /> Active
                            Slider Banners
                        </h2>
                        <span className='badge badge-primary badge-sm font-mono font-bold'>
                            {banners.length}
                        </span>
                    </div>

                    {isLoadingBanners ? (
                        <div className='py-8 flex flex-col items-center justify-center gap-2'>
                            <Loader2 className='w-5 h-5 text-primary animate-spin' />
                            <span className='text-xs opacity-50'>
                                Loading banners...
                            </span>
                        </div>
                    ) : banners.length === 0 ? (
                        <div className='card bg-base-100 border border-base-content/10 rounded-3xl p-6 text-center text-xs opacity-60'>
                            No hero banners live yet. Add one to activate the
                            home slider!
                        </div>
                    ) : (
                        <div className='space-y-3'>
                            {banners.map((b) => (
                                <div
                                    key={b._id}
                                    className='card bg-base-100 border border-base-content/10 shadow-sm rounded-2xl overflow-hidden'
                                >
                                    <div className='aspect-[16/7] relative'>
                                        <img
                                            src={b.imageUrl}
                                            alt={b.title}
                                            className='w-full h-full object-cover'
                                        />
                                        <div className='absolute top-2 right-2 badge badge-neutral badge-xs font-mono font-bold'>
                                            #{b.order}
                                        </div>
                                    </div>
                                    <div className='p-3 space-y-1'>
                                        <span className='badge badge-primary badge-xs uppercase font-bold text-[9px]'>
                                            {b.badgeText || 'Featured'}
                                        </span>
                                        <h4 className='font-bold text-xs text-base-content line-clamp-1'>
                                            {b.title}
                                        </h4>
                                        <p className='text-[10px] text-base-content/60 line-clamp-1'>
                                            {b.subtitle}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminCreateBannerScreen
