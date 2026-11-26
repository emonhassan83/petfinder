import { Box, Breadcrumbs, Container, Typography } from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  title: string;
  highlight?: string;
  subtitle?: ReactNode;
  crumbs?: { label: string; href?: string }[];
  image?: string;
  children?: ReactNode;
};

//* Peach band used at the top of every inner portal page
const PageHeader = ({ title, highlight, subtitle, crumbs = [], image, children }: Props) => (
  <Box component="header" sx={{ bgcolor: "var(--pf-peach)", position: "relative", overflow: "hidden" }}>
    <PetsIcon aria-hidden sx={{ position: "absolute", right: "6%", top: 24, fontSize: 64, color: "secondary.main", opacity: 0.12, transform: "rotate(20deg)" }} />
    <PetsIcon aria-hidden sx={{ position: "absolute", left: "48%", bottom: 12, fontSize: 40, color: "secondary.main", opacity: 0.12, transform: "rotate(-15deg)" }} />
    <Container sx={{ position: "relative", py: { xs: 4, md: 6 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: image ? "1.4fr 1fr" : "1fr" }, gap: 4, alignItems: "center" }}>
      <Box>
        {crumbs.length > 0 && (
          <Breadcrumbs sx={{ mb: 1.5, fontSize: 14, "& a:hover": { color: "primary.main" } }}>
            <Link href="/">Home</Link>
            {crumbs.map((c) =>
              c.href ? (
                <Link key={c.label} href={c.href}>
                  {c.label}
                </Link>
              ) : (
                <Typography key={c.label} sx={{ fontSize: 14, color: "text.primary", fontWeight: 700 }}>
                  {c.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}
        <Typography variant="h1" className="pf-fade-up" sx={{ fontSize: { xs: "1.9rem", md: "2.8rem" }, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          {title}{" "}
          {highlight && (
            <Box component="span" sx={{ color: "secondary.main" }}>
              {highlight}
            </Box>
          )}
        </Typography>
        {subtitle && (
          <Typography className="pf-fade-up pf-delay-1" color="text.secondary" sx={{ mt: 1.5, maxWidth: 620, fontSize: { md: 17 } }}>
            {subtitle}
          </Typography>
        )}
        {children && (
          <Box className="pf-fade-up pf-delay-2" sx={{ mt: 3 }}>
            {children}
          </Box>
        )}
      </Box>
      {image && (
        <Box sx={{ display: { xs: "none", md: "block" }, position: "relative", height: 240 }}>
          <Box className="pf-blob" sx={{ position: "absolute", inset: "0 8% 0 14%", bgcolor: "var(--pf-rust)" }} />
          <Box className="pf-blob" sx={{ position: "absolute", inset: "8% 16% 6% 22%", overflow: "hidden", animationDelay: "-6s" }}>
            <Image src={image} alt="" fill sizes="320px" style={{ objectFit: "cover" }} />
          </Box>
        </Box>
      )}
    </Container>
  </Box>
);

export default PageHeader;
