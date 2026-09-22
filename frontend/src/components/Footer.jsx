// frontend/src/components/Footer.jsx

import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import logo from '../assets/logo.png'

const Footer = () => {
    const { userInfo } = useSelector((state) => state.auth)

    const roleName = (
        userInfo?.role?.role ||
        userInfo?.role ||
        ''
    ).toLowerCase()

    return (
        <footer className='border-t border-base-content/10 bg-base-100 pt-12 pb-8 mt-20 transition-colors duration-200'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-sm'>
                {/* Col 1: Brand & Emblem */}
                <div className='space-y-3'>
                    <Link to='/' className='inline-block group'>
                        <div className='px-2.5 py-1 rounded-xl transition-all duration-200 bg-white/95 shadow-sm group-hover:scale-105 border border-black/5 w-fit'>
                            <img
                                src={logo}
                                alt='EventPass'
                                className='h-10 w-auto object-contain block'
                            />
                        </div>
                    </Link>
                    <p className='text-base-content/70 text-xs leading-relaxed max-w-xs'>
                        Modern multi-vendor ticketing infrastructure with
                        cryptographic gate check-ins and verified dispatch.
                    </p>
                </div>

                {/* Col 2: Discover Links */}
                <div>
                    <span className='font-bold text-base-content block mb-3'>
                        Discover
                    </span>
                    <ul className='space-y-2 text-xs text-base-content/70'>
                        <li>
                            <Link
                                to='/events'
                                className='hover:text-primary transition-colors'
                            >
                                Browse All Events
                            </Link>
                        </li>
                        <li>
                            <Link
                                to='/events?sort=highestRated'
                                className='hover:text-primary transition-colors'
                            >
                                Top Rated Experiences
                            </Link>
                        </li>
                        <li>
                            <Link
                                to='/events'
                                className='hover:text-primary transition-colors'
                            >
                                Venues & Auditoriums
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Col 3: Policies & Support */}
                <div>
                    <span className='font-bold text-base-content block mb-3'>
                        Support & Policies
                    </span>
                    <ul className='space-y-2 text-xs text-base-content/70'>
                        <li>
                            <Link
                                to='/terms'
                                className='hover:text-primary transition-colors'
                            >
                                Cancellation & Refund Policy
                            </Link>
                        </li>
                        <li>
                            <Link
                                to='/dispatch'
                                className='hover:text-primary transition-colors'
                            >
                                Physical Courier Dispatch
                            </Link>
                        </li>
                        <li>
                            <Link
                                to='/contact'
                                className='hover:text-primary transition-colors'
                            >
                                Help Center
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Col 4: Contextual Console / Access */}
                <div>
                    <span className='font-bold text-base-content block mb-3'>
                        {userInfo
                            ? `Console (${roleName || 'Member'})`
                            : 'Join Platform'}
                    </span>
                    <ul className='space-y-2 text-xs text-base-content/70'>
                        {userInfo ? (
                            <>
                                <li>
                                    <Link
                                        to='/my-bookings'
                                        className='text-primary hover:underline'
                                    >
                                        My Active Tickets
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to='/profile'
                                        className='hover:text-primary transition-colors'
                                    >
                                        Delivery Address Settings
                                    </Link>
                                </li>
                                {roleName === 'admin' && (
                                    <li>
                                        <Link
                                            to='/admin/events'
                                            className='hover:text-primary transition-colors font-medium'
                                        >
                                            Admin Dashboard
                                        </Link>
                                    </li>
                                )}
                            </>
                        ) : (
                            <>
                                <li>
                                    <Link
                                        to='/login'
                                        className='text-primary hover:underline font-semibold'
                                    >
                                        Login to Account
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to='/register'
                                        className='hover:text-primary transition-colors'
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
    )
}

export default Footer
