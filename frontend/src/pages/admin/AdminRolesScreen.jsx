// frontend/src/pages/admin/AdminRolesScreen.jsx

import { useState } from 'react'
import {
    useGetRolesQuery,
    useAddRoleMutation,
} from '../../redux/api/rolesApiSlice'
import {
    Shield,
    PlusCircle,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Calendar,
} from 'lucide-react'

const AdminRolesScreen = () => {
    const [roleInput, setRoleInput] = useState('')
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' })

    const { data: rolesData, isLoading, error } = useGetRolesQuery()
    const [addRole, { isLoading: isCreating }] = useAddRoleMutation()

    const roles = rolesData?.data || []

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatusMessage({ type: '', text: '' })

        const trimmed = roleInput.trim().toLowerCase()
        if (!trimmed) {
            setStatusMessage({
                type: 'error',
                text: 'Please enter a valid role name.',
            })
            return
        }

        try {
            await addRole({ role: trimmed }).unwrap()
            setStatusMessage({
                type: 'success',
                text: `Role "${trimmed}" created successfully.`,
            })
            setRoleInput('')
        } catch (err) {
            setStatusMessage({
                type: 'error',
                text:
                    err?.data?.message ||
                    err?.error ||
                    'Failed to create role.',
            })
        }
    }

    return (
        <div className='max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6'>
            {/* Header */}
            <div>
                <h1 className='text-2xl sm:text-3xl font-black text-base-content flex items-center gap-2.5'>
                    <Shield className='w-7 h-7 text-primary' /> Role Management
                </h1>
                <p className='text-xs sm:text-sm text-base-content/70 mt-1'>
                    Define security access roles (e.g., admin, organizer,
                    attendee, gatekeeper) for platform users
                </p>
            </div>

            {/* Alert Box */}
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

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-start'>
                {/* Create Role Card */}
                <div className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-5 space-y-4'>
                    <h2 className='text-base font-bold text-base-content flex items-center gap-2'>
                        <PlusCircle className='w-4 h-4 text-primary' /> Add New
                        Role
                    </h2>

                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <div className='space-y-1.5'>
                            <label className='text-xs font-bold text-base-content/70 block'>
                                Role Name <span className='text-error'>*</span>
                            </label>
                            <input
                                type='text'
                                required
                                placeholder='e.g. organizer'
                                value={roleInput}
                                onChange={(e) => setRoleInput(e.target.value)}
                                className='input input-bordered input-sm w-full rounded-xl text-xs font-mono lowercase'
                            />
                            <p className='text-[10px] text-base-content/50'>
                                Unique identifier, stored in lowercase.
                            </p>
                        </div>

                        <button
                            type='submit'
                            disabled={isCreating}
                            className='btn btn-primary btn-sm w-full rounded-xl font-bold gap-2 shadow-md shadow-primary/20'
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className='w-3.5 h-3.5 animate-spin' />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <span>Save Role</span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Existing Roles List */}
                <div className='md:col-span-2 card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-5 space-y-4'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-base font-bold text-base-content'>
                            Configured Roles
                        </h2>
                        <span className='badge badge-primary badge-sm font-mono font-bold'>
                            {roles.length}{' '}
                            {roles.length === 1 ? 'Role' : 'Roles'}
                        </span>
                    </div>

                    {isLoading ? (
                        <div className='py-12 flex flex-col items-center justify-center gap-2'>
                            <Loader2 className='w-6 h-6 text-primary animate-spin' />
                            <span className='text-xs opacity-60'>
                                Fetching roles...
                            </span>
                        </div>
                    ) : error ? (
                        <div className='alert alert-error text-xs rounded-xl'>
                            <AlertCircle className='w-4 h-4 shrink-0' />
                            <span>
                                {error?.data?.message ||
                                    'Failed to load roles from database'}
                            </span>
                        </div>
                    ) : roles.length === 0 ? (
                        <div className='py-8 text-center text-xs opacity-60 space-y-1'>
                            <p>No roles defined yet.</p>
                            <p className='text-[11px]'>
                                Use the form on the left to seed default roles
                                (e.g. admin, attendee, organizer).
                            </p>
                        </div>
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className='table table-sm w-full text-xs'>
                                <thead className='bg-base-200/50 uppercase text-[10px] tracking-wider text-base-content/70 font-bold'>
                                    <tr>
                                        <th>Role Identifier</th>
                                        <th>Created Date</th>
                                        <th className='text-right'>
                                            System ID
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-base-content/5'>
                                    {roles.map((r) => (
                                        <tr
                                            key={r._id}
                                            className='hover:bg-base-200/40 transition-colors'
                                        >
                                            <td className='font-mono font-bold text-primary'>
                                                <span className='px-2.5 py-1 rounded-lg bg-primary/10 inline-block'>
                                                    {r.role}
                                                </span>
                                            </td>
                                            <td className='text-base-content/70 flex items-center gap-1.5 pt-3'>
                                                <Calendar className='w-3 h-3 text-base-content/40' />
                                                {new Date(
                                                    r.createdAt,
                                                ).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </td>
                                            <td className='text-right font-mono text-[10px] text-base-content/40'>
                                                {r._id}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminRolesScreen
