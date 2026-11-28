import { Box, Button, Chip, MenuItem, TextField, Typography } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";

const breedOptions = ["Labrador", "Golden Retriever", "Beagle", "Corgi", "Pug", "Jack Russell", "Siberian Husky", "Tabby", "Siamese", "Maine Coon", "Domestic Shorthair", "Holland Lop"];
const sizeOptions = ["Small", "Medium", "Large"];
//* Coat colour swatches (Pawvelle-style colour picker). `swatch` is a CSS background; matching is by keyword (see matchesColor).
export const colorOptions: { name: string; swatch: string }[] = [
  { name: "White", swatch: "#F7F4EF" },
  { name: "Cream", swatch: "#EAD9B8" },
  { name: "Golden", swatch: "#D9A44A" },
  { name: "Red", swatch: "#B8642E" },
  { name: "Brown", swatch: "#7A5133" },
  { name: "Grey", swatch: "#9A9EA3" },
  { name: "Black", swatch: "#1E1B18" },
  { name: "Tricolour", swatch: "conic-gradient(#1E1B18 0 33%, #B8642E 0 66%, #F7F4EF 0)" },
];

//* "Black & white" matches Black and White; "Gray" is treated as Grey; "Tabby" as Brown
export const matchesColor = (petColor: string | undefined, filter: string) => {
  if (!filter) return true;
  const c = (petColor || "").toLowerCase().replace("gray", "grey").replace("tabby", "brown tabby");
  return c.includes(filter.toLowerCase());
};
const genderOptions = ["Male", "Female"];

export const emptyFilters = { species: "", breed: "", age: "", size: "", color: "", gender: "" };

const ChipGroup = ({ label, name, options, value, onPick }: { label: string; name: string; options: string[]; value: string; onPick: (n: string, v: string) => void }) => (
  <Box sx={{ mt: 2.5 }}>
    <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>{label}</Typography>
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {options.map((o) => {
        const on = value === o;
        return (
          <Chip
            key={o}
            label={o}
            clickable
            onClick={() => onPick(name, on ? "" : o)}
            aria-pressed={on}
            color={on ? "primary" : "default"}
            variant={on ? "filled" : "outlined"}
          />
        );
      })}
    </Box>
  </Box>
);

//* Petfinder-style filter card. Species is chosen with the tabs above the results.
const FilterSidebar = ({ filters, setFilters }: { filters: any; setFilters: React.Dispatch<React.SetStateAction<any>> }) => {
  const set = (name: string, value: string) => setFilters((prev: any) => ({ ...prev, [name]: value }));
  const active = Object.entries(filters).filter(([k, v]) => k !== "species" && v).length;

  return (
    <Box
      component="aside"
      aria-label="Filters"
      sx={{
        width: { xs: "100%", md: 280 },
        flexShrink: 0,
        alignSelf: "flex-start",
        position: { md: "sticky" },
        top: { md: 96 },
        p: 3,
        mb: { xs: 3, md: 0 },
        bgcolor: "background.paper",
        borderRadius: "var(--pf-radius-card)",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TuneIcon color="primary" /> Filters {active > 0 && <Chip size="small" color="secondary" label={active} />}
        </Typography>
        <Button variant="text" size="small" onClick={() => setFilters({ ...emptyFilters, species: filters.species })} disabled={!active}>
          Reset
        </Button>
      </Box>

      <TextField select fullWidth size="small" label="Breed" value={filters.breed} onChange={(e) => set("breed", e.target.value)} sx={{ mt: 2.5 }}>
        <MenuItem value="">Any breed</MenuItem>
        {breedOptions.map((b) => (
          <MenuItem key={b} value={b}>
            {b}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        fullWidth
        size="small"
        type="number"
        label="Age (years)"
        value={filters.age}
        onChange={(e) => set("age", e.target.value)}
        inputProps={{ min: 0, max: 30 }}
        sx={{ mt: 2 }}
      />

      <ChipGroup label="Size" name="size" options={sizeOptions} value={filters.size} onPick={set} />
      <ChipGroup label="Gender" name="gender" options={genderOptions} value={filters.gender} onPick={set} />

      <Box sx={{ mt: 2.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>
          Coat colour{filters.color && <Box component="span" sx={{ fontWeight: 500, color: "text.secondary" }}> · {filters.color}</Box>}
        </Typography>
        <Box role="group" aria-label="Coat colour" sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
          {colorOptions.map((c) => {
            const on = filters.color === c.name;
            return (
              <Box
                key={c.name}
                component="button"
                type="button"
                title={c.name}
                aria-label={c.name}
                aria-pressed={on}
                onClick={() => set("color", on ? "" : c.name)}
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  cursor: "pointer",
                  background: c.swatch,
                  border: 0,
                  //* Inset outline keeps light and dark swatches visible in both themes; outer ring marks the selection
                  boxShadow: (t) =>
                    `inset 0 0 0 1px rgba(127,127,127,.45)${on ? `, 0 0 0 3px ${t.vars.palette.background.paper}, 0 0 0 5px ${t.vars.palette.primary.main}` : ""}`,
                  transition: "transform .2s ease, box-shadow .2s ease",
                  "&:hover": { transform: "scale(1.1)" },
                  "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 4 },
                }}
              />
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default FilterSidebar;
