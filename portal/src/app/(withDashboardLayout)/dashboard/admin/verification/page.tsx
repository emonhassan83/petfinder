"use client";

import { useState } from "react";
import { Box, Button, Card, Chip, Link as MuiLink, Typography } from "@mui/material";
import ReasonDialog from "@/components/Shared/ReasonDialog";
import QueryState from "@/components/Dashboard/Common/QueryState";
import { useAdminGetSheltersQuery, useAdminVerifyShelterMutation } from "@/redux/api/adminApi";
import { fmtDate, runMutation } from "@/utils/dashboardHelpers";

const color = { PENDING: "warning", VERIFIED: "success", REJECTED: "error" } as const;
type Status = keyof typeof color;

const FILTERS: Status[] = ["PENDING", "VERIFIED", "REJECTED"];

const VerificationPage = () => {
  const [status, setStatus] = useState<Status>("PENDING");
  const [rejecting, setRejecting] = useState<any>(null);
  const { data, isLoading, error } = useAdminGetSheltersQuery({ status });
  const [verify, { isLoading: saving }] = useAdminVerifyShelterMutation();

  const items: any[] = data?.items ?? [];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Shelter &amp; owner verification
      </Typography>
      <Box role="radiogroup" aria-label="Filter by status" sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
        {FILTERS.map((f) => (
          <Chip
            key={f}
            role="radio"
            aria-checked={status === f}
            label={f}
            clickable
            onClick={() => setStatus(f)}
            color={status === f ? "primary" : "default"}
            variant={status === f ? "filled" : "outlined"}
          />
        ))}
      </Box>
      <QueryState isLoading={isLoading} error={error}>
        <Box sx={{ display: "grid", gap: 2, maxWidth: 820 }}>
          {items.length === 0 && <Typography color="text.secondary">Nothing here.</Typography>}
          {items.map((v) => (
            <Card key={v.id} sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                  <Typography fontWeight={600}>
                    {v.name} <Chip size="small" label={v.type} variant="outlined" sx={{ ml: 1 }} />
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {v.owner?.email ?? v.email} · submitted {fmtDate(v.createdAt)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }} component="div">
                    Documents:{" "}
                    {v.documents?.length ? (
                      v.documents.map((d: any, i: number) => (
                        <span key={d.id}>
                          {i > 0 && ", "}
                          <MuiLink href={d.url} target="_blank" rel="noopener noreferrer">
                            {d.name}
                          </MuiLink>
                        </span>
                      ))
                    ) : (
                      <em>none uploaded</em>
                    )}
                  </Typography>
                  {v.verificationNote && (
                    <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                      Note: {v.verificationNote}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Chip size="small" label={v.verificationStatus} color={color[v.verificationStatus as Status]} />
                  {v.verificationStatus !== "VERIFIED" && (
                    <Button size="small" disabled={saving} onClick={() => runMutation(verify({ id: v.id, status: "VERIFIED" }), `${v.name} verified.`)}>
                      Verify
                    </Button>
                  )}
                  {v.verificationStatus !== "REJECTED" && (
                    <Button size="small" color="inherit" variant="outlined" onClick={() => setRejecting(v)}>
                      Reject
                    </Button>
                  )}
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      </QueryState>
      <ReasonDialog
        open={!!rejecting}
        title="Reject verification"
        onClose={() => setRejecting(null)}
        onConfirm={async (note) => {
          const r = await runMutation(verify({ id: rejecting.id, status: "REJECTED", note }), "Rejected. The shelter was notified and its listings paused.");
          if (r.ok) setRejecting(null);
        }}
      />
    </Box>
  );
};

export default VerificationPage;
