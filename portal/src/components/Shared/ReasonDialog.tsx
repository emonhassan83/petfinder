"use client";

import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

//* Collects a required note for destructive/moderation actions (reject, dismiss, hide).
const ReasonDialog = ({ open, title, onClose, onConfirm }: Props) => {
  const [reason, setReason] = useState("");
  const valid = reason.trim().length >= 5;

  const close = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          sx={{ mt: 1 }}
          label="Reason (shared with the user and logged)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          inputProps={{ maxLength: 500 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="text" color="inherit" onClick={close}>
          Cancel
        </Button>
        <Button
          disabled={!valid}
          onClick={() => {
            onConfirm(reason.trim());
            setReason("");
          }}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReasonDialog;
