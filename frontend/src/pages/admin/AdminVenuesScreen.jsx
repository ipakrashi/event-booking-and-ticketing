// frontend/src/pages/admin/AdminVenuesScreen.jsx

import { useState } from 'react'
import {
    useGetVenuesQuery,
    useCreateVenueMutation,
    useAddAuditoriumMutation,
    useAddScreenMutation,
    useDeleteAuditoriumMutation,
    useDeleteScreenMutation,
} from '../../redux/api/venuesApiSlice'
import {
    Building2,
    PlusCircle,
    MapPin,
    Users,
    Trash2,
    ChevronDown,
    ChevronRight,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Layers,
    Plus,
} from 'lucide-react'

const AdminVenuesScreen = () => {
    const { data: venueData, isLoading, error } = useGetVenuesQuery()
    const venues = venueData?.data || []

    const [createVenue, { isLoading: isCreatingVenue }] =
        useCreateVenueMutation()
    const [addAuditorium, { isLoading: isAddingAudi }] =
        useAddAuditoriumMutation()
    const [addScreen, { isLoading: isAddingScreen }] = useAddScreenMutation()
    const [deleteAuditorium] = useDeleteAuditoriumMutation()
    const [deleteScreen] = useDeleteScreenMutation()

    // Form states for Venue
    const [venueForm, setVenueForm] = useState({
        name: '',
        address: '',
        city: '',
        pincode: '',
    })

    // Accordion toggle & modal states
    const [expandedVenues, setExpandedVenues] = useState({})
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' })

    // Modal state for adding Auditorium
    const [activeVenueForAudi, setActiveVenueForAudi] = useState(null)
    const [audiName, setAudiName] = useState('')

    // Modal state for adding Screen/Zone
    const [activeAudiForScreen, setActiveAudiForScreen] = useState(null)
    const [screenForm, setScreenForm] = useState({
        screenNumber: '',
        seatingCapacity: '',
        screenType: 'Standard',
    })

    const toggleVenueAccordion = (id) => {
        setExpandedVenues((prev) => ({ ...prev, [id]: !prev[id] }))
    }

    const handleCreateVenue = async (e) => {
        e.preventDefault()
        setStatusMessage({ type: '', text: '' })

        if (
            !venueForm.name.trim() ||
            !venueForm.address.trim() ||
            !venueForm.city.trim()
        ) {
            setStatusMessage({
                type: 'error',
                text: 'Name, address, and city are required.',
            })
            return
        }

        try {
            await createVenue({
                name: venueForm.name.trim(),
                address: venueForm.address.trim(),
                city: venueForm.city.trim().toLowerCase(),
                pincode: venueForm.pincode.trim() || undefined,
            }).unwrap()

            setStatusMessage({
                type: 'success',
                text: `Venue "${venueForm.name.trim()}" created successfully.`,
            })
            setVenueForm({ name: '', address: '', city: '', pincode: '' })
        } catch (err) {
            setStatusMessage({
                type: 'error',
                text:
                    err?.data?.message ||
                    err?.error ||
                    'Failed to create venue.',
            })
        }
    }

    const handleAddAudi = async (e) => {
        e.preventDefault()
        if (!audiName.trim()) return

        try {
            await addAuditorium({
                venueId: activeVenueForAudi._id,
                name: audiName.trim(),
            }).unwrap()
            setActiveVenueForAudi(null)
            setAudiName('')
        } catch (err) {
            alert(err?.data?.message || 'Failed to add auditorium')
        }
    }

    const handleAddScreen = async (e) => {
        e.preventDefault()
        if (!screenForm.screenNumber.trim() || !screenForm.seatingCapacity)
            return

        try {
            await addScreen({
                venueId: activeAudiForScreen.venueId,
                audiId: activeAudiForScreen.audiId,
                screenNumber: screenForm.screenNumber.trim(),
                seatingCapacity: Number(screenForm.seatingCapacity),
                screenType: screenForm.screenType.trim(),
            }).unwrap()
            setActiveAudiForScreen(null)
            setScreenForm({
                screenNumber: '',
                seatingCapacity: '',
                screenType: 'Standard',
            })
        } catch (err) {
            alert(err?.data?.message || 'Failed to add screen/zone')
        }
    }

    const handleDeleteAudi = async (venueId, audiId) => {
        if (!window.confirm('Delete this auditorium and its attached screens?'))
            return
        try {
            await deleteAuditorium({ venueId, audiId }).unwrap()
        } catch (err) {
            alert(err?.data?.message || 'Failed to delete auditorium')
        }
    }

    const handleDeleteScreen = async (venueId, audiId, screenId) => {
        if (!window.confirm('Delete this screen/zone?')) return
        try {
            await deleteScreen({ venueId, audiId, screenId }).unwrap()
        } catch (err) {
            alert(err?.data?.message || 'Failed to delete screen')
        }
    }

    return (
        <div className='max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6'>
            {/* Page Header */}
            <div>
                <h1 className='text-2xl sm:text-3xl font-black text-base-content flex items-center gap-2.5'>
                    <Building2 className='w-7 h-7 text-primary' /> Venue & Hall
                    Management
                </h1>
                <p className='text-xs sm:text-sm text-base-content/70 mt-1'>
                    Register venues, auditoriums, and screen zones with capacity
                    allocation
                </p>
            </div>

            {/* Notification Banner */}
            {statusMessage.text && (
                <div
                    className={`alert text-xs rounded-2xl flex items-center gap-2 shadow-sm ${
                        statusMessage.type === 'success'
                            ? 'alert-success text-success-content'
                            : 'alert-error text-error-content'
                    }`}
                >
                    {statusMessage.type === 'success' ? (
                        <CheckCircle2 className='w-4 h-4 shrink-0' />
                    ) : (
                        <AlertCircle className='w-4 h-4 shrink-0' />
                    )}
                    <span>{statusMessage.text}</span>
                </div>
            )}

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-start'>
                {/* Creation Card */}
                <div className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-5 space-y-4'>
                    <h2 className='text-base font-bold text-base-content flex items-center gap-2'>
                        <PlusCircle className='w-4 h-4 text-primary' /> Register
                        New Venue
                    </h2>

                    <form onSubmit={handleCreateVenue} className='space-y-3'>
                        <div>
                            <label className='text-xs font-bold text-base-content/70 block mb-1'>
                                Venue Name <span className='text-error'>*</span>
                            </label>
                            <input
                                type='text'
                                required
                                placeholder='e.g. Science City Convention Center'
                                value={venueForm.name}
                                onChange={(e) =>
                                    setVenueForm({
                                        ...venueForm,
                                        name: e.target.value,
                                    })
                                }
                                className='input input-bordered input-sm w-full rounded-xl text-xs'
                            />
                        </div>

                        <div>
                            <label className='text-xs font-bold text-base-content/70 block mb-1'>
                                Full Address{' '}
                                <span className='text-error'>*</span>
                            </label>
                            <textarea
                                required
                                rows='2'
                                placeholder='e.g. J.B.S. Haldane Avenue, Mirania Gardens'
                                value={venueForm.address}
                                onChange={(e) =>
                                    setVenueForm({
                                        ...venueForm,
                                        address: e.target.value,
                                    })
                                }
                                className='textarea textarea-bordered textarea-sm w-full rounded-xl text-xs'
                            />
                        </div>

                        <div className='grid grid-cols-2 gap-2'>
                            <div>
                                <label className='text-xs font-bold text-base-content/70 block mb-1'>
                                    City <span className='text-error'>*</span>
                                </label>
                                <input
                                    type='text'
                                    required
                                    placeholder='e.g. Kolkata'
                                    value={venueForm.city}
                                    onChange={(e) =>
                                        setVenueForm({
                                            ...venueForm,
                                            city: e.target.value,
                                        })
                                    }
                                    className='input input-bordered input-sm w-full rounded-xl text-xs capitalize'
                                />
                            </div>
                            <div>
                                <label className='text-xs font-bold text-base-content/70 block mb-1'>
                                    Pincode
                                </label>
                                <input
                                    type='text'
                                    placeholder='e.g. 700046'
                                    value={venueForm.pincode}
                                    onChange={(e) =>
                                        setVenueForm({
                                            ...venueForm,
                                            pincode: e.target.value,
                                        })
                                    }
                                    className='input input-bordered input-sm w-full rounded-xl text-xs font-mono'
                                />
                            </div>
                        </div>

                        <button
                            type='submit'
                            disabled={isCreatingVenue}
                            className='btn btn-primary btn-sm w-full rounded-xl font-bold gap-2 shadow-md shadow-primary/20 mt-2'
                        >
                            {isCreatingVenue ? (
                                <>
                                    <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                    <span>Registering...</span>
                                </>
                            ) : (
                                <span>Save Venue</span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Venues & Auditoriums List */}
                <div className='lg:col-span-2 space-y-4'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-base font-bold text-base-content'>
                            Registered Venues & Capacity
                        </h2>
                        <span className='badge badge-primary badge-sm font-mono font-bold'>
                            {venues.length}{' '}
                            {venues.length === 1 ? 'Venue' : 'Venues'}
                        </span>
                    </div>

                    {isLoading ? (
                        <div className='py-12 flex flex-col items-center justify-center gap-2'>
                            <Loader2 className='w-6 h-6 text-primary animate-spin' />
                            <span className='text-xs opacity-60'>
                                Fetching venues...
                            </span>
                        </div>
                    ) : error ? (
                        <div className='alert alert-error text-xs rounded-2xl'>
                            <AlertCircle className='w-4 h-4 shrink-0' />
                            <span>
                                {error?.data?.message ||
                                    'Failed to load venues'}
                            </span>
                        </div>
                    ) : venues.length === 0 ? (
                        <div className='card bg-base-100 border border-base-content/10 rounded-3xl p-8 text-center text-xs opacity-60'>
                            No venues registered yet. Add one using the form on
                            the left.
                        </div>
                    ) : (
                        <div className='space-y-3'>
                            {venues.map((venue) => {
                                const isExpanded = !!expandedVenues[venue._id]
                                const audiCount = venue.auditoriums?.length || 0

                                return (
                                    <div
                                        key={venue._id}
                                        className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-5 space-y-3'
                                    >
                                        {/* Venue Main Bar */}
                                        <div className='flex items-start justify-between gap-3'>
                                            <div className='space-y-1'>
                                                <div className='flex items-center gap-2'>
                                                    <button
                                                        onClick={() =>
                                                            toggleVenueAccordion(
                                                                venue._id,
                                                            )
                                                        }
                                                        className='btn btn-ghost btn-xs btn-circle'
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronDown className='w-4 h-4' />
                                                        ) : (
                                                            <ChevronRight className='w-4 h-4' />
                                                        )}
                                                    </button>
                                                    <h3 className='font-bold text-sm text-base-content'>
                                                        {venue.name}
                                                    </h3>
                                                </div>
                                                <div className='text-xs text-base-content/60 flex items-center gap-1.5 pl-8'>
                                                    <MapPin className='w-3 h-3 text-primary shrink-0' />
                                                    <span>
                                                        {venue.address},{' '}
                                                        {venue.city}{' '}
                                                        {venue.pincode
                                                            ? `- ${venue.pincode}`
                                                            : ''}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className='flex items-center gap-2'>
                                                <button
                                                    onClick={() =>
                                                        setActiveVenueForAudi(
                                                            venue,
                                                        )
                                                    }
                                                    className='btn btn-outline btn-primary btn-xs rounded-xl font-bold gap-1'
                                                >
                                                    <Plus className='w-3 h-3' />{' '}
                                                    Hall
                                                </button>
                                            </div>
                                        </div>

                                        {/* Nested Auditoriums & Screens */}
                                        {isExpanded && (
                                            <div className='pl-8 pt-2 border-t border-base-content/10 space-y-3'>
                                                {audiCount === 0 ? (
                                                    <p className='text-xs opacity-50 italic py-1'>
                                                        No auditoriums/halls
                                                        added yet. Click "+
                                                        Hall" above to add one.
                                                    </p>
                                                ) : (
                                                    venue.auditoriums.map(
                                                        (audi) => (
                                                            <div
                                                                key={audi._id}
                                                                className='bg-base-200/50 rounded-2xl p-3.5 space-y-2'
                                                            >
                                                                <div className='flex items-center justify-between gap-2'>
                                                                    <span className='font-bold text-xs text-base-content flex items-center gap-1.5'>
                                                                        <Layers className='w-3.5 h-3.5 text-primary' />
                                                                        {
                                                                            audi.name
                                                                        }
                                                                    </span>

                                                                    <div className='flex items-center gap-1.5'>
                                                                        <button
                                                                            onClick={() =>
                                                                                setActiveAudiForScreen(
                                                                                    {
                                                                                        venueId:
                                                                                            venue._id,
                                                                                        audiId: audi._id,
                                                                                        audiName:
                                                                                            audi.name,
                                                                                    },
                                                                                )
                                                                            }
                                                                            className='btn btn-ghost btn-xs text-primary font-bold gap-1'
                                                                        >
                                                                            <Plus className='w-3 h-3' />{' '}
                                                                            Screen
                                                                        </button>
                                                                        <button
                                                                            onClick={() =>
                                                                                handleDeleteAudi(
                                                                                    venue._id,
                                                                                    audi._id,
                                                                                )
                                                                            }
                                                                            className='btn btn-ghost btn-xs text-error'
                                                                        >
                                                                            <Trash2 className='w-3 h-3' />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Screens pill list */}
                                                                {audi.screens
                                                                    ?.length >
                                                                0 ? (
                                                                    <div className='flex flex-wrap gap-2 pt-1'>
                                                                        {audi.screens.map(
                                                                            (
                                                                                sc,
                                                                            ) => (
                                                                                <div
                                                                                    key={
                                                                                        sc._id
                                                                                    }
                                                                                    className='badge badge-ghost badge-sm py-2.5 px-3 rounded-xl gap-2 font-mono text-[11px]'
                                                                                >
                                                                                    <span className='font-bold text-base-content'>
                                                                                        {
                                                                                            sc.screenNumber
                                                                                        }
                                                                                    </span>
                                                                                    <span className='opacity-60 flex items-center gap-1'>
                                                                                        <Users className='w-3 h-3' />
                                                                                        {
                                                                                            sc.seatingCapacity
                                                                                        }
                                                                                    </span>
                                                                                    <span className='opacity-40 text-[10px] uppercase'>
                                                                                        (
                                                                                        {
                                                                                            sc.screenType
                                                                                        }

                                                                                        )
                                                                                    </span>
                                                                                    <button
                                                                                        onClick={() =>
                                                                                            handleDeleteScreen(
                                                                                                venue._id,
                                                                                                audi._id,
                                                                                                sc._id,
                                                                                            )
                                                                                        }
                                                                                        className='text-error hover:opacity-80'
                                                                                    >
                                                                                        ×
                                                                                    </button>
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <p className='text-[11px] opacity-40 italic'>
                                                                        No
                                                                        screens/stages
                                                                        configured.
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Add Auditorium */}
            {activeVenueForAudi && (
                <div className='modal modal-open bg-black/60 backdrop-blur-sm z-50'>
                    <div className='modal-box max-w-sm rounded-3xl p-6 space-y-4'>
                        <h3 className='font-bold text-sm text-base-content'>
                            Add Hall to "{activeVenueForAudi.name}"
                        </h3>

                        <form onSubmit={handleAddAudi} className='space-y-3'>
                            <input
                                type='text'
                                required
                                placeholder='e.g. Main Auditorium / Hall 1'
                                value={audiName}
                                onChange={(e) => setAudiName(e.target.value)}
                                className='input input-sm input-bordered w-full rounded-xl text-xs'
                            />

                            <div className='modal-action pt-2'>
                                <button
                                    type='button'
                                    onClick={() => setActiveVenueForAudi(null)}
                                    className='btn btn-sm btn-ghost rounded-xl'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    disabled={isAddingAudi}
                                    className='btn btn-sm btn-primary rounded-xl font-bold'
                                >
                                    {isAddingAudi ? 'Adding...' : 'Add Hall'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Add Screen / Stage Zone */}
            {activeAudiForScreen && (
                <div className='modal modal-open bg-black/60 backdrop-blur-sm z-50'>
                    <div className='modal-box max-w-sm rounded-3xl p-6 space-y-4'>
                        <h3 className='font-bold text-sm text-base-content'>
                            Add Screen to "{activeAudiForScreen.audiName}"
                        </h3>

                        <form onSubmit={handleAddScreen} className='space-y-3'>
                            <div>
                                <label className='text-[11px] font-bold block mb-1'>
                                    Screen / Tier Name
                                </label>
                                <input
                                    type='text'
                                    required
                                    placeholder='e.g. Ground Floor / Screen 1'
                                    value={screenForm.screenNumber}
                                    onChange={(e) =>
                                        setScreenForm({
                                            ...screenForm,
                                            screenNumber: e.target.value,
                                        })
                                    }
                                    className='input input-sm input-bordered w-full rounded-xl text-xs'
                                />
                            </div>

                            <div className='grid grid-cols-2 gap-2'>
                                <div>
                                    <label className='text-[11px] font-bold block mb-1'>
                                        Capacity
                                    </label>
                                    <input
                                        type='number'
                                        required
                                        min='1'
                                        placeholder='e.g. 500'
                                        value={screenForm.seatingCapacity}
                                        onChange={(e) =>
                                            setScreenForm({
                                                ...screenForm,
                                                seatingCapacity: e.target.value,
                                            })
                                        }
                                        className='input input-sm input-bordered w-full rounded-xl text-xs font-mono'
                                    />
                                </div>
                                <div>
                                    <label className='text-[11px] font-bold block mb-1'>
                                        Type
                                    </label>
                                    <select
                                        value={screenForm.screenType}
                                        onChange={(e) =>
                                            setScreenForm({
                                                ...screenForm,
                                                screenType: e.target.value,
                                            })
                                        }
                                        className='select select-sm select-bordered w-full rounded-xl text-xs'
                                    >
                                        <option value='Standard'>
                                            Standard
                                        </option>
                                        <option value='IMAX'>IMAX</option>
                                        <option value='Open Air Stage'>
                                            Open Air Stage
                                        </option>
                                        <option value='Banquet Floor'>
                                            Banquet Floor
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <div className='modal-action pt-2'>
                                <button
                                    type='button'
                                    onClick={() => setActiveAudiForScreen(null)}
                                    className='btn btn-sm btn-ghost rounded-xl'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    disabled={isAddingScreen}
                                    className='btn btn-sm btn-primary rounded-xl font-bold'
                                >
                                    {isAddingScreen
                                        ? 'Adding...'
                                        : 'Save Screen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminVenuesScreen
