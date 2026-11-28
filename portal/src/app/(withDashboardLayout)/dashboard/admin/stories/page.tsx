"use client";

import { useState } from "react";
import { Box, Button, Card, Chip, Typography } from "@mui/material";
import ReasonDialog from "@/components/Shared/ReasonDialog";
import QueryState from "@/components/Dashboard/Common/QueryState";
import { useAdminGetStoriesQuery, useAdminModerateStoryMutation } from "@/redux/api/storyDashApi";
import { fmtDate, runMutation } from "@/utils/dashboardHelpers";

type StoryStatus = "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
const statusColor: Record<StoryStatus, "default" | "warning" | "success" | "error"> = { DRAFT: "default", PENDING: "warning", PUBLISHED: "success", REJECTED: "error" };

//* Success-story moderation queue. Approve publishes; reject/unpublish requires a note sent back to the shelter (audit-logged).
const AdminStoriesPage = () => {
  const [filter, setFilter] = useState<StoryStatus | "">("PENDING");
  const [rejecting, setRejecting] = useState<any>(null);
  const { data, isLoading, error } = useAdminGetStoriesQuery(filter ? { status: filter } : {});
  const [moderate, { isLoading: saving }] = useAdminModerateStoryMutation();
  const items: any[] = data?.items ?? [];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Success stories
      </Typography>

      <Box role="radiogroup" aria-label="Filter by status" sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
        {([["PENDING", "In review"], ["PUBLISHED", "Published"], ["REJECTED", "Changes requested"], ["", "All"]] as const).map(([v, l]) => (
          <Chip key={l} role="radio" aria-checked={filter === v} label={l} clickable onClick={() => setFilter(v)} color={filter === v ? "primary" : "default"} variant={filter === v ? "filled" : "outlined"} />
        ))}
      </Box>

      <QueryState isLoading={isLoading} error={error}>
        <Box sx={{ display: "grid", gap: 2, maxWidth: 900 }}>
          {items.length === 0 && <Typography color="text.secondary">Nothing here.</Typography>}
          {items.map((s) => {
            const image = s.afterImage || s.media?.[0]?.url;
            return (
              <Card key={s.id} sx={{ p: 2.5, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "140px 1fr" }, gap: 2.5 }}>
                <Box sx={{ aspectRatio: "1", borderRadius: 3, overflow: "hidden", bgcolor: "var(--pf-sand)" }}>
                  {image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt={s.pet?.name ?? s.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </Box>
                <Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                    <Typography fontWeight={700} sx={{ fontSize: 17 }}>
                      {s.title}
                    </Typography>
                    <Chip size="small" label={s.status} color={statusColor[s.status as StoryStatus]} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {s.pet?.name ? `${s.pet.name} · ` : ""}
                    {s.shelter?.name} · submitted {fmtDate(s.createdAt)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.6 }}>
                    {s.excerpt || (s.body ?? "").slice(0, 220)}
                  </Typography>
                  {s.moderationNote && (
                    <Typography variant="body2" sx={{ mt: 1, color: "error.main" }}>
                      Note to shelter: {s.moderationNote}
                    </Typography>
                  )}
                  {s.status === "PENDING" && (
                    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                      <Button size="small" disabled={saving} onClick={() => runMutation(moderate({ id: s.id, status: "PUBLISHED" }), "Story published.")}>
                        Approve &amp; publish
                      </Button>
                      <Button size="small" color="inherit" variant="outlined" onClick={() => setRejecting(s)}>
                        Request changes
                      </Button>
                    </Box>
                  )}
                  {s.status === "PUBLISHED" && (
                    <Button size="small" color="inherit" variant="text" sx={{ mt: 1.5 }} onClick={() => setRejecting(s)}>
                      Unpublish
                    </Button>
                  )}
                </Box>
              </Card>
            );
          })}
        </Box>
      </QueryState>

      <ReasonDialog
        open={!!rejecting}
        title="Note to the shelter"
        onClose={() => setRejecting(null)}
        onConfirm={async (note) => {
          const r = await runMutation(moderate({ id: rejecting.id, status: "REJECTED", moderationNote: note }), "Shelter notified.");
          if (r.ok) setRejecting(null);
        }}
      />
    </Box>
  );
};

export default AdminStoriesPage;
