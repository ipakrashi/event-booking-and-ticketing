// frontend/src/redux/api/categoriesApiSlice.js

import { apiSlice } from './apiSlice'

export const categoriesApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCategories: builder.query({
            query: () => '/api/category',
            providesTags: ['Category'],
        }),
        createCategory: builder.mutation({
            query: (data) => ({
                url: '/api/admin/category',
                method: 'POST',
                body: data, // { eventCategory: 'music' }
            }),
            invalidatesTags: ['Category'],
        }),
        updateCategory: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/api/admin/category/${id}`,
                method: 'PUT',
                body: data, // { eventCategory, isActive }
            }),
            invalidatesTags: ['Category'],
        }),
    }),
})

export const {
    useGetCategoriesQuery,
    useCreateCategoryMutation,
    useUpdateCategoryMutation,
} = categoriesApiSlice
