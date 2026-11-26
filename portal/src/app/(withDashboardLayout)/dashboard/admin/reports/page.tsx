"use client";

import { useState } from "react";
import { Box, Button, Card, Chip, Typography } from "@mui/material";
import { toast } from "sonner";
import ReasonDialog from "@/components/Shared/ReasonDialog";
import { mockReports, Report } from "@/mock/admin";

const color = { OPEN: "warning", DISMISSED: "default", ACTIONED: "success" } as const;

const ReportsPage = () => {
  const [items, setItems] = useState<Report[]>(mockReports);
  const [pending, setPending] = useState<{ id: string; status: Report["status"] } | null>(null);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Reports queue
      </Typography>
      <Box sx={{ display: "grid", gap: 2, maxWidth: 820 }}>
        {items.map((r) => (
          <Card key={r.id} sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography fontWeight={600}>
                  {r.target} <Chip size="small" label={r.targetType} variant="outlined" sx={{ ml: 1 }} />
                </Typography>
                <Typography variant="body2" sx={{ my: 0.5 }}>
                  {r.reason}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Reported by {r.reporter} · {r.date}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Chip size="small" label={r.status} color={color[r.status]} />
                {r.status === "OPEN" && (
                  <>
                    <Button size="small" onClick={() => setPending({ id: r.id, status: "ACTIONED" })}>
                      {r.targetType === "Listing" ? "Hide listing" : "Suspend user"}
                    </Button>
                    <Button size="small" color="inherit" variant="outlined" onClick={() => setPending({ id: r.id, status: "DISMISSED" })}>
                      Dismiss
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Card>
        ))}
      </Box>
      <ReasonDialog
        open={!!pending}
        title={pending?.status === "ACTIONED" ? "Take action" : "Dismiss report"}
        onClose={() => setPending(null)}
        onConfirm={() => {
          if (pending) setItems((prev) => prev.map((r) => (r.id === pending.id ? { ...r, status: pending.status } : r)));
          setPending(null);
          toast.success("Report updated (preview).");
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview data.
      </Typography>
    </Box>
  );
};

export default ReportsPage;
