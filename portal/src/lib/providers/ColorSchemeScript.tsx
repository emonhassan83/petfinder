"use client";

import { getInitColorSchemeScript } from "@mui/material/styles";

//* Applies the saved/system colour scheme before paint to avoid a light flash
const ColorSchemeScript = () => getInitColorSchemeScript({ defaultMode: "system" });

export default ColorSchemeScript;
