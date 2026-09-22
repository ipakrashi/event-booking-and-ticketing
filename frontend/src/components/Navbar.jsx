import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
    Ticket,
    User,
    LogOut,
    Calendar,
    MapPin,
    Building2,
    Star,
    ScanLine,
    Shield,
} from 'lucide-react'
import { useLogoutMutation } from '../redux/api/usersApiSlice'
import { logout } from '../redux/slices/authSlice'

const Navbar = () => {
    const { userInfo } = useSelector((state) => state.auth)
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

    // Role extraction helper: protects against raw MongoDB ObjectIds
    const getDisplayRole = () => {
        if (!userInfo?.role) return 'ATTENDEE'
        if (typeof userInfo.role === 'object') {
            return (userInfo.role.role || 'ATTENDEE').toUpperCase()
        }
        if (typeof userInfo.role === 'string') {
            // Guard against unpopulated 24-character hexadecimal ObjectId
            if (/^[a-f\d]{24}$/i.test(userInfo.role)) {
                return 'ATTENDEE'
            }
            return userInfo.role.toUpperCase()
        }
        return 'ATTENDEE'
    }

    const currentRole = getDisplayRole()
    const isAdminOrStaff =
        currentRole === 'ADMIN' ||
        currentRole === 'ORGANIZER' ||
        currentRole === 'STAFF'

    return (
        <header className='navbar bg-base-100/90 backdrop-blur-md sticky top-0 z-50 px-4 sm:px-8 border-b border-base-content/10 shadow-sm'>
            {/* Left Brand */}
            <div className='navbar-start flex items-center gap-2'>
                <Link
                    to='/'
                    className='flex items-center gap-2 font-black text-xl text-primary tracking-tight'
                >
                    <div className='w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm'>
                        <Ticket className='w-5 h-5' />
                    </div>
                    <span className='hidden sm:inline bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent'>
                        EventPass
                    </span>
                </Link>
            </div>

            {/* Middle Nav Items */}
            <div className='navbar-center hidden lg:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-base-content/70'>
                <Link
                    to='/events'
                    className='flex items-center gap-1.5 hover:text-primary transition-colors'
                >
                    <Calendar className='w-3.5 h-3.5' /> Events Catalog
                </Link>
                <Link
                    to='/events'
                    className='flex items-center gap-1.5 hover:text-primary transition-colors'
                >
                    <MapPin className='w-3.5 h-3.5' /> By City
                </Link>
                <Link
                    to='/events'
                    className='flex items-center gap-1.5 hover:text-primary transition-colors'
                >
                    <Building2 className='w-3.5 h-3.5' /> Auditoriums
                </Link>
                <Link
                    to='/events'
                    className='flex items-center gap-1.5 hover:text-primary transition-colors'
                >
                    <Star className='w-3.5 h-3.5 text-amber-400' /> Highest
                    Rated
                </Link>
            </div>

            {/* Right Auth / User Dropdown */}
            <div className='navbar-end flex items-center gap-3'>
                {userInfo ? (
                    <div className='dropdown dropdown-end'>
                        <label
                            tabIndex={0}
                            className='btn btn-ghost rounded-2xl flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-base-200'
                        >
                            <div className='w-8 h-8 rounded-xl bg-primary text-primary-content flex items-center justify-center font-bold text-xs shadow-sm'>
                                {userInfo.userName?.charAt(0).toUpperCase() ||
                                    'U'}
                            </div>
                            <div className='hidden sm:flex flex-col text-left'>
                                <span className='text-xs font-bold leading-none text-base-content'>
                                    {userInfo.userName}
                                </span>
                                <span className='text-[10px] font-bold uppercase tracking-wider text-primary mt-0.5'>
                                    {currentRole}
                                </span>
                            </div>
                        </label>
                        <ul
                            tabIndex={0}
                            className='mt-3 z-[1] p-2 shadow-2xl menu menu-sm dropdown-content bg-base-100 rounded-2xl w-56 border border-base-content/10 divide-y divide-base-content/5'
                        >
                            <li className='px-3 py-2 text-xs'>
                                <span className='font-bold block text-base-content truncate'>
                                    {userInfo.userName}
                                </span>
                                <span className='text-base-content/50 block text-[11px] truncate'>
                                    {userInfo.email}
                                </span>
                            </li>
                            <li className='pt-1'>
                                <Link
                                    to='/profile'
                                    className='flex items-center gap-2 rounded-xl text-xs py-2'
                                >
                                    <User className='w-3.5 h-3.5 text-primary' />
                                    Profile & Address
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to='/my-bookings'
                                    className='flex items-center gap-2 rounded-xl text-xs py-2'
                                >
                                    <Ticket className='w-3.5 h-3.5 text-primary' />
                                    My Entry Passes
                                </Link>
                            </li>
                            {isAdminOrStaff && (
                                <li>
                                    <Link
                                        to='/gatekeeper'
                                        className='flex items-center gap-2 rounded-xl text-xs py-2'
                                    >
                                        <ScanLine className='w-3.5 h-3.5 text-success' />
                                        Gatekeeper Scanner
                                    </Link>
                                </li>
                            )}
                            {currentRole === 'ADMIN' && (
                                <li>
                                    <Link
                                        to='/admin'
                                        className='flex items-center gap-2 rounded-xl text-xs py-2'
                                    >
                                        <Shield className='w-3.5 h-3.5 text-amber-500' />
                                        Admin Management
                                    </Link>
                                </li>
                            )}
                            <li className='pt-1'>
                                <button
                                    onClick={logoutHandler}
                                    className='flex items-center gap-2 rounded-xl text-xs text-error py-2 hover:bg-error/10'
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
                            className='btn btn-ghost btn-sm rounded-xl text-xs font-bold'
                        >
                            Sign In
                        </Link>
                        <Link
                            to='/register'
                            className='btn btn-primary btn-sm rounded-xl text-xs font-bold shadow-md shadow-primary/20'
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
