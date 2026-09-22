// frontend/src/pages/admin/AdminCategoriesScreen.jsx

import { useState } from 'react'
import {
    useGetCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
} from '../../redux/api/categoriesApiSlice'
import {
    Tag,
    PlusCircle,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Calendar,
    Power,
    Edit2,
    X,
} from 'lucide-react'

const AdminCategoriesScreen = () => {
    const [categoryInput, setCategoryInput] = useState('')
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' })

    // Edit modal states
    const [editingCategory, setEditingCategory] = useState(null)
    const [editName, setEditName] = useState('')

    const { data: categoryData, isLoading, error } = useGetCategoriesQuery()
    const [createCategory, { isLoading: isCreating }] =
        useCreateCategoryMutation()
    const [updateCategory, { isLoading: isUpdating }] =
        useUpdateCategoryMutation()

    const categories = categoryData?.data || []

    const handleCreate = async (e) => {
        e.preventDefault()
        setStatusMessage({ type: '', text: '' })

        const trimmed = categoryInput.trim()
        if (!trimmed) {
            setStatusMessage({
                type: 'error',
                text: 'Category name cannot be empty.',
            })
            return
        }

        try {
            await createCategory({ eventCategory: trimmed }).unwrap()
            setStatusMessage({
                type: 'success',
                text: `Category "${trimmed}" created successfully.`,
            })
            setCategoryInput('')
        } catch (err) {
            setStatusMessage({
                type: 'error',
                text:
                    err?.data?.message ||
                    err?.error ||
                    'Failed to create category.',
            })
        }
    }

    const handleToggleStatus = async (cat) => {
        try {
            await updateCategory({
                id: cat._id,
                isActive: !cat.isActive,
            }).unwrap()
        } catch (err) {
            alert(err?.data?.message || 'Failed to toggle category status')
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (!editName.trim()) return

        try {
            await updateCategory({
                id: editingCategory._id,
                eventCategory: editName.trim(),
            }).unwrap()
            setEditingCategory(null)
            setEditName('')
        } catch (err) {
            alert(err?.data?.message || 'Failed to update category name')
        }
    }

    return (
        <div className='max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6'>
            {/* Header */}
            <div>
                <h1 className='text-2xl sm:text-3xl font-black text-base-content flex items-center gap-2.5'>
                    <Tag className='w-7 h-7 text-primary' /> Event Categories
                </h1>
                <p className='text-xs sm:text-sm text-base-content/70 mt-1'>
                    Manage global event classifications (e.g., Concerts,
                    Workshops, Standup Comedy)
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

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 items-start'>
                {/* Creation Form */}
                <div className='card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-5 space-y-4'>
                    <h2 className='text-base font-bold text-base-content flex items-center gap-2'>
                        <PlusCircle className='w-4 h-4 text-primary' /> Add
                        Category
                    </h2>

                    <form onSubmit={handleCreate} className='space-y-4'>
                        <div className='space-y-1.5'>
                            <label className='text-xs font-bold text-base-content/70 block'>
                                Category Name{' '}
                                <span className='text-error'>*</span>
                            </label>
                            <input
                                type='text'
                                required
                                placeholder='e.g. Classical Dance'
                                value={categoryInput}
                                onChange={(e) =>
                                    setCategoryInput(e.target.value)
                                }
                                className='input input-bordered input-sm w-full rounded-xl text-xs capitalize'
                            />
                            <p className='text-[10px] text-base-content/50'>
                                Converted to lowercase automatically on backend.
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
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <span>Save Category</span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Categories Table */}
                <div className='md:col-span-2 card bg-base-100 border border-base-content/10 shadow-sm rounded-3xl p-5 space-y-4'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-base font-bold text-base-content'>
                            Configured Categories
                        </h2>
                        <span className='badge badge-primary badge-sm font-mono font-bold'>
                            {categories.length}{' '}
                            {categories.length === 1 ? 'Item' : 'Items'}
                        </span>
                    </div>

                    {isLoading ? (
                        <div className='py-12 flex flex-col items-center justify-center gap-2'>
                            <Loader2 className='w-6 h-6 text-primary animate-spin' />
                            <span className='text-xs opacity-60'>
                                Fetching categories...
                            </span>
                        </div>
                    ) : error ? (
                        <div className='alert alert-error text-xs rounded-xl'>
                            <AlertCircle className='w-4 h-4 shrink-0' />
                            <span>
                                {error?.data?.message ||
                                    'Failed to load categories'}
                            </span>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className='py-8 text-center text-xs opacity-60 space-y-1'>
                            <p>No categories found in database.</p>
                            <p className='text-[11px]'>
                                Use the form to create your first category.
                            </p>
                        </div>
                    ) : (
                        <div className='overflow-x-auto'>
                            <table className='table table-sm w-full text-xs'>
                                <thead className='bg-base-200/50 uppercase text-[10px] tracking-wider text-base-content/70 font-bold'>
                                    <tr>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th className='text-right pr-3'>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className='divide-y divide-base-content/5'>
                                    {categories.map((cat) => (
                                        <tr
                                            key={cat._id}
                                            className='hover:bg-base-200/40 transition-colors'
                                        >
                                            <td className='font-bold text-base-content capitalize'>
                                                {cat.eventCategory}
                                            </td>
                                            <td>
                                                <span
                                                    className={`badge badge-xs font-bold ${
                                                        cat.isActive
                                                            ? 'badge-success'
                                                            : 'badge-ghost opacity-60'
                                                    }`}
                                                >
                                                    {cat.isActive
                                                        ? 'Active'
                                                        : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className='text-base-content/70'>
                                                <div className='flex items-center gap-1.5'>
                                                    <Calendar className='w-3 h-3 opacity-40' />
                                                    <span>
                                                        {new Date(
                                                            cat.createdAt,
                                                        ).toLocaleDateString(
                                                            'en-IN',
                                                            {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            },
                                                        )}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className='text-right pr-3 space-x-1 whitespace-nowrap'>
                                                <button
                                                    onClick={() => {
                                                        setEditingCategory(cat)
                                                        setEditName(
                                                            cat.eventCategory,
                                                        )
                                                    }}
                                                    className='btn btn-ghost btn-xs rounded-lg'
                                                    title='Edit Category'
                                                >
                                                    <Edit2 className='w-3 h-3' />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleToggleStatus(cat)
                                                    }
                                                    disabled={isUpdating}
                                                    className={`btn btn-xs rounded-lg gap-1 ${
                                                        cat.isActive
                                                            ? 'btn-ghost text-error'
                                                            : 'btn-ghost text-success'
                                                    }`}
                                                    title={
                                                        cat.isActive
                                                            ? 'Disable Category'
                                                            : 'Activate Category'
                                                    }
                                                >
                                                    <Power className='w-3 h-3' />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingCategory && (
                <div className='modal modal-open bg-black/60 backdrop-blur-sm z-50'>
                    <div className='modal-box max-w-sm rounded-3xl p-6 space-y-4'>
                        <div className='flex items-center justify-between'>
                            <h3 className='font-bold text-sm text-base-content'>
                                Edit Category Name
                            </h3>
                            <button
                                onClick={() => setEditingCategory(null)}
                                className='btn btn-circle btn-xs btn-ghost'
                            >
                                <X className='w-3.5 h-3.5' />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className='space-y-4'>
                            <div>
                                <label className='text-[11px] font-bold block mb-1'>
                                    Category Title
                                </label>
                                <input
                                    type='text'
                                    required
                                    value={editName}
                                    onChange={(e) =>
                                        setEditName(e.target.value)
                                    }
                                    className='input input-sm input-bordered w-full rounded-xl text-xs capitalize'
                                />
                            </div>

                            <div className='modal-action pt-2'>
                                <button
                                    type='button'
                                    onClick={() => setEditingCategory(null)}
                                    className='btn btn-sm btn-ghost rounded-xl'
                                >
                                    Cancel
                                </button>
                                <button
                                    type='submit'
                                    disabled={isUpdating}
                                    className='btn btn-sm btn-primary rounded-xl font-bold'
                                >
                                    {isUpdating ? 'Saving...' : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminCategoriesScreen
