// frontend/src/redux/api/bannersApiSlice.js

import { apiSlice } from './apiSlice'

export const bannersApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getHeroBanners: builder.query({
            query: () => '/api/banners',
            providesTags: ['Banner'],
        }),
        createBanner: builder.mutation({
            query: (formData) => ({
                url: '/api/admin/banners',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Banner'],
        }),
    }),
})

export const { useGetHeroBannersQuery, useCreateBannerMutation } =
    bannersApiSlice
