import { Box, Container, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import LinkBox from "@/components/Shared/LinkBox";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import VaccinesOutlinedIcon from "@mui/icons-material/VaccinesOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Meta from "@/components/Meta/MetaData";
import PageHeader from "@/components/Shared/PageHeader";
import DonateForm from "./components/DonateForm";
import { previewPets, unsplash } from "@/mock/pets";

const impact = [
  { icon: RestaurantOutlinedIcon, amount: "৳500", text: "feeds a shelter dog for a week" },
  { icon: VaccinesOutlinedIcon, amount: "৳1,000", text: "covers vaccinations for one rescue" },
  { icon: HomeOutlinedIcon, amount: "৳5,000", text: "funds a month of foster care" },
];

//* Donate: gift picker, impact and sponsor-a-pet
const DonatePage = () => (
  <>
    <Meta title="Donate | Petfinder" description="Support shelters and rescues helping pets find loving homes." />
    <PageHeader
      title="Help a pet get their"
      highlight="second chance"
      crumbs={[{ label: "Donate" }]}
      subtitle="Your gift funds food, vet care and foster homes through our partner shelters and rescues."
    />

    <Container sx={{ py: { xs: 4, md: 7 } }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" }, gap: { xs: 4, md: 7 }, alignItems: "start" }}>
        <Box>
          <Box sx={{ position: "relative", height: { xs: 240, md: 340 }, borderRadius: 5, overflow: "hidden", boxShadow: "var(--pf-shadow)" }}>
            <Image src={unsplash("1518717758536-85ae29035b6d", 1000)} alt="Rescued dog" fill priority sizes="(max-width: 900px) 100vw, 55vw" style={{ objectFit: "cover" }} />
          </Box>
          <Typography variant="h4" sx={{ fontSize: { xs: 22, md: 28 }, mt: 4 }}>
            Where your money goes
          </Typography>
          <Box sx={{ display: "grid", gap: 2, mt: 2 }}>
            {impact.map(({ icon: Icon, amount, text }, i) => (
              <Box key={amount} className="pf-fade-up" style={{ animationDelay: `${i * 0.1}s` }} sx={{ display: "flex", alignItems: "center", gap: 2, p: 2, borderRadius: 3, bgcolor: "var(--pf-soft)", border: "1px solid", borderColor: "divider" }}>
                <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "var(--pf-peach)", color: "var(--pf-rust)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon />
                </Box>
                <Typography>
                  <Box component="span" sx={{ fontWeight: 800, color: "primary.main" }}>
                    {amount}
                  </Box>{" "}
                  {text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ position: { md: "sticky" }, top: { md: 96 } }}>
          <DonateForm />
        </Box>
      </Box>

      <Typography variant="h3" textAlign="center" sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" }, mt: { xs: 7, md: 10 } }}>
        Sponsor a pet
      </Typography>
      <Typography textAlign="center" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
        Can&apos;t adopt right now? Sponsor a pet&apos;s care until they find a home.
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 3 }}>
        {previewPets.slice(0, 3).map((p) => (
          <LinkBox key={p.id}  href={`/pets/${p.id}`} className="pf-lift" sx={{ borderRadius: 4, overflow: "hidden", bgcolor: "background.paper", border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ position: "relative", height: 200 }}>
              <Image src={p.image} alt={p.name} fill sizes="(max-width: 600px) 100vw, 33vw" style={{ objectFit: "cover" }} />
            </Box>
            <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h6">{p.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {p.breed}
                </Typography>
              </Box>
              <Typography sx={{ color: "secondary.main", fontWeight: 800 }}>Sponsor →</Typography>
            </Box>
          </LinkBox>
        ))}
      </Box>
    </Container>
  </>
);

export default DonatePage;
