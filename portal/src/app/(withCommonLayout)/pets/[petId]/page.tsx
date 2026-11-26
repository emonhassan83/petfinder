import { Box, Breadcrumbs, Chip, Container, Divider, Typography } from "@mui/material";
import Link from "next/link";
import LinkBox from "@/components/Shared/LinkBox";
import Image from "next/image";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import AdoptionButtonWrapper from "./components/AddAdoptButtonWrapper";
import PetGallery from "./components/PetGallery";
import PetActions from "./components/PetActions";
import PetCard from "../components/petCard/PetCard";
import { findPreviewPet, findPreviewShelter, previewPets, previewShelters } from "@/mock/pets";

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: string;
  size?: string;
  color?: string;
  location: string;
  image: string;
  photos: string[];
  description?: string;
  traits: string[];
  goodWith: string[];
  houseTrained?: boolean;
  vaccinated?: boolean;
  spayedNeutered?: boolean;
  medicalHistory?: string;
  adoptionRequirements?: string;
  fee?: number;
  shelter: { id?: string; name: string; city?: string; phone?: string; verified: boolean };
};

//* Preview ids come from mock data; everything else from the API
const loadPet = async (id: string): Promise<Pet | null> => {
  const preview = findPreviewPet(id);
  if (preview) {
    const s = findPreviewShelter(preview.shelterId)!;
    return { ...preview, shelter: { id: s.id, name: s.name, city: s.city, phone: s.phone, verified: s.verified } };
  }
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/pets/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    const { data: p } = await res.json();
    if (!p) return null;
    return {
      ...p,
      photos: [p.image].filter(Boolean),
      traits: p.temperament ? String(p.temperament).split(",").map((t: string) => t.trim()) : [],
      goodWith: [],
      shelter: { name: p.user?.name ?? "Pet owner", city: p.location, verified: false },
    };
  } catch {
    return null;
  }
};

const Fact = ({ label, value }: { label: string; value?: string | number }) =>
  value ? (
    <Box sx={{ bgcolor: "var(--pf-soft)", borderRadius: 3, p: 2, border: "1px solid", borderColor: "divider" }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, mt: 0.25 }}>{value}</Typography>
    </Box>
  ) : null;

const Health = ({ ok, label }: { ok?: boolean; label: string }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    {ok ? <CheckCircleIcon sx={{ color: "success.main" }} fontSize="small" /> : <CancelOutlinedIcon sx={{ color: "text.disabled" }} fontSize="small" />}
    <Typography>{label}</Typography>
  </Box>
);

const PetDetailsPage = async ({ params }: { params: Promise<{ petId: string }> }) => {
  const { petId } = await params;
  const pet = await loadPet(petId);

  if (!pet) {
    return (
      <Container sx={{ py: 12, textAlign: "center" }}>
        <Typography variant="h4">This pet is no longer available</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
          They may have found a home already. There are plenty of other friends waiting.
        </Typography>
        <LinkBox  href="/pets" sx={{ color: "primary.main", fontWeight: 700 }}>
          Browse pets →
        </LinkBox>
      </Container>
    );
  }

  const pronoun = pet.gender === "Female" ? "her" : "him";
  const related = previewPets.filter((p) => p.id !== pet.id && (p.species === pet.species || p.shelterId === pet.shelter.id)).slice(0, 3);
  const shelterInfo = pet.shelter.id ? previewShelters.find((s) => s.id === pet.shelter.id) : undefined;

  return (
    <Box sx={{ pb: 6 }}>
      <Box sx={{ bgcolor: "var(--pf-peach)", height: { xs: 80, md: 120 } }} />
      <Container sx={{ mt: { xs: -8, md: -11 } }}>
        <Breadcrumbs sx={{ mb: 2, fontSize: 14 }}>
          <Link href="/">Home</Link>
          <Link href="/pets">Find a pet</Link>
          <Typography sx={{ fontSize: 14, fontWeight: 700, color: "text.primary" }}>{pet.name}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.7fr 1fr" }, gap: { xs: 3, md: 5 }, alignItems: "start" }}>
          {/* Main column */}
          <Box>
            <PetGallery photos={pet.photos} name={pet.name} />

            <Box sx={{ mt: 4 }}>
              <Typography variant="h1" sx={{ fontSize: { xs: "2.2rem", md: "3rem" }, letterSpacing: "-0.02em" }}>
                {pet.name}
              </Typography>
              <Typography sx={{ mt: 1, color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
                {pet.breed} <span>•</span> <LocationOnOutlinedIcon fontSize="small" sx={{ color: "primary.main" }} />
                <Box component="span" sx={{ color: "primary.main", fontWeight: 700 }}>
                  {pet.location}
                </Box>
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
                {[`${pet.age} ${pet.age === 1 ? "year" : "years"}`, pet.gender, pet.size, pet.color].filter(Boolean).map((t) => (
                  <Chip key={t} label={t} sx={{ bgcolor: "var(--pf-peach)", color: "var(--pf-rust)" }} />
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 } }}>
              About
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 1.5, mt: 2 }}>
              <Fact label="Species" value={pet.species} />
              <Fact label="Breed" value={pet.breed} />
              <Fact label="Age" value={`${pet.age} ${pet.age === 1 ? "year" : "years"}`} />
              <Fact label="Size" value={pet.size} />
              <Fact label="Colour" value={pet.color} />
              <Fact label="Adoption fee" value={pet.fee ? `৳${pet.fee.toLocaleString()}` : undefined} />
            </Box>

            {pet.traits.length > 0 && (
              <>
                <Typography sx={{ fontWeight: 700, mt: 3, mb: 1 }}>Characteristics</Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {pet.traits.map((t) => (
                    <Chip key={t} label={t} variant="outlined" color="primary" />
                  ))}
                </Box>
              </>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3, mt: 3 }}>
              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>Health</Typography>
                <Box sx={{ display: "grid", gap: 1 }}>
                  <Health ok={pet.vaccinated} label="Vaccinations up to date" />
                  <Health ok={pet.spayedNeutered} label="Spayed / neutered" />
                  <Health ok={pet.houseTrained} label="House-trained" />
                </Box>
              </Box>
              {pet.goodWith.length > 0 && (
                <Box>
                  <Typography sx={{ fontWeight: 700, mb: 1 }}>Good in a home with</Typography>
                  <Box sx={{ display: "grid", gap: 1 }}>
                    {pet.goodWith.map((g) => (
                      <Health key={g} ok label={g} />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 } }}>
              Meet {pet.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: 17, lineHeight: 1.75 }}>
              {pet.description}
            </Typography>
            {pet.medicalHistory && (
              <>
                <Typography sx={{ fontWeight: 700, mt: 3 }}>Medical history</Typography>
                <Typography color="text.secondary">{pet.medicalHistory}</Typography>
              </>
            )}
            {pet.adoptionRequirements && (
              <>
                <Typography sx={{ fontWeight: 700, mt: 3 }}>Adoption requirements</Typography>
                <Typography color="text.secondary">{pet.adoptionRequirements}</Typography>
              </>
            )}
          </Box>

          {/* Sticky sidebar */}
          <Box sx={{ position: { md: "sticky" }, top: { md: 96 }, display: "grid", gap: 3 }}>
            <Box sx={{ bgcolor: "background.paper", borderRadius: 4, p: 3, border: "1px solid", borderColor: "divider", boxShadow: "var(--pf-shadow)" }}>
              <Typography variant="h5" sx={{ fontSize: 22 }}>
                Considering {pet.name} for adoption?
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Send an application and the {pet.shelter.verified ? "shelter" : "owner"} will get back to you, usually within 48 hours.
              </Typography>
              <AdoptionButtonWrapper petId={pet.id} />
              <LinkBox
                
                href="/dashboard/user/messages"
                sx={{ mt: 1.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, py: 1, borderRadius: 999, border: "1.5px solid", borderColor: "primary.main", color: "primary.main", fontWeight: 700, "&:hover": { bgcolor: "primary.light" } }}
              >
                <ChatBubbleOutlineIcon fontSize="small" /> Message about {pronoun}
              </LinkBox>
              <PetActions pet={pet} />
            </Box>

            <Box sx={{ bgcolor: "background.paper", borderRadius: 4, overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
              {shelterInfo && (
                <Box sx={{ position: "relative", height: 110 }}>
                  <Image src={shelterInfo.image} alt="" fill sizes="400px" style={{ objectFit: "cover" }} />
                </Box>
              )}
              <Box sx={{ p: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Listed by
                </Typography>
                <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {pet.shelter.name}
                  {pet.shelter.verified && <VerifiedIcon fontSize="small" sx={{ color: "primary.main" }} titleAccess="Verified shelter" />}
                </Typography>
                {pet.shelter.city && (
                  <Typography color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <LocationOnOutlinedIcon fontSize="small" /> {pet.shelter.city}
                  </Typography>
                )}
                {pet.shelter.phone && (
                  <Typography color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}>
                    <PhoneOutlinedIcon fontSize="small" /> {pet.shelter.phone}
                  </Typography>
                )}
                {pet.shelter.id && (
                  <LinkBox  href={`/shelters/${pet.shelter.id}`} sx={{ display: "inline-block", mt: 2, color: "primary.main", fontWeight: 700 }}>
                    More about this shelter →
                  </LinkBox>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {related.length > 0 && (
          <Box sx={{ mt: 8 }}>
            <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 }, mb: 3 }}>
              Other pets you may like
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
              {related.map((p) => (
                <PetCard key={p.id} pet={p} />
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default PetDetailsPage;
