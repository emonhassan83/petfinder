import { useEffect, useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField, Typography } from "@mui/material";
import { useDecideApplicationMutation } from "@/redux/api/inboxApi";
import { runMutation } from "@/utils/dashboardHelpers";

//* Transitions the API accepts: APPROVED, REJECTED, COMPLETED (PENDING/WITHDRAWN are applicant-driven)
const statusOptions = ["APPROVED", "REJECTED", "COMPLETED"];

type TProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  data: any;
};

const UpdateAdoptStatusModal = ({ open, setOpen, data }: TProps) => {
  const [decide, { isLoading }] = useDecideApplicationMutation();
  const [status, setStatus] = useState("APPROVED");
  const [note, setNote] = useState("");

  useEffect(() => {
    setStatus(statusOptions.includes(data?.status) ? data.status : "APPROVED");
    setNote("");
  }, [data]);

  const submit = async () => {
    const r = await runMutation(decide({ id: data.id, status, decisionNote: note.trim() || undefined }), "Application updated.");
    if (r.ok) setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
      <DialogTitle>Update application status</DialogTitle>
      <DialogContent sx={{ display: "grid", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Current status: {data?.status}. Approving sets the pet to PENDING and rejects other pending applications; completing marks the pet ADOPTED.
        </Typography>
        <TextField select label="New status" value={status} onChange={(e) => setStatus(e.target.value)}>
          {statusOptions.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <TextField label="Note (optional)" multiline minRows={2} value={note} onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 1000 }} />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="text" color="inherit" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={submit}>
          Update
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpdateAdoptStatusModal;
