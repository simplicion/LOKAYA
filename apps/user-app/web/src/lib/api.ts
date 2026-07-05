import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://localhost:4000/api/v1', // Fixed port and version path
    prepareHeaders: (headers, { getState }) => {
      // @ts-ignore
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Product', 'Order', 'Store', 'User'],
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
    getAllStores: builder.query<any[], void>({
      query: () => '/stores',
      providesTags: ['Store'],
    }),
    getMyStore: builder.query<any, string>({
      query: (userId) => `/stores/my-store/${userId}`,
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
  }),
});

export const { 
  useLoginMutation,
  useRegisterMutation,
  useGoogleLoginMutation,
  useGetStoreProductsQuery, 
  useGetAllStoresQuery,
  useGetMyStoreQuery,
  useResolveQrQuery, 
  useOnboardStoreMutation, 
  useAddProductMutation,
  useCreateOrderMutation,
  useGetOrderQuery,
  useUpdateOrderStatusMutation,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useGetPresignedUrlMutation
} = api;
