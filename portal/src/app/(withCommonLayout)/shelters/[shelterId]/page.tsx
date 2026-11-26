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
import { findPreviewShelter, previewPets } from "@/mock/pets";

const reviews = [
  { name: "Nusrat J.", rating: 5, text: "Very caring team. They followed up a week after we adopted to check everything was fine." },
  { name: "Arif H.", rating: 5, text: "Honest about our dog's needs and very patient with our questions." },
  { name: "Tania R.", rating: 4, text: "Smooth process and a lovely home visit. Paperwork took a few days." },
];

//* Public shelter profile: banner, contact, reviews and available pets (preview data)
const ShelterPage = async ({ params }: { params: Promise<{ shelterId: string }> }) => {
  const { shelterId } = await params;
  const s = findPreviewShelter(shelterId);

  if (!s) {
    return (
      <Container sx={{ py: 12, textAlign: "center" }}>
        <Typography variant="h4">Shelter not found</Typography>
        <LinkBox  href="/shelters" sx={{ color: "primary.main", fontWeight: 700, display: "inline-block", mt: 2 }}>
          Browse shelters →
        </LinkBox>
      </Container>
    );
  }

  const pets = previewPets.filter((p) => p.shelterId === s.id);

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ position: "relative", height: { xs: 200, md: 300 } }}>
        <Image src={s.image} alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,.55) 100%)" }} />
      </Box>

      <Container sx={{ mt: { xs: -6, md: -8 }, position: "relative" }}>
        <Box sx={{ bgcolor: "background.paper", borderRadius: 4, p: { xs: 3, md: 4 }, border: "1px solid", borderColor: "divider", boxShadow: "var(--pf-shadow)", display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
          <Avatar sx={{ width: 84, height: 84, bgcolor: "primary.main", fontSize: 32, fontWeight: 800, boxShadow: "0 0 0 6px var(--pf-peach)" }}>{s.name[0]}</Avatar>
          <Box sx={{ flex: 1, minWidth: 240 }}>
            <Breadcrumbs sx={{ fontSize: 13, mb: 0.5 }}>
              <Link href="/shelters">Shelters & Rescues</Link>
              <Typography sx={{ fontSize: 13 }}>{s.city}</Typography>
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
                {s.rating} · {s.reviews} reviews
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
              {s.about}
            </Typography>

            <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 }, mt: 5, mb: 2 }}>
              Pets available ({pets.length})
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
              {pets.map((p) => (
                <PetCard key={p.id} pet={p} />
              ))}
            </Box>

            <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 }, mt: 5, mb: 2 }}>
              Reviews from adopters
            </Typography>
            <Box sx={{ display: "grid", gap: 2 }}>
              {reviews.map((r) => (
                <Box key={r.name} sx={{ p: 2.5, borderRadius: 3, bgcolor: "var(--pf-soft)", border: "1px solid", borderColor: "divider" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}>{r.name[0]}</Avatar>
                    <Typography sx={{ fontWeight: 700 }}>{r.name}</Typography>
                    <Rating value={r.rating} readOnly size="small" />
                  </Box>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {r.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ position: { md: "sticky" }, top: { md: 96 }, bgcolor: "background.paper", borderRadius: 4, p: 3, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6">Contact</Typography>
            {[
              { icon: LocationOnOutlinedIcon, text: s.address },
              { icon: PhoneOutlinedIcon, text: s.phone },
              { icon: MailOutlineIcon, text: s.email },
              { icon: EventOutlinedIcon, text: `Rescuing since ${s.since}` },
            ].map(({ icon: Icon, text }) => (
              <Typography key={text} color="text.secondary" sx={{ display: "flex", gap: 1, mt: 1.5 }}>
                <Icon fontSize="small" sx={{ color: "primary.main", mt: "2px" }} /> {text}
              </Typography>
            ))}
            <LinkBox
              
              href="/dashboard/user/messages"
              sx={{ mt: 3, display: "block", textAlign: "center", py: 1.25, borderRadius: 999, bgcolor: "primary.main", color: "#fff", fontWeight: 700, "&:hover": { bgcolor: "primary.dark" } }}
            >
              Message shelter
            </LinkBox>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default ShelterPage;
