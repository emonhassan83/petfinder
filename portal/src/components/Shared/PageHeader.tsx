import { Box, Breadcrumbs, Container, Typography } from "@mui/material";
import Link from "next/link";
import { ReactNode } from "react";
import ArchImage from "@/components/UI/ArchImage";

type Props = {
  title: string;
  //* Shown in italic accent colour after the title
  highlight?: string;
  subtitle?: ReactNode;
  crumbs?: { label: string; href?: string }[];
  image?: string;
  children?: ReactNode;
};

//* Editorial header used at the top of every inner portal page (cream, Fraunces title, optional arched photo)
const PageHeader = ({ title, highlight, subtitle, crumbs = [], image, children }: Props) => (
  <Box component="header" sx={{ position: "relative", overflow: "hidden", borderBottom: "1px solid", borderColor: "divider" }}>
    <Box aria-hidden className="pf-blob" sx={{ position: "absolute", width: 420, height: 420, right: -140, top: -200, bgcolor: "var(--pf-sand)", opacity: 0.6 }} />
    <Container
      sx={{
        position: "relative",
        py: { xs: 4, md: 7 },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: image ? "1.5fr 1fr" : "1fr" },
        gap: { xs: 3, md: 6 },
        alignItems: "center",
      }}
    >
      <Box>
        {crumbs.length > 0 && (
          <Breadcrumbs sx={{ mb: 2, fontSize: 13, textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, "& a": { color: "text.secondary" }, "& a:hover": { color: "primary.main" } }}>
            <Link href="/">Home</Link>
            {crumbs.map((c) =>
              c.href ? (
                <Link key={c.label} href={c.href}>
                  {c.label}
                </Link>
              ) : (
                <Typography key={c.label} sx={{ fontSize: 13, color: "secondary.main", fontWeight: 700, letterSpacing: "inherit" }}>
                  {c.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}
        <Typography variant="h1" className="pf-fade-up" sx={{ fontSize: { xs: "2.3rem", md: "3.6rem" }, maxWidth: 860 }}>
          {title}{" "}
          {highlight && (
            <Box component="em" sx={{ color: "secondary.main", fontStyle: "italic" }}>
              {highlight}
            </Box>
          )}
        </Typography>
        {subtitle && (
          <Typography className="pf-fade-up pf-delay-1" color="text.secondary" sx={{ mt: 2, maxWidth: 620, fontSize: { xs: 15, md: 18 }, lineHeight: 1.65 }}>
            {subtitle}
          </Typography>
        )}
        {children && (
          <Box className="pf-fade-up pf-delay-2" sx={{ mt: 3.5 }}>
            {children}
          </Box>
        )}
      </Box>
      {image && (
        <Box sx={{ display: { xs: "none", md: "block" }, maxWidth: 300, justifySelf: "end", width: "100%" }}>
          <ArchImage src={image} alt="" ratio="4 / 4.4" sizes="300px" />
        </Box>
      )}
    </Container>
  </Box>
);

export default PageHeader;
