"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import QueryState from "@/components/Dashboard/Common/QueryState";
import { useGetMyProfileQuery } from "@/redux/api/userApi";
import {
  useAdminArchivePlanMutation,
  useAdminCreateOverrideMutation,
  useAdminCreatePlanMutation,
  useAdminGetPlansQuery,
  useAdminGetSubscriptionsQuery,
  useAdminGetTransactionsQuery,
  useAdminOverrideSubscriptionMutation,
  useAdminUpdatePlanMutation,
} from "@/redux/api/adminBillingApi";
import { fmtDate, fmtDateTime, money, runMutation } from "@/utils/dashboardHelpers";

const subColor: Record<string, "success" | "warning" | "default" | "error"> = {
  ACTIVE: "success",
  TRIALING: "success",
  PAST_DUE: "warning",
  UNPAID: "error",
  CANCELED: "default",
  INCOMPLETE: "default",
  INCOMPLETE_EXPIRED: "default",
};
const txColor: Record<string, "success" | "error" | "warning" | "default"> = { PAID: "success", FAILED: "error", PENDING: "warning", REFUNDED: "default" };

const emptyPlan = {
  code: "",
  name: "",
  description: "",
  priceMonthly: "0",
  priceYearly: "0",
  currency: "USD",
  maxListings: "3",
  maxMediaPerListing: "5",
  maxFeatured: "0",
  maxMembers: "1",
  analytics: false,
  isActive: true,
  sortOrder: "0",
  stripePriceMonthlyId: "",
  stripePriceYearlyId: "",
  stripeProductId: "",
};

const SubscriptionsPage = () => {
  const [tab, setTab] = useState(0);
  const { data: me } = useGetMyProfileQuery({});
  const isSuper = me?.role === "SUPER_ADMIN";

  const subs = useAdminGetSubscriptionsQuery({ limit: 50, sortBy: "createdAt", sortOrder: "desc" });
  const txs = useAdminGetTransactionsQuery({ limit: 50, sortBy: "createdAt", sortOrder: "desc" });
  const plans = useAdminGetPlansQuery({});

  const [override, { isLoading: overriding }] = useAdminOverrideSubscriptionMutation();
  const [createOverride, { isLoading: creating }] = useAdminCreateOverrideMutation();
  const [createPlan, { isLoading: savingNew }] = useAdminCreatePlanMutation();
  const [updatePlan, { isLoading: savingPlan }] = useAdminUpdatePlanMutation();
  const [archivePlan] = useAdminArchivePlanMutation();

  //* Override dialog: edit an existing subscription row (target.id) or assign by user id (target.userId)
  const [target, setTarget] = useState<any>(null);
  const [planId, setPlanId] = useState("");
  const [userId, setUserId] = useState("");
  const [note, setNote] = useState("");
  const [planForm, setPlanForm] = useState<any>(null);

  const planList: any[] = plans.data ?? [];

  const openOverride = (t: any) => {
    setTarget(t);
    setPlanId(t.planId ?? planList.find((p) => p.isActive)?.id ?? "");
    setUserId("");
    setNote("");
  };

  const submitOverride = async () => {
    const isNew = !target.id;
    const r = isNew
      ? await runMutation(createOverride({ userId: userId.trim(), planId, note: note.trim() }), "Plan assigned.")
      : await runMutation(override({ id: target.id, planId, note: note.trim() }), "Plan overridden.");
    if (r.ok) setTarget(null);
  };

  const clearOverride = async () => {
    const r = await runMutation(override({ id: target.id, clear: true, note: note.trim() }), "Override cleared.");
    if (r.ok) setTarget(null);
  };

  const openPlan = (p?: any) =>
    setPlanForm(
      p
        ? {
            id: p.id,
            code: p.code,
            name: p.name,
            description: p.description ?? "",
            priceMonthly: String(p.priceMonthly),
            priceYearly: String(p.priceYearly),
            currency: p.currency,
            maxListings: String(p.maxListings),
            maxMediaPerListing: String(p.maxMediaPerListing),
            maxFeatured: String(p.maxFeatured),
            maxMembers: String(p.maxMembers),
            analytics: p.analytics,
            isActive: p.isActive,
            sortOrder: String(p.sortOrder),
            stripePriceMonthlyId: p.stripePriceMonthlyId ?? "",
            stripePriceYearlyId: p.stripePriceYearlyId ?? "",
            stripeProductId: p.stripeProductId ?? "",
          }
        : { ...emptyPlan }
    );

  const savePlan = async () => {
    const f = planForm;
    const body: any = {
      name: f.name.trim(),
      description: f.description.trim() || null,
      priceMonthly: Number(f.priceMonthly),
      priceYearly: Number(f.priceYearly),
      currency: f.currency.trim() || "USD",
      maxListings: Number(f.maxListings),
      maxMediaPerListing: Number(f.maxMediaPerListing),
      maxFeatured: Number(f.maxFeatured),
      maxMembers: Number(f.maxMembers),
      analytics: f.analytics,
      isActive: f.isActive,
      sortOrder: Number(f.sortOrder),
      stripeProductId: f.stripeProductId.trim() || null,
      stripePriceMonthlyId: f.stripePriceMonthlyId.trim() || null,
      stripePriceYearlyId: f.stripePriceYearlyId.trim() || null,
    };
    const r = f.id
      ? await runMutation(updatePlan({ id: f.id, body }), "Plan updated.")
      : await runMutation(createPlan({ code: f.code.trim().toLowerCase(), ...body }), "Plan created.");
    if (r.ok) setPlanForm(null);
  };

  const setF = (k: string) => (e: any) => setPlanForm({ ...planForm, [k]: e.target.value });

  const noteOk = note.trim().length >= 3;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Subscriptions &amp; payments
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Subscriptions" />
        <Tab label="Transactions" />
        {isSuper && <Tab label="Plans" />}
      </Tabs>

      {tab === 0 && (
        <QueryState isLoading={subs.isLoading} error={subs.error}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Button size="small" variant="outlined" onClick={() => openOverride({})}>
              Assign plan to an account
            </Button>
          </Box>
          <Card sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Account</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Billing</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Period end</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(subs.data?.items ?? []).map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      {s.shelter?.name ?? s.user?.name}
                      <Typography variant="caption" color="text.secondary" display="block">
                        {s.user?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {s.plan?.name} {s.isManualOverride && <Chip size="small" label="manual" sx={{ ml: 0.5 }} />}
                    </TableCell>
                    <TableCell>{s.interval === "YEAR" ? "Yearly" : "Monthly"}</TableCell>
                    <TableCell>
                      <Chip size="small" label={s.status.replace(/_/g, " ")} color={subColor[s.status] ?? "default"} />
                      {s.cancelAtPeriodEnd && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          cancels at period end
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{fmtDate(s.currentPeriodEnd)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => openOverride(s)}>
                        Override
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {(subs.data?.items ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No subscriptions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </QueryState>
      )}

      {tab === 1 && (
        <QueryState isLoading={txs.isLoading} error={txs.error}>
          <Card sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(txs.data?.items ?? []).map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell>{fmtDateTime(t.paidAt ?? t.createdAt)}</TableCell>
                    <TableCell>
                      {t.subscription?.shelter?.name ?? t.user?.name ?? "Guest"}
                      {t.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {t.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{t.type}</TableCell>
                    <TableCell align="right">{money(t.amount, t.currency)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={t.status} color={txColor[t.status] ?? "default"} />
                      {t.failureReason && (
                        <Typography variant="caption" color="error" display="block">
                          {t.failureReason}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(txs.data?.items ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </QueryState>
      )}

      {tab === 2 && isSuper && (
        <QueryState isLoading={plans.isLoading} error={plans.error}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Button size="small" onClick={() => openPlan()}>
              New plan
            </Button>
          </Box>
          <Card sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Plan</TableCell>
                  <TableCell>Monthly</TableCell>
                  <TableCell>Yearly</TableCell>
                  <TableCell>Listings / media / featured / members</TableCell>
                  <TableCell>Subscribers</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {planList.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.name} <Typography component="span" variant="caption" color="text.secondary">({p.code})</Typography>{" "}
                      {!p.isActive && <Chip size="small" label="archived" />}
                    </TableCell>
                    <TableCell>{money(p.priceMonthly, p.currency)}</TableCell>
                    <TableCell>{money(p.priceYearly, p.currency)}</TableCell>
                    <TableCell>
                      {p.maxListings} / {p.maxMediaPerListing} / {p.maxFeatured} / {p.maxMembers}
                      {p.analytics ? " · analytics" : ""}
                    </TableCell>
                    <TableCell>{p._count?.subscriptions ?? 0}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => openPlan(p)}>
                        Edit
                      </Button>{" "}
                      {p.isActive && p.code !== "free" && (
                        <Button size="small" color="inherit" onClick={() => runMutation(archivePlan(p.id), "Plan archived.")}>
                          Archive
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </QueryState>
      )}

      <Dialog open={!!target} onClose={() => setTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>{target?.id ? "Override plan" : "Assign plan to an account"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "8px !important" }}>
          {target?.id ? (
            <Typography variant="body2" color="text.secondary">
              {target.shelter?.name ?? target.user?.name} ({target.user?.email}). Overrides are logged and the account is notified.
            </Typography>
          ) : (
            <TextField label="User id" value={userId} onChange={(e) => setUserId(e.target.value)} helperText="For an account with no subscription row yet." />
          )}
          <TextField select label="Plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
            {planList
              .filter((p) => p.isActive)
              .map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
          </TextField>
          <TextField label="Reason (required)" multiline minRows={2} value={note} onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 500 }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {target?.id && target.isManualOverride && (
            <Button color="inherit" variant="outlined" disabled={!noteOk || overriding} onClick={clearOverride}>
              Clear override
            </Button>
          )}
          <Button variant="text" color="inherit" onClick={() => setTarget(null)}>
            Cancel
          </Button>
          <Button disabled={!noteOk || !planId || overriding || creating || (!target?.id && !userId.trim())} onClick={submitOverride}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!planForm} onClose={() => setPlanForm(null)} fullWidth maxWidth="sm">
        <DialogTitle>{planForm?.id ? "Edit plan" : "New plan"}</DialogTitle>
        {planForm && (
          <DialogContent sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, pt: "8px !important" }}>
            <TextField label="Code" value={planForm.code} onChange={setF("code")} disabled={!!planForm.id} helperText="Lowercase key, fixed after creation" />
            <TextField label="Name" value={planForm.name} onChange={setF("name")} />
            <TextField label="Monthly price (minor units)" type="number" value={planForm.priceMonthly} onChange={setF("priceMonthly")} helperText="1900 = 19.00" />
            <TextField label="Yearly price (minor units)" type="number" value={planForm.priceYearly} onChange={setF("priceYearly")} />
            <TextField label="Currency" value={planForm.currency} onChange={setF("currency")} />
            <TextField label="Sort order" type="number" value={planForm.sortOrder} onChange={setF("sortOrder")} />
            <TextField label="Max listings" type="number" value={planForm.maxListings} onChange={setF("maxListings")} />
            <TextField label="Media per listing" type="number" value={planForm.maxMediaPerListing} onChange={setF("maxMediaPerListing")} />
            <TextField label="Featured slots" type="number" value={planForm.maxFeatured} onChange={setF("maxFeatured")} />
            <TextField label="Team members" type="number" value={planForm.maxMembers} onChange={setF("maxMembers")} />
            <TextField sx={{ gridColumn: "1 / -1" }} label="Description" value={planForm.description} onChange={setF("description")} />
            <TextField label="Stripe product id" value={planForm.stripeProductId} onChange={setF("stripeProductId")} />
            <Box />
            <TextField label="Stripe monthly price id" value={planForm.stripePriceMonthlyId} onChange={setF("stripePriceMonthlyId")} />
            <TextField label="Stripe yearly price id" value={planForm.stripePriceYearlyId} onChange={setF("stripePriceYearlyId")} />
            <FormControlLabel control={<Switch checked={planForm.analytics} onChange={(e) => setPlanForm({ ...planForm, analytics: e.target.checked })} />} label="Analytics" />
            <FormControlLabel control={<Switch checked={planForm.isActive} onChange={(e) => setPlanForm({ ...planForm, isActive: e.target.checked })} />} label="Active" />
            <Alert severity="info" sx={{ gridColumn: "1 / -1" }}>
              A plan is purchasable only when its Stripe price ids are set.
            </Alert>
          </DialogContent>
        )}
        <DialogActions sx={{ p: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setPlanForm(null)}>
            Cancel
          </Button>
          <Button disabled={savingNew || savingPlan || !planForm?.name?.trim() || (!planForm?.id && !planForm?.code?.trim())} onClick={savePlan}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SubscriptionsPage;
