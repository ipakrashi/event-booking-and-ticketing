// frontend/src/pages/RegisterScreen.jsx

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    UserPlus,
    User,
    Mail,
    Phone,
    Lock,
    Eye,
    EyeOff,
    AlertCircle,
    Loader2,
} from 'lucide-react'
import {
    useRegisterMutation,
    useLoginMutation,
} from '../redux/api/usersApiSlice'
import { setCredentials } from '../redux/slices/authSlice'

const RegisterScreen = () => {
    const [userName, setUserName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const { userInfo } = useSelector((state) => state.auth)
    const [register, { isLoading: isRegistering }] = useRegisterMutation()
    const [login, { isLoading: isLoggingIn }] = useLoginMutation()

    const isLoading = isRegistering || isLoggingIn

    useEffect(() => {
        if (userInfo) {
            navigate('/')
        }
    }, [navigate, userInfo])

    const submitHandler = async (e) => {
        e.preventDefault()
        setErrorMessage('')

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.')
            return
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.')
            return
        }

        const trimmedPhone = phone.trim()
        if (trimmedPhone && !/^[6-9]\d{9}$/.test(trimmedPhone)) {
            setErrorMessage(
                'Please enter a valid 10-digit Indian mobile number starting with 6-9.',
            )
            return
        }

        try {
            await register({
                userName: userName.trim(),
                email: email.trim().toLowerCase(),
                password,
                phone: trimmedPhone || null,
            }).unwrap()

            const loginRes = await login({
                email: email.trim().toLowerCase(),
                password,
            }).unwrap()

            dispatch(setCredentials(loginRes))
            navigate('/')
        } catch (err) {
            setErrorMessage(
                err?.data?.message ||
                    err?.error ||
                    'Registration failed. Please check your details and try again.',
            )
        }
    }

    return (
        <div className='min-h-[calc(100vh-5rem)] bg-base-200 flex items-center justify-center p-4 py-8'>
            <div className='card w-full max-w-md bg-base-100 shadow-xl border border-base-content/10 rounded-3xl overflow-hidden'>
                <div className='card-body p-6 sm:p-8 space-y-4'>
                    {/* Header */}
                    <div className='text-center space-y-2'>
                        <div className='w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner'>
                            <UserPlus className='w-6 h-6' />
                        </div>
                        <h2 className='text-2xl font-black text-base-content'>
                            Create Account
                        </h2>
                        <p className='text-xs text-base-content/70'>
                            Join EventPass to book tickets and manage entry
                            passes
                        </p>
                    </div>

                    {/* Error Banner */}
                    {errorMessage && (
                        <div className='alert alert-error text-xs py-2.5 px-3.5 rounded-xl shadow-sm flex items-center gap-2 text-error-content'>
                            <AlertCircle className='w-4 h-4 shrink-0' />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Form */}
                    <form
                        onSubmit={submitHandler}
                        className='space-y-4 pt-1 w-full'
                    >
                        {/* Name */}
                        <div className='space-y-1.5 w-full'>
                            <label className='text-xs font-bold text-base-content/70 block'>
                                Full Name <span className='text-error'>*</span>
                            </label>
                            <label className='input input-bordered flex items-center gap-2.5 rounded-xl bg-base-200 border-base-content/15 focus-within:border-primary w-full h-11'>
                                <User className='w-4 h-4 text-base-content/40 shrink-0' />
                                <input
                                    type='text'
                                    required
                                    className='grow text-sm bg-transparent focus:outline-none w-full'
                                    placeholder='Indranil Pakrashi'
                                    value={userName}
                                    onChange={(e) =>
                                        setUserName(e.target.value)
                                    }
                                />
                            </label>
                        </div>

                        {/* Email */}
                        <div className='space-y-1.5 w-full'>
                            <label className='text-xs font-bold text-base-content/70 block'>
                                Email Address{' '}
                                <span className='text-error'>*</span>
                            </label>
                            <label className='input input-bordered flex items-center gap-2.5 rounded-xl bg-base-200 border-base-content/15 focus-within:border-primary w-full h-11'>
                                <Mail className='w-4 h-4 text-base-content/40 shrink-0' />
                                <input
                                    type='email'
                                    required
                                    className='grow text-sm bg-transparent focus:outline-none w-full'
                                    placeholder='name@example.com'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </label>
                        </div>

                        {/* Phone */}
                        <div className='space-y-1.5 w-full'>
                            <label className='text-xs font-bold text-base-content/70 block'>
                                Mobile Number (Optional)
                            </label>
                            <label className='input input-bordered flex items-center gap-2.5 rounded-xl bg-base-200 border-base-content/15 focus-within:border-primary w-full h-11'>
                                <Phone className='w-4 h-4 text-base-content/40 shrink-0' />
                                <input
                                    type='tel'
                                    maxLength={10}
                                    className='grow text-sm bg-transparent focus:outline-none font-mono w-full'
                                    placeholder='9830012345'
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </label>
                        </div>

                        {/* Password */}
                        <div className='space-y-1.5 w-full'>
                            <label className='text-xs font-bold text-base-content/70 block'>
                                Password <span className='text-error'>*</span>
                            </label>
                            <label className='input input-bordered flex items-center gap-2.5 rounded-xl bg-base-200 border-base-content/15 focus-within:border-primary w-full h-11'>
                                <Lock className='w-4 h-4 text-base-content/40 shrink-0' />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    className='grow text-sm bg-transparent focus:outline-none w-full'
                                    placeholder='Min. 6 characters'
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowPassword((p) => !p)}
                                    className='text-base-content/40 hover:text-base-content transition-colors p-1'
                                    aria-label='Toggle password visibility'
                                >
                                    {showPassword ? (
                                        <EyeOff className='w-4 h-4' />
                                    ) : (
                                        <Eye className='w-4 h-4' />
                                    )}
                                </button>
                            </label>
                        </div>

                        {/* Confirm Password */}
                        <div className='space-y-1.5 w-full'>
                            <label className='text-xs font-bold text-base-content/70 block'>
                                Confirm Password{' '}
                                <span className='text-error'>*</span>
                            </label>
                            <label className='input input-bordered flex items-center gap-2.5 rounded-xl bg-base-200 border-base-content/15 focus-within:border-primary w-full h-11'>
                                <Lock className='w-4 h-4 text-base-content/40 shrink-0' />
                                <input
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    required
                                    minLength={6}
                                    className='grow text-sm bg-transparent focus:outline-none w-full'
                                    placeholder='Repeat password'
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                />
                                <button
                                    type='button'
                                    onClick={() =>
                                        setShowConfirmPassword((p) => !p)
                                    }
                                    className='text-base-content/40 hover:text-base-content transition-colors p-1'
                                    aria-label='Toggle confirm password visibility'
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className='w-4 h-4' />
                                    ) : (
                                        <Eye className='w-4 h-4' />
                                    )}
                                </button>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type='submit'
                            disabled={isLoading}
                            className='btn btn-primary w-full h-11 rounded-xl font-bold gap-2 shadow-lg shadow-primary/30 mt-2'
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <span>Create Account</span>
                            )}
                        </button>
                    </form>

                    <div className='divider text-xs text-base-content/40 my-1'>
                        OR
                    </div>

                    <p className='text-center text-xs text-base-content/70'>
                        Already have an account?{' '}
                        <Link
                            to='/login'
                            className='text-primary font-bold hover:underline'
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default RegisterScreen
