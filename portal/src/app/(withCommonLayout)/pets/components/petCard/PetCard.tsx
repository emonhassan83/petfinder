"use client";

import { Box, Button, Card, CardContent, Chip, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import FavoriteButton from "@/components/UI/FavoriteButton";

type Props = {
  pet: any;
  //* When given, shows a "Quick view" button that calls this (page owns the QuickViewDrawer)
  onQuickView?: (pet: any) => void;
};

const PetCard = ({ pet, onQuickView }: Props) => {
  return (
    <Card
      sx={{
        height: "100%",
        overflow: "hidden",
        "&:hover": { transform: "translateY(-6px)", boxShadow: "var(--pf-shadow)" },
        "& img": { transition: "transform .6s cubic-bezier(0.22, 1, 0.36, 1)" },
        "&:hover img": { transform: "scale(1.06)" },
        "&:hover .pf-quick, &:focus-within .pf-quick": { opacity: 1, transform: "none" },
      }}
    >
      <Box sx={{ position: "relative", aspectRatio: "4 / 3.4", overflow: "hidden" }}>
        <Link href={`/pets/${pet.id}`} aria-label={`View ${pet.name}`}>
          <Image src={pet.image} alt={pet.name} fill sizes="(max-width: 600px) 100vw, 33vw" style={{ objectFit: "cover" }} />
        </Link>
        <FavoriteButton pet={pet} />
        {onQuickView && (
          <Button
            className="pf-quick"
            size="small"
            startIcon={<VisibilityOutlinedIcon />}
            onClick={() => onQuickView(pet)}
            aria-label={`Quick view ${pet.name}`}
            sx={{
              position: "absolute",
              left: 12,
              bottom: 12,
              py: 0.5,
              px: 1.75,
              bgcolor: "background.paper",
              color: "text.primary",
              "&:hover": { bgcolor: "background.paper" },
              //* Hidden until hover/focus with a mouse; always visible on touch
              "@media (hover: hover)": { opacity: 0, transform: "translateY(6px)", transition: "opacity .25s ease, transform .25s ease" },
            }}
          >
            Quick view
          </Button>
        )}
      </Box>
      <CardContent component={Link} href={`/pets/${pet.id}`} sx={{ display: "block", p: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
          <Typography variant="h5" component="h3" sx={{ fontSize: 22 }}>
            {pet.name}
          </Typography>
          <Chip size="small" label={pet.gender || pet.species} sx={{ bgcolor: "var(--pf-peach)", color: "var(--pf-rust)" }} />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
          {pet.breed} · {pet.age} {pet.age === 1 ? "year" : "years"}
          {pet.color ? ` · ${pet.color}` : ""}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.6 }}>
          {pet.description?.length > 70 ? pet.description.slice(0, 70) + "…" : pet.description}
        </Typography>
        <Typography variant="body2" display="flex" alignItems="center" sx={{ color: "primary.main", fontWeight: 700 }}>
          <PlaceOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} /> {pet.location}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PetCard;
