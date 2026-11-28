"use client";

import { useState } from "react";
import { useAdminDeleteUserMutation, useAdminGetUsersQuery, useGetMyProfileQuery } from "@/redux/api/userApi";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import BlockIcon from "@mui/icons-material/Block";
import DeleteIcon from "@mui/icons-material/Delete";
import UpdateUserRoleModal from "./components/UpdateRoleModal";
import UpdateUserStatusModal from "./components/UpdateStatusModal";
import Meta from "@/components/Meta/MetaData";
import QueryState from "@/components/Dashboard/Common/QueryState";
import { runMutation } from "@/utils/dashboardHelpers";

const ROLES = ["USER", "OWNER", "SHELTER", "SHELTER_MEMBER", "ADMIN", "SUPER_ADMIN"];

const ManageUsersPage = () => {
  const [roleOpen, setRoleOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [toDelete, setToDelete] = useState<any>(null);
  const [paging, setPaging] = useState({ page: 0, pageSize: 10 });
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");

  const { data: me } = useGetMyProfileQuery({});
  const { data, isLoading, isFetching, error } = useAdminGetUsersQuery({
    page: paging.page + 1,
    limit: paging.pageSize,
    sortBy: "createdAt",
    sortOrder: "desc",
    ...(role ? { role } : {}),
    ...(search ? { searchTerm: search } : {}),
  });
  const [deleteUser, { isLoading: deleting }] = useAdminDeleteUserMutation();

  const viewerIsSuper = me?.role === "SUPER_ADMIN";
  const isAdminRole = (r: string) => r === "ADMIN" || r === "SUPER_ADMIN";
  //* Self changes are rejected by the server; acting on admin accounts is SUPER_ADMIN only
  const locked = (row: any) => row.id === me?.id || (isAdminRole(row.role) && !viewerIsSuper);

  const confirmDelete = async () => {
    const r = await runMutation(deleteUser(toDelete.id), "User deleted.");
    if (r.ok) setToDelete(null);
  };

  const columns: GridColDef[] = [
    { field: "name", headerName: "User Name", flex: 1, minWidth: 140 },
    { field: "email", headerName: "Email", flex: 1.4, minWidth: 200 },
    { field: "role", headerName: "Role", flex: 1, minWidth: 130 },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      minWidth: 110,
      renderCell: ({ row }) => (
        <Chip size="small" label={row.isDeleted ? "DELETED" : row.status} color={row.isDeleted || row.status === "BLOCKED" ? "error" : "success"} />
      ),
    },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      minWidth: 150,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: ({ row }) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title={locked(row) ? "Not permitted for this account" : "Change role"}>
            <span>
              <IconButton
                disabled={locked(row) || row.isDeleted}
                color="primary"
                aria-label={`Change role of ${row.name}`}
                onClick={() => {
                  setSelected(row);
                  setRoleOpen(true);
                }}
              >
                <ManageAccountsIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Block or activate">
            <span>
              <IconButton
                disabled={locked(row) || row.isDeleted}
                color="primary"
                aria-label={`Change status of ${row.name}`}
                onClick={() => {
                  setSelected(row);
                  setStatusOpen(true);
                }}
              >
                <BlockIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Delete">
            <span>
              <IconButton disabled={locked(row) || row.isDeleted} color="primary" aria-label={`Delete ${row.name}`} onClick={() => setToDelete(row)}>
                <DeleteIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Meta title="Manage Users | Petfinder" description="Admin dashboard: manage users, roles and account status." />

      <UpdateUserRoleModal open={roleOpen} setOpen={setRoleOpen} data={selected} viewerIsSuperAdmin={viewerIsSuper} />
      <UpdateUserStatusModal open={statusOpen} setOpen={setStatusOpen} data={selected} />

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete user?</DialogTitle>
        <DialogContent>
          <Typography>
            {toDelete?.name} ({toDelete?.email}) will be soft-deleted and signed out. This does not remove their listings or history.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button color="error" disabled={deleting} onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Typography variant="h4" sx={{ mb: 2 }}>
        Manage users
      </Typography>
      {!viewerIsSuper && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Admin accounts and the ADMIN / SUPER_ADMIN roles can only be managed by a super admin.
        </Alert>
      )}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
        <TextField
          size="small"
          label="Search name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPaging((p) => ({ ...p, page: 0 }));
          }}
        />
        <TextField
          select
          size="small"
          label="Role"
          value={role}
          sx={{ minWidth: 180 }}
          onChange={(e) => {
            setRole(e.target.value);
            setPaging((p) => ({ ...p, page: 0 }));
          }}
        >
          <MenuItem value="">All roles</MenuItem>
          {ROLES.map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </TextField>
      </Box>
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

export default ManageUsersPage;
