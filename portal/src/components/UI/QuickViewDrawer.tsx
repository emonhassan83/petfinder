"use client";

import { Box, Button, Chip, Drawer, IconButton, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "./FavoriteButton";

//* Subset of PreviewPet (mock/pets.ts) / API pet the drawer needs
export type QuickViewPet = {
  id: string;
  name: string;
  image: string;
  breed: string;
  age: number;
  gender?: string;
  size?: string;
  color?: string;
  location: string;
  description?: string;
  traits?: string[];
  fee?: number;
};

type Props = { pet: QuickViewPet | null; onClose: () => void };

const fact = (label: string, value?: string | number) =>
  value === undefined || value === "" ? null : (
    <Box key={label} sx={{ p: 1.5, borderRadius: 3, bgcolor: "var(--pf-soft)" }}>
      <Typography sx={{ fontSize: 12, color: "text.secondary", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 700 }}>{value}</Typography>
    </Box>
  );

//* Side panel with a pet's key facts, opened from a card's quick-view action.
const QuickViewDrawer = ({ pet, onClose }: Props) => (
  <Drawer
    anchor="right"
    open={!!pet}
    onClose={onClose}
    PaperProps={{ sx: { width: { xs: "100%", sm: 440 }, bgcolor: "background.paper", borderTopLeftRadius: { sm: 24 }, borderBottomLeftRadius: { sm: 24 } } }}
  >
    {pet && (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ position: "relative", aspectRatio: "4 / 3", flexShrink: 0 }}>
          <Image src={pet.image} alt={pet.name} fill sizes="440px" style={{ objectFit: "cover" }} />
          <IconButton aria-label="Close quick view" onClick={onClose} sx={{ position: "absolute", top: 12, left: 12, bgcolor: "background.paper", "&:hover": { bgcolor: "background.paper" } }}>
            <CloseIcon />
          </IconButton>
          <FavoriteButton pet={pet} />
        </Box>

        <Box sx={{ p: 3, overflowY: "auto", flex: 1 }}>
          <Typography variant="h4" component="h2">
            {pet.name}
          </Typography>
          <Typography color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
            <PlaceOutlinedIcon fontSize="small" /> {pet.location}
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1, my: 2.5 }}>
            {[
              fact("Breed", pet.breed),
              fact("Age", `${pet.age} ${pet.age === 1 ? "year" : "years"}`),
              fact("Gender", pet.gender),
              fact("Size", pet.size),
              fact("Colour", pet.color),
              fact("Adoption fee", pet.fee !== undefined ? `৳${pet.fee.toLocaleString()}` : undefined),
            ]}
          </Box>

          {pet.traits && pet.traits.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
              {pet.traits.map((t) => (
                <Chip key={t} label={t} size="small" sx={{ bgcolor: "var(--pf-peach)", color: "var(--pf-rust)" }} />
              ))}
            </Stack>
          )}

          {pet.description && (
            <Typography color="text.secondary" sx={{ lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {pet.description}
            </Typography>
          )}
        </Box>

        <Stack direction="row" gap={1.5} sx={{ p: 3, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
          <Button component={Link} href={`/pets/${pet.id}`} variant="outlined" fullWidth onClick={onClose}>
            View details
          </Button>
          <Button component={Link} href={`/pets/${pet.id}#apply`} fullWidth onClick={onClose}>
            Meet {pet.name}
          </Button>
        </Stack>
      </Box>
    )}
  </Drawer>
);

export default QuickViewDrawer;
