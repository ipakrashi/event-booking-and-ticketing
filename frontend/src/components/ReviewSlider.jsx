// frontend/src/components/ReviewSlider.jsx

import { useState, useEffect, useRef } from 'react'
import {
    Star,
    ShieldCheck,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
} from 'lucide-react'

const ReviewSlider = ({ reviews = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [visibleCount, setVisibleCount] = useState(3)
    const touchStartX = useRef(0)
    const touchEndX = useRef(0)

    // Dynamically determine how many cards fit in the viewport
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setVisibleCount(1)
            } else if (window.innerWidth < 1024) {
                setVisibleCount(2)
            } else {
                setVisibleCount(3)
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const maxIndex = Math.max(0, reviews.length - visibleCount)

    // Autoplay advances 1 card every 5 seconds when not hovered
    useEffect(() => {
        if (reviews.length <= visibleCount || isPaused) return

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
        }, 5000)

        return () => clearInterval(interval)
    }, [reviews.length, visibleCount, isPaused, maxIndex])

    if (!reviews || reviews.length === 0) {
        return (
            <div className='p-8 rounded-2xl bg-base-100 border border-base-content/10 text-center max-w-md mx-auto space-y-2'>
                <MessageSquare className='w-8 h-8 text-base-content/30 mx-auto' />
                <p className='text-sm font-semibold text-base-content/70'>
                    No reviews published yet.
                </p>
                <p className='text-xs text-base-content/50'>
                    Verified attendee feedback will appear here as bookings
                    complete.
                </p>
            </div>
        )
    }

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1))
    }

    const handleNext = () => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
    }

    // Mobile swipe support
    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX
    }

    const handleTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX
    }

    const handleTouchEnd = () => {
        const swipeDistance = touchStartX.current - touchEndX.current
        if (swipeDistance > 50) {
            handleNext()
        } else if (swipeDistance < -50) {
            handlePrev()
        }
    }

    // Calculate translate percentage per item based on visible count
    const itemWidthPercent = 100 / visibleCount
    const translateX = currentIndex * itemWidthPercent

    return (
        <div
            className='relative max-w-7xl mx-auto px-2 sm:px-4'
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Viewport */}
            <div className='overflow-hidden py-2'>
                <div
                    className='flex transition-transform duration-500 ease-out -mx-3'
                    style={{ transform: `translateX(-${translateX}%)` }}
                >
                    {reviews.map((rev) => (
                        <div
                            key={rev._id}
                            className='shrink-0 px-3 w-full sm:w-1/2 lg:w-1/3'
                        >
                            <div className='bg-base-100 border border-base-content/10 rounded-2xl p-6 shadow-md hover:border-indigo-500/40 hover:shadow-xl transition-all flex flex-col justify-between h-full min-h-55'>
                                <div className='space-y-3'>
                                    <div className='flex items-center justify-between gap-2'>
                                        <div className='flex items-center gap-1 text-amber-400'>
                                            {[...Array(rev.rating)].map(
                                                (_, i) => (
                                                    <Star
                                                        key={i}
                                                        className='w-4 h-4 fill-current'
                                                    />
                                                ),
                                            )}
                                        </div>
                                        {rev.isVerifiedAttendee && (
                                            <span className='badge badge-xs bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold py-2 px-2'>
                                                Verified Attendee
                                            </span>
                                        )}
                                    </div>

                                    {rev.event?.title && (
                                        <p className='text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider truncate'>
                                            {rev.event.title}
                                        </p>
                                    )}

                                    <p className='text-sm text-base-content/80 leading-relaxed italic line-clamp-4'>
                                        "{rev.comment}"
                                    </p>
                                </div>

                                <div className='pt-4 mt-4 border-t border-base-content/10 flex items-center justify-between'>
                                    <span className='text-xs font-bold text-base-content flex items-center gap-1.5'>
                                        <ShieldCheck className='w-4 h-4 text-emerald-500' />
                                        {rev.user?.userName || 'Attendee'}
                                    </span>
                                    <span className='text-[11px] text-base-content/60'>
                                        {new Date(
                                            rev.createdAt,
                                        ).toLocaleDateString('en-IN', {
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Arrows (rendered when total items exceed current visible count) */}
            {reviews.length > visibleCount && (
                <>
                    <button
                        onClick={handlePrev}
                        aria-label='Previous reviews'
                        className='absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-base-100/90 hover:bg-base-200 border border-base-content/15 shadow-lg text-base-content z-10'
                    >
                        <ChevronLeft className='w-4 h-4' />
                    </button>
                    <button
                        onClick={handleNext}
                        aria-label='Next reviews'
                        className='absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-base-100/90 hover:bg-base-200 border border-base-content/15 shadow-lg text-base-content z-10'
                    >
                        <ChevronRight className='w-4 h-4' />
                    </button>

                    {/* Dots Indicator */}
                    <div className='flex justify-center items-center gap-2 mt-6'>
                        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                aria-label={`Slide to index ${idx + 1}`}
                                className={`h-2 rounded-full transition-all duration-300 ${
                                    currentIndex === idx
                                        ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                                        : 'w-2 bg-base-content/20 hover:bg-base-content/40'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}

export default ReviewSlider
