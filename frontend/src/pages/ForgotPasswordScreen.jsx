// frontend/src/pages/ForgotPasswordScreen.jsx

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import { useForgotPasswordMutation } from '../redux/api/usersApiSlice'

const ForgotPasswordScreen = () => {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState(null)

    const [forgotPassword, { isLoading }] = useForgotPasswordMutation()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatus(null)

        try {
            const res = await forgotPassword({ email: email.trim() }).unwrap()
            setStatus({
                type: 'success',
                message:
                    res.message || 'Reset instructions sent to your email.',
            })
            setEmail('')
        } catch (err) {
            setStatus({
                type: 'error',
                message:
                    err?.data?.message ||
                    err?.error ||
                    'Failed to request password reset. Please try again.',
            })
        }
    }

    return (
        <div className='max-w-md mx-auto px-4 py-16 space-y-6'>
            <Link
                to='/login'
                className='inline-flex items-center gap-1.5 text-xs text-base-content/60 hover:text-primary transition-colors'
            >
                <ArrowLeft className='w-4 h-4' /> Back to Sign In
            </Link>

            <div className='bg-base-100 rounded-3xl p-6 sm:p-8 border border-base-content/10 shadow-xl space-y-6'>
                <div className='space-y-2 text-center'>
                    <div className='w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner'>
                        <Mail className='w-6 h-6' />
                    </div>
                    <h1 className='text-xl font-black text-base-content'>
                        Forgot Password?
                    </h1>
                    <p className='text-xs text-base-content/60 max-w-xs mx-auto'>
                        Enter your registered account email and we'll send a
                        15-minute recovery link.
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
                            Account Email
                        </label>
                        <div className='relative'>
                            <input
                                type='email'
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder='name@example.com'
                                className='w-full pl-10 pr-4 py-2.5 rounded-xl bg-base-200 border border-base-content/15 text-sm text-base-content focus:outline-none focus:border-primary'
                            />
                            <Mail className='w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2' />
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
                                <span>Sending Email...</span>
                            </>
                        ) : (
                            <>
                                <Send className='w-4 h-4' />
                                <span>Send Reset Link</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default ForgotPasswordScreen
