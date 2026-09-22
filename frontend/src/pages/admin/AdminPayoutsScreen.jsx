// frontend/src/pages/admin/AdminPayoutsScreen.jsx

import { useState } from 'react'
import {
    useGenerateEventPayoutMutation,
    useDisbursePayoutTrancheMutation,
} from '../../redux/api/payoutsApiSlice'
import { useGetEventsQuery } from '../../redux/api/eventsApiSlice'
import {
    DollarSign,
    ShieldCheck,
    Clock,
    AlertCircle,
    Loader2,
    CheckCircle2,
    Building2,
    Calendar,
    Send,
    FileSpreadsheet,
    History,
} from 'lucide-react'

const AdminPayoutsScreen = () => {
    const [selectedEventId, setSelectedEventId] = useState('')
    const { data: eventsData } = useGetEventsQuery({ status: 'completed' })
    const completedEvents = eventsData?.data || []

    const [
        generatePayout,
        { data: payoutRes, isLoading: loadingPayout, error: payoutErr },
    ] = useGenerateEventPayoutMutation()
    const [disburseTranche, { isLoading: isDisbursing }] =
        useDisbursePayoutTrancheMutation()

    const [amount, setAmount] = useState('')
    const [mode, setMode] = useState('bank_transfer')
    const [trxnId, setTrxnId] = useState('')
    const [notes, setNotes] = useState('')

    const payout = payoutRes?.data

    const handleSelectEvent = async (e) => {
        const evId = e.target.value
        setSelectedEventId(evId)
        if (evId) {
            try {
                await generatePayout(evId).unwrap()
            } catch {
                // handled by error state
            }
        }
    }

    const handleDisburse = async (e) => {
        e.preventDefault()
        if (!payout) return

        try {
            await disburseTranche({
                payoutId: payout._id,
                amount: Number(amount),
                mode,
                trxnId: trxnId.trim(),
                notes: notes.trim() || undefined,
            }).unwrap()

            setAmount('')
            setTrxnId('')
            setNotes('')
            generatePayout(selectedEventId) // Refresh
            alert('Disbursement recorded successfully!')
        } catch (err) {
            alert(err?.data?.message || 'Failed to record disbursement')
        }
    }

    return (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6'>
            {/* Header */}
            <div>
                <h1 className='text-2xl sm:text-3xl font-black text-base-content flex items-center gap-2.5'>
                    <DollarSign className='w-7 h-7 text-primary shrink-0' />
                    <span>Organizer Payout Engine</span>
                </h1>
                <p className='text-xs sm:text-sm text-base-content/70 mt-1'>
                    Generate financial ledgers, compute commission deductions &
                    GST, and disburse settlement tranches for completed events
                </p>
            </div>

            {/* Event Selector Toolbar */}
            <div className='bg-base-100 p-4 rounded-3xl border border-base-content/10 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
                <span className='text-xs font-bold uppercase tracking-wider text-base-content/70'>
                    Select Completed Event:
                </span>
                <select
                    value={selectedEventId}
                    onChange={handleSelectEvent}
                    className='select select-sm select-bordered rounded-xl text-xs font-semibold flex-1 max-w-xl'
                >
                    <option value=''>
                        -- Choose completed event to settle --
                    </option>
                    {completedEvents.map((ev) => (
                        <option key={ev._id} value={ev._id}>
                            {ev.title} (
                            {new Date(ev.startDate).toLocaleDateString('en-IN')}
                            )
                        </option>
                    ))}
                </select>
            </div>

            {/* Main Ledger Display */}
            {!selectedEventId ? (
                <div className='bg-base-100 rounded-3xl p-12 text-center border border-base-content/10 max-w-md mx-auto space-y-2'>
                    <Calendar className='w-8 h-8 text-primary mx-auto opacity-50' />
                    <h3 className='font-bold text-sm'>No Event Selected</h3>
                    <p className='text-xs opacity-60'>
                        Please select a completed event from the dropdown above
                        to initialize or view its payout ledger.
                    </p>
                </div>
            ) : loadingPayout ? (
                <div className='py-20 flex flex-col items-center justify-center gap-3'>
                    <Loader2 className='w-8 h-8 text-primary animate-spin' />
                    <p className='text-xs opacity-60'>
                        Computing event settlement & fetching ledger...
                    </p>
                </div>
            ) : payoutErr ? (
                <div className='alert alert-error max-w-lg mx-auto rounded-2xl text-xs'>
                    <AlertCircle className='w-4 h-4 shrink-0' />
                    <span>
                        {payoutErr?.data?.message ||
                            'Failed to generate payout ledger. Ensure event status is "completed".'}
                    </span>
                </div>
            ) : payout ? (
                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    {/* Left 2 Cols: Financial Breakdown */}
                    <div className='lg:col-span-2 space-y-4'>
                        <div className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-6 space-y-4'>
                            <div className='flex items-center justify-between border-b border-base-content/10 pb-4'>
                                <div>
                                    <span className='text-[10px] font-bold uppercase tracking-wider text-primary'>
                                        Ledger Status
                                    </span>
                                    <h3 className='font-black text-lg text-base-content uppercase tracking-wide'>
                                        {payout.payoutStatus.replace('_', ' ')}
                                    </h3>
                                </div>
                                <span
                                    className={`badge font-bold uppercase text-xs px-3 py-1.5 ${
                                        payout.payoutStatus === 'settled'
                                            ? 'badge-success'
                                            : payout.payoutStatus ===
                                                'partially_settled'
                                              ? 'badge-warning'
                                              : 'badge-ghost'
                                    }`}
                                >
                                    {payout.payoutStatus}
                                </span>
                            </div>

                            {/* Metrics Grid */}
                            <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
                                <div className='bg-base-200/50 p-3 rounded-2xl space-y-1'>
                                    <span className='opacity-60 block text-[10px] uppercase font-bold'>
                                        Gross Revenue
                                    </span>
                                    <span className='font-mono font-bold text-sm text-base-content'>
                                        ₹{payout.grossRevenue}
                                    </span>
                                </div>
                                <div className='bg-base-200/50 p-3 rounded-2xl space-y-1'>
                                    <span className='opacity-60 block text-[10px] uppercase font-bold'>
                                        Refunds Deducted
                                    </span>
                                    <span className='font-mono font-bold text-sm text-error'>
                                        - ₹{payout.refundDeductions}
                                    </span>
                                </div>
                                <div className='bg-base-200/50 p-3 rounded-2xl space-y-1'>
                                    <span className='opacity-60 block text-[10px] uppercase font-bold'>
                                        Platform Cut
                                    </span>
                                    <span className='font-mono font-bold text-sm text-error'>
                                        - ₹{payout.totalPlatformDeduction}
                                    </span>
                                </div>
                                <div className='bg-primary/10 border border-primary/20 p-3 rounded-2xl space-y-1'>
                                    <span className='text-primary block text-[10px] uppercase font-black'>
                                        Net Payable
                                    </span>
                                    <span className='font-mono font-black text-base text-primary'>
                                        ₹{payout.amountPayable}
                                    </span>
                                </div>
                            </div>

                            {/* Balances Summary */}
                            <div className='grid grid-cols-2 gap-3 pt-2'>
                                <div className='p-3.5 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-between'>
                                    <div>
                                        <span className='text-[10px] uppercase font-bold text-success block'>
                                            Total Paid Out
                                        </span>
                                        <span className='font-mono font-black text-lg text-success'>
                                            ₹{payout.amountPaid}
                                        </span>
                                    </div>
                                    <CheckCircle2 className='w-6 h-6 text-success opacity-80' />
                                </div>
                                <div className='p-3.5 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-between'>
                                    <div>
                                        <span className='text-[10px] uppercase font-bold text-warning block'>
                                            Balance Due
                                        </span>
                                        <span className='font-mono font-black text-lg text-warning'>
                                            ₹{payout.balanceDue}
                                        </span>
                                    </div>
                                    <Clock className='w-6 h-6 text-warning opacity-80' />
                                </div>
                            </div>

                            {/* Disbursement Audit Trail */}
                            <div className='space-y-2 pt-2'>
                                <span className='text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5'>
                                    <History className='w-3.5 h-3.5 text-primary' />{' '}
                                    Tranche Audit Trail (
                                    {payout.disbursements?.length || 0})
                                </span>
                                {payout.disbursements?.length === 0 ? (
                                    <p className='text-xs opacity-50 italic bg-base-200/30 p-3 rounded-xl text-center'>
                                        No disbursement tranches recorded yet.
                                    </p>
                                ) : (
                                    <div className='space-y-1.5 max-h-48 overflow-y-auto'>
                                        {payout.disbursements.map((d, idx) => (
                                            <div
                                                key={d._id || idx}
                                                className='flex items-center justify-between text-xs bg-base-200/60 p-2.5 rounded-xl border border-base-content/5 font-mono'
                                            >
                                                <div>
                                                    <span className='font-bold text-success'>
                                                        ₹{d.amount}
                                                    </span>
                                                    <span className='text-[11px] opacity-70 ml-2 uppercase'>
                                                        ({d.mode})
                                                    </span>
                                                    <span className='text-[10px] opacity-50 ml-2'>
                                                        UTR: {d.trxnId}
                                                    </span>
                                                </div>
                                                <span className='text-[10px] opacity-50'>
                                                    {new Date(
                                                        d.createdAt,
                                                    ).toLocaleString('en-IN', {
                                                        timeZone:
                                                            'Asia/Kolkata',
                                                    })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Col: Disburse Action Form */}
                    <div className='space-y-4'>
                        <div className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-6 space-y-4'>
                            <h3 className='font-bold text-sm text-base-content flex items-center gap-2'>
                                <Send className='w-4 h-4 text-primary' />{' '}
                                Process Disbursement
                            </h3>

                            {payout.balanceDue <= 0 ? (
                                <div className='p-4 rounded-2xl bg-success/15 border border-success/30 text-center space-y-1.5'>
                                    <ShieldCheck className='w-8 h-8 text-success mx-auto' />
                                    <h4 className='font-bold text-xs text-success uppercase'>
                                        Fully Settled
                                    </h4>
                                    <p className='text-[11px] opacity-70'>
                                        No outstanding balance due for this
                                        event payout ledger.
                                    </p>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleDisburse}
                                    className='space-y-3'
                                >
                                    <div>
                                        <label className='text-[11px] font-bold block mb-1'>
                                            Tranche Amount (Max: ₹
                                            {payout.balanceDue})
                                        </label>
                                        <input
                                            type='number'
                                            required
                                            max={payout.balanceDue}
                                            min={1}
                                            placeholder={payout.balanceDue}
                                            value={amount}
                                            onChange={(e) =>
                                                setAmount(e.target.value)
                                            }
                                            className='input input-sm input-bordered w-full rounded-xl text-xs font-mono'
                                        />
                                    </div>

                                    <div>
                                        <label className='text-[11px] font-bold block mb-1'>
                                            Disbursement Mode
                                        </label>
                                        <select
                                            value={mode}
                                            onChange={(e) =>
                                                setMode(e.target.value)
                                            }
                                            className='select select-sm select-bordered w-full rounded-xl text-xs'
                                        >
                                            <option value='bank_transfer'>
                                                Bank Transfer
                                            </option>
                                            <option value='upi'>UPI</option>
                                            <option value='neft_rtgs'>
                                                NEFT / RTGS
                                            </option>
                                            <option value='cheque'>
                                                Cheque
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className='text-[11px] font-bold block mb-1'>
                                            UTR / Transaction Reference
                                        </label>
                                        <input
                                            type='text'
                                            required
                                            placeholder='e.g. UTR9283019283'
                                            value={trxnId}
                                            onChange={(e) =>
                                                setTrxnId(e.target.value)
                                            }
                                            className='input input-sm input-bordered w-full rounded-xl text-xs font-mono'
                                        />
                                    </div>

                                    <div>
                                        <label className='text-[11px] font-bold block mb-1'>
                                            Remarks / Notes (Optional)
                                        </label>
                                        <textarea
                                            placeholder='Tranche 1 transferred to verified vendor account...'
                                            value={notes}
                                            onChange={(e) =>
                                                setNotes(e.target.value)
                                            }
                                            className='textarea textarea-sm textarea-bordered w-full rounded-xl text-xs resize-none'
                                            rows={2}
                                        />
                                    </div>

                                    <button
                                        type='submit'
                                        disabled={isDisbursing || !amount}
                                        className='btn btn-sm btn-primary w-full rounded-xl font-bold gap-1 shadow-md shadow-primary/20 mt-2'
                                    >
                                        {isDisbursing ? (
                                            <>
                                                <Loader2 className='w-4 h-4 animate-spin' />
                                                Recording Tranche...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className='w-4 h-4' />{' '}
                                                Disburse ₹{amount || 0}
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default AdminPayoutsScreen
