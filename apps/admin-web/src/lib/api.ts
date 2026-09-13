import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { RootState } from './store';
import { logout, setCredentials } from './features/authSlice';

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1',
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
      const refreshResult = await baseQuery({ url: '/identity/refresh', method: 'POST', body: { refreshToken } }, api, extraOptions);
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
  tagTypes: ['Stores', 'Banners'],
  endpoints: (builder) => ({
    getPendingStores: builder.query<any[], void>({
      query: () => '/seller/pending',
      providesTags: ['Stores'],
    }),
    getAllStores: builder.query<any[], { status?: string } | void>({
      query: (params) => ({
        url: '/seller/all',
        params: params || {},
      }),
      providesTags: ['Stores'],
    }),
    login: builder.mutation<any, any>({
      query: (credentials) => ({
        url: '/identity/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    verifyStore: builder.mutation<any, string>({
      query: (storeId) => ({
        url: `/seller/${storeId}/verify`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Stores'],
    }),
    rejectStore: builder.mutation<any, { storeId: string; reason?: string }>({
      query: ({ storeId, reason }) => ({
        url: `/seller/${storeId}/reject`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: ['Stores'],
    }),
    getPlatformStats: builder.query<any, void>({
      query: () => '/admin/stats',
      providesTags: ['Stores'],
    }),
    getUsers: builder.query<any[], void>({
      query: () => '/admin/users',
    }),
    // Banner Management Endpoints
    getBanners: builder.query<any[], void>({
      query: () => '/admin/banners',
      providesTags: ['Banners'],
    }),
    createBanner: builder.mutation<any, any>({
      query: (body) => ({
        url: '/admin/banners',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Banners'],
    }),
    updateBanner: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/admin/banners/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Banners'],
    }),
    deleteBanner: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/banners/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Banners'],
    }),
    toggleBanner: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/banners/${id}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Banners'],
    }),
    getProducts: builder.query<any[], void>({
      query: () => '/catalog/products',
    }),
  }),
});

export const {
  useGetPendingStoresQuery,
  useGetAllStoresQuery,
  useLoginMutation,
  useVerifyStoreMutation,
  useRejectStoreMutation,
  useGetPlatformStatsQuery,
  useGetUsersQuery,
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useToggleBannerMutation,
  useGetProductsQuery,
} = adminApi;
