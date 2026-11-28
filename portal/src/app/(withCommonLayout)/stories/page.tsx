"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Chip, Container, IconButton, Skeleton, Typography } from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import Image from "next/image";
import Link from "next/link";
import Meta from "@/components/Meta/MetaData";
import PageHeader from "@/components/Shared/PageHeader";
import Lightbox from "@/components/UI/Lightbox";
import { successStories } from "@/mock/stories";
import { UiStory, fetchPublic, normalizeStory } from "@/lib/apiData";

const filters = [
  { label: "All stories", value: "" },
  { label: "Dogs", value: "Dog" },
  { label: "Cats", value: "Cat" },
  { label: "Small pets", value: "Rabbit" },
];

//* Varying photo heights give the masonry rhythm
const ratios = ["4 / 5", "1 / 1", "4 / 3", "3 / 4", "4 / 4.6", "5 / 4"];

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

//* Success-stories lookbook: masonry grid, species filter, lightbox (Pawvelle lookbook pattern)
const StoriesPage = () => {
  const [species, setSpecies] = useState("");
  const [viewer, setViewer] = useState<number | null>(null);
  const [list, setList] = useState<UiStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);

  //* GET /success-stories (published only); preview stories only when the API is unreachable
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPublic<any[]>(`/success-stories?limit=60${species ? `&species=${encodeURIComponent(species)}` : ""}`).then((res) => {
      if (!active) return;
      if (res === "offline") {
        setPreview(true);
        setList(successStories.filter((s) => !species || s.species === species));
      } else {
        setPreview(false);
        setList((res?.data ?? []).map(normalizeStory));
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [species]);

  return (
    <>
      <Meta title="Success stories | Petfinder" description="Real adoption stories from families and verified shelters." />
      <PageHeader
        title="Happy tails from"
        highlight="real families"
        crumbs={[{ label: "Success stories" }]}
        subtitle="Every story here started with a search, a visit and an application. Shelters share them after an adoption is complete; our team reviews each one before it goes live."
      />

      <Container sx={{ py: { xs: 4, md: 6 } }}>
        <Box role="radiogroup" aria-label="Filter stories" sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 4 }}>
          {filters.map((f) => (
            <Chip
              key={f.label}
              role="radio"
              aria-checked={species === f.value}
              label={f.label}
              clickable
              onClick={() => setSpecies(f.value)}
              color={species === f.value ? "primary" : "default"}
              variant={species === f.value ? "filled" : "outlined"}
              sx={{ fontWeight: 700, fontSize: 15, height: 38, px: 1 }}
            />
          ))}
        </Box>

        {preview && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
            Showing preview stories while the story service is offline.
          </Alert>
        )}

        {loading ? (
          <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3 }, columnGap: 3 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={i % 2 ? 320 : 260} sx={{ mb: 3, borderRadius: "var(--pf-radius-card)", breakInside: "avoid" }} />
            ))}
          </Box>
        ) : list.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 8, textAlign: "center" }}>
            No stories in this category yet.
          </Typography>
        ) : (
          <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3 }, columnGap: 3 }}>
            {list.map((s, i) => (
              <Box
                key={s.id}
                component="article"
                className="pf-fade-up pf-lift"
                style={{ animationDelay: `${i * 0.06}s` }}
                sx={{ breakInside: "avoid", mb: 3, bgcolor: "background.paper", borderRadius: "var(--pf-radius-card)", overflow: "hidden", border: "1px solid", borderColor: "divider", "& img": { transition: "transform .6s cubic-bezier(0.22, 1, 0.36, 1)" }, "&:hover img": { transform: "scale(1.05)" } }}
              >
                <Box sx={{ position: "relative", aspectRatio: ratios[i % ratios.length], overflow: "hidden" }}>
                  <Link href={`/stories/${s.id}`} aria-label={`Read ${s.petName}'s story`}>
                    <Image src={s.image} alt={s.petName} fill sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 33vw" style={{ objectFit: "cover" }} />
                  </Link>
                  <IconButton
                    aria-label={`View ${s.petName}'s photo`}
                    onClick={() => setViewer(i)}
                    sx={{ position: "absolute", right: 12, top: 12, bgcolor: "background.paper", "&:hover": { bgcolor: "background.paper" } }}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box component={Link} href={`/stories/${s.id}`} sx={{ display: "block", p: 2.5 }}>
                  <Typography variant="overline" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                    {[s.petName, s.city, s.adoptedOn ? formatDate(s.adoptedOn) : ""].filter(Boolean).join(" · ")}
                  </Typography>
                  <Typography variant="h5" component="h2" sx={{ fontSize: 22, lineHeight: 1.25, mt: 0.5 }}>
                    {s.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1, fontSize: 15, lineHeight: 1.6 }}>
                    {s.excerpt}
                  </Typography>
                  <Typography sx={{ mt: 1.5, fontWeight: 700, color: "primary.main" }}>Read the story →</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Container>

      <Lightbox images={list.map((s) => ({ src: s.image, alt: s.petName, caption: s.family ? `${s.petName} with ${s.family}` : s.petName }))} index={viewer} onChange={setViewer} />
    </>
  );
};

export default StoriesPage;
