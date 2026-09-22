// frontend/src/redux/api/couriersApiSlice.js

import { apiSlice } from './apiSlice'

export const couriersApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCouriers: builder.query({
            query: (params) => ({
                url: '/api/couriers',
                params,
            }),
            providesTags: ['Courier'],
        }),
        createCourier: builder.mutation({
            query: (data) => ({
                url: '/api/couriers',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Courier'],
        }),
        deleteCourier: builder.mutation({
            query: (id) => ({
                url: `/api/couriers/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Courier'],
        }),
    }),
})

export const {
    useGetCouriersQuery,
    useCreateCourierMutation,
    useDeleteCourierMutation,
} = couriersApiSlice
