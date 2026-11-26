import { Box, Container, Typography } from "@mui/material";
import Image from "next/image";
import SearchIcon from "@mui/icons-material/Search";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import Meta from "@/components/Meta/MetaData";
import PageHeader from "@/components/Shared/PageHeader";
import Reveal from "@/components/UI/Reveal";
import { adoptingGuideImage, unsplash } from "@/mock/pets";

const stats = [
  { value: "1,200+", label: "Pets adopted" },
  { value: "85", label: "Partner shelters" },
  { value: "40+", label: "Verified rescues" },
  { value: "24h", label: "Average reply time" },
];

const steps = [
  { icon: SearchIcon, title: "Search", text: "Browse pets by area, species, breed, age and more. Save the ones you love." },
  { icon: ForumOutlinedIcon, title: "Connect", text: "Apply online and chat directly with the shelter or owner to arrange a visit." },
  { icon: FavoriteBorderIcon, title: "Adopt", text: "Meet your match, complete the adoption and welcome your new family member home." },
];

const promises = [
  { icon: VerifiedUserOutlinedIcon, title: "Verified shelters", text: "Shelters submit documents and are reviewed by our team before earning the verified badge." },
  { icon: GavelOutlinedIcon, title: "Safe & moderated", text: "Every listing can be reported. Moderators review reports and act on scams or welfare concerns." },
  { icon: VolunteerActivismOutlinedIcon, title: "Free for adopters", text: "Searching, saving and applying is always free. Shelters can start free and upgrade as they grow." },
];

//* About Petfinder: mission, numbers, how it works and our promise
const AboutUsPage = () => (
  <>
    <Meta title="About us | Petfinder" description="Petfinder connects adopters with verified shelters and pet owners." />
    <PageHeader
      title="Every pet deserves a"
      highlight="loving home"
      crumbs={[{ label: "About" }]}
      subtitle="Petfinder is an adoption platform that connects families with verified shelters, rescues and responsible owners."
      image={unsplash("1537151625747-768eb6cf92b2", 600)}
    />

    <Container sx={{ py: { xs: 5, md: 8 } }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        {stats.map((s, i) => (
          <Box key={s.label} className="pf-fade-up" style={{ animationDelay: `${i * 0.08}s` }} sx={{ textAlign: "center", p: 3, borderRadius: 4, bgcolor: "var(--pf-soft)", border: "1px solid", borderColor: "divider" }}>
            <Typography sx={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 800, fontSize: { xs: 28, md: 40 }, color: "primary.main" }}>{s.value}</Typography>
            <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
              {s.label}
            </Typography>
          </Box>
        ))}
      </Box>

      <Reveal>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 4, md: 8 }, alignItems: "center", mt: { xs: 7, md: 10 } }}>
          <Box sx={{ position: "relative", height: { xs: 260, md: 380 }, borderRadius: 5, overflow: "hidden", boxShadow: "var(--pf-shadow)" }}>
            <Image src={adoptingGuideImage} alt="Dog waiting for adoption" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </Box>
          <Box>
            <Typography variant="h3" sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" } }}>
              Our mission
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 2, fontSize: 17, lineHeight: 1.8 }}>
              Too many pets wait in shelters while families search in the wrong places. We bring shelters, rescues and owners onto one trusted
              platform so adopters can find the right pet quickly and safely, and every pet gets a second chance.
            </Typography>
          </Box>
        </Box>
      </Reveal>

      <Typography variant="h3" textAlign="center" sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" }, mt: { xs: 7, md: 10 }, mb: 4 }}>
        How Petfinder works
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
        {steps.map(({ icon: Icon, title, text }, i) => (
          <Reveal key={title} delay={i * 120}>
            <Box sx={{ position: "relative", p: 4, borderRadius: 4, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", height: "100%" }}>
              <Typography sx={{ position: "absolute", top: 16, right: 24, fontFamily: "var(--font-heading), sans-serif", fontWeight: 800, fontSize: 48, color: "var(--pf-peach)" }}>
                {i + 1}
              </Typography>
              <Box sx={{ width: 56, height: 56, borderRadius: "50%", bgcolor: "primary.main", color: "#fff", display: "grid", placeItems: "center", boxShadow: "0 0 0 6px var(--pf-primary-light)" }}>
                <Icon />
              </Box>
              <Typography variant="h6" sx={{ mt: 2 }}>
                {title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {text}
              </Typography>
            </Box>
          </Reveal>
        ))}
      </Box>

      <Box sx={{ mt: { xs: 7, md: 10 }, p: { xs: 3, md: 6 }, borderRadius: 5, bgcolor: "var(--pf-peach)" }}>
        <Typography variant="h3" textAlign="center" sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" }, mb: 4 }}>
          Our promise
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
          {promises.map(({ icon: Icon, title, text }) => (
            <Box key={title} sx={{ textAlign: "center" }}>
              <Icon sx={{ fontSize: 40, color: "var(--pf-rust)" }} />
              <Typography variant="h6" sx={{ mt: 1 }}>
                {title}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Container>
  </>
);

export default AboutUsPage;
