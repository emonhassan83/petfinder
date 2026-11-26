"use client";

import { useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useFavorites";

const reasons = ["Scam or fraud", "Animal welfare concern", "Wrong information", "Pet already adopted", "Other"];

//* Save / share / report actions for the pet detail sidebar
const PetActions = ({ pet }: { pet: any }) => {
  const { toggle, isFavorite } = useFavorites();
  const fav = isFavorite(pet.id);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `Meet ${pet.name}`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* user cancelled */
    }
  };

  const submitReport = () => {
    //* Preview only: reports API arrives in Phase 3c
    toast.success("Thanks. Our team will review this listing.");
    setOpen(false);
    setReason("");
    setNote("");
  };

  return (
    <>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 1.5 }}>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={fav ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          aria-pressed={fav}
          onClick={() => toggle({ id: pet.id, name: pet.name, image: pet.image, breed: pet.breed, age: pet.age, location: pet.location })}
        >
          {fav ? "Saved" : "Save"}
        </Button>
        <Button variant="outlined" startIcon={<ShareOutlinedIcon />} onClick={share}>
          Share
        </Button>
      </Box>
      <Button variant="text" size="small" startIcon={<FlagOutlinedIcon />} onClick={() => setOpen(true)} sx={{ mt: 1.5, color: "text.secondary", mx: "auto", display: "flex" }}>
        Report this listing
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Report {pet.name}&apos;s listing</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "8px !important" }}>
          <TextField select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
            {reasons.map((r) => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Details (optional)" multiline minRows={3} value={note} onChange={(e) => setNote(e.target.value)} inputProps={{ maxLength: 500 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="text" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!reason} onClick={submitReport}>
            Submit report
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PetActions;
