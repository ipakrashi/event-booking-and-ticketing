// frontend/src/redux/api/apiSlice.js

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseQuery = fetchBaseQuery({
    baseUrl: '', // Empty because Vite proxy forwards all /api requests to localhost:5000
    credentials: 'include', // Automatically passes and receives HTTP-only cookies
})

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery,
    tagTypes: ['User', 'Event', 'Booking', 'Venue', 'Payout'],
    endpoints: () => ({}),
})
