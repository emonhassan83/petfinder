//* Mobile design tokens: soft coral on white
export const colors = {
  primary: "#F7907C",
  primaryDark: "#E8735C",
  primaryLight: "#FFEDE9",
  accent: "#F7907C",
  sunshine: "#FFC857",
  ink: "#2B2B33",
  slate: "#8A8D99",
  cream: "#F7F8FA", // screen background
  line: "#EEEFF3",
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
  shadowColor: "#2B2B33",
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
};
