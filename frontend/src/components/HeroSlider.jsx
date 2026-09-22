// frontend/src/components/HeroSlider.jsx

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    Sparkles,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Calendar,
    MapPin,
} from 'lucide-react'

const HeroSlider = ({ banners = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)

    const hasBanners = banners && banners.length > 0

    useEffect(() => {
        if (!hasBanners || banners.length <= 1 || isPaused) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length)
        }, 6000)

        return () => clearInterval(interval)
    }, [hasBanners, banners.length, isPaused])

    // Fallback hero if database has no active banner documents yet
    if (!hasBanners) {
        return (
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
                        Reserve authentic ticket tiers with zero scalper bots,
                        physical courier dispatch options, and instant
                        anti-passback QR gate passes.
                    </p>
                    <div className='flex flex-wrap items-center gap-4 pt-2'>
                        <Link
                            to='/events'
                            className='btn bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 rounded-xl border-0 shadow-lg shadow-indigo-600/30'
                        >
                            Explore Events <ArrowRight className='w-4 h-4' />
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const current = banners[currentIndex]
    const targetEvent = current.eventId

    return (
        <div
            className='relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-black min-h-[420px] md:min-h-[480px] flex items-center'
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background Slides */}
            {banners.map((slide, idx) => (
                <div
                    key={slide._id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        idx === currentIndex
                            ? 'opacity-100 z-0'
                            : 'opacity-0 pointer-events-none'
                    }`}
                >
                    <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        className='w-full h-full object-cover'
                    />
                    {/* Gradients to keep white text readable */}
                    <div className='absolute inset-0 bg-gradient-to-r from-black via-black/75 to-transparent'></div>
                    <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20'></div>
                </div>
            ))}

            {/* Slide Content */}
            <div className='relative z-10 max-w-2xl px-8 py-10 md:px-14 space-y-4'>
                <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-bold tracking-wide'>
                    <Sparkles className='w-3.5 h-3.5' /> {current.badgeText}
                </div>

                <h1 className='text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight'>
                    {current.title}
                </h1>

                <p className='text-gray-300 text-sm md:text-base leading-relaxed line-clamp-2 md:line-clamp-3 max-w-xl'>
                    {current.subtitle}
                </p>

                {targetEvent?.venueId && (
                    <div className='flex flex-wrap items-center gap-4 text-xs text-gray-300 pt-1'>
                        <span className='flex items-center gap-1.5 font-medium'>
                            <MapPin className='w-4 h-4 text-indigo-400' />
                            {targetEvent.venueId.name} (
                            {targetEvent.venueId.city})
                        </span>
                        {targetEvent.startDate && (
                            <span className='flex items-center gap-1.5 font-medium'>
                                <Calendar className='w-4 h-4 text-indigo-400' />
                                {new Date(
                                    targetEvent.startDate,
                                ).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </span>
                        )}
                    </div>
                )}

                <div className='flex flex-wrap items-center gap-4 pt-3'>
                    <Link
                        to={
                            targetEvent?._id
                                ? `/events/${targetEvent._id}`
                                : '/events'
                        }
                        className='btn bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 rounded-xl border-0 shadow-lg shadow-indigo-600/30'
                    >
                        Get Tickets <ArrowRight className='w-4 h-4' />
                    </Link>
                    <Link
                        to='/events'
                        className='btn btn-ghost bg-white/10 hover:bg-white/20 text-white font-bold px-6 rounded-xl border border-white/20'
                    >
                        Browse All
                    </Link>
                </div>
            </div>

            {/* Slider Controls */}
            {banners.length > 1 && (
                <>
                    <button
                        onClick={() =>
                            setCurrentIndex((prev) =>
                                prev === 0 ? banners.length - 1 : prev - 1,
                            )
                        }
                        aria-label='Previous slide'
                        className='absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-black/40 hover:bg-black/70 border border-white/20 text-white z-20'
                    >
                        <ChevronLeft className='w-4 h-4' />
                    </button>
                    <button
                        onClick={() =>
                            setCurrentIndex(
                                (prev) => (prev + 1) % banners.length,
                            )
                        }
                        aria-label='Next slide'
                        className='absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-black/40 hover:bg-black/70 border border-white/20 text-white z-20'
                    >
                        <ChevronRight className='w-4 h-4' />
                    </button>

                    {/* Indicator Dashes */}
                    <div className='absolute bottom-4 left-8 md:left-14 flex items-center gap-2 z-20'>
                        {banners.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                aria-label={`Go to slide ${idx + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    currentIndex === idx
                                        ? 'w-8 bg-indigo-500'
                                        : 'w-2 bg-white/30'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default HeroSlider
