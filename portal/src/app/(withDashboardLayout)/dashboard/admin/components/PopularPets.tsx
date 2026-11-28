"use client";

import { useAdminGetPetsQuery } from "@/redux/api/adminApi";
import Thumb from "@/components/Dashboard/Common/Thumb";
import { Box, IconButton } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import LoadingPage from "@/components/Shared/Loader/LoadingPage";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import Link from "next/link";

const FeaturePets = () => {
  const { data, isLoading } = useAdminGetPetsQuery({ limit: 5, sortBy: "createdAt", sortOrder: "desc" });

  const columns: GridColDef[] = [
    { field: "name", headerName: "Pet Name", flex: 1 },
    {
      field: "image",
      headerName: "Pet Image",
      flex: 1,
      renderCell: ({ row }) => {
        return (
          <Thumb src={row.image || row.media?.[0]?.url} alt={row.name} />
        );
      },
    },
    { field: "species", headerName: "Species", flex: 1 },
    { field: "color", headerName: "Color", flex: 1 },
    { field: "age", headerName: "Age", flex: 1 },
    { field: "size", headerName: "Size", flex: 1 },
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      headerAlign: "center",
      align: "center",
      renderCell: ({ row }) => {
        return (
          <Link href={`/pets/${row?.id}`}>
          <IconButton color="primary" aria-label="delete">
            <RemoveRedEyeIcon />
          </IconButton>
          </Link>
        );
      },
    },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      {!isLoading ? (
        <Box my={2}>
          <DataGrid
            rows={data?.items ?? []}
            columns={columns}
            disableColumnMenu
            hideFooter
            autoHeight
            getRowId={(row) => row.id || row.name}
          />
        </Box>
      ) : (
        <LoadingPage />
      )}
    </Box>
  );
};

export default FeaturePets;
