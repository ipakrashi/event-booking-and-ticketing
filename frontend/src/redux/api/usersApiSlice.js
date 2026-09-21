// frontend/src/redux/api/usersApiSlice.js

import { apiSlice } from './apiSlice'

export const usersApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (credentials) => ({
                url: '/api/users/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        register: builder.mutation({
            query: (userData) => ({
                url: '/api/users',
                method: 'POST',
                body: userData,
            }),
        }),
        logoutApi: builder.mutation({
            query: () => ({
                url: '/api/users/logout',
                method: 'POST',
            }),
        }),
    }),
})

// RTK Query automatically creates custom React hooks for each endpoint
export const { useLoginMutation, useRegisterMutation, useLogoutApiMutation } =
    usersApiSlice
