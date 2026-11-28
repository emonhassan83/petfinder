"use client";

import { useState } from "react";
import { Box, Button, Card, Chip, Typography } from "@mui/material";
import Image from "next/image";
import { toast } from "sonner";
import ReasonDialog from "@/components/Shared/ReasonDialog";
import { storySubmissions, StoryStatus, StorySubmission } from "@/mock/stories";

const statusColor: Record<StoryStatus, "default" | "warning" | "success" | "error"> = { DRAFT: "default", PENDING: "warning", PUBLISHED: "success", REJECTED: "error" };

//* Success-story moderation queue. Approve publishes; reject requires a note sent back to the shelter (audit-logged in Phase 3e).
const AdminStoriesPage = () => {
  const [items, setItems] = useState<StorySubmission[]>(storySubmissions);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [filter, setFilter] = useState<StoryStatus | "">("PENDING");

  const update = (id: string, patch: Partial<StorySubmission>) => setItems((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const list = items.filter((s) => !filter || s.status === filter);
  const pendingCount = items.filter((s) => s.status === "PENDING").length;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Success stories
      </Typography>

      <Box role="radiogroup" aria-label="Filter by status" sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
        {([["PENDING", `In review (${pendingCount})`], ["PUBLISHED", "Published"], ["REJECTED", "Changes requested"], ["", "All"]] as const).map(([v, l]) => (
          <Chip key={l} role="radio" aria-checked={filter === v} label={l} clickable onClick={() => setFilter(v)} color={filter === v ? "primary" : "default"} variant={filter === v ? "filled" : "outlined"} />
        ))}
      </Box>

      <Box sx={{ display: "grid", gap: 2, maxWidth: 900 }}>
        {list.length === 0 && <Typography color="text.secondary">Nothing here.</Typography>}
        {list.map((s) => (
          <Card key={s.id} sx={{ p: 2.5, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "140px 1fr" }, gap: 2.5 }}>
            <Box sx={{ position: "relative", aspectRatio: "1", borderRadius: 3, overflow: "hidden", bgcolor: "var(--pf-sand)" }}>
              {s.image && <Image src={s.image} alt={s.petName} fill sizes="140px" style={{ objectFit: "cover" }} />}
            </Box>
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                <Typography fontWeight={700} sx={{ fontSize: 17 }}>{s.title}</Typography>
                <Chip size="small" label={s.status} color={statusColor[s.status]} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {s.petName} · {s.shelter} · submitted {s.submitted}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>{s.excerpt}</Typography>
              {s.note && <Typography variant="body2" sx={{ mt: 1, color: "error.main" }}>Note to shelter: {s.note}</Typography>}
              {s.status === "PENDING" && (
                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <Button size="small" onClick={() => { update(s.id, { status: "PUBLISHED", note: undefined }); toast.success("Story published (preview)."); }}>
                    Approve & publish
                  </Button>
                  <Button size="small" color="inherit" variant="outlined" onClick={() => setRejecting(s.id)}>
                    Request changes
                  </Button>
                </Box>
              )}
              {s.status === "PUBLISHED" && (
                <Button size="small" color="inherit" variant="text" sx={{ mt: 1.5 }} onClick={() => setRejecting(s.id)}>
                  Unpublish
                </Button>
              )}
            </Box>
          </Card>
        ))}
      </Box>

      <ReasonDialog
        open={!!rejecting}
        title="Note to the shelter"
        onClose={() => setRejecting(null)}
        onConfirm={(note) => {
          if (rejecting) update(rejecting, { status: "REJECTED", note });
          setRejecting(null);
          toast.success("Shelter notified (preview).");
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
        Preview data.
      </Typography>
    </Box>
  );
};

export default AdminStoriesPage;
