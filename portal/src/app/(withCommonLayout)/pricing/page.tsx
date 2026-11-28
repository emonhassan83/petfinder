"use client";

import { useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Container, Skeleton, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Link from "next/link";
import Meta from "@/components/Meta/MetaData";
import PageHeader from "@/components/Shared/PageHeader";
import { toast } from "sonner";
import { mockPlans } from "@/mock/shelter";
import { PublicPlan, usePubGetPlansQuery, usePubStartSubscriptionCheckoutMutation } from "@/redux/api/planApi";
import { useAuthUser } from "@/hooks/useAuthUser";
import { formatMoney } from "@/lib/apiData";

//* Offline preview only (mock prices are whole dollars; the API uses cents)
const previewPlans: PublicPlan[] = mockPlans.map((p) => ({
  id: p.id,
  code: p.id,
  name: p.name,
  currency: "USD",
  price: { month: p.price.month * 100, year: p.price.year * 100 },
  limits: { listings: p.listings, mediaPerListing: p.media, featured: p.featured, members: p.members, analytics: p.id !== "free" },
  purchasable: { month: false, year: false },
}));

//* Account holders who can buy a plan (POST /subscriptions/checkout-session)
const BILLING_ROLES = ["owner", "shelter"];

type Cycle = "month" | "year";

const blurbs: Record<string, string> = {
  free: "For individuals rehoming a pet or two.",
  pro: "For growing rescues that list every week.",
  premium: "For established shelters with a full team.",
};

const extras: Record<string, string[]> = {
  free: ["Applications inbox", "Chat with adopters"],
  pro: ["Everything in Free", "Meet-and-greet booking", "Analytics dashboard"],
  premium: ["Everything in Pro", "Priority verification", "Priority support"],
};

const faqs = [
  { q: "Do adopters pay to use Petfinder?", a: "No. Browsing, saving pets, booking visits and applying are always free for adopters. Plans are only for people and organisations listing pets." },
  { q: "What happens if I downgrade?", a: "Your listings stay. Anything above the new plan's limit is paused, not deleted, and you can choose which ones stay live." },
  { q: "Can I switch between monthly and yearly?", a: "Yes, at any time from Billing. Yearly plans cost the same as ten months." },
  { q: "Do I need to be verified to list?", a: "Individuals can list right away. Shelters get the verified badge after our team reviews their documents, usually within two working days." },
];

//* A dotted-leader row, like a salon price list
const Row = ({ label, value }: { label: string; value: string | number }) => (
  <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, py: 0.75 }}>
    <Typography sx={{ fontSize: 15 }}>{label}</Typography>
    <Box aria-hidden sx={{ flex: 1, borderBottom: "2px dotted", borderColor: "divider", transform: "translateY(-4px)" }} />
    <Typography sx={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
  </Box>
);

//* Public plans page for owners and shelters (Pawvelle "transparent pricing" menu). Plans: GET /plans.
//* Guests -> register; signed-in OWNER/SHELTER -> Stripe Checkout (redirect to the returned url).
const PricingPage = () => {
  const [cycle, setCycle] = useState<Cycle>("month");
  const { data, isLoading, error } = usePubGetPlansQuery();
  const offline = !!error && !(error as any)?.status;
  const plans = offline ? previewPlans : data ?? [];
  const { user } = useAuthUser();
  const [checkout, { isLoading: redirecting }] = usePubStartSubscriptionCheckoutMutation();
  const [pending, setPending] = useState("");

  const choose = async (p: PublicPlan) => {
    setPending(p.id);
    try {
      const res = await checkout({ planId: p.id, interval: cycle }).unwrap();
      if (res?.url) window.location.assign(res.url);
    } catch (err: any) {
      //* 409: already subscribed (change plans from Billing); 503: payments not configured
      toast.error(err?.data?.message || "Checkout is not available right now");
    } finally {
      setPending("");
    }
  };

  const cta = (p: PublicPlan, popular: boolean) => {
    const price = p.price[cycle];
    const label = price === 0 ? "Start free" : `Choose ${p.name}`;
    const common = { variant: popular ? ("contained" as const) : ("outlined" as const), size: "large" as const, fullWidth: true, sx: { mt: 3 } };
    if (!user) return <Button component={Link} href="/register" {...common}>{label}</Button>;
    if (!BILLING_ROLES.includes(user.role)) {
      return (
        <>
          <Button disabled {...common}>{label}</Button>
          <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 1, textAlign: "center" }}>Plans are for owner and shelter accounts.</Typography>
        </>
      );
    }
    if (price === 0) return <Button component={Link} href="/dashboard/shelter/billing" {...common}>Manage plan</Button>;
    if (!p.purchasable?.[cycle]) {
      return (
        <>
          <Button disabled {...common}>{label}</Button>
          <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 1, textAlign: "center" }}>Online checkout for this plan opens soon.</Typography>
        </>
      );
    }
    return (
      <Button {...common} disabled={redirecting} onClick={() => choose(p)}>
        {pending === p.id ? "Opening checkout…" : label}
      </Button>
    );
  };

  return (
    <>
      <Meta title="Plans for shelters and owners | Petfinder" description="Simple plans for listing pets. Free for adopters, always." />
      <PageHeader
        title="Simple plans,"
        highlight="no surprises"
        crumbs={[{ label: "Plans" }]}
        subtitle="Free for adopters, always. Shelters and owners start free with 3 listings and upgrade only when they need more."
      >
        <Box role="radiogroup" aria-label="Billing cycle" sx={{ display: "inline-flex", p: 0.5, borderRadius: 999, bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
          {(["month", "year"] as Cycle[]).map((c) => (
            <Box
              key={c}
              component="button"
              type="button"
              role="radio"
              aria-checked={cycle === c}
              onClick={() => setCycle(c)}
              sx={{
                border: 0,
                cursor: "pointer",
                px: 2.5,
                py: 1,
                borderRadius: 999,
                font: "inherit",
                fontWeight: 700,
                fontSize: 14,
                color: cycle === c ? "background.default" : "text.secondary",
                bgcolor: cycle === c ? "text.primary" : "transparent",
                "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
              }}
            >
              {c === "month" ? "Monthly" : "Yearly · 2 months free"}
            </Box>
          ))}
        </Box>
      </PageHeader>

      <Container sx={{ py: { xs: 5, md: 8 } }}>
        {offline && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
            Showing preview plans while the billing service is offline.
          </Alert>
        )}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3, alignItems: "stretch" }}>
          {isLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={520} sx={{ borderRadius: "var(--pf-radius-card)" }} />)}
          {plans.map((p) => {
            const popular = p.code === "pro";
            const price = p.price[cycle];
            return (
              <Box
                key={p.id}
                sx={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  p: { xs: 3, md: 4 },
                  borderRadius: "var(--pf-radius-card)",
                  border: popular ? "2px solid" : "1px solid",
                  borderColor: popular ? "secondary.main" : "divider",
                  bgcolor: "background.paper",
                  boxShadow: popular ? "var(--pf-shadow)" : "none",
                }}
              >
                {popular && <Chip label="Most popular" color="secondary" size="small" sx={{ position: "absolute", top: -12, left: 32, fontWeight: 700 }} />}
                <Typography variant="h3" component="h2" sx={{ fontSize: 32 }}>
                  {p.name}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5, minHeight: 48 }}>
                  {p.description || blurbs[p.code] || ""}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, my: 2.5 }}>
                  <Typography sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600, fontSize: 52, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{formatMoney(price, p.currency)}</Typography>
                  <Typography color="text.secondary">{price === 0 ? "forever" : cycle === "month" ? "per month" : "per year"}</Typography>
                </Box>

                <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1.5 }}>
                  <Row label="Active listings" value={p.limits.listings} />
                  <Row label="Photos & videos per listing" value={p.limits.mediaPerListing} />
                  <Row label="Featured slots" value={p.limits.featured || "–"} />
                  <Row label="Team members" value={p.limits.members} />
                </Box>
                <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 2, display: "grid", gap: 0.75, flex: 1, alignContent: "start" }}>
                  {(extras[p.code] ?? (p.limits.analytics ? ["Analytics dashboard"] : [])).map((x) => (
                    <Typography component="li" key={x} sx={{ fontSize: 15, color: "text.secondary", "&::before": { content: '"✓"', color: "primary.main", fontWeight: 800, mr: 1 } }}>
                      {x}
                    </Typography>
                  ))}
                </Box>
                {cta(p, popular)}
              </Box>
            );
          })}
        </Box>

        <Typography color="text.secondary" sx={{ textAlign: "center", mt: 3, fontSize: 14 }}>
          Prices in {plans[0]?.currency ?? "USD"}. Taxes may apply. Cancel any time.
        </Typography>

        <Box sx={{ maxWidth: 780, mx: "auto", mt: { xs: 7, md: 10 } }}>
          <Typography variant="h2" sx={{ fontSize: { xs: "2rem", md: "2.6rem" }, textAlign: "center", mb: 3, "& em": { color: "secondary.main" } }}>
            Questions, <em>answered</em>
          </Typography>
          {faqs.map((f) => (
            <Accordion key={f.q} disableGutters elevation={0} sx={{ bgcolor: "transparent", borderBottom: "1px solid", borderColor: "divider", "&::before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 17 }}>{f.q}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {f.a}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </>
  );
};

export default PricingPage;
