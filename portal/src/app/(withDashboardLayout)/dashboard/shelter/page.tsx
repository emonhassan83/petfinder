"use client";

import { useState } from "react";
import { Alert, Box, Button, Card, Chip, Grid, IconButton, Link as MuiLink, MenuItem, TextField, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Link from "next/link";
import LineChart from "../admin/components/LineChart";
import QueryState from "@/components/Dashboard/Common/QueryState";
import { useGetListingMetaQuery } from "@/redux/api/metaApi";
import { useCreateShelterMutation, useDeleteShelterDocumentMutation, useGetMyShelterQuery, useUploadShelterDocumentMutation } from "@/redux/api/shelterDashboardApi";
import { useGetLookupsQuery } from "@/redux/api/lookupAdminApi";
import { runMutation } from "@/utils/dashboardHelpers";
import { toast } from "sonner";

const MAX_DOC_MB = 8;

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

//* First-run: an owner or shelter without a profile creates one (goes to admin verification)
const Onboarding = () => {
  const [create, { isLoading }] = useCreateShelterMutation();
  const locations = useGetLookupsQuery({ kind: "locations" });
  const [form, setForm] = useState({ name: "", description: "", email: "", phone: "", address: "", locationId: "" });
  const set = (k: keyof typeof form) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    const body: Record<string, string> = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v.trim()) body[k] = v.trim();
    });
    runMutation(create(body), "Profile created. An admin will review it shortly.");
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Set up your profile
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Tell adopters who you are. After you save, you can upload documents so an admin can verify you and add the Verified badge.
      </Typography>
      <Card sx={{ p: 3, maxWidth: 640 }}>
        <Box sx={{ display: "grid", gap: 2 }}>
          <TextField label="Shelter or owner name" value={form.name} onChange={set("name")} required helperText="At least 2 characters" />
          <TextField label="About" multiline minRows={3} value={form.description} onChange={set("description")} />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField label="Contact email" type="email" value={form.email} onChange={set("email")} />
            <TextField label="Phone" value={form.phone} onChange={set("phone")} />
          </Box>
          <TextField label="Address" value={form.address} onChange={set("address")} />
          <TextField select label="Location" value={form.locationId} onChange={set("locationId")}>
            {(locations.data ?? []).map((l: any) => (
              <MenuItem key={l.id} value={l.id}>
                {l.name}
              </MenuItem>
            ))}
          </TextField>
          <Button disabled={isLoading || form.name.trim().length < 2} onClick={submit} sx={{ justifySelf: "start" }}>
            Create profile
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

const VerificationBanner = ({ shelter }: { shelter: any }) => {
  const [upload, { isLoading: uploading }] = useUploadShelterDocumentMutation();
  const [remove] = useDeleteShelterDocumentMutation();
  const docs: any[] = shelter.documents ?? [];
  const status: string = shelter.verificationStatus;

  const onFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (file.size > MAX_DOC_MB * 1024 * 1024) return toast.error(`Documents must be under ${MAX_DOC_MB} MB.`);
    await runMutation(upload({ file, name: file.name.slice(0, 120) }), "Document uploaded.");
  };

  return (
    <Box sx={{ mb: 3 }}>
      {status === "VERIFIED" && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Verified. The badge shows on your listings and profile.
        </Alert>
      )}
      {status === "PENDING" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Verification pending: an admin is reviewing your profile. You can create listings now, but the Verified badge appears only once approved.
          {docs.length === 0 && " Uploading a registration certificate or ID speeds this up."}
        </Alert>
      )}
      {status === "REJECTED" && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Verification was not approved{shelter.verificationNote ? `: ${shelter.verificationNote}` : "."} Your published listings are paused. Upload updated documents and an admin will review them again.
        </Alert>
      )}
      {status !== "VERIFIED" && (
        <Card sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Verification documents ({docs.length}/10)
          </Typography>
          {docs.map((d) => (
            <Box key={d.id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.25 }}>
              <MuiLink href={d.url} target="_blank" rel="noopener noreferrer" variant="body2">
                {d.name}
              </MuiLink>
              <IconButton size="small" aria-label={`Remove ${d.name}`} onClick={() => runMutation(remove(d.id), "Document removed.")}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button component="label" size="small" variant="outlined" sx={{ mt: 1 }} disabled={uploading || docs.length >= 10}>
            {uploading ? "Uploading..." : "Upload document"}
            <input hidden type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => { onFile(e.target.files); e.target.value = ""; }} />
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            PDF, JPG, PNG or WebP up to {MAX_DOC_MB} MB.
          </Typography>
        </Card>
      )}
    </Box>
  );
};

const ShelterOverviewPage = () => {
  const shelter = useGetMyShelterQuery({});
  const meta = useGetListingMetaQuery({});

  //* 404 = no profile yet
  if (shelter.error && (shelter.error as any).status === 404) return <Onboarding />;

  const o = meta.data?.overview;
  const shelterData = shelter.data;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Overview
      </Typography>
      {shelterData && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {shelterData.name} <Chip size="small" variant="outlined" label={shelterData.type === "OWNER" ? "Individual owner" : "Shelter"} sx={{ ml: 0.5 }} />
        </Typography>
      )}
      <QueryState isLoading={shelter.isLoading} error={shelter.error}>
        {shelterData && <VerificationBanner shelter={shelterData} />}
      </QueryState>

      <QueryState isLoading={meta.isLoading} error={meta.error}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Kpi label="Active listings" value={o?.listings?.active ?? 0} />
          </Grid>
          <Grid item xs={6} md={3}>
            <Kpi label="Total views" value={o?.views ?? 0} />
          </Grid>
          <Grid item xs={6} md={3}>
            <Kpi label="Pending applications" value={o?.applications?.pending ?? 0} />
          </Grid>
          <Grid item xs={6} md={3}>
            <Kpi label="Adoptions" value={o?.adoptions ?? 0} />
          </Grid>
        </Grid>

        {meta.data?.analyticsEnabled ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Applications and adoptions per month
                </Typography>
                <Box sx={{ height: 280 }}>
                  <LineChart
                    series={[
                      { label: "Applications", data: meta.data.monthly?.applications ?? [] },
                      { label: "Adoptions", data: meta.data.monthly?.adoptions ?? [] },
                    ]}
                  />
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3, height: "100%" }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Top listings
                </Typography>
                {(meta.data.topPets ?? []).length === 0 && <Typography color="text.secondary">No data yet.</Typography>}
                {(meta.data.topPets ?? []).map((p: any) => (
                  <Box key={p.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}>
                    <Typography variant="body2">{p.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {p.views} views · {p.applications ?? 0} applications
                    </Typography>
                  </Box>
                ))}
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Listing analytics
            </Typography>
            <Typography color="text.secondary">
              Monthly trends and top listings are part of the Pro and Premium plans.{" "}
              <Link href="/dashboard/shelter/billing" style={{ textDecoration: "underline" }}>
                See plans
              </Link>
            </Typography>
          </Card>
        )}
      </QueryState>
    </Box>
  );
};

export default ShelterOverviewPage;
