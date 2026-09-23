// frontend/src/pages/GatekeeperScanScreen.jsx

import { useEffect, useRef, useState, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import {
    ShieldCheck,
    AlertTriangle,
    XCircle,
    CheckCircle2,
    Camera,
    RefreshCw,
    User,
    Calendar,
    Ticket,
    Volume2,
    VolumeX,
    Keyboard,
    Send,
    Clock,
} from 'lucide-react'
import { useVerifyGateEntryMutation } from '../redux/api/bookingsApiSlice'

const GatekeeperScanScreen = () => {
    const [scanResult, setScanResult] = useState(null)
    const [isScanning, setIsScanning] = useState(false)
    const [scannerError, setScannerError] = useState('')
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [manualToken, setManualToken] = useState('')
    const [showManualInput, setShowManualInput] = useState(false)

    const qrCodeInstanceRef = useRef(null)
    const isProcessingRef = useRef(false)
    const isMountedRef = useRef(true)

    const [verifyGateEntry, { isLoading: isVerifying }] =
        useVerifyGateEntryMutation()

    // Web Audio Synthesizer Beeps for Handheld Feedback
    const playAudioFeedback = useCallback(
        (type) => {
            if (!soundEnabled) return
            try {
                const ctx = new (
                    window.AudioContext || window.webkitAudioContext
                )()
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.connect(gain)
                gain.connect(ctx.destination)

                if (type === 'success') {
                    osc.type = 'sine'
                    osc.frequency.setValueAtTime(880, ctx.currentTime) // A5
                    osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1) // D6
                    gain.gain.setValueAtTime(0.15, ctx.currentTime)
                    gain.gain.exponentialRampToValueAtTime(
                        0.01,
                        ctx.currentTime + 0.25,
                    )
                    osc.start(ctx.currentTime)
                    osc.stop(ctx.currentTime + 0.25)
                } else {
                    osc.type = 'sawtooth'
                    osc.frequency.setValueAtTime(160, ctx.currentTime)
                    gain.gain.setValueAtTime(0.2, ctx.currentTime)
                    gain.gain.exponentialRampToValueAtTime(
                        0.01,
                        ctx.currentTime + 0.35,
                    )
                    osc.start(ctx.currentTime)
                    osc.stop(ctx.currentTime + 0.35)
                }
            } catch {
                // Audio context suppressed by browser policy until interaction
            }
        },
        [soundEnabled],
    )

    const triggerHaptic = (status) => {
        if ('vibrate' in navigator) {
            if (status === 'success') {
                navigator.vibrate([80, 40, 80])
            } else {
                navigator.vibrate([250, 100, 250])
            }
        }
    }

    // Core Verification Handler
    const processPassToken = async (rawString) => {
        if (!rawString || !rawString.trim()) return
        if (isProcessingRef.current) return
        isProcessingRef.current = true

        let passToken = rawString.trim()

        // Fallback: If attendee QR contains serialized JSON object
        try {
            const parsed = JSON.parse(passToken)
            if (parsed.passToken || parsed.entryPassToken) {
                passToken = parsed.passToken || parsed.entryPassToken
            }
        } catch {
            // Raw token string passed directly
        }

        try {
            const res = await verifyGateEntry({ passToken }).unwrap()

            if (!isMountedRef.current) return

            setScanResult({
                status: 'success',
                message: res.message || 'Entry Approved. Welcome to the event!',
                data: res.data,
            })
            playAudioFeedback('success')
            triggerHaptic('success')
            setManualToken('')
        } catch (err) {
            if (!isMountedRef.current) return

            const errMsg =
                err?.data?.message ||
                err?.error ||
                'Ticket validation failed or unrecognized pass.'
            const lowerMsg = errMsg.toLowerCase()
            const isAlreadyScanned = lowerMsg.includes('already')
            const isEarlyOrExpired =
                lowerMsg.includes('gates are closed') ||
                lowerMsg.includes('only on the day') ||
                lowerMsg.includes('expired')

            setScanResult({
                status: isAlreadyScanned
                    ? 'warning'
                    : isEarlyOrExpired
                      ? 'info'
                      : 'danger',
                message: errMsg,
                data: null,
            })
            playAudioFeedback('error')
            triggerHaptic('error')
        } finally {
            // 2.2-second debounce before opening lens to next attendee ticket
            setTimeout(() => {
                isProcessingRef.current = false
            }, 2200)
        }
    }

    const startScanner = async () => {
        setScannerError('')

        // Ensure container element exists before calling Html5Qrcode
        const element = document.getElementById('gatekeeper-reader')
        if (!element) return

        try {
            if (qrCodeInstanceRef.current) {
                try {
                    await qrCodeInstanceRef.current.stop()
                } catch {
                    // ignore if already stopped
                }
            }

            const html5Qr = new Html5Qrcode('gatekeeper-reader')
            qrCodeInstanceRef.current = html5Qr

            await html5Qr.start(
                { facingMode: 'environment' },
                {
                    fps: 12,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                },
                (decodedText) => {
                    processPassToken(decodedText)
                },
                () => {},
            )

            if (isMountedRef.current) {
                setIsScanning(true)
            }
        } catch (err) {
            console.error('Camera initialization failure:', err)
            if (isMountedRef.current) {
                setScannerError(
                    err?.message ||
                        'Unable to access camera hardware. Check browser camera permissions.',
                )
                setIsScanning(false)
            }
        }
    }

    const stopScanner = async () => {
        if (qrCodeInstanceRef.current) {
            try {
                await qrCodeInstanceRef.current.stop()
            } catch {
                // ignore
            }
            if (isMountedRef.current) {
                setIsScanning(false)
            }
        }
    }

    useEffect(() => {
        isMountedRef.current = true

        // Slight deferral avoids React 19 mount race condition
        const timer = setTimeout(() => {
            startScanner()
        }, 150)

        return () => {
            isMountedRef.current = false
            clearTimeout(timer)
            if (qrCodeInstanceRef.current) {
                try {
                    qrCodeInstanceRef.current.stop().catch(() => {})
                } catch {
                    // ignore
                }
            }
        }
    }, [])

    const handleManualSubmit = (e) => {
        e.preventDefault()
        if (!manualToken.trim()) return
        processPassToken(manualToken.trim())
    }

    return (
        <div className='max-w-md mx-auto px-4 py-4 sm:py-6 space-y-4'>
            {/* Staff Header */}
            <div className='flex items-center justify-between bg-base-200/80 p-4 rounded-2xl border border-base-content/10 shadow-sm'>
                <div className='flex items-center gap-3'>
                    <div className='p-2.5 rounded-xl bg-primary/15 text-primary shadow-inner'>
                        <ShieldCheck className='w-6 h-6' />
                    </div>
                    <div>
                        <h1 className='text-base font-bold text-base-content leading-tight'>
                            Gatekeeper Scanner
                        </h1>
                        <p className='text-xs text-base-content/60'>
                            Anti-passback entry verification
                        </p>
                    </div>
                </div>

                <div className='flex items-center gap-1.5'>
                    <button
                        type='button'
                        onClick={() => setShowManualInput((prev) => !prev)}
                        className={`btn btn-circle btn-sm ${
                            showManualInput
                                ? 'btn-primary'
                                : 'btn-ghost text-base-content/60'
                        }`}
                        title='Manual Token Entry / Barcode Wedge'
                    >
                        <Keyboard className='w-4 h-4' />
                    </button>
                    <button
                        type='button'
                        onClick={() => setSoundEnabled((prev) => !prev)}
                        className='btn btn-circle btn-sm btn-ghost'
                        title={soundEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
                    >
                        {soundEnabled ? (
                            <Volume2 className='w-4 h-4 text-primary' />
                        ) : (
                            <VolumeX className='w-4 h-4 text-base-content/40' />
                        )}
                    </button>
                    <button
                        type='button'
                        onClick={isScanning ? stopScanner : startScanner}
                        className='btn btn-circle btn-sm btn-ghost'
                        title={isScanning ? 'Pause Camera' : 'Start Camera'}
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${
                                isScanning
                                    ? 'text-primary'
                                    : 'text-base-content/40'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Manual Token Input Box (Fallback) */}
            {showManualInput && (
                <form
                    onSubmit={handleManualSubmit}
                    className='bg-base-200/90 p-3 rounded-2xl border border-base-content/10 flex gap-2'
                >
                    <input
                        type='text'
                        placeholder='Paste or type 64-char token...'
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        className='input input-xs sm:input-sm input-bordered w-full rounded-xl text-xs font-mono'
                    />
                    <button
                        type='submit'
                        disabled={isVerifying || !manualToken.trim()}
                        className='btn btn-xs sm:btn-sm btn-primary rounded-xl font-bold px-3'
                    >
                        <Send className='w-3.5 h-3.5' />
                    </button>
                </form>
            )}

            {/* Viewport Frame */}
            <div className='relative overflow-hidden rounded-3xl bg-black border-2 border-primary/30 aspect-square shadow-2xl flex items-center justify-center'>
                <div id='gatekeeper-reader' className='w-full h-full' />

                {/* Laser scanline overlay */}
                {isScanning && !isVerifying && (
                    <div className='pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse shadow-[0_0_12px_var(--color-primary)]' />
                )}

                {/* Loading state */}
                {isVerifying && (
                    <div className='absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20 text-white animate-in fade-in'>
                        <span className='loading loading-spinner loading-lg text-primary'></span>
                        <span className='text-xs font-semibold tracking-wider uppercase'>
                            Verifying Pass Token...
                        </span>
                    </div>
                )}

                {/* Error / Permission State */}
                {scannerError && (
                    <div className='absolute inset-0 bg-base-300 p-6 flex flex-col items-center justify-center text-center gap-3 z-10'>
                        <Camera className='w-12 h-12 text-base-content/40' />
                        <p className='text-xs text-error font-medium leading-relaxed max-w-xs'>
                            {scannerError}
                        </p>
                        <button
                            onClick={startScanner}
                            className='btn btn-sm btn-primary rounded-xl text-xs font-bold'
                        >
                            Retry Camera
                        </button>
                    </div>
                )}
            </div>

            {/* Scan Status Card */}
            {scanResult && (
                <div
                    className={`p-4 rounded-2xl border shadow-xl space-y-3 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${
                        scanResult.status === 'success'
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
                            : scanResult.status === 'warning'
                              ? 'bg-amber-950/40 border-amber-500/50 text-amber-100'
                              : scanResult.status === 'info'
                                ? 'bg-sky-950/40 border-sky-500/50 text-sky-100'
                                : 'bg-rose-950/40 border-rose-500/50 text-rose-100'
                    }`}
                >
                    <div className='flex items-start gap-3'>
                        {scanResult.status === 'success' && (
                            <CheckCircle2 className='w-7 h-7 text-emerald-400 shrink-0 mt-0.5' />
                        )}
                        {scanResult.status === 'warning' && (
                            <AlertTriangle className='w-7 h-7 text-amber-400 shrink-0 mt-0.5' />
                        )}
                        {scanResult.status === 'info' && (
                            <Clock className='w-7 h-7 text-sky-400 shrink-0 mt-0.5' />
                        )}
                        {scanResult.status === 'danger' && (
                            <XCircle className='w-7 h-7 text-rose-400 shrink-0 mt-0.5' />
                        )}

                        <div className='space-y-1.5 flex-1 min-w-0'>
                            <div className='flex items-center justify-between gap-2'>
                                <span
                                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                        scanResult.status === 'success'
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : scanResult.status === 'warning'
                                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                              : scanResult.status === 'info'
                                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    }`}
                                >
                                    {scanResult.status === 'success'
                                        ? 'ADMITTED'
                                        : scanResult.status === 'warning'
                                          ? 'ANTI-PASSBACK ALERT'
                                          : scanResult.status === 'info'
                                            ? 'ENTRY WINDOW CLOSED'
                                            : 'REJECTED'}
                                </span>
                            </div>

                            <h3 className='text-sm font-bold leading-snug'>
                                {scanResult.message}
                            </h3>

                            {scanResult.data && (
                                <div className='pt-2 mt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs'>
                                    <div className='space-y-0.5 col-span-2'>
                                        <p className='text-[10px] opacity-70 uppercase tracking-wider'>
                                            Event
                                        </p>
                                        <p className='font-semibold truncate text-white'>
                                            {scanResult.data.eventTitle}
                                        </p>
                                    </div>
                                    <div className='space-y-0.5'>
                                        <p className='text-[10px] opacity-70 uppercase tracking-wider flex items-center gap-1'>
                                            <User className='w-3 h-3' />{' '}
                                            Attendee
                                        </p>
                                        <p className='font-bold text-white truncate'>
                                            {scanResult.data.attendeeName}
                                        </p>
                                    </div>
                                    <div className='space-y-0.5'>
                                        <p className='text-[10px] opacity-70 uppercase tracking-wider flex items-center gap-1'>
                                            <Ticket className='w-3 h-3' /> Tier
                                            & Qty
                                        </p>
                                        <p className='font-bold text-white'>
                                            {scanResult.data.tier} ×{' '}
                                            {scanResult.data.admittedQuantity}
                                        </p>
                                    </div>
                                    <div className='space-y-0.5 col-span-2 pt-1'>
                                        <p className='text-[10px] opacity-70 flex items-center gap-1'>
                                            <Calendar className='w-3 h-3' />{' '}
                                            Check-In Time:{' '}
                                            <span className='font-mono'>
                                                {new Date(
                                                    scanResult.data
                                                        .checkInTimestamp,
                                                ).toLocaleTimeString('en-IN', {
                                                    timeZone: 'Asia/Kolkata',
                                                })}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GatekeeperScanScreen
