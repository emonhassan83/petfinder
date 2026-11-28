//* Mobile design tokens: soft coral on warm cream
export const colors = {
  primary: "#F7907C",
  primaryDark: "#E8735C",
  primaryLight: "#FFEDE9",
  accent: "#F7907C",
  sunshine: "#FFC857",
  ink: "#1E1B18",
  slate: "#8A8D99",
  cream: "#FAF6F0", // screen background
  sand: "#EADFD2", // dividers and soft fills
  line: "#EADFD2",
  white: "#FFFFFF",
  danger: "#E5534B",
  success: "#4CB782",
  warning: "#F2A93B",
  male: "#5AA9E6",
  female: "#F7907C",
};

//* "All she needs from you" tiles
export const needs = [
  { key: "Food", icon: "bone", bg: "#F5EEE8", fg: "#A07E66" },
  { key: "Water", icon: "water-outline", bg: "#E8F3FD", fg: "#5AA9E6" },
  { key: "Walk", icon: "tree-outline", bg: "#E6F7EE", fg: "#4CB782" },
  { key: "Love", icon: "heart-outline", bg: "#FFEDED", fg: "#F28C8C" },
] as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };

export const shadow = {
  shadowColor: "#1E1B18",
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
};

//* Font families (loaded in App.tsx). Headings: Fraunces 600; body/UI: Manrope.
export const fonts = {
  heading: "Fraunces_600SemiBold",
  headingItalic: "Fraunces_600SemiBold_Italic",
  body: "Manrope_400Regular",
  medium: "Manrope_500Medium",
  semibold: "Manrope_600SemiBold",
  bold: "Manrope_700Bold",
  extrabold: "Manrope_800ExtraBold",
};
