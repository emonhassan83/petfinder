"use client";

import { useMemo, useState } from "react";
import { Box, Chip, Container, InputAdornment, Rating, TextField, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import SearchIcon from "@mui/icons-material/Search";
import VerifiedIcon from "@mui/icons-material/Verified";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PageHeader from "@/components/Shared/PageHeader";
import { previewPets, previewShelters, unsplash } from "@/mock/pets";

//* Shelter & rescue directory (preview data until the shelters API lands in Phase 3b)
const SheltersPage = () => {
  const [q, setQ] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return previewShelters.filter((s) => (!verifiedOnly || s.verified) && (!t || `${s.name} ${s.city}`.toLowerCase().includes(t)));
  }, [q, verifiedOnly]);

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
        <Typography color="text.secondary" sx={{ fontWeight: 600, mb: 3 }}>
          {list.length} {list.length === 1 ? "organisation" : "organisations"}
        </Typography>
        {list.length === 0 && (
          <Box sx={{ textAlign: "center", py: 8, bgcolor: "var(--pf-soft)", borderRadius: 4 }}>
            <Typography variant="h6">No shelters match your search</Typography>
          </Box>
        )}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 3 }}>
          {list.map((s, i) => {
            const count = previewPets.filter((p) => p.shelterId === s.id).length;
            return (
              <Box
                key={s.id}
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
                <Box sx={{ position: "relative", height: 170 }}>
                  <Image src={s.image} alt="" fill sizes="(max-width: 600px) 100vw, 33vw" style={{ objectFit: "cover" }} />
                  {s.verified && (
                    <Chip
                      icon={<VerifiedIcon sx={{ color: "#fff !important" }} />}
                      label="Verified"
                      size="small"
                      sx={{ position: "absolute", top: 12, left: 12, bgcolor: "primary.main", color: "#fff" }}
                    />
                  )}
                </Box>
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="h6">{s.name}</Typography>
                  <Typography color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <LocationOnOutlinedIcon fontSize="small" /> {s.city}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                    <Rating value={s.rating} precision={0.1} readOnly size="small" />
                    <Typography variant="body2" color="text.secondary">
                      {s.rating} ({s.reviews})
                    </Typography>
                  </Box>
                  <Typography sx={{ mt: 1.5, color: "primary.main", fontWeight: 700 }}>
                    {count} {count === 1 ? "pet" : "pets"} available →
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
    </>
  );
};

export default SheltersPage;
