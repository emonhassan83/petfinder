"use client";

import { useMemo, useState } from "react";
import { Box, Chip, FormControlLabel, Switch, Typography } from "@mui/material";
import { CostEstimates, CostInputs, estimateFirstYear, taka } from "@/lib/petCosts";

//* `fee` is in major units (taka); `estimates` is the cost.estimates public setting when available
type Props = { species: string; size?: string; fee?: number; name: string; estimates?: CostEstimates };

const Choice = <T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) => (
  <Box>
    <Typography sx={{ fontWeight: 700, fontSize: 14, mb: 1 }}>{label}</Typography>
    <Box role="radiogroup" aria-label={label} sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      {options.map((o) => (
        <Chip
          key={o.v}
          role="radio"
          aria-checked={value === o.v}
          label={o.label}
          clickable
          onClick={() => onChange(o.v)}
          color={value === o.v ? "primary" : "default"}
          variant={value === o.v ? "filled" : "outlined"}
        />
      ))}
    </Box>
  </Box>
);

//* First-year cost estimate (Pawvelle's hamper calculator, applied to adoption). Pure client-side maths.
const CostCalculator = ({ species, size, fee = 0, name, estimates }: Props) => {
  const [inputs, setInputs] = useState<CostInputs>({
    species,
    size: (["Small", "Medium", "Large"].includes(size ?? "") ? size : "Medium") as CostInputs["size"],
    food: "standard",
    vet: "routine",
    insurance: false,
    grooming: species === "Dog",
  });
  const set = <K extends keyof CostInputs>(k: K, v: CostInputs[K]) => setInputs((p) => ({ ...p, [k]: v }));
  const { lines, total } = useMemo(() => estimateFirstYear(inputs, fee, estimates), [inputs, fee, estimates]);

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, bgcolor: "var(--pf-soft)", borderRadius: "var(--pf-radius-card)", p: { xs: 2.5, md: 3.5 } }}>
      <Box sx={{ display: "grid", gap: 2.5, alignContent: "start" }}>
        <Choice label="Size" value={inputs.size} onChange={(v) => set("size", v)} options={[{ v: "Small", label: "Small" }, { v: "Medium", label: "Medium" }, { v: "Large", label: "Large" }]} />
        <Choice label="Food" value={inputs.food} onChange={(v) => set("food", v)} options={[{ v: "basic", label: "Basic" }, { v: "standard", label: "Standard" }, { v: "premium", label: "Premium" }]} />
        <Choice label="Vet care" value={inputs.vet} onChange={(v) => set("vet", v)} options={[{ v: "routine", label: "Routine" }, { v: "plus", label: "Plus (dental, tests)" }]} />
        <Box>
          <FormControlLabel control={<Switch checked={inputs.insurance} onChange={(e) => set("insurance", e.target.checked)} />} label="Pet insurance" />
          <FormControlLabel control={<Switch checked={inputs.grooming} onChange={(e) => set("grooming", e.target.checked)} />} label="Professional grooming" />
        </Box>
      </Box>

      <Box sx={{ bgcolor: "background.paper", borderRadius: 4, p: 2.5, border: "1px solid", borderColor: "divider", alignSelf: "start" }} aria-live="polite">
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          Estimated first year with {name}
        </Typography>
        <Typography sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600, fontSize: 36, color: "secondary.main", lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
          {taka(total)}
        </Typography>
        <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 2 }}>about {taka(Math.round(total / 12))} a month</Typography>
        <Box sx={{ display: "grid", gap: 1 }}>
          {lines.map((l) => (
            <Box key={l.label} sx={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{l.label}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{taka(l.amount)}</Typography>
            </Box>
          ))}
        </Box>
        <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 2 }}>Typical Bangladesh city prices; your costs may differ.</Typography>
      </Box>
    </Box>
  );
};

export default CostCalculator;
