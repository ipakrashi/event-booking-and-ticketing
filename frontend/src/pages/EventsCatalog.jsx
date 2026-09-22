// frontend/src/pages/EventsCatalog.jsx

import { useSearchParams, Link } from 'react-router-dom'
import { useGetEventsQuery } from '../redux/api/eventsApiSlice'
import { useGetCategoriesQuery } from '../redux/api/categoriesApiSlice'
import {
    MapPin,
    Calendar,
    Ticket,
    Loader2,
    Star,
    Search,
    Building2,
    X,
} from 'lucide-react'

const EventsCatalog = () => {
    const [searchParams, setSearchParams] = useSearchParams()

    // Read all potential filters from URL
    const selectedCategory = searchParams.get('category') || ''
    const selectedCity = searchParams.get('city') || ''
    const selectedAuditorium = searchParams.get('auditoriumId') || ''
    const keyword = searchParams.get('keyword') || ''
    const sort = searchParams.get('sort') || ''

    // Categories for the filter pill bar
    const { data: categoriesData } = useGetCategoriesQuery()
    const categories = categoriesData?.data || []

    // Pass all active parameters to backend getAllEvents
    const {
        data: eventsData,
        isLoading,
        isError,
    } = useGetEventsQuery({
        category: selectedCategory || undefined,
        city: selectedCity || undefined,
        auditoriumId: selectedAuditorium || undefined,
        keyword: keyword || undefined,
        sort: sort || undefined,
    })

    const events = eventsData?.data || []

    // Check if any filter is active
    const hasActiveFilters = Boolean(
        selectedCategory ||
        selectedCity ||
        selectedAuditorium ||
        keyword ||
        sort,
    )

    const clearAllFilters = () => {
        setSearchParams({})
    }

    return (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8'>
            {/* Header & Active Filter Badges */}
            <div className='space-y-4'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                    <div>
                        <span className='text-xs font-bold text-primary uppercase tracking-widest'>
                            Live Catalog
                        </span>
                        <h1 className='text-3xl font-black text-base-content mt-1'>
                            Explore Events
                        </h1>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className='btn btn-sm btn-ghost border border-base-content/20 text-xs font-bold rounded-xl self-start sm:self-auto flex items-center gap-1.5'
                        >
                            <X className='w-3.5 h-3.5' /> Clear All Filters
                        </button>
                    )}
                </div>

                {/* Filter Summary Tags */}
                {hasActiveFilters && (
                    <div className='flex flex-wrap items-center gap-2 text-xs'>
                        <span className='text-base-content/60 font-semibold'>
                            Active:
                        </span>

                        {keyword && (
                            <span className='badge badge-neutral gap-1.5 py-2.5 px-3'>
                                <Search className='w-3 h-3' /> Keyword: "
                                {keyword}"
                            </span>
                        )}

                        {selectedCity && (
                            <span className='badge badge-primary gap-1.5 py-2.5 px-3 capitalize'>
                                <MapPin className='w-3 h-3' /> City:{' '}
                                {selectedCity}
                            </span>
                        )}

                        {selectedAuditorium && (
                            <span className='badge badge-secondary gap-1.5 py-2.5 px-3'>
                                <Building2 className='w-3 h-3' /> Filtered by
                                Auditorium
                            </span>
                        )}

                        {sort === 'highestRated' && (
                            <span className='badge badge-accent gap-1.5 py-2.5 px-3 font-bold'>
                                <Star className='w-3 h-3 fill-current' />{' '}
                                Highest Rated First
                            </span>
                        )}
                    </div>
                )}

                {/* Category Filter Pills */}
                <div className='flex flex-wrap items-center gap-2 pt-2 border-t border-base-content/10'>
                    <button
                        onClick={() => {
                            const next = new URLSearchParams(searchParams)
                            next.delete('category')
                            setSearchParams(next)
                        }}
                        className={`btn btn-sm rounded-xl font-bold ${
                            !selectedCategory
                                ? 'btn-primary'
                                : 'btn-ghost bg-base-200'
                        }`}
                    >
                        All Categories
                    </button>

                    {categories.map((cat) => (
                        <button
                            key={cat._id}
                            onClick={() => {
                                const next = new URLSearchParams(searchParams)
                                next.set('category', cat._id)
                                setSearchParams(next)
                            }}
                            className={`btn btn-sm rounded-xl font-medium capitalize ${
                                selectedCategory === cat._id
                                    ? 'btn-primary font-bold'
                                    : 'btn-ghost bg-base-200'
                            }`}
                        >
                            {cat.eventCategory}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                <div className='flex flex-col items-center justify-center py-24 text-base-content/60 gap-3'>
                    <Loader2 className='w-8 h-8 animate-spin text-primary' />
                    <p className='text-sm font-medium'>Loading events...</p>
                </div>
            ) : isError ? (
                <div className='alert alert-error max-w-md mx-auto'>
                    <span>Failed to load events from the server.</span>
                </div>
            ) : events.length === 0 ? (
                <div className='text-center py-20 bg-base-100 rounded-3xl border border-base-content/10 p-8 space-y-3'>
                    <Ticket className='w-12 h-12 mx-auto text-base-content/30' />
                    <h3 className='text-lg font-bold text-base-content'>
                        No Events Found
                    </h3>
                    <p className='text-sm text-base-content/60 max-w-sm mx-auto'>
                        No events matched your current search and filter
                        combination.
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className='btn btn-sm btn-primary rounded-xl font-bold mt-2'
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                    {events.map((evt) => {
                        const minPrice = evt.ticketTiers?.length
                            ? Math.min(...evt.ticketTiers.map((t) => t.price))
                            : 0

                        return (
                            <div
                                key={evt._id}
                                className='card bg-base-100 border border-base-content/10 shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 rounded-2xl overflow-hidden flex flex-col justify-between'
                            >
                                <figure className='relative h-44 bg-base-200 flex items-center justify-center overflow-hidden'>
                                    <img
                                        src={
                                            evt.posterImage?.url ||
                                            '/placeholder-event.png'
                                        }
                                        alt={evt.title}
                                        className='w-full h-full object-cover'
                                        onError={(e) => {
                                            e.target.style.display = 'none'
                                        }}
                                    />
                                    <span className='badge badge-sm font-bold absolute top-3 right-3 shadow-sm badge-primary uppercase'>
                                        {evt.status}
                                    </span>
                                </figure>

                                <div className='card-body p-5 flex-1 flex flex-col justify-between'>
                                    <div className='space-y-1.5'>
                                        <div className='flex items-center justify-between'>
                                            <span className='text-[11px] font-bold text-primary uppercase tracking-wider'>
                                                {evt.categoryId
                                                    ?.eventCategory || 'Event'}
                                            </span>
                                            {evt.averageRating > 0 && (
                                                <span className='flex items-center gap-1 text-xs font-bold text-amber-500'>
                                                    <Star className='w-3.5 h-3.5 fill-current' />
                                                    {evt.averageRating.toFixed(
                                                        1,
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        <h3 className='font-bold text-base text-base-content leading-snug'>
                                            {evt.title}
                                        </h3>

                                        <p className='text-xs text-base-content/70 flex items-center gap-1.5 pt-1'>
                                            <MapPin className='w-3.5 h-3.5 opacity-60 flex-shrink-0' />
                                            <span className='truncate'>
                                                {evt.venueId?.name ||
                                                    'Main Venue'}{' '}
                                                {evt.venueId?.city
                                                    ? `(${evt.venueId.city})`
                                                    : ''}
                                            </span>
                                        </p>

                                        <p className='text-xs text-base-content/70 flex items-center gap-1.5'>
                                            <Calendar className='w-3.5 h-3.5 opacity-60 flex-shrink-0' />
                                            <span>
                                                {new Date(
                                                    evt.startDate,
                                                ).toLocaleDateString()}
                                            </span>
                                        </p>
                                    </div>

                                    <div className='pt-3 border-t border-base-content/10 flex items-center justify-between mt-4'>
                                        <div>
                                            <span className='text-[10px] text-base-content/60 uppercase block font-semibold'>
                                                From
                                            </span>
                                            <span className='text-lg font-black text-base-content'>
                                                ₹
                                                {minPrice.toLocaleString(
                                                    'en-IN',
                                                )}
                                            </span>
                                        </div>

                                        <Link
                                            to={`/events/${evt._id}`}
                                            className='btn btn-sm btn-primary rounded-xl font-bold'
                                        >
                                            Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default EventsCatalog
