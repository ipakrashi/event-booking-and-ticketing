// frontend/src/pages/Home.jsx

import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
    useGetEventsQuery,
    useGetLatestReviewsQuery,
} from '../redux/api/eventsApiSlice'
import {
    Sparkles,
    TrendingUp,
    MapPin,
    Calendar,
    ArrowRight,
    Ticket,
    Loader2,
} from 'lucide-react'
import ReviewSlider from '../components/ReviewSlider'
import HeroSlider from '../components/HeroSlider'
import { useGetHeroBannersQuery } from '../redux/api/bannersApiSlice.js'
import NewsletterSection from '../components/NewsletterSection'

const Home = () => {
    const { userInfo } = useSelector((state) => state.auth)
    const navigate = useNavigate()

    // 1. Fetch Top Events (Section 2)
    const { data: topEventsData, isLoading: loadingTop } = useGetEventsQuery({
        isTopEvent: true,
    })
    const topEvents = topEventsData?.data || []

    // 2. Fetch Featured Event (Section 3)
    const { data: featuredData, isLoading: loadingFeatured } =
        useGetEventsQuery({
            isFeatured: true,
        })
    const featuredEvent = featuredData?.data?.[0] || null

    // 3. Fetch Real Reviews (Section 4)
    const { data: reviewsData, isLoading: loadingReviews } =
        useGetLatestReviewsQuery(3)
    const reviews = reviewsData?.data || []

    const getBadgeStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'published':
                return 'badge-primary'
            case 'selling fast':
            case 'sold_out':
                return 'badge-error'
            case 'coming_soon':
                return 'badge-warning'
            case 'completed':
                return 'badge-neutral'
            default:
                return 'badge-ghost'
        }
    }

    const { data: bannerData } = useGetHeroBannersQuery()
    const banners = bannerData?.data || []

    return (
        <div className='space-y-16 pb-20'>
            {/* =========================================================
    SECTION 1: HERO SLIDER (DYNAMIC BANNER CAROUSEL)
    ========================================================= */}
            <section className='max-w-7xl mx-auto px-4 sm:px-6 pt-6'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12'>
                    <HeroSlider banners={banners} />
                </div>
            </section>

            {/* =========================================================
          SECTION 2: 4 TOP EVENTS WITH STATUS BADGES
          ========================================================= */}
            <section id='top-events' className='max-w-7xl mx-auto px-4 sm:px-6'>
                <div className='flex items-end justify-between mb-8'>
                    <div>
                        <div className='flex items-center gap-2 text-indigo-500 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1'>
                            <TrendingUp className='w-4 h-4' /> Most Popular
                        </div>
                        <h2 className='text-3xl font-black text-base-content'>
                            Top Trending Events
                        </h2>
                    </div>
                    <Link
                        to='/events'
                        className='text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1'
                    >
                        Browse All <ArrowRight className='w-4 h-4' />
                    </Link>
                </div>

                {loadingTop ? (
                    <div className='flex items-center justify-center py-16 gap-3 text-base-content/60'>
                        <Loader2 className='w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400' />
                        <span className='text-sm font-medium'>
                            Loading top events...
                        </span>
                    </div>
                ) : topEvents.length === 0 ? (
                    <div className='text-center py-12 bg-base-100 border border-base-content/10 rounded-2xl p-6'>
                        <Ticket className='w-8 h-8 text-base-content/40 mx-auto mb-2' />
                        <p className='text-sm font-semibold text-base-content/70'>
                            No events marked as Top Event yet.
                        </p>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                        {topEvents.slice(0, 4).map((evt) => {
                            const minPrice = evt.ticketTiers?.length
                                ? Math.min(
                                      ...evt.ticketTiers.map((t) => t.price),
                                  )
                                : 0

                            return (
                                <div
                                    key={evt._id}
                                    className='bg-base-100 border border-base-content/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all hover:-translate-y-1 shadow-lg flex flex-col justify-between'
                                >
                                    <div className='relative h-48 bg-base-200 overflow-hidden flex items-center justify-center'>
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
                                        <span
                                            className={`badge badge-sm font-bold absolute top-3 right-3 shadow-sm uppercase ${getBadgeStyle(
                                                evt.status,
                                            )}`}
                                        >
                                            {evt.status}
                                        </span>
                                    </div>

                                    <div className='p-5 space-y-3 flex-1 flex flex-col justify-between'>
                                        <div>
                                            <span className='text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider'>
                                                {evt.categoryId
                                                    ?.eventCategory || 'Event'}
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
                                                className='btn btn-sm bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl border-0 shadow-md'
                                            >
                                                Book Now
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* =========================================================
          SECTION 3: FEATURED SPOTLIGHT
          ========================================================= */}
            <section id='featured' className='max-w-7xl mx-auto px-4 sm:px-6'>
                {loadingFeatured ? (
                    <div className='flex items-center justify-center py-16 gap-3 text-base-content/60'>
                        <Loader2 className='w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400' />
                        <span className='text-sm font-medium'>
                            Loading featured event...
                        </span>
                    </div>
                ) : featuredEvent ? (
                    <div className='bg-base-100 border border-base-content/10 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center'>
                        <div className='relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden border border-base-content/10 bg-base-200 shadow-inner flex items-center justify-center'>
                            <img
                                src={
                                    featuredEvent.posterImage?.url ||
                                    '/placeholder-event.png'
                                }
                                alt={featuredEvent.title}
                                className='w-full h-full object-cover'
                            />
                            <div className='absolute top-4 left-4 bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow'>
                                Featured Spotlight
                            </div>
                        </div>

                        <div className='space-y-5'>
                            <div>
                                <span className='text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest'>
                                    {featuredEvent.categoryId?.eventCategory ||
                                        'Spotlight'}
                                </span>
                                <h2 className='text-2xl sm:text-3xl lg:text-4xl font-black text-base-content mt-1 leading-tight'>
                                    {featuredEvent.title}
                                </h2>
                                <p className='text-sm text-base-content/80 mt-2 leading-relaxed'>
                                    {featuredEvent.description}
                                </p>
                                <div className='mt-4 flex flex-wrap items-center gap-4 text-xs text-base-content/70'>
                                    <span className='flex items-center gap-1.5 font-medium'>
                                        <MapPin className='w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0' />
                                        {featuredEvent.venueId?.name}
                                    </span>
                                    <span className='flex items-center gap-1.5 font-medium'>
                                        <Calendar className='w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0' />
                                        {new Date(
                                            featuredEvent.startDate,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            {featuredEvent.ticketTiers?.length > 0 && (
                                <div className='p-4 rounded-2xl bg-base-200/60 border border-base-content/10 flex items-center justify-between'>
                                    <div>
                                        <span className='text-xs text-base-content/60 uppercase block font-semibold'>
                                            Tier
                                        </span>
                                        <span className='text-sm font-bold text-base-content'>
                                            {featuredEvent.ticketTiers[0].name}
                                        </span>
                                    </div>
                                    <div className='text-right'>
                                        <span className='text-2xl font-black text-indigo-600 dark:text-indigo-400'>
                                            ₹
                                            {featuredEvent.ticketTiers[0].price.toLocaleString(
                                                'en-IN',
                                            )}
                                        </span>
                                        <span className='text-xs text-base-content/60 block font-normal'>
                                            {featuredEvent.ticketTiers[0]
                                                .totalQuantity -
                                                featuredEvent.ticketTiers[0]
                                                    .soldQuantity}{' '}
                                            seats available
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <button
                                    onClick={() =>
                                        navigate(
                                            userInfo
                                                ? `/events/${featuredEvent._id}`
                                                : '/login',
                                        )
                                    }
                                    className='btn bg-indigo-600 hover:bg-indigo-500 text-white font-bold w-full rounded-xl py-3 border-0 shadow-lg shadow-indigo-600/30'
                                >
                                    {userInfo
                                        ? 'Select Tiers & Book Instantly'
                                        : 'Sign In to Reserve'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </section>

            {/* =========================================================
          SECTION 4: VERIFIED COMMUNITY REVIEWS (DYNAMIC SLIDER)
          ========================================================= */}
            <section className='max-w-7xl mx-auto px-4 sm:px-6'>
                <div className='text-center max-w-xl mx-auto mb-8'>
                    <span className='text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest'>
                        Verified Community Feedback
                    </span>
                    <h2 className='text-3xl font-black text-base-content mt-1'>
                        What Audience Say
                    </h2>
                </div>

                {loadingReviews ? (
                    <div className='flex items-center justify-center py-12 gap-3 text-base-content/60'>
                        <Loader2 className='w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400' />
                        <span className='text-sm font-medium'>
                            Fetching real reviews...
                        </span>
                    </div>
                ) : (
                    <ReviewSlider reviews={reviews} />
                )}
            </section>

            {/* =========================================================
          SECTION 5: NEWSLETTER SECTION
          ========================================================= */}

            <div className='max-w-7xl mx-auto px-4 sm:px-6'>
                <NewsletterSection />
            </div>
        </div>
    )
}

export default Home
