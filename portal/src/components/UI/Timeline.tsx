import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

export type TimelineStep = { title: string; text: string; icon?: ReactNode };

//* Numbered steps: horizontal on desktop, vertical on mobile (e.g. "How adoption works").
const Timeline = ({ steps }: { steps: TimelineStep[] }) => (
  <Box
    component="ol"
    sx={{
      listStyle: "none",
      m: 0,
      p: 0,
      display: "grid",
      gap: { xs: 3, md: 4 },
      gridTemplateColumns: { xs: "1fr", md: `repeat(${steps.length}, 1fr)` },
    }}
  >
    {steps.map((step, i) => (
      <Box
        component="li"
        key={step.title}
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: { xs: "row", md: "column" },
          gap: 2,
          //* Connector line to the next step
          "&:not(:last-of-type)::after": {
            content: '""',
            position: "absolute",
            bgcolor: "divider",
            top: { xs: 52, md: 26 },
            left: { xs: 26, md: 64 },
            width: { xs: "1px", md: "calc(100% - 64px)" },
            height: { xs: "calc(100% - 28px)", md: "1px" },
          },
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            flexShrink: 0,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: "var(--pf-peach)",
            color: "secondary.main",
            fontFamily: "var(--font-heading), Georgia, serif",
            fontWeight: 600,
            fontSize: 20,
          }}
        >
          {step.icon ?? String(i + 1).padStart(2, "0")}
        </Box>
        <Box>
          <Typography variant="h6" component="h3" sx={{ mb: 0.5 }}>
            {step.title}
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 15, lineHeight: 1.6 }}>
            {step.text}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>
);

export default Timeline;
