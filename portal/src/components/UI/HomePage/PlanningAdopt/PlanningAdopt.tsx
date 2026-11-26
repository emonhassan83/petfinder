import { Box, Container, Typography } from "@mui/material";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Image from "next/image";
import { adoptingGuideImage } from "@/mock/pets";
import Reveal from "../../Reveal";

const tips = [
  {
    icon: SavingsOutlinedIcon,
    title: "Financial Planning for Pet Ownership",
    text: "Consider the costs of your pet's needs and well-being: food, vet care, grooming, insurance and supplies.",
  },
  {
    icon: SchoolOutlinedIcon,
    title: "Educating Yourself on Pet Care",
    text: "Learn about their specific needs and behaviour, and plan proper care, training and a suitable environment for your new companion.",
  },
  {
    icon: HomeOutlinedIcon,
    title: "Creating a Pet-Friendly Home",
    text: "Make adjustments to your living space: pet-proofing, comfortable bedding and toys so they feel safe and secure.",
  },
];

//* "Things to know and prepare when adopting"
const PlanningAdopt = () => {
  return (
    <Box component="section" sx={{ bgcolor: "var(--pf-soft)", py: { xs: 6, md: 10 } }} aria-labelledby="things-to-know">
      <Container>
        <Box sx={{ textAlign: "center", maxWidth: 680, mx: "auto", mb: { xs: 4, md: 6 } }}>
          <Typography id="things-to-know" variant="h3" sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" } }}>
            Things to Know and Prepare when Adopting
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1.5 }}>
            Before bringing a new furry family member home, consider the responsibility of providing a safe haven,
            affection, and the time they need to thrive.
          </Typography>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: { xs: 4, md: 8 }, alignItems: "center" }}>
          <Box
            sx={{
              position: "relative",
              height: { xs: 260, md: 400 },
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: "var(--pf-shadow)",
              "& img": { transition: "transform 1s ease" },
              "&:hover img": { transform: "scale(1.04)" },
            }}
          >
            <Image src={adoptingGuideImage} alt="Golden retriever relaxing at home" fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: "cover" }} />
          </Box>

          <Box sx={{ display: "grid", gap: 3.5 }}>
            {tips.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={i * 120}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      bgcolor: "primary.main",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      boxShadow: "0 0 0 6px var(--pf-primary-light)",
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ color: "var(--pf-rust)", fontSize: { xs: 17, md: 19 } }}>
                      {title}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                      {text}
                    </Typography>
                  </Box>
                </Box>
              </Reveal>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default PlanningAdopt;
