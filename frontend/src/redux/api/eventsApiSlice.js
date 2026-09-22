// frontend/src/redux/api/eventsApiSlice.js

import { apiSlice } from './apiSlice'

export const eventsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getEvents: builder.query({
            query: (params) => ({
                url: '/api/events',
                params,
            }),
            providesTags: ['Event'],
        }),
        getEventById: builder.query({
            query: (id) => `/api/events/${id}`,
            providesTags: (result, error, id) => [{ type: 'Event', id }],
        }),
        createEvent: builder.mutation({
            query: (formData) => ({
                url: '/api/admin/events',
                method: 'POST',
                body: formData, // FormData containing text fields, JSON-stringified tiers, and 'poster' file
            }),
            invalidatesTags: ['Event'],
        }),
        updateEvent: builder.mutation({
            query: ({ id, formData }) => ({
                url: `/api/admin/events/${id}`,
                method: 'PUT',
                body: formData,
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: 'Event', id },
                'Event',
            ],
        }),
        deleteEvent: builder.mutation({
            query: (id) => ({
                url: `/api/admin/events/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Event'],
        }),
        getEventReviews: builder.query({
            query: (eventId) => `/api/events/${eventId}/reviews`,
            providesTags: (result, error, eventId) => [
                { type: 'Review', id: eventId },
                { type: 'Event', id: eventId },
            ],
        }),
        getLatestReviews: builder.query({
            query: (limit = 3) => `/api/reviews/latest?limit=${limit}`,
            providesTags: ['Review'],
        }),
        createEventReview: builder.mutation({
            query: ({ eventId, rating, comment }) => ({
                url: `/api/events/${eventId}/reviews`,
                method: 'POST',
                body: { rating, comment },
            }),
            invalidatesTags: (result, error, { eventId }) => [
                { type: 'Review', id: eventId },
                { type: 'Event', id: eventId },
                'Review',
                'Event',
            ],
        }),
    }),
})

export const {
    useGetEventsQuery,
    useGetEventByIdQuery,
    useCreateEventMutation,
    useUpdateEventMutation,
    useDeleteEventMutation,
    useGetEventReviewsQuery,
    useGetLatestReviewsQuery,
    useCreateEventReviewMutation,
} = eventsApiSlice
