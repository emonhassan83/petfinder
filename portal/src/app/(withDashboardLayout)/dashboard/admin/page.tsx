"use client";

import { useAdminGetUsersQuery, useGetMyProfileQuery } from "@/redux/api/userApi";
import { Typography, Box, Paper, Grid, Card } from "@mui/material";
import UsersTableSection from "./components/UserTableData";
import { useGetAdminMetaQuery, useGetMetaDtaQuery } from "@/redux/api/metaApi";
import PieChart from "./components/PieChart";
import BarChart from "./components/BarChart";
import LineChart from "./components/LineChart";
import ProfileSection from "./components/ProfileSection";
import FeaturePets from "./components/PopularPets";
import LoadingPage from "@/components/Shared/Loader/LoadingPage";
import QueryState from "@/components/Dashboard/Common/QueryState";
import Meta from "@/components/Meta/MetaData";
import { money } from "@/utils/dashboardHelpers";

const Kpi = ({ label, value }: { label: string; value: string | number }) => (
  <Card sx={{ p: 2.5 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h4" sx={{ mt: 0.5 }}>
      {value}
    </Typography>
  </Card>
);

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Paper elevation={2} sx={{ p: 2, borderRadius: "8px", height: "100%" }}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Box sx={{ height: 280 }}>{children}</Box>
  </Paper>
);

const AdminPage = () => {
  const { data: legacy, isLoading: isLegacyLoading } = useGetMetaDtaQuery({});
  const { data: meta, isLoading: isMetaLoading, error: metaError } = useGetAdminMetaQuery({});
  const { data: profile, isLoading: isProfileLoading } = useGetMyProfileQuery({});
  const { data: users } = useAdminGetUsersQuery({ limit: 5, sortBy: "createdAt", sortOrder: "desc" });

  if (isLegacyLoading || isMetaLoading || isProfileLoading) return <LoadingPage />;

  const revenueRows: any[] = meta?.monthly?.revenue ?? [];
  const chartCurrency: string = revenueRows[0]?.currency ?? "USD";
  //* Rows are major units per (month, currency); the chart shows one currency so amounts are never mixed
  const revenue = revenueRows.filter((r) => r.currency === chartCurrency).map((r) => ({ month: r.month, count: r.amount }));
  const revenueByCurrency: any[] = legacy?.revenueByCurrency ?? [];
  const admins = (meta?.usersByRole ?? []).filter((r: any) => r.role === "ADMIN" || r.role === "SUPER_ADMIN").reduce((s: number, r: any) => s + r.count, 0);

  return (
    <>
      <Meta
        title="Dashboard | Petfinder - Pet Adoption Platform & Management System"
        description="Admin dashboard: platform analytics, users, adoptions and revenue."
      />

      <ProfileSection data={profile} />

      <QueryState error={metaError}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Kpi label="Users" value={legacy?.userCount ?? 0} />
          </Grid>
          <Grid item xs={6} md={3}>
            <Kpi label="Admins" value={admins} />
          </Grid>
          <Grid item xs={6} md={3}>
            <Kpi label="Pets" value={legacy?.petCount ?? 0} />
          </Grid>
          <Grid item xs={6} md={3}>
            <Kpi label="Applications" value={meta?.adoptionFunnel?.submitted ?? 0} />
          </Grid>
          <Grid item xs={6} md={3}>
            <Kpi label="Adoptions completed" value={meta?.adoptionFunnel?.completed ?? 0} />
          </Grid>
          <Grid item xs={6} md={3}>
            <Kpi label="Blogs" value={legacy?.blogCount ?? 0} />
          </Grid>
          <Grid item xs={6} md={3}>
            <Kpi label="Donations" value={legacy?.donationCount ?? 0} />
          </Grid>
          <Grid item xs={6} md={3}>
            <Kpi
              label="Revenue"
              value={revenueByCurrency.length ? revenueByCurrency.map((r) => money(Math.round(r.amount * 100), r.currency)).join(" · ") : money(0)}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <ChartCard title="Users and applications per month">
              <LineChart
                series={[
                  { label: "New users", data: meta?.monthly?.users ?? [] },
                  { label: "Applications", data: meta?.monthly?.adoptionRequests ?? [] },
                ]}
              />
            </ChartCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ChartCard title={`Revenue per month (paid, ${chartCurrency})`}>
              <BarChart data={revenue} integer={false} label={`Revenue (${chartCurrency})`} />
            </ChartCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <ChartCard title="Users by role">
              <PieChart data={meta?.usersByRole} labelKey="role" />
            </ChartCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <ChartCard title="Pets by status">
              <PieChart data={meta?.petsByStatus} />
            </ChartCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <ChartCard title="Adoption funnel">
              <PieChart
                data={Object.entries(meta?.adoptionFunnel ?? {})
                  .filter(([k]) => k !== "submitted")
                  .map(([status, count]) => ({ status, count }))}
              />
            </ChartCard>
          </Grid>
        </Grid>
      </QueryState>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 4 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" gutterBottom>
            Newest users
          </Typography>
          <UsersTableSection data={users?.items} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" gutterBottom>
            Recent pets
          </Typography>
          <FeaturePets />
        </Box>
      </Box>
    </>
  );
};

export default AdminPage;
