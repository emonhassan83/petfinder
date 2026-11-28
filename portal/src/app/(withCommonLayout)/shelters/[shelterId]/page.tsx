import { Avatar, Box, Breadcrumbs, Chip, Container, Rating, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import LinkBox from "@/components/Shared/LinkBox";
import VerifiedIcon from "@mui/icons-material/Verified";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import PetCard from "../../pets/components/petCard/PetCard";
import { findPreviewShelter, previewPets, unsplash } from "@/mock/pets";
import { UiShelter, fetchApi, normalizePet, normalizeShelter } from "@/lib/apiData";
import ShelterReviews from "./components/ShelterReviews";
import MessageButton from "../../pets/[petId]/components/MessageButton";

//* Preview ids come from mock data; everything else from GET /shelters/:idOrSlug (with its published pets)
const loadShelter = async (idOrSlug: string): Promise<{ s: UiShelter; pets: any[]; preview: boolean } | null> => {
  const mock = findPreviewShelter(idOrSlug);
  if (mock) {
    const pets = previewPets.filter((p) => p.shelterId === mock.id);
    return { s: { ...mock, apiId: mock.id, petsCount: pets.length }, pets, preview: true };
  }
  const res = await fetchApi<any>(`/shelters/${encodeURIComponent(idOrSlug)}?petLimit=12`, { cache: "no-store" });
  if (!res?.data) return null;
  return { s: normalizeShelter(res.data), pets: (res.data.pets ?? []).map(normalizePet), preview: false };
};

//* Public shelter profile: banner, contact, reviews and available pets
const ShelterPage = async ({ params }: { params: Promise<{ shelterId: string }> }) => {
  const { shelterId } = await params;
  const loaded = await loadShelter(shelterId);
  const s = loaded?.s;

  if (!loaded || !s) {
    return (
      <Container sx={{ py: 12, textAlign: "center" }}>
        <Typography variant="h4">Shelter not found</Typography>
        <LinkBox  href="/shelters" sx={{ color: "primary.main", fontWeight: 700, display: "inline-block", mt: 2 }}>
          Browse shelters →
        </LinkBox>
      </Container>
    );
  }

  const pets = loaded.pets;
  const cover = s.image || unsplash("1583337130417-3346a1be7dee", 1400);

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ position: "relative", height: { xs: 200, md: 300 } }}>
        <Image src={cover} alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.55) 100%)" }} />
      </Box>

      <Container sx={{ mt: { xs: -6, md: -8 }, position: "relative" }}>
        <Box sx={{ bgcolor: "background.paper", borderRadius: 4, p: { xs: 3, md: 4 }, border: "1px solid", borderColor: "divider", boxShadow: "var(--pf-shadow)", display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
          <Avatar src={s.logo} sx={{ width: 84, height: 84, bgcolor: "primary.main", fontSize: 32, fontWeight: 800, boxShadow: "0 0 0 6px var(--pf-peach)" }}>{s.name[0]}</Avatar>
          <Box sx={{ flex: 1, minWidth: 240 }}>
            <Breadcrumbs sx={{ fontSize: 13, mb: 0.5 }}>
              <Link href="/shelters">Shelters & Rescues</Link>
              {s.city && <Typography sx={{ fontSize: 13 }}>{s.city}</Typography>}
            </Breadcrumbs>
            <Typography variant="h1" sx={{ fontSize: { xs: "1.8rem", md: "2.4rem" }, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              {s.name}
              {s.verified ? (
                <Chip icon={<VerifiedIcon />} label="Verified shelter" color="primary" size="small" />
              ) : (
                <Chip label="Verification pending" size="small" sx={{ bgcolor: "var(--pf-peach)", color: "var(--pf-rust)" }} />
              )}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
              <Rating value={s.rating} precision={0.1} readOnly size="small" />
              <Typography variant="body2" color="text.secondary">
                {s.reviews ? `${s.rating.toFixed(1)} · ${s.reviews} ${s.reviews === 1 ? "review" : "reviews"}` : "No reviews yet"}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.7fr 1fr" }, gap: 4, mt: 4, alignItems: "start" }}>
          <Box>
            <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 } }}>
              About us
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: 17, lineHeight: 1.75 }}>
              {s.about || `${s.name} rehomes pets through Petfinder.`}
            </Typography>

            <Typography id="pets" variant="h4" sx={{ fontSize: { xs: 22, md: 28 }, mt: 5, mb: 2, scrollMarginTop: 96 }}>
              Pets available ({s.petsCount || pets.length})
            </Typography>
            {pets.length === 0 && <Typography color="text.secondary">No pets listed right now.</Typography>}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
              {pets.map((p: any) => (
                <PetCard key={p.id} pet={p} />
              ))}
            </Box>

            <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 }, mt: 5, mb: 2 }}>
              Reviews from adopters
            </Typography>
            {loaded.preview ? (
              <Typography color="text.secondary">Reviews are shown for live shelters.</Typography>
            ) : (
              <ShelterReviews shelterId={s.apiId} />
            )}
          </Box>

          <Box sx={{ position: { md: "sticky" }, top: { md: 96 }, bgcolor: "background.paper", borderRadius: 4, p: 3, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6">Contact</Typography>
            {[
              { icon: LocationOnOutlinedIcon, text: s.address || s.city },
              { icon: PhoneOutlinedIcon, text: s.phone },
              { icon: MailOutlineIcon, text: s.email },
              { icon: EventOutlinedIcon, text: s.since ? `On Petfinder since ${s.since}` : "" },
            ].filter((row) => row.text).map(({ icon: Icon, text }) => (
              <Typography key={text} color="text.secondary" sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                <Icon fontSize="small" sx={{ color: "primary.main", mt: "2px" }} /> {text}
              </Typography>
            ))}
            {/* Conversations are per pet (POST /conversations needs petId), so this opens a thread about the first listed pet */}
            {pets[0] && !loaded.preview ? (
              <MessageButton petId={pets[0].id} label="Message shelter" />
            ) : (
              <LinkBox href="#pets" sx={{ mt: 3, display: "block", textAlign: "center", py: 1.25, borderRadius: 999, bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 700, "&:hover": { bgcolor: "primary.dark" } }}>
                See their pets
              </LinkBox>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default ShelterPage;
