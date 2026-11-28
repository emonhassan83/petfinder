"use client";

import { useState } from "react";
import { useAdminDeletePetMutation, useAdminGetPetsQuery, useAdminSetPetStatusMutation } from "@/redux/api/adminApi";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import UpdatePetModal from "./components/UpdatePetModal";
import Meta from "@/components/Meta/MetaData";
import Thumb from "@/components/Dashboard/Common/Thumb";
import QueryState from "@/components/Dashboard/Common/QueryState";
import { runMutation } from "@/utils/dashboardHelpers";

//* PENDING is set by the adoption flow only; admins may set any manual status
const STATUSES = ["DRAFT", "PUBLISHED", "PAUSED", "ADOPTED", "REMOVED"];

const ManagePet = () => {
  const [paging, setPaging] = useState({ page: 0, pageSize: 10 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState<any>(null);
  const [toDelete, setToDelete] = useState<any>(null);

  const { data, isLoading, isFetching, error } = useAdminGetPetsQuery({
    page: paging.page + 1,
    limit: paging.pageSize,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [setStatus] = useAdminSetPetStatusMutation();
  const [deletePet, { isLoading: deleting }] = useAdminDeletePetMutation();

  const columns: GridColDef[] = [
    { field: "name", headerName: "Pet Name", flex: 1, minWidth: 120 },
    {
      field: "image",
      headerName: "Pet Image",
      width: 90,
      sortable: false,
      renderCell: ({ row }) => <Thumb src={row.image || row.media?.[0]?.url} alt={row.name} />,
    },
    { field: "species", headerName: "Species", flex: 0.7, minWidth: 90 },
    {
      field: "owner",
      headerName: "Listed by",
      flex: 1,
      minWidth: 140,
      sortable: false,
      valueGetter: ({ row }) => row.shelter?.name ?? row.user?.name ?? "-",
    },
    { field: "age", headerName: "Age", width: 70 },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      sortable: false,
      renderCell: ({ row }) => (
        <TextField
          select
          size="small"
          variant="standard"
          value={row.status}
          onChange={(e) => runMutation(setStatus({ id: row.id, status: e.target.value }), "Status updated.")}
          sx={{ minWidth: 120 }}
        >
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
          {!STATUSES.includes(row.status) && (
            <MenuItem value={row.status} disabled>
              {row.status}
            </MenuItem>
          )}
        </TextField>
      ),
    },
    {
      field: "action",
      headerName: "Action",
      width: 120,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: ({ row }) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Edit">
            <IconButton
              color="primary"
              aria-label={`Edit ${row.name}`}
              onClick={() => {
                setSelectedPet(row);
                setIsModalOpen(true);
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton color="primary" aria-label={`Delete ${row.name}`} onClick={() => setToDelete(row)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Meta title="Manage Pets | Petfinder" description="Admin dashboard: manage pet listings and their status." />

      <UpdatePetModal open={isModalOpen} setOpen={setIsModalOpen} data={selectedPet} />

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete listing?</DialogTitle>
        <DialogContent>
          <Typography>{toDelete?.name} and its applications, media and visits will be permanently removed.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button
            color="error"
            disabled={deleting}
            onClick={async () => {
              const r = await runMutation(deletePet(toDelete.id), "Pet deleted.");
              if (r.ok) setToDelete(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h4" sx={{ mb: 2 }}>
        Manage pets
      </Typography>
      <QueryState isLoading={isLoading} error={error}>
        <DataGrid
          autoHeight
          rows={data?.items ?? []}
          columns={columns}
          loading={isFetching}
          rowCount={data?.meta?.total ?? 0}
          paginationMode="server"
          paginationModel={paging}
          onPaginationModelChange={setPaging}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
        />
      </QueryState>
    </>
  );
};

export default ManagePet;
