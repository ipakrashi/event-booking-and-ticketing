// frontend/src/components/Navbar.jsx

import { useState, useEffect, useRef } from 'react'
import {
    Link,
    useNavigate,
    useLocation,
    useSearchParams,
} from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice'
import { useLogoutApiMutation } from '../redux/api/usersApiSlice'
import { useGetCategoriesQuery } from '../redux/api/categoriesApiSlice'
import { useGetVenuesQuery } from '../redux/api/venuesApiSlice'
import { useTheme } from '../context/ThemeContext'
import logo from '../assets/logo.png'
import {
    ChevronDown,
    LogOut,
    User,
    Ticket,
    ShieldCheck,
    Calendar,
    Sparkles,
    Sun,
    Moon,
    Menu,
    X,
    Search,
    MapPin,
    Building2,
    Star,
} from 'lucide-react'

const Navbar = () => {
    const { userInfo } = useSelector((state) => state.auth)
    const { theme, toggleTheme } = useTheme()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    // Dropdown states (Desktop)
    const [isEventsOpen, setIsEventsOpen] = useState(false)
    const [isCityOpen, setIsCityOpen] = useState(false)
    const [isAudiOpen, setIsAudiOpen] = useState(false)

    // Accordions inside Mobile Drawer
    const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false)
    const [mobileVenuesOpen, setMobileVenuesOpen] = useState(false)

    // Search input state
    const [searchParams] = useSearchParams()
    const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
    const isFirstRender = useRef(true)

    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()

    const [logoutApiCall] = useLogoutApiMutation()
    const { data: categoryData } = useGetCategoriesQuery()
    const categories = categoryData?.data || []

    const { data: venueData } = useGetVenuesQuery()
    const venues = venueData?.data || []

    const uniqueCities = Array.from(
        new Set(
            venues.map((v) => v.city?.trim()?.toLowerCase()).filter(Boolean),
        ),
    )

    // Auto-close drawer on location / route change
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [location.pathname])

    // Body scroll lock when mobile drawer is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [mobileMenuOpen])

    // Live search debounce (desktop)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }

        const timer = setTimeout(() => {
            const trimmed = keyword.trim()
            const currentParamKeyword = searchParams.get('keyword') || ''

            if (trimmed !== currentParamKeyword) {
                const nextParams = new URLSearchParams(searchParams)

                if (trimmed) {
                    nextParams.set('keyword', trimmed)
                } else {
                    nextParams.delete('keyword')
                }

                navigate(`/events?${nextParams.toString()}`)
            }
        }, 400)

        return () => clearTimeout(timer)
    }, [keyword]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (location.pathname !== '/events') {
            setKeyword('')
        }
    }, [location.pathname])

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        const trimmed = keyword.trim()
        const nextParams = new URLSearchParams(searchParams)

        if (trimmed) {
            nextParams.set('keyword', trimmed)
            navigate(`/events?${nextParams.toString()}`)
        } else {
            nextParams.delete('keyword')
            navigate('/events')
        }

        setKeyword('')
        setMobileMenuOpen(false)
    }

    const handleClearSearch = () => {
        setKeyword('')
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete('keyword')
        navigate(
            nextParams.toString()
                ? `/events?${nextParams.toString()}`
                : '/events',
        )
    }

    const handleLogout = async () => {
        try {
            await logoutApiCall().unwrap()
            dispatch(logout())
            setMobileMenuOpen(false)
            navigate('/')
        } catch (err) {
            console.error('Logout failed:', err)
            dispatch(logout())
            navigate('/')
        }
    }

    const roleName = (
        userInfo?.role?.role ||
        userInfo?.role ||
        ''
    ).toLowerCase()

    return (
        <header className='sticky top-0 z-50 bg-base-100 border-b border-base-content/10 shadow-sm transition-colors duration-200'>
            {/* Top Navigation Row */}
            <div className='max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3'>
                {/* Left: Mobile Hamburger Toggle + Brand Logo */}
                <div className='flex items-center gap-2 sm:gap-4'>
                    <button
                        type='button'
                        onClick={() => setMobileMenuOpen((prev) => !prev)}
                        className='lg:hidden p-2 -ml-2 rounded-lg text-base-content hover:bg-base-200 transition-colors'
                        aria-label='Toggle Navigation'
                    >
                        {mobileMenuOpen ? (
                            <X className='w-6 h-6' />
                        ) : (
                            <Menu className='w-6 h-6' />
                        )}
                    </button>

                    <Link to='/' className='flex items-center group py-1'>
                        <div className='px-2 py-1 rounded-xl transition-all duration-200 bg-white/95 shadow-sm group-hover:scale-105 border border-black/5'>
                            <img
                                src={logo}
                                alt='EventPass'
                                className='h-8 sm:h-10 w-auto object-contain block'
                            />
                        </div>
                    </Link>

                    <div className='hidden lg:block h-7 border-l border-base-content/20 mx-1'></div>

                    {/* Desktop Navigation Links */}
                    <nav className='hidden lg:flex items-center gap-1'>
                        {/* Categories Dropdown */}
                        <div
                            className='relative py-4'
                            onMouseEnter={() => setIsEventsOpen(true)}
                            onMouseLeave={() => setIsEventsOpen(false)}
                        >
                            <button
                                onClick={() => setIsEventsOpen((prev) => !prev)}
                                className='btn btn-ghost btn-sm font-semibold flex items-center gap-1 normal-case text-xs'
                            >
                                <Calendar className='w-3.5 h-3.5 text-primary' />
                                <span>Categories</span>
                                <ChevronDown
                                    className={`w-3 h-3 opacity-60 transition-transform ${isEventsOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {isEventsOpen && (
                                <div className='absolute top-full left-0 pt-2 z-50 w-80'>
                                    <div className='p-4 shadow-2xl bg-base-100 border border-base-content/15 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-150'>
                                        <div className='flex items-center justify-between pb-2 border-b border-base-content/10 mb-3'>
                                            <span className='text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5'>
                                                <Sparkles className='w-3.5 h-3.5 text-primary' />{' '}
                                                Event Types
                                            </span>
                                            <Link
                                                to='/events'
                                                onClick={() =>
                                                    setIsEventsOpen(false)
                                                }
                                                className='text-[11px] text-primary font-semibold hover:underline'
                                            >
                                                Browse All →
                                            </Link>
                                        </div>

                                        <div className='grid grid-cols-2 gap-1.5'>
                                            {categories.map((cat) => (
                                                <Link
                                                    key={cat._id}
                                                    to={`/events?category=${cat._id}`}
                                                    onClick={() =>
                                                        setIsEventsOpen(false)
                                                    }
                                                    className='px-2.5 py-1.5 rounded-lg bg-base-200/60 hover:bg-primary hover:text-primary-content text-xs font-medium text-base-content capitalize transition-all truncate'
                                                >
                                                    {cat.eventCategory}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* By City Dropdown */}
                        <div
                            className='relative py-4'
                            onMouseEnter={() => setIsCityOpen(true)}
                            onMouseLeave={() => setIsCityOpen(false)}
                        >
                            <button
                                onClick={() => setIsCityOpen((prev) => !prev)}
                                className='btn btn-ghost btn-sm font-semibold flex items-center gap-1 normal-case text-xs'
                            >
                                <MapPin className='w-3.5 h-3.5 text-primary' />
                                <span>By City</span>
                                <ChevronDown
                                    className={`w-3 h-3 opacity-60 transition-transform ${isCityOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {isCityOpen && (
                                <div className='absolute top-full left-0 pt-2 z-50 w-52'>
                                    <div className='p-3 shadow-2xl bg-base-100 border border-base-content/15 rounded-2xl space-y-1'>
                                        <span className='text-[11px] font-bold uppercase tracking-wider text-base-content/60 px-2 block mb-1'>
                                            Select City
                                        </span>
                                        {uniqueCities.length === 0 ? (
                                            <p className='text-xs text-base-content/50 px-2 py-1'>
                                                No venues loaded
                                            </p>
                                        ) : (
                                            uniqueCities.map((city) => (
                                                <Link
                                                    key={city}
                                                    to={`/events?city=${encodeURIComponent(city)}`}
                                                    onClick={() =>
                                                        setIsCityOpen(false)
                                                    }
                                                    className='block px-3 py-1.5 rounded-lg hover:bg-primary hover:text-primary-content text-xs font-medium capitalize transition-colors'
                                                >
                                                    {city}
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Auditoriums Dropdown */}
                        <div
                            className='relative py-4'
                            onMouseEnter={() => setIsAudiOpen(true)}
                            onMouseLeave={() => setIsAudiOpen(false)}
                        >
                            <button
                                onClick={() => setIsAudiOpen((prev) => !prev)}
                                className='btn btn-ghost btn-sm font-semibold flex items-center gap-1 normal-case text-xs'
                            >
                                <Building2 className='w-3.5 h-3.5 text-primary' />
                                <span>Auditoriums</span>
                                <ChevronDown
                                    className={`w-3 h-3 opacity-60 transition-transform ${isAudiOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {isAudiOpen && (
                                <div className='absolute top-full left-0 pt-2 z-50 w-72'>
                                    <div className='p-3 shadow-2xl bg-base-100 border border-base-content/15 rounded-2xl max-h-80 overflow-y-auto space-y-2'>
                                        <span className='text-[11px] font-bold uppercase tracking-wider text-base-content/60 px-2 block'>
                                            Venues & Halls
                                        </span>
                                        {venues.map((v) => (
                                            <div
                                                key={v._id}
                                                className='space-y-1'
                                            >
                                                <span className='text-[11px] font-bold text-primary px-2 block truncate'>
                                                    {v.name}
                                                </span>
                                                {v.auditoriums?.map((audi) => (
                                                    <Link
                                                        key={audi._id}
                                                        to={`/events?auditoriumId=${audi._id}`}
                                                        onClick={() =>
                                                            setIsAudiOpen(false)
                                                        }
                                                        className='block px-3 py-1 rounded-md text-xs text-base-content/80 hover:bg-base-200 transition-colors truncate'
                                                    >
                                                        ↳ {audi.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Highest Rated */}
                        <Link
                            to='/events?sort=highestRated'
                            className='btn btn-ghost btn-sm font-semibold normal-case text-xs flex items-center gap-1.5'
                        >
                            <Star className='w-3.5 h-3.5 text-amber-400 fill-amber-400' />
                            <span>Highest Rated</span>
                        </Link>
                    </nav>
                </div>

                {/* Center: Desktop Search Bar (Hidden on Mobile) */}
                <div className='hidden md:flex flex-1 max-w-sm mx-2'>
                    <form
                        onSubmit={handleSearchSubmit}
                        className='relative w-full flex items-center'
                    >
                        <input
                            type='text'
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder='Type to search events, venues...'
                            className='w-full pl-3.5 pr-14 py-1.5 text-xs rounded-xl bg-base-200/80 border border-base-content/15 text-base-content placeholder-base-content/50 focus:outline-none focus:border-primary focus:bg-base-100 transition-all'
                        />
                        {keyword && (
                            <button
                                type='button'
                                onClick={handleClearSearch}
                                className='absolute right-9 text-base-content/40 hover:text-base-content p-1'
                                title='Clear'
                            >
                                <X className='w-3 h-3' />
                            </button>
                        )}
                        <button
                            type='submit'
                            className='absolute right-1 top-1/2 -translate-y-1/2 btn btn-xs btn-primary rounded-lg px-2 font-bold'
                            title='Search Site'
                        >
                            <Search className='w-3 h-3' />
                        </button>
                    </form>
                </div>

                {/* Right: Theme Toggle & User Auth */}
                <div className='flex items-center gap-2 sm:gap-3'>
                    <button
                        onClick={toggleTheme}
                        className='btn btn-ghost btn-circle btn-sm'
                        title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                    >
                        {theme === 'dark' ? (
                            <Sun className='w-4 h-4 text-amber-400' />
                        ) : (
                            <Moon className='w-4 h-4 text-slate-700' />
                        )}
                    </button>

                    {userInfo ? (
                        <div className='dropdown dropdown-end'>
                            <label
                                tabIndex={0}
                                className='btn btn-ghost btn-sm flex items-center gap-2 pl-2 pr-2 sm:pr-3 rounded-full border border-base-content/15 cursor-pointer'
                            >
                                <div className='w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-xs shadow-sm'>
                                    {userInfo.userName?.charAt(0).toUpperCase()}
                                </div>
                                <div className='text-left hidden lg:block'>
                                    <p className='text-xs font-bold leading-tight truncate max-w-28 text-base-content'>
                                        {userInfo.userName}
                                    </p>
                                    <span className='text-[10px] text-primary uppercase font-mono font-bold'>
                                        {roleName}
                                    </span>
                                </div>
                                <ChevronDown className='w-3.5 h-3.5 opacity-60' />
                            </label>

                            <ul
                                tabIndex={0}
                                className='dropdown-content z-50 menu p-2 shadow-2xl bg-base-100 border border-base-content/15 rounded-2xl w-60 mt-2'
                            >
                                <li className='menu-title text-[11px] text-base-content/60 font-semibold px-3 py-1 uppercase tracking-wider'>
                                    Attendee Console
                                </li>
                                <li>
                                    <Link
                                        to='/my-bookings'
                                        className='flex items-center gap-2 text-sm rounded-lg'
                                    >
                                        <Ticket className='w-4 h-4 text-primary' />{' '}
                                        My Tickets & QR Passes
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to='/profile'
                                        className='flex items-center gap-2 text-sm rounded-lg'
                                    >
                                        <User className='w-4 h-4 opacity-70' />{' '}
                                        Shipping & Profile
                                    </Link>
                                </li>

                                {roleName === 'admin' && (
                                    <>
                                        <div className='divider my-1 border-base-content/10'></div>
                                        <li className='menu-title text-[11px] text-primary font-bold px-3 py-1 uppercase tracking-wider'>
                                            Administration
                                        </li>
                                        <li>
                                            <Link
                                                to='/admin/events'
                                                className='flex items-center gap-2 text-sm rounded-lg'
                                            >
                                                <ShieldCheck className='w-4 h-4 text-primary' />{' '}
                                                Event Management
                                            </Link>
                                        </li>
                                        <li>
                                            <Link
                                                to='/admin/banners/create'
                                                className='flex items-center gap-2 text-sm rounded-lg'
                                            >
                                                <Sparkles className='w-4 h-4 text-primary' />{' '}
                                                Create Hero Banner
                                            </Link>
                                        </li>
                                    </>
                                )}

                                <div className='divider my-1 border-base-content/10'></div>
                                <li>
                                    <button
                                        onClick={handleLogout}
                                        className='text-error hover:bg-error/10 rounded-lg text-sm flex items-center gap-2'
                                    >
                                        <LogOut className='w-4 h-4' /> Sign Out
                                    </button>
                                </li>
                            </ul>
                        </div>
                    ) : (
                        <Link
                            to='/login'
                            className='btn btn-sm btn-primary rounded-xl px-3 sm:px-5 font-semibold shadow-sm text-xs sm:text-sm'
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>

            {/* ================= MOBILE DRAWER OVERLAY ================= */}
            {mobileMenuOpen && (
                <div className='lg:hidden fixed inset-x-0 top-16 bottom-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-start animate-in fade-in duration-150'>
                    <div className='bg-base-100 border-b border-base-content/15 p-4 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl'>
                        {/* Mobile Search Bar inside the Drawer */}
                        <form
                            onSubmit={handleSearchSubmit}
                            className='relative flex items-center'
                        >
                            <input
                                type='text'
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                placeholder='Search events, venues, cities...'
                                className='w-full pl-3.5 pr-14 py-2 text-xs rounded-xl bg-base-200 border border-base-content/15 text-base-content placeholder-base-content/50 focus:outline-none focus:border-primary'
                            />
                            {keyword && (
                                <button
                                    type='button'
                                    onClick={handleClearSearch}
                                    className='absolute right-9 text-base-content/40 hover:text-base-content p-1'
                                >
                                    <X className='w-3.5 h-3.5' />
                                </button>
                            )}
                            <button
                                type='submit'
                                className='absolute right-1 btn btn-xs btn-primary rounded-lg px-2.5 font-bold'
                            >
                                <Search className='w-3.5 h-3.5' />
                            </button>
                        </form>

                        {/* Quick Links */}
                        <div className='space-y-1 border-b border-base-content/10 pb-3'>
                            <Link
                                to='/events?sort=highestRated'
                                onClick={() => setMobileMenuOpen(false)}
                                className='flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-base-200 font-semibold text-sm text-amber-500'
                            >
                                <Star className='w-4 h-4 fill-amber-500' />{' '}
                                Highest Rated Events
                            </Link>
                            <Link
                                to='/events'
                                onClick={() => setMobileMenuOpen(false)}
                                className='block px-3 py-2 rounded-xl hover:bg-base-200 font-medium text-sm text-base-content'
                            >
                                Browse All Events
                            </Link>
                        </div>

                        {/* Categories Accordion */}
                        {categories.length > 0 && (
                            <div className='border-b border-base-content/10 pb-3'>
                                <button
                                    type='button'
                                    onClick={() =>
                                        setMobileCategoriesOpen((p) => !p)
                                    }
                                    className='w-full flex items-center justify-between px-2 py-1 text-xs font-bold uppercase tracking-wider text-base-content/70'
                                >
                                    <span className='flex items-center gap-1.5'>
                                        <Calendar className='w-3.5 h-3.5 text-primary' />{' '}
                                        Categories
                                    </span>
                                    <ChevronDown
                                        className={`w-3.5 h-3.5 transition-transform ${mobileCategoriesOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {mobileCategoriesOpen && (
                                    <div className='grid grid-cols-2 gap-1.5 mt-2 pt-1'>
                                        {categories.map((cat) => (
                                            <Link
                                                key={cat._id}
                                                to={`/events?category=${cat._id}`}
                                                onClick={() =>
                                                    setMobileMenuOpen(false)
                                                }
                                                className='px-2.5 py-1.5 rounded-lg bg-base-200/80 text-xs font-medium text-base-content capitalize truncate'
                                            >
                                                {cat.eventCategory}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Venues Accordion */}
                        {venues.length > 0 && (
                            <div className='border-b border-base-content/10 pb-3'>
                                <button
                                    type='button'
                                    onClick={() =>
                                        setMobileVenuesOpen((p) => !p)
                                    }
                                    className='w-full flex items-center justify-between px-2 py-1 text-xs font-bold uppercase tracking-wider text-base-content/70'
                                >
                                    <span className='flex items-center gap-1.5'>
                                        <Building2 className='w-3.5 h-3.5 text-primary' />{' '}
                                        Venues & Auditoriums
                                    </span>
                                    <ChevronDown
                                        className={`w-3.5 h-3.5 transition-transform ${mobileVenuesOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                {mobileVenuesOpen && (
                                    <div className='space-y-2 mt-2 pt-1 max-h-48 overflow-y-auto'>
                                        {venues.map((v) => (
                                            <div
                                                key={v._id}
                                                className='space-y-1'
                                            >
                                                <span className='text-[11px] font-bold text-primary px-2 block truncate'>
                                                    {v.name}
                                                </span>
                                                {v.auditoriums?.map((audi) => (
                                                    <Link
                                                        key={audi._id}
                                                        to={`/events?auditoriumId=${audi._id}`}
                                                        onClick={() =>
                                                            setMobileMenuOpen(
                                                                false,
                                                            )
                                                        }
                                                        className='block px-4 py-1 text-xs text-base-content/80 hover:bg-base-200 rounded-lg truncate'
                                                    >
                                                        ↳ {audi.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Cities Pill Section */}
                        {uniqueCities.length > 0 && (
                            <div className='space-y-2 pt-1'>
                                <span className='text-xs font-bold uppercase tracking-wider text-base-content/60 block px-2'>
                                    Available Cities
                                </span>
                                <div className='flex flex-wrap gap-1.5 px-1'>
                                    {uniqueCities.map((city) => (
                                        <Link
                                            key={city}
                                            to={`/events?city=${encodeURIComponent(city)}`}
                                            onClick={() =>
                                                setMobileMenuOpen(false)
                                            }
                                            className='px-3 py-1 rounded-full bg-base-200 hover:bg-primary hover:text-primary-content text-xs font-medium capitalize transition-colors'
                                        >
                                            {city}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}

export default Navbar
