import { baseApi } from "./baseApi";
import { tagTypes } from "../tagTypes";

//* Plans and the account subscription (Stripe checkout and portal redirects).
export const billingApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPlans: build.query({
      query: () => ({ url: "/plans", method: "GET" }),
      providesTags: [tagTypes.plan],
    }),
    getMySubscription: build.query({
      query: () => ({ url: "/subscriptions/me", method: "GET" }),
      providesTags: [tagTypes.subscription],
    }),
    createCheckoutSession: build.mutation({
      query: (data: { planId: string; interval: "MONTH" | "YEAR" }) => ({ url: "/subscriptions/checkout-session", method: "POST", data }),
    }),
    createPortalSession: build.mutation({
      query: () => ({ url: "/subscriptions/portal-session", method: "POST" }),
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetMySubscriptionQuery,
  useCreateCheckoutSessionMutation,
  useCreatePortalSessionMutation,
} = billingApi;
