import { Box, Container, Typography } from "@mui/material";
import SectionHeading from "@/components/Shared/SectionHeading";
import { testimonials } from "@/mock/stories";

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

//* Adopter and shelter quotes.
const Testimonials = () => (
  <Container component="section" aria-labelledby="testimonials-title" sx={{ py: { xs: 6, md: 10 } }}>
    <SectionHeading id="testimonials-title" overline="Kind words" title={<>Loved by adopters <em>and</em> shelters</>} />
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3 }}>
      {testimonials.map((t, i) => (
        <Box
          component="figure"
          key={t.name}
          sx={{
            m: 0,
            p: { xs: 3, md: 4 },
            borderRadius: "var(--pf-radius-card)",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: i === 1 ? "text.primary" : "background.paper",
            color: i === 1 ? "background.default" : "text.primary",
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <Typography aria-hidden sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontSize: 64, lineHeight: 0.6, color: "secondary.main", height: 28 }}>
            &ldquo;
          </Typography>
          <Box component="blockquote" sx={{ m: 0, flex: 1 }}>
            <Typography sx={{ fontFamily: "var(--font-heading), Georgia, serif", fontStyle: "italic", fontSize: { xs: 19, md: 21 }, lineHeight: 1.5, color: "inherit" }}>
              {t.quote}
            </Typography>
          </Box>
          <Box component="figcaption" sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "var(--pf-peach)", color: "var(--pf-rust)", fontWeight: 800, fontSize: 15 }}>
              {initials(t.name)}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, color: "inherit" }}>{t.name}</Typography>
              <Typography sx={{ fontSize: 13, opacity: 0.7, color: "inherit" }}>
                {t.role} · {t.city}
              </Typography>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  </Container>
);

export default Testimonials;
