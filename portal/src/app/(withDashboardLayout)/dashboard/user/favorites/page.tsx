"use client";

import { Box, Card, CardContent, Grid, Typography, Button, IconButton, Skeleton, Tooltip, Chip } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useFavGetFavoritesQuery, useFavRemoveFavoriteMutation } from "@/redux/api/favoriteApi";
import { normalizePet } from "@/lib/apiData";

const FavoritesPage = () => {
  const { data, isLoading, isError } = useFavGetFavoritesQuery({ limit: 100 });
  const [remove, { isLoading: removing }] = useFavRemoveFavoriteMutation();
  const pets = (data?.items ?? []).map(normalizePet);

  const unsave = async (id: string, name: string) => {
    try {
      await remove(id).unwrap();
      toast.success(`${name} removed from saved pets`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Could not remove the pet");
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Saved pets
      </Typography>
      {isLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={260} />
            </Grid>
          ))}
        </Grid>
      ) : isError ? (
        <Typography color="error">Could not load your saved pets. Please try again.</Typography>
      ) : pets.length === 0 ? (
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
          {pets.map((pet) => (
            <Grid item xs={12} sm={6} md={4} key={pet.id}>
              <Card>
                <Box sx={{ position: "relative", height: 200 }}>
                  <Image src={pet.image} alt={pet.name} fill sizes="33vw" style={{ objectFit: "cover" }} />
                  <Tooltip title="Remove from saved">
                    <IconButton
                      aria-label={`Remove ${pet.name} from saved pets`}
                      disabled={removing}
                      onClick={() => unsave(pet.id, pet.name)}
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        bgcolor: "background.paper",
                        color: "secondary.main",
                        "&:hover": { bgcolor: "background.paper" },
                      }}
                    >
                      <FavoriteIcon />
                    </IconButton>
                  </Tooltip>
                  {pet.status && pet.status !== "PUBLISHED" && (
                    <Chip
                      size="small"
                      label={pet.status === "PENDING" ? "Adoption pending" : pet.status.toLowerCase()}
                      sx={{ position: "absolute", left: 12, top: 12, bgcolor: "background.paper", textTransform: "capitalize" }}
                    />
                  )}
                </Box>
                <CardContent component={Link} href={`/pets/${pet.id}`} sx={{ display: "block" }}>
                  <Typography variant="h6">{pet.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pet.breed} · {pet.age}y · {pet.location}
                  </Typography>
                  {pet.shelter?.name && (
                    <Typography variant="caption" color="text.secondary">
                      {pet.shelter.name}
                    </Typography>
                  )}
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
