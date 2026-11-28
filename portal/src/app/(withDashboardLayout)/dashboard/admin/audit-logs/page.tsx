"use client";

import { useState } from "react";
import { Box, Card, MenuItem, TablePagination, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import QueryState from "@/components/Dashboard/Common/QueryState";
import { useAdminGetAuditLogsQuery } from "@/redux/api/adminApi";
import { fmtDateTime } from "@/utils/dashboardHelpers";

const ROLES = ["USER", "OWNER", "SHELTER", "SHELTER_MEMBER", "ADMIN", "SUPER_ADMIN"];

const AuditLogsPage = () => {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [actorRole, setActorRole] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params: Record<string, any> = { page: page + 1, limit };
  if (action.trim()) params.action = action.trim().toUpperCase();
  if (entity.trim()) params.entity = entity.trim();
  if (actorRole) params.actorRole = actorRole;
  if (from) params.from = new Date(from).toISOString();
  if (to) params.to = new Date(`${to}T23:59:59`).toISOString();

  const { data, isLoading, isFetching, error } = useAdminGetAuditLogsQuery(params);
  const rows: any[] = data?.items ?? [];

  const reset = (fn: (v: string) => void) => (e: any) => {
    fn(e.target.value);
    setPage(0);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Audit logs
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <TextField size="small" label="Action (exact)" value={action} onChange={reset(setAction)} />
        <TextField size="small" label="Entity" value={entity} onChange={reset(setEntity)} />
        <TextField select size="small" label="Actor role" value={actorRole} onChange={reset(setActorRole)} sx={{ minWidth: 160 }}>
          <MenuItem value="">Any</MenuItem>
          {ROLES.map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </TextField>
        <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={reset(setFrom)} />
        <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={reset(setTo)} />
      </Box>
      <QueryState isLoading={isLoading} error={error}>
        <Card sx={{ overflowX: "auto", opacity: isFetching ? 0.7 : 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDateTime(r.createdAt)}</TableCell>
                  <TableCell>
                    {r.actor?.name ?? "System"}
                    <Typography variant="caption" color="text.secondary" display="block">
                      {r.actorRole}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.action}</TableCell>
                  <TableCell>
                    {r.entity}
                    {r.entityId && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {String(r.entityId).slice(0, 8)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280, wordBreak: "break-word" }}>
                    <Typography variant="caption" color="text.secondary">
                      {r.meta ? JSON.stringify(r.meta) : ""}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No matching entries.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={data?.meta?.total ?? 0}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </Card>
      </QueryState>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Entries are append-only.
      </Typography>
    </Box>
  );
};

export default AuditLogsPage;
