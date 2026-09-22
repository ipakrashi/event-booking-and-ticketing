// frontend/src/redux/api/bannersApiSlice.js

import { apiSlice } from './apiSlice'

export const bannersApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getHeroBanners: builder.query({
            query: () => '/api/banners',
            providesTags: ['Banner'],
        }),
    }),
})

export const { useGetHeroBannersQuery } = bannersApiSlice
