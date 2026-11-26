"use client";

import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import Slide from "@mui/material/Slide";
import Navbar from "./Navbar";

interface Props {
  window?: () => Window;
  children?: any;
}

function HideOnScroll({ window, children }: Props) {
  const trigger = useScrollTrigger({ target: window ? window() : undefined });
  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

export default function ScrollNavbar(props: Props) {
  return (
    <>
      <HideOnScroll {...props}>
        <AppBar>
          <Navbar />
        </AppBar>
      </HideOnScroll>
      {/* Spacer for the fixed bar */}
      <Box sx={{ height: 72 }} />
    </>
  );
}
