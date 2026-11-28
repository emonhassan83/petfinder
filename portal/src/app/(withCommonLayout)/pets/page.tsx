"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { Alert, Box, Chip, Container, Grid, MenuItem, Pagination, Skeleton, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import FilterSidebar, { emptyFilters, matchesColor } from "./components/FilterSidebar/FilterSidebar";
import QuickViewDrawer from "@/components/UI/QuickViewDrawer";
import PetCard from "./components/petCard/PetCard";
import LoadingPage from "@/components/Shared/Loader/LoadingPage";
import Meta from "@/components/Meta/MetaData";
import PageHeader from "@/components/Shared/PageHeader";
import HeroSearch from "@/components/UI/HomePage/HeroSection/components/HeroSearch";
import { previewPets } from "@/mock/pets";
import { API_URL, normalizePet } from "@/lib/apiData";
import { usePubGetSpeciesQuery } from "@/redux/api/lookupApi";

const PAGE_SIZE = 9;

//* Used until /lookups/species answers (or when the API is offline)
const fallbackTabs = [
  { label: "All pets", value: "" },
  { label: "Dogs", value: "Dog" },
  { label: "Cats", value: "Cat" },
  { label: "Rabbits", value: "Rabbit" },
];

//* API sort options (petSortableFields: createdAt, updatedAt, name, age, views)
const sortOptions: Record<string, { label: string; sortBy: string; sortOrder: "asc" | "desc" }> = {
  newest: { label: "Newest", sortBy: "createdAt", sortOrder: "desc" },
  age: { label: "Youngest first", sortBy: "age", sortOrder: "asc" },
  oldest: { label: "Oldest first", sortBy: "age", sortOrder: "desc" },
  name: { label: "Name A-Z", sortBy: "name", sortOrder: "asc" },
  popular: { label: "Most viewed", sortBy: "views", sortOrder: "desc" },
};

//* Client-side filtering for preview pets when the API is unreachable
const filterPreview = (filters: any, term: string) =>
  previewPets.filter(
    (p) =>
      (!filters.species || p.species === filters.species) &&
      (!filters.breed || p.breed === filters.breed) &&
      (!filters.size || p.size === filters.size) &&
      (!filters.gender || p.gender === filters.gender) &&
      (!filters.age || p.age === Number(filters.age)) &&
      matchesColor(p.color, filters.color) &&
      (!term || `${p.name} ${p.breed} ${p.location}`.toLowerCase().includes(term.toLowerCase()))
  );

const PetsContent = () => {
  const params = useSearchParams();
  const searchTerm = params.get("searchTerm") || "";
  const [pets, setPets] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState("newest");
  const [preview, setPreview] = useState(false);
  const [filters, setFilters] = useState({ ...emptyFilters, species: params.get("species") || "", breed: params.get("breed") || "" });
  const [loading, setLoading] = useState(true);
  const [quick, setQuick] = useState<any>(null);
  const { data: speciesList } = usePubGetSpeciesQuery();
  const speciesTabs = speciesList?.length
    ? [{ label: "All pets", value: "" }, ...speciesList.map((sp: any) => ({ label: sp.name.endsWith("s") ? sp.name : `${sp.name}s`, value: sp.name }))]
    : fallbackTabs;

  //* A new hero search updates the URL; mirror its species/breed into the filters
  useEffect(() => {
    setFilters((f) => ({ ...f, species: params.get("species") || "", breed: params.get("breed") || "" }));
  }, [params]);

  useEffect(() => setPage(1), [searchTerm, filters, sort]);

  useEffect(() => {
    //* coat colour chip -> `colors` (matches any entry of the pet's colours array)
    const { color, ...rest } = filters;
    const cleaned = Object.fromEntries(Object.entries(rest).filter(([, v]) => v));
    const order = sortOptions[sort] ?? sortOptions.newest;
    let active = true;
    setLoading(true);
    axios
      .get(`${API_URL}/pets`, {
        params: {
          limit: PAGE_SIZE,
          page,
          ...(searchTerm ? { searchTerm } : {}),
          sortBy: order.sortBy,
          sortOrder: order.sortOrder,
          ...(color ? { colors: color } : {}),
          ...cleaned,
        },
      })
      .then(({ data }) => {
        if (!active) return;
        setPets((data.data ?? []).map(normalizePet));
        setTotal(data.meta?.total ?? 0);
        setPreview(false);
      })
      .catch((err) => {
        if (!active) return;
        //* The offline preview is only for an unreachable API (no HTTP response at all)
        if (err?.response) {
          setPets([]);
          setTotal(0);
          setPreview(false);
          return;
        }
        const list = filterPreview(filters, searchTerm);
        setPets(list);
        setTotal(list.length);
        setPreview(true);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [page, filters, searchTerm, sort]);

  const sorted = useMemo(() => (preview && sort === "age" ? [...pets].sort((a, b) => a.age - b.age) : pets), [pets, preview, sort]);

  return (
    <>
      <Meta title="Find a pet | Petfinder" description="Search adoptable dogs, cats and other pets from verified shelters and owners." />

      <PageHeader
        title="Find your"
        highlight="new best friend"
        image={previewPets[2].image}
        crumbs={[{ label: "Find a pet" }]}
        subtitle={searchTerm ? `Showing results for "${searchTerm}"` : "Search by area, type and breed, then narrow it down with filters."}
      >
        <HeroSearch />
      </PageHeader>

      <Container sx={{ my: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 3 }}>
          <Box role="tablist" aria-label="Species" sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {speciesTabs.map((t) => {
              const on = filters.species === t.value;
              return (
                <Chip
                  key={t.label}
                  role="tab"
                  aria-selected={on}
                  label={t.label}
                  clickable
                  onClick={() => setFilters((f) => ({ ...f, species: t.value, breed: "" }))}
                  color={on ? "primary" : "default"}
                  variant={on ? "filled" : "outlined"}
                  sx={{ fontWeight: 700, fontSize: 15, height: 38, px: 1 }}
                />
              );
            })}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
              {loading ? "Searching…" : `${total} ${total === 1 ? "pet" : "pets"} found`}
            </Typography>
            <TextField select size="small" label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 150 }}>
              {Object.entries(sortOptions).map(([value, o]) => (
                <MenuItem key={value} value={value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        {preview && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
            Showing preview pets while the pet service is offline.
          </Alert>
        )}

        <Box sx={{ display: { md: "flex" }, gap: 4 }}>
          <FilterSidebar filters={filters} setFilters={setFilters} />
          <Box sx={{ flex: 1 }}>
            {loading ? (
              <Grid container spacing={3}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid item xs={12} sm={6} lg={4} key={i}>
                    <Skeleton variant="rounded" height={240} sx={{ borderRadius: "var(--pf-radius-card)" }} />
                    <Skeleton width="60%" sx={{ mt: 1 }} />
                    <Skeleton width="40%" />
                  </Grid>
                ))}
              </Grid>
            ) : sorted.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 10, bgcolor: "var(--pf-soft)", borderRadius: "var(--pf-radius-card)" }}>
                <Typography variant="h5">No pets found</Typography>
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Try another area or clear a filter.
                </Typography>
              </Box>
            ) : (
              <>
                <Grid container spacing={3}>
                  {sorted.map((pet: any, i: number) => (
                    <Grid item xs={12} sm={6} lg={4} key={pet.id} className="pf-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                      <PetCard pet={pet} onQuickView={setQuick} />
                    </Grid>
                  ))}
                </Grid>
                {!preview && total > PAGE_SIZE && (
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
                    <Pagination count={Math.ceil(total / PAGE_SIZE)} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Container>

      <QuickViewDrawer pet={quick} onClose={() => setQuick(null)} />
    </>
  );
};

const PetsPage = () => (
  <Suspense fallback={<LoadingPage />}>
    <PetsContent />
  </Suspense>
);

export default PetsPage;
