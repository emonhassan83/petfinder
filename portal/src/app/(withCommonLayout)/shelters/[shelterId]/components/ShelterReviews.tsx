"use client";

import { useState } from "react";
import { Avatar, Box, Button, Rating, Skeleton, Typography } from "@mui/material";
import { usePubGetShelterReviewsQuery } from "@/redux/api/shelterPublicApi";

const PAGE = 5;

//* Public reviews from adopters: GET /shelters/:shelterId/reviews (uuid, not slug)
const ShelterReviews = ({ shelterId }: { shelterId: string }) => {
  const [limit, setLimit] = useState(PAGE);
  const { data, isLoading, isFetching, isError } = usePubGetShelterReviewsQuery({ shelterId, limit });
  const items = data?.items ?? [];
  const total = data?.meta?.total ?? 0;

  if (isLoading) return <Skeleton variant="rounded" height={110} sx={{ borderRadius: 3 }} />;
  if (isError) return <Typography color="text.secondary">Reviews could not be loaded right now.</Typography>;
  if (!items.length) return <Typography color="text.secondary">No reviews yet. Reviews appear after a completed adoption.</Typography>;

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      {items.map((r: any) => (
        <Box key={r.id} sx={{ p: 2.5, borderRadius: 3, bgcolor: "var(--pf-soft)", border: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Avatar src={r.author?.profilePhoto || undefined} sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}>
              {(r.author?.name || "A")[0]}
            </Avatar>
            <Typography sx={{ fontWeight: 700 }}>{r.author?.name || "Adopter"}</Typography>
            <Rating value={r.rating} readOnly size="small" />
            <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
              {new Date(r.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
            </Typography>
          </Box>
          {r.comment && (
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {r.comment}
            </Typography>
          )}
        </Box>
      ))}
      {items.length < total && (
        <Button variant="outlined" onClick={() => setLimit((l) => l + PAGE)} disabled={isFetching} sx={{ justifySelf: "start" }}>
          Show more reviews
        </Button>
      )}
    </Box>
  );
};

export default ShelterReviews;
