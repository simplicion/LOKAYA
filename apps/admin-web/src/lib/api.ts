import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { RootState } from './index';
import { logout, setCredentials } from './features/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:4002/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    const refreshToken = (api.getState() as RootState).auth.refreshToken;
    
    if (refreshToken) {
      const refreshResult = await baseQuery({ url: '/auth/refresh', method: 'POST', body: { refreshToken } }, api, extraOptions);
      if (refreshResult.data) {
        const user = (api.getState() as RootState).auth.user;
        api.dispatch(setCredentials({ token: (refreshResult.data as any).token, refreshToken, user }));
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }
  return result;
};

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: baseQueryWithReauth,
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
