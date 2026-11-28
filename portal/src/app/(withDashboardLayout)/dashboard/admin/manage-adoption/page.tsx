"use client";

import { useState } from "react";
import {
  useAdminDeleteAdoptionRequestMutation,
  useAdminGetAdoptionRequestsQuery,
  useAdminGetDisputesQuery,
  useAdminResolveDisputeMutation,
} from "@/redux/api/inboxApi";
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tab, Tabs, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import GavelIcon from "@mui/icons-material/Gavel";
import UpdateAdoptStatusModal from "./components/UpdateAdoptModal";
import Meta from "@/components/Meta/MetaData";
import Thumb from "@/components/Dashboard/Common/Thumb";
import QueryState from "@/components/Dashboard/Common/QueryState";
import ReasonDialog from "@/components/Shared/ReasonDialog";
import { fmtDate, runMutation } from "@/utils/dashboardHelpers";

const statusColor: Record<string, "default" | "success" | "warning" | "error" | "primary"> = {
  PENDING: "warning",
  APPROVED: "success",
  COMPLETED: "primary",
  REJECTED: "error",
  WITHDRAWN: "default",
};

const ManageAdoptionPage = () => {
  const [tab, setTab] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [toDelete, setToDelete] = useState<any>(null);
  const [toResolve, setToResolve] = useState<any>(null);

  const all = useAdminGetAdoptionRequestsQuery({});
  const disputes = useAdminGetDisputesQuery({});
  const [deleteRequest, { isLoading: deleting }] = useAdminDeleteAdoptionRequestMutation();
  const [resolveDispute] = useAdminResolveDisputeMutation();

  const base: GridColDef[] = [
    { field: "user", headerName: "Applicant", flex: 1, minWidth: 140, valueGetter: ({ row }) => row.user?.name ?? "Unknown" },
    { field: "email", headerName: "Email", flex: 1.2, minWidth: 180, valueGetter: ({ row }) => row.user?.email ?? "" },
    { field: "pet", headerName: "Pet", flex: 1, minWidth: 120, valueGetter: ({ row }) => row.pet?.name ?? "Unknown" },
    { field: "image", headerName: "", width: 70, sortable: false, renderCell: ({ row }) => <Thumb src={row.pet?.image} alt={row.pet?.name} /> },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: ({ row }) => <Chip size="small" label={row.status} color={statusColor[row.status] ?? "default"} />,
    },
    { field: "createdAt", headerName: "Applied", width: 110, valueGetter: ({ row }) => fmtDate(row.createdAt) },
  ];

  const allColumns: GridColDef[] = [
    ...base,
    {
      field: "action",
      headerName: "Action",
      width: 120,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: ({ row }) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Update status">
            <IconButton
              color="primary"
              aria-label="Update status"
              onClick={() => {
                setSelected(row);
                setIsModalOpen(true);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton color="primary" aria-label="Delete application" onClick={() => setToDelete(row)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const disputeColumns: GridColDef[] = [
    ...base.slice(0, 4),
    { field: "disputeReason", headerName: "Dispute reason", flex: 1.5, minWidth: 200 },
    { field: "disputedAt", headerName: "Raised", width: 110, valueGetter: ({ row }) => fmtDate(row.disputedAt) },
    {
      field: "action",
      headerName: "Action",
      width: 120,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: ({ row }) => (
        <Tooltip title="Resolve dispute">
          <IconButton color="primary" aria-label="Resolve dispute" onClick={() => setToResolve(row)}>
            <GavelIcon />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const gridProps = {
    autoHeight: true,
    pageSizeOptions: [10, 25, 50],
    initialState: { pagination: { paginationModel: { pageSize: 10, page: 0 } } },
    disableRowSelectionOnClick: true,
  };

  return (
    <>
      <Meta title="Adoption Requests | Petfinder" description="Admin dashboard: adoption applications and disputes." />

      <UpdateAdoptStatusModal open={isModalOpen} setOpen={setIsModalOpen} data={selected} />

      <ReasonDialog
        open={!!toResolve}
        title="Resolve dispute"
        onClose={() => setToResolve(null)}
        onConfirm={async (note) => {
          const r = await runMutation(resolveDispute({ id: toResolve.id, note }), "Dispute resolved.");
          if (r.ok) setToResolve(null);
        }}
      />

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete application?</DialogTitle>
        <DialogContent>
          <Typography>
            The application from {toDelete?.user?.name} for {toDelete?.pet?.name} will be removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button
            color="error"
            disabled={deleting}
            onClick={async () => {
              const r = await runMutation(deleteRequest(toDelete.id), "Application deleted.");
              if (r.ok) setToDelete(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h4" sx={{ mb: 2 }}>
        Adoption requests
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`All requests (${all.data?.meta?.total ?? 0})`} />
        <Tab label={`Disputes (${disputes.data?.meta?.total ?? 0})`} />
      </Tabs>

      {tab === 0 ? (
        <QueryState isLoading={all.isLoading} error={all.error}>
          <DataGrid rows={all.data?.items ?? []} columns={allColumns} {...gridProps} />
        </QueryState>
      ) : (
        <QueryState isLoading={disputes.isLoading} error={disputes.error}>
          <DataGrid rows={disputes.data?.items ?? []} columns={disputeColumns} {...gridProps} />
        </QueryState>
      )}
    </>
  );
};

export default ManageAdoptionPage;
