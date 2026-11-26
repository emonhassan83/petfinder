"use client";

import { IconButton } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useFavorites } from "@/hooks/useFavorites";

const FavoriteButton = ({ pet }: { pet: any }) => {
  const { toggle, isFavorite } = useFavorites();
  const active = isFavorite(pet.id);

  return (
    <IconButton
      aria-label={active ? "Remove from favorites" : "Save to favorites"}
      aria-pressed={active}
      onClick={() =>
        toggle({
          id: pet.id,
          name: pet.name,
          image: pet.image,
          breed: pet.breed,
          age: pet.age,
          location: pet.location,
        })
      }
      sx={{
        position: "absolute",
        top: 12,
        right: 12,
        bgcolor: "#fff",
        color: "secondary.main",
        "&:hover": { bgcolor: "#fff" },
      }}
    >
      {active ? <FavoriteIcon /> : <FavoriteBorderIcon />}
    </IconButton>
  );
};

export default FavoriteButton;
