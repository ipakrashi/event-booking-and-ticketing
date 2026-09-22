// frontend/src/pages/ResetPasswordScreen.jsx

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    AlertCircle,
    KeyRound,
} from 'lucide-react'
import { useResetPasswordMutation } from '../redux/api/usersApiSlice'

const ResetPasswordScreen = () => {
    const { token } = useParams()
    const navigate = useNavigate()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [status, setStatus] = useState(null)

    const [resetPassword, { isLoading }] = useResetPasswordMutation()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatus(null)

        if (password.length < 6) {
            setStatus({
                type: 'error',
                message: 'Password must be at least 6 characters long.',
            })
            return
        }

        if (password !== confirmPassword) {
            setStatus({
                type: 'error',
                message: 'Passwords do not match.',
            })
            return
        }

        try {
            const res = await resetPassword({ token, password }).unwrap()
            setStatus({
                type: 'success',
                message: res.message || 'Password successfully reset!',
            })
            setTimeout(() => {
                navigate('/login')
            }, 2500)
        } catch (err) {
            setStatus({
                type: 'error',
                message:
                    err?.data?.message ||
                    err?.error ||
                    'Token expired or invalid. Please request a new link.',
            })
        }
    }

    return (
        <div className='max-w-md mx-auto px-4 py-16 space-y-6'>
            <div className='bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-content/10 shadow-xl space-y-6'>
                <div className='space-y-2 text-center'>
                    <div className='w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner'>
                        <KeyRound className='w-6 h-6' />
                    </div>
                    <h1 className='text-xl font-black text-base-content'>
                        Set New Password
                    </h1>
                    <p className='text-xs text-base-content/60 max-w-xs mx-auto'>
                        Enter and verify your new credentials below.
                    </p>
                </div>

                {status && (
                    <div
                        className={`alert text-xs rounded-2xl ${
                            status.type === 'success'
                                ? 'alert-success text-success-content'
                                : 'alert-error text-error-content'
                        }`}
                    >
                        {status.type === 'success' ? (
                            <CheckCircle2 className='w-4 h-4 shrink-0' />
                        ) : (
                            <AlertCircle className='w-4 h-4 shrink-0' />
                        )}
                        <span>{status.message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div className='space-y-1.5'>
                        <label className='text-xs font-bold text-base-content/70'>
                            New Password
                        </label>
                        <div className='relative'>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder='Min. 6 characters'
                                className='w-full pl-4 pr-10 py-2.5 rounded-xl bg-base-200 border border-base-content/15 text-sm text-base-content focus:outline-none focus:border-primary'
                            />
                            <button
                                type='button'
                                onClick={() => setShowPassword((p) => !p)}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content'
                            >
                                {showPassword ? (
                                    <EyeOff className='w-4 h-4' />
                                ) : (
                                    <Eye className='w-4 h-4' />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className='space-y-1.5'>
                        <label className='text-xs font-bold text-base-content/70'>
                            Confirm New Password
                        </label>
                        <div className='relative'>
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                placeholder='Repeat new password'
                                className='w-full pl-4 pr-10 py-2.5 rounded-xl bg-base-200 border border-base-content/15 text-sm text-base-content focus:outline-none focus:border-primary'
                            />
                            <button
                                type='button'
                                onClick={() => setShowConfirm((p) => !p)}
                                className='absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content'
                            >
                                {showConfirm ? (
                                    <EyeOff className='w-4 h-4' />
                                ) : (
                                    <Eye className='w-4 h-4' />
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type='submit'
                        disabled={isLoading}
                        className='btn btn-primary w-full rounded-xl font-bold gap-2 shadow-lg shadow-primary/30'
                    >
                        {isLoading ? (
                            <>
                                <span className='loading loading-spinner loading-xs'></span>
                                <span>Resetting Password...</span>
                            </>
                        ) : (
                            <>
                                <Lock className='w-4 h-4' />
                                <span>Update & Sign In</span>
                            </>
                        )}
                    </button>
                </form>

                <div className='text-center pt-2'>
                    <Link
                        to='/login'
                        className='text-xs text-primary font-semibold hover:underline'
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default ResetPasswordScreen
