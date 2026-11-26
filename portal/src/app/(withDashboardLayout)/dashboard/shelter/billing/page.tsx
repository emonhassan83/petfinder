"use client";

import { useState } from "react";
import { Box, Button, Card, Chip, Grid, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { toast } from "sonner";
import { mockCurrentPlan, mockPlans } from "@/mock/shelter";

const BillingPage = () => {
  const [cycle, setCycle] = useState<"month" | "year">("month");

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Plan &amp; billing
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Choose the plan that fits your rescue. Yearly billing saves about two months.
      </Typography>
      <ToggleButtonGroup exclusive value={cycle} onChange={(_, v) => v && setCycle(v)} size="small" sx={{ mb: 3 }}>
        <ToggleButton value="month">Monthly</ToggleButton>
        <ToggleButton value="year">Yearly</ToggleButton>
      </ToggleButtonGroup>
      <Grid container spacing={3}>
        {mockPlans.map((p) => {
          const current = p.id === mockCurrentPlan.planId;
          return (
            <Grid item xs={12} md={4} key={p.id}>
              <Card sx={{ p: 3, height: "100%", borderColor: current ? "primary.main" : undefined, borderWidth: current ? 2 : 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h5">{p.name}</Typography>
                  {current && <Chip size="small" color="primary" label="Current" />}
                </Box>
                <Typography variant="h4" sx={{ my: 2 }}>
                  ${p.price[cycle]}
                  <Typography component="span" color="text.secondary">
                    {p.price[cycle] === 0 ? "" : cycle === "month" ? " /mo" : " /yr"}
                  </Typography>
                </Typography>
                {[`${p.listings} active listings`, `${p.media} photos/videos per listing`, `${p.featured} featured slots`, `${p.members} team member${p.members > 1 ? "s" : ""}`].map((f) => (
                  <Typography key={f} variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                    <CheckIcon fontSize="small" color="primary" /> {f}
                  </Typography>
                ))}
                <Button
                  fullWidth
                  sx={{ mt: 3 }}
                  disabled={current}
                  onClick={() => toast.info("Stripe Checkout connects in Phase 3/4.")}
                >
                  {current ? "Your plan" : "Upgrade"}
                </Button>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      <Button variant="outlined" sx={{ mt: 3 }} onClick={() => toast.info("Stripe Customer Portal connects in Phase 3/4.")}>
        Manage billing
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview only. Prices and limits are placeholders pending your confirmation.
      </Typography>
    </Box>
  );
};

export default BillingPage;
