"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import { toast } from "sonner";
import { Listing, ListingStatus, mockListings, mockPlans } from "@/mock/shelter";

const FREE_LIMIT = mockPlans[0].listings;
const MAX_PHOTOS = 8;
const MAX_VIDEO_MB = 50;

const statusColor: Record<ListingStatus, "success" | "warning" | "default" | "primary"> = {
  PUBLISHED: "success",
  PAUSED: "warning",
  DRAFT: "default",
  ADOPTED: "primary",
};

const empty = { name: "", species: "Dog", breed: "", age: "1" };

const ListingsPage = () => {
  const [listings, setListings] = useState<Listing[]>(mockListings);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [photos, setPhotos] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);

  const used = listings.filter((l) => l.status !== "ADOPTED").length;
  const atLimit = used >= FREE_LIMIT;

  const setStatus = (id: string, status: ListingStatus) => {
    if (status === "PUBLISHED" && listings.filter((l) => l.status === "PUBLISHED").length >= FREE_LIMIT) {
      toast.error(`Your plan allows ${FREE_LIMIT} active listings. Upgrade to publish more.`);
      return;
    }
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  const onPhotos = (files: FileList | null) => {
    const picked = Array.from(files || []).filter((f) => f.type.startsWith("image/"));
    setPhotos((prev) => [...prev, ...picked].slice(0, MAX_PHOTOS));
  };

  const onVideo = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("video/") || file.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`Video must be a video file under ${MAX_VIDEO_MB} MB.`);
      return;
    }
    setVideo(file);
  };

  const create = () => {
    if (!form.name.trim() || !form.breed.trim()) {
      toast.error("Name and breed are required.");
      return;
    }
    const age = Number(form.age);
    if (!Number.isFinite(age) || age < 0) {
      toast.error("Enter a valid age.");
      return;
    }
    setListings((prev) => [
      { id: `l${Date.now()}`, name: form.name.trim(), species: form.species, breed: form.breed.trim(), age, status: "DRAFT", views: 0, applications: 0 },
      ...prev,
    ]);
    setOpen(false);
    setForm(empty);
    setPhotos([]);
    setVideo(null);
    toast.success("Draft created. Publish it when you're ready.");
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h4">My listings</Typography>
        <Button onClick={() => setOpen(true)} disabled={atLimit}>
          Add listing
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Free plan: {used} of {FREE_LIMIT} listings used
        </Typography>
        <LinearProgress variant="determinate" value={Math.min(100, (used / FREE_LIMIT) * 100)} sx={{ mt: 1, height: 8, borderRadius: 4 }} />
        {atLimit && (
          <Alert severity="info" sx={{ mt: 2 }}>
            You&apos;ve reached your plan limit. Upgrade under Plan &amp; Billing to add more listings.
          </Alert>
        )}
      </Card>

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
            {listings.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <Typography fontWeight={600}>{l.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {l.species} · {l.breed} · {l.age}y
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip size="small" label={l.status} color={statusColor[l.status]} />
                </TableCell>
                <TableCell align="right">{l.views}</TableCell>
                <TableCell align="right">{l.applications}</TableCell>
                <TableCell align="right">
                  {l.status === "PUBLISHED" ? (
                    <Tooltip title="Pause listing">
                      <IconButton aria-label={`Pause ${l.name}`} onClick={() => setStatus(l.id, "PAUSED")}>
                        <PauseCircleOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  ) : l.status !== "ADOPTED" ? (
                    <Tooltip title="Publish listing">
                      <IconButton aria-label={`Publish ${l.name}`} onClick={() => setStatus(l.id, "PUBLISHED")}>
                        <PlayCircleOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview data. Changes are not saved until the backend is connected.
      </Typography>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add listing</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "8px !important" }}>
          <TextField label="Pet name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <TextField select label="Species" value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })}>
            {["Dog", "Cat", "Rabbit", "Bird", "Other"].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Breed" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} required />
          <TextField label="Age (years)" type="number" inputProps={{ min: 0 }} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
          <Box>
            <Button component="label" variant="outlined" size="small">
              Add photos ({photos.length}/{MAX_PHOTOS})
              <input hidden type="file" accept="image/*" multiple onChange={(e) => onPhotos(e.target.files)} />
            </Button>{" "}
            <Button component="label" variant="outlined" size="small">
              {video ? "Replace video" : "Add video"}
              <input hidden type="file" accept="video/*" onChange={(e) => onVideo(e.target.files?.[0])} />
            </Button>
            {video && (
              <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                {video.name}
              </Typography>
            )}
            {photos.length > 0 && (
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                {photos.map((f, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={URL.createObjectURL(f)} alt={`Selected photo ${i + 1}`} width={64} height={64} style={{ objectFit: "cover", borderRadius: 8 }} />
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="text" color="inherit" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={create}>Save draft</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListingsPage;
