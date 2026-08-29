import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout, setCredentials } from './features/authSlice';

const baseQuery = fetchBaseQuery({ 
  baseUrl: 'http://localhost:4002/api/v1',
  credentials: 'include',
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // If it's a 401, we dispatch logout because the backend handles token refreshing automatically via cookies if possible,
    // or we can attempt to call a refresh endpoint if the backend requires explicit refresh calls.
    // Assuming backend handles refresh transparently or we need to call refresh:
    // Let's call refresh explicitly just in case:
    const refreshResult = await baseQuery('/identity/refresh', api, extraOptions);
    if (refreshResult.data) {
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }
  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Product', 'Order', 'Store', 'User', 'Category', 'Reel', 'Post', 'Comment', 'Wishlist'],
  endpoints: (builder) => ({
    checkAuth: builder.query<any, void>({
      query: () => '/identity/me',
      providesTags: ['User'],
    }),
    login: builder.mutation<any, any>({
      query: (credentials) => ({
        url: '/identity/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<any, any>({
      query: (userData) => ({
        url: '/identity/register',
        method: 'POST',
        body: userData,
      }),
    }),
    googleLogin: builder.mutation<any, { token: string; role?: string }>({
      query: (body) => ({
        url: '/identity/google',
        method: 'POST',
        body,
      }),
    }),
    getStoreProducts: builder.query<any[], string>({
      query: (storeId) => `/catalog/store/${storeId}/products`,
      providesTags: ['Product'],
    }),
    getAllStores: builder.query<any[], { lat?: number; lng?: number } | void>({
      query: (params) => {
        if (params && params.lat && params.lng) {
          return `/catalog/stores?lat=${params.lat}&lng=${params.lng}`;
        }
        return '/catalog/stores';
      },
      providesTags: ['Store'],
    }),
    getMyStore: builder.query<any, string | void>({
      query: () => `/seller/me`,
      providesTags: ['Store'],
    }),
    getStore: builder.query<any, string>({
      query: (storeId) => `/catalog/store/${storeId}`,
      providesTags: ['Store'],
    }),
    resolveQr: builder.query<any, string>({
      query: (qrUuid) => `/catalog/qr/${qrUuid}`,
    }),
    onboardStore: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: '/seller/onboard',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Store'],
    }),
    addProduct: builder.mutation<any, { storeId: string; body: any }>({
      query: ({ storeId, body }) => ({
        url: `/catalog/store/${storeId}/products`,
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
        url: '/media/presigned-url',
        method: 'POST',
        body,
      }),
    }),

    processMedia: builder.mutation<any, any>({
      query: (body) => ({
        url: '/media/process',
        method: 'POST',
        body,
      }),
    }),
    updateProfile: builder.mutation<any, any>({
      query: (body) => ({
        url: `/identity/profile`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    sendRegistrationOtp: builder.mutation<any, any>({
      query: (body) => ({
        url: '/identity/send-otp',
        method: 'POST',
        body,
      }),
    }),
    forgotPasswordOtp: builder.mutation<any, any>({
      query: (body) => ({
        url: '/identity/forgot-password',
        method: 'POST',
        body,
      }),
    }),
    verifyForgotPasswordOtp: builder.mutation<any, any>({
      query: (body) => ({
        url: '/identity/verify-forgot-password-otp',
        method: 'POST',
        body,
      }),
    }),
    resetPassword: builder.mutation<any, any>({
      query: (body) => ({
        url: '/identity/reset-password',
        method: 'POST',
        body,
      }),
    }),
    updateStoreProfile: builder.mutation<any, { storeId: string; body: any }>({
      query: ({ storeId, body }) => ({
        url: `/seller/${storeId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Store'],
    }),
    createCategory: builder.mutation<any, any>({
      query: (body) => ({
        url: `/catalog/store/${body.storeId}/categories`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Category'],
    }),
    getStoreCategories: builder.query<any[], string>({
      query: (storeId) => `/catalog/store/${storeId}/categories`,
      providesTags: ['Category'],
    }),
    deleteCategory: builder.mutation<any, string>({
      query: (id) => ({
        url: `/catalog/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
    // New Global Search
    searchGlobal: builder.query<{ users: any[], stores: any[], products: any[] }, string>({
      query: (q) => `/search?q=${encodeURIComponent(q)}`,
    }),
    
    // Wishlist
    getWishlist: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => '/wishlist',
      providesTags: ['Wishlist'],
    }),
    toggleWishlist: builder.mutation<{ success: boolean; data: { status: string } }, { productId: string }>({
      query: (body) => ({
        url: '/wishlist/toggle',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wishlist'],
    }),
    
    // New Content & Social Endpoints (Phase 1)
    createPost: builder.mutation<any, any>({
      query: (body) => ({
        url: '/content/posts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Post'],
    }),
    createReel: builder.mutation<any, any>({
      query: (body) => ({
        url: '/content/reels',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Reel'],
    }),
    getReels: builder.query<any[], { page?: number; limit?: number } | void>({
      query: (params) => {
        let qs = '';
        if (params?.page) qs += `?page=${params.page}`;
        if (params?.limit) qs += `${qs ? '&' : '?'}limit=${params.limit}`;
        return `/content/reels${qs}`;
      },
      providesTags: ['Reel'],
    }),
    getPosts: builder.query<any[], { page?: number; limit?: number } | void>({
      query: (params) => {
        let qs = '';
        if (params?.page) qs += `?page=${params.page}`;
        if (params?.limit) qs += `${qs ? '&' : '?'}limit=${params.limit}`;
        return `/content/posts${qs}`;
      },
      providesTags: ['Post'],
    }),
    likeReel: builder.mutation<any, string>({
      query: (reelId) => ({
        url: `/social/like/reel/${reelId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Reel'],
    }),
    likePost: builder.mutation<any, string>({
      query: (postId) => ({
        url: `/social/like/post/${postId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Post'],
    }),
    followUser: builder.mutation<any, string>({
      query: (userId) => ({
        url: `/social/follow/${userId}`,
        method: 'POST',
      }),
    }),
    getReelComments: builder.query<any[], string>({
      query: (reelId) => `/social/comment/reel/${reelId}`,
      providesTags: ['Comment'],
    }),

    getPostComments: builder.query<any[], string>({
      query: (postId) => `/social/comment/post/${postId}`,
      providesTags: ['Comment'],
    }),
    addPostComment: builder.mutation<any, { postId: string; content: string }>({
      query: ({ postId, content }) => ({
        url: `/social/comment/post/${postId}`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['Comment'],
    }),
    getPostLikes: builder.query<any[], string>({
      query: (postId) => `/social/like/post/${postId}`,
    }),
    getReelLikes: builder.query<any[], string>({
      query: (reelId) => `/social/like/reel/${reelId}`,
    }),
    reportContent: builder.mutation<any, { targetId: string; targetType: 'POST' | 'REEL'; reason: string }>({
      query: (body) => ({
        url: '/social/report',
        method: 'POST',
        body,
      }),
    }),
    addReelComment: builder.mutation<any, { reelId: string; content: string }>({
      query: ({ reelId, content }) => ({
        url: `/social/comment/reel/${reelId}`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['Comment'],
    }),

    // Cart Endpoints
    getCart: builder.query<any, void>({
      query: () => '/cart',
      providesTags: ['Order'], // Using 'Order' tag or can use 'Cart'
    }),
    addToCart: builder.mutation<any, { productId: string; variantId?: string; quantity: number }>({
      query: (body) => ({
        url: '/cart/items',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order'],
    }),
    updateCartItem: builder.mutation<any, { itemId: string; quantity: number }>({
      query: ({ itemId, quantity }) => ({
        url: `/cart/items/${itemId}`,
        method: 'PUT',
        body: { quantity },
      }),
      invalidatesTags: ['Order'],
    }),
    removeFromCart: builder.mutation<any, string>({
      query: (itemId) => ({
        url: `/cart/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Order'],
    }),
    clearCart: builder.mutation<any, void>({
      query: () => ({
        url: '/cart',
        method: 'DELETE',
      }),
      invalidatesTags: ['Order'],
    }),
    applyCoupon: builder.mutation<any, string>({
      query: (code) => ({
        url: '/cart/coupon',
        method: 'POST',
        body: { code },
      }),
      invalidatesTags: ['Order'],
    }),
    removeCoupon: builder.mutation<any, void>({
      query: () => ({
        url: '/cart/coupon',
        method: 'DELETE',
      }),
      invalidatesTags: ['Order'],
    }),
  }),
});

export const { 
  useCheckAuthQuery,
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
  useProcessMediaMutation,
  useUpdateProfileMutation,
  useSendRegistrationOtpMutation,
  useForgotPasswordOtpMutation,
  useVerifyForgotPasswordOtpMutation,
  useResetPasswordMutation,
  useUpdateStoreProfileMutation,
  useCreateCategoryMutation,
  useGetStoreCategoriesQuery,
  useDeleteCategoryMutation,
  
  useCreatePostMutation,
  useCreateReelMutation,
  useGetReelsQuery,
  useGetPostsQuery,
  useGetWishlistQuery,
  useToggleWishlistMutation,
  useLikeReelMutation,
  useLikePostMutation,
  useFollowUserMutation,
  useSearchGlobalQuery,
  useGetReelCommentsQuery,
  useAddReelCommentMutation,

  useGetPostCommentsQuery,
  useAddPostCommentMutation,
  useGetPostLikesQuery,
  useGetReelLikesQuery,
  useReportContentMutation,

  // Cart Hooks
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useApplyCouponMutation,
  useRemoveCouponMutation,
} = api;
