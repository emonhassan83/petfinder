import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

type Props = {
  id?: string;
  //* Small uppercase label above the title
  overline?: string;
  //* Title; wrap a word in <em> for the italic accent
  title: ReactNode;
  sub?: string;
  align?: "center" | "left";
};

//* Editorial section heading used by the home sections (Fraunces title, italic accent word).
const SectionHeading = ({ id, overline, title, sub, align = "center" }: Props) => (
  <Box sx={{ textAlign: align, mb: { xs: 4, md: 6 }, maxWidth: align === "center" ? 720 : "none", mx: align === "center" ? "auto" : 0 }}>
    {overline && (
      <Typography variant="overline" sx={{ color: "secondary.main", display: "block", mb: 1 }}>
        {overline}
      </Typography>
    )}
    <Typography
      id={id}
      variant="h2"
      sx={{ fontSize: { xs: "2rem", md: "2.9rem" }, "& em": { fontStyle: "italic", color: "secondary.main" } }}
    >
      {title}
    </Typography>
    {sub && (
      <Typography color="text.secondary" sx={{ mt: 1.5, fontSize: { xs: 15, md: 17 }, lineHeight: 1.65 }}>
        {sub}
      </Typography>
    )}
  </Box>
);

export default SectionHeading;
