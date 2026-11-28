import type {} from "@mui/material/themeCssVarsAugmentation";
import { experimental_extendTheme as extendTheme } from "@mui/material/styles";

//* Design tokens (keep in sync with tailwind.config.ts and globals.css)
export const brand = {
  primary: "#148F98", // teal
  primaryDark: "#0E6F77",
  primaryLight: "#E2F3F4",
  accent: "#E8793A", // orange highlight
  accentDark: "#C9601F",
  rust: "#9A3A12",
  peach: "#FDEEE4",
  sunshine: "#FFC857",
  ink: "#1E1B18", // warm near-black: text and dark sections
  slate: "#6A625B", // warm grey: secondary text
  cream: "#FAF6F0", // page background
  sand: "#EADFD2", // dividers, soft card fills
  line: "#EADFD2",
};

//* Dark-mode counterparts (ink background, sand text)
const night = {
  primary: "#3BB8C2",
  primaryDark: "#2A98A1",
  primaryLight: "#173336",
  accent: "#F0925C",
  bg: "#171412",
  paper: "#211D1A",
  ink: "#F1E9DE",
  slate: "#ADA297",
  line: "#3A332D",
};

//* Corner radii (cards large, buttons pill)
export const radius = { card: 24, input: 14, chip: 999, button: 999 };

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

export const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: { main: brand.primary, dark: brand.primaryDark, light: brand.primaryLight, contrastText: "#ffffff" },
        secondary: { main: brand.accent, dark: brand.accentDark, contrastText: "#ffffff" },
        warning: { main: "#E8A317" },
        error: { main: "#D64545" },
        success: { main: "#2E9E6B" },
        info: { main: "#2F7DD1" },
        text: { primary: brand.ink, secondary: brand.slate },
        background: { default: brand.cream, paper: "#ffffff" },
        divider: brand.line,
      },
    },
    dark: {
      palette: {
        primary: { main: night.primary, dark: night.primaryDark, light: night.primaryLight, contrastText: "#111719" },
        secondary: { main: night.accent, dark: brand.accent, contrastText: "#111719" },
        warning: { main: "#F2B544" },
        error: { main: "#EF6B6B" },
        success: { main: "#4CC38A" },
        info: { main: "#5AA2F0" },
        text: { primary: night.ink, secondary: night.slate },
        background: { default: night.bg, paper: night.paper },
        divider: night.line,
      },
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "var(--font-body), system-ui, sans-serif",
    //* Fraunces reads heavy above 600; tighter tracking on display sizes
    h1: { fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.08 },
    h2: { fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.12 },
    h3: { fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600, letterSpacing: "-0.01em" },
    h4: { fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600 },
    h5: { fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600 },
    h6: { fontFamily: "var(--font-heading), Georgia, serif", fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 700 },
    overline: { fontWeight: 700, letterSpacing: "0.14em" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          backgroundColor: theme.vars.palette.background.default,
          transition: "background-color .3s ease, color .3s ease",
        },
      }),
    },
    MuiButton: {
      defaultProps: { variant: "contained", disableElevation: true },
      styleOverrides: {
        root: {
          padding: "8px 24px", //* button padding set
          borderRadius: radius.button,
          fontWeight: 700,
          transition: `transform .2s ${ease}, box-shadow .2s ${ease}, background-color .2s ease`,
          "&:hover": { transform: "translateY(-1px)" },
          "&:active": { transform: "translateY(0) scale(.98)" },
        },
        contained: {
          "&:hover": { boxShadow: "0 8px 20px -8px rgba(20, 143, 152, .55)" },
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: `rgba(${theme.vars.palette.background.defaultChannel} / 0.85)`,
          backdropFilter: "saturate(180%) blur(12px)",
          color: theme.vars.palette.text.primary,
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: radius.card,
          border: `1px solid ${theme.vars.palette.divider}`,
          boxShadow: "none",
          transition: `transform .25s ${ease}, box-shadow .25s ${ease}, border-color .25s ease`,
        }),
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: "none" } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({ borderRadius: radius.input, backgroundColor: theme.vars.palette.background.paper }),
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiIconButton: {
      styleOverrides: { root: { transition: `transform .2s ${ease}, background-color .2s ease` } },
    },
    //* default container set
    MuiContainer: { defaultProps: { maxWidth: "xl" } },
  },
});
