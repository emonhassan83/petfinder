import { Box, Breadcrumbs, Chip, Container, Divider, Typography } from "@mui/material";
import Link from "next/link";
import LinkBox from "@/components/Shared/LinkBox";
import Image from "next/image";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import AdoptionButtonWrapper from "./components/AddAdoptButtonWrapper";
import PetGallery from "./components/PetGallery";
import PetActions from "./components/PetActions";
import PetCard from "../components/petCard/PetCard";
import PetFees from "./components/PetFees";
import CostCalculator from "./components/CostCalculator";
import BookVisit from "./components/BookVisit";
import MessageButton from "./components/MessageButton";
import { CostEstimates, FeeLine, getFeeBreakdown } from "@/lib/petCosts";
import { fetchApi, normalizePet } from "@/lib/apiData";
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
  videos?: string[];
  description?: string;
  status?: string;
  userId?: string;
  healthStatus?: string;
  traits: string[];
  goodWith: string[];
  houseTrained?: boolean;
  vaccinated?: boolean;
  spayedNeutered?: boolean;
  medicalHistory?: string;
  adoptionRequirements?: string;
  fee?: number;
  shelter: { id?: string; name: string; city?: string; phone?: string; verified: boolean; image?: string };
  //* fee lines in minor units (poisha), from GET /pets/:id/fees
  feeLines?: FeeLine[];
  feeCurrency?: string;
  isPreview?: boolean;
};

//* Preview ids come from mock data; everything else from the API
const loadPet = async (id: string): Promise<Pet | null> => {
  const preview = findPreviewPet(id);
  if (preview) {
    const s = findPreviewShelter(preview.shelterId)!;
    //* preview fees are major units; PetFees renders minor units
    const feeLines = getFeeBreakdown(preview).map((l) => ({ ...l, amount: l.amount * 100 }));
    return {
      ...preview,
      isPreview: true,
      feeLines,
      feeCurrency: "BDT",
      shelter: { id: s.id, name: s.name, city: s.city, phone: s.phone, verified: s.verified, image: s.image },
    };
  }
  const res = await fetchApi<any>(`/pets/${id}`, { cache: "no-store" });
  if (!res?.data) return null;
  const p = normalizePet(res.data);
  const [feesRes, shelterRes] = await Promise.all([
    fetchApi<{ currency: string; total: number; fees: any[] }>(`/pets/${id}/fees`, { cache: "no-store" }),
    p.shelter?.slug ? fetchApi<any>(`/shelters/${p.shelter.slug}?petLimit=1`) : Promise.resolve(null),
  ]);
  const fees = feesRes?.data;
  const shelter = shelterRes?.data;
  return {
    ...p,
    traits: p.temperament ? String(p.temperament).split(",").map((t: string) => t.trim()).filter(Boolean) : [],
    goodWith: [],
    fee: fees?.total ? Math.round(fees.total / 100) : undefined,
    feeLines: (fees?.fees ?? []).map((f: any) => ({ label: f.label, amount: f.amount, note: f.note ?? undefined })),
    feeCurrency: fees?.currency ?? "BDT",
    shelter: p.shelter
      ? {
          id: p.shelter.slug || p.shelter.id,
          name: p.shelter.name,
          city: shelter?.location?.city || shelter?.location?.name || p.location,
          phone: shelter?.phone || undefined,
          verified: p.shelter.verificationStatus === "VERIFIED",
          image: shelter?.coverImage || shelter?.logo || undefined,
        }
      : { name: p.user?.name ?? "Pet owner", city: p.location, verified: false },
  };
};

//* Same species first, from the API (preview pets for preview ids)
const loadRelated = async (pet: Pet) => {
  if (pet.isPreview) {
    return previewPets.filter((p) => p.id !== pet.id && (p.species === pet.species || p.shelterId === pet.shelter.id)).slice(0, 3);
  }
  const res = await fetchApi<any[]>(`/pets?species=${encodeURIComponent(pet.species)}&limit=4`);
  return (res?.data ?? []).filter((p) => p.id !== pet.id).slice(0, 3).map(normalizePet);
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
  const [related, settings] = await Promise.all([loadRelated(pet), fetchApi<Record<string, any>>("/settings/public")]);
  const estimates = settings?.data?.["cost.estimates"] as CostEstimates | undefined;
  const shelterImage = pet.shelter.image ?? (pet.shelter.id ? previewShelters.find((s) => s.id === pet.shelter.id)?.image : undefined);
  const fees = pet.feeLines ?? [];
  const feeTotal = fees.reduce((sum, l) => sum + l.amount, 0);
  const acceptsApplications = !pet.status || pet.status === "PUBLISHED";
  const sectionTitle = { fontSize: { xs: 24, md: 32 }, "& em": { color: "secondary.main" } };

  return (
    <Box sx={{ pb: 6 }}>
      <Container sx={{ pt: { xs: 3, md: 4 } }}>
        <Breadcrumbs sx={{ mb: 2.5, fontSize: 13, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, "& a": { color: "text.secondary" } }}>
          <Link href="/">Home</Link>
          <Link href="/pets">Find a pet</Link>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: "secondary.main", letterSpacing: "inherit" }}>{pet.name}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.7fr 1fr" }, gap: { xs: 3, md: 5 }, alignItems: "start" }}>
          {/* Main column */}
          <Box>
            <PetGallery photos={pet.photos} videos={pet.videos} name={pet.name} />

            <Box sx={{ mt: 4 }}>
              <Typography variant="h1" sx={{ fontSize: { xs: "2.6rem", md: "3.8rem" } }}>
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

            <Typography variant="h4" sx={sectionTitle}>
              About
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 1.5, mt: 2 }}>
              <Fact label="Species" value={pet.species} />
              <Fact label="Breed" value={pet.breed} />
              <Fact label="Age" value={`${pet.age} ${pet.age === 1 ? "year" : "years"}`} />
              <Fact label="Size" value={pet.size} />
              <Fact label="Colour" value={pet.color} />
              {pet.healthStatus && <Fact label="Health" value={pet.healthStatus} />}
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
              {pet.isPreview && (
              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1 }}>Health</Typography>
                <Box sx={{ display: "grid", gap: 1 }}>
                  <Health ok={pet.vaccinated} label="Vaccinations up to date" />
                  <Health ok={pet.spayedNeutered} label="Spayed / neutered" />
                  <Health ok={pet.houseTrained} label="House-trained" />
                </Box>
              </Box>
              )}
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

            <Typography variant="h4" sx={sectionTitle}>
              Meet <em>{pet.name}</em>
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

            {fees.length > 0 && (
              <>
                <Divider sx={{ my: 4 }} />
                <Typography variant="h4" sx={sectionTitle}>
                  What the fee covers
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 1, mb: 2.5 }}>
                  No hidden costs. This is exactly what {pet.shelter.name} charges and why.
                </Typography>
                <PetFees lines={fees} total={feeTotal} currency={pet.feeCurrency} />
              </>
            )}

            <Divider sx={{ my: 4 }} />
            <Typography variant="h4" sx={sectionTitle}>
              Plan your first year
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 2.5 }}>
              Adjust the options to see what life with {pet.name} might cost.
            </Typography>
            <CostCalculator species={pet.species} size={pet.size} fee={pet.fee} name={pet.name} estimates={estimates} />
          </Box>

          {/* Sticky sidebar */}
          <Box sx={{ position: { md: "sticky" }, top: { md: 96 }, display: "grid", gap: 3 }}>
            <Box id="apply" sx={{ scrollMarginTop: 96, bgcolor: "background.paper", borderRadius: "var(--pf-radius-card)", p: 3, border: "1px solid", borderColor: "divider", boxShadow: "var(--pf-shadow)" }}>
              <Typography variant="h5" sx={{ fontSize: 24 }}>
                Considering {pet.name} for adoption?
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Send an application and the {pet.shelter.verified ? "shelter" : "owner"} will get back to you, usually within 48 hours.
              </Typography>
              <AdoptionButtonWrapper petId={pet.id} ownerId={pet.userId} acceptsApplications={acceptsApplications} />
              {acceptsApplications && <BookVisit pet={{ id: pet.id, name: pet.name, image: pet.image, ownerId: pet.userId }} shelterName={pet.shelter.name} />}
              <MessageButton petId={pet.id} ownerId={pet.userId} label={`Message about ${pronoun}`} />
              <PetActions pet={pet} />
            </Box>

            <Box sx={{ bgcolor: "background.paper", borderRadius: "var(--pf-radius-card)", overflow: "hidden", border: "1px solid", borderColor: "divider" }}>
              {shelterImage && (
                <Box sx={{ position: "relative", height: 110 }}>
                  <Image src={shelterImage} alt="" fill sizes="400px" style={{ objectFit: "cover" }} />
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
            <Typography variant="h4" sx={{ ...sectionTitle, mb: 3 }}>
              Other pets you may like
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
              {related.map((p: any) => (
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
