"use client";

import { useEffect, useState } from "react";
import { Box, Button, Card, Checkbox, Chip, FormControlLabel, MenuItem, TextField, Typography } from "@mui/material";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import QueryState from "@/components/Dashboard/Common/QueryState";
import { useGetMyListingsQuery, useUploadImageMutation } from "@/redux/api/listingApi";
import { useCreateStoryMutation, useGetMyStoriesQuery, useUpdateStoryMutation } from "@/redux/api/storyDashApi";
import { fmtDate, runMutation } from "@/utils/dashboardHelpers";

type StoryStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
const statusColor: Record<StoryStatus, "default" | "warning" | "success" | "error"> = { DRAFT: "default", PENDING: "warning", PUBLISHED: "success", REJECTED: "error" };
const statusLabel: Record<StoryStatus, string> = { DRAFT: "Draft", PENDING: "In review", PUBLISHED: "Published", REJECTED: "Changes requested" };

//* Photo picker: shows a local preview of a new file, or the stored URL when editing
const PhotoPick = ({ label, file, url: stored, onPick }: { label: string; file: File | null; url?: string; onPick: (f: File | null) => void }) => {
  const [local, setLocal] = useState("");
  useEffect(() => {
    if (!file) return setLocal("");
    const u = URL.createObjectURL(file);
    setLocal(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  const src = local || stored;

  return (
    <Box component="label" sx={{ position: "relative", display: "grid", placeItems: "center", aspectRatio: "4 / 3", borderRadius: 3, border: "2px dashed", borderColor: "divider", cursor: "pointer", overflow: "hidden", color: "text.secondary", textAlign: "center", "&:hover": { borderColor: "primary.main" } }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <Box>
          <AddPhotoAlternateOutlinedIcon />
          <Typography variant="body2">{label}</Typography>
        </Box>
      )}
      <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
    </Box>
  );
};

const empty = { petId: "", title: "", body: "", consent: false };

//* Shelter/owner success stories: submit for review, see status and moderator notes
const ShelterStoriesPage = () => {
  const stories = useGetMyStoriesQuery({});
  const listings = useGetMyListingsQuery();
  const [upload] = useUploadImageMutation();
  const [create, { isLoading: creating }] = useCreateStoryMutation();
  const [update, { isLoading: updating }] = useUpdateStoryMutation();

  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(empty);
  const [before, setBefore] = useState<File | null>(null);
  const [after, setAfter] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const hasAfter = !!after || !!editing?.afterImage;
  const valid = form.title.trim().length >= 3 && form.body.trim().length >= 20 && hasAfter && form.consent;

  const reset = () => {
    setEditing(null);
    setForm(empty);
    setBefore(null);
    setAfter(null);
  };

  const edit = (s: any) => {
    setEditing(s);
    setForm({ petId: s.petId ?? "", title: s.title, body: s.body, consent: false });
    setBefore(null);
    setAfter(null);
  };

  const uploadOne = async (file: File | null): Promise<string | undefined | null> => {
    if (!file) return undefined;
    const r = await runMutation(upload(file));
    return r.ok ? (r.data?.url as string) : null;
  };

  const submit = async (draft: boolean) => {
    setBusy(true);
    try {
      const beforeUrl = await uploadOne(before);
      const afterUrl = await uploadOne(after);
      if (beforeUrl === null || afterUrl === null) return; //* upload failed, toast already shown
      const body: Record<string, any> = {
        title: form.title.trim(),
        body: form.body.trim(),
        consentConfirmed: form.consent,
        draft,
        ...(form.petId ? { petId: form.petId } : {}),
        ...(beforeUrl ? { beforeImage: beforeUrl } : {}),
        ...(afterUrl ? { afterImage: afterUrl } : {}),
      };
      const r = editing
        ? await runMutation(update({ id: editing.id, body }), draft ? "Draft saved." : "Story sent for review.")
        : await runMutation(create(body), draft ? "Draft saved." : "Story sent for review. We will let you know when it is live.");
      if (r.ok) reset();
    } finally {
      setBusy(false);
    }
  };

  const items: any[] = stories.data?.items ?? [];
  const pets: any[] = listings.data?.items ?? [];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Success stories
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Share how an adoption turned out. Our team reviews every story before it appears on the public stories page.
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1.1fr" }, gap: 3, alignItems: "start" }}>
        <Card sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {editing ? "Edit story" : "Share a story"}
          </Typography>
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField select size="small" label="Pet (optional)" value={form.petId} onChange={(e) => setForm({ ...form, petId: e.target.value })}>
              <MenuItem value="">None</MenuItem>
              {pets.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.name} · {l.breed || l.species}
                </MenuItem>
              ))}
            </TextField>
            <TextField size="small" label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value.slice(0, 150) })} helperText="At least 3 characters" />
            <TextField multiline minRows={4} label="The story" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value.slice(0, 10000) })} helperText={`${form.body.length}/10000 · at least 20 characters`} />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <PhotoPick label="Rescue-day photo (optional)" file={before} url={editing?.beforeImage} onPick={setBefore} />
              <PhotoPick label="Photo now (required)" file={after} url={editing?.afterImage} onPick={setAfter} />
            </Box>
            <FormControlLabel
              control={<Checkbox checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />}
              label="I have the adopter's permission to share this story and these photos."
            />
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button onClick={() => submit(false)} disabled={!valid || busy || creating || updating}>
                Submit for review
              </Button>
              <Button variant="outlined" color="inherit" onClick={() => submit(true)} disabled={form.title.trim().length < 3 || form.body.trim().length < 20 || busy}>
                Save draft
              </Button>
              {editing && (
                <Button variant="text" color="inherit" onClick={reset}>
                  Cancel edit
                </Button>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">
              JPG, PNG or WebP. Photos are uploaded when you save.
            </Typography>
          </Box>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Your stories
          </Typography>
          <QueryState isLoading={stories.isLoading} error={stories.error}>
            {items.length === 0 && <Typography color="text.secondary">No stories yet.</Typography>}
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {items.map((s) => {
                const image = s.afterImage || s.media?.[0]?.url;
                return (
                  <Box key={s.id} sx={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 2, p: 1.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                    <Box sx={{ width: 72, height: 72, borderRadius: 2, overflow: "hidden", bgcolor: "var(--pf-sand)" }}>
                      {image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      )}
                    </Box>
                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                        <Typography fontWeight={700}>{s.title}</Typography>
                        <Chip size="small" label={statusLabel[s.status as StoryStatus]} color={statusColor[s.status as StoryStatus]} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {s.pet?.name ? `${s.pet.name} · ` : ""}submitted {fmtDate(s.createdAt)}
                      </Typography>
                      {s.moderationNote && (
                        <Typography variant="body2" sx={{ mt: 0.75, color: "error.main" }}>
                          Moderator: {s.moderationNote}
                        </Typography>
                      )}
                      {(s.status === "DRAFT" || s.status === "REJECTED") && (
                        <Button size="small" variant="text" sx={{ mt: 0.5, px: 0 }} onClick={() => edit(s)}>
                          Edit &amp; resubmit
                        </Button>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </QueryState>
        </Card>
      </Box>
    </Box>
  );
};

export default ShelterStoriesPage;
