"use client";

import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import FavoriteButton from "@/components/UI/FavoriteButton";

const PetCard = ({ pet }: { pet: any }) => {
  return (
    <Card
      sx={{
        height: "100%",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": { transform: "translateY(-4px)", boxShadow: 1 },
      }}
    >
      <Box sx={{ position: "relative", height: 240 }}>
        <Link href={`/pets/${pet.id}`} aria-label={`View ${pet.name}`}>
          <Image
            src={pet.image}
            alt={pet.name}
            fill
            sizes="(max-width: 600px) 100vw, 33vw"
            style={{ objectFit: "cover" }}
          />
        </Link>
        <FavoriteButton pet={pet} />
      </Box>
      <CardContent component={Link} href={`/pets/${pet.id}`} sx={{ display: "block" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="h6" component="h3">
            {pet.name}
          </Typography>
          <Chip size="small" label={pet.gender || pet.species} color="primary" variant="outlined" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {pet.breed} · {pet.age} {pet.age === 1 ? "year" : "years"}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {pet.description?.length > 70 ? pet.description.slice(0, 70) + "…" : pet.description}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center">
          <LocationOnIcon fontSize="small" sx={{ mr: 0.5 }} /> {pet.location}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PetCard;
