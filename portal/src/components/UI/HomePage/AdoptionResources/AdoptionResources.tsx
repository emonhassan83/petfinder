"use client";

import { Box, Container, Typography } from "@mui/material";
import Link from "next/link";
import ChecklistRtlOutlinedIcon from "@mui/icons-material/ChecklistRtlOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const cards = [
  { icon: ChecklistRtlOutlinedIcon, title: "Checklist for New Adopters", text: "Make the adoption transition as smooth as possible, from supplies to the first vet visit.", href: "/blogs" },
  { icon: VerifiedUserOutlinedIcon, title: "Adopt Safely", text: "Look for the verified badge, meet the pet first and never pay outside the platform.", href: "/blogs" },
  { icon: QuizOutlinedIcon, title: "Pet Adoption FAQs", text: "Answers to the questions you haven't thought of yet, including fees and home visits.", href: "/blogs" },
];

//* "Planning to adopt a pet?" resource cards
const AdoptionResources = () => (
  <Container component="section" sx={{ py: { xs: 6, md: 9 } }} aria-labelledby="planning">
    <Typography id="planning" variant="h3" textAlign="center" sx={{ fontSize: { xs: "1.6rem", md: "2.2rem" } }}>
      Planning to Adopt a Pet?
    </Typography>
    <Typography textAlign="center" color="text.secondary" sx={{ mt: 1, mb: { xs: 4, md: 6 } }}>
      Everything you need to get ready for your new family member.
    </Typography>
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
      {cards.map(({ icon: Icon, title, text, href }) => (
        <Box
          key={title}
          component={Link}
          href={href}
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            textAlign: "center",
            transition: "transform .25s ease, box-shadow .25s ease",
            "&:hover": { transform: "translateY(-6px)", boxShadow: "var(--pf-shadow)" },
            "&:hover .more svg": { transform: "translateX(4px)" },
          }}
        >
          <Box sx={{ width: 72, height: 72, mx: "auto", borderRadius: "50%", bgcolor: "var(--pf-peach)", color: "var(--pf-rust)", display: "grid", placeItems: "center", mb: 2 }}>
            <Icon sx={{ fontSize: 34 }} />
          </Box>
          <Typography variant="h6" sx={{ color: "text.primary" }}>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
            {text}
          </Typography>
          <Typography className="more" sx={{ color: "primary.main", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            Learn more <ArrowForwardIcon fontSize="small" sx={{ transition: "transform .2s ease" }} />
          </Typography>
        </Box>
      ))}
    </Box>
  </Container>
);

export default AdoptionResources;
