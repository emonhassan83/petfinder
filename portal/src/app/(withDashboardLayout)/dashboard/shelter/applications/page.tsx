"use client";

import { useState } from "react";
import { Alert, Box, Button, Card, Chip, Typography } from "@mui/material";
import QueryState from "@/components/Dashboard/Common/QueryState";
import ReasonDialog from "@/components/Shared/ReasonDialog";
import { useDecideApplicationMutation, useDisputeApplicationMutation, useGetShelterInboxQuery } from "@/redux/api/inboxApi";
import { fmtDate, runMutation } from "@/utils/dashboardHelpers";

const color: Record<string, "warning" | "success" | "error" | "primary" | "default"> = {
  PENDING: "warning",
  APPROVED: "success",
  COMPLETED: "primary",
  REJECTED: "error",
  WITHDRAWN: "default",
};

const FILTERS = [
  ["PENDING", "Pending"],
  ["APPROVED", "Approved"],
  ["COMPLETED", "Completed"],
  ["REJECTED", "Rejected"],
  ["WITHDRAWN", "Withdrawn"],
  ["", "All"],
] as const;

const ApplicationsPage = () => {
  const [filter, setFilter] = useState<string>("PENDING");
  const [dialog, setDialog] = useState<{ kind: "reject" | "dispute"; app: any } | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const { data, isLoading, error } = useGetShelterInboxQuery({});
  const [decide, { isLoading: saving }] = useDecideApplicationMutation();
  const [dispute] = useDisputeApplicationMutation();

  const all: any[] = data?.items ?? [];
  const list = all.filter((a) => !filter || a.status === filter);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Applications
      </Typography>
      <Box role="radiogroup" aria-label="Filter by status" sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
        {FILTERS.map(([v, l]) => (
          <Chip
            key={l}
            role="radio"
            aria-checked={filter === v}
            label={v ? `${l} (${all.filter((a) => a.status === v).length})` : l}
            clickable
            onClick={() => setFilter(v)}
            color={filter === v ? "primary" : "default"}
            variant={filter === v ? "filled" : "outlined"}
          />
        ))}
      </Box>
      <QueryState isLoading={isLoading} error={error}>
        <Box sx={{ display: "grid", gap: 2, maxWidth: 860 }}>
          {list.length === 0 && <Typography color="text.secondary">No applications here.</Typography>}
          {list.map((a) => (
            <Card key={a.id} sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ minWidth: 220, flex: 1 }}>
                  <Typography fontWeight={600}>
                    {a.user?.name ?? "Applicant"} <Typography component="span" color="text.secondary">for {a.pet?.name}</Typography>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ my: 0.5 }}>
                    {a.petOwnershipExperience}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Submitted {fmtDate(a.createdAt)} · {a.user?.email}
                    {a.user?.contactNumber ? ` · ${a.user.contactNumber}` : ""}
                  </Typography>
                  {a.decisionNote && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      Decision note: {a.decisionNote}
                    </Typography>
                  )}
                  {a.isDisputed && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      Disputed: {a.disputeReason}
                    </Alert>
                  )}
                  {open === a.id && (
                    <Box sx={{ mt: 1.5, display: "grid", gap: 0.5 }}>
                      <Typography variant="body2">Pets at home: {a.petsHousehold}</Typography>
                      <Typography variant="body2">Pets neutered: {a.petsNeutered}</Typography>
                      <Typography variant="body2">Secure outdoor area: {a.secureOutdoorArea}</Typography>
                      <Typography variant="body2">Where the pet sleeps: {a.animalSleep}</Typography>
                      <Typography variant="body2">Left alone for long periods: {a.animalAlonePeriodsTime}</Typography>
                      <Typography variant="body2">Support available: {a.detailsSupport}</Typography>
                    </Box>
                  )}
                  <Button size="small" variant="text" color="inherit" sx={{ mt: 0.5, px: 0 }} onClick={() => setOpen(open === a.id ? null : a.id)}>
                    {open === a.id ? "Hide answers" : "View answers"}
                  </Button>
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                  <Chip size="small" label={a.status} color={color[a.status] ?? "default"} />
                  {a.status === "PENDING" && (
                    <>
                      <Button size="small" disabled={saving} onClick={() => runMutation(decide({ id: a.id, status: "APPROVED" }), "Approved. Other pending applications for this pet were declined.")}>
                        Approve
                      </Button>
                      <Button size="small" color="inherit" variant="outlined" onClick={() => setDialog({ kind: "reject", app: a })}>
                        Reject
                      </Button>
                    </>
                  )}
                  {a.status === "APPROVED" && (
                    <>
                      <Button size="small" disabled={saving} onClick={() => runMutation(decide({ id: a.id, status: "COMPLETED" }), "Adoption completed.")}>
                        Mark completed
                      </Button>
                      <Button size="small" color="inherit" variant="outlined" onClick={() => setDialog({ kind: "reject", app: a })}>
                        Reject
                      </Button>
                    </>
                  )}
                  {!a.isDisputed && (a.status === "APPROVED" || a.status === "COMPLETED") && (
                    <Button size="small" color="inherit" variant="text" onClick={() => setDialog({ kind: "dispute", app: a })}>
                      Dispute
                    </Button>
                  )}
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      </QueryState>

      <ReasonDialog
        open={!!dialog}
        title={dialog?.kind === "dispute" ? "Report a problem with this adoption" : "Reject application"}
        onClose={() => setDialog(null)}
        onConfirm={async (reason) => {
          if (!dialog) return;
          const r =
            dialog.kind === "dispute"
              ? await runMutation(dispute({ id: dialog.app.id, reason }), "Dispute sent to the moderators.")
              : await runMutation(decide({ id: dialog.app.id, status: "REJECTED", decisionNote: reason }), "Application rejected.");
          if (r.ok) setDialog(null);
        }}
      />
    </Box>
  );
};

export default ApplicationsPage;
