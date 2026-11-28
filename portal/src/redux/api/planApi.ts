import { tagTypes } from "../tagTypes";
import { baseApi } from "./baseApi";

export type PublicPlan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  currency: string;
  price: { month: number; year: number };
  limits: { listings: number; mediaPerListing: number; featured: number; members: number; analytics: boolean };
  purchasable: { month: boolean; year: boolean };
};

//* Public plans + Stripe Checkout for OWNER/SHELTER account holders (pricing page)
export const planApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    pubGetPlans: build.query<PublicPlan[], void>({
      query: () => ({ url: "/plans", method: "GET" }),
      transformResponse: (res: PublicPlan[]) => res ?? [],
      providesTags: [tagTypes.plan],
    }),
    pubStartSubscriptionCheckout: build.mutation<{ url: string }, { planId: string; interval: "month" | "year" }>({
      //* the API expects MONTH | YEAR while /plans keys prices by month | year
      query: ({ planId, interval }) => ({
        url: "/subscriptions/checkout-session",
        method: "POST",
        data: { planId, interval: interval.toUpperCase() },
      }),
    }),
  }),
});

export const { usePubGetPlansQuery, usePubStartSubscriptionCheckoutMutation } = planApi;
