"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Chip, Container, InputAdornment, Rating, Skeleton, TextField, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedIcon from "@mui/icons-material/Verified";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PageHeader from "@/components/Shared/PageHeader";
import { previewPets, previewShelters, unsplash } from "@/mock/pets";
import { UiShelter, fetchPublic, normalizeShelter } from "@/lib/apiData";

const fallbackCover = unsplash("1583337130417-3346a1be7dee", 900);

//* Preview directory, used only when the API is unreachable
const previewList = (): UiShelter[] =>
  previewShelters.map((s) => ({
    ...s,
    apiId: s.id,
    petsCount: previewPets.filter((p) => p.shelterId === s.id).length,
  }));

//* Shelter & rescue directory (GET /shelters: verified organisations for the public, searchable)
const SheltersPage = () => {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [shelters, setShelters] = useState<UiShelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(false);

  //* debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setTerm(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPublic<any[]>(`/shelters?limit=60${term ? `&searchTerm=${encodeURIComponent(term)}` : ""}`).then((res) => {
      if (!active) return;
      if (res === "offline") {
        setPreview(true);
        const t = term.toLowerCase();
        setShelters(previewList().filter((s) => !t || `${s.name} ${s.city}`.toLowerCase().includes(t)));
      } else {
        setPreview(false);
        setShelters((res?.data ?? []).map(normalizeShelter));
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [term]);

  const list = useMemo(() => shelters.filter((s) => !verifiedOnly || s.verified), [shelters, verifiedOnly]);

  return (
    <>
      <PageHeader
        title="Shelters &"
        highlight="Rescues"
        crumbs={[{ label: "Shelters & Rescues" }]}
        subtitle="Find verified shelters, rescues and owners near you, see their pets and get in touch."
        image={unsplash("1583337130417-3346a1be7dee", 600)}
      >
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or city"
            size="small"
            sx={{ minWidth: { xs: "100%", sm: 360 }, "& .MuiOutlinedInput-root": { borderRadius: 999 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" />
                </InputAdornment>
              ),
            }}
            inputProps={{ "aria-label": "Search shelters" }}
          />
          <Chip
            icon={<VerifiedIcon />}
            label="Verified only"
            clickable
            color={verifiedOnly ? "primary" : "default"}
            variant={verifiedOnly ? "filled" : "outlined"}
            onClick={() => setVerifiedOnly((v) => !v)}
            aria-pressed={verifiedOnly}
          />
        </Box>
      </PageHeader>

      <Container sx={{ py: { xs: 4, md: 6 } }}>
        {preview && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
            Showing preview shelters while the shelter service is offline.
          </Alert>
        )}
        <Typography color="text.secondary" sx={{ fontWeight: 600, mb: 3 }}>
          {loading ? "Searching…" : `${list.length} ${list.length === 1 ? "organisation" : "organisations"}`}
        </Typography>
        {!loading && list.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8, bgcolor: "var(--pf-soft)", borderRadius: 4 }}>
            <Typography variant="h6">No shelters match your search</Typography>
          </Box>
        )}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 3 }}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={300} sx={{ borderRadius: 4 }} />)
            : list.map((s, i) => (
                <Box
                  key={s.apiId}
                  component={Link}
                  href={`/shelters/${s.id}`}
                  className="pf-fade-up pf-lift"
                  style={{ animationDelay: `${i * 0.08}s` }}
                  sx={{
                    bgcolor: "background.paper",
                    borderRadius: 4,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                    "& img": { transition: "transform .6s ease" },
                    "&:hover img": { transform: "scale(1.06)" },
                  }}
                >
                  <Box sx={{ position: "relative", height: 170, bgcolor: "var(--pf-sand)" }}>
                    <Image src={s.image || fallbackCover} alt="" fill sizes="(max-width: 600px) 100vw, 33vw" style={{ objectFit: "cover" }} />
                    {s.verified && (
                      <Chip
                        icon={<VerifiedIcon sx={{ color: "common.white !important" }} />}
                        label="Verified"
                        size="small"
                        sx={{ position: "absolute", top: 12, left: 12, bgcolor: "primary.main", color: "common.white" }}
                      />
                    )}
                  </Box>
                  <Box sx={{ p: 2.5 }}>
                    <Typography variant="h6">{s.name}</Typography>
                    {s.city && (
                      <Typography color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                        <LocationOnOutlinedIcon fontSize="small" /> {s.city}
                      </Typography>
                    )}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                      <Rating value={s.rating} precision={0.1} readOnly size="small" />
                      <Typography variant="body2" color="text.secondary">
                        {s.reviews ? `${s.rating.toFixed(1)} (${s.reviews})` : "No reviews yet"}
                      </Typography>
                    </Box>
                    <Typography sx={{ mt: 1.5, color: "primary.main", fontWeight: 700 }}>
                      {s.petsCount} {s.petsCount === 1 ? "pet" : "pets"} available →
                    </Typography>
                  </Box>
                </Box>
              ))}
        </Box>
      </Container>
    </>
  );
};

export default SheltersPage;
