// frontend/src/pages/ProfileScreen.jsx

import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
    User,
    Mail,
    Phone,
    MapPin,
    Building,
    Compass,
    Lock,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Save,
    Truck,
    Eye,
    EyeOff,
    KeyRound,
} from 'lucide-react'
import { useUpdateUserMutation } from '../redux/api/usersApiSlice'
import { setCredentials } from '../redux/slices/authSlice'

const ProfileScreen = () => {
    const { userInfo } = useSelector((state) => state.auth)
    const dispatch = useDispatch()

    const [updateUser, { isLoading: isUpdatingProfile }] =
        useUpdateUserMutation()

    // -------------------------------------------------------------------------
    // FORM 1: Profile & Shipping Details State
    // -------------------------------------------------------------------------
    const [userName, setUserName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [city, setCity] = useState('')
    const [stateName, setStateName] = useState('')
    const [country, setCountry] = useState('India')
    const [pincode, setPincode] = useState('')
    const [profileFeedback, setProfileFeedback] = useState(null)

    // -------------------------------------------------------------------------
    // FORM 2: Security & Password State
    // -------------------------------------------------------------------------
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
    const [passwordFeedback, setPasswordFeedback] = useState(null)

    useEffect(() => {
        if (userInfo) {
            setUserName(userInfo.userName || '')
            setEmail(userInfo.email || '')
            setPhone(userInfo.phone || '')
            setAddress(userInfo.address || '')
            setCity(userInfo.city || '')
            setStateName(userInfo.state || '')
            setCountry(userInfo.country || 'India')
            setPincode(userInfo.pincode || '')
        }
    }, [userInfo])

    // =========================================================================
    // HANDLER 1: Submit Profile & Shipping Address
    // =========================================================================
    const handleProfileSubmit = async (e) => {
        e.preventDefault()
        setProfileFeedback(null)

        const trimmedPhone = phone.trim()
        if (trimmedPhone && !/^[6-9]\d{9}$/.test(trimmedPhone)) {
            setProfileFeedback({
                type: 'error',
                message:
                    'Please enter a valid 10-digit Indian mobile number starting with 6-9.',
            })
            return
        }

        const trimmedPin = pincode.trim()
        if (trimmedPin && !/^\d{6}$/.test(trimmedPin)) {
            setProfileFeedback({
                type: 'error',
                message: 'Please enter a valid 6-digit postal PIN code.',
            })
            return
        }

        try {
            const res = await updateUser({
                id: userInfo._id,
                userName: userName.trim(),
                email: email.trim().toLowerCase(),
                phone: trimmedPhone || null,
                address: address.trim() || null,
                city: city.trim() || null,
                state: stateName.trim() || null,
                country: country.trim() || 'India',
                pincode: trimmedPin || null,
            }).unwrap()

            dispatch(
                setCredentials({
                    ...userInfo,
                    ...res.data,
                }),
            )

            setProfileFeedback({
                type: 'success',
                message:
                    'Shipping address and contact details saved successfully!',
            })
        } catch (err) {
            setProfileFeedback({
                type: 'error',
                message:
                    err?.data?.message ||
                    err?.error ||
                    'Failed to update profile details. Please try again.',
            })
        }
    }

    // =========================================================================
    // HANDLER 2: Submit Isolated Password Change
    // =========================================================================
    const handlePasswordSubmit = async (e) => {
        e.preventDefault()
        setPasswordFeedback(null)

        if (!currentPassword) {
            setPasswordFeedback({
                type: 'error',
                message: 'Please enter your current password.',
            })
            return
        }

        if (newPassword.length < 6) {
            setPasswordFeedback({
                type: 'error',
                message: 'New password must be at least 6 characters long.',
            })
            return
        }

        if (newPassword !== confirmPassword) {
            setPasswordFeedback({
                type: 'error',
                message: 'New password and confirmation do not match.',
            })
            return
        }

        if (currentPassword === newPassword) {
            setPasswordFeedback({
                type: 'error',
                message:
                    'New password must be different from your current password.',
            })
            return
        }

        try {
            setIsUpdatingPassword(true)
            await updateUser({
                id: userInfo._id,
                currentPassword,
                password: newPassword,
            }).unwrap()

            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
            setPasswordFeedback({
                type: 'success',
                message:
                    'Password updated successfully! Your active session is secure.',
            })
        } catch (err) {
            setPasswordFeedback({
                type: 'error',
                message:
                    err?.data?.message ||
                    err?.error ||
                    'Failed to update password. Please check your current password.',
            })
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    const roleName = (
        userInfo?.role?.role ||
        userInfo?.role ||
        'Attendee'
    ).toUpperCase()

    return (
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8'>
            {/* Header / Account Overview Banner */}
            <div className='bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-content/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6'>
                <div className='flex items-center gap-4'>
                    <div className='w-16 h-16 rounded-2xl bg-primary text-primary-content font-black text-2xl flex items-center justify-center shadow-md shadow-primary/20'>
                        {userName ? userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-2xl font-black text-base-content'>
                                {userName || 'My Account'}
                            </h1>
                            <span className='badge badge-primary badge-sm font-bold uppercase tracking-wider'>
                                {roleName}
                            </span>
                        </div>
                        <p className='text-xs text-base-content/60 mt-1 font-mono'>
                            {email}
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-2 text-xs text-base-content/70 bg-base-200/80 px-4 py-2.5 rounded-2xl border border-base-content/10'>
                    <ShieldCheck className='w-4 h-4 text-primary' />
                    <span>Anti-Passback Verified Account</span>
                </div>
            </div>

            {/* ============================================================= */}
            {/* FORM 1: PROFILE, SHIPPING & CONTACT (ISOLATED)                */}
            {/* ============================================================= */}
            <form onSubmit={handleProfileSubmit} className='space-y-6'>
                {/* Feedback for Profile */}
                {profileFeedback && (
                    <div
                        className={`alert rounded-2xl shadow-sm text-sm ${
                            profileFeedback.type === 'success'
                                ? 'alert-success text-success-content'
                                : 'alert-error text-error-content'
                        }`}
                    >
                        {profileFeedback.type === 'success' ? (
                            <CheckCircle2 className='w-5 h-5 shrink-0' />
                        ) : (
                            <AlertCircle className='w-5 h-5 shrink-0' />
                        )}
                        <span>{profileFeedback.message}</span>
                    </div>
                )}

                {/* Section 1: Basic Identity Information */}
                <div className='bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-content/10 shadow-sm space-y-5'>
                    <div className='flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider pb-2 border-b border-base-content/10'>
                        <User className='w-4 h-4' /> Personal Identification
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='space-y-1.5'>
                            <label className='text-xs font-bold text-base-content/70'>
                                Full Name <span className='text-error'>*</span>
                            </label>
                            <div className='relative'>
                                <input
                                    type='text'
                                    required
                                    value={userName}
                                    onChange={(e) =>
                                        setUserName(e.target.value)
                                    }
                                    placeholder='John Doe'
                                    className='w-full pl-10 pr-4 py-2.5 rounded-xl bg-base-200 border border-base-content/15 text-sm text-base-content focus:outline-none focus:border-primary'
                                />
                                <User className='w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2' />
                            </div>
                        </div>

                        <div className='space-y-1.5'>
                            <label className='text-xs font-bold text-base-content/70'>
                                Email Address{' '}
                                <span className='text-error'>*</span>
                            </label>
                            <div className='relative'>
                                <input
                                    type='email'
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder='user@example.com'
                                    className='w-full pl-10 pr-4 py-2.5 rounded-xl bg-base-200 border border-base-content/15 text-sm text-base-content focus:outline-none focus:border-primary'
                                />
                                <Mail className='w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2' />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Physical Courier & Shipping Address */}
                <div className='bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-content/10 shadow-sm space-y-5'>
                    <div className='flex items-center justify-between pb-2 border-b border-base-content/10'>
                        <div className='flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider'>
                            <Truck className='w-4 h-4' /> Physical Ticket
                            Dispatch Address
                        </div>
                        <span className='text-[11px] text-base-content/50'>
                            Used for courier delivery & shipping manifests
                        </span>
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className='sm:col-span-2 space-y-1.5'>
                            <label className='text-xs font-bold text-base-content/70'>
                                Primary Street Address / Premises
                            </label>
                            <div className='relative'>
                                <input
                                    type='text'
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder='e.g., 42 Park Avenue, Apartment 3B'
                                    className='w-full pl-10 pr-4 py-2.5 rounded-xl bg-base-200 border border-base-content/15 text-sm text-base-content focus:outline-none focus:border-primary'
                                />
                                <MapPin className='w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2' />
                            </div>
                        </div>

                        <div className='space-y-1.5'>
                            <label className='text-xs font-bold text-base-content/70'>
                                City
                            </label>
                            <div className='relative'>
                                <input
                                    type='text'
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder='e.g., Kolkata'
                                    className='w-full pl-10 pr-4 py-2.5 rounded-xl bg-base-200 border border-base-content/15 text-sm text-base-content focus:outline-none focus:border-primary'
                                />
                                <Building className='w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2' />
                            </div>
                        </div>

                        <div className='space-y-1.5'>
                            <label className='text-xs font-bold text-base-content/70'>
                                State / Province
                            </label>
                            <div className='relative'>
                                <input
                                    type='text'
                                    value={stateName}
                                    onChange={(e) =>
                                        setStateName(e.target.value)
                                    }
                                    placeholder='e.g., West Bengal'
                                    className='w-full pl-10 pr-4 py-2.5 rounded-xl bg-base-200 border border-base-content/15 text-sm text-base-content focus:outline-none focus:border-primary'
                                />
                                <Compass className='w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2' />
                            </div>
                        </div>

                        <div className='space-y-1.5'>
                            <label className='text-xs font-bold text-base-content/70'>
                                Postal PIN Code (6 digits)
                            </label>
                            <input
                                type='text'
                                maxLength={6}
                                value={pincode}
                                onChange={(e) => setPincode(e.target.value)}
                                placeholder='e.g., 700019'
                                className='w-full px-4 py-2.5 rounded-xl bg-base-200 border border-base-content/15 text-sm text-base-content font-mono focus:outline-none focus:border-primary'
                            />
                        </div>

                        <div className='space-y-1.5'>
                            <label className='text-xs font-bold text-base-content/70'>
                                Contact Mobile Number (10 digits)
                            </label>
                            <div className='relative'>
                                <input
                                    type='tel'
                                    maxLength={10}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder='e.g., 9830012345'
                                    className='w-full pl-10 pr-4 py-2.5 rounded-xl bg-base-200 border border-base-content/15 text-sm text-base-content font-mono focus:outline-none focus:border-primary'
                                />
                                <Phone className='w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2' />
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex items-center justify-end'>
                    <button
                        type='submit'
                        disabled={isUpdatingProfile}
                        className='btn btn-primary rounded-xl px-8 font-bold gap-2 shadow-lg shadow-primary/25'
                    >
                        {isUpdatingProfile ? (
                            <>
                                <span className='loading loading-spinner loading-xs'></span>
                                <span>Saving Contact Info...</span>
                            </>
                        ) : (
                            <>
                                <Save className='w-4 h-4' />
                                <span>Save Shipping & Contact Details</span>
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* ============================================================= */}
            {/* FORM 2: SECURITY & PASSWORD CHANGE (STRICTLY HARDENED)       */}
            {/* ============================================================= */}
            <form
                onSubmit={handlePasswordSubmit}
                className='bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-content/10 shadow-sm space-y-6'
            >
                <div className='flex items-center justify-between pb-3 border-b border-base-content/10'>
                    <div className='flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider'>
                        <Lock className='w-4 h-4' /> Security & Credentials
                    </div>
                    <span className='text-[11px] text-base-content/50'>
                        Protected by current password verification
                    </span>
                </div>

                {/* Feedback for Password */}
                {passwordFeedback && (
                    <div
                        className={`alert rounded-2xl shadow-sm text-sm ${
                            passwordFeedback.type === 'success'
                                ? 'alert-success text-success-content'
                                : 'alert-error text-error-content'
                        }`}
                    >
                        {passwordFeedback.type === 'success' ? (
                            <CheckCircle2 className='w-5 h-5 shrink-0' />
                        ) : (
                            <AlertCircle className='w-5 h-5 shrink-0' />
                        )}
                        <span>{passwordFeedback.message}</span>
                    </div>
                )}

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                    {/* Current Password Field */}
                    <div className='space-y-1.5'>
                        <label className='text-xs font-bold text-base-content/70'>
                            Current Password{' '}
                            <span className='text-error'>*</span>
                        </label>
                        <div className='relative'>
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                required
                                value={currentPassword}
                                onChange={(e) =>
                                    setCurrentPassword(e.target.value)
                                }
                                placeholder='Verify identity'
                                className='w-full pl-4 pr-10 py-2.5 rounded-xl bg-base-200 border border-base-content/15 text-sm text-base-content focus:outline-none focus:border-primary'
                            />
                            <button
                                type='button'
                                onClick={() =>
                                    setShowCurrentPassword((prev) => !prev)
                                }
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content'
                                aria-label='Toggle current password visibility'
                            >
                                {showCurrentPassword ? (
                                    <EyeOff className='w-4 h-4' />
                                ) : (
                                    <Eye className='w-4 h-4' />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* New Password Field */}
                    <div className='space-y-1.5'>
                        <label className='text-xs font-bold text-base-content/70'>
                            New Password <span className='text-error'>*</span>
                        </label>
                        <div className='relative'>
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder='Min. 6 characters'
                                className='w-full pl-4 pr-10 py-2.5 rounded-xl bg-base-200 border border-base-content/15 text-sm text-base-content focus:outline-none focus:border-primary'
                            />
                            <button
                                type='button'
                                onClick={() =>
                                    setShowNewPassword((prev) => !prev)
                                }
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content'
                                aria-label='Toggle new password visibility'
                            >
                                {showNewPassword ? (
                                    <EyeOff className='w-4 h-4' />
                                ) : (
                                    <Eye className='w-4 h-4' />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className='space-y-1.5'>
                        <label className='text-xs font-bold text-base-content/70'>
                            Confirm New Password{' '}
                            <span className='text-error'>*</span>
                        </label>
                        <div className='relative'>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder='Repeat new password'
                                className='w-full pl-4 pr-10 py-2.5 rounded-xl bg-base-200 border border-base-content/15 text-sm text-base-content focus:outline-none focus:border-primary'
                            />
                            <button
                                type='button'
                                onClick={() =>
                                    setShowConfirmPassword((prev) => !prev)
                                }
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content'
                                aria-label='Toggle confirm password visibility'
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className='w-4 h-4' />
                                ) : (
                                    <Eye className='w-4 h-4' />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className='flex items-center justify-end pt-2'>
                    <button
                        type='submit'
                        disabled={isUpdatingPassword}
                        className='btn btn-warning btn-outline rounded-xl px-8 font-bold gap-2'
                    >
                        {isUpdatingPassword ? (
                            <>
                                <span className='loading loading-spinner loading-xs'></span>
                                <span>Verifying & Updating...</span>
                            </>
                        ) : (
                            <>
                                <KeyRound className='w-4 h-4' />
                                <span>Update Password</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default ProfileScreen
