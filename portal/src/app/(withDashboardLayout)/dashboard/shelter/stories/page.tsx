"use client";

import { useEffect, useState } from "react";
import { Box, Button, Card, Chip, MenuItem, TextField, Typography } from "@mui/material";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import Image from "next/image";
import { toast } from "sonner";
import { storySubmissions, StoryStatus, StorySubmission } from "@/mock/stories";
import { mockListings } from "@/mock/shelter";

const statusColor: Record<StoryStatus, "default" | "warning" | "success" | "error"> = { DRAFT: "default", PENDING: "warning", PUBLISHED: "success", REJECTED: "error" };
const statusLabel: Record<StoryStatus, string> = { DRAFT: "Draft", PENDING: "In review", PUBLISHED: "Published", REJECTED: "Changes requested" };

//* Local photo picker with preview (upload API arrives with media in Phase 3b)
const PhotoPick = ({ label, file, onPick }: { label: string; file: File | null; onPick: (f: File | null) => void }) => {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    if (!file) return setUrl("");
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <Box component="label" sx={{ position: "relative", display: "grid", placeItems: "center", aspectRatio: "4 / 3", borderRadius: 3, border: "2px dashed", borderColor: "divider", cursor: "pointer", overflow: "hidden", color: "text.secondary", textAlign: "center", "&:hover": { borderColor: "primary.main" } }}>
      {url ? (
        <Image src={url} alt={label} fill unoptimized style={{ objectFit: "cover" }} />
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

//* Shelter/owner success stories: submit for review, see status and moderator notes
const ShelterStoriesPage = () => {
  const [items, setItems] = useState<StorySubmission[]>(storySubmissions.filter((s) => s.shelter === "Happy Paws Shelter"));
  const [pet, setPet] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [before, setBefore] = useState<File | null>(null);
  const [after, setAfter] = useState<File | null>(null);
  const valid = pet && title.trim().length >= 8 && text.trim().length >= 40 && after;

  const submit = () => {
    setItems((prev) => [
      { id: `ss-${Date.now()}`, petName: pet, shelter: "Happy Paws Shelter", title: title.trim(), excerpt: text.trim(), image: "", submitted: new Date().toISOString().slice(0, 10), status: "PENDING" },
      ...prev,
    ]);
    setPet("");
    setTitle("");
    setText("");
    setBefore(null);
    setAfter(null);
    toast.success("Story sent for review (preview). We'll let you know when it's live.");
  };

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
          <Typography variant="h6" sx={{ mb: 2 }}>Share a story</Typography>
          <Box sx={{ display: "grid", gap: 2 }}>
            <TextField select size="small" label="Pet" value={pet} onChange={(e) => setPet(e.target.value)}>
              {mockListings.map((l) => (
                <MenuItem key={l.id} value={l.name}>{l.name} · {l.breed}</MenuItem>
              ))}
            </TextField>
            <TextField size="small" label="Title" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 90))} helperText="At least 8 characters" />
            <TextField multiline minRows={4} label="The story" value={text} onChange={(e) => setText(e.target.value.slice(0, 2000))} helperText={`${text.length}/2000 · at least 40 characters`} />
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <PhotoPick label="Rescue-day photo (optional)" file={before} onPick={setBefore} />
              <PhotoPick label="Photo now (required)" file={after} onPick={setAfter} />
            </Box>
            <Typography variant="caption" color="text.secondary">
              Only share photos of adopters with their permission. JPG, PNG or WebP.
            </Typography>
            <Button onClick={submit} disabled={!valid}>Submit for review</Button>
          </Box>
        </Card>

        <Card sx={{ p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Your stories</Typography>
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {items.map((s) => (
              <Box key={s.id} sx={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 2, p: 1.5, borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ position: "relative", width: 72, height: 72, borderRadius: 2, overflow: "hidden", bgcolor: "var(--pf-sand)" }}>
                  {s.image && <Image src={s.image} alt={s.petName} fill sizes="72px" style={{ objectFit: "cover" }} />}
                </Box>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                    <Typography fontWeight={700}>{s.title}</Typography>
                    <Chip size="small" label={statusLabel[s.status]} color={statusColor[s.status]} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">{s.petName} · submitted {s.submitted}</Typography>
                  {s.note && (
                    <Typography variant="body2" sx={{ mt: 0.75, color: "error.main" }}>
                      Moderator: {s.note}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default ShelterStoriesPage;
