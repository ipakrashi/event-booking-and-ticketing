// frontend/src/redux/api/apiSlice.js

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseQuery = fetchBaseQuery({
    baseUrl: '', // Empty because Vite proxy forwards /api requests
    credentials: 'include', // Automatically passes and receives HTTP-only cookies
})

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery,
    tagTypes: [
        'User',
        'Event',
        'Booking',
        'Venue',
        'Payout',
        'Role',
        'Category',
        'Banner',
        'EventReview',
    ],
    endpoints: () => ({}),
})
