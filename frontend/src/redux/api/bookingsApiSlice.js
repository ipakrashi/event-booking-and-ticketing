// frontend/src/redux/api/bookingsApiSlice.js

import { apiSlice } from './apiSlice'

export const bookingsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        createBooking: builder.mutation({
            query: (data) => ({
                url: '/api/bookings',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Booking'],
        }),
        getMyBookings: builder.query({
            query: () => '/api/bookings/my-bookings',
            providesTags: ['Booking'],
        }),
        getAllBookings: builder.query({
            query: () => '/api/bookings/admin/all',
            providesTags: ['Booking'],
        }),
        submitPaymentDetails: builder.mutation({
            query: ({ id, mode, trxnId }) => ({
                url: `/api/bookings/${id}/submit-payment`,
                method: 'PUT',
                body: { mode, trxnId },
            }),
            invalidatesTags: ['Booking'],
        }),
        approvePayment: builder.mutation({
            query: (id) => ({
                url: `/api/bookings/${id}/approve-payment`,
                method: 'PUT',
            }),
            invalidatesTags: ['Booking'],
        }),
        recordPayment: builder.mutation({
            query: ({ id, paymentAmount, paymentDetails }) => ({
                url: `/api/bookings/${id}/pay`,
                method: 'PUT',
                body: { paymentAmount, paymentDetails },
            }),
            invalidatesTags: ['Booking'],
        }),
        requestRefund: builder.mutation({
            query: ({ id, cancellationReason }) => ({
                url: `/api/bookings/${id}/request-refund`,
                method: 'PUT',
                body: { cancellationReason },
            }),
            invalidatesTags: ['Booking'],
        }),
        processRefund: builder.mutation({
            query: ({ id, action, adminRemarks }) => ({
                url: `/api/bookings/${id}/process-refund`,
                method: 'PUT',
                body: { action, adminRemarks },
            }),
            invalidatesTags: ['Booking'],
        }),
        getEntryPass: builder.query({
            query: (id) => `/api/bookings/${id}/entry-pass`,
            providesTags: (result, error, id) => [{ type: 'EntryPass', id }],
        }),
        verifyGateEntry: builder.mutation({
            query: (data) => ({
                url: '/api/bookings/verify-entry',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Booking'],
        }),
        // Dispatch & Shipping Endpoints
        updateDispatchStatus: builder.mutation({
            query: ({ id, courierName, podId }) => ({
                url: `/api/bookings/${id}/dispatch`,
                method: 'PUT',
                body: {
                    despatchDetails: { courierName, podId },
                },
            }),
            invalidatesTags: ['Booking'],
        }),
        getShippingLabel: builder.query({
            query: (id) => `/api/bookings/${id}/shipping-label`,
            providesTags: (result, error, id) => [
                { type: 'ShippingLabel', id },
            ],
        }),
    }),
})

export const {
    useCreateBookingMutation,
    useGetMyBookingsQuery,
    useGetAllBookingsQuery,
    useSubmitPaymentDetailsMutation,
    useApprovePaymentMutation,
    useRecordPaymentMutation,
    useRequestRefundMutation,
    useProcessRefundMutation,
    useGetEntryPassQuery,
    useVerifyGateEntryMutation,
    useUpdateDispatchStatusMutation,
    useGetShippingLabelQuery,
} = bookingsApiSlice
