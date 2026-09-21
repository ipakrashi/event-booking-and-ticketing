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
    useGetEventReviewsQuery,
    useGetLatestReviewsQuery,
    useCreateEventReviewMutation,
} = eventsApiSlice
