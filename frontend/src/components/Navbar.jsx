// frontend/src/components/Navbar.jsx

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
    ChevronDown,
    Search,
    Sun,
    Calendar,
    MapPin,
    Building2,
    Star,
    User,
    Ticket,
    LogOut,
    Shield,
    ScanLine,
} from 'lucide-react'
import { useLogoutMutation } from '../redux/api/usersApiSlice'
import { logout } from '../redux/slices/authSlice'

const Navbar = () => {
    const { userInfo } = useSelector((state) => state.auth)
    const [searchQuery, setSearchQuery] = useState('')
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const [logoutApiCall] = useLogoutMutation()

    const logoutHandler = async () => {
        try {
            await logoutApiCall().unwrap()
            dispatch(logout())
            navigate('/login')
        } catch (err) {
            console.error('Logout error:', err)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            navigate(`/events?search=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    // Role display helper: guarantees clean text even if backend sends raw ObjectId
    const getDisplayRole = () => {
        if (!userInfo?.role) return 'ATTENDEE'
        if (typeof userInfo.role === 'object') {
            return (userInfo.role.role || 'ATTENDEE').toUpperCase()
        }
        if (typeof userInfo.role === 'string') {
            if (/^[a-f\d]{24}$/i.test(userInfo.role)) {
                return 'ATTENDEE'
            }
            return userInfo.role.toUpperCase()
        }
        return 'ATTENDEE'
    }

    const currentRole = getDisplayRole()
    const isAdmin = currentRole === 'ADMIN'
    const isStaffOrAdmin =
        currentRole === 'ADMIN' ||
        currentRole === 'ORGANIZER' ||
        currentRole === 'STAFF'

    return (
        <header className='navbar bg-[#0f172a] px-4 sm:px-8 border-b border-white/10 sticky top-0 z-50 text-white'>
            {/* 1. Left Brand / Logo */}
            <div className='navbar-start w-auto flex items-center gap-6'>
                <Link to='/' className='flex items-center gap-2'>
                    <div className='bg-white px-2 py-1 rounded-xl shadow-md flex items-center justify-center'>
                        <img
                            src='/logo.png'
                            alt='EventPass'
                            className='h-8 w-auto object-contain'
                            onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display =
                                    'inline-block'
                            }}
                        />
                        <span className='hidden text-indigo-600 font-black text-sm tracking-tighter'>
                            EVENTPASS
                        </span>
                    </div>
                </Link>

                {/* Navigation Links with Chevron Menus */}
                <div className='hidden xl:flex items-center gap-5 text-xs font-semibold text-gray-300'>
                    <div className='dropdown dropdown-hover'>
                        <label
                            tabIndex={0}
                            className='flex items-center gap-1 cursor-pointer hover:text-white transition-colors'
                        >
                            <Calendar className='w-3.5 h-3.5 text-indigo-400' />
                            <span>Categories</span>
                            <ChevronDown className='w-3 h-3 opacity-60' />
                        </label>
                        <ul
                            tabIndex={0}
                            className='dropdown-content z-[1] menu p-2 shadow-2xl bg-[#1e293b] rounded-2xl w-48 border border-white/10 mt-2'
                        >
                            <li>
                                <Link to='/events'>All Categories</Link>
                            </li>
                            <li>
                                <Link to='/events?category=music'>
                                    Concerts & Music
                                </Link>
                            </li>
                            <li>
                                <Link to='/events?category=theatre'>
                                    Theatre & Drama
                                </Link>
                            </li>
                            <li>
                                <Link to='/events?category=sports'>
                                    Sports & Racing
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className='dropdown dropdown-hover'>
                        <label
                            tabIndex={0}
                            className='flex items-center gap-1 cursor-pointer hover:text-white transition-colors'
                        >
                            <MapPin className='w-3.5 h-3.5 text-indigo-400' />
                            <span>By City</span>
                            <ChevronDown className='w-3 h-3 opacity-60' />
                        </label>
                        <ul
                            tabIndex={0}
                            className='dropdown-content z-[1] menu p-2 shadow-2xl bg-[#1e293b] rounded-2xl w-44 border border-white/10 mt-2'
                        >
                            <li>
                                <Link to='/events?city=Kolkata'>Kolkata</Link>
                            </li>
                            <li>
                                <Link to='/events?city=Mumbai'>Mumbai</Link>
                            </li>
                            <li>
                                <Link to='/events?city=Delhi'>Delhi NCR</Link>
                            </li>
                            <li>
                                <Link to='/events?city=Bengaluru'>
                                    Bengaluru
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div className='dropdown dropdown-hover'>
                        <label
                            tabIndex={0}
                            className='flex items-center gap-1 cursor-pointer hover:text-white transition-colors'
                        >
                            <Building2 className='w-3.5 h-3.5 text-indigo-400' />
                            <span>Auditoriums</span>
                            <ChevronDown className='w-3 h-3 opacity-60' />
                        </label>
                        <ul
                            tabIndex={0}
                            className='dropdown-content z-[1] menu p-2 shadow-2xl bg-[#1e293b] rounded-2xl w-52 border border-white/10 mt-2'
                        >
                            <li>
                                <Link to='/events'>All Venues</Link>
                            </li>
                            <li>
                                <Link to='/events?venue=Nazrul+Mancha'>
                                    Nazrul Mancha
                                </Link>
                            </li>
                            <li>
                                <Link to='/events?venue=Science+City'>
                                    Science City Main
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <Link
                        to='/events?filter=highest-rated'
                        className='flex items-center gap-1 hover:text-white transition-colors text-amber-300'
                    >
                        <Star className='w-3.5 h-3.5 fill-amber-300' />
                        <span>Highest Rated</span>
                    </Link>
                </div>
            </div>

            {/* 2. Middle Search Bar */}
            <div className='navbar-center flex-1 max-w-xl mx-4 hidden md:flex'>
                <form onSubmit={handleSearch} className='w-full relative'>
                    <input
                        type='text'
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder='Type to search events, venues...'
                        className='w-full bg-[#1e293b]/70 border border-white/10 rounded-full py-2 pl-4 pr-11 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors'
                    />
                    <button
                        type='submit'
                        className='absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white transition-colors'
                    >
                        <Search className='w-3.5 h-3.5' />
                    </button>
                </form>
            </div>

            {/* 3. Right: Theme Toggle & User Profile Dropdown */}
            <div className='navbar-end w-auto flex items-center gap-3'>
                {/* Sun Theme Icon */}
                <button
                    type='button'
                    className='btn btn-ghost btn-circle btn-sm text-amber-400 hover:bg-white/5'
                    aria-label='Toggle Theme'
                >
                    <Sun className='w-4 h-4' />
                </button>

                {userInfo ? (
                    <div className='dropdown dropdown-end'>
                        <label
                            tabIndex={0}
                            className='flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full py-1.5 pl-1.5 pr-3 cursor-pointer transition-all'
                        >
                            <div className='w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase'>
                                {userInfo.userName?.charAt(0) || 'U'}
                            </div>
                            <div className='flex flex-col text-left'>
                                <span className='text-xs font-bold leading-none text-white max-w-[120px] truncate'>
                                    {userInfo.userName}
                                </span>
                                <span className='text-[9px] font-extrabold uppercase tracking-wider text-indigo-400 mt-0.5 leading-none'>
                                    {currentRole}
                                </span>
                            </div>
                            <ChevronDown className='w-3.5 h-3.5 text-gray-400 ml-0.5' />
                        </label>

                        <ul
                            tabIndex={0}
                            className='dropdown-content z-[1] menu p-2 shadow-2xl bg-[#161b22] border border-white/10 rounded-2xl w-60 mt-3 divide-y divide-white/5'
                        >
                            <li className='px-3 py-2 text-xs'>
                                <span className='font-bold block text-white truncate'>
                                    {userInfo.userName}
                                </span>
                                <span className='text-gray-400 block text-[11px] truncate'>
                                    {userInfo.email}
                                </span>
                            </li>
                            <li className='pt-1'>
                                <Link
                                    to='/profile'
                                    className='flex items-center gap-2 rounded-xl text-xs py-2 hover:bg-white/5 text-gray-300 hover:text-white'
                                >
                                    <User className='w-3.5 h-3.5 text-indigo-400' />
                                    Profile & Delivery Address
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to='/my-bookings'
                                    className='flex items-center gap-2 rounded-xl text-xs py-2 hover:bg-white/5 text-gray-300 hover:text-white'
                                >
                                    <Ticket className='w-3.5 h-3.5 text-indigo-400' />
                                    My Bookings & QR Passes
                                </Link>
                            </li>
                            {isStaffOrAdmin && (
                                <li>
                                    <Link
                                        to='/gatekeeper'
                                        className='flex items-center gap-2 rounded-xl text-xs py-2 hover:bg-white/5 text-emerald-400'
                                    >
                                        <ScanLine className='w-3.5 h-3.5' />
                                        Gatekeeper Scanner
                                    </Link>
                                </li>
                            )}
                            {isAdmin && (
                                <li>
                                    <Link
                                        to='/admin'
                                        className='flex items-center gap-2 rounded-xl text-xs py-2 hover:bg-white/5 text-amber-400'
                                    >
                                        <Shield className='w-3.5 h-3.5' />
                                        Admin Dashboard
                                    </Link>
                                </li>
                            )}
                            <li className='pt-1'>
                                <button
                                    onClick={logoutHandler}
                                    className='flex items-center gap-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 py-2'
                                >
                                    <LogOut className='w-3.5 h-3.5' /> Sign Out
                                </button>
                            </li>
                        </ul>
                    </div>
                ) : (
                    <div className='flex items-center gap-2'>
                        <Link
                            to='/login'
                            className='btn btn-ghost btn-sm text-xs font-semibold text-gray-300 hover:text-white rounded-xl'
                        >
                            Sign In
                        </Link>
                        <Link
                            to='/register'
                            className='btn bg-indigo-600 hover:bg-indigo-500 text-white btn-sm text-xs font-bold rounded-xl border-0 shadow-md shadow-indigo-600/30'
                        >
                            Register
                        </Link>
                    </div>
                )}
            </div>
        </header>
    )
}

export default Navbar
