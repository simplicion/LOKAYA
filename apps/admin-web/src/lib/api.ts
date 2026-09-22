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
  tagTypes: ['Stores', 'Products', 'Banners', 'Coupons', 'Reports', 'Reviews', 'SupportTickets', 'DeliveryPartners', 'FuelRates', 'Notifications', 'OnboardingConfig', 'Payouts', 'RiderPayouts'],
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
    approveBlueTick: builder.mutation<any, string>({
      query: (storeId) => ({
        url: `/seller/${storeId}/blue-tick/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Stores'],
    }),
    rejectBlueTick: builder.mutation<any, { storeId: string; reason?: string }>({
      query: ({ storeId, reason }) => ({
        url: `/seller/${storeId}/blue-tick/reject`,
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
    // Coupon Management Endpoints
    getCoupons: builder.query<any[], void>({
      query: () => '/admin/coupons',
      providesTags: ['Coupons'],
    }),
    getCouponStats: builder.query<any, void>({
      query: () => '/admin/coupons/stats',
      providesTags: ['Coupons'],
    }),
    createCoupon: builder.mutation<any, any>({
      query: (body) => ({
        url: '/admin/coupons',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Coupons'],
    }),
    updateCoupon: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/admin/coupons/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Coupons'],
    }),
    deleteCoupon: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/coupons/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Coupons'],
    }),
    toggleCoupon: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/coupons/${id}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Coupons'],
    }),
    getProducts: builder.query<any[], void>({
      query: () => '/catalog/products',
    }),
    // Content Moderation Endpoints
    getReportedContent: builder.query<any[], void>({
      query: () => '/admin/content/reports',
      providesTags: ['Reports'],
    }),
    updateReportStatus: builder.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/admin/content/reports/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Reports'],
    }),
    deleteReportedPost: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/content/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reports'],
    }),
    deleteReportedReel: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/content/reels/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reports'],
    }),
    // Review Moderation Endpoints
    getAdminReviews: builder.query<any[], void>({
      query: () => '/admin/reviews',
      providesTags: ['Reviews'],
    }),
    deleteAdminReview: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reviews'],
    }),
    getAdminSupportTickets: builder.query<{ tickets: any[]; counts: { total: number; open: number; inProgress: number; resolved: number } }, { status?: string; priority?: string; category?: string; search?: string } | void>({
      query: (params) => ({
        url: '/admin/support/tickets',
        params: params || {},
      }),
      providesTags: ['SupportTickets'],
    }),
    updateAdminSupportTicket: builder.mutation<any, { ticketId: string; status?: string; priority?: string; adminNotes?: string }>({
      query: ({ ticketId, ...body }) => ({
        url: `/admin/support/tickets/${ticketId}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['SupportTickets'],
    }),
    getProductsVerification: builder.query<any[], { status?: string } | void>({
      query: (params) => ({
        url: '/admin/products/verification',
        params: params || {},
      }),
      providesTags: ['Products'],
    }),
    verifyProduct: builder.mutation<any, string>({
      query: (productId) => ({
        url: `/admin/products/${productId}/verify`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Products'],
    }),
    rejectProduct: builder.mutation<any, { productId: string; reason?: string }>({
      query: ({ productId, reason }) => ({
        url: `/admin/products/${productId}/reject`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: ['Products'],
    }),
    // Delivery Partner / Rider Verification Endpoints
    getAllDeliveryPartners: builder.query<any[], { status?: string; search?: string } | void>({
      query: (params) => ({
        url: '/admin/delivery-partners',
        params: params || {},
      }),
      providesTags: ['DeliveryPartners'],
    }),
    getDeliveryPartnerStats: builder.query<{ total: number; pending: number; approved: number; rejected: number; suspended: number }, void>({
      query: () => '/admin/delivery-partners/stats',
      providesTags: ['DeliveryPartners'],
    }),
    verifyDeliveryPartner: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/delivery-partners/${id}/verify`,
        method: 'PATCH',
      }),
      invalidatesTags: ['DeliveryPartners'],
    }),
    rejectDeliveryPartner: builder.mutation<any, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/delivery-partners/${id}/reject`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: ['DeliveryPartners'],
    }),
    suspendDeliveryPartner: builder.mutation<any, { id: string; reason?: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/delivery-partners/${id}/suspend`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: ['DeliveryPartners'],
    }),
    uploadMedia: builder.mutation<{ success: boolean; url: string; publicUrl: string; fileKey: string }, FormData>({
      query: (formData) => ({
        url: '/media/upload',
        method: 'POST',
        body: formData,
      }),
    }),
    // Fuel Rate Management Endpoints
    getFuelRates: builder.query<{ total: number; page: number; limit: number; totalPages: number; items: any[] }, { search?: string; page?: number; limit?: number } | void>({
      query: (params) => ({
        url: '/admin/fuel-rates',
        params: params || {},
      }),
      providesTags: ['FuelRates'],
    }),
    getFuelRateByCountry: builder.query<{ rate: any; benchmark: any }, string>({
      query: (countryCode) => `/admin/fuel-rates/${countryCode}`,
      providesTags: (result, error, countryCode) => [{ type: 'FuelRates', id: countryCode }],
    }),
    updateFuelRate: builder.mutation<any, { countryCode: string; fuelPricePerLiter: number; isActive?: boolean }>({
      query: ({ countryCode, ...body }) => ({
        url: `/admin/fuel-rates/${countryCode}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['FuelRates'],
    }),
    seedFuelRates: builder.mutation<any, void>({
      query: () => ({
        url: '/admin/fuel-rates/seed',
        method: 'POST',
      }),
      invalidatesTags: ['FuelRates'],
    }),
    // Push Notification Marketing Endpoints
    getNotificationCampaigns: builder.query<{ total: number; page: number; limit: number; totalPages: number; items: any[] }, { page?: number; limit?: number } | void>({
      query: (params) => ({
        url: '/admin/notifications/campaigns',
        params: params || {},
      }),
      providesTags: ['Notifications'],
    }),
    broadcastNotification: builder.mutation<any, { title: string; body: string; imageUrl?: string; deepLink?: string; targetAudience: string; targetFilter?: any }>({
      query: (body) => ({
        url: '/admin/notifications/broadcast',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Notifications'],
    }),
    getNotificationStats: builder.query<{ totalDevices: number; androidDevices: number; iosDevices: number; webDevices: number; totalCampaigns: number; totalInApp: number }, void>({
      query: () => '/admin/notifications/stats',
      providesTags: ['Notifications'],
    }),
    getOnboardingConfig: builder.query<any, void>({
      query: () => '/admin/onboarding-config',
      providesTags: ['OnboardingConfig'],
    }),
    updateOnboardingConfig: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: '/admin/onboarding-config',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['OnboardingConfig', 'Products', 'Stores', 'DeliveryPartners'],
    }),

    // Seller Payouts Management
    getPayouts: builder.query<{
      payouts: any[];
      total: number;
      page: number;
      limit: number;
      stats: {
        pendingCount: number;
        pendingAmount: number;
        completedCount: number;
        completedAmount: number;
      };
    }, { status?: string; page?: number; limit?: number; search?: string } | void>({
      query: (params) => ({
        url: '/admin/payouts',
        params: params || {},
      }),
      providesTags: ['Payouts'],
    }),
    completePayout: builder.mutation<any, { id: string; transactionRef?: string }>({
      query: ({ id, transactionRef }) => ({
        url: `/admin/payouts/${id}/complete`,
        method: 'PATCH',
        body: { transactionRef },
      }),
      invalidatesTags: ['Payouts'],
    }),
    rejectPayout: builder.mutation<any, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/payouts/${id}/reject`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: ['Payouts'],
    }),

    // Rider / Delivery Partner Payouts Management
    getRiderPayouts: builder.query<{
      payouts: any[];
      total: number;
      page: number;
      limit: number;
      stats: {
        pendingCount: number;
        pendingAmount: number;
        completedCount: number;
        completedAmount: number;
      };
    }, { status?: string; page?: number; limit?: number; search?: string } | void>({
      query: (params) => ({
        url: '/admin/rider-payouts',
        params: params || {},
      }),
      providesTags: ['RiderPayouts'],
    }),
    completeRiderPayout: builder.mutation<any, { id: string; transactionRef?: string }>({
      query: ({ id, transactionRef }) => ({
        url: `/admin/rider-payouts/${id}/complete`,
        method: 'PATCH',
        body: { transactionRef },
      }),
      invalidatesTags: ['RiderPayouts'],
    }),
    rejectRiderPayout: builder.mutation<any, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/admin/rider-payouts/${id}/reject`,
        method: 'PATCH',
        body: { reason },
      }),
      invalidatesTags: ['RiderPayouts'],
    }),
  }),
});

export const {
  useGetPendingStoresQuery,
  useGetAllStoresQuery,
  useLoginMutation,
  useVerifyStoreMutation,
  useRejectStoreMutation,
  useApproveBlueTickMutation,
  useRejectBlueTickMutation,
  useGetPlatformStatsQuery,
  useGetUsersQuery,
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  useToggleBannerMutation,
  useUploadMediaMutation,
  useGetCouponsQuery,
  useGetCouponStatsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useToggleCouponMutation,
  useGetProductsQuery,
  useGetProductsVerificationQuery,
  useVerifyProductMutation,
  useRejectProductMutation,
  useGetReportedContentQuery,
  useUpdateReportStatusMutation,
  useDeleteReportedPostMutation,
  useDeleteReportedReelMutation,
  useGetAdminReviewsQuery,
  useDeleteAdminReviewMutation,
  useGetAdminSupportTicketsQuery,
  useUpdateAdminSupportTicketMutation,
  useGetAllDeliveryPartnersQuery,
  useGetDeliveryPartnerStatsQuery,
  useVerifyDeliveryPartnerMutation,
  useRejectDeliveryPartnerMutation,
  useSuspendDeliveryPartnerMutation,
  useGetFuelRatesQuery,
  useGetFuelRateByCountryQuery,
  useUpdateFuelRateMutation,
  useSeedFuelRatesMutation,
  useGetNotificationCampaignsQuery,
  useBroadcastNotificationMutation,
  useGetNotificationStatsQuery,
  useGetOnboardingConfigQuery,
  useUpdateOnboardingConfigMutation,
  useGetPayoutsQuery,
  useCompletePayoutMutation,
  useRejectPayoutMutation,
  useGetRiderPayoutsQuery,
  useCompleteRiderPayoutMutation,
  useRejectRiderPayoutMutation,
} = adminApi;

