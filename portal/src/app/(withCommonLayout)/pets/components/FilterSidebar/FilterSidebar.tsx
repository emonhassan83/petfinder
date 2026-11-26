import { Box, Button, Chip, MenuItem, TextField, Typography } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";

const breedOptions = ["Labrador", "Golden Retriever", "Beagle", "Corgi", "Pug", "Jack Russell", "Siberian Husky", "Tabby", "Siamese", "Maine Coon", "Domestic Shorthair", "Holland Lop"];
const sizeOptions = ["Small", "Medium", "Large"];
const colorOptions = ["White", "Cream", "Black", "Gray", "Golden", "Brown Tabby", "Brown and White"];
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
        borderRadius: 4,
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

      <TextField select fullWidth size="small" label="Colour" value={filters.color} onChange={(e) => set("color", e.target.value)} sx={{ mt: 2.5 }}>
        <MenuItem value="">Any colour</MenuItem>
        {colorOptions.map((c) => (
          <MenuItem key={c} value={c}>
            {c}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
};

export default FilterSidebar;
