// frontend/src/components/NewsletterSection.jsx

import { useState } from 'react'
import {
    Mail,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Sparkles,
} from 'lucide-react'
import { useSubscribeNewsletterMutation } from '../redux/api/newsletterApiSlice'

const NewsletterSection = () => {
    const [email, setEmail] = useState('')
    const [statusMessage, setStatusMessage] = useState(null)
    const [isSuccess, setIsSuccess] = useState(false)

    const [subscribeNewsletter, { isLoading }] =
        useSubscribeNewsletterMutation()

    const handleSubscribe = async (e) => {
        e.preventDefault()
        setStatusMessage(null)

        if (!email.trim()) {
            setStatusMessage('Please enter your email address.')
            setIsSuccess(false)
            return
        }

        try {
            const res = await subscribeNewsletter({ email }).unwrap()
            setIsSuccess(true)
            setStatusMessage(res.message || 'Subscribed successfully!')
            setEmail('')
        } catch (err) {
            setIsSuccess(false)
            setStatusMessage(
                err?.data?.message || 'Subscription failed. Please try again.',
            )
        }
    }

    return (
        <section className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-base-100 via-base-200/50 to-base-100 border border-base-content/10 shadow-xl p-8 sm:p-12 md:p-14 my-14'>
            {/* Decorative gradient blur */}
            <div className='absolute top-0 right-0 -mr-24 -mt-24 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none'></div>

            <div className='relative z-10 max-w-2xl mx-auto text-center space-y-4'>
                <div className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wide'>
                    <Sparkles className='w-3.5 h-3.5' /> Stay in the Loop
                </div>

                <h2 className='text-2xl sm:text-4xl font-black text-base-content tracking-tight'>
                    Never Miss an Iconic Performance
                </h2>

                <p className='text-xs sm:text-sm text-base-content/70 leading-relaxed max-w-lg mx-auto'>
                    Get exclusive early-bird notifications, secret headliner
                    lineup drops, and stage passes delivered right to your
                    inbox.
                </p>

                <form
                    onSubmit={handleSubscribe}
                    className='pt-2 max-w-md mx-auto space-y-3'
                >
                    <div className='flex flex-col sm:flex-row items-center gap-2'>
                        <div className='relative w-full'>
                            <Mail className='w-4 h-4 text-base-content/40 absolute left-3.5 top-1/2 -translate-y-1/2' />
                            <input
                                type='email'
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder='Enter your email address'
                                className='w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-base-100 border border-base-content/15 text-base-content placeholder-base-content/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all'
                            />
                        </div>
                        <button
                            type='submit'
                            disabled={isLoading}
                            className='btn btn-primary btn-sm h-10 px-6 rounded-xl font-bold text-xs sm:text-sm w-full sm:w-auto shadow-md'
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                    <span>Joining...</span>
                                </>
                            ) : (
                                'Subscribe'
                            )}
                        </button>
                    </div>

                    {statusMessage && (
                        <div
                            className={`text-xs font-medium flex items-center justify-center gap-1.5 pt-1 animate-in fade-in duration-200 ${
                                isSuccess ? 'text-success' : 'text-error'
                            }`}
                        >
                            {isSuccess ? (
                                <CheckCircle2 className='w-3.5 h-3.5 flex-shrink-0' />
                            ) : (
                                <AlertCircle className='w-3.5 h-3.5 flex-shrink-0' />
                            )}
                            <span>{statusMessage}</span>
                        </div>
                    )}

                    <p className='text-[11px] text-base-content/50 pt-1'>
                        We honor your privacy. Unsubscribe at any time with a
                        single click.
                    </p>
                </form>
            </div>
        </section>
    )
}

export default NewsletterSection
