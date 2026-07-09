import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from './index';

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:4002/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Stores'],
  endpoints: (builder) => ({
    getPendingStores: builder.query<any[], void>({
      query: () => '/stores/pending',
      providesTags: ['Stores'],
    }),
    login: builder.mutation<any, any>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    verifyStore: builder.mutation<any, string>({
      query: (storeId) => ({
        url: `/stores/${storeId}/verify`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Stores'],
    }),
    getPlatformStats: builder.query<any, void>({
      query: () => '/admin/stats',
      providesTags: ['Stores'],
    }),
  }),
});

export const {
  useGetPendingStoresQuery,
  useLoginMutation,
  useVerifyStoreMutation,
  useGetPlatformStatsQuery,
} = adminApi;
