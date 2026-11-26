"use client";

import { Box, Card, CardContent, Grid, Typography, Button } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "@/components/UI/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";

const FavoritesPage = () => {
  const { favorites } = useFavorites();

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Saved pets
      </Typography>
      {favorites.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            You haven&apos;t saved any pets yet.
          </Typography>
          <Button component={Link} href="/pets">
            Browse pets
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {favorites.map((pet) => (
            <Grid item xs={12} sm={6} md={4} key={pet.id}>
              <Card>
                <Box sx={{ position: "relative", height: 200 }}>
                  <Image src={pet.image} alt={pet.name} fill sizes="33vw" style={{ objectFit: "cover" }} />
                  <FavoriteButton pet={pet} />
                </Box>
                <CardContent component={Link} href={`/pets/${pet.id}`} sx={{ display: "block" }}>
                  <Typography variant="h6">{pet.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pet.breed} · {pet.age}y · {pet.location}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default FavoritesPage;
