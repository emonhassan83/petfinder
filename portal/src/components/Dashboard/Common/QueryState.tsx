"use client";

import { Alert, Box, CircularProgress } from "@mui/material";
import { ReactNode } from "react";

//* Loading / error wrapper for RTK Query results. 404/403 can be handled by the caller via `error`.
const QueryState = ({ isLoading, error, children }: { isLoading?: boolean; error?: any; children: ReactNode }) => {
  if (isLoading)
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  if (error) {
    const msg = typeof error?.data === "string" ? error.data : error?.data?.message || "Could not load this data.";
    return <Alert severity="error">{msg}</Alert>;
  }
  return <>{children}</>;
};

export default QueryState;
