import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout, setCredentials } from './features/authSlice';

const baseQuery = fetchBaseQuery({ 
  baseUrl: 'http://localhost:4002/api/v1',
  prepareHeaders: (headers, { getState }) => {
    // @ts-ignore
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // @ts-ignore
    const refreshToken = api.getState().auth.refreshToken;
    
    if (refreshToken) {
      const refreshResult = await baseQuery({ url: '/auth/refresh', method: 'POST', body: { refreshToken } }, api, extraOptions);
      if (refreshResult.data) {
        // @ts-ignore
        const user = (refreshResult.data as any).user || api.getState().auth.user;
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

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Product', 'Order', 'Store', 'User', 'Category'],
  endpoints: (builder) => ({
    login: builder.mutation<any, any>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<any, any>({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    googleLogin: builder.mutation<any, { token: string; role?: string }>({
      query: (body) => ({
        url: '/auth/google',
        method: 'POST',
        body,
      }),
    }),
    getStoreProducts: builder.query<any[], string>({
      query: (storeId) => `/stores/${storeId}/products`,
      providesTags: ['Product'],
    }),
    getAllStores: builder.query<any[], { lat?: number; lng?: number } | void>({
      query: (params) => {
        if (params && params.lat && params.lng) {
          return `/stores?lat=${params.lat}&lng=${params.lng}`;
        }
        return '/stores';
      },
      providesTags: ['Store'],
    }),
    getMyStore: builder.query<any, string>({
      query: (userId) => `/stores/my-store/${userId}`,
      providesTags: ['Store'],
    }),
    getStore: builder.query<any, string>({
      query: (storeId) => `/stores/${storeId}`,
      providesTags: ['Store'],
    }),
    resolveQr: builder.query<any, string>({
      query: (qrUuid) => `/products/qr/${qrUuid}`,
    }),
    onboardStore: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: '/stores/onboard',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Store'],
    }),
    addProduct: builder.mutation<any, { storeId: string; body: any }>({
      query: ({ storeId, body }) => ({
        url: `/stores/${storeId}/products`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Product', 'Store'],
    }),
    createOrder: builder.mutation<any, any>({
      query: (body) => ({
        url: `/orders`,
        method: 'POST',
        body,
      }),
    }),
    getOrder: builder.query<any, string>({
      query: (orderId) => `/orders/${orderId}`,
    }),
    updateOrderStatus: builder.mutation<any, { orderId: string; status: string }>({
      query: ({ orderId, status }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PATCH',
        body: { status },
      }),
    }),
    createPaymentOrder: builder.mutation<any, any>({
      query: (body) => ({
        url: `/payments/create-order`,
        method: 'POST',
        body,
      }),
    }),
    verifyPayment: builder.mutation<any, any>({
      query: (body) => ({
        url: `/payments/verify`,
        method: 'POST',
        body,
      }),
    }),
    getPresignedUrl: builder.mutation<any, any>({
      query: (body) => ({
        url: `/uploads/presigned-url`,
        method: 'POST',
        body,
      }),
    }),
    updateProfile: builder.mutation<any, any>({
      query: (body) => ({
        url: `/users/profile`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    forgotPasswordOtp: builder.mutation<any, any>({
      query: (body) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    verifyForgotPasswordOtp: builder.mutation<any, any>({
      query: (body) => ({
        url: '/auth/verify-forgot-password-otp',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<any, any>({
      query: (body) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body,
      }),
    }),
    updateStoreProfile: builder.mutation<any, { storeId: string; body: any }>({
      query: ({ storeId, body }) => ({
        url: `/stores/${storeId}/profile`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Store'],
    }),
    createCategory: builder.mutation<any, any>({
      query: (body) => ({
        url: '/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Category'],
    }),
    getStoreCategories: builder.query<any[], string>({
      query: (storeId) => `/categories/store/${storeId}`,
      providesTags: ['Category'],
    }),
    deleteCategory: builder.mutation<any, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
  }),
});

export const { 
  useLoginMutation,
  useRegisterMutation,
  useGoogleLoginMutation,
  useGetStoreProductsQuery, 
  useGetAllStoresQuery,
  useGetMyStoreQuery,
  useGetStoreQuery,
  useResolveQrQuery, 
  useOnboardStoreMutation, 
  useAddProductMutation,
  useCreateOrderMutation,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useGetPresignedUrlMutation,
  useUpdateProfileMutation,
  useForgotPasswordOtpMutation,
  useVerifyForgotPasswordOtpMutation,
  useResetPasswordMutation,
  useUpdateStoreProfileMutation,
  useCreateCategoryMutation,
  useGetStoreCategoriesQuery,
  useDeleteCategoryMutation
} = api;
