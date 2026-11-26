import { Box, Container, Typography } from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import Image from "next/image";
import HeroSearch from "./components/HeroSearch";
import { heroPetImage } from "@/mock/pets";

const Paw = ({ size, top, left, rotate, delay }: { size: number; top: string; left: string; rotate: number; delay: string }) => (
  <PetsIcon
    aria-hidden
    className="pf-float"
    sx={{
      position: "absolute",
      top,
      left,
      fontSize: size,
      color: "secondary.main",
      opacity: 0.35,
      transform: `rotate(${rotate}deg)`,
      animationDelay: delay,
    }}
  />
);

const HeroSection = () => {
  return (
    <Box component="section" sx={{ position: "relative", pb: { xs: 2, md: 4 } }}>
      {/* Peach band */}
      <Box sx={{ bgcolor: "var(--pf-peach)", overflow: "hidden", position: "relative" }}>
        <Container sx={{ position: "relative" }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" },
              alignItems: "center",
              minHeight: { md: 460 },
              pt: { xs: 5, md: 0 },
              pb: { xs: 0, md: 9 },
              textAlign: { xs: "center", md: "left" },
            }}
          >
            <Box sx={{ position: "relative", zIndex: 2 }}>
              <Typography
                variant="h1"
                className="pf-fade-up"
                sx={{ fontSize: { xs: "2rem", sm: "2.6rem", md: "3.3rem" }, lineHeight: 1.15, color: "text.primary", letterSpacing: "-0.02em" }}
              >
                Your Companion Awaits, Find the{" "}
                <Box component="span" sx={{ color: "secondary.main" }}>
                  Perfect Match
                </Box>
              </Typography>
              <Typography
                className="pf-fade-up pf-delay-1"
                sx={{ mt: 2.5, maxWidth: 440, mx: { xs: "auto", md: 0 }, color: "text.secondary", fontSize: { xs: 15, md: 18 }, fontWeight: 500 }}
              >
                Over a thousand rescue pets need a home and a second chance. Meet yours today.
              </Typography>
            </Box>

            {/* Pet in an organic blob */}
            <Box
              className="pf-fade-up pf-delay-2"
              sx={{
                position: "relative",
                height: { xs: 280, sm: 340, md: 460 },
                width: { xs: 280, sm: 340, md: "100%" },
                mx: "auto",
                mt: { xs: 3, md: 0 },
              }}
            >
              <Box
                className="pf-blob"
                sx={{
                  position: "absolute",
                  inset: { xs: "6% 0 0 4%", md: "6% 2% -8% 12%" },
                  bgcolor: "var(--pf-rust)",
                }}
              />
              <Box
                className="pf-blob"
                sx={{
                  position: "absolute",
                  inset: { xs: "12% 8% 4% 12%", md: "14% 10% 0 20%" },
                  overflow: "hidden",
                  boxShadow: "0 30px 60px -30px rgba(0,0,0,.45)",
                  animationDelay: "-6s",
                }}
              >
                <Image src={heroPetImage} alt="Happy beagle waiting for adoption" fill priority sizes="(max-width: 900px) 340px, 600px" style={{ objectFit: "cover" }} />
              </Box>
              <Paw size={34} top="58%" left="-4%" rotate={-20} delay="0s" />
              <Paw size={26} top="78%" left="6%" rotate={15} delay="1.2s" />
            </Box>
          </Box>
          <Paw size={22} top="12%" left="46%" rotate={25} delay=".6s" />
        </Container>
      </Box>

      {/* Floating search card overlapping the band */}
      <Container sx={{ position: "relative", zIndex: 3, mt: { xs: -3, md: -5 } }}>
        <Box className="pf-fade-up pf-delay-3" sx={{ maxWidth: 960, mx: "auto" }}>
          <HeroSearch />
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;
