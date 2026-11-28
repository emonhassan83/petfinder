"use client";

import { adoptionRequestApi, useGetMyAdoptionRequestsQuery } from "@/redux/api/adoptionApi";
import {
  Avatar,
  Box,
  Button,
  Chip,
  ChipProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import UndoIcon from "@mui/icons-material/Undo";
import Link from "next/link";
import { useState } from "react";
import UpdateAdoptRequestModal from "./components/UpdateAdoptModal";
import { toast } from "sonner";
import Meta from "@/components/Meta/MetaData";
import { normalizePet } from "@/lib/apiData";

const statusColor: Record<string, ChipProps["color"]> = {
  PENDING: "warning",
  APPROVED: "success",
  COMPLETED: "primary",
  REJECTED: "error",
  WITHDRAWN: "default",
};

const ManageAdoptionPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [withdrawing, setWithdrawing] = useState<any>(null);
  const { data, isLoading, isError } = useGetMyAdoptionRequestsQuery({});
  const [withdraw, { isLoading: withdrawBusy }] = adoptionRequestApi.endpoints.withdrawMyAdoptionRequest.useMutation();
  const rows: any[] = Array.isArray(data) ? data : [];

  const handleEditClick = (row: any) => {
    setSelected(row);
    setIsModalOpen(true);
  };

  const confirmWithdraw = async () => {
    if (!withdrawing) return;
    try {
      await withdraw(withdrawing.id).unwrap();
      toast.success("Application withdrawn");
      setWithdrawing(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not withdraw the application");
    }
  };

  const columns: GridColDef[] = [
    {
      field: "pet",
      headerName: "Pet",
      flex: 1.4,
      minWidth: 180,
      sortable: false,
      renderCell: ({ row }) => {
        const pet = row.pet ? normalizePet(row.pet) : null;
        return pet ? (
          <Box component={Link} href={`/pets/${pet.id}`} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar src={pet.image} alt={pet.name} variant="rounded" sx={{ width: 40, height: 40 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={600} noWrap>
                {pet.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {pet.breed} · {pet.location}
              </Typography>
            </Box>
          </Box>
        ) : (
          "Unknown pet"
        );
      },
    },
    {
      field: "createdAt",
      headerName: "Applied",
      flex: 0.8,
      minWidth: 110,
      valueGetter: (params: any) => (params?.row?.createdAt ? new Date(params.row.createdAt).toLocaleDateString() : ""),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 0.8,
      minWidth: 120,
      renderCell: ({ row }) => (
        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
          <Chip size="small" label={row.status} color={statusColor[row.status] ?? "default"} />
          {row.isDisputed && <Chip size="small" variant="outlined" color="warning" label="Disputed" />}
        </Box>
      ),
    },
    {
      field: "decisionNote",
      headerName: "Note from lister",
      flex: 1.2,
      minWidth: 160,
      sortable: false,
      renderCell: ({ row }) => (
        <Tooltip title={row.decisionNote || ""}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {row.decisionNote || "—"}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: "action",
      headerName: "Actions",
      flex: 0.8,
      minWidth: 110,
      sortable: false,
      headerAlign: "center",
      align: "center",
      renderCell: ({ row }) => (
        <Box display="flex" gap={1}>
          <Tooltip title={row.status === "PENDING" ? "Edit answers" : "Only pending applications can be edited"}>
            <span>
              <IconButton
                onClick={() => handleEditClick(row)}
                color="primary"
                aria-label="Edit application"
                disabled={row.status !== "PENDING"}
              >
                <EditIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Withdraw application">
            <span>
              <IconButton
                onClick={() => setWithdrawing(row)}
                color="secondary"
                aria-label="Withdraw application"
                disabled={!["PENDING", "APPROVED"].includes(row.status)}
              >
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Meta
        title="Manage Adoption | Petfinder - Pet Adoption Platform & Management System"
        description="Track, edit and withdraw your adoption applications on Petfinder."
      />

      <UpdateAdoptRequestModal open={isModalOpen} setOpen={setIsModalOpen} data={selected} />

      <Dialog open={!!withdrawing} onClose={() => setWithdrawing(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Withdraw application?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your application for {withdrawing?.pet?.name ?? "this pet"} will be withdrawn.
            {withdrawing?.status === "APPROVED" && " The pet will be listed for other adopters again."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setWithdrawing(null)}>
            Keep it
          </Button>
          <Button color="secondary" onClick={confirmWithdraw} disabled={withdrawBusy}>
            Withdraw
          </Button>
        </DialogActions>
      </Dialog>

      <Box>
        <Typography variant="h4" sx={{ mb: 2 }}>
          My applications
        </Typography>
        {isError ? (
          <Typography color="error">Could not load your applications. Please try again.</Typography>
        ) : !isLoading && rows.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              You haven&apos;t applied for a pet yet.
            </Typography>
            <Button component={Link} href="/pets">
              Find a pet
            </Button>
          </Box>
        ) : (
          <Box my={2}>
            <DataGrid
              autoHeight
              loading={isLoading}
              rows={rows}
              columns={columns}
              rowHeight={64}
              disableRowSelectionOnClick
              initialState={{ pagination: { paginationModel: { page: 0, pageSize: 10 } } }}
              pageSizeOptions={[5, 10, 25]}
            />
          </Box>
        )}
      </Box>
    </>
  );
};

export default ManageAdoptionPage;
