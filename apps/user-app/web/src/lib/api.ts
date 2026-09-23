import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { logout, setCredentials } from './features/authSlice';

const baseQuery = fetchBaseQuery({ 
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4002/api/v1',
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
  refetchOnFocus: false,
  refetchOnReconnect: true,
  keepUnusedDataFor: 300, // 5 minutes cache retention to eliminate redundant network fetches
  tagTypes: ['Product', 'Order', 'Store', 'User', 'Category', 'Reel', 'Post', 'Comment', 'Wishlist', 'SellerDashboard', 'SellerFinance', 'SellerAnalytics', 'SellerNotifications', 'UserNotifications', 'Story', 'Highlight', 'SavedPost', 'FollowedStores', 'SupportTicket', 'Review', 'DeliveryPartner', 'DeliveryAssignment', 'StorePartner', 'OnboardingConfig', 'RiderFinance'],
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
    getStoreProducts: builder.query<any[], string | { storeId: string; isOwner?: boolean }>({
      query: (arg) => {
        if (typeof arg === 'string') {
          return `/catalog/store/${arg}/products`;
        }
        return `/catalog/store/${arg.storeId}/products${arg.isOwner ? '?isOwner=true' : ''}`;
      },
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
      invalidatesTags: ['Order'],
    }),
    createManualOrder: builder.mutation<any, {
      storeId: string;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      paymentMethod?: string;
      discountAmount?: number;
      notes?: string;
      items: Array<{
        productId: string;
        variantId?: string | null;
        quantity: number;
        customPrice?: number | null;
      }>;
    }>({
      query: (body) => ({
        url: '/orders/manual',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'SellerDashboard', 'Product', 'Store'],
    }),
    getUserOrders: builder.query<any[], void>({
      query: () => '/orders',
      providesTags: ['Order'],
    }),
    getOrder: builder.query<any, string>({
      query: (orderId) => `/orders/${orderId}`,
      providesTags: ['Order'],
    }),
    getOrderInvoice: builder.query<any, string>({
      query: (orderId) => `/orders/${orderId}/invoice`,
      providesTags: ['Order'],
    }),
    updateOrderStatus: builder.mutation<any, { orderId: string; status: string }>({
      query: ({ orderId, status }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Order', 'SellerDashboard'],
    }),
    dispatchShipment: builder.mutation<any, string>({
      query: (orderId) => ({
        url: `/orders/${orderId}/dispatch`,
        method: 'POST',
      }),
      invalidatesTags: ['Order', 'SellerDashboard'],
    }),
    getOrderTracking: builder.query<any, string>({
      query: (orderId) => `/orders/${orderId}/track`,
      providesTags: ['Order'],
    }),
    getPublicParcelVerification: builder.query<any, string>({
      query: (orderId) => `/orders/public/parcel/${orderId}`,
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
    uploadMedia: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/media/upload',
        method: 'POST',
        body: formData,
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
    generateAiPhotoshoot: builder.mutation<{
      success: boolean;
      productAnalysis?: any;
      generatedDetails?: {
        name?: string;
        description?: string;
        category?: string;
        sellingPrice?: number | null;
        costPrice?: number | null;
        mrp?: number | null;
      };
      shots: Array<{
        id: string;
        title: string;
        badge: string;
        description: string;
        url: string;
        publicUrl: string;
        prompt: string;
      }>;
      message?: string;
    }, FormData>({
      query: (formData) => ({
        url: '/media/ai-photoshoot',
        method: 'POST',
        body: formData,
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
    getAddresses: builder.query<any[], void>({
      query: () => '/identity/addresses',
      providesTags: ['User'],
    }),
    addAddress: builder.mutation<any, any>({
      query: (body) => ({
        url: '/identity/addresses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    updateAddress: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/identity/addresses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
    }),
    deleteAddress: builder.mutation<any, string>({
      query: (id) => ({
        url: `/identity/addresses/${id}`,
        method: 'DELETE',
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
    verifyRegistrationOtp: builder.mutation<any, { email?: string; phone?: string; otp: string }>({
      query: (body) => ({
        url: '/identity/verify-otp',
        method: 'POST',
        body,
      }),
    }),
    setPassword: builder.mutation<any, { password: string }>({
      query: (body) => ({
        url: '/identity/set-password',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
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
    requestStoreVerification: builder.mutation<any, string>({
      query: (storeId) => ({
        url: `/seller/${storeId}/request-verification`,
        method: 'POST',
      }),
      invalidatesTags: ['Store', 'SellerDashboard'],
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
    updateCategory: builder.mutation<any, { categoryId: string; body: any }>({
      query: ({ categoryId, body }) => ({
        url: `/catalog/categories/${categoryId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation<any, string>({
      query: (id) => ({
        url: `/catalog/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),
    // New Global Search
    searchGlobal: builder.query<{ users: any[]; stores: any[]; products: any[]; posts: any[] }, string>({
      query: (q) => `/search?q=${encodeURIComponent(q)}`,
      transformResponse: (response: any) => {
        if (response?.data) return response.data;
        return response || { users: [], stores: [], products: [], posts: [] };
      },
    }),
    getTrendingSearch: builder.query<{ trendingKeywords: string[] }, void>({
      query: () => '/search/trending',
      transformResponse: (response: any) => {
        if (response?.data) return response.data;
        return response || { trendingKeywords: [] };
      },
      keepUnusedDataFor: 120,
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
      async onQueryStarted({ productId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getWishlist', undefined, (draft: any) => {
            if (draft && Array.isArray(draft.data)) {
              const idx = draft.data.findIndex((item: any) => item.productId === productId || item.product?.id === productId);
              if (idx >= 0) {
                draft.data.splice(idx, 1);
              } else {
                draft.data.push({
                  id: `temp-wishlist-${productId}`,
                  productId,
                  product: { id: productId }
                });
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
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
      invalidatesTags: ['Reel', 'Post'],
    }),
    getReels: builder.query<any[], { page?: number; limit?: number } | void>({
      query: (params) => {
        let qs = '';
        if (params?.page) qs += `?page=${params.page}`;
        if (params?.limit) qs += `${qs ? '&' : '?'}limit=${params.limit}`;
        return `/content/reels${qs}`;
      },
      providesTags: ['Reel'],
      keepUnusedDataFor: 300,
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
    getPostById: builder.query<any, string>({
      query: (postId) => `/content/posts/${postId}`,
      providesTags: (_result, _error, id) => [{ type: 'Post', id }],
    }),
    getReelById: builder.query<any, string>({
      query: (reelId) => `/content/reels/${reelId}`,
      providesTags: (_result, _error, id) => [{ type: 'Reel', id }],
    }),
    getShareRecipients: builder.query<any[], void>({
      query: () => '/social/share/recipients',
    }),
    sendDirectShare: builder.mutation<any, { recipientId: string; shareUrl: string; message?: string }>({
      query: (body) => ({
        url: '/social/share/send',
        method: 'POST',
        body,
      }),
    }),
    likeReel: builder.mutation<{ liked: boolean; likesCount: number }, string>({
      query: (reelId) => ({
        url: `/social/like/reel/${reelId}`,
        method: 'POST',
      }),
      async onQueryStarted(reelId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getReelById', reelId, (draft: any) => {
            if (draft) {
              const currentLiked = Boolean(draft.isLikedByMe);
              draft.isLikedByMe = !currentLiked;
              draft.likesCount = Math.max(0, (draft.likesCount || 0) + (currentLiked ? -1 : 1));
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    likePost: builder.mutation<{ liked: boolean; likesCount: number }, string>({
      query: (postId) => ({
        url: `/social/like/post/${postId}`,
        method: 'POST',
      }),
      async onQueryStarted(postId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getPostById', postId, (draft: any) => {
            if (draft) {
              const currentLiked = Boolean(draft.isLikedByMe);
              draft.isLikedByMe = !currentLiked;
              draft.likesCount = Math.max(0, (draft.likesCount || 0) + (currentLiked ? -1 : 1));
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    followUser: builder.mutation<any, string>({
      query: (userId) => ({
        url: `/social/follow/${userId}`,
        method: 'POST',
      }),
    }),
    followStore: builder.mutation<{ following: boolean }, string>({
      query: (storeId) => ({
        url: `/social/store/${storeId}/follow`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, storeId) => ['FollowedStores', { type: 'Store', id: storeId }, 'User'],
    }),
    getStoreFollowStatus: builder.query<{ following: boolean; followersCount: number }, string>({
      query: (storeId) => `/social/store/${storeId}/follow-status`,
      providesTags: (result, error, storeId) => [{ type: 'Store', id: storeId }],
    }),
    getFollowedStores: builder.query<any[], void>({
      query: () => '/social/followed-stores',
      providesTags: ['FollowedStores'],
    }),
    getProductsBatch: builder.query<any[], string[]>({
      query: (ids) => ({
        url: '/catalog/products/batch',
        method: 'POST',
        body: { ids },
      }),
      providesTags: ['Product'],
    }),
    // Support Ticket Endpoints
    createSupportTicket: builder.mutation<any, { subject: string; category: string; description: string; priority?: string; orderId?: string }>({
      query: (data) => ({
        url: '/support/tickets',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SupportTicket'],
    }),
    getMySupportTickets: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => '/support/tickets/my',
      providesTags: ['SupportTicket'],
    }),
    getSupportTicketById: builder.query<{ success: boolean; data: any }, string>({
      query: (id) => `/support/tickets/${id}`,
      providesTags: (result, error, id) => [{ type: 'SupportTicket', id }],
    }),
    // Review Endpoints
    createProductReview: builder.mutation<{ success: boolean; data: any }, { productId: string; orderId?: string; rating: number; comment?: string }>({
      query: (data) => ({
        url: '/catalog/reviews',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Review', 'Product', 'Store'],
    }),
    getMyReviews: builder.query<{ success: boolean; data: any[] }, void>({
      query: () => '/catalog/reviews/my',
      providesTags: ['Review'],
    }),
    deleteProductReview: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/catalog/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Review', 'Product', 'Store'],
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
      invalidatesTags: ['Post', 'Reel'],
    }),
    deletePost: builder.mutation<any, string>({
      query: (postId) => ({
        url: `/content/posts/${postId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Post'],
    }),
    deleteReel: builder.mutation<any, string>({
      query: (reelId) => ({
        url: `/content/reels/${reelId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reel'],
    }),
    addReelComment: builder.mutation<any, { reelId: string; content: string }>({
      query: ({ reelId, content }) => ({
        url: `/social/comment/reel/${reelId}`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['Comment'],
    }),
    getUserPublicProfile: builder.query<any, string>({
      query: (userId) => `/social/user/${userId}`,
      providesTags: ['User'],
    }),

    // Stories Endpoints
    getStoriesFeed: builder.query<any[], void>({
      query: () => '/content/stories/feed',
      providesTags: ['Story'],
    }),
    getStoreStories: builder.query<any[], string>({
      query: (storeId) => `/content/stories/store/${storeId}`,
      providesTags: ['Story'],
    }),
    createStory: builder.mutation<any, any>({
      query: (body) => ({
        url: '/content/stories',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Story'],
    }),
    viewStory: builder.mutation<any, string>({
      query: (storyId) => ({
        url: `/content/stories/${storyId}/view`,
        method: 'POST',
      }),
    }),
    likeStory: builder.mutation<{ liked: boolean; likesCount: number }, string>({
      query: (storyId) => ({
        url: `/content/stories/${storyId}/like`,
        method: 'POST',
      }),
      invalidatesTags: ['Story'],
    }),
    getStoryArchive: builder.query<any[], void>({
      query: () => '/content/stories/archive',
      providesTags: ['Story'],
    }),
    deleteStory: builder.mutation<any, string>({
      query: (storyId) => ({
        url: `/content/stories/${storyId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Story'],
    }),

    // Highlights Endpoints
    createHighlight: builder.mutation<any, any>({
      query: (body) => ({
        url: '/content/highlights',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Highlight'],
    }),
    getStoreHighlights: builder.query<any[], string>({
      query: (storeId) => `/content/highlights/store/${storeId}`,
      providesTags: ['Highlight'],
    }),
    getHighlightDetails: builder.query<any, string>({
      query: (highlightId) => `/content/highlights/${highlightId}`,
      providesTags: ['Highlight'],
    }),
    deleteHighlight: builder.mutation<any, string>({
      query: (highlightId) => ({
        url: `/content/highlights/${highlightId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Highlight'],
    }),

    // Store Content Endpoints
    getStorePosts: builder.query<any[], string>({
      query: (storeId) => `/content/posts/store/${storeId}`,
      providesTags: ['Post'],
    }),
    getStoreReels: builder.query<any[], string>({
      query: (storeId) => `/content/reels/store/${storeId}`,
      providesTags: ['Reel'],
    }),

    // Saved / Bookmarked Posts
    savePost: builder.mutation<{ saved: boolean }, string>({
      query: (postId) => ({
        url: `/social/save/post/${postId}`,
        method: 'POST',
      }),
      async onQueryStarted(postId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getPostById', postId, (draft: any) => {
            if (draft) {
              draft.isSavedByMe = !draft.isSavedByMe;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['SavedPost', 'Post'],
    }),
    saveReel: builder.mutation<{ saved: boolean }, string>({
      query: (reelId) => ({
        url: `/social/save/reel/${reelId}`,
        method: 'POST',
      }),
      async onQueryStarted(reelId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getReelById', reelId, (draft: any) => {
            if (draft) {
              draft.isSavedByMe = !draft.isSavedByMe;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['SavedPost', 'Reel'],
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
      async onQueryStarted(body, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getCart', undefined, (draft: any) => {
            if (draft && Array.isArray(draft.items)) {
              const existing = draft.items.find(
                (i: any) => (i.productId === body.productId || i.product?.id === body.productId) && (body.variantId ? i.variantId === body.variantId : true)
              );
              if (existing) {
                existing.quantity += (body.quantity || 1);
              } else {
                draft.items.push({
                  id: `temp-${body.productId}-${Date.now()}`,
                  productId: body.productId,
                  variantId: body.variantId,
                  quantity: body.quantity || 1,
                  product: {
                    id: body.productId,
                    isActive: true,
                  }
                });
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Order'],
    }),
    updateCartItem: builder.mutation<any, { itemId: string; quantity: number }>({
      query: ({ itemId, quantity }) => ({
        url: `/cart/items/${itemId}`,
        method: 'PUT',
        body: { quantity },
      }),
      async onQueryStarted({ itemId, quantity }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getCart', undefined, (draft: any) => {
            if (draft && Array.isArray(draft.items)) {
              const item = draft.items.find((i: any) => i.id === itemId || i.productId === itemId);
              if (item) {
                if (quantity <= 0) {
                  draft.items = draft.items.filter((i: any) => i.id !== itemId && i.productId !== itemId);
                } else {
                  item.quantity = quantity;
                }
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Order'],
    }),
    removeFromCart: builder.mutation<any, string>({
      query: (itemId) => ({
        url: `/cart/items/${itemId}`,
        method: 'DELETE',
      }),
      async onQueryStarted(itemId, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getCart', undefined, (draft: any) => {
            if (draft && Array.isArray(draft.items)) {
              draft.items = draft.items.filter((i: any) => i.id !== itemId && i.productId !== itemId);
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Order'],
    }),
    clearCart: builder.mutation<any, void>({
      query: () => ({
        url: '/cart',
        method: 'DELETE',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          api.util.updateQueryData('getCart', undefined, (draft: any) => {
            if (draft && Array.isArray(draft.items)) {
              draft.items = [];
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
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

    // ----------------------------------------------------
    // SELLER WORKSPACE ENDPOINTS (PRODUCTION)
    // ----------------------------------------------------

    // Dashboard
    getSellerDashboardStats: builder.query<{
      todayOrders: number;
      todayRevenue: number;
      activeProducts: number;
      lowStockItems: number;
      ordersGrowth: string;
      revenueGrowth: string;
    }, string | void>({
      query: (range = 'Today') => `/seller/dashboard/stats?range=${encodeURIComponent(range || 'Today')}`,
      providesTags: ['SellerDashboard'],
    }),
    getSellerRecentOrders: builder.query<any[], { limit?: number; status?: string } | number | void>({
      query: (arg) => {
        let limit = 3;
        let status = 'PENDING';
        if (typeof arg === 'number') {
          limit = arg;
          status = '';
        } else if (arg && typeof arg === 'object') {
          if (arg.limit !== undefined) limit = arg.limit;
          if (arg.status !== undefined) status = arg.status;
        }
        const params = new URLSearchParams();
        if (limit) params.set('limit', String(limit));
        if (status) params.set('status', status);
        const qs = params.toString();
        return `/seller/dashboard/recent-orders${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['SellerDashboard', 'Order'],
    }),
    getSellerSalesTrend: builder.query<Array<{ name: string; value: number; date?: string; fullDate?: string; ordersCount?: number }>, string | void>({
      query: (range = '7d') => `/seller/dashboard/sales-trend?range=${encodeURIComponent(range || '7d')}`,
      providesTags: ['SellerDashboard'],
    }),
    getStoreSummary: builder.query<{
      store: any;
      avgRating: number;
      reviewCount: number;
      isOpen: boolean;
      timingLabel: string;
      followersCount?: number;
      followingCount?: number;
      postsCount?: number;
      reelsCount?: number;
      productsCount?: number;
    }, string>({
      query: (storeId) => `/seller/${storeId}/summary`,
      providesTags: ['Store'],
    }),
    updateStoreTheme: builder.mutation<any, { storeId: string; body: { themeColor?: string; secondaryColor?: string } }>({
      query: ({ storeId, body }) => ({
        url: `/seller/${storeId}/theme`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Store'],
    }),

    // Orders Management
    getStoreOrders: builder.query<{
      orders: any[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }, { storeId: string; tab?: string; search?: string; page?: number; limit?: number }>({
      query: ({ storeId, tab = 'All', search = '', page = 1, limit = 50 }) => 
        `/orders/store/${storeId}?tab=${encodeURIComponent(tab)}&search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`,
      providesTags: ['Order', 'SellerDashboard'],
    }),
    verifyOrderPickup: builder.mutation<any, { orderId: string; otp?: string; qrToken?: string }>({
      query: ({ orderId, otp, qrToken }) => ({
        url: `/orders/${orderId}/verify-pickup`,
        method: 'POST',
        body: { otp, qrToken },
      }),
      invalidatesTags: ['Order', 'SellerDashboard', 'SellerFinance'],
    }),

    // Products Management
    getPublicProducts: builder.query<any[], { category?: string; search?: string; sort?: string; limit?: number } | void>({
      query: (params) => {
        let qs = '';
        if (params?.category) qs += `category=${encodeURIComponent(params.category)}&`;
        if (params?.search) qs += `search=${encodeURIComponent(params.search)}&`;
        if (params?.sort) qs += `sort=${encodeURIComponent(params.sort)}&`;
        if (params?.limit) qs += `limit=${params.limit}&`;
        return `/catalog/products${qs ? `?${qs.slice(0, -1)}` : ''}`;
      },
      providesTags: ['Product'],
    }),
    getBanners: builder.query<any[], void>({
      query: () => '/content/banners',
      providesTags: ['Post'],
    }),
    getProductById: builder.query<any, string>({
      query: (id) => `/catalog/products/${id}`,
      providesTags: ['Product'],
    }),
    updateProduct: builder.mutation<any, { productId: string; body: any }>({
      query: ({ productId, body }) => ({
        url: `/catalog/products/${productId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Product', 'SellerDashboard'],
    }),
    deleteProduct: builder.mutation<any, string>({
      query: (id) => ({
        url: `/catalog/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product', 'SellerDashboard'],
    }),

    // Finance & Payouts
    getFinanceSummary: builder.query<{
      totalRevenue: number;
      totalPayouts: number;
      pendingPayouts: number;
      availableBalance: number;
      todayCollected: number;
      lastCollected: number;
      todayOrders: number;
      lastOrders: number;
    }, void>({
      query: () => '/seller/finance/summary',
      providesTags: ['SellerFinance'],
    }),
    getBankAccounts: builder.query<any[], void>({
      query: () => '/seller/finance/bank-accounts',
      providesTags: ['SellerFinance'],
    }),
    addBankAccount: builder.mutation<any, { accountName: string; bankName: string; accountNumber: string; ifsc: string }>({
      query: (body) => ({
        url: '/seller/finance/bank-accounts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SellerFinance'],
    }),
    setPrimaryBankAccount: builder.mutation<any, string>({
      query: (id) => ({
        url: `/seller/finance/bank-accounts/${id}/primary`,
        method: 'PATCH',
      }),
      invalidatesTags: ['SellerFinance'],
    }),
    deleteBankAccount: builder.mutation<any, string>({
      query: (id) => ({
        url: `/seller/finance/bank-accounts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SellerFinance'],
    }),
    getPayouts: builder.query<{ totalPayouts: number; pendingPayouts?: number; successRate: string; payouts: any[] }, void>({
      query: () => '/seller/finance/payouts',
      providesTags: ['SellerFinance'],
    }),
    requestPayout: builder.mutation<any, { amount: number; bankAccountId?: string }>({
      query: (body) => ({
        url: '/seller/finance/payouts/request',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SellerFinance'],
    }),
    getTransactions: builder.query<{ transactions: any[]; total: number; page: number; limit: number }, { type?: string; page?: number; limit?: number } | void>({
      query: (params) => {
        const type = params?.type || 'All';
        return `/seller/finance/transactions?type=${encodeURIComponent(type)}&page=${params?.page || 1}&limit=${params?.limit || 50}`;
      },
      providesTags: ['SellerFinance'],
    }),

    // In-App Notifications
    getSellerNotifications: builder.query<{ unreadCount: number; notifications: any[] }, void>({
      query: () => '/seller/notifications',
      providesTags: ['SellerNotifications'],
    }),
    markNotificationRead: builder.mutation<any, string>({
      query: (id) => ({
        url: `/seller/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['SellerNotifications'],
    }),
    markAllNotificationsRead: builder.mutation<any, void>({
      query: () => ({
        url: '/seller/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['SellerNotifications'],
    }),

    // Consumer In-App Notifications
    getUserNotifications: builder.query<{
      total: number;
      unreadCount: number;
      page: number;
      limit: number;
      totalPages: number;
      items: any[];
    }, { page?: number; limit?: number; type?: string } | void>({
      query: (params) => {
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const typeQuery = params?.type && params.type !== 'ALL' ? `&type=${encodeURIComponent(params.type)}` : '';
        return `/notifications/me?page=${page}&limit=${limit}${typeQuery}`;
      },
      providesTags: ['UserNotifications'],
    }),
    markUserNotificationRead: builder.mutation<any, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['UserNotifications'],
    }),
    markAllUserNotificationsRead: builder.mutation<any, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['UserNotifications'],
    }),

    // Analytics
    getAnalyticsOverview: builder.query<{ stats: any[]; chartData: any[] }, string | void>({
      query: (range = 'This Month') => `/seller/analytics/overview?range=${encodeURIComponent(range || 'This Month')}`,
      providesTags: ['SellerAnalytics'],
    }),
    getAnalyticsSalesRevenue: builder.query<{ grossSales: number; netRevenue: number; chartData: any[]; products: any[] }, string | void>({
      query: (range = 'This Month') => `/seller/analytics/sales-revenue?range=${encodeURIComponent(range || 'This Month')}`,
      providesTags: ['SellerAnalytics'],
    }),
    getAnalyticsProducts: builder.query<{ topProducts: any[]; categorySales: any[] }, string | void>({
      query: (range = 'This Month') => `/seller/analytics/products?range=${encodeURIComponent(range || 'This Month')}`,
      providesTags: ['SellerAnalytics'],
    }),
    getAnalyticsOrders: builder.query<{ totalOrders: number; completedOrders: number; cancelledOrders: number; chartData: any[] }, string | void>({
      query: (range = 'This Month') => `/seller/analytics/orders?range=${encodeURIComponent(range || 'This Month')}`,
      providesTags: ['SellerAnalytics'],
    }),
    getAnalyticsCustomers: builder.query<{ pieData: any[]; topCustomers: any[]; totalCustomers: number }, string | void>({
      query: (range = 'This Month') => `/seller/analytics/customers?range=${encodeURIComponent(range || 'This Month')}`,
      providesTags: ['SellerAnalytics'],
    }),
    exportAnalytics: builder.mutation<string, { reportType: string; dateRange: string; format: string }>({
      query: (body) => ({
        url: '/seller/analytics/export',
        method: 'POST',
        body,
        responseHandler: (response) => response.text(),
      }),
    }),
    getExploreStores: builder.query<any[], { category?: string; search?: string } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.category && params.category !== 'all') queryParams.append('category', params.category);
        if (params?.search && params.search.trim()) queryParams.append('search', params.search.trim());
        const qs = queryParams.toString();
        return `/seller/explore${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Store'],
    }),

    // ----------------------------------------------------
    // DELIVERY PARTNER WORKSPACE ENDPOINTS (PRODUCTION)
    // ----------------------------------------------------

    getDeliveryProfile: builder.query<any, void>({
      query: () => '/delivery/me',
      providesTags: ['DeliveryPartner'],
    }),
    onboardDeliveryPartner: builder.mutation<any, any>({
      query: (body) => ({
        url: '/delivery/register',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DeliveryPartner', 'User'],
    }),
    toggleDeliveryOnline: builder.mutation<any, boolean>({
      query: (isOnline) => ({
        url: '/delivery/toggle-online',
        method: 'POST',
        body: { isOnline },
      }),
      invalidatesTags: ['DeliveryPartner'],
    }),
    updateDeliveryLocation: builder.mutation<any, { latitude: number; longitude: number; locationArea?: string }>({
      query: (body) => ({
        url: '/delivery/location',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DeliveryPartner'],
    }),
    getDeliveryIncomingTasks: builder.query<any[], void>({
      query: () => '/delivery/tasks/incoming',
      providesTags: ['DeliveryAssignment'],
    }),
    getDeliveryActiveTask: builder.query<any, void>({
      query: () => '/delivery/active-task',
      providesTags: ['DeliveryAssignment', 'Order'],
    }),
    acceptDeliveryTask: builder.mutation<any, string>({
      query: (assignmentId) => ({
        url: `/delivery/tasks/${assignmentId}/accept`,
        method: 'POST',
      }),
      invalidatesTags: ['DeliveryAssignment', 'DeliveryPartner', 'Order'],
    }),
    updateDeliveryTaskStatus: builder.mutation<any, { assignmentId: string; status: string }>({
      query: ({ assignmentId, status }) => ({
        url: `/delivery/tasks/${assignmentId}/status`,
        method: 'POST',
        body: { status },
      }),
      invalidatesTags: ['DeliveryAssignment', 'DeliveryPartner', 'Order', 'SellerDashboard'],
    }),
    verifyStorePickup: builder.mutation<any, { orderId: string; otp: string }>({
      query: ({ orderId, otp }) => ({
        url: `/delivery/orders/${orderId}/verify-store-pickup`,
        method: 'POST',
        body: { otp },
      }),
      invalidatesTags: ['DeliveryAssignment', 'DeliveryPartner', 'Order', 'SellerDashboard', 'SellerFinance'],
    }),
    verifyDeliveryOtp: builder.mutation<any, { orderId: string; otp: string }>({
      query: ({ orderId, otp }) => ({
        url: `/delivery/orders/${orderId}/verify-otp`,
        method: 'POST',
        body: { otp },
      }),
      invalidatesTags: ['DeliveryAssignment', 'DeliveryPartner', 'Order', 'SellerDashboard', 'SellerFinance'],
    }),
    getNearbyStoresForPartner: builder.query<any[], void>({
      query: () => '/delivery/partner-stores',
      providesTags: ['StorePartner', 'Store'],
    }),
    sendStorePartnerRequest: builder.mutation<any, { storeId: string; notes?: string }>({
      query: (body) => ({
        url: '/delivery/partner-stores/request',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StorePartner', 'DeliveryPartner'],
    }),
    getRiderPartnerStores: builder.query<{
      connectedStores: Array<{
        requestId: string;
        store: any;
        status: string;
        notes?: string;
        initiatedBy: string;
        connectedAt: string;
      }>;
      incomingRequests: Array<{
        requestId: string;
        store: any;
        status: string;
        notes?: string;
        initiatedBy: string;
        requestedAt: string;
      }>;
      outgoingRequests: Array<{
        requestId: string;
        store: any;
        status: string;
        notes?: string;
        initiatedBy: string;
        requestedAt: string;
      }>;
    }, void>({
      query: () => '/delivery/partner-stores/my-partners',
      providesTags: ['StorePartner'],
    }),
    riderRespondStorePartnerRequest: builder.mutation<any, { requestId: string; status: 'ACCEPTED' | 'REJECTED' }>({
      query: (body) => ({
        url: '/delivery/partner-stores/respond',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StorePartner', 'DeliveryPartner'],
    }),
    riderDisconnectStore: builder.mutation<any, string>({
      query: (storeId) => ({
        url: `/delivery/partner-stores/${storeId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StorePartner', 'DeliveryPartner'],
    }),
    getDeliveryHistory: builder.query<any[], void>({
      query: () => '/delivery/history',
      providesTags: ['DeliveryAssignment'],
    }),
    getStorePartnerRequests: builder.query<any[], string>({
      query: (storeId) => `/delivery/store/${storeId}/partner-requests`,
      providesTags: ['StorePartner'],
    }),
    respondStorePartnerRequest: builder.mutation<any, { requestId: string; status: 'ACCEPTED' | 'REJECTED' }>({
      query: (body) => ({
        url: '/delivery/store/partner-requests/respond',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StorePartner', 'DeliveryPartner'],
    }),
    getStoreConnectedPartners: builder.query<any[], string>({
      query: (storeId) => `/delivery/store/${storeId}/connected-partners`,
      providesTags: ['StorePartner'],
    }),
    disconnectStorePartner: builder.mutation<any, { storeId: string; deliveryPartnerId: string }>({
      query: ({ storeId, deliveryPartnerId }) => ({
        url: `/delivery/store/${storeId}/partners/${deliveryPartnerId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StorePartner'],
    }),
    findDeliveryPartnersForStore: builder.query<any[], { storeId: string; search?: string; location?: string; vehicleType?: string; maxRate?: number; onlyOnline?: boolean }>({
      query: ({ storeId, ...params }) => ({
        url: `/delivery/store/${storeId}/find-partners`,
        params: {
          ...(params.search ? { search: params.search } : {}),
          ...(params.location ? { location: params.location } : {}),
          ...(params.vehicleType ? { vehicleType: params.vehicleType } : {}),
          ...(params.maxRate ? { maxRate: params.maxRate } : {}),
          ...(params.onlyOnline !== undefined ? { onlyOnline: params.onlyOnline } : {})
        }
      }),
      providesTags: ['StorePartner', 'DeliveryPartner'],
    }),
    sellerInviteDeliveryPartner: builder.mutation<any, { storeId: string; deliveryPartnerId: string; notes?: string }>({
      query: ({ storeId, ...body }) => ({
        url: `/delivery/store/${storeId}/invite-partner`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['StorePartner', 'DeliveryPartner'],
    }),
    dispatchOrderWithFulfillment: builder.mutation<any, { orderId: string; fulfillmentType: string; deliveryPartnerId?: string }>({
      query: ({ orderId, ...body }) => ({
        url: `/delivery/store/orders/${orderId}/dispatch-fulfillment`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'SellerDashboard', 'DeliveryAssignment'],
    }),
    updateDeliveryPricing: builder.mutation<any, { perKmRate?: number; baseFare?: number; isCustomPricingEnabled?: boolean }>({
      query: (body) => ({
        url: '/delivery/pricing',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['DeliveryPartner'],
    }),
    getPricingBenchmarks: builder.query<any, { lat?: number; lng?: number } | void>({
      query: (params) => {
        if (params && params.lat && params.lng) {
          return `/delivery/pricing/benchmarks?lat=${params.lat}&lng=${params.lng}`;
        }
        return '/delivery/pricing/benchmarks';
      },
      providesTags: ['DeliveryPartner'],
    }),
    getOrderDeliveryEconomics: builder.query<any, string>({
      query: (orderId) => `/delivery/orders/${orderId}/economics`,
      providesTags: ['Order', 'DeliveryAssignment'],
    }),
    getStoreReadyOrdersForDispatch: builder.query<any, string>({
      query: (storeId) => `/delivery/store/${storeId}/ready-orders`,
      providesTags: ['Order', 'DeliveryAssignment'],
    }),
    previewBatchEconomics: builder.mutation<any, { storeId: string; orderIds: string[] }>({
      query: ({ storeId, orderIds }) => ({
        url: `/delivery/store/${storeId}/batches/preview`,
        method: 'POST',
        body: { orderIds },
      }),
    }),
    dispatchBatch: builder.mutation<any, { storeId: string; orderIds: string[]; fulfillmentType?: string; deliveryPartnerId?: string }>({
      query: ({ storeId, ...body }) => ({
        url: `/delivery/store/${storeId}/batches/dispatch`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'DeliveryAssignment'],
    }),
    verifyBatchDropOtp: builder.mutation<any, { batchId: string; orderId: string; otp: string }>({
      query: ({ batchId, ...body }) => ({
        url: `/delivery/batches/${batchId}/verify-drop`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Order', 'DeliveryAssignment', 'DeliveryPartner'],
    }),
    getDeliveryActiveBatch: builder.query<any, void>({
      query: () => '/delivery/active-batch',
      providesTags: ['DeliveryAssignment', 'Order', 'DeliveryPartner'],
    }),
    updateBatchStatus: builder.mutation<any, { batchId: string; status: string }>({
      query: ({ batchId, ...body }) => ({
        url: `/delivery/batches/${batchId}/status`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['DeliveryAssignment', 'Order', 'DeliveryPartner'],
    }),
    getMultiStoreBlendedPricing: builder.mutation<any, { storeDistances: Array<{ distanceKm: number; isDeliveryIncluded?: boolean }>; countryCode?: string }>({
      query: (body) => ({
        url: '/delivery/pricing/multi-store-blended',
        method: 'POST',
        body,
      }),
    }),
    getOnboardingConfig: builder.query<any, void>({
      query: () => '/meta/onboarding-config',
      providesTags: ['OnboardingConfig'],
    }),

    // Delivery Partner Finance & Payouts
    getRiderFinanceSummary: builder.query<{
      totalEarnings: number;
      availableBalance: number;
      pendingPayouts: number;
      totalPayouts: number;
      completedPayoutCount: number;
      pendingPayoutCount: number;
      totalDrops: number;
      vehicleMode: string;
      verified: boolean;
      primaryBank?: any;
    }, void>({
      query: () => '/delivery/finance/summary',
      providesTags: ['RiderFinance'],
    }),
    getRiderBankAccounts: builder.query<any[], void>({
      query: () => '/delivery/finance/bank-accounts',
      providesTags: ['RiderFinance'],
    }),
    addRiderBankAccount: builder.mutation<any, { accountName: string; bankName: string; accountNumber: string; ifsc: string }>({
      query: (body) => ({
        url: '/delivery/finance/bank-accounts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['RiderFinance'],
    }),
    setPrimaryRiderBankAccount: builder.mutation<any, string>({
      query: (id) => ({
        url: `/delivery/finance/bank-accounts/${id}/primary`,
        method: 'PATCH',
      }),
      invalidatesTags: ['RiderFinance'],
    }),
    deleteRiderBankAccount: builder.mutation<any, string>({
      query: (id) => ({
        url: `/delivery/finance/bank-accounts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['RiderFinance'],
    }),
    getRiderPayouts: builder.query<{ totalPayouts: number; pendingPayouts: number; successRate: string; payouts: any[] }, void>({
      query: () => '/delivery/finance/payouts',
      providesTags: ['RiderFinance'],
    }),
    requestRiderPayout: builder.mutation<any, { amount: number; bankAccountId?: string }>({
      query: (body) => ({
        url: '/delivery/finance/payouts/request',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['RiderFinance'],
    }),
  }),
});

export const { 
  useGetExploreStoresQuery,
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
  useGetOnboardingConfigQuery,
  useAddProductMutation,
  useCreateOrderMutation,
  useCreateManualOrderMutation,
  useGetUserOrdersQuery,
  useGetOrderQuery,
  useGetOrderInvoiceQuery,
  useUpdateOrderStatusMutation,
  useDispatchShipmentMutation,
  useGetOrderTrackingQuery,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useUploadMediaMutation,
  useGetPresignedUrlMutation,
  useProcessMediaMutation,
  useGenerateAiPhotoshootMutation,
  useUpdateProfileMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSendRegistrationOtpMutation,
  useVerifyRegistrationOtpMutation,
  useSetPasswordMutation,
  useForgotPasswordOtpMutation,
  useVerifyForgotPasswordOtpMutation,
  useResetPasswordMutation,
  useUpdateStoreProfileMutation,
  useRequestStoreVerificationMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useGetStoreCategoriesQuery,
  useDeleteCategoryMutation,
  
  useCreatePostMutation,
  useCreateReelMutation,
  useGetReelsQuery,
  useGetPostsQuery,
  useGetPostByIdQuery,
  useGetReelByIdQuery,
  useGetShareRecipientsQuery,
  useSendDirectShareMutation,
  useGetWishlistQuery,
  useToggleWishlistMutation,
  useLikeReelMutation,
  useLikePostMutation,
  useFollowUserMutation,
  useSearchGlobalQuery,
  useGetTrendingSearchQuery,
  useGetReelCommentsQuery,
  useAddReelCommentMutation,

  useGetPostCommentsQuery,
  useAddPostCommentMutation,
  useGetPostLikesQuery,
  useGetReelLikesQuery,
  useReportContentMutation,
  useDeletePostMutation,
  useDeleteReelMutation,

  // Cart Hooks
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useApplyCouponMutation,
  useRemoveCouponMutation,

  // Seller Platform Production Hooks
  useGetSellerDashboardStatsQuery,
  useGetSellerRecentOrdersQuery,
  useGetSellerSalesTrendQuery,
  useGetStoreSummaryQuery,
  useUpdateStoreThemeMutation,
  useGetStoreOrdersQuery,
  useVerifyOrderPickupMutation,
  useGetPublicProductsQuery,
  useGetBannersQuery,
  useGetProductByIdQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetFinanceSummaryQuery,
  useGetBankAccountsQuery,
  useAddBankAccountMutation,
  useSetPrimaryBankAccountMutation,
  useDeleteBankAccountMutation,
  useGetPayoutsQuery,
  useRequestPayoutMutation,
  useGetTransactionsQuery,
  useGetSellerNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetAnalyticsOverviewQuery,
  useGetAnalyticsSalesRevenueQuery,
  useGetAnalyticsProductsQuery,
  useGetAnalyticsOrdersQuery,
  useGetAnalyticsCustomersQuery,
  useExportAnalyticsMutation,

  // Stories Hooks
  useGetStoriesFeedQuery,
  useGetStoreStoriesQuery,
  useCreateStoryMutation,
  useViewStoryMutation,
  useLikeStoryMutation,
  useGetStoryArchiveQuery,
  useDeleteStoryMutation,

  // Highlights Hooks
  useCreateHighlightMutation,
  useGetStoreHighlightsQuery,
  useGetHighlightDetailsQuery,
  useDeleteHighlightMutation,

  // Store Content Hooks
  useGetStorePostsQuery,
  useGetStoreReelsQuery,

  // Save Posts Hooks
  useSavePostMutation,
  useSaveReelMutation,

  // User Public Profile Hook
  useGetUserPublicProfileQuery,

  // Store Follow & Batch Product Hooks
  useFollowStoreMutation,
  useGetStoreFollowStatusQuery,
  useGetFollowedStoresQuery,
  useGetProductsBatchQuery,

  // Support Ticket Hooks
  useCreateSupportTicketMutation,
  useGetMySupportTicketsQuery,
  useGetSupportTicketByIdQuery,

  // Review Hooks
  useCreateProductReviewMutation,
  useGetMyReviewsQuery,
  useDeleteProductReviewMutation,

  // Delivery Partner Hooks
  useGetDeliveryProfileQuery,
  useOnboardDeliveryPartnerMutation,
  useToggleDeliveryOnlineMutation,
  useUpdateDeliveryLocationMutation,
  useGetDeliveryIncomingTasksQuery,
  useGetDeliveryActiveTaskQuery,
  useGetDeliveryActiveBatchQuery,
  useUpdateBatchStatusMutation,
  useGetDeliveryHistoryQuery,
  useAcceptDeliveryTaskMutation,
  useUpdateDeliveryTaskStatusMutation,
  useVerifyStorePickupMutation,
  useVerifyDeliveryOtpMutation,
  useGetNearbyStoresForPartnerQuery,
  useSendStorePartnerRequestMutation,
  useGetRiderPartnerStoresQuery,
  useRiderRespondStorePartnerRequestMutation,
  useRiderDisconnectStoreMutation,
  useGetStorePartnerRequestsQuery,
  useRespondStorePartnerRequestMutation,
  useGetStoreConnectedPartnersQuery,
  useDisconnectStorePartnerMutation,
  useFindDeliveryPartnersForStoreQuery,
  useSellerInviteDeliveryPartnerMutation,
  useDispatchOrderWithFulfillmentMutation,
  useUpdateDeliveryPricingMutation,
  useGetPricingBenchmarksQuery,
  useGetOrderDeliveryEconomicsQuery,
  useGetStoreReadyOrdersForDispatchQuery,
  usePreviewBatchEconomicsMutation,
  useDispatchBatchMutation,
  useVerifyBatchDropOtpMutation,
  useGetMultiStoreBlendedPricingMutation,
  useGetPublicParcelVerificationQuery,

  // Delivery Partner Finance Hooks
  useGetRiderFinanceSummaryQuery,
  useGetRiderBankAccountsQuery,
  useAddRiderBankAccountMutation,
  useSetPrimaryRiderBankAccountMutation,
  useDeleteRiderBankAccountMutation,
  useGetRiderPayoutsQuery,
  useRequestRiderPayoutMutation,

  // Consumer User Notifications Hooks
  useGetUserNotificationsQuery,
  useMarkUserNotificationReadMutation,
  useMarkAllUserNotificationsReadMutation,
} = api;


