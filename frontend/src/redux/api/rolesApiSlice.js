// frontend/src/redux/api/rolesApiSlice.js

import { apiSlice } from './apiSlice'

export const rolesApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getRoles: builder.query({
            query: () => '/api/admin/role',
            providesTags: ['Role'],
        }),
        addRole: builder.mutation({
            query: (data) => ({
                url: '/api/admin/role',
                method: 'POST',
                body: data, // { role: 'admin' }
            }),
            invalidatesTags: ['Role'],
        }),
    }),
})

export const { useGetRolesQuery, useAddRoleMutation } = rolesApiSlice
