"use client";

import { useState } from "react";
import { Box, Button, Container, IconButton, InputBase, Typography } from "@mui/material";
import Link from "next/link";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import XIcon from "@mui/icons-material/X";
import YouTubeIcon from "@mui/icons-material/YouTube";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import { toast } from "sonner";
import Logo from "../Logo";

const columns = [
  {
    title: "Adopt",
    links: [
      { label: "Dogs", href: "/pets?species=Dog" },
      { label: "Cats", href: "/pets?species=Cat" },
      { label: "Other animals", href: "/pets?species=Rabbit" },
      { label: "Shelters & rescues", href: "/shelters" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Adoption articles", href: "/blogs" },
      { label: "Checklist for new adopters", href: "/blogs" },
      { label: "Adoption FAQs", href: "/blogs" },
      { label: "Saved pets", href: "/dashboard/user/favorites" },
    ],
  },
  {
    title: "For shelters & owners",
    links: [
      { label: "List a pet", href: "/register" },
      { label: "Plans & pricing", href: "/dashboard/shelter/billing" },
      { label: "Get verified", href: "/dashboard/shelter" },
      { label: "Shelter dashboard", href: "/dashboard/shelter" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About us", href: "/about-us" },
      { label: "Donate", href: "/donate" },
      { label: "Contact", href: "/about-us" },
      { label: "Report a listing", href: "/about-us" },
    ],
  },
];

const socials = [
  { icon: FacebookIcon, label: "Facebook" },
  { icon: InstagramIcon, label: "Instagram" },
  { icon: XIcon, label: "X" },
  { icon: YouTubeIcon, label: "YouTube" },
];

const Footer = () => {
  const [email, setEmail] = useState("");

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Please enter a valid email address.");
    //* Preview only: newsletter API arrives with the backend phase
    toast.success("Thanks! You're on the list.");
    setEmail("");
  };

  return (
    <Box component="footer" sx={{ mt: 4 }}>
      {/* Newsletter band */}
      <Box sx={{ bgcolor: "var(--pf-peach)" }}>
        <Container sx={{ py: { xs: 4, md: 5 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, alignItems: "center" }}>
          <Box>
            <Typography variant="h5" sx={{ fontSize: { xs: 20, md: 26 } }}>
              Get adoption tips and new pets in your inbox
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              One friendly email a week. Unsubscribe anytime.
            </Typography>
          </Box>
          <Box
            component="form"
            onSubmit={subscribe}
            sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "background.paper", borderRadius: 999, p: 0.75, pl: 2.5, boxShadow: "var(--pf-shadow)" }}
          >
            <MailOutlineIcon sx={{ color: "text.secondary" }} />
            <InputBase
              fullWidth
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputProps={{ "aria-label": "Email address" }}
              sx={{ color: "text.primary" }}
            />
            <Button type="submit" color="secondary" sx={{ flexShrink: 0 }}>
              Subscribe
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Links */}
      <Box sx={{ bgcolor: "var(--pf-footer)", color: "rgba(255,255,255,.85)" }}>
        <Container sx={{ py: { xs: 5, md: 7 } }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "1.4fr repeat(4, 1fr)" }, gap: { xs: 4, md: 5 } }}>
            <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
              <Logo light />
              <Typography sx={{ mt: 2, maxWidth: 300, fontSize: 15 }}>
                Petfinder connects loving families with verified shelters and pet owners, so every pet gets a second chance.
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                {socials.map(({ icon: Icon, label }) => (
                  <IconButton
                    key={label}
                    aria-label={label}
                    sx={{ color: "#fff", bgcolor: "rgba(255,255,255,.1)", "&:hover": { bgcolor: "secondary.main", transform: "translateY(-2px)" } }}
                  >
                    <Icon fontSize="small" />
                  </IconButton>
                ))}
              </Box>
            </Box>
            {columns.map((col) => (
              <Box key={col.title}>
                <Typography sx={{ color: "#fff", fontFamily: "var(--font-heading), sans-serif", fontWeight: 700, mb: 1.5 }}>{col.title}</Typography>
                <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 1 }}>
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Box component={Link} href={l.href} sx={{ fontSize: 15, transition: "color .2s ease, padding .2s ease", "&:hover": { color: "#fff", pl: 0.5 } }}>
                        {l.label}
                      </Box>
                    </li>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
          <Box sx={{ borderTop: "1px solid rgba(255,255,255,.15)", mt: 5, pt: 3, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1, fontSize: 14 }}>
            <span>© {new Date().getFullYear()} Petfinder. All rights reserved.</span>
            <span>Privacy · Terms · Cookies</span>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;
