"use client";

import { Alert, Box, Card, Grid, Typography } from "@mui/material";
import BarChart from "../admin/components/BarChart";
import { mockApplications, mockListings, mockMonthly } from "@/mock/shelter";

const Kpi = ({ label, value }: { label: string; value: number | string }) => (
  <Card sx={{ p: 2.5 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h4" sx={{ mt: 0.5 }}>
      {value}
    </Typography>
  </Card>
);

const ShelterOverviewPage = () => {
  const active = mockListings.filter((l) => l.status === "PUBLISHED").length;
  const views = mockListings.reduce((s, l) => s + l.views, 0);
  const pending = mockApplications.filter((a) => a.status === "PENDING").length;
  const adopted = mockApplications.filter((a) => a.status === "APPROVED").length;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Overview
      </Typography>
      <Alert severity="warning" sx={{ mb: 3 }}>
        Verification pending: an admin is reviewing your documents. You can create listings now, but the Verified badge
        appears only once approved.
      </Alert>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Kpi label="Active listings" value={active} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Kpi label="Total views" value={views} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Kpi label="Pending applications" value={pending} />
        </Grid>
        <Grid item xs={6} md={3}>
          <Kpi label="Adoptions" value={adopted} />
        </Grid>
      </Grid>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listing views per month
        </Typography>
        <Box sx={{ height: 280 }}>
          <BarChart data={mockMonthly} />
        </Box>
      </Card>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview data. Live analytics arrive with the backend.
      </Typography>
    </Box>
  );
};

export default ShelterOverviewPage;
