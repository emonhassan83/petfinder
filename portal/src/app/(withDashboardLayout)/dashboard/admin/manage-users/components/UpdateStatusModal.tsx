import { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from "@mui/material";
import { useAdminChangeUserStatusMutation } from "@/redux/api/userApi";
import { runMutation } from "@/utils/dashboardHelpers";

type TProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data: any;
};

//* Suspend (BLOCKED) or reactivate (ACTIVE). Deleting is a separate confirmed action on the page.
const UpdateUserStatusModal = ({ open, setOpen, data }: TProps) => {
  const [changeStatus, { isLoading }] = useAdminChangeUserStatusMutation();
  const [status, setStatus] = useState("ACTIVE");

  useEffect(() => {
    if (data?.status) setStatus(data.status);
  }, [data]);

  const submit = async () => {
    const r = await runMutation(changeStatus({ id: data.id, status }), status === "BLOCKED" ? "User blocked." : "User activated.");
    if (r.ok) setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
      <DialogTitle>Account status</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {data?.name} ({data?.email}). Blocking signs the user out everywhere.
        </Typography>
        <TextField select fullWidth label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <MenuItem value="ACTIVE">ACTIVE</MenuItem>
          <MenuItem value="BLOCKED">BLOCKED</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="text" color="inherit" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button disabled={isLoading || status === data?.status} onClick={submit}>
          Update status
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateUserStatusModal;
