"use client";

import { useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Container, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Link from "next/link";
import Meta from "@/components/Meta/MetaData";
import PageHeader from "@/components/Shared/PageHeader";
import { mockPlans } from "@/mock/shelter";

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

//* Public plans page for owners and shelters (Pawvelle "transparent pricing" menu). Checkout arrives with Stripe in Phase 3d.
const PricingPage = () => {
  const [cycle, setCycle] = useState<Cycle>("month");

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
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3, alignItems: "stretch" }}>
          {mockPlans.map((p) => {
            const popular = p.id === "pro";
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
                  {blurbs[p.id]}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, my: 2.5 }}>
                  <Typography sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600, fontSize: 52, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>${price}</Typography>
                  <Typography color="text.secondary">{price === 0 ? "forever" : cycle === "month" ? "per month" : "per year"}</Typography>
                </Box>

                <Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 1.5 }}>
                  <Row label="Active listings" value={p.listings} />
                  <Row label="Photos & videos per listing" value={p.media} />
                  <Row label="Featured slots" value={p.featured || "–"} />
                  <Row label="Team members" value={p.members} />
                </Box>
                <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, mt: 2, display: "grid", gap: 0.75, flex: 1, alignContent: "start" }}>
                  {extras[p.id].map((x) => (
                    <Typography component="li" key={x} sx={{ fontSize: 15, color: "text.secondary", "&::before": { content: '"✓"', color: "primary.main", fontWeight: 800, mr: 1 } }}>
                      {x}
                    </Typography>
                  ))}
                </Box>
                <Button component={Link} href="/register" variant={popular ? "contained" : "outlined"} size="large" fullWidth sx={{ mt: 3 }}>
                  {price === 0 ? "Start free" : `Choose ${p.name}`}
                </Button>
              </Box>
            );
          })}
        </Box>

        <Typography color="text.secondary" sx={{ textAlign: "center", mt: 3, fontSize: 14 }}>
          Prices in USD. Taxes may apply. Cancel any time.
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
