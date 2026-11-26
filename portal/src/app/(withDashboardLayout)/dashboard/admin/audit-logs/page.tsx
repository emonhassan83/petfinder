"use client";

import { useState } from "react";
import { Box, Card, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { mockAudit } from "@/mock/admin";

const AuditLogsPage = () => {
  const [filter, setFilter] = useState("");
  const rows = mockAudit.filter((r) =>
    `${r.actor} ${r.action} ${r.entity}`.toLowerCase().includes(filter.trim().toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Audit logs
      </Typography>
      <TextField size="small" label="Filter by actor, action or entity" value={filter} onChange={(e) => setFilter(e.target.value)} sx={{ mb: 2, minWidth: 300 }} />
      <Card sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.time}</TableCell>
                <TableCell>{r.actor}</TableCell>
                <TableCell>{r.action}</TableCell>
                <TableCell>{r.entity}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No matching entries.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview data. Entries are append-only once the backend records them.
      </Typography>
    </Box>
  );
};

export default AuditLogsPage;
