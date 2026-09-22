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
        updateUser: builder.mutation({
            query: ({ id, ...userData }) => ({
                url: `/api/users/${id}`,
                method: 'PUT',
                body: userData,
            }),
            invalidatesTags: ['User'],
        }),
        forgotPassword: builder.mutation({
            query: (data) => ({
                url: '/api/users/forgot-password',
                method: 'POST',
                body: data, // { email }
            }),
        }),
        resetPassword: builder.mutation({
            query: ({ token, ...data }) => ({
                url: `/api/users/reset-password/${token}`,
                method: 'PUT',
                body: data, // { password }
            }),
        }),
    }),
})

export const {
    useLoginMutation,
    useRegisterMutation,
    useLogoutApiMutation,
    useUpdateUserMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
} = usersApiSlice
