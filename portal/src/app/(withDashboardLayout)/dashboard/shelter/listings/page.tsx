"use client";

import { useState } from "react";
import { Alert, Box, Button, Card, Chip, IconButton, LinearProgress, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Link from "next/link";
import QueryState from "@/components/Dashboard/Common/QueryState";
import Thumb from "@/components/Dashboard/Common/Thumb";
import { useGetMyListingsQuery, useUpdateListingStatusMutation } from "@/redux/api/listingApi";
import { useGetMySubscriptionQuery } from "@/redux/api/billingApi";
import { runMutation } from "@/utils/dashboardHelpers";
import ListingEditor from "./components/ListingEditor";

const statusColor: Record<string, "success" | "warning" | "default" | "primary" | "info" | "error"> = {
  PUBLISHED: "success",
  PAUSED: "warning",
  DRAFT: "default",
  PENDING: "info",
  ADOPTED: "primary",
  REMOVED: "error",
};

const ListingsPage = () => {
  const listings = useGetMyListingsQuery();
  const sub = useGetMySubscriptionQuery({});
  const [setStatus, { isLoading: saving }] = useUpdateListingStatusMutation();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const items: any[] = listings.data?.items ?? [];
  const editing = editingId ? items.find((p) => p.id === editingId) : undefined;

  const used: number = sub.data?.usage?.listings ?? 0;
  const limit: number | undefined = sub.data?.limits?.listings;
  const atLimit = limit !== undefined && used >= limit;

  const openCreate = () => {
    setEditingId(null);
    setEditorOpen(true);
  };
  const openEdit = (id: string) => {
    setEditingId(id);
    setEditorOpen(true);
  };

  const change = (id: string, status: string, ok: string) => runMutation(setStatus({ id, status }), ok);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h4">My listings</Typography>
        <Button onClick={openCreate}>Add listing</Button>
      </Box>

      {limit !== undefined && (
        <Card sx={{ p: 2, mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {sub.data?.plan?.name} plan: {used} of {limit} active listings used
          </Typography>
          <LinearProgress variant="determinate" value={limit ? Math.min(100, (used / limit) * 100) : 0} sx={{ mt: 1, height: 8, borderRadius: 4 }} />
          {atLimit && (
            <Alert severity="info" sx={{ mt: 2 }}>
              You have reached your plan limit. Pause or archive a listing, or upgrade under{" "}
              <Link href="/dashboard/shelter/billing" style={{ textDecoration: "underline" }}>
                Plan &amp; Billing
              </Link>{" "}
              to publish more. Drafts do not count.
            </Alert>
          )}
        </Card>
      )}

      <QueryState isLoading={listings.isLoading} error={listings.error}>
        <Card sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Pet</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Views</TableCell>
                <TableCell align="right">Applications</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                      <Thumb src={l.image || l.media?.find((m: any) => m.isCover)?.url || l.media?.[0]?.url} size={44} alt={l.name} />
                      <Box>
                        <Typography fontWeight={600}>{l.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {l.species} · {l.breed} · {l.age}y
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={l.status} color={statusColor[l.status] ?? "default"} />
                  </TableCell>
                  <TableCell align="right">{l.views ?? 0}</TableCell>
                  <TableCell align="right">{l._count?.adoptionRequest ?? 0}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Edit">
                      <IconButton aria-label={`Edit ${l.name}`} onClick={() => openEdit(l.id)}>
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    {l.status === "PUBLISHED" && (
                      <Tooltip title="Pause listing">
                        <span>
                          <IconButton aria-label={`Pause ${l.name}`} disabled={saving} onClick={() => change(l.id, "PAUSED", "Listing paused.")}>
                            <PauseCircleOutlineIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {(l.status === "DRAFT" || l.status === "PAUSED") && (
                      <Tooltip title="Publish listing">
                        <span>
                          <IconButton aria-label={`Publish ${l.name}`} disabled={saving} onClick={() => change(l.id, "PUBLISHED", "Listing published.")}>
                            <PlayCircleOutlineIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    {["PUBLISHED", "PAUSED", "PENDING"].includes(l.status) && (
                      <Tooltip title="Mark as adopted">
                        <span>
                          <IconButton aria-label={`Mark ${l.name} adopted`} disabled={saving} onClick={() => change(l.id, "ADOPTED", "Marked as adopted.")}>
                            <CheckCircleOutlineIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No listings yet. Add your first pet to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </QueryState>

      <ListingEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        pet={editing}
        mediaLimit={sub.data?.limits?.mediaPerListing}
        onCreated={(p) => setEditingId(p.id)}
      />
    </Box>
  );
};

export default ListingsPage;
