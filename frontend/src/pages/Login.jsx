// frontend/src/pages/Login.jsx

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useLoginMutation } from '../redux/api/usersApiSlice'
import { setCredentials } from '../redux/slices/authSlice'
import {
    LogIn,
    Mail,
    Lock,
    AlertCircle,
    Loader2,
    Eye,
    EyeOff,
} from 'lucide-react'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const [login, { isLoading }] = useLoginMutation()
    const { userInfo } = useSelector((state) => state.auth)

    // Redirect if already logged in
    useEffect(() => {
        if (userInfo) {
            navigate('/')
        }
    }, [navigate, userInfo])

    const submitHandler = async (e) => {
        e.preventDefault()
        setErrorMessage('')

        try {
            const res = await login({
                email: email.trim().toLowerCase(),
                password,
            }).unwrap()
            dispatch(setCredentials(res))
            navigate('/')
        } catch (err) {
            setErrorMessage(
                err?.data?.message ||
                    err?.error ||
                    'Failed to sign in. Please verify your credentials and try again.',
            )
        }
    }

    return (
        <div className='min-h-[calc(100vh-5rem)] bg-base-200 flex items-center justify-center p-4'>
            <div className='card w-full max-w-md bg-base-100 shadow-xl border border-base-content/10 rounded-3xl overflow-hidden'>
                <div className='card-body p-6 sm:p-8 space-y-4'>
                    {/* Header */}
                    <div className='text-center space-y-2'>
                        <div className='w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner'>
                            <LogIn className='w-6 h-6' />
                        </div>
                        <h2 className='text-2xl font-black text-base-content'>
                            Sign In
                        </h2>
                        <p className='text-xs text-base-content/70'>
                            Access your event bookings and digital passes
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
                    <form onSubmit={submitHandler} className='space-y-4 pt-1'>
                        {/* Email Input */}
                        <div className='space-y-1.5'>
                            <label className='text-xs font-bold text-base-content/70'>
                                Email Address
                            </label>
                            <label className='input input-bordered flex items-center gap-2.5 rounded-xl bg-base-200 border-base-content/15 focus-within:border-primary'>
                                <Mail className='w-4 h-4 text-base-content/40 shrink-0' />
                                <input
                                    type='email'
                                    required
                                    className='grow text-sm bg-transparent focus:outline-none'
                                    placeholder='name@example.com'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </label>
                        </div>

                        {/* Password Input with Forgot Password link and Eye Toggle */}
                        <div className='space-y-1.5'>
                            <div className='flex items-center justify-between'>
                                <label className='text-xs font-bold text-base-content/70'>
                                    Password
                                </label>
                                <Link
                                    to='/forgot-password'
                                    className='text-xs text-primary font-semibold hover:underline'
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <label className='input input-bordered flex items-center gap-2.5 rounded-xl bg-base-200 border-base-content/15 focus-within:border-primary'>
                                <Lock className='w-4 h-4 text-base-content/40 shrink-0' />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className='grow text-sm bg-transparent focus:outline-none'
                                    placeholder='••••••••'
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowPassword((p) => !p)}
                                    className='text-base-content/40 hover:text-base-content transition-colors'
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

                        {/* Submit Button */}
                        <button
                            type='submit'
                            disabled={isLoading}
                            className='btn btn-primary w-full rounded-xl font-bold gap-2 shadow-lg shadow-primary/30 mt-2'
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>

                    <div className='divider text-xs text-base-content/40 my-2'>
                        OR
                    </div>

                    {/* Registration Redirect */}
                    <p className='text-center text-xs text-base-content/70'>
                        Don't have an account?{' '}
                        <Link
                            to='/register'
                            className='text-primary font-bold hover:underline'
                        >
                            Create Account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login
