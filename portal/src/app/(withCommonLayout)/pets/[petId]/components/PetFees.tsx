import { Box, Typography } from "@mui/material";
import { FeeLine } from "@/lib/petCosts";
import { formatMoney } from "@/lib/apiData";

//* Transparent fee breakdown, styled like a menu/price list (dotted leaders).
//* Amounts are minor units (poisha/cents) as returned by GET /pets/:id/fees.
const PetFees = ({ lines, total, currency = "BDT" }: { lines: FeeLine[]; total: number; currency?: string }) => (
  <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: "var(--pf-radius-card)", p: { xs: 2.5, md: 3.5 } }}>
    <Box component="dl" sx={{ m: 0, display: "grid", gap: 1.75 }}>
      {lines.map((l) => (
        <Box key={l.label} sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
          <Box component="dt" sx={{ m: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>{l.label}</Typography>
            {l.note && <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{l.note}</Typography>}
          </Box>
          <Box aria-hidden sx={{ flex: 1, borderBottom: "2px dotted", borderColor: "divider", transform: "translateY(-4px)", minWidth: 24 }} />
          <Box component="dd" sx={{ m: 0, fontWeight: 700, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
            {formatMoney(l.amount, currency)}
          </Box>
        </Box>
      ))}
    </Box>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mt: 2.5, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
      <Typography sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600, fontSize: 20 }}>Adoption fee</Typography>
      <Typography sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600, fontSize: 26, color: "secondary.main", fontVariantNumeric: "tabular-nums" }}>
        {formatMoney(total, currency)}
      </Typography>
    </Box>
    <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 1 }}>Paid to the shelter at handover. Never pay before you have met the pet.</Typography>
  </Box>
);

export default PetFees;
