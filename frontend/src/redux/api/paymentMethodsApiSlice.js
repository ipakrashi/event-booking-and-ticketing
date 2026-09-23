// frontend/src/redux/api/paymentMethodsApiSlice.js

import { apiSlice } from './apiSlice'

export const paymentMethodsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getPaymentMethods: builder.query({
            query: () => '/api/payment-methods',
            providesTags: ['PaymentMethod'],
        }),
    }),
})

export const { useGetPaymentMethodsQuery } = paymentMethodsApiSlice
