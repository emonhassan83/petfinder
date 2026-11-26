"use client";

import { Box, Button, Container, Typography } from "@mui/material";
import Link from "next/link";
import VerifiedIcon from "@mui/icons-material/Verified";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";

const points = [
  { icon: CampaignOutlinedIcon, text: "List pets with photos and videos" },
  { icon: ForumOutlinedIcon, text: "Chat with adopters in real time" },
  { icon: VerifiedIcon, text: "Earn a verified shelter badge" },
];

//* Call to action for shelters and pet owners (plan: shelter/owner listings + subscriptions)
const ShelterCta = () => (
  <Container component="section" sx={{ py: { xs: 6, md: 9 } }}>
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 6,
        bgcolor: "primary.main",
        color: "#fff",
        p: { xs: 4, md: 7 },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.3fr 1fr" },
        gap: 4,
        alignItems: "center",
      }}
    >
      <Box className="pf-blob" sx={{ position: "absolute", width: 380, height: 380, right: -120, top: -140, bgcolor: "rgba(255,255,255,.08)" }} />
      <Box className="pf-blob" sx={{ position: "absolute", width: 240, height: 240, right: 120, bottom: -160, bgcolor: "var(--pf-accent)", opacity: 0.35, animationDelay: "-4s" }} />
      <Box sx={{ position: "relative" }}>
        <Typography variant="h3" sx={{ fontSize: { xs: "1.6rem", md: "2.4rem" }, color: "#fff" }}>
          Are you a shelter or rehoming a pet?
        </Typography>
        <Typography sx={{ mt: 1.5, opacity: 0.9, maxWidth: 520 }}>
          Reach thousands of loving adopters. Start free with up to 3 listings, then upgrade as you grow.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 3, flexWrap: "wrap" }}>
          <Button component={Link} href="/register" sx={{ bgcolor: "#fff", color: "primary.dark", "&:hover": { bgcolor: "var(--pf-peach)" } }}>
            List a pet
          </Button>
          <Button component={Link} href="/shelters" variant="outlined" sx={{ color: "#fff", borderColor: "rgba(255,255,255,.6)", "&:hover": { borderColor: "#fff", bgcolor: "rgba(255,255,255,.08)" } }}>
            Browse shelters
          </Button>
        </Box>
      </Box>
      <Box sx={{ position: "relative", display: "grid", gap: 2 }}>
        {points.map(({ icon: Icon, text }) => (
          <Box key={text} sx={{ display: "flex", alignItems: "center", gap: 2, bgcolor: "rgba(255,255,255,.12)", borderRadius: 3, p: 2, backdropFilter: "blur(4px)" }}>
            <Icon />
            <Typography sx={{ fontWeight: 700 }}>{text}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  </Container>
);

export default ShelterCta;
