// frontend/src/redux/api/newsletterApiSlice.js

import { apiSlice } from './apiSlice'

export const newsletterApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        subscribeNewsletter: builder.mutation({
            query: (data) => ({
                url: '/api/newsletter/subscribe',
                method: 'POST',
                body: data,
            }),
        }),
    }),
})

export const { useSubscribeNewsletterMutation } = newsletterApiSlice
