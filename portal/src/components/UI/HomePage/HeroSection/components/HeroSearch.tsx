"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, InputBase } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const HeroSearch = () => {
  const router = useRouter();
  const [term, setTerm] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    router.push(q ? `/pets?searchTerm=${encodeURIComponent(q)}` : "/pets");
  };

  return (
    <Box
      component="form"
      onSubmit={submit}
      role="search"
      sx={{
        display: "flex",
        alignItems: "center",
        bgcolor: "#fff",
        borderRadius: 999,
        p: 0.75,
        pl: 2.5,
        maxWidth: 520,
        boxShadow: 1,
      }}
    >
      <SearchIcon color="action" sx={{ mr: 1 }} />
      <InputBase
        fullWidth
        placeholder="Search by breed, species or city"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        inputProps={{ "aria-label": "Search pets" }}
        sx={{ color: "text.primary" }}
      />
      <Button type="submit" color="secondary">
        Search
      </Button>
    </Box>
  );
};

export default HeroSearch;
