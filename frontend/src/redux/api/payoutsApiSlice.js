// frontend/src/redux/api/payoutsApiSlice.js

import { apiSlice } from './apiSlice'

export const payoutsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getAllPayouts: builder.query({
            query: (params) => ({
                url: '/api/payouts/admin/all',
                params,
            }),
            providesTags: ['Payout'],
        }),
        generateEventPayout: builder.mutation({
            query: (eventId) => ({
                url: `/api/payouts/event/${eventId}/generate`,
                method: 'POST',
            }),
            invalidatesTags: ['Payout', 'Event'],
        }),
        disbursePayoutTranche: builder.mutation({
            query: ({ payoutId, amount, mode, trxnId, notes }) => ({
                url: `/api/payouts/${payoutId}/disburse`,
                method: 'POST',
                body: { amount, mode, trxnId, notes },
            }),
            invalidatesTags: ['Payout', 'Event'],
        }),
    }),
})

export const {
    useGetAllPayoutsQuery,
    useGenerateEventPayoutMutation,
    useDisbursePayoutTrancheMutation,
} = payoutsApiSlice
