import { createTheme } from "@mui/material/styles";

//* Design tokens (keep in sync with tailwind.config.ts and globals.css)
export const brand = {
  primary: "#1F8A70",
  primaryDark: "#176B57",
  primaryLight: "#E3F3EE",
  accent: "#FF7A59",
  accentDark: "#E8603F",
  sunshine: "#FFC857",
  ink: "#1B2A2F",
  slate: "#5B6B70",
  cream: "#FFF8F0",
  line: "#E8E2D9",
};

export const theme = createTheme({
  palette: {
    primary: {
      main: brand.primary,
      dark: brand.primaryDark,
      light: brand.primaryLight,
      contrastText: "#ffffff",
    },
    secondary: {
      main: brand.accent,
      dark: brand.accentDark,
      contrastText: "#ffffff",
    },
    warning: { main: "#E8A317" },
    error: { main: "#D64545" },
    success: { main: "#2E9E6B" },
    info: { main: "#2F7DD1" },
    text: { primary: brand.ink, secondary: brand.slate },
    background: { default: brand.cream, paper: "#ffffff" },
    divider: brand.line,
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "var(--font-inter), system-ui, sans-serif",
    h1: { fontFamily: "var(--font-heading), serif", fontWeight: 700 },
    h2: { fontFamily: "var(--font-heading), serif", fontWeight: 700 },
    h3: { fontFamily: "var(--font-heading), serif", fontWeight: 700 },
    h4: { fontFamily: "var(--font-heading), serif", fontWeight: 600 },
    h5: { fontFamily: "var(--font-heading), serif", fontWeight: 600 },
    h6: { fontFamily: "var(--font-heading), serif", fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: brand.cream } },
    },
    MuiButton: {
      defaultProps: {
        variant: "contained",
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          padding: "8px 24px", //* button padding set
          borderRadius: 999,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          color: brand.ink,
          borderBottom: `1px solid ${brand.line}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${brand.line}`,
          boxShadow: "none",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 10, backgroundColor: "#fff" } },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    //* default container set
    MuiContainer: {
      defaultProps: {
        maxWidth: "xl",
      },
    },
  },
});

theme.shadows[1] = "0px 6px 24px rgba(27, 42, 47, 0.08)";
