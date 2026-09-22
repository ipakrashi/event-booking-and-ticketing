// frontend/src/redux/api/usersApiSlice.js

import { apiSlice } from './apiSlice'

const USERS_URL = '/api/users'

export const usersApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (data) => ({
                url: `${USERS_URL}/login`,
                method: 'POST',
                body: data,
            }),
        }),
        logout: builder.mutation({
            query: () => ({
                url: `${USERS_URL}/logout`,
                method: 'POST',
            }),
        }),
        register: builder.mutation({
            query: (data) => ({
                url: USERS_URL,
                method: 'POST',
                body: data,
            }),
        }),
        profile: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `${USERS_URL}/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['User'],
        }),
        forgotPassword: builder.mutation({
            query: (data) => ({
                url: `${USERS_URL}/forgot-password`,
                method: 'POST',
                body: data,
            }),
        }),
        resetPassword: builder.mutation({
            query: ({ token, ...data }) => ({
                url: `${USERS_URL}/reset-password/${token}`,
                method: 'PUT',
                body: data,
            }),
        }),
    }),
})

export const {
    useLoginMutation,
    useLogoutMutation,
    useRegisterMutation,
    useProfileMutation,
    useForgotPasswordMutation,
    useResetPasswordMutation,
} = usersApiSlice
