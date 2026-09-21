// frontend/src/components/Navbar.jsx

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { logout } from '../redux/slices/authSlice'
import { useLogoutApiMutation } from '../redux/api/usersApiSlice'
import { useGetCategoriesQuery } from '../redux/api/categoriesApiSlice'
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
    Phone,
    Info,
    Sun,
    Moon,
    Menu,
    X,
} from 'lucide-react'

const Navbar = () => {
    const { userInfo } = useSelector((state) => state.auth)
    const { theme, toggleTheme } = useTheme()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isEventsOpen, setIsEventsOpen] = useState(false)

    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [logoutApiCall] = useLogoutApiMutation()
    const { data: categoryData } = useGetCategoriesQuery()
    const categories = categoryData?.data || []

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
        <header className='sticky top-0 z-50 bg-base-100/95 backdrop-blur-md border-b border-base-content/10 shadow-sm transition-colors duration-200'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between'>
                {/* ================= MOBILE TOGGLE ================= */}
                <div className='flex items-center gap-2 lg:hidden'>
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className='btn btn-ghost btn-sm btn-square'
                        aria-label='Toggle Navigation Menu'
                    >
                        {mobileMenuOpen ? (
                            <X className='w-5 h-5' />
                        ) : (
                            <Menu className='w-5 h-5' />
                        )}
                    </button>
                </div>

                {/* ================= LEFT: DESKTOP NAVIGATION & MEGAMENU ================= */}
                <nav className='hidden lg:flex items-center gap-2'>
                    {/* Stable Megamenu Container with zero-gap hover bridge */}
                    <div
                        className='relative py-4'
                        onMouseEnter={() => setIsEventsOpen(true)}
                        onMouseLeave={() => setIsEventsOpen(false)}
                    >
                        <button
                            onClick={() => setIsEventsOpen((prev) => !prev)}
                            className='btn btn-ghost btn-sm font-semibold flex items-center gap-1.5 normal-case text-sm'
                        >
                            <Calendar className='w-4 h-4 text-primary' />
                            <span>Events</span>
                            <ChevronDown
                                className={`w-3.5 h-3.5 opacity-60 transition-transform duration-200 ${
                                    isEventsOpen ? 'rotate-180' : ''
                                }`}
                            />
                        </button>

                        {/* Megamenu Card with invisible hover bridge (before pseudo-area) */}
                        {isEventsOpen && (
                            <div
                                className='absolute top-full left-0 pt-2 z-50 w-[420px]'
                                onMouseEnter={() => setIsEventsOpen(true)}
                                onMouseLeave={() => setIsEventsOpen(false)}
                            >
                                <div className='p-5 shadow-2xl bg-base-100 border border-base-content/15 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-150'>
                                    <div className='flex items-center justify-between pb-3 border-b border-base-content/10 mb-3'>
                                        <span className='text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5'>
                                            <Sparkles className='w-3.5 h-3.5 text-primary' />{' '}
                                            Event Categories
                                        </span>
                                        <Link
                                            to='/events'
                                            onClick={() =>
                                                setIsEventsOpen(false)
                                            }
                                            className='text-xs text-primary font-semibold hover:underline'
                                        >
                                            Browse Catalog →
                                        </Link>
                                    </div>

                                    {categories.length === 0 ? (
                                        <p className='text-xs text-base-content/60 py-2'>
                                            No categories available
                                        </p>
                                    ) : (
                                        <div className='grid grid-cols-2 gap-2'>
                                            {categories.map((cat) => (
                                                <Link
                                                    key={cat._id}
                                                    to={`/events?category=${cat._id}`}
                                                    onClick={() =>
                                                        setIsEventsOpen(false)
                                                    }
                                                    className='px-3 py-2.5 rounded-xl bg-base-200/60 hover:bg-primary hover:text-primary-content text-xs font-medium text-base-content capitalize transition-all flex items-center justify-between group'
                                                >
                                                    <span className='font-semibold'>
                                                        {cat.eventCategory}
                                                    </span>
                                                    <span className='text-[10px] opacity-60 group-hover:opacity-100'>
                                                        Explore
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <Link
                        to='/about'
                        className='btn btn-ghost btn-sm font-semibold normal-case'
                    >
                        <Info className='w-4 h-4 opacity-70' />
                        <span>About</span>
                    </Link>

                    <Link
                        to='/contact'
                        className='btn btn-ghost btn-sm font-semibold normal-case'
                    >
                        <Phone className='w-4 h-4 opacity-70' />
                        <span>Contact</span>
                    </Link>
                </nav>

                {/* ================= CENTER: ADAPTIVE LOGO ================= */}
                <div className='flex items-center justify-center'>
                    <Link to='/' className='flex items-center group py-1'>
                        <div className='px-3 py-1.5 rounded-2xl transition-all duration-200 bg-white/95 shadow-sm hover:shadow group-hover:scale-105'>
                            <img
                                src={logo}
                                alt='EventPass'
                                className='h-12 w-auto object-contain block'
                            />
                        </div>
                    </Link>
                </div>

                {/* ================= RIGHT: THEME TOGGLE & AUTH ================= */}
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
                                className='btn btn-ghost btn-sm flex items-center gap-2 pl-2 pr-3 rounded-full border border-base-content/15 cursor-pointer'
                            >
                                <div className='w-7 h-7 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold text-xs shadow-sm'>
                                    {userInfo.userName?.charAt(0).toUpperCase()}
                                </div>
                                <div className='text-left hidden md:block'>
                                    <p className='text-xs font-bold leading-tight truncate max-w-[100px]'>
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
                            className='btn btn-sm btn-primary rounded-xl px-4 sm:px-5 font-semibold shadow-sm'
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>

            {/* ================= MOBILE MENU ================= */}
            {mobileMenuOpen && (
                <div className='lg:hidden bg-base-100 border-b border-base-content/10 px-4 py-5 space-y-4 shadow-xl'>
                    <div className='space-y-1'>
                        <span className='text-xs font-bold uppercase tracking-wider text-base-content/50 block px-2 mb-1'>
                            Navigation
                        </span>
                        <Link
                            to='/events'
                            onClick={() => setMobileMenuOpen(false)}
                            className='block px-3 py-2 rounded-xl hover:bg-base-200 font-medium text-sm'
                        >
                            Browse All Events
                        </Link>
                        <Link
                            to='/about'
                            onClick={() => setMobileMenuOpen(false)}
                            className='block px-3 py-2 rounded-xl hover:bg-base-200 font-medium text-sm'
                        >
                            About EventPass
                        </Link>
                        <Link
                            to='/contact'
                            onClick={() => setMobileMenuOpen(false)}
                            className='block px-3 py-2 rounded-xl hover:bg-base-200 font-medium text-sm'
                        >
                            Contact Support
                        </Link>
                    </div>

                    {categories.length > 0 && (
                        <div className='space-y-1 pt-2 border-t border-base-content/10'>
                            <span className='text-xs font-bold uppercase tracking-wider text-base-content/50 block px-2 mb-1'>
                                Explore Categories
                            </span>
                            <div className='grid grid-cols-2 gap-1.5'>
                                {categories.map((cat) => (
                                    <Link
                                        key={cat._id}
                                        to={`/events?category=${cat._id}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className='px-3 py-1.5 rounded-lg bg-base-200/50 text-xs capitalize truncate'
                                    >
                                        {cat.eventCategory}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </header>
    )
}

export default Navbar
