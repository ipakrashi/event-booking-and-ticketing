// frontend/src/pages/EventsCatalog.jsx

import { useSearchParams, Link } from 'react-router-dom'
import { useGetEventsQuery } from '../redux/api/eventsApiSlice'
import { useGetCategoriesQuery } from '../redux/api/categoriesApiSlice'
import { MapPin, Calendar, Ticket, Loader2 } from 'lucide-react'

const EventsCatalog = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const selectedCategory = searchParams.get('category') || ''

    const { data: categoriesData } = useGetCategoriesQuery()
    const categories = categoriesData?.data || []

    const {
        data: eventsData,
        isLoading,
        isError,
    } = useGetEventsQuery({
        categoryId: selectedCategory || undefined,
    })
    const events = eventsData?.data || []

    return (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8'>
            {/* Header & Category Filter Pills */}
            <div className='space-y-4'>
                <div>
                    <span className='text-xs font-bold text-primary uppercase tracking-widest'>
                        Catalog
                    </span>
                    <h1 className='text-3xl font-black text-base-content mt-1'>
                        Explore Live Events
                    </h1>
                </div>

                <div className='flex flex-wrap items-center gap-2 pt-2'>
                    <button
                        onClick={() => setSearchParams({})}
                        className={`btn btn-sm rounded-xl font-bold ${
                            !selectedCategory
                                ? 'btn-primary'
                                : 'btn-ghost bg-base-200'
                        }`}
                    >
                        All Events
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat._id}
                            onClick={() =>
                                setSearchParams({ category: cat._id })
                            }
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
                    <p className='text-sm font-medium'>Fetching events...</p>
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
                        There are currently no active published events in this
                        category.
                    </p>
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
                                    <div>
                                        <span className='text-[11px] font-bold text-primary uppercase tracking-wider'>
                                            {evt.categoryId?.eventCategory ||
                                                'Event'}
                                        </span>
                                        <h3 className='font-bold text-base text-base-content mt-1 leading-snug'>
                                            {evt.title}
                                        </h3>
                                        <p className='text-xs text-base-content/70 mt-2 flex items-center gap-1.5'>
                                            <MapPin className='w-3.5 h-3.5 opacity-60 flex-shrink-0' />
                                            <span className='truncate'>
                                                {evt.venueId?.name ||
                                                    'Main Venue'}
                                            </span>
                                        </p>
                                        <p className='text-xs text-base-content/70 mt-1 flex items-center gap-1.5'>
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
