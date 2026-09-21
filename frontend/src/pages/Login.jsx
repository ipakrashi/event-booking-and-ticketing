// frontend/src/pages/Login.jsx

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useLoginMutation } from '../redux/api/usersApiSlice'
import { setCredentials } from '../redux/slices/authSlice'
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
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
            // unwrap() extracts the payload from the resolved action or throws on error
            const res = await login({ email, password }).unwrap()
            dispatch(setCredentials(res))
            navigate('/')
        } catch (err) {
            setErrorMessage(
                err?.data?.message ||
                    err?.error ||
                    'Failed to sign in. Please try again.',
            )
        }
    }

    return (
        <div className='min-h-screen bg-base-200 flex items-center justify-center p-4'>
            <div className='card w-full max-w-md bg-base-100 shadow-xl border border-base-300'>
                <div className='card-body'>
                    <div className='flex items-center gap-2 mb-2 justify-center text-primary'>
                        <LogIn className='w-7 h-7' />
                        <h2 className='text-2xl font-bold text-base-content'>
                            Sign In
                        </h2>
                    </div>
                    <p className='text-center text-sm text-base-content/70 mb-4'>
                        Access your event bookings and digital passes
                    </p>

                    {errorMessage && (
                        <div className='alert alert-error text-sm py-2 px-3 mb-4 rounded-lg flex items-center gap-2'>
                            <AlertCircle className='w-5 h-5 flex-shrink-0' />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <form onSubmit={submitHandler} className='space-y-4'>
                        <div className='form-control'>
                            <label className='label'>
                                <span className='label-text font-medium'>
                                    Email Address
                                </span>
                            </label>
                            <label className='input input-bordered flex items-center gap-2'>
                                <Mail className='w-4 h-4 opacity-70' />
                                <input
                                    type='email'
                                    className='grow'
                                    placeholder='name@example.com'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </label>
                        </div>

                        <div className='form-control'>
                            <label className='label'>
                                <span className='label-text font-medium'>
                                    Password
                                </span>
                            </label>
                            <label className='input input-bordered flex items-center gap-2'>
                                <Lock className='w-4 h-4 opacity-70' />
                                <input
                                    type='password'
                                    className='grow'
                                    placeholder='••••••••'
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                />
                            </label>
                        </div>

                        <button
                            type='submit'
                            disabled={isLoading}
                            className='btn btn-primary w-full mt-2'
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className='w-4 h-4 animate-spin' />{' '}
                                    Signing In...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className='divider my-4'>OR</div>

                    <p className='text-center text-sm text-base-content/70'>
                        Don't have an account?{' '}
                        <Link
                            to='/register'
                            className='link link-primary font-medium'
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
