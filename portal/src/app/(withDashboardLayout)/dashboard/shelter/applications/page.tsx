"use client";

import { useState } from "react";
import { Box, Button, Card, Chip, Typography } from "@mui/material";
import { ApplicationStatus, mockApplications } from "@/mock/shelter";

const color: Record<ApplicationStatus, "warning" | "success" | "error"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

const ApplicationsPage = () => {
  const [apps, setApps] = useState(mockApplications);

  //* Approving one application for a pet auto-rejects the other pending ones (matches planned backend rule).
  const decide = (id: string, status: ApplicationStatus) =>
    setApps((prev) => {
      const target = prev.find((a) => a.id === id);
      return prev.map((a) =>
        a.id === id
          ? { ...a, status }
          : status === "APPROVED" && target && a.pet === target.pet && a.status === "PENDING"
          ? { ...a, status: "REJECTED" as ApplicationStatus }
          : a
      );
    });

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Applications
      </Typography>
      <Box sx={{ display: "grid", gap: 2, maxWidth: 820 }}>
        {apps.map((a) => (
          <Card key={a.id} sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
              <Box>
                <Typography fontWeight={600}>
                  {a.applicant} <Typography component="span" color="text.secondary">for {a.pet}</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ my: 0.5 }}>
                  {a.note}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Submitted {a.submitted}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Chip size="small" label={a.status} color={color[a.status]} />
                {a.status === "PENDING" && (
                  <>
                    <Button size="small" onClick={() => decide(a.id, "APPROVED")}>
                      Approve
                    </Button>
                    <Button size="small" color="inherit" variant="outlined" onClick={() => decide(a.id, "REJECTED")}>
                      Reject
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Card>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview data. Decisions are not saved until the backend is connected.
      </Typography>
    </Box>
  );
};

export default ApplicationsPage;
