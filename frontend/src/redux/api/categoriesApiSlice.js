// frontend/src/redux/api/categoriesApiSlice.js

import { apiSlice } from './apiSlice'

export const categoriesApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCategories: builder.query({
            query: () => '/api/category',
            providesTags: ['Event'],
        }),
    }),
})

export const { useGetCategoriesQuery } = categoriesApiSlice
