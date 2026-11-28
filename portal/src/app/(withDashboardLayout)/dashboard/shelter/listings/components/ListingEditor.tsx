"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Tab, Tabs, TextField, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import {
  useCreateListingMutation,
  useDeleteListingMediaMutation,
  useGetListingFeesQuery,
  useReorderListingMediaMutation,
  useSaveListingFeesMutation,
  useSetListingCoverMutation,
  useUpdateListingMutation,
  useUploadListingMediaMutation,
} from "@/redux/api/listingApi";
import { useGetLookupsQuery } from "@/redux/api/lookupAdminApi";
import { runMutation } from "@/utils/dashboardHelpers";
import { toast } from "sonner";

const MAX_IMAGE_MB = 8;
const MAX_VIDEO_MB = 50;
const GENDERS = ["Male", "Female", "Unknown"];
const SIZES = ["Small", "Medium", "Large"];

type Props = {
  open: boolean;
  onClose: () => void;
  //* The row from /pets/mine (undefined = create a new listing)
  pet?: any;
  //* Called with the id after a create, so the page can keep the editor open on that listing
  onCreated?: (pet: any) => void;
  mediaLimit?: number;
};

const toForm = (p?: any) => ({
  name: p?.name ?? "",
  speciesId: p?.speciesId ?? "",
  breedId: p?.breedId ?? "",
  locationId: p?.locationId ?? "",
  age: p ? String(p.age) : "1",
  gender: p?.gender ?? "Unknown",
  size: p?.size ?? "Medium",
  colors: ((p?.colors?.length ? p.colors : p?.color ? [p.color] : []) as string[]).join(", "),
  description: p?.description ?? "",
  temperament: p?.temperament ?? "",
  healthStatus: p?.healthStatus ?? "",
  medicalHistory: p?.medicalHistory ?? "",
  adoptionRequirements: p?.adoptionRequirements ?? "",
});

const ListingEditor = ({ open, onClose, pet, onCreated, mediaLimit }: Props) => {
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(toForm(pet));
  const [publishNow, setPublishNow] = useState(false);
  //* After a create, wait for the new row to arrive in the list, then jump to the Photos tab
  const [justCreated, setJustCreated] = useState(false);

  const species = useGetLookupsQuery({ kind: "species" });
  const breeds = useGetLookupsQuery({ kind: "breeds" });
  const locations = useGetLookupsQuery({ kind: "locations" });

  const [create, { isLoading: creating }] = useCreateListingMutation();
  const [update, { isLoading: updating }] = useUpdateListingMutation();

  useEffect(() => {
    if (open) {
      setForm(toForm(pet));
      setTab(0);
      setPublishNow(false);
      setJustCreated(false);
    }
  }, [open, pet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (justCreated && pet?.id) {
      setTab(1);
      setJustCreated(false);
    }
  }, [justCreated, pet?.id]);

  const breedOptions = useMemo(() => (breeds.data ?? []).filter((b: any) => !form.speciesId || b.speciesId === form.speciesId), [breeds.data, form.speciesId]);
  const set = (k: keyof ReturnType<typeof toForm>) => (e: any) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const ageNum = Number(form.age);
  const valid = form.name.trim() && form.description.trim() && form.size && Number.isInteger(ageNum) && ageNum >= 0 && ageNum <= 40 && form.speciesId && form.locationId && form.colors.split(",").some((c: string) => c.trim());

  const save = async () => {
    const colors = form.colors.split(",").map((c: string) => c.trim()).filter(Boolean).slice(0, 8);
    const body: Record<string, any> = {
      name: form.name.trim(),
      speciesId: form.speciesId,
      locationId: form.locationId,
      age: ageNum,
      gender: form.gender,
      size: form.size,
      description: form.description.trim(),
      temperament: form.temperament.trim(),
      healthStatus: form.healthStatus.trim(),
      medicalHistory: form.medicalHistory.trim(),
      adoptionRequirements: form.adoptionRequirements.trim(),
      colors,
      ...(colors[0] ? { color: colors[0] } : {}),
      //* The API needs a breed: a lookup id, or free text for mixed/unknown
      ...(form.breedId ? { breedId: form.breedId } : { breed: "Mixed" }),
    };
    if (pet) {
      await runMutation(update({ id: pet.id, body }), "Listing saved.");
    } else {
      const r = await runMutation(create({ ...body, status: publishNow ? "PUBLISHED" : "DRAFT" }), publishNow ? "Listing published." : "Draft created. Add photos next.");
      if (r.ok && r.data?.id) {
        setJustCreated(true);
        onCreated?.(r.data);
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{pet ? `Edit ${pet.name}` : "Add listing"}</DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3 }}>
        <Tab label="Details" />
        <Tab label="Photos & video" disabled={!pet} />
        <Tab label="Adoption costs" disabled={!pet} />
      </Tabs>
      <DialogContent sx={{ pt: 2 }}>
        {tab === 0 && (
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField label="Pet name" value={form.name} onChange={set("name")} required />
            <TextField select label="Species" value={form.speciesId} onChange={(e) => setForm((f) => ({ ...f, speciesId: e.target.value, breedId: "" }))} required>
              {(species.data ?? []).map((s: any) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Breed" value={form.breedId} onChange={set("breedId")} disabled={!form.speciesId}>
              <MenuItem value="">Mixed / unknown</MenuItem>
              {breedOptions.map((b: any) => (
                <MenuItem key={b.id} value={b.id}>
                  {b.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Location" value={form.locationId} onChange={set("locationId")} required>
              {(locations.data ?? []).map((l: any) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Age (years)" type="number" inputProps={{ min: 0, max: 40 }} value={form.age} onChange={set("age")} />
            <TextField select label="Gender" value={form.gender} onChange={set("gender")}>
              {GENDERS.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Size" value={form.size} onChange={set("size")}>
              {SIZES.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Colours" required value={form.colors} onChange={set("colors")} helperText="Comma separated, e.g. black, white" />
            <TextField sx={{ gridColumn: "1 / -1" }} label="Description" multiline minRows={3} value={form.description} onChange={set("description")} required />
            <TextField label="Temperament" value={form.temperament} onChange={set("temperament")} />
            <TextField label="Health status" value={form.healthStatus} onChange={set("healthStatus")} />
            <TextField sx={{ gridColumn: "1 / -1" }} label="Medical history" multiline minRows={2} value={form.medicalHistory} onChange={set("medicalHistory")} />
            <TextField sx={{ gridColumn: "1 / -1" }} label="Adoption requirements" multiline minRows={2} value={form.adoptionRequirements} onChange={set("adoptionRequirements")} />
            {!pet && (
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Chip clickable role="checkbox" aria-checked={publishNow} label={publishNow ? "Publish immediately (counts toward your plan)" : "Save as draft"} color={publishNow ? "primary" : "default"} variant={publishNow ? "filled" : "outlined"} onClick={() => setPublishNow((v) => !v)} />
              </Box>
            )}
          </Box>
        )}
        {tab === 1 && pet && <MediaTab pet={pet} limit={mediaLimit} />}
        {tab === 2 && pet && <FeesTab petId={pet.id} />}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button variant="text" color="inherit" onClick={onClose}>
          Close
        </Button>
        {tab === 0 && (
          <Button disabled={!valid || creating || updating || (justCreated && !pet)} onClick={save}>
            {pet ? "Save changes" : publishNow ? "Create & publish" : "Save draft"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

const MediaTab = ({ pet, limit }: { pet: any; limit?: number }) => {
  const [upload] = useUploadListingMediaMutation();
  const [reorder] = useReorderListingMediaMutation();
  const [cover] = useSetListingCoverMutation();
  const [remove] = useDeleteListingMediaMutation();
  const [busy, setBusy] = useState(false);

  const media: any[] = [...(pet.media ?? [])].sort((a, b) => a.order - b.order);
  const full = limit !== undefined && media.length >= limit;

  const onFiles = async (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    setBusy(true);
    try {
      let count = media.length;
      for (const file of list) {
        if (limit !== undefined && count >= limit) {
          toast.error(`Your plan allows ${limit} photos/videos per listing.`);
          break;
        }
        const isVideo = file.type.startsWith("video/");
        const max = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
        if (!(isVideo || file.type.startsWith("image/")) || file.size > max * 1024 * 1024) {
          toast.error(`${file.name}: images up to ${MAX_IMAGE_MB} MB, MP4/WebM video up to ${MAX_VIDEO_MB} MB.`);
          continue;
        }
        const r = await runMutation(upload({ id: pet.id, file }));
        if (!r.ok) break;
        count += 1;
      }
    } finally {
      setBusy(false);
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const ids = media.map((m) => m.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    runMutation(reorder({ id: pet.id, ids }));
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {media.length}
        {limit !== undefined ? ` of ${limit}` : ""} used. The starred item is the cover shown on listing cards.
      </Typography>
      {media.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>No photos yet. Listings with photos get far more applications.</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1.5, mb: 2 }}>
        {media.map((m, i) => (
          <Box key={m.id} sx={{ border: "1px solid", borderColor: m.isCover ? "primary.main" : "divider", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ aspectRatio: "1", bgcolor: "action.hover" }}>
              {m.type === "VIDEO" ? (
                <video src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={`${pet.name} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", p: 0.25 }}>
              <Tooltip title={m.isCover ? "Cover" : "Make cover"}>
                <span>
                  <IconButton size="small" aria-label="Make cover" disabled={m.isCover || m.type === "VIDEO"} onClick={() => runMutation(cover({ id: pet.id, mediaId: m.id }))}>
                    {m.isCover ? <StarIcon fontSize="small" color="primary" /> : <StarBorderIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
              <Box>
                <IconButton size="small" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label="Move later" disabled={i === media.length - 1} onClick={() => move(i, 1)}>
                  <ArrowForwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" aria-label="Delete" onClick={() => runMutation(remove({ id: pet.id, mediaId: m.id }), "Removed.")}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
      <Button component="label" variant="outlined" size="small" disabled={busy || full}>
        {busy ? "Uploading..." : full ? "Plan limit reached" : "Add photos or video"}
        <input hidden type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
      </Button>
    </Box>
  );
};

type FeeRow = { label: string; amount: string; note: string };

const FeesTab = ({ petId }: { petId: string }) => {
  const fees = useGetListingFeesQuery(petId);
  const [save, { isLoading }] = useSaveListingFeesMutation();
  const [rows, setRows] = useState<FeeRow[]>([]);
  const currency: string = fees.data?.currency ?? "BDT";

  useEffect(() => {
    if (fees.data) setRows((fees.data.fees ?? []).map((f: any) => ({ label: f.label, amount: String(f.amount / 100), note: f.note ?? "" })));
  }, [fees.data]);

  const setRow = (i: number, patch: Partial<FeeRow>) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const valid = rows.every((r) => r.label.trim() && Number.isFinite(Number(r.amount)) && Number(r.amount) >= 0);
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const submit = () =>
    runMutation(
      save({ id: petId, fees: rows.map((r) => ({ label: r.label.trim(), amount: Math.round(Number(r.amount) * 100), ...(r.note.trim() ? { note: r.note.trim() } : {}) })) }),
      "Costs saved."
    );

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Itemise what an adopter pays (vaccinations, neutering, rehoming fee). Amounts are in {currency}; shown on the pet page and in the cost calculator.
      </Typography>
      <Box sx={{ display: "grid", gap: 1.5 }}>
        {rows.map((r, i) => (
          <Box key={i} sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr 110px 40px", sm: "1.2fr 130px 1fr 40px" }, alignItems: "center" }}>
            <TextField size="small" label="Item" value={r.label} onChange={(e) => setRow(i, { label: e.target.value.slice(0, 80) })} />
            <TextField size="small" label={currency} type="number" inputProps={{ min: 0 }} value={r.amount} onChange={(e) => setRow(i, { amount: e.target.value })} />
            <TextField size="small" label="Note" value={r.note} onChange={(e) => setRow(i, { note: e.target.value.slice(0, 200) })} sx={{ display: { xs: "none", sm: "block" } }} />
            <IconButton aria-label="Remove fee" onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}>
              <DeleteOutlineIcon />
            </IconButton>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "flex", gap: 1, mt: 2, alignItems: "center", flexWrap: "wrap" }}>
        <Button size="small" variant="outlined" disabled={rows.length >= 20} onClick={() => setRows((rs) => [...rs, { label: "", amount: "0", note: "" }])}>
          Add item
        </Button>
        <Button size="small" disabled={!valid || isLoading} onClick={submit}>
          Save costs
        </Button>
        <Typography variant="body2" color="text.secondary">
          Total: {total.toFixed(2)} {currency}
        </Typography>
      </Box>
    </Box>
  );
};

export default ListingEditor;
