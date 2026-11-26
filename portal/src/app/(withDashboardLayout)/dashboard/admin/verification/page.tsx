"use client";

import { useState } from "react";
import { Box, Button, Card, Chip, Typography } from "@mui/material";
import { toast } from "sonner";
import ReasonDialog from "@/components/Shared/ReasonDialog";
import { mockVerifications, Verification } from "@/mock/admin";

const color = { PENDING: "warning", VERIFIED: "success", REJECTED: "error" } as const;

const VerificationPage = () => {
  const [items, setItems] = useState<Verification[]>(mockVerifications);
  const [rejecting, setRejecting] = useState<string | null>(null);

  const setStatus = (id: string, status: Verification["status"]) =>
    setItems((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Shelter &amp; owner verification
      </Typography>
      <Box sx={{ display: "grid", gap: 2, maxWidth: 820 }}>
        {items.map((v) => (
          <Card key={v.id} sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography fontWeight={600}>
                  {v.org} <Chip size="small" label={v.type} variant="outlined" sx={{ ml: 1 }} />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {v.contact} · submitted {v.submitted}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Documents: {v.docs.join(", ")}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Chip size="small" label={v.status} color={color[v.status]} />
                {v.status === "PENDING" && (
                  <>
                    <Button
                      size="small"
                      onClick={() => {
                        setStatus(v.id, "VERIFIED");
                        toast.success(`${v.org} verified (preview).`);
                      }}
                    >
                      Verify
                    </Button>
                    <Button size="small" color="inherit" variant="outlined" onClick={() => setRejecting(v.id)}>
                      Reject
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Card>
        ))}
      </Box>
      <ReasonDialog
        open={!!rejecting}
        title="Reject verification"
        onClose={() => setRejecting(null)}
        onConfirm={() => {
          if (rejecting) setStatus(rejecting, "REJECTED");
          setRejecting(null);
          toast.success("Rejected (preview).");
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview data. Actions will be written to the audit log once the backend is connected.
      </Typography>
    </Box>
  );
};

export default VerificationPage;
