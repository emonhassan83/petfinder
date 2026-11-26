"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, InputAdornment, MenuItem, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";

const breedsBySpecies: Record<string, string[]> = {
  Dog: ["Labrador", "Golden Retriever", "Beagle", "Corgi", "Pug", "Mixed"],
  Cat: ["Persian", "Siamese", "Maine Coon", "Tabby", "Mixed"],
  Rabbit: ["Holland Lop", "Mini Rex", "Mixed"],
};

const fieldSx = {
  "& .MuiOutlinedInput-root": { borderRadius: "10px", fontWeight: 600 },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main", borderWidth: 1.5 },
};

const HeroSearch = () => {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set("searchTerm", location.trim());
    if (species) params.set("species", species);
    if (breed) params.set("breed", breed);
    const qs = params.toString();
    router.push(qs ? `/pets?${qs}` : "/pets");
  };

  const breeds = species ? breedsBySpecies[species] : Object.values(breedsBySpecies).flat().filter((b, i, a) => a.indexOf(b) === i);

  return (
    <Box
      component="form"
      onSubmit={submit}
      role="search"
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", md: "1.4fr 1fr 1fr auto" },
        gap: { xs: 1.5, md: 2 },
        alignItems: "center",
        bgcolor: "background.paper",
        borderRadius: 4,
        p: { xs: 2, md: 2.5 },
        boxShadow: "var(--pf-shadow)",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <TextField
        size="small"
        placeholder="City or area"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        inputProps={{ "aria-label": "Location" }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LocationOnOutlinedIcon fontSize="small" color="primary" />
            </InputAdornment>
          ),
        }}
        sx={{ ...fieldSx, gridColumn: { xs: "1 / -1", md: "auto" } }}
      />
      <TextField
        select
        size="small"
        label="Type of pet"
        value={species}
        onChange={(e) => {
          setSpecies(e.target.value);
          setBreed("");
        }}
        sx={fieldSx}
      >
        <MenuItem value="">Any</MenuItem>
        {Object.keys(breedsBySpecies).map((s) => (
          <MenuItem key={s} value={s}>
            {s}
          </MenuItem>
        ))}
      </TextField>
      <TextField select size="small" label="Breed" value={breed} onChange={(e) => setBreed(e.target.value)} sx={fieldSx}>
        <MenuItem value="">Any</MenuItem>
        {breeds.map((b) => (
          <MenuItem key={b} value={b}>
            {b}
          </MenuItem>
        ))}
      </TextField>
      <Button
        type="submit"
        startIcon={<SearchIcon />}
        sx={{ gridColumn: { xs: "1 / -1", md: "auto" }, justifySelf: { xs: "center", md: "stretch" }, px: 4, py: 1 }}
      >
        Search
      </Button>
    </Box>
  );
};

export default HeroSearch;
