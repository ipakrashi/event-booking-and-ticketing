// frontend/src/redux/api/venuesApiSlice.js

import { apiSlice } from './apiSlice'

export const venuesApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getVenues: builder.query({
            query: () => '/api/venues',
            providesTags: ['Venue'],
        }),
    }),
})

export const { useGetVenuesQuery } = venuesApiSlice
