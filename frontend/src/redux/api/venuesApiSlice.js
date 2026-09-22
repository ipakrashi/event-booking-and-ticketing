// frontend/src/redux/api/venuesApiSlice.js

import { apiSlice } from './apiSlice'

export const venuesApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getVenues: builder.query({
            query: () => '/api/venues',
            providesTags: ['Venue'],
        }),
        createVenue: builder.mutation({
            query: (data) => ({
                url: '/api/admin/venues',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Venue'],
        }),
        updateVenue: builder.mutation({
            query: ({ venueId, ...data }) => ({
                url: `/api/admin/venues/${venueId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Venue'],
        }),
        addAuditorium: builder.mutation({
            query: ({ venueId, name, screens }) => ({
                url: `/api/admin/venues/${venueId}/auditoriums`,
                method: 'POST',
                body: { name, screens },
            }),
            invalidatesTags: ['Venue'],
        }),
        deleteAuditorium: builder.mutation({
            query: ({ venueId, audiId }) => ({
                url: `/api/admin/venues/${venueId}/auditoriums/${audiId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Venue'],
        }),
        addScreen: builder.mutation({
            query: ({ venueId, audiId, ...data }) => ({
                url: `/api/admin/venues/${venueId}/auditoriums/${audiId}/screens`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Venue'],
        }),
        deleteScreen: builder.mutation({
            query: ({ venueId, audiId, screenId }) => ({
                url: `/api/admin/venues/${venueId}/auditoriums/${audiId}/screens/${screenId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Venue'],
        }),
    }),
})

export const {
    useGetVenuesQuery,
    useCreateVenueMutation,
    useUpdateVenueMutation,
    useAddAuditoriumMutation,
    useDeleteAuditoriumMutation,
    useAddScreenMutation,
    useDeleteScreenMutation,
} = venuesApiSlice
