"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Box, Button, Card, Chip, Grid, LinearProgress, Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import QueryState from "@/components/Dashboard/Common/QueryState";
import { useCreateCheckoutSessionMutation, useCreatePortalSessionMutation, useGetMySubscriptionQuery, useGetPlansQuery } from "@/redux/api/billingApi";
import { errorMessage, fmtDate, money } from "@/utils/dashboardHelpers";
import { toast } from "sonner";

const LIVE = ["ACTIVE", "TRIALING", "PAST_DUE"];
const POLL_MS = 3000;
const POLL_MAX = 15;

const Meter = ({ label, used, limit }: { label: string; used: number; limit: number }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="body2" color="text.secondary">
      {label}: {used} of {limit}
    </Typography>
    <LinearProgress variant="determinate" value={limit ? Math.min(100, (used / limit) * 100) : 0} sx={{ mt: 0.5, height: 8, borderRadius: 4 }} />
  </Box>
);

const BillingContent = () => {
  const params = useSearchParams();
  const returned = params.get("status"); // success | cancelled (set by Stripe return URLs; never trusted)
  const [interval, setInterval] = useState<"MONTH" | "YEAR">("MONTH");
  const [paymentsOff, setPaymentsOff] = useState(false);

  const plans = useGetPlansQuery({});
  const sub = useGetMySubscriptionQuery({}, { pollingInterval: 0 });
  const [checkout, { isLoading: starting }] = useCreateCheckoutSessionMutation();
  const [portal, { isLoading: opening }] = useCreatePortalSessionMutation();

  //* After returning from Stripe, poll the account until the webhook has applied the plan. The redirect itself proves nothing.
  const baseline = useRef<string | null>(null);
  const [polls, setPolls] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => {
    if (returned !== "success" || confirmed) return;
    if (baseline.current === null && sub.data) baseline.current = sub.data.plan?.code ?? "free";
    if (!sub.data) return;
    if (sub.data.subscription && LIVE.includes(sub.data.subscription.status) && sub.data.plan?.code !== baseline.current) {
      setConfirmed(true);
      return;
    }
    if (polls >= POLL_MAX) return;
    const t = window.setTimeout(() => {
      setPolls((p) => p + 1);
      sub.refetch();
    }, POLL_MS);
    return () => window.clearTimeout(t);
  }, [returned, confirmed, polls, sub.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const me = sub.data;
  const currentCode: string = me?.plan?.code ?? "free";
  const live = !!me?.subscription && LIVE.includes(me.subscription.status) && !me.subscription.isManualOverride;
  const canManage = me?.canManageBilling !== false;
  const noPayments = paymentsOff || me?.paymentsEnabled === false;

  const redirect = async (p: Promise<any>) => {
    const res: any = await p;
    if (res?.error) {
      if (res.error.status === 503) setPaymentsOff(true);
      toast.error(errorMessage(res));
      return;
    }
    const url = res?.data?.url;
    if (url) window.location.href = url;
    else toast.error("Could not start the payment session.");
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Plan &amp; billing
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Choose the plan that fits your rescue. Yearly billing saves about two months.
      </Typography>

      {returned === "success" && !confirmed && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {polls < POLL_MAX ? "Confirming your payment with Stripe. This can take a few seconds..." : "We have not received the payment confirmation yet. Refresh in a minute; your plan updates as soon as it arrives."}
        </Alert>
      )}
      {returned === "success" && confirmed && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Payment confirmed. You are now on the {me?.plan?.name} plan.
        </Alert>
      )}
      {returned === "cancelled" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Checkout was cancelled. Nothing was charged.
        </Alert>
      )}
      {noPayments && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Online payments are not configured yet, so plans cannot be changed here. An administrator can assign a plan manually.
        </Alert>
      )}
      {me?.subscription?.status === "PAST_DUE" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Your last payment failed. Update your payment method under Manage billing to keep your plan.
        </Alert>
      )}

      <QueryState isLoading={plans.isLoading || sub.isLoading} error={plans.error || sub.error}>
        {me && (
          <Card sx={{ p: 2.5, mb: 3, maxWidth: 560 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Current usage: {me.plan?.name}
              {me.subscription?.isManualOverride && <Chip size="small" label="assigned by admin" sx={{ ml: 1 }} />}
            </Typography>
            {me.subscription?.currentPeriodEnd && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {me.subscription.cancelAtPeriodEnd ? "Ends" : "Renews"} on {fmtDate(me.subscription.currentPeriodEnd)}
                {me.subscription.status !== "ACTIVE" ? ` (${me.subscription.status.replace("_", " ").toLowerCase()})` : ""}
              </Typography>
            )}
            <Meter label="Active listings" used={me.usage?.listings ?? 0} limit={me.limits?.listings ?? 0} />
            <Meter label="Featured" used={me.usage?.featured ?? 0} limit={me.limits?.featured ?? 0} />
            <Meter label="Team seats" used={me.usage?.members ?? 0} limit={me.limits?.members ?? 0} />
          </Card>
        )}

        <ToggleButtonGroup exclusive value={interval} onChange={(_, v) => v && setInterval(v)} size="small" sx={{ mb: 3 }}>
          <ToggleButton value="MONTH">Monthly</ToggleButton>
          <ToggleButton value="YEAR">Yearly</ToggleButton>
        </ToggleButtonGroup>

        <Grid container spacing={3}>
          {(plans.data ?? []).map((p: any) => {
            const current = p.code === currentCode;
            const price = interval === "MONTH" ? p.price.month : p.price.year;
            const purchasable = interval === "MONTH" ? p.purchasable.month : p.purchasable.year;
            return (
              <Grid item xs={12} md={4} key={p.id}>
                <Card sx={{ p: 3, height: "100%", borderColor: current ? "primary.main" : undefined, borderWidth: current ? 2 : 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h5">{p.name}</Typography>
                    {current && <Chip size="small" color="primary" label="Current" />}
                  </Box>
                  <Typography variant="h4" sx={{ my: 2 }}>
                    {money(price, p.currency)}
                    <Typography component="span" color="text.secondary">
                      {price === 0 ? "" : interval === "MONTH" ? " /mo" : " /yr"}
                    </Typography>
                  </Typography>
                  {[
                    `${p.limits.listings} active listings`,
                    `${p.limits.mediaPerListing} photos/videos per listing`,
                    `${p.limits.featured} featured slots`,
                    `${p.limits.members} team member${p.limits.members > 1 ? "s" : ""}`,
                    ...(p.limits.analytics ? ["Listing analytics"] : []),
                  ].map((f) => (
                    <Typography key={f} variant="body2" sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <CheckIcon fontSize="small" color="primary" /> {f}
                    </Typography>
                  ))}
                  {p.price.month > 0 && canManage && (
                    <Button
                      fullWidth
                      sx={{ mt: 3 }}
                      disabled={current || starting || opening || noPayments || (!live && !purchasable)}
                      onClick={() => (live ? redirect(portal({}).then((r) => r)) : redirect(checkout({ planId: p.id, interval })))}
                    >
                      {current ? "Your plan" : live ? "Change in billing portal" : purchasable ? "Upgrade" : "Not available yet"}
                    </Button>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {canManage && (
          <Button variant="outlined" sx={{ mt: 3 }} disabled={opening || noPayments || !me?.hasBillingAccount} onClick={() => redirect(portal({}))}>
            Manage billing
          </Button>
        )}

        {(me?.payments ?? []).length > 0 && (
          <Card sx={{ mt: 4, overflowX: "auto" }}>
            <Typography variant="h6" sx={{ p: 2 }}>
              Recent payments
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {me.payments.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>{fmtDate(t.paidAt ?? t.createdAt)}</TableCell>
                    <TableCell>{t.description ?? t.type}</TableCell>
                    <TableCell align="right">{money(t.amount, t.currency)}</TableCell>
                    <TableCell>{t.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </QueryState>
    </Box>
  );
};

const BillingPage = () => (
  <Suspense fallback={null}>
    <BillingContent />
  </Suspense>
);

export default BillingPage;
