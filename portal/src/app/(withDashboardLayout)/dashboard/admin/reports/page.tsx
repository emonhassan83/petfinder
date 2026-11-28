"use client";

import { useState } from "react";
import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from "@mui/material";
import QueryState from "@/components/Dashboard/Common/QueryState";
import { useAdminGetReportsQuery, useAdminResolveReportMutation } from "@/redux/api/adminApi";
import { fmtDate, runMutation } from "@/utils/dashboardHelpers";

const color = { OPEN: "warning", DISMISSED: "default", ACTIONED: "success" } as const;
type Status = keyof typeof color;

//* Actions the API accepts per target type (HIDE_LISTING: pets only, HIDE_REVIEW: reviews only)
const actionsFor = (targetType: string) => {
  const list: { value: string; label: string }[] = [{ value: "WARN", label: "Warn the owner" }];
  if (targetType === "PET") list.push({ value: "HIDE_LISTING", label: "Hide listing" });
  if (targetType === "REVIEW") list.push({ value: "HIDE_REVIEW", label: "Hide review" });
  list.push({ value: "SUSPEND_USER", label: "Suspend the user" });
  return list;
};

const targetLabel = (r: any) => {
  const t = r.target;
  if (!t) return `${r.targetType} (removed)`;
  return t.name || t.title || t.comment?.slice(0, 60) || t.id;
};

const ReportsPage = () => {
  const [status, setStatus] = useState<Status>("OPEN");
  const { data, isLoading, error } = useAdminGetReportsQuery({ status });
  const [resolve, { isLoading: saving }] = useAdminResolveReportMutation();
  const [pending, setPending] = useState<{ report: any; status: "ACTIONED" | "DISMISSED" } | null>(null);
  const [action, setAction] = useState("WARN");
  const [note, setNote] = useState("");

  const open = (report: any, st: "ACTIONED" | "DISMISSED") => {
    setPending({ report, status: st });
    setAction("WARN");
    setNote("");
  };

  const submit = async () => {
    if (!pending) return;
    const body: any = { id: pending.report.id, status: pending.status, note: note.trim() };
    if (pending.status === "ACTIONED") body.action = action;
    const r = await runMutation(resolve(body), "Report updated.");
    if (r.ok) setPending(null);
  };

  const items: any[] = data?.items ?? [];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Reports queue
      </Typography>
      <Box role="radiogroup" aria-label="Filter by status" sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
        {(Object.keys(color) as Status[]).map((f) => (
          <Chip key={f} role="radio" aria-checked={status === f} label={f} clickable onClick={() => setStatus(f)} color={status === f ? "primary" : "default"} variant={status === f ? "filled" : "outlined"} />
        ))}
      </Box>
      <QueryState isLoading={isLoading} error={error}>
        <Box sx={{ display: "grid", gap: 2, maxWidth: 820 }}>
          {items.length === 0 && <Typography color="text.secondary">Nothing here.</Typography>}
          {items.map((r) => (
            <Card key={r.id} sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
                <Box>
                  <Typography fontWeight={600}>
                    {targetLabel(r)} <Chip size="small" label={r.targetType} variant="outlined" sx={{ ml: 1 }} />
                  </Typography>
                  <Typography variant="body2" sx={{ my: 0.5 }}>
                    {r.reason}
                    {r.details ? ` - ${r.details}` : ""}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Reported by {r.reporter?.name ?? "unknown"} · {fmtDate(r.createdAt)}
                  </Typography>
                  {r.resolutionNote && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Resolution{r.action ? ` (${r.action})` : ""}: {r.resolutionNote}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Chip size="small" label={r.status} color={color[r.status as Status]} />
                  {r.status === "OPEN" && (
                    <>
                      <Button size="small" onClick={() => open(r, "ACTIONED")}>
                        Take action
                      </Button>
                      <Button size="small" color="inherit" variant="outlined" onClick={() => open(r, "DISMISSED")}>
                        Dismiss
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      </QueryState>

      <Dialog open={!!pending} onClose={() => setPending(null)} fullWidth maxWidth="xs">
        <DialogTitle>{pending?.status === "ACTIONED" ? "Take action" : "Dismiss report"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "8px !important" }}>
          {pending?.status === "ACTIONED" && (
            <TextField select label="Action" value={action} onChange={(e) => setAction(e.target.value)}>
              {actionsFor(pending.report.targetType).map((a) => (
                <MenuItem key={a.value} value={a.value}>
                  {a.label}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            autoFocus
            multiline
            minRows={3}
            label="Resolution note (logged, shared with the user)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            inputProps={{ maxLength: 1000 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setPending(null)}>
            Cancel
          </Button>
          <Button disabled={saving || note.trim().length < 3} onClick={submit}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportsPage;
