import { Box, Typography } from "@mui/material";
import Image from "next/image";
import PetsIcon from "@mui/icons-material/Pets";
import Logo from "./Logo";
import ThemeToggle from "../UI/ThemeToggle";
import { heroPetImage } from "@/mock/pets";

//* Branded side panel for login/register (peach band, pet in blob)
const AuthAside = ({ title, highlight }: { title: string; highlight: string }) => (
  <Box sx={{ position: "relative", height: "100%", bgcolor: "var(--pf-peach)", overflow: "hidden", display: "flex", flexDirection: "column", p: 5 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
      <Logo />
      <ThemeToggle />
    </Box>
    <Typography variant="h2" className="pf-fade-up" sx={{ mt: 6, fontSize: { sm: "2rem", md: "2.8rem" }, lineHeight: 1.15, maxWidth: 460, position: "relative", zIndex: 1 }}>
      {title}{" "}
      <Box component="span" sx={{ color: "secondary.main" }}>
        {highlight}
      </Box>
    </Typography>
    <Box sx={{ position: "relative", flex: 1, minHeight: 300, mt: 4 }}>
      <Box className="pf-blob" sx={{ position: "absolute", inset: "4% 2% 0 10%", bgcolor: "var(--pf-rust)" }} />
      <Box className="pf-blob" sx={{ position: "absolute", inset: "12% 10% 6% 18%", overflow: "hidden", animationDelay: "-6s" }}>
        <Image src={heroPetImage} alt="" fill sizes="50vw" style={{ objectFit: "cover" }} />
      </Box>
    </Box>
    <PetsIcon className="pf-float" sx={{ position: "absolute", left: 32, bottom: 40, fontSize: 40, color: "secondary.main", opacity: 0.35 }} />
  </Box>
);

export default AuthAside;
