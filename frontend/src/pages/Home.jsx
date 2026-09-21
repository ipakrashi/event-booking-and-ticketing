// frontend/src/pages/Home.jsx

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
    useGetEventsQuery,
    useGetLatestReviewsQuery,
} from '../redux/api/eventsApiSlice'
import {
    Sparkles,
    TrendingUp,
    Star,
    ShieldCheck,
    MapPin,
    Calendar,
    ArrowRight,
    Ticket,
    Loader2,
    MessageSquare,
} from 'lucide-react'
import ReviewSlider from '../components/ReviewSlider'
import logo from '../assets/logo.png'

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

    return (
        <div className='space-y-16 pb-20'>
            {/* =========================================================
          SECTION 1: HERO BANNER
          ========================================================= */}
            <section className='max-w-7xl mx-auto px-4 sm:px-6 pt-6'>
                <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-black border border-white/10 shadow-2xl p-8 md:p-14'>
                    <div className='absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none'></div>
                    <div className='relative z-10 max-w-2xl space-y-5'>
                        <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide'>
                            <Sparkles className='w-3.5 h-3.5' /> Live Ticketing
                            Platform
                        </div>
                        <h1 className='text-4xl md:text-6xl font-black tracking-tight text-white leading-tight'>
                            Unforgettable Nights,{' '}
                            <span className='text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300'>
                                Seamless Entry.
                            </span>
                        </h1>
                        <p className='text-gray-300 text-base md:text-lg leading-relaxed'>
                            Reserve authentic ticket tiers with zero scalper
                            bots, physical courier dispatch options, and instant
                            anti-passback QR gate passes.
                        </p>
                        <div className='flex flex-wrap items-center gap-4 pt-2'>
                            <a
                                href='#top-events'
                                className='btn bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 rounded-xl border-0 shadow-lg shadow-indigo-600/30'
                            >
                                Explore Top Events{' '}
                                <ArrowRight className='w-4 h-4' />
                            </a>
                            {featuredEvent && (
                                <a
                                    href='#featured'
                                    className='btn btn-ghost bg-white/5 hover:bg-white/10 text-white font-bold px-6 rounded-xl border border-white/15'
                                >
                                    Featured Spotlight
                                </a>
                            )}
                        </div>
                    </div>
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
          SECTION 5: ROLE-BASED ADAPTIVE FOOTER
          ========================================================= */}
            <footer className='border-t border-base-content/10 bg-base-100 pt-12 pb-8 mt-20'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-sm'>
                    <div>
                        <Link to='/' className='flex items-center group py-1'>
                            <div className='px-3 py-1.5 rounded-2xl transition-all duration-200 bg-white/95 shadow-sm hover:shadow group-hover:scale-105'>
                                <img
                                    src={logo}
                                    alt='EventPass'
                                    className='h-12 w-auto object-contain block'
                                />
                            </div>
                        </Link>
                        <p className='text-base-content/70 text-xs leading-relaxed'>
                            Modern multi-vendor ticketing infrastructure with
                            cryptographic gate check-ins and verified dispatch.
                        </p>
                    </div>

                    <div>
                        <span className='font-bold text-base-content block mb-3'>
                            Discover
                        </span>
                        <ul className='space-y-2 text-xs text-base-content/70'>
                            <li>
                                <Link
                                    to='/events'
                                    className='hover:text-indigo-600 dark:hover:text-indigo-400'
                                >
                                    Concerts & Shows
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to='/events'
                                    className='hover:text-indigo-600 dark:hover:text-indigo-400'
                                >
                                    Venues & Auditoriums
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to='/events'
                                    className='hover:text-indigo-600 dark:hover:text-indigo-400'
                                >
                                    Standup Comedy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <span className='font-bold text-base-content block mb-3'>
                            Support & Policies
                        </span>
                        <ul className='space-y-2 text-xs text-base-content/70'>
                            <li>
                                <Link
                                    to='/terms'
                                    className='hover:text-indigo-600 dark:hover:text-indigo-400'
                                >
                                    Cancellation & Refund Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to='/dispatch'
                                    className='hover:text-indigo-600 dark:hover:text-indigo-400'
                                >
                                    Physical Courier Dispatch
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to='/contact'
                                    className='hover:text-indigo-600 dark:hover:text-indigo-400'
                                >
                                    Help Center
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <span className='font-bold text-base-content block mb-3'>
                            {userInfo
                                ? `Console (${userInfo.role || 'Member'})`
                                : 'Join Platform'}
                        </span>
                        <ul className='space-y-2 text-xs text-base-content/70'>
                            {userInfo ? (
                                <>
                                    <li>
                                        <Link
                                            to='/my-bookings'
                                            className='text-indigo-600 dark:text-indigo-400 hover:underline'
                                        >
                                            My Active Tickets
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to='/profile'
                                            className='hover:text-indigo-600 dark:hover:text-indigo-400'
                                        >
                                            Delivery Address Settings
                                        </Link>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li>
                                        <Link
                                            to='/login'
                                            className='text-indigo-600 dark:text-indigo-400 hover:underline'
                                        >
                                            Login to Account
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to='/register'
                                            className='hover:text-indigo-600 dark:hover:text-indigo-400'
                                        >
                                            Sign Up
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>

                <div className='max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-base-content/10 text-center text-xs text-base-content/60'>
                    © 2026 EventPass Platform. All rights reserved.
                </div>
            </footer>
        </div>
    )
}

export default Home
