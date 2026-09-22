// frontend/src/redux/api/bookingsApiSlice.js

import { apiSlice } from './apiSlice'

const BOOKINGS_URL = '/api/bookings'

export const bookingsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        // Create booking
        createBooking: builder.mutation({
            query: (data) => ({
                url: BOOKINGS_URL,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Booking', 'Event'],
        }),

        // Gate Scanner Entry Verification (Anti-Passback)
        verifyGateEntry: builder.mutation({
            query: (data) => ({
                url: `${BOOKINGS_URL}/verify-entry`,
                method: 'POST',
                body: data, // expects { passToken: string }
            }),
            invalidatesTags: ['Booking'],
        }),

        // Current User Bookings
        getMyBookings: builder.query({
            query: () => ({
                url: `${BOOKINGS_URL}/my-bookings`,
            }),
            providesTags: ['Booking'],
            keepUnusedDataFor: 5,
        }),

        // Event Attendee Roster (Admin / Organizer)
        getEventBookings: builder.query({
            query: (eventId) => ({
                url: `${BOOKINGS_URL}/event/${eventId}`,
            }),
            providesTags: ['Booking'],
            keepUnusedDataFor: 5,
        }),

        // Digital Entry Pass with Dynamic QR
        getDigitalEntryPass: builder.query({
            query: (id) => ({
                url: `${BOOKINGS_URL}/${id}/entry-pass`,
            }),
            providesTags: (result, error, id) => [{ type: 'Booking', id }],
        }),

        // Shipping Label Preview
        getShippingLabel: builder.query({
            query: (id) => ({
                url: `${BOOKINGS_URL}/${id}/shipping-label`,
            }),
            providesTags: (result, error, id) => [{ type: 'Booking', id }],
        }),

        // Update Payment
        updatePaymentStatus: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `${BOOKINGS_URL}/${id}/pay`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Booking'],
        }),

        // Dispatch Tickets (Physical)
        updateDispatchStatus: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `${BOOKINGS_URL}/${id}/dispatch`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Booking'],
        }),

        // Receive Ticket
        updateReceiveStatus: builder.mutation({
            query: (id) => ({
                url: `${BOOKINGS_URL}/${id}/receive`,
                method: 'PUT',
            }),
            invalidatesTags: ['Booking'],
        }),

        // Bulk Receive
        bulkUpdateReceiveStatus: builder.mutation({
            query: (data) => ({
                url: `${BOOKINGS_URL}/bulk-receive`,
                method: 'PATCH',
                body: data, // { bookingIds: [...] }
            }),
            invalidatesTags: ['Booking'],
        }),

        // Cancel Booking
        cancelBooking: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `${BOOKINGS_URL}/${id}/cancel`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Booking', 'Event'],
        }),
    }),
})

export const {
    useCreateBookingMutation,
    useVerifyGateEntryMutation,
    useGetMyBookingsQuery,
    useGetEventBookingsQuery,
    useGetDigitalEntryPassQuery,
    useGetShippingLabelQuery,
    useUpdatePaymentStatusMutation,
    useUpdateDispatchStatusMutation,
    useUpdateReceiveStatusMutation,
    useBulkUpdateReceiveStatusMutation,
    useCancelBookingMutation,
} = bookingsApiSlice
